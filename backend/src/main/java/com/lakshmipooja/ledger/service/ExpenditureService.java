package com.lakshmipooja.ledger.service;

import com.lakshmipooja.ledger.dto.*;
import com.lakshmipooja.ledger.entity.Expenditure;
import com.lakshmipooja.ledger.entity.PoojaYearLedger;
import com.lakshmipooja.ledger.exception.BusinessException;
import com.lakshmipooja.ledger.exception.ResourceNotFoundException;
import com.lakshmipooja.ledger.repository.ExpenditureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ExpenditureService {
    private final ExpenditureRepository expenditures;
    private final YearService yearService;

    public ExpenditureService(
        ExpenditureRepository expenditures,
        YearService yearService
    ) {
        this.expenditures = expenditures;
        this.yearService = yearService;
    }

    @Transactional(readOnly = true)
    public List<ExpenditureResponse> findByYear(Integer year) {
        yearService.getByYear(year);
        return expenditures.findByYearYearOrderByExpenseDateDescIdDesc(year)
            .stream().map(this::toResponse).toList();
    }

    @Transactional
    public ExpenditureResponse create(Integer year, ExpenditureRequest request) {
        PoojaYearLedger ledger = yearService.getByYear(year);
        ensureOpen(ledger);

        Expenditure e = new Expenditure();
        apply(e, request);
        e.setYear(ledger);

        return toResponse(expenditures.save(e));
    }

    @Transactional
    public ExpenditureResponse update(Long id, ExpenditureRequest request) {
        Expenditure e = expenditures.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Expenditure not found."));
        ensureOpen(e.getYear());
        apply(e, request);
        e.setUpdatedAt(LocalDateTime.now());
        return toResponse(expenditures.save(e));
    }

    @Transactional
    public void delete(Long id) {
        Expenditure e = expenditures.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Expenditure not found."));
        ensureOpen(e.getYear());
        expenditures.delete(e);
    }

    private void apply(Expenditure e, ExpenditureRequest r) {
        e.setTitle(r.title());
        e.setCategory(r.category());
        e.setAmount(r.amount());
        e.setExpenseDate(r.expenseDate());
        e.setVendor(r.vendor());
        e.setReceiptReference(r.receiptReference());
        e.setNotes(r.notes());
    }

    private void ensureOpen(PoojaYearLedger y) {
        if (y.isClosed()) {
            throw new BusinessException("Year " + y.getYear() + " is closed and read-only.");
        }
    }

    private ExpenditureResponse toResponse(Expenditure e) {
        return new ExpenditureResponse(
            e.getId(), e.getYear().getYear(), e.getTitle(), e.getCategory(),
            e.getAmount(), e.getExpenseDate(), e.getVendor(),
            e.getReceiptReference(), e.getNotes()
        );
    }
}
