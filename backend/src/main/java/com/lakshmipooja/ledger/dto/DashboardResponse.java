package com.lakshmipooja.ledger.dto;

import java.math.BigDecimal;

public record DashboardResponse(
    Integer year,
    BigDecimal openingBalance,
    BigDecimal totalDonations,
    BigDecimal totalExpenditure,
    BigDecimal availableBalance,
    long donationCount,
    long expenditureCount,
    boolean closed
) {}
