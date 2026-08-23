package com.lakshmipooja.ledger.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "donations")
public class Donation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "year_id", nullable = false)
    private PoojaYearLedger year;

    @Column(name = "donor_name", nullable = false, length = 150)
    private String donorName;

    @Column(name = "father_mother_name", length = 150)
    private String fatherMotherName;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "donation_date", nullable = false)
    private LocalDate donationDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_mode", nullable = false, length = 20)
    private PaymentMode paymentMode;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 20)
    private DonationStatus paymentStatus = DonationStatus.PAID;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Long getId() { return id; }
    public PoojaYearLedger getYear() { return year; }
    public String getDonorName() { return donorName; }
    public String getFatherMotherName() { return fatherMotherName; }
    public BigDecimal getAmount() { return amount; }
    public LocalDate getDonationDate() { return donationDate; }
    public PaymentMode getPaymentMode() { return paymentMode; }
    public DonationStatus getPaymentStatus() { return paymentStatus; }
    public String getNotes() { return notes; }

    public void setYear(PoojaYearLedger year) { this.year = year; }
    public void setDonorName(String donorName) { this.donorName = donorName; }
    public void setFatherMotherName(String fatherMotherName) { this.fatherMotherName = fatherMotherName; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public void setDonationDate(LocalDate donationDate) { this.donationDate = donationDate; }
    public void setPaymentMode(PaymentMode paymentMode) { this.paymentMode = paymentMode; }
    public void setPaymentStatus(DonationStatus paymentStatus) { this.paymentStatus = paymentStatus; }
    public void setNotes(String notes) { this.notes = notes; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
