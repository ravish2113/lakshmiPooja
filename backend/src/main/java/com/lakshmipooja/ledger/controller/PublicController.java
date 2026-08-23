package com.lakshmipooja.ledger.controller;

import com.lakshmipooja.ledger.dto.DashboardResponse;
import com.lakshmipooja.ledger.dto.DonationResponse;
import com.lakshmipooja.ledger.dto.PublicDonationResponse;
import com.lakshmipooja.ledger.dto.ExpenditureResponse;
import com.lakshmipooja.ledger.dto.YearResponse;
import com.lakshmipooja.ledger.service.DashboardService;
import com.lakshmipooja.ledger.service.DonationService;
import com.lakshmipooja.ledger.service.ExpenditureService;
import com.lakshmipooja.ledger.service.YearService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public")
public class PublicController {
    private final YearService years;
    private final DashboardService dashboard;
    private final DonationService donations;
    private final ExpenditureService expenditures;

    public PublicController(YearService years, DashboardService dashboard,
                            DonationService donations, ExpenditureService expenditures) {
        this.years = years;
        this.dashboard = dashboard;
        this.donations = donations;
        this.expenditures = expenditures;
    }

    @GetMapping("/years")
    public List<YearResponse> years() { return years.getYears(); }

    @GetMapping("/years/{year}/dashboard")
    public DashboardResponse dashboard(@PathVariable Integer year) { return dashboard.getDashboard(year); }

    @GetMapping("/years/{year}/donations")
    public List<PublicDonationResponse> donations(@PathVariable Integer year) {
        return donations.findByYear(year).stream()
            .map(d -> new PublicDonationResponse(
                d.id(), d.year(), d.donorName(), d.amount(), d.donationDate(), d.paymentMode(), d.paymentStatus()
            ))
            .toList();
    }

    @GetMapping("/years/{year}/expenditures")
    public List<ExpenditureResponse> expenditures(@PathVariable Integer year) { return expenditures.findByYear(year); }
}
