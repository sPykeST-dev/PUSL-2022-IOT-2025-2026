package com.iotlocker.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LockerStatusRequest {
    private String status;
    private String cardUid;
}
