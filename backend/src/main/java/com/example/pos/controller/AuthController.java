package com.example.pos.controller;

import com.example.pos.entity.UserAccount;
import com.example.pos.repository.UserAccountRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_MANAGER = "MANAGER";
    public static final String ROLE_CASHIER = "CASHIER";

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserAccountRepository userAccountRepository, PasswordEncoder passwordEncoder) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        ensureDefaultUsers();
    }

    private void ensureDefaultUsers() {
        upsertUser("admin@pos.com", "admin123", ROLE_ADMIN);
        upsertUser("manager@pos.com", "manager123", ROLE_MANAGER);
        upsertUser("cashier@pos.com", "cashier123", ROLE_CASHIER);
    }

    private void upsertUser(String email, String rawPassword, String role) {
        userAccountRepository.findByEmail(email).orElseGet(() -> {
            UserAccount user = new UserAccount();
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(rawPassword));
            user.setRole(role);
            return userAccountRepository.save(user);
        });
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.getOrDefault("username", body.get("email"));
        String password = body.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and password required"));
        }

        return userAccountRepository.findByEmail(email)
                .filter(user -> passwordEncoder.matches(password, user.getPassword()))
                .<ResponseEntity<?>>map(user -> ResponseEntity.ok(Map.of(
                        "username", user.getEmail(),
                        "email", user.getEmail(),
                        "role", normalizeRole(user.getRole()),
                        "token", "session-" + user.getId()
                )))
                .orElseGet(() -> ResponseEntity.status(401).body(Map.of("message", "Invalid credentials")));
    }

    private static String normalizeRole(String role) {
        if (role == null) {
            return ROLE_CASHIER;
        }
        String r = role.trim().toUpperCase();
        if (r.contains("ADMIN")) {
            return ROLE_ADMIN;
        }
        if (r.contains("MANAGER")) {
            return ROLE_MANAGER;
        }
        return ROLE_CASHIER;
    }
}
