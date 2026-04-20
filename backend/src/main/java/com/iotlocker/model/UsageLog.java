package com.iotlocker.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.sql.Timestamp;

@Entity
@Table(name = "usage_logs")
@Getter
@Setter
@NoArgsConstructor
public class UsageLog {

    public enum Event {
        LOCKED, UNLOCKED, MAINTENANCE_ON, MAINTENANCE_OFF, REMOTE_UNLOCK
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "locker_id", length = 20)
    private String lockerId;

    @Column(name = "card_uid", length = 50)
    private String cardUid;

    @Column(name = "student_id")
    private Long studentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event", length = 20)
    private Event event;

    @Column(name = "timestamp")
    private Timestamp timestamp;
}
