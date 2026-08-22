package com.lakshmipooja.ledger.service;

import com.lakshmipooja.ledger.dto.LoginRequest;
import com.lakshmipooja.ledger.dto.LoginResponse;
import com.lakshmipooja.ledger.entity.AppUser;
import com.lakshmipooja.ledger.repository.AppUserRepository;
import com.lakshmipooja.ledger.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final AppUserRepository users;
    private final JwtService jwtService;

    public AuthService(
        AuthenticationManager authenticationManager,
        AppUserRepository users,
        JwtService jwtService
    ) {
        this.authenticationManager = authenticationManager;
        this.users = users;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.username(), request.password()
            )
        );

        AppUser user = users.findByUsername(request.username()).orElseThrow();

        UserDetails details = org.springframework.security.core.userdetails.User
            .withUsername(user.getUsername())
            .password(user.getPassword())
            .roles(user.getRole().name())
            .build();

        return new LoginResponse(
            jwtService.generateToken(details),
            user.getUsername(),
            user.getDisplayName(),
            user.getRole().name()
        );
    }
}
