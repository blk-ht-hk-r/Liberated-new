package com.liberated.domain;

import jakarta.persistence.*;
import java.time.Instant;

/** Short-lived one-time code issued for phone login. */
@Entity
@Table(name = "otp_codes")
public class OtpCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false)
    private String code;

    @Column(nullable = false)
    private Instant expiresAt;

    private boolean consumed = false;

    protected OtpCode() {
    }

    public OtpCode(String phone, String code, Instant expiresAt) {
        this.phone = phone;
        this.code = code;
        this.expiresAt = expiresAt;
    }

    public Long getId() {
        return id;
    }

    public String getPhone() {
        return phone;
    }

    public String getCode() {
        return code;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public boolean isConsumed() {
        return consumed;
    }

    public void setConsumed(boolean consumed) {
        this.consumed = consumed;
    }

    public boolean isValid(String candidate, Instant now) {
        return !consumed && code.equals(candidate) && now.isBefore(expiresAt);
    }
}
