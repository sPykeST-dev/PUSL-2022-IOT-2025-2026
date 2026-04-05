package com.iotlocker.repository;

import com.iotlocker.model.RfidCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RfidCardRepository extends JpaRepository<RfidCard, Long> {
    boolean existsByUid(String uid);
}