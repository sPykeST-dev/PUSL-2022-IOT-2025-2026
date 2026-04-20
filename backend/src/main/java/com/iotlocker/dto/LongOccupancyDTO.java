package com.iotlocker.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LongOccupancyDTO {
    private String lockerId;
    private String location;
    private long minutesOccupied;
}
