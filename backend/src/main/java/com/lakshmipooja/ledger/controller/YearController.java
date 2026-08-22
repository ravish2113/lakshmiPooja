package com.lakshmipooja.ledger.controller;

import com.lakshmipooja.ledger.dto.YearResponse;
import com.lakshmipooja.ledger.service.YearService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/years")
public class YearController {
    private final YearService service;

    public YearController(YearService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public List<YearResponse> getYears() {
        return service.getYears();
    }

    @PostMapping("/{year}/close")
    @PreAuthorize("hasRole('ADMIN')")
    public YearResponse close(@PathVariable Integer year) {
        return service.closeYear(year);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public YearResponse create(
        @RequestParam Integer year,
        @RequestParam(defaultValue = "0") BigDecimal openingBalance
    ) {
        return service.createYear(year, openingBalance);
    }
}
