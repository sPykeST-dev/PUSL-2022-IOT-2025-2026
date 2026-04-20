package com.iotlocker.repository;

import com.iotlocker.model.UsageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UsageLogRepository extends JpaRepository<UsageLog, Long> {
    List<UsageLog> findByLockerIdOrderByTimestampDesc(String lockerId);
}
