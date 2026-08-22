package com.lakshmipooja.ledger.dto;

import com.lakshmipooja.ledger.entity.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
    @NotBlank @Size(max = 100) String username,
    @NotBlank @Size(min = 8, max = 100) String password,
    @NotBlank @Size(max = 150) String displayName,
    @NotNull Role role
) {}
