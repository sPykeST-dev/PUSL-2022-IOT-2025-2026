const char* WIFI_SSID     = "your-network-name";
const char* WIFI_PASSWORD = "your-password";
// =============================================================
//  SMART LOCKER CONTROLLER
//  Board:   ESP32-C3 DevKitM-1
//  RFID:    RC522 (SPI)
//  Display: 0.96" SSD1306 OLED 128x64 (I2C)
//  Lock:    Solenoid (via relay/transistor on SOLENOID_PIN)
//  Door:    BU0032 Micro Limit Switch
//
//  STATUS OUTPUT: Serial Monitor (Arduino IDE)
//  FUTURE:        Swap sendStatus() for WiFi/HTTP call
// =============================================================

#include <SPI.h>
#include <Wire.h>
#include <MFRC522.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// -------------------------------------------------------------
//  PIN DEFINITIONS  (adjust if your wiring differs)
// -------------------------------------------------------------
// RC522 RFID — SPI bus
#define RFID_SS_PIN    4    // SDA/SS
#define RFID_RST_PIN   3    // RST
#define SPI_SCK_PIN    6
#define SPI_MISO_PIN   5
#define SPI_MOSI_PIN   7

// OLED — I2C bus
#define OLED_SDA_PIN   8
#define OLED_SCL_PIN   9

// Hardware
#define SOLENOID_PIN   10   // HIGH = unlock, LOW = lock
#define DOOR_PIN       2    // LOW = door closed (switch pulls low), HIGH = open

// -------------------------------------------------------------
//  SETTINGS
// -------------------------------------------------------------
#define SOLENOID_UNLOCK_MS   3000   // How long to hold solenoid open (ms)
#define OLED_WIDTH           128
#define OLED_HEIGHT          64
#define OLED_RESET           -1     // No reset pin
#define OLED_I2C_ADDR        0x3C   // Most common; try 0x3D if blank

// -- Whitelist toggle ------------------------------------------
// Set to true and populate ALLOWED_IDs[] to restrict access.
// Set to false to allow ANY card (useful for early testing).
#define WHITELIST_ENABLED  false

// Add your authorised card UIDs here (hex bytes, space-separated).
// Example: { 0xDE, 0xAD, 0xBE, 0xEF }
const byte ALLOWED_IDS[][4] = {
  { 0x00, 0x00, 0x00, 0x00 },   // <-- Replace with real card UIDs
};
const int ALLOWED_COUNT = sizeof(ALLOWED_IDS) / sizeof(ALLOWED_IDS[0]);

// -------------------------------------------------------------
//  LOCKER STATE MACHINE
// -------------------------------------------------------------
enum LockerState {
  STATE_UNOCCUPIED,   // Locked, idle, waiting for any card
  STATE_DOOR_OPEN,    // Card scanned → solenoid fired → waiting for door close
  STATE_OCCUPIED,     // Door closed with belongings inside, only owner can exit
  STATE_MAINTENANCE   // Out of service  (triggered via Serial command 'M')
};

LockerState lockerState = STATE_UNOCCUPIED;

String  occupiedByUID  = "";   // UID string of the card that locked the locker
bool    solenoidActive = false;
unsigned long solenoidTimer = 0;

// -------------------------------------------------------------
//  OBJECTS
// -------------------------------------------------------------
MFRC522          rfid(RFID_SS_PIN, RFID_RST_PIN);
Adafruit_SSD1306 display(OLED_WIDTH, OLED_HEIGHT, &Wire, OLED_RESET);

// =============================================================
//  HELPERS
// =============================================================

/** Convert RFID UID bytes to a readable hex string e.g. "A1:B2:C3:D4" */
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

/** Check if a scanned UID is on the whitelist */
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

/** Fire the solenoid to pop the door open */
void unlockDoor() {
  digitalWrite(SOLENOID_PIN, HIGH);
  solenoidActive  = true;
  solenoidTimer   = millis();
}

/** De-energise the solenoid (lock engages mechanically on door close) */
void lockDoor() {
  digitalWrite(SOLENOID_PIN, LOW);
  solenoidActive = false;
}

/** true if the limit switch says the door is physically closed */
bool isDoorClosed() {
  return digitalRead(DOOR_PIN) == LOW;
}

// =============================================================
//  STATUS REPORTING
//  All output goes through sendStatus() so you can later replace
//  the Serial.println() calls with a WiFi/HTTP POST in one place.
// =============================================================
void sendStatus(String status, String cardUID) {
  // ── Serial output (Arduino IDE Serial Monitor) ──
  Serial.println("----------------------------------------");
  Serial.print  ("STATUS : "); Serial.println(status);
  Serial.print  ("CARD   : "); Serial.println(cardUID.length() ? cardUID : "NONE");
  Serial.println("----------------------------------------");

  // ── TODO: Future web integration ─────────────────────────────
  // Replace the block below with your HTTP POST / MQTT publish.
  // Example (uncomment and configure WiFi credentials first):
  //
  //   if (WiFi.status() == WL_CONNECTED) {
  //     HTTPClient http;
  //     http.begin("http://your-server/api/locker");
  //     http.addHeader("Content-Type", "application/json");
  //     String payload = "{\"status\":\"" + status + "\",\"card\":\"" + cardUID + "\"}";
  //     http.POST(payload);
  //     http.end();
  //   }
}

