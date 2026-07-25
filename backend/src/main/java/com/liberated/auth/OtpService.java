package com.liberated.auth;

import com.liberated.config.LiberatedProperties;
import com.liberated.domain.OtpCode;
import com.liberated.repository.OtpCodeRepository;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class OtpService {

    private final OtpCodeRepository otpRepository;
    private final SmsService smsService;
    private final LiberatedProperties props;
    private final SecureRandom random = new SecureRandom();

    public OtpService(OtpCodeRepository otpRepository, SmsService smsService,
            LiberatedProperties props) {
        this.otpRepository = otpRepository;
        this.smsService = smsService;
        this.props = props;
    }

    /** Generates + "sends" an OTP. In mock mode the fixed mock code is used. */
    public void requestOtp(String phone) {
        LiberatedProperties.Auth.Otp cfg = props.getAuth().getOtp();
        String code = cfg.isMock() ? cfg.getMockCode() : sixDigits();
        Instant expiresAt = Instant.now().plus(cfg.getTtlSeconds(), ChronoUnit.SECONDS);

        otpRepository.save(new OtpCode(phone, code, expiresAt));
        smsService.sendSms(phone, "Your Liberated code is " + code);
    }

    /** Returns true if the code is valid; consumes it on success. */
    public boolean verifyOtp(String phone, String candidate) {
        return otpRepository.findFirstByPhoneAndConsumedFalseOrderByIdDesc(phone)
                .filter(otp -> otp.isValid(candidate, Instant.now()))
                .map(otp -> {
                    otp.setConsumed(true);
                    otpRepository.save(otp);
                    return true;
                })
                .orElse(false);
    }

    private String sixDigits() {
        return String.format("%06d", random.nextInt(1_000_000));
    }
}
