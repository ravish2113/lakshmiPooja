package com.lakshmipooja.ledger.security;

import com.lakshmipooja.ledger.entity.AppUser;
import com.lakshmipooja.ledger.repository.AppUserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    private final AppUserRepository repository;

    public CustomUserDetailsService(AppUserRepository repository) {
        this.repository = repository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        AppUser user = repository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return User.withUsername(user.getUsername())
            .password(user.getPassword())
            .disabled(!user.isActive())
            .authorities(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
            .build();
    }
}
