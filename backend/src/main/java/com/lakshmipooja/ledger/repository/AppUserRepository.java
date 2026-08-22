package com.lakshmipooja.ledger.repository;

import com.lakshmipooja.ledger.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByUsername(String username);
    boolean existsByUsername(String username);
    List<AppUser> findAllByOrderByCreatedAtAsc();
}
