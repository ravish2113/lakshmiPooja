package com.lakshmipooja.ledger.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DonationResponse(
    Long id,
    Integer year,
    String donorName,
    String flatDetails,
    BigDecimal amount,
    LocalDate donationDate,
    String paymentMode,
    String notes
) {}
