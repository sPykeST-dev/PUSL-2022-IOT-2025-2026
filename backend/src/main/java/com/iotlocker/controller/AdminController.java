package com.iotlocker.controller;

import com.iotlocker.dto.*;
import com.iotlocker.service.AdminService;
import com.iotlocker.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final AnalyticsService analyticsService;

    public AdminController(AdminService adminService, AnalyticsService analyticsService) {
        this.adminService = adminService;
        this.analyticsService = analyticsService;
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

    @PostMapping("/locker/{lockerId}/scan")
    public ResponseEntity<Void> requestScan(@PathVariable String lockerId) {
        adminService.requestScan(lockerId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/locker/{lockerId}/scan-result")
    public ResponseEntity<?> getScanResult(@PathVariable String lockerId) {
        return adminService.getScanResult(lockerId)
                .map(uid -> ResponseEntity.ok(Map.of("cardUid", uid)))
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/analytics/usage-by-hour")
    public ResponseEntity<List<HourlyUsageDTO>> usageByHour() {
        return ResponseEntity.ok(analyticsService.usageByHour());
    }

    @GetMapping("/analytics/usage-by-day")
    public ResponseEntity<List<DailyUsageDTO>> usageByDay() {
        return ResponseEntity.ok(analyticsService.usageByDay());
    }

    @GetMapping("/analytics/occupancy-duration")
    public ResponseEntity<List<OccupancyDurationDTO>> occupancyDuration() {
        return ResponseEntity.ok(analyticsService.occupancyDuration());
    }

    @GetMapping("/analytics/top-users")
    public ResponseEntity<List<TopUserDTO>> topUsers() {
        return ResponseEntity.ok(analyticsService.topUsers());
    }

    @GetMapping("/analytics/long-occupancy")
    public ResponseEntity<List<LongOccupancyDTO>> longOccupancy(
            @RequestParam(defaultValue = "120") int thresholdMinutes) {
        return ResponseEntity.ok(analyticsService.longOccupancy(thresholdMinutes));
    }
}
