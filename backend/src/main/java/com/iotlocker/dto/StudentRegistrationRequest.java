package com.iotlocker.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StudentRegistrationRequest {
    private String studentNumber;
    private String name;
    private String email;
    private String cardUid;
}