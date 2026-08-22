package com.lakshmipooja.ledger.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record YearResponse(
    Long id,
    Integer year,
    BigDecimal openingBalance,
    boolean closed,
    LocalDateTime closedAt
) {}
