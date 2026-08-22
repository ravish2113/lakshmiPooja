package com.lakshmipooja.ledger.service;

import com.lakshmipooja.ledger.dto.YearResponse;
import com.lakshmipooja.ledger.entity.PoojaYearLedger;
import com.lakshmipooja.ledger.exception.BusinessException;
import com.lakshmipooja.ledger.exception.ResourceNotFoundException;
import com.lakshmipooja.ledger.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class YearService {
    private final PoojaYearRepository years;
    private final DonationRepository donations;
    private final ExpenditureRepository expenditures;

    public YearService(
        PoojaYearRepository years,
        DonationRepository donations,
        ExpenditureRepository expenditures
    ) {
        this.years = years;
        this.donations = donations;
        this.expenditures = expenditures;
    }

    public List<YearResponse> getYears() {
        return years.findAllByOrderByYearDesc().stream().map(this::toResponse).toList();
    }

    public PoojaYearLedger getByYear(Integer year) {
        return years.findByYear(year)
            .orElseThrow(() -> new ResourceNotFoundException("Year " + year + " not found."));
    }

    @Transactional
    public YearResponse createYear(Integer year, BigDecimal openingBalance) {
        if (years.existsByYear(year)) {
            throw new BusinessException("Year " + year + " already exists.");
        }
        PoojaYearLedger ledger = new PoojaYearLedger();
        ledger.setYear(year);
        ledger.setOpeningBalance(openingBalance == null ? BigDecimal.ZERO : openingBalance);
        return toResponse(years.save(ledger));
    }

    @Transactional
    public YearResponse closeYear(Integer year) {
        PoojaYearLedger current = getByYear(year);

        if (current.isClosed()) {
            throw new BusinessException("Year " + year + " is already closed.");
        }

        BigDecimal donationTotal = donations.sumAmountByYear(year);
        BigDecimal expenditureTotal = expenditures.sumAmountByYear(year);

        BigDecimal balance = current.getOpeningBalance()
            .add(donationTotal)
            .subtract(expenditureTotal);

        if (balance.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException(
                "Cannot close year because available balance is negative: ₹" + balance
            );
        }

        current.setClosed(true);
        current.setClosedAt(LocalDateTime.now());
        years.save(current);

        int nextYear = year + 1;

        if (!years.existsByYear(nextYear)) {
            PoojaYearLedger next = new PoojaYearLedger();
            next.setYear(nextYear);
            next.setOpeningBalance(balance);
            years.save(next);
        } else {
            PoojaYearLedger next = getByYear(nextYear);
            if (next.isClosed()) {
                throw new BusinessException("Cannot close " + year + " because " + nextYear + " is already closed.");
            }

            long nextDonations = donations.countByYearYear(nextYear);
            long nextExpenditures = expenditures.countByYearYear(nextYear);
            if (nextDonations > 0 || nextExpenditures > 0) {
                throw new BusinessException(
                    "Cannot close " + year + " because " + nextYear +
                    " already contains transactions. Remove those transactions first or close years in order."
                );
            }

            next.setOpeningBalance(balance);
            years.save(next);
        }

        return toResponse(current);
    }

    private YearResponse toResponse(PoojaYearLedger y) {
        return new YearResponse(
            y.getId(),
            y.getYear(),
            y.getOpeningBalance(),
            y.isClosed(),
            y.getClosedAt()
        );
    }
}
