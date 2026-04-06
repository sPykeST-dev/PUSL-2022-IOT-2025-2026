package com.iotlocker.controller;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @PostMapping("/unlock")
    public String unlockLocker() {
        return "Unlock command sent";
    }

    @PostMapping("/maintenance")
    public String maintenanceMode() {
        return "Maintenance toggled";
    }

    @GetMapping("/logs")
    public String getLogs() {
        return "Logs data";
    }
}