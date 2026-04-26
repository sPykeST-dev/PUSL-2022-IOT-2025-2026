// =============================================================
//  SMART LOCKER CONTROLLER
//  Board:   ESP32-C3 DevKitM-1
//  RFID:    RC522 (SPI)
//  Display: 0.96" SSD1306 OLED 128x64 (I2C)
//  Lock:    Solenoid via IRF520 MOSFET on SOLENOID_PIN
//  Door:    BU0032 Micro Limit Switch (use NO terminal)
//
//  Copy secrets.h.example → secrets.h and fill credentials.
//  secrets.h is excluded from version control.
// =============================================================

#include "secrets.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <Wire.h>
#include <MFRC522.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// -------------------------------------------------------------
//  PIN DEFINITIONS
// -------------------------------------------------------------
#define RFID_SS_PIN    4    // RC522 SDA/SS
#define RFID_RST_PIN   3    // RC522 RST
#define SPI_SCK_PIN    6
#define SPI_MISO_PIN   5
#define SPI_MOSI_PIN   7

#define OLED_SDA_PIN   8    // Note: GPIO8 also drives onboard RGB LED (cosmetic only)
#define OLED_SCL_PIN   9

#define SOLENOID_PIN   10   // HIGH = unlock
#define DOOR_PIN       2    // LOW = door closed (NO terminal + INPUT_PULLUP)

// -------------------------------------------------------------
//  SETTINGS
// -------------------------------------------------------------
#define SOLENOID_UNLOCK_MS          3000    // max solenoid energise time
#define COMMAND_POLL_INTERVAL_MS    3000    // server poll cadence
#define HEARTBEAT_INTERVAL_MS      20000   // POST status to prevent backend OFFLINE (threshold 30 s)
#define WIFI_RECONNECT_INTERVAL_MS 30000   // retry WiFi if lost
#define SCAN_MODE_TIMEOUT_MS       70000   // scan mode auto-cancel

// Door monitoring timeouts (non-blocking)
#define DOOR_OPEN_WAIT_RETRIEVE_MS  30000  // time owner has to open door before giving up
#define DOOR_OPEN_WAIT_CLAIM_MS     90000  // time new user has to open door
#define DOOR_CLOSE_WAIT_MS          90000  // time door can stay open before forced resolution

#define OLED_WIDTH     128
#define OLED_HEIGHT    64
#define OLED_RESET     -1
#define OLED_I2C_ADDR  0x3C   // try 0x3D if blank

// -- Whitelist -------------------------------------------------
// false = any card unlocks a free locker (suitable for initial deployment
// where cards are registered via scan mode). true = restrict to ALLOWED_IDS.
#define WHITELIST_ENABLED  0   // 0 = any card works, 1 = restrict to ALLOWED_IDS

const byte ALLOWED_IDS[][4] = {
  { 0x00, 0x00, 0x00, 0x00 },   // replace with real UIDs
};
const int ALLOWED_COUNT = sizeof(ALLOWED_IDS) / sizeof(ALLOWED_IDS[0]);

// -------------------------------------------------------------
//  STATE MACHINE
// -------------------------------------------------------------
enum LockerState {
  STATE_UNOCCUPIED,
  STATE_DOOR_OPEN,
  STATE_OCCUPIED,
  STATE_MAINTENANCE
};

LockerState lockerState   = STATE_UNOCCUPIED;
String      occupiedByUID = "";

bool solenoidActive  = false;
bool scanModeActive  = false;
bool retrievingMode  = false;  // true = owner unlocking to retrieve, false = new user claiming
bool doorOpenedYet   = false;  // set once door physically swings open inside STATE_DOOR_OPEN

unsigned long solenoidTimer         = 0;
unsigned long lastCommandPoll       = 0;
unsigned long lastHeartbeat         = 0;
unsigned long lastWifiCheck         = 0;
unsigned long scanModeTimer         = 0;
unsigned long doorStateTimer        = 0;  // millis() when STATE_DOOR_OPEN was entered
unsigned long doorCloseTimer        = 0;  // millis() when door physically opened

// -------------------------------------------------------------
//  OBJECTS
// -------------------------------------------------------------
MFRC522          rfid(RFID_SS_PIN, RFID_RST_PIN);
Adafruit_SSD1306 display(OLED_WIDTH, OLED_HEIGHT, &Wire, OLED_RESET);

// =============================================================
//  HELPERS
// =============================================================

String uidToString(MFRC522::Uid &uid) {
  String result = "";
  for (byte i = 0; i < uid.size; i++) {
    if (uid.uidByte[i] < 0x10) result += "0";
    result += String(uid.uidByte[i], HEX);
    if (i < uid.size - 1) result += ":";
  }
  result.toUpperCase();
  return result;
}

bool isAllowed(MFRC522::Uid &uid) {
  if (!WHITELIST_ENABLED) return true;
  for (int i = 0; i < ALLOWED_COUNT; i++) {
    bool match = true;
    for (byte b = 0; b < 4; b++) {
      if (uid.uidByte[b] != ALLOWED_IDS[i][b]) { match = false; break; }
    }
    if (match) return true;
  }
  return false;
}

void unlockDoor() {
  digitalWrite(SOLENOID_PIN, HIGH);
  solenoidActive = true;
  solenoidTimer  = millis();
}

void lockDoor() {
  digitalWrite(SOLENOID_PIN, LOW);
  solenoidActive = false;
}

bool isDoorClosed() {
  return digitalRead(DOOR_PIN) == LOW;
}

// =============================================================
//  OLED DISPLAY
// =============================================================
void updateDisplay() {
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  if (scanModeActive) {
    display.setTextSize(2);
    display.setCursor(0, 0);
    display.println("SCAN");
    display.println("MODE");
    display.setTextSize(1);
    display.setCursor(0, 48);
    display.print("Tap card to register");
    display.display();
    return;
  }

  switch (lockerState) {

    case STATE_UNOCCUPIED:
      display.setTextSize(2);
      display.setCursor(0, 0);
      display.println("LOCKER");
      display.println("FREE");
      display.setTextSize(1);
      display.setCursor(0, 48);
      display.print("Scan card to use");
      break;

    case STATE_DOOR_OPEN:
      display.setTextSize(2);
      display.setCursor(0, 0);
      display.println("DOOR");
      display.println("OPEN");
      display.setTextSize(1);
      display.setCursor(0, 48);
      display.print(retrievingMode ? "Remove belongings" : "Place items inside");
      break;

    case STATE_OCCUPIED:
      display.setTextSize(2);
      display.setCursor(0, 0);
      display.println("IN USE");
      display.setTextSize(1);
      display.setCursor(0, 32);
      display.print("ID: ");
      display.print(occupiedByUID);
      display.setCursor(0, 48);
      display.print("Scan to retrieve");
      break;

    case STATE_MAINTENANCE:
      display.setTextSize(2);
      display.setCursor(0, 0);
      display.println("MAINTEN-");
      display.println("ANCE");
      display.setTextSize(1);
      display.setCursor(0, 48);
      display.print("Out of service");
      break;
  }

  display.display();
}

// =============================================================
//  STATUS REPORTING
// =============================================================
void sendStatus(const char* status, const char* cardUID) {
  Serial.println("----------------------------------------");
  Serial.print  ("STATUS : "); Serial.println(status);
  Serial.print  ("CARD   : "); Serial.println(cardUID[0] ? cardUID : "NONE");
  Serial.println("----------------------------------------");

  lastHeartbeat = millis();  // any successful or attempted POST resets heartbeat timer

  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  char url[128];
  snprintf(url, sizeof(url), "%s/api/locker/%s/status", SERVER_URL, LOCKER_ID);
  http.begin(url);
  http.setTimeout(2000);
  http.addHeader("Content-Type", "application/json");

  char payload[160];
  snprintf(payload, sizeof(payload),
           "{\"status\":\"%s\",\"cardUid\":\"%s\"}", status, cardUID);

  int code = http.POST(payload);
  if (code > 0) {
    Serial.print("HTTP "); Serial.println(code);
  } else {
    Serial.print("HTTP error: "); Serial.println(http.errorToString(code));
  }
  http.end();
}

// Convenience overload for String cardUID
void sendStatus(const char* status, String cardUID) {
  sendStatus(status, cardUID.c_str());
}

// =============================================================
//  HEARTBEAT — prevents backend auto-marking locker OFFLINE
// =============================================================
void sendHeartbeat() {
  if (millis() - lastHeartbeat < HEARTBEAT_INTERVAL_MS) return;
  const char* s = "UNOCCUPIED";
  switch (lockerState) {
    case STATE_OCCUPIED:    s = "OCCUPIED";    break;
    case STATE_DOOR_OPEN:   s = "DOOR_OPEN";   break;
    case STATE_MAINTENANCE: s = "MAINTENANCE"; break;
    default: break;
  }
  sendStatus(s, occupiedByUID);
}

// =============================================================
//  WIFI
// =============================================================
void initWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(500);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected. IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\nWiFi FAILED — running offline.");
  }
}

void maintainWiFi() {
  if (millis() - lastWifiCheck < WIFI_RECONNECT_INTERVAL_MS) return;
  lastWifiCheck = millis();
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi lost — reconnecting...");
    WiFi.disconnect();
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  }
}

