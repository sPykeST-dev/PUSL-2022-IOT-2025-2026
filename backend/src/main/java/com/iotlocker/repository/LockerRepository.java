package com.iotlocker.repository;

import com.iotlocker.model.Locker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LockerRepository extends JpaRepository<Locker, String> {
    List<Locker> findByStatus(Locker.Status status);
}
