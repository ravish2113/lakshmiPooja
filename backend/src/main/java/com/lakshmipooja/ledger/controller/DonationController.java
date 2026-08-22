package com.lakshmipooja.ledger.controller;

import com.lakshmipooja.ledger.dto.*;
import com.lakshmipooja.ledger.service.DonationService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class DonationController {
    private final DonationService service;

    public DonationController(DonationService service) {
        this.service = service;
    }

    @GetMapping("/years/{year}/donations")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public List<DonationResponse> list(@PathVariable Integer year) {
        return service.findByYear(year);
    }

    @PostMapping("/years/{year}/donations")
    @PreAuthorize("hasRole('ADMIN')")
    public DonationResponse create(
        @PathVariable Integer year,
        @Valid @RequestBody DonationRequest request
    ) {
        return service.create(year, request);
    }

    @PutMapping("/donations/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public DonationResponse update(
        @PathVariable Long id,
        @Valid @RequestBody DonationRequest request
    ) {
        return service.update(id, request);
    }

    @DeleteMapping("/donations/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
