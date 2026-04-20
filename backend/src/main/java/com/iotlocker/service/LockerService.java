package com.iotlocker.service;

import com.iotlocker.dto.CommandResponse;
import com.iotlocker.dto.LockerStatusRequest;
import com.iotlocker.model.Locker;
import com.iotlocker.model.PendingCommand;
import com.iotlocker.model.UsageLog;
import com.iotlocker.repository.LockerRepository;
import com.iotlocker.repository.PendingCommandRepository;
import com.iotlocker.repository.RfidCardRepository;
import com.iotlocker.repository.UsageLogRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Service
public class LockerService {

    private final LockerRepository lockerRepository;
    private final UsageLogRepository usageLogRepository;
    private final PendingCommandRepository pendingCommandRepository;
    private final RfidCardRepository rfidCardRepository;
    private final ScanService scanService;

    public LockerService(LockerRepository lockerRepository,
                         UsageLogRepository usageLogRepository,
                         PendingCommandRepository pendingCommandRepository,
                         RfidCardRepository rfidCardRepository,
                         ScanService scanService) {
        this.lockerRepository = lockerRepository;
        this.usageLogRepository = usageLogRepository;
        this.pendingCommandRepository = pendingCommandRepository;
        this.rfidCardRepository = rfidCardRepository;
        this.scanService = scanService;
    }

    public List<Locker> getAllLockers() {
        List<Locker> lockers = lockerRepository.findAll();
        Timestamp cutoff = new Timestamp(System.currentTimeMillis() - 30_000L);
        for (Locker locker : lockers) {
            if (locker.getStatus() != Locker.Status.MAINTENANCE
                    && (locker.getLastUpdated() == null || locker.getLastUpdated().before(cutoff))) {
                locker.setStatus(Locker.Status.OFFLINE);
            }
        }
        return lockers;
    }

    public Locker getLockerById(String id) {
        Locker locker = lockerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Locker not found: " + id));
        Timestamp cutoff = new Timestamp(System.currentTimeMillis() - 30_000L);
        if (locker.getStatus() != Locker.Status.MAINTENANCE
                && (locker.getLastUpdated() == null || locker.getLastUpdated().before(cutoff))) {
            locker.setStatus(Locker.Status.OFFLINE);
        }
        return locker;
    }

    @Transactional
    public void updateLockerStatus(String lockerId, LockerStatusRequest req) {
        if ("SCAN_RESULT".equalsIgnoreCase(req.getStatus())) {
            if (req.getCardUid() != null && !req.getCardUid().isEmpty()) {
                scanService.storeScanResult(lockerId, req.getCardUid());
            }
            return;
        }

        Locker locker = getLockerById(lockerId);

        Locker.Status newStatus = mapFirmwareStatus(req.getStatus());
        locker.setStatus(newStatus);
        locker.setCurrentCardUid(req.getCardUid() != null && !req.getCardUid().isEmpty() ? req.getCardUid() : null);
        locker.setLastUpdated(new Timestamp(System.currentTimeMillis()));
        lockerRepository.save(locker);

        UsageLog log = new UsageLog();
        log.setLockerId(lockerId);
        log.setCardUid(req.getCardUid());
        log.setEvent(mapStatusToEvent(req.getStatus()));
        log.setTimestamp(new Timestamp(System.currentTimeMillis()));

        if (req.getCardUid() != null && !req.getCardUid().isEmpty()) {
            rfidCardRepository.findByUid(req.getCardUid())
                    .ifPresent(card -> log.setStudentId(card.getStudent().getId()));
        }

        usageLogRepository.save(log);
    }

    public CommandResponse pollCommand(String lockerId) {
        Optional<PendingCommand> cmd =
                pendingCommandRepository.findFirstByLockerIdAndExecutedAtIsNullOrderByCreatedAtAsc(lockerId);
        if (cmd.isPresent()) {
            return new CommandResponse(true, cmd.get().getCommand().name(), cmd.get().getId());
        }
        if (scanService.hasPendingScan(lockerId)) {
            return new CommandResponse(true, "SCAN", null);
        }
        return new CommandResponse(false, null, null);
    }

    @Transactional
    public void markCommandExecuted(Long commandId) {
        pendingCommandRepository.findById(commandId).ifPresent(cmd -> {
            cmd.setExecutedAt(new Timestamp(System.currentTimeMillis()));
            pendingCommandRepository.save(cmd);
        });
    }

    // Maps firmware status string to DB enum. DOOR_OPEN has no DB equivalent — store as OCCUPIED.
    private Locker.Status mapFirmwareStatus(String status) {
        return switch (status.toUpperCase()) {
            case "OCCUPIED", "DOOR_OPEN" -> Locker.Status.OCCUPIED;
            case "MAINTENANCE"           -> Locker.Status.MAINTENANCE;
            case "OFFLINE"               -> Locker.Status.OFFLINE;
            default                      -> Locker.Status.UNOCCUPIED;
        };
    }

    private UsageLog.Event mapStatusToEvent(String status) {
        return switch (status.toUpperCase()) {
            case "OCCUPIED"              -> UsageLog.Event.LOCKED;
            case "DOOR_OPEN"             -> UsageLog.Event.UNLOCKED;
            case "MAINTENANCE"           -> UsageLog.Event.MAINTENANCE_ON;
            default                      -> UsageLog.Event.UNLOCKED;
        };
    }
}
