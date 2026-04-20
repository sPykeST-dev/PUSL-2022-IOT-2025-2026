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

    public LockerService(LockerRepository lockerRepository,
                         UsageLogRepository usageLogRepository,
                         PendingCommandRepository pendingCommandRepository,
                         RfidCardRepository rfidCardRepository) {
        this.lockerRepository = lockerRepository;
        this.usageLogRepository = usageLogRepository;
        this.pendingCommandRepository = pendingCommandRepository;
        this.rfidCardRepository = rfidCardRepository;
    }

    public List<Locker> getAllLockers() {
        return lockerRepository.findAll();
    }

    public Locker getLockerById(String id) {
        return lockerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Locker not found: " + id));
    }

    @Transactional
    public void updateLockerStatus(String lockerId, LockerStatusRequest req) {
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
        return cmd.map(c -> new CommandResponse(true, c.getCommand().name(), c.getId()))
                  .orElse(new CommandResponse(false, null, null));
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
