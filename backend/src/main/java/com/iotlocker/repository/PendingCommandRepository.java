package com.iotlocker.repository;

import com.iotlocker.model.PendingCommand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PendingCommandRepository extends JpaRepository<PendingCommand, Long> {
    Optional<PendingCommand> findFirstByLockerIdAndExecutedAtIsNullOrderByCreatedAtAsc(String lockerId);
}
