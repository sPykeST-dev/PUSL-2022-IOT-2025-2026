package com.iotlocker.repository;

import com.iotlocker.model.RfidCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RfidCardRepository extends JpaRepository<RfidCard, Long> {
    boolean existsByUid(String uid);
    Optional<RfidCard> findByUid(String uid);
}