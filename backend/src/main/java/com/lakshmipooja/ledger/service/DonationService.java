package com.lakshmipooja.ledger.service;

import com.lakshmipooja.ledger.dto.*;
import com.lakshmipooja.ledger.entity.Donation;
import com.lakshmipooja.ledger.entity.PoojaYearLedger;
import com.lakshmipooja.ledger.exception.BusinessException;
import com.lakshmipooja.ledger.exception.ResourceNotFoundException;
import com.lakshmipooja.ledger.repository.DonationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DonationService {
    private final DonationRepository donations;
    private final YearService yearService;

    public DonationService(DonationRepository donations, YearService yearService) {
        this.donations = donations;
        this.yearService = yearService;
    }

    @Transactional(readOnly = true)
    public List<DonationResponse> findByYear(Integer year) {
        yearService.getByYear(year);
        return donations.findByYearYearOrderByDonationDateDescIdDesc(year)
            .stream().map(this::toResponse).toList();
    }

    @Transactional
    public DonationResponse create(Integer year, DonationRequest request) {
        PoojaYearLedger ledger = yearService.getByYear(year);
        ensureOpen(ledger);

        Donation d = new Donation();
        apply(d, request);
        d.setYear(ledger);

        return toResponse(donations.save(d));
    }

    @Transactional
    public DonationResponse update(Long id, DonationRequest request) {
        Donation d = donations.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Donation not found."));
        ensureOpen(d.getYear());
        apply(d, request);
        d.setUpdatedAt(LocalDateTime.now());
        return toResponse(donations.save(d));
    }

    @Transactional
    public void delete(Long id) {
        Donation d = donations.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Donation not found."));
        ensureOpen(d.getYear());
        donations.delete(d);
    }

    private void apply(Donation d, DonationRequest r) {
        d.setDonorName(r.donorName());
        d.setFlatDetails(r.flatDetails());
        d.setAmount(r.amount());
        d.setDonationDate(r.donationDate());
        d.setPaymentMode(r.paymentMode());
        d.setNotes(r.notes());
    }

    private void ensureOpen(PoojaYearLedger y) {
        if (y.isClosed()) {
            throw new BusinessException("Year " + y.getYear() + " is closed and read-only.");
        }
    }

    private DonationResponse toResponse(Donation d) {
        return new DonationResponse(
            d.getId(), d.getYear().getYear(), d.getDonorName(),
            d.getFlatDetails(), d.getAmount(), d.getDonationDate(),
            d.getPaymentMode().name(), d.getNotes()
        );
    }
}
