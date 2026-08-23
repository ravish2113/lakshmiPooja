package com.lakshmipooja.ledger.repository;

import com.lakshmipooja.ledger.entity.Donation;
import com.lakshmipooja.ledger.entity.DonationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;
import java.util.List;

public interface DonationRepository extends JpaRepository<Donation, Long> {
    @Query("select d from Donation d join fetch d.year y where y.year = :year order by d.donationDate desc, d.id desc")
    List<Donation> findByYearYearOrderByDonationDateDescIdDesc(Integer year);

    @Query("select coalesce(sum(d.amount), 0) from Donation d where d.year.year = :year")
    BigDecimal sumAmountByYear(Integer year);

    @Query("select coalesce(sum(d.amount), 0) from Donation d where d.year.year = :year and d.paymentStatus = :status")
    BigDecimal sumAmountByYearAndStatus(Integer year, DonationStatus status);

    long countByYearYear(Integer year);
    long countByYearYearAndPaymentStatus(Integer year, DonationStatus status);
}
