package com.liberated.auth;

import com.liberated.auth.dto.AuthDtos.*;
import com.liberated.domain.AuthProvider;
import com.liberated.domain.User;
import com.liberated.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final OtpService otpService;
    private final GoogleAuthService googleAuthService;
    private final AppleAuthService appleAuthService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
            JwtService jwtService, OtpService otpService,
            GoogleAuthService googleAuthService,
            AppleAuthService appleAuthService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.otpService = otpService;
        this.googleAuthService = googleAuthService;
        this.appleAuthService = appleAuthService;
    }

    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        User user = new User(req.email(), AuthProvider.EMAIL);
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setDisplayName(req.displayName());
        userRepository.save(user);
        return toResponse(user);
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (user.getPasswordHash() == null
                || !passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        return toResponse(user);
    }

    public void requestOtp(OtpRequest req) {
        otpService.requestOtp(req.phone());
    }

    public AuthResponse verifyOtp(OtpVerifyRequest req) {
        if (!otpService.verifyOtp(req.phone(), req.code())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired code");
        }
        User user = userRepository.findByPhone(req.phone())
                .orElseGet(() -> {
                    User u = new User(null, AuthProvider.PHONE);
                    u.setPhone(req.phone());
                    u.setDisplayName("Liberated User");
                    return userRepository.save(u);
                });
        return toResponse(user);
    }

    public AuthResponse google(GoogleRequest req) {
        GoogleAuthService.GoogleProfile profile = googleAuthService.verify(req.idToken());
        User user = userRepository.findByGoogleId(profile.googleId())
                .or(() -> userRepository.findByEmail(profile.email()))
                .orElseGet(() -> new User(profile.email(), AuthProvider.GOOGLE));
        user.setGoogleId(profile.googleId());
        if (user.getEmail() == null) {
            user.setEmail(profile.email());
        }
        if (user.getDisplayName() == null) {
            user.setDisplayName(profile.name());
        }
        if (user.getAuthProvider() == null) {
            user.setAuthProvider(AuthProvider.GOOGLE);
        }
        userRepository.save(user);
        return toResponse(user);
    }

    public AuthResponse apple(AppleRequest req) {
        AppleAuthService.AppleProfile profile = appleAuthService.verify(req.identityToken());
        User user = userRepository.findByAppleId(profile.appleId())
                .or(() -> profile.email() != null
                        ? userRepository.findByEmail(profile.email())
                        : java.util.Optional.empty())
                .orElseGet(() -> new User(profile.email(), AuthProvider.APPLE));
        user.setAppleId(profile.appleId());
        if (user.getEmail() == null) {
            user.setEmail(profile.email());
        }
        if (user.getDisplayName() == null) {
            user.setDisplayName(req.fullName() != null && !req.fullName().isBlank()
                    ? req.fullName()
                    : "Liberated User");
        }
        if (user.getAuthProvider() == null) {
            user.setAuthProvider(AuthProvider.APPLE);
        }
        userRepository.save(user);
        return toResponse(user);
    }

    public void savePushToken(Long userId, String expoPushToken) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setExpoPushToken(expoPushToken);
        userRepository.save(user);
    }

    private AuthResponse toResponse(User user) {
        String token = jwtService.generateToken(user.getId(),
                user.getEmail() != null ? user.getEmail() : user.getPhone());
        return new AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getAuthProvider().name());
    }
}
