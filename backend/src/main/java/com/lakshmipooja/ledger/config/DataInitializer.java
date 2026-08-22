package com.lakshmipooja.ledger.config;

import com.lakshmipooja.ledger.entity.AppUser;
import com.lakshmipooja.ledger.entity.PoojaYearLedger;
import com.lakshmipooja.ledger.entity.Role;
import com.lakshmipooja.ledger.repository.AppUserRepository;
import com.lakshmipooja.ledger.repository.PoojaYearRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.Year;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initialize(
        AppUserRepository users,
        PoojaYearRepository years,
        PasswordEncoder encoder,
        @Value("${app.admin.username}") String username,
        @Value("${app.admin.password}") String password,
        @Value("${app.admin.display-name}") String displayName
    ) {
        return args -> {
            // Keep the configured admin account synchronized with deployment settings.
            // This lets ADMIN_PASSWORD be reset safely from Render without deleting data.
            AppUser admin = users.findByUsername(username).orElseGet(AppUser::new);
            admin.setUsername(username);
            admin.setPassword(encoder.encode(password));
            admin.setDisplayName(displayName);
            admin.setRole(Role.ADMIN);
            admin.setActive(true);
            users.save(admin);

            // Seed archive years from 2024 through the current calendar year.
            // Missing years are inserted without disturbing existing data.
            int currentYear = Year.now().getValue();
            for (int year = 2024; year <= currentYear; year++) {
                if (!years.existsByYear(year)) {
                    PoojaYearLedger ledger = new PoojaYearLedger();
                    ledger.setYear(year);
                    ledger.setOpeningBalance(BigDecimal.ZERO);
                    years.save(ledger);
                }
            }
        };
    }
}
