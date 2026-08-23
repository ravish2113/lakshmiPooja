package com.lakshmipooja.ledger.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DonationResponse(
    Long id,
    Integer year,
    String donorName,
    String fatherMotherName,
    BigDecimal amount,
    LocalDate donationDate,
    String paymentMode,
    String paymentStatus,
    String notes
) {}