// =============================================================
//  ENTER DOOR-OPEN STATE
//  Single function for all unlock paths to keep state consistent.
// =============================================================
void enterDoorOpen(bool retrieving) {
  retrievingMode = retrieving;
  doorOpenedYet  = false;
  doorStateTimer = millis();
  doorCloseTimer = 0;
  lockerState    = STATE_DOOR_OPEN;
  unlockDoor();
  updateDisplay();
  sendStatus("DOOR_OPEN", occupiedByUID);
}

// =============================================================
//  COMMAND POLLING
// =============================================================
void pollCommand() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  char url[128];
  snprintf(url, sizeof(url), "%s/api/locker/%s/command", SERVER_URL, LOCKER_ID);
  http.begin(url);
  http.setTimeout(2000);
  int code = http.GET();

  if (code == 200) {
    String body = http.getString();

    if (body.indexOf("\"hasCommand\":true") >= 0) {
      Serial.println("Command received: " + body);

      if (body.indexOf("\"SCAN\"") >= 0) {
        // Only activate scan mode when door is not already in motion
        if (lockerState != STATE_DOOR_OPEN) {
          Serial.println("Scan mode activated — tap a card.");
          scanModeActive = true;
          scanModeTimer  = millis();
          updateDisplay();
        }

      } else if (body.indexOf("\"UNLOCK\"") >= 0) {
        Serial.println("Remote UNLOCK.");
        // Guard: door must be physically closed before firing solenoid
        if ((lockerState == STATE_OCCUPIED || lockerState == STATE_UNOCCUPIED)
            && isDoorClosed()) {
          enterDoorOpen(lockerState == STATE_OCCUPIED);
        }

      } else if (body.indexOf("\"MAINTENANCE_ON\"") >= 0) {
        Serial.println("Remote MAINTENANCE_ON.");
        lockerState   = STATE_MAINTENANCE;
        occupiedByUID = "";
        lockDoor();
        updateDisplay();
        sendStatus("MAINTENANCE", "");

      } else if (body.indexOf("\"MAINTENANCE_OFF\"") >= 0) {
        Serial.println("Remote MAINTENANCE_OFF.");
        if (lockerState == STATE_MAINTENANCE) {
          lockerState = STATE_UNOCCUPIED;
          updateDisplay();
          sendStatus("UNOCCUPIED", "");
        }
      }

      // Acknowledge command so backend won't resend it
      int idIdx = body.indexOf("\"commandId\":");
      if (idIdx >= 0) {
        String after = body.substring(idIdx + 12);
        after.trim();
        // commandId is a number or "null" — only ACK if numeric
        if (after.charAt(0) != 'n') {
          long cmdId = after.toInt();
          if (cmdId > 0) {
            HTTPClient ack;
            char ackUrl[192];
            snprintf(ackUrl, sizeof(ackUrl), "%s/api/locker/%s/command/%ld/executed",
                     SERVER_URL, LOCKER_ID, cmdId);
            ack.begin(ackUrl);
            ack.setTimeout(2000);
            ack.addHeader("Content-Type", "application/json");
            ack.POST("");
            ack.end();
          }
        }
      }
    }
  }
  http.end();
}

// =============================================================
//  SETUP
// =============================================================
void setup() {
  Serial.begin(115200);
  unsigned long serialWait = millis();
  while (!Serial && millis() - serialWait < 3000);
  delay(100);
  Serial.println("\n=== SMART LOCKER BOOTING ===");

#if !WHITELIST_ENABLED
  Serial.println("WARNING: WHITELIST_ENABLED=0 — any card can claim a free locker.");
#endif

  // GPIO
  pinMode(SOLENOID_PIN, OUTPUT);
  digitalWrite(SOLENOID_PIN, LOW);
  pinMode(DOOR_PIN, INPUT_PULLUP);

  // SPI + RFID
  SPI.begin(SPI_SCK_PIN, SPI_MISO_PIN, SPI_MOSI_PIN, RFID_SS_PIN);
  rfid.PCD_Init();
  Serial.println("RC522 ready.");

  // I2C + OLED
  Wire.begin(OLED_SDA_PIN, OLED_SCL_PIN);
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_I2C_ADDR)) {
    Serial.println("ERROR: OLED not found — check wiring and I2C address.");
  } else {
    Serial.println("OLED ready.");
  }

  // Network + initial status
  initWiFi();
  updateDisplay();
  sendStatus("UNOCCUPIED", "");
  Serial.println("Ready. Serial: M = toggle maintenance mode.");
}

