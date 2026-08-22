package com.lakshmipooja.ledger.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pooja_year_ledger")
public class PoojaYearLedger {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Integer year;

    @Column(name = "opening_balance", nullable = false, precision = 14, scale = 2)
    private BigDecimal openingBalance = BigDecimal.ZERO;

    @Column(nullable = false)
    private boolean closed = false;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public Integer getYear() { return year; }
    public BigDecimal getOpeningBalance() { return openingBalance; }
    public boolean isClosed() { return closed; }
    public LocalDateTime getClosedAt() { return closedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setYear(Integer year) { this.year = year; }
    public void setOpeningBalance(BigDecimal openingBalance) { this.openingBalance = openingBalance; }
    public void setClosed(boolean closed) { this.closed = closed; }
    public void setClosedAt(LocalDateTime closedAt) { this.closedAt = closedAt; }
}