// =============================================================
//  OLED DISPLAY
// =============================================================
void updateDisplay() {
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

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
      display.print("Close door when done");
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
//  SETUP
// =============================================================
void setup() {
  Serial.begin(115200);
  unsigned long serialWait = millis();
  while (!Serial && millis() - serialWait < 3000);
  delay(100);
  Serial.println("\n=== SMART LOCKER BOOTING ===");

  // GPIO
  pinMode(SOLENOID_PIN, OUTPUT);
  digitalWrite(SOLENOID_PIN, LOW);   // Ensure locked on boot
  pinMode(DOOR_PIN, INPUT_PULLUP);   // Limit switch: GND when pressed (closed)

  // SPI + RFID
  SPI.begin(SPI_SCK_PIN, SPI_MISO_PIN, SPI_MOSI_PIN, RFID_SS_PIN);
  rfid.PCD_Init();
  Serial.println("RC522 RFID ready.");

  // I2C + OLED
  Wire.begin(OLED_SDA_PIN, OLED_SCL_PIN);
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_I2C_ADDR)) {
    Serial.println("ERROR: OLED not found! Check wiring & I2C address.");
  } else {
    Serial.println("OLED ready.");
  }

  updateDisplay();
  sendStatus("UNOCCUPIED", "");
  Serial.println("Type 'M' + Enter in Serial Monitor to toggle maintenance mode.");
}

// =============================================================
//  MAIN LOOP
// =============================================================
void loop() {

  // ── Serial command: toggle maintenance ──────────────────────
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

  // ── Do nothing extra while in maintenance ───────────────────
  if (lockerState == STATE_MAINTENANCE) return;

  // ── Solenoid auto-cut-off (safety: don't hold solenoid forever) ──
  if (solenoidActive && (millis() - solenoidTimer > SOLENOID_UNLOCK_MS)) {
    lockDoor();
  }

  // ── Door close detection while door is open ─────────────────
  if (lockerState == STATE_DOOR_OPEN && isDoorClosed()) {
    lockDoor();
    lockerState = STATE_OCCUPIED;
    updateDisplay();
    sendStatus("OCCUPIED", occupiedByUID);
    delay(500);  // debounce
    return;
  }

  // ── Poll for RFID card ──────────────────────────────────────
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return;

  String scannedUID = uidToString(rfid.uid);
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  Serial.print("Card scanned: "); Serial.println(scannedUID);

  // ── State transitions on card scan ──────────────────────────
  switch (lockerState) {

    case STATE_UNOCCUPIED:
      // Any card (or whitelisted card) can claim a free locker
      if (!isAllowed(rfid.uid)) {
        Serial.println("Card NOT authorised.");
        break;
      }
      occupiedByUID = scannedUID;
      lockerState   = STATE_DOOR_OPEN;
      unlockDoor();
      updateDisplay();
      sendStatus("DOOR_OPEN", scannedUID);
      break;

    case STATE_DOOR_OPEN:
      // Ignore scans while door is already open
      Serial.println("Door already open — please close it first.");
      break;

    case STATE_OCCUPIED:
      // Only the card that locked the locker can open it
      if (scannedUID != occupiedByUID) {
        Serial.println("Wrong card — this locker belongs to: " + occupiedByUID);
        break;
      }
      lockerState = STATE_DOOR_OPEN;
      unlockDoor();
      occupiedByUID = scannedUID;  // keep owner until door closes & reopens
      updateDisplay();
      sendStatus("DOOR_OPEN", scannedUID);

      // Wait for user to remove belongings and close door
      {
        unsigned long waitStart = millis();
        // Give the user up to 30 s to open the door after the solenoid fires
        while (millis() - waitStart < 30000) {
          if (!isDoorClosed()) break;   // door opened — good
          delay(100);
        }
        // Now wait for door to close again → locker becomes unoccupied
        waitStart = millis();
        while (millis() - waitStart < 60000) {
          if (isDoorClosed()) {
            lockDoor();
            lockerState   = STATE_UNOCCUPIED;
            occupiedByUID = "";
            updateDisplay();
            sendStatus("UNOCCUPIED", "");
            break;
          }
          delay(100);
        }
        // If door never closed within 60 s, fall back to DOOR_OPEN
        if (lockerState == STATE_DOOR_OPEN) {
          updateDisplay();
        }
      }
      break;

    default:
      break;
  }
}
