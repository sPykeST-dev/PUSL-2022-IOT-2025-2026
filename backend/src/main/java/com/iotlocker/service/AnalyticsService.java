package com.iotlocker.service;

import com.iotlocker.dto.*;
import com.iotlocker.model.Locker;
import com.iotlocker.model.UsageLog;
import com.iotlocker.repository.LockerRepository;
import com.iotlocker.repository.UsageLogRepository;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private static final String[] DAY_NAMES = {"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"};
    // Mon-Sun display order (MySQL DAYOFWEEK: 1=Sun … 7=Sat)
    private static final int[] DAY_ORDER = {2, 3, 4, 5, 6, 7, 1};

    private final UsageLogRepository usageLogRepository;
    private final LockerRepository lockerRepository;

    public AnalyticsService(UsageLogRepository usageLogRepository, LockerRepository lockerRepository) {
        this.usageLogRepository = usageLogRepository;
        this.lockerRepository = lockerRepository;
    }

    public List<HourlyUsageDTO> usageByHour() {
        Map<Integer, Long> byHour = usageLogRepository.countByHour().stream()
                .collect(Collectors.toMap(
                        r -> ((Number) r[0]).intValue(),
                        r -> ((Number) r[1]).longValue()
                ));
        List<HourlyUsageDTO> result = new ArrayList<>();
        for (int h = 0; h < 24; h++) {
            result.add(new HourlyUsageDTO(h, byHour.getOrDefault(h, 0L)));
        }
        return result;
    }

    public List<DailyUsageDTO> usageByDay() {
        Map<Integer, Long> byDow = usageLogRepository.countByDayOfWeek().stream()
                .collect(Collectors.toMap(
                        r -> ((Number) r[0]).intValue(),
                        r -> ((Number) r[1]).longValue()
                ));
        List<DailyUsageDTO> result = new ArrayList<>();
        for (int dow : DAY_ORDER) {
            result.add(new DailyUsageDTO(DAY_NAMES[dow - 1], byDow.getOrDefault(dow, 0L)));
        }
        return result;
    }

    public List<OccupancyDurationDTO> occupancyDuration() {
        return lockerRepository.findAll().stream().map(locker -> {
            List<UsageLog> logs = usageLogRepository.findByLockerIdOrderByTimestampAsc(locker.getId());
            List<Long> durations = new ArrayList<>();
            Long lockedAt = null;
            for (UsageLog log : logs) {
                if (log.getEvent() == UsageLog.Event.LOCKED) {
                    lockedAt = log.getTimestamp().getTime();
                } else if (log.getEvent() == UsageLog.Event.UNLOCKED && lockedAt != null) {
                    long ms = log.getTimestamp().getTime() - lockedAt;
                    if (ms > 0) durations.add(ms);
                    lockedAt = null;
                }
            }
            double avgMinutes = durations.isEmpty() ? 0.0
                    : durations.stream().mapToLong(Long::longValue).average().orElse(0.0) / 60_000.0;
            return new OccupancyDurationDTO(locker.getId(), locker.getLocation(),
                    Math.round(avgMinutes * 10.0) / 10.0);
        }).collect(Collectors.toList());
    }

    public List<TopUserDTO> topUsers() {
        return usageLogRepository.topUsers().stream()
                .map(r -> new TopUserDTO((String) r[0], (String) r[1], ((Number) r[2]).longValue()))
                .collect(Collectors.toList());
    }

    public List<LongOccupancyDTO> longOccupancy(int thresholdMinutes) {
        long cutoffMs = System.currentTimeMillis() - (long) thresholdMinutes * 60_000L;
        return lockerRepository.findByStatus(Locker.Status.OCCUPIED).stream()
                .filter(l -> l.getLastUpdated() != null && l.getLastUpdated().getTime() < cutoffMs)
                .map(l -> new LongOccupancyDTO(l.getId(), l.getLocation(),
                        (System.currentTimeMillis() - l.getLastUpdated().getTime()) / 60_000L))
                .sorted(Comparator.comparingLong(LongOccupancyDTO::getMinutesOccupied).reversed())
                .collect(Collectors.toList());
    }
}
