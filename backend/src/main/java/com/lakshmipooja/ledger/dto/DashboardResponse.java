package com.lakshmipooja.ledger.dto;

import java.math.BigDecimal;

public record DashboardResponse(
    Integer year,
    BigDecimal openingBalance,
    BigDecimal totalDonations,
    BigDecimal paidDonations,
    BigDecimal unpaidDonations,
    BigDecimal totalExpenditure,
    BigDecimal paidExpenditure,
    BigDecimal unpaidExpenditure,
    BigDecimal availableBalance,
    long donationCount,
    long expenditureCount,
    boolean closed
) {}
