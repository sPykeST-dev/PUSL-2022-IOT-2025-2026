package com.iotlocker.service;

import com.iotlocker.dto.UsageLogDTO;
import com.iotlocker.model.Locker;
import com.iotlocker.model.PendingCommand;
import com.iotlocker.model.UsageLog;
import com.iotlocker.repository.LockerRepository;
import com.iotlocker.repository.PendingCommandRepository;
import com.iotlocker.repository.StudentRepository;
import com.iotlocker.repository.UsageLogRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final LockerRepository lockerRepository;
    private final UsageLogRepository usageLogRepository;
    private final PendingCommandRepository pendingCommandRepository;
    private final StudentRepository studentRepository;

    public AdminService(LockerRepository lockerRepository,
                        UsageLogRepository usageLogRepository,
                        PendingCommandRepository pendingCommandRepository,
                        StudentRepository studentRepository) {
        this.lockerRepository = lockerRepository;
        this.usageLogRepository = usageLogRepository;
        this.pendingCommandRepository = pendingCommandRepository;
        this.studentRepository = studentRepository;
    }

    public List<UsageLogDTO> getLogsForLocker(String lockerId) {
        return usageLogRepository.findByLockerIdOrderByTimestampDesc(lockerId)
                .stream()
                .map(log -> {
                    String studentName = null;
                    if (log.getStudentId() != null) {
                        studentName = studentRepository.findById(log.getStudentId())
                                .map(s -> s.getName())
                                .orElse(null);
                    }
                    return new UsageLogDTO(
                            log.getId(),
                            log.getEvent() != null ? log.getEvent().name() : null,
                            log.getCardUid(),
                            studentName,
                            log.getTimestamp()
                    );
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void issueUnlock(String lockerId) {
        lockerRepository.findById(lockerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Locker not found: " + lockerId));

        PendingCommand cmd = new PendingCommand();
        cmd.setLockerId(lockerId);
        cmd.setCommand(PendingCommand.Command.UNLOCK);
        cmd.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        pendingCommandRepository.save(cmd);

        logEvent(lockerId, UsageLog.Event.REMOTE_UNLOCK, null, null);
    }

    @Transactional
    public void toggleMaintenance(String lockerId) {
        Locker locker = lockerRepository.findById(lockerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Locker not found: " + lockerId));

        PendingCommand cmd = new PendingCommand();
        cmd.setLockerId(lockerId);
        cmd.setCreatedAt(new Timestamp(System.currentTimeMillis()));

        if (locker.getStatus() == Locker.Status.MAINTENANCE) {
            cmd.setCommand(PendingCommand.Command.MAINTENANCE_OFF);
            locker.setStatus(Locker.Status.UNOCCUPIED);
            logEvent(lockerId, UsageLog.Event.MAINTENANCE_OFF, null, null);
        } else {
            cmd.setCommand(PendingCommand.Command.MAINTENANCE_ON);
            locker.setStatus(Locker.Status.MAINTENANCE);
            logEvent(lockerId, UsageLog.Event.MAINTENANCE_ON, null, null);
        }

        pendingCommandRepository.save(cmd);
        locker.setLastUpdated(new Timestamp(System.currentTimeMillis()));
        lockerRepository.save(locker);
    }

    private void logEvent(String lockerId, UsageLog.Event event, String cardUid, Long studentId) {
        UsageLog log = new UsageLog();
        log.setLockerId(lockerId);
        log.setEvent(event);
        log.setCardUid(cardUid);
        log.setStudentId(studentId);
        log.setTimestamp(new Timestamp(System.currentTimeMillis()));
        usageLogRepository.save(log);
    }
}
