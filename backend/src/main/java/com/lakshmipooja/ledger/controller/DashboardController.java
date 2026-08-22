package com.lakshmipooja.ledger.controller;

import com.lakshmipooja.ledger.dto.DashboardResponse;
import com.lakshmipooja.ledger.service.DashboardService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/years")
public class DashboardController {
    private final DashboardService service;

    public DashboardController(DashboardService service) {
        this.service = service;
    }

    @GetMapping("/{year}/dashboard")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public DashboardResponse dashboard(@PathVariable Integer year) {
        return service.getDashboard(year);
    }
}
