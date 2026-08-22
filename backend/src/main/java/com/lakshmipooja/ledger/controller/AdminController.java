package com.lakshmipooja.ledger.controller;

import com.lakshmipooja.ledger.dto.CreateUserRequest;
import com.lakshmipooja.ledger.dto.UserResponse;
import com.lakshmipooja.ledger.entity.AppUser;
import com.lakshmipooja.ledger.exception.BusinessException;
import com.lakshmipooja.ledger.repository.AppUserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final AppUserRepository users;
    private final PasswordEncoder encoder;

    public AdminController(AppUserRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    @GetMapping("/users")
    public List<UserResponse> listUsers() {
        return users.findAllByOrderByCreatedAtAsc().stream().map(this::toResponse).toList();
    }

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createUser(@Valid @RequestBody CreateUserRequest request) {
        if (users.existsByUsername(request.username())) {
            throw new BusinessException("Username already exists.");
        }

        AppUser user = new AppUser();
        user.setUsername(request.username().trim());
        user.setPassword(encoder.encode(request.password()));
        user.setDisplayName(request.displayName().trim());
        user.setRole(request.role());
        user.setActive(true);
        return toResponse(users.save(user));
    }

    private UserResponse toResponse(AppUser user) {
        return new UserResponse(
            user.getId(), user.getUsername(), user.getDisplayName(), user.getRole(),
            user.isActive(), user.getCreatedAt()
        );
    }
}
