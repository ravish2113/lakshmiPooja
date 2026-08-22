package com.lakshmipooja.ledger.service;

import com.lakshmipooja.ledger.dto.DashboardResponse;
import com.lakshmipooja.ledger.entity.PoojaYearLedger;
import com.lakshmipooja.ledger.repository.DonationRepository;
import com.lakshmipooja.ledger.repository.ExpenditureRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class DashboardService {
    private final YearService yearService;
    private final DonationRepository donations;
    private final ExpenditureRepository expenditures;

    public DashboardService(
        YearService yearService,
        DonationRepository donations,
        ExpenditureRepository expenditures
    ) {
        this.yearService = yearService;
        this.donations = donations;
        this.expenditures = expenditures;
    }

    public DashboardResponse getDashboard(Integer year) {
        PoojaYearLedger ledger = yearService.getByYear(year);

        BigDecimal donationTotal = donations.sumAmountByYear(year);
        BigDecimal expenditureTotal = expenditures.sumAmountByYear(year);

        BigDecimal balance = ledger.getOpeningBalance()
            .add(donationTotal)
            .subtract(expenditureTotal);

        return new DashboardResponse(
            year,
            ledger.getOpeningBalance(),
            donationTotal,
            expenditureTotal,
            balance,
            donations.countByYearYear(year),
            expenditures.countByYearYear(year),
            ledger.isClosed()
        );
    }
}
