package com.iotlocker.repository;

import com.iotlocker.model.UsageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UsageLogRepository extends JpaRepository<UsageLog, Long> {
    List<UsageLog> findByLockerIdOrderByTimestampDesc(String lockerId);
    List<UsageLog> findByLockerIdOrderByTimestampAsc(String lockerId);

    @Query(value = "SELECT HOUR(timestamp), COUNT(*) FROM usage_logs GROUP BY HOUR(timestamp) ORDER BY HOUR(timestamp)", nativeQuery = true)
    List<Object[]> countByHour();

    @Query(value = "SELECT DAYOFWEEK(timestamp), COUNT(*) FROM usage_logs GROUP BY DAYOFWEEK(timestamp) ORDER BY DAYOFWEEK(timestamp)", nativeQuery = true)
    List<Object[]> countByDayOfWeek();

    @Query(value = "SELECT s.name, s.student_number, COUNT(ul.id) FROM usage_logs ul JOIN rfid_cards rc ON ul.card_uid = rc.uid JOIN students s ON rc.student_id = s.id GROUP BY s.id, s.name, s.student_number ORDER BY COUNT(ul.id) DESC LIMIT 10", nativeQuery = true)
    List<Object[]> topUsers();
}
