package com.lakshmipooja.ledger.controller;

import com.lakshmipooja.ledger.dto.*;
import com.lakshmipooja.ledger.service.ExpenditureService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ExpenditureController {
    private final ExpenditureService service;

    public ExpenditureController(ExpenditureService service) {
        this.service = service;
    }

    @GetMapping("/years/{year}/expenditures")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public List<ExpenditureResponse> list(@PathVariable Integer year) {
        return service.findByYear(year);
    }

    @PostMapping("/years/{year}/expenditures")
    @PreAuthorize("hasRole('ADMIN')")
    public ExpenditureResponse create(
        @PathVariable Integer year,
        @Valid @RequestBody ExpenditureRequest request
    ) {
        return service.create(year, request);
    }

    @PutMapping("/expenditures/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ExpenditureResponse update(
        @PathVariable Long id,
        @Valid @RequestBody ExpenditureRequest request
    ) {
        return service.update(id, request);
    }

    @DeleteMapping("/expenditures/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
