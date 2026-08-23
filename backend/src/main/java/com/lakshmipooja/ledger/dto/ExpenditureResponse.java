package com.lakshmipooja.ledger.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ExpenditureResponse(
    Long id,
    Integer year,
    String title,
    String category,
    BigDecimal totalCost,
    BigDecimal paidAmount,
    BigDecimal leftAmount,
    LocalDate expenseDate,
    String vendor,
    String receiptReference,
    String notes
) {}
