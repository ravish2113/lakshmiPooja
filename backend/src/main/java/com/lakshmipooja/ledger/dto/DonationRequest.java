package com.lakshmipooja.ledger.dto;

import com.lakshmipooja.ledger.entity.DonationStatus;
import com.lakshmipooja.ledger.entity.PaymentMode;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public record DonationRequest(
    @NotBlank @Size(max = 150) String donorName,
    @Size(max = 150) String fatherMotherName,
    @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
    @NotNull LocalDate donationDate,
    @NotNull PaymentMode paymentMode,
    @NotNull DonationStatus paymentStatus,
    String notes
) {}
