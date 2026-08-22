package com.lakshmipooja.ledger.dto;

import com.lakshmipooja.ledger.entity.Role;
import java.time.LocalDateTime;

public record UserResponse(
    Long id,
    String username,
    String displayName,
    Role role,
    boolean active,
    LocalDateTime createdAt
) {}
