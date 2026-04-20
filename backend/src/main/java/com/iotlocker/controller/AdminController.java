package com.iotlocker.controller;

import com.iotlocker.dto.UsageLogDTO;
import com.iotlocker.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/locker/{lockerId}/logs")
    public ResponseEntity<List<UsageLogDTO>> getLogs(@PathVariable String lockerId) {
        return ResponseEntity.ok(adminService.getLogsForLocker(lockerId));
    }

    @PostMapping("/locker/{lockerId}/unlock")
    public ResponseEntity<Void> unlockLocker(@PathVariable String lockerId) {
        adminService.issueUnlock(lockerId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/locker/{lockerId}/maintenance")
    public ResponseEntity<Void> toggleMaintenance(@PathVariable String lockerId) {
        adminService.toggleMaintenance(lockerId);
        return ResponseEntity.ok().build();
    }
}
