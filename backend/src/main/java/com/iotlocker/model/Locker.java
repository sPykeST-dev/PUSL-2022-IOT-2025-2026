package com.iotlocker.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.sql.Timestamp;

@Entity
@Table(name = "lockers")
@Getter
@Setter
@NoArgsConstructor
public class Locker {

    public enum Status {
        UNOCCUPIED, OCCUPIED, MAINTENANCE, OFFLINE
    }

    @Id
    @Column(name = "id", length = 20)
    private String id;

    @Column(length = 100)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Status status;

    @Column(name = "current_card_uid", length = 50)
    private String currentCardUid;

    @Column(name = "last_updated")
    private Timestamp lastUpdated;
}
