package com.liberated.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {

        private AuthDtos() {
        }

        public record RegisterRequest(
                        @Email @NotBlank String email,
                        @NotBlank @Size(min = 6, message = "Password must be at least 6 characters") String password,
                        String displayName) {
        }

        public record LoginRequest(
                        @Email @NotBlank String email,
                        @NotBlank String password) {
        }

        public record OtpRequest(
                        @NotBlank String phone) {
        }

        public record OtpVerifyRequest(
                        @NotBlank String phone,
                        @NotBlank String code) {
        }

        public record GoogleRequest(
                        @NotBlank String idToken) {
        }

        public record AuthResponse(
                        String token,
                        Long userId,
                        String email,
                        String displayName,
                        String authProvider) {
        }

        public record PushTokenRequest(
                        @NotBlank String expoPushToken) {
        }
}
