package com.lakshmipooja.ledger.repository;

import com.lakshmipooja.ledger.entity.PoojaYearLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PoojaYearRepository extends JpaRepository<PoojaYearLedger, Long> {
    Optional<PoojaYearLedger> findByYear(Integer year);
    boolean existsByYear(Integer year);
    List<PoojaYearLedger> findAllByOrderByYearDesc();
}
