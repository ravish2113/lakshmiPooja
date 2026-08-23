package com.lakshmipooja.ledger.service;

import com.lakshmipooja.ledger.dto.DashboardResponse;
import com.lakshmipooja.ledger.entity.DonationStatus;
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

    public DashboardService(YearService yearService, DonationRepository donations, ExpenditureRepository expenditures) {
        this.yearService = yearService;
        this.donations = donations;
        this.expenditures = expenditures;
    }

    public DashboardResponse getDashboard(Integer year) {
        PoojaYearLedger ledger = yearService.getByYear(year);

        BigDecimal donationTotal = donations.sumAmountByYear(year);
        BigDecimal donationPaid = donations.sumAmountByYearAndStatus(year, DonationStatus.PAID);
        BigDecimal donationUnpaid = donationTotal.subtract(donationPaid);

        BigDecimal expenditureTotal = expenditures.sumTotalCostByYear(year);
        BigDecimal expenditurePaid = expenditures.sumPaidAmountByYear(year);
        BigDecimal expenditureUnpaid = expenditureTotal.subtract(expenditurePaid);

        // Cash balance reflects only money actually received and actually paid.
        BigDecimal balance = ledger.getOpeningBalance()
            .add(donationPaid)
            .subtract(expenditurePaid);

        return new DashboardResponse(
            year,
            ledger.getOpeningBalance(),
            donationTotal,
            donationPaid,
            donationUnpaid,
            expenditureTotal,
            expenditurePaid,
            expenditureUnpaid,
            balance,
            donations.countByYearYear(year),
            expenditures.countByYearYear(year),
            ledger.isClosed()
        );
    }
}
