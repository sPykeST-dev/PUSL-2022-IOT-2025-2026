package com.iotlocker.controller;

import com.iotlocker.dto.CommandResponse;
import com.iotlocker.dto.LockerStatusRequest;
import com.iotlocker.model.Locker;
import com.iotlocker.service.LockerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class LockerController {

    private final LockerService lockerService;

    public LockerController(LockerService lockerService) {
        this.lockerService = lockerService;
    }

    @GetMapping("/api/lockers")
    public ResponseEntity<List<Locker>> getAllLockers() {
        return ResponseEntity.ok(lockerService.getAllLockers());
    }

    @GetMapping("/api/locker/{id}")
    public ResponseEntity<Locker> getLocker(@PathVariable String id) {
        return ResponseEntity.ok(lockerService.getLockerById(id));
    }

    @PostMapping("/api/locker/{id}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable String id,
                                             @RequestBody LockerStatusRequest request) {
        lockerService.updateLockerStatus(id, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/api/locker/{id}/command")
    public ResponseEntity<CommandResponse> pollCommand(@PathVariable String id) {
        return ResponseEntity.ok(lockerService.pollCommand(id));
    }

    @PostMapping("/api/locker/{id}/command/{commandId}/executed")
    public ResponseEntity<Void> markExecuted(@PathVariable String id,
                                             @PathVariable Long commandId) {
        lockerService.markCommandExecuted(commandId);
        return ResponseEntity.ok().build();
    }
}
