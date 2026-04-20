package com.iotlocker.service;

import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ScanService {

    private static final long SCAN_TIMEOUT_MS = 60_000L;

    private final ConcurrentHashMap<String, Long>   pendingScans = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> scanResults  = new ConcurrentHashMap<>();

    public void requestScan(String lockerId) {
        pendingScans.put(lockerId, System.currentTimeMillis());
        scanResults.remove(lockerId);
    }

    public boolean hasPendingScan(String lockerId) {
        Long requestedAt = pendingScans.get(lockerId);
        if (requestedAt == null) return false;
        if (System.currentTimeMillis() - requestedAt > SCAN_TIMEOUT_MS) {
            pendingScans.remove(lockerId);
            return false;
        }
        return true;
    }

    public void storeScanResult(String lockerId, String uid) {
        scanResults.put(lockerId, uid);
        pendingScans.remove(lockerId);
    }

    public Optional<String> consumeScanResult(String lockerId) {
        return Optional.ofNullable(scanResults.remove(lockerId));
    }
}
