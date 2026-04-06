create database iot;
use iot;

CREATE TABLE lockers (
    id VARCHAR(20) PRIMARY KEY,
    location VARCHAR(100),
    status ENUM('UNOCCUPIED', 'OCCUPIED', 'MAINTENANCE'),
    current_card_uid VARCHAR(50),
    last_updated TIMESTAMP
);

CREATE TABLE students (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_number VARCHAR(20) UNIQUE,
    name VARCHAR(100),
    email VARCHAR(150),
    created_at TIMESTAMP
);

CREATE TABLE rfid_cards (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(50) UNIQUE,
    student_id BIGINT,
    registered_at TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id)
);
CREATE TABLE usage_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    locker_id VARCHAR(20),
    card_uid VARCHAR(50),
    student_id BIGINT,
    event ENUM('LOCKED', 'UNLOCKED', 'MAINTENANCE_ON', 'MAINTENANCE_OFF', 'REMOTE_UNLOCK'),
    timestamp TIMESTAMP,
    FOREIGN KEY (locker_id) REFERENCES lockers(id),
    FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE pending_commands (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    locker_id VARCHAR(20),
    command ENUM('MAINTENANCE_ON', 'MAINTENANCE_OFF', 'UNLOCK'),
    created_at TIMESTAMP,
    executed_at TIMESTAMP NULL,
    FOREIGN KEY (locker_id) REFERENCES lockers(id)
);

CREATE TABLE admins (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255)
);
INSERT INTO lockers (id, location, status, last_updated)
VALUES ('LOCKER-01', 'Engineering Lab', 'UNOCCUPIED', NOW());

INSERT INTO students (student_number, name, email, created_at)
VALUES ('31600', 'John Doe', 'john@example.com', NOW());

INSERT INTO rfid_cards (uid, student_id, registered_at)
VALUES ('A1:B2:C3:D4', 1, NOW());

SELECT * FROM lockers;
SELECT * FROM students;
SELECT * FROM rfid_cards;

INSERT INTO admins (username, password_hash)
VALUES ('admin', '$2a$10$examplehashedpassword1234567890');


INSERT INTO pending_commands (locker_id, command, created_at)
VALUES ('LOCKER-01', 'MAINTENANCE_ON', NOW());


INSERT INTO usage_logs (locker_id, card_uid, student_id, event, timestamp)
VALUES ('LOCKER-01', 'A1:B2:C3:D4', 1, 'LOCKED', NOW());