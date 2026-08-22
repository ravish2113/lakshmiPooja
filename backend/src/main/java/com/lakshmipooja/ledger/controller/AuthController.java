package com.lakshmipooja.ledger.controller;

import com.lakshmipooja.ledger.dto.LoginRequest;
import com.lakshmipooja.ledger.dto.LoginResponse;
import com.lakshmipooja.ledger.dto.MeResponse;
import com.lakshmipooja.ledger.entity.AppUser;
import com.lakshmipooja.ledger.repository.AppUserRepository;
import com.lakshmipooja.ledger.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final AppUserRepository users;

    public AuthController(AuthService authService, AppUserRepository users) {
        this.authService = authService;
        this.users = users;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    /**
     * Validates the JWT-backed session and returns the current user's role/details.
     * This endpoint is intentionally protected by Spring Security; the frontend
     * must never trust localStorage alone to decide whether a user is logged in.
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public MeResponse me(Authentication authentication) {
        AppUser user = users.findByUsername(authentication.getName())
            .orElseThrow(() -> new IllegalStateException("Authenticated user no longer exists."));

        return new MeResponse(
            user.getUsername(),
            user.getDisplayName(),
            user.getRole().name()
        );
    }
}