// =============================================================
//  MAIN LOOP
// =============================================================
void loop() {

  // ── WiFi watchdog ───────────────────────────────────────────
  maintainWiFi();

  // ── Poll server every 3 s ───────────────────────────────────
  if (millis() - lastCommandPoll >= COMMAND_POLL_INTERVAL_MS) {
    lastCommandPoll = millis();
    pollCommand();
  }

  // ── Heartbeat: keeps backend from marking locker OFFLINE ────
  sendHeartbeat();

  // ── Serial command: M = toggle maintenance ──────────────────
  if (Serial.available()) {
    char cmd = Serial.read();
    if (cmd == 'M' || cmd == 'm') {
      if (lockerState == STATE_MAINTENANCE) {
        lockerState = STATE_UNOCCUPIED;
        sendStatus("UNOCCUPIED", "");
      } else {
        lockerState   = STATE_MAINTENANCE;
        occupiedByUID = "";
        lockDoor();
        sendStatus("MAINTENANCE", "");
      }
      updateDisplay();
    }
  }

  // ── Maintenance: block all further activity ──────────────────
  if (lockerState == STATE_MAINTENANCE) return;

  // ── Solenoid auto-cutoff (safety) ───────────────────────────
  if (solenoidActive && millis() - solenoidTimer > SOLENOID_UNLOCK_MS) {
    lockDoor();
  }

  // ── STATE_DOOR_OPEN: non-blocking door monitoring ────────────
  //
  //  Phase 1 — waiting for door to physically swing open:
  //    • retrieve mode: 30 s timeout → restore OCCUPIED (owner changed mind)
  //    • claim mode:    90 s timeout → restore UNOCCUPIED (user walked away)
  //
  //  Phase 2 — door is open, waiting for it to close:
  //    • 90 s timeout → force-resolve based on mode
  //
  if (lockerState == STATE_DOOR_OPEN) {
    if (!doorOpenedYet) {
      if (!isDoorClosed()) {
        // Door physically swung open — start close timer
        doorOpenedYet  = true;
        doorCloseTimer = millis();
      } else {
        unsigned long waitLimit = retrievingMode
                                ? DOOR_OPEN_WAIT_RETRIEVE_MS
                                : DOOR_OPEN_WAIT_CLAIM_MS;
        if (millis() - doorStateTimer > waitLimit) {
          lockDoor();
          if (retrievingMode) {
            lockerState = STATE_OCCUPIED;
            updateDisplay();
            sendStatus("OCCUPIED", occupiedByUID);
          } else {
            lockerState   = STATE_UNOCCUPIED;
            occupiedByUID = "";
            updateDisplay();
            sendStatus("UNOCCUPIED", "");
          }
        }
      }
    } else {
      if (isDoorClosed()) {
        // Door closed — finalise transition
        lockDoor();
        if (retrievingMode) {
          lockerState   = STATE_UNOCCUPIED;
          occupiedByUID = "";
          updateDisplay();
          sendStatus("UNOCCUPIED", "");
        } else {
          lockerState = STATE_OCCUPIED;
          updateDisplay();
          sendStatus("OCCUPIED", occupiedByUID);
        }
      } else if (millis() - doorCloseTimer > DOOR_CLOSE_WAIT_MS) {
        // Door left open too long — force resolution
        lockDoor();
        if (retrievingMode) {
          lockerState   = STATE_UNOCCUPIED;
          occupiedByUID = "";
          sendStatus("UNOCCUPIED", "");
        } else {
          lockerState = STATE_OCCUPIED;
          sendStatus("OCCUPIED", occupiedByUID);
        }
        updateDisplay();
      }
    }
    return;  // no RFID scanning while door is in motion
  }

  // ── Scan mode timeout ────────────────────────────────────────
  if (scanModeActive && millis() - scanModeTimer > SCAN_MODE_TIMEOUT_MS) {
    scanModeActive = false;
    Serial.println("Scan mode timed out.");
    updateDisplay();
  }

  // ── Poll RFID ────────────────────────────────────────────────
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return;

  String scannedUID = uidToString(rfid.uid);
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  Serial.print("Card scanned: "); Serial.println(scannedUID);

  // ── Scan mode: report UID, no state change ───────────────────
  if (scanModeActive) {
    Serial.println("Reporting scan result to server.");
    sendStatus("SCAN_RESULT", scannedUID);
    scanModeActive = false;
    updateDisplay();
    return;
  }

  // ── Normal state transitions ─────────────────────────────────
  switch (lockerState) {

    case STATE_UNOCCUPIED:
      if (!isAllowed(rfid.uid)) {
        Serial.println("Card not authorised.");
        break;
      }
      occupiedByUID = scannedUID;
      enterDoorOpen(false);  // claiming a free locker
      break;

    case STATE_DOOR_OPEN:
      // Handled above; shouldn't reach here
      Serial.println("Door already in motion — ignoring scan.");
      break;

    case STATE_OCCUPIED:
      if (scannedUID != occupiedByUID) {
        Serial.println("Wrong card. Owner: " + occupiedByUID);
        break;
      }
      enterDoorOpen(true);  // owner retrieving belongings
      break;

    default:
      break;
  }
}
