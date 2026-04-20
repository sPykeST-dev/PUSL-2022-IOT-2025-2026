package com.iotlocker.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.sql.Timestamp;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UsageLogDTO {
    private Long id;
    private String event;
    private String cardUid;
    private String studentName;
    private Timestamp timestamp;
}
