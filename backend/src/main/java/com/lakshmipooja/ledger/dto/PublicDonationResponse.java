package com.lakshmipooja.ledger.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PublicDonationResponse(
    Long id,
    Integer year,
    String donorName,
    BigDecimal amount,
    LocalDate donationDate,
    String paymentMode,
    String paymentStatus
) {}
