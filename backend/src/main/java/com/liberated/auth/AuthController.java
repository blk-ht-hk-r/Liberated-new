package com.liberated.auth;

import com.liberated.auth.dto.AuthDtos.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        return authService.register(req);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @PostMapping("/otp/request")
    public ResponseEntity<Map<String, String>> requestOtp(@Valid @RequestBody OtpRequest req) {
        authService.requestOtp(req);
        return ResponseEntity.ok(Map.of("status", "sent"));
    }

    @PostMapping("/otp/verify")
    public AuthResponse verifyOtp(@Valid @RequestBody OtpVerifyRequest req) {
        return authService.verifyOtp(req);
    }

    @PostMapping("/google")
    public AuthResponse google(@Valid @RequestBody GoogleRequest req) {
        return authService.google(req);
    }

    @PostMapping("/apple")
    public AuthResponse apple(@Valid @RequestBody AppleRequest req) {
        return authService.apple(req);
    }

    /** Store the caller's Expo push token (requires auth). */
    @PostMapping("/push-token")
    public ResponseEntity<Void> pushToken(@AuthenticationPrincipal Long userId,
            @Valid @RequestBody PushTokenRequest req) {
        authService.savePushToken(userId, req.expoPushToken());
        return ResponseEntity.noContent().build();
    }
}
