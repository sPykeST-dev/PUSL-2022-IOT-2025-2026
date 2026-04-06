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
INSERT INTO lockers (id, location, status, last_updated)
VALUES ('LOCKER-01', 'Engineering Lab', 'UNOCCUPIED', NOW());

INSERT INTO students (student_number, name, email, created_at)
VALUES ('31600', 'John Doe', 'john@example.com', NOW());

INSERT INTO rfid_cards (uid, student_id, registered_at)
VALUES ('A1:B2:C3:D4', 1, NOW());

SELECT * FROM lockers;
SELECT * FROM students;
SELECT * FROM rfid_cards;
