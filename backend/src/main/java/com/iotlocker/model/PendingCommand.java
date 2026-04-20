package com.iotlocker.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.sql.Timestamp;

@Entity
@Table(name = "pending_commands")
@Getter
@Setter
@NoArgsConstructor
public class PendingCommand {

    public enum Command {
        UNLOCK, MAINTENANCE_ON, MAINTENANCE_OFF
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "locker_id", length = 20)
    private String lockerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "command", length = 20)
    private Command command;

    @Column(name = "created_at")
    private Timestamp createdAt;

    @Column(name = "executed_at")
    private Timestamp executedAt;
}
