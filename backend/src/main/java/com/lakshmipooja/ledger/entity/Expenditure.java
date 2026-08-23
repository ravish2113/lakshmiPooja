package com.lakshmipooja.ledger.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "expenditures")
public class Expenditure {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "year_id", nullable = false)
    private PoojaYearLedger year;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 80)
    private String category;

    @Column(name = "total_cost", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalCost;

    @Column(name = "paid_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "expense_date", nullable = false)
    private LocalDate expenseDate;

    @Column(length = 150)
    private String vendor;

    @Column(name = "receipt_reference", length = 255)
    private String receiptReference;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Long getId() { return id; }
    public PoojaYearLedger getYear() { return year; }
    public String getTitle() { return title; }
    public String getCategory() { return category; }
    public BigDecimal getTotalCost() { return totalCost; }
    public BigDecimal getPaidAmount() { return paidAmount; }
    public BigDecimal getLeftAmount() { return totalCost.subtract(paidAmount); }
    public LocalDate getExpenseDate() { return expenseDate; }
    public String getVendor() { return vendor; }
    public String getReceiptReference() { return receiptReference; }
    public String getNotes() { return notes; }

    public void setYear(PoojaYearLedger year) { this.year = year; }
    public void setTitle(String title) { this.title = title; }
    public void setCategory(String category) { this.category = category; }
    public void setTotalCost(BigDecimal totalCost) { this.totalCost = totalCost; }
    public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; }
    public void setExpenseDate(LocalDate expenseDate) { this.expenseDate = expenseDate; }
    public void setVendor(String vendor) { this.vendor = vendor; }
    public void setReceiptReference(String receiptReference) { this.receiptReference = receiptReference; }
    public void setNotes(String notes) { this.notes = notes; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
