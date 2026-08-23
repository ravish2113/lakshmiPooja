package com.lakshmipooja.ledger.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public record ExpenditureRequest(
    @NotBlank @Size(max = 200) String title,
    @NotBlank @Size(max = 80) String category,
    @NotNull @DecimalMin(value = "0.01") BigDecimal totalCost,
    @NotNull @DecimalMin(value = "0.00") BigDecimal paidAmount,
    @NotNull LocalDate expenseDate,
    @Size(max = 150) String vendor,
    @Size(max = 255) String receiptReference,
    String notes
) {}
