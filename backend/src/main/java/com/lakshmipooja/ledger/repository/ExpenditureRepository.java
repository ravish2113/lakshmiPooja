package com.lakshmipooja.ledger.repository;

import com.lakshmipooja.ledger.entity.Expenditure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;
import java.util.List;

public interface ExpenditureRepository extends JpaRepository<Expenditure, Long> {
    @Query("select e from Expenditure e join fetch e.year y where y.year = :year order by e.expenseDate desc, e.id desc")
    List<Expenditure> findByYearYearOrderByExpenseDateDescIdDesc(Integer year);

    @Query("select coalesce(sum(e.amount), 0) from Expenditure e where e.year.year = :year")
    BigDecimal sumAmountByYear(Integer year);

    long countByYearYear(Integer year);
}
