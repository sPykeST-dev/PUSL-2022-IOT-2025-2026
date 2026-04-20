# IoT Smart Locker System

A web-connected smart locker system built for NSBM Green University. Students access their locker using an RFID card. All state changes are reported in real time to a web backend, which serves a live public dashboard and a secured admin panel with controls, student registration, usage logs, and analytics.

---

## System Overview

```
ESP32-C3 Locker  ──HTTP──►  Spring Boot API  ──JPA──►  MySQL
                 ◄──poll──                   ◄──REST──  React Frontend (Nginx)
```

- **Firmware:** ESP32-C3 with RC522 RFID reader, SSD1306 OLED, door limit switch, and 12V solenoid lock
- **Backend:** Spring Boot 3.2 REST API with JWT authentication
- **Frontend:** React 18 + Tailwind CSS, served via Nginx
- **Database:** MySQL 8 with a fixed schema (no ORM migrations)
- **Deployment:** Docker Compose (three containers: db, backend, frontend)

---

## Quick Start

### Prerequisites
- Docker and Docker Compose
- MySQL 8 (or use the Docker container)

### 1. Start the stack

```bash
docker compose up --build -d
```

The first run loads `database/schema.sql` automatically. The stack takes ~60 seconds to be fully ready on a cold start.

Open **http://localhost:3000** for the public dashboard.

### 2. Admin login

Default credentials (change after first login):

| Username | Password |
|----------|----------|
| `admin` | `password` |

Navigate to **http://localhost:3000/admin/login**.

To update the admin password, generate a BCrypt hash and run:

```sql
UPDATE iot_locker.admins
SET password_hash = '<your-bcrypt-hash>'
WHERE username = 'admin';
```

---

## Firmware Setup

The firmware is in `firmware/locker_controller/locker_controller.ino`.

### 1. Create secrets file

Copy the example and fill in your values:

```bash
cp firmware/secrets.h.example firmware/secrets.h
```

```cpp
// firmware/secrets.h
#define WIFI_SSID     "your-network"
#define WIFI_PASSWORD "your-password"
#define SERVER_URL    "http://192.168.x.x:8080"  // your machine's IP on the shared network
#define LOCKER_ID     "LOCKER-01"
```

> `secrets.h` is gitignored — never commit it.

### 2. Flash

Open `locker_controller.ino` in Arduino IDE with the following board settings:

| Setting | Value |
|---------|-------|
| Board | ESP32C3 Dev Module |
| Flash Size | 4MB (32Mb) |
| Partition Scheme | Default 4MB with spiffs |
| USB CDC On Boot | Enabled |
| Upload Speed | 921600 |

### Required Arduino Libraries

- `MFRC522` by GithubCommunity
- `Adafruit SSD1306`
- `Adafruit GFX Library`

---

## Hardware

### Components

| Component | Model |
|-----------|-------|
| Microcontroller | ESP32-C3 DevKitM-1 |
| RFID Reader | RC522 (MFRC522, SPI) |
| Display | 0.96" SSD1306 OLED (I2C) |
| Door Sensor | BU0032 Micro Limit Switch |
| Lock | 12V Solenoid |
| MOSFET Driver | IRF520 Module |
| Voltage Reg. | LM2596 Buck Converter (set to 5V) |
| Protection | 1N4007 Flyback Diode |
| Power | 12V Battery |

### Pin Assignments

| Component | ESP32-C3 Pin |
|-----------|-------------|
| RC522 SCK | GPIO 6 |
| RC522 MISO | GPIO 5 |
| RC522 MOSI | GPIO 7 |
| RC522 SDA (SS) | GPIO 4 |
| RC522 RST | GPIO 3 |
| OLED SDA | GPIO 8 |
| OLED SCL | GPIO 9 |
| Solenoid (IRF520 SIG) | GPIO 10 |
| Door switch (NC) | GPIO 2 |

---

## Project Structure

```
├── backend/          Spring Boot API (Java 17, Maven)
├── database/         schema.sql — loaded on first DB container start
├── firmware/         ESP32-C3 Arduino sketch + secrets.h.example
├── frontend/         React + Vite app, served via Nginx
└── docker-compose.yml
```

---

## API Reference

### Public (no auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lockers` | All lockers with current status |
| GET | `/api/locker/{id}` | Single locker |

### Firmware-facing (no auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/locker/{id}/status` | Report state change + card UID |
| GET | `/api/locker/{id}/command` | Poll for pending commands |
| POST | `/api/locker/{id}/command/{commandId}/executed` | Acknowledge command |

### Admin (Bearer JWT required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Get JWT token |
| POST | `/api/admin/locker/{id}/unlock` | Remote emergency unlock |
| POST | `/api/admin/locker/{id}/maintenance` | Toggle maintenance mode |
| POST | `/api/admin/locker/{id}/scan` | Initiate RFID scan mode |
| GET | `/api/admin/locker/{id}/scan-result` | Poll for scanned card UID |
| GET | `/api/admin/locker/{id}/logs` | Usage event history |
| GET | `/api/admin/students` | List students |
| POST | `/api/admin/students` | Register student + RFID card |
| DELETE | `/api/admin/students/{id}` | Remove student |
| GET | `/api/admin/analytics/usage-by-hour` | Events grouped by hour of day |
| GET | `/api/admin/analytics/usage-by-day` | Events grouped by day of week |
| GET | `/api/admin/analytics/occupancy-duration` | Avg session duration per locker |
| GET | `/api/admin/analytics/top-users` | Students ranked by usage count |
| GET | `/api/admin/analytics/long-occupancy` | Lockers held beyond threshold (default 120 min) |

---

## Frontend Pages

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Live locker status dashboard |
| `/admin/login` | Public | Admin login |
| `/admin` | Admin | Overview — all lockers + counts |
| `/admin/locker/:id` | Admin | Per-locker controls + usage log |
| `/admin/students` | Admin | Student list |
| `/admin/students/new` | Admin | Register student + RFID card |
| `/admin/analytics` | Admin | Usage analytics and insights |

---

## Database Schema

Six tables: `lockers`, `students`, `rfid_cards`, `usage_logs`, `pending_commands`, `admins`.

Schema is defined in `database/schema.sql` and loaded once on the first container start. Spring Boot is set to `ddl-auto=validate` — it verifies the schema on startup but never modifies it.

---

## Network Setup (Firmware ↔ Server)

The ESP32 and the machine running the backend must be on the same network.

1. Connect both your laptop and the ESP32 to the same WiFi network (or mobile hotspot)
2. Find your laptop's IP on that network (`ifconfig` on Mac/Linux, `ipconfig` on Windows)
3. Set `SERVER_URL` in `secrets.h` to `http://<your-ip>:8080`

---

## Module

PUSL-2022 Internet of Things — NSBM Green University (2025/2026)
Lecturer: Isuru Sri Bandara
