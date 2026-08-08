package com.liberated.auth;

import com.liberated.config.LiberatedProperties;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Sends SMS via Twilio. While {@code liberated.sms.twilio.mock=true} it only
 * logs the message (no external call, no credentials required). Set the flag to
 * false and provide real Twilio credentials to go live.
 */
@Service
public class SmsService {

    private static final Logger log = LoggerFactory.getLogger(SmsService.class);

    private final LiberatedProperties props;
    private volatile boolean twilioInitialized = false;

    public SmsService(LiberatedProperties props) {
        this.props = props;
    }

    public void sendSms(String toPhone, String message) {
        LiberatedProperties.Sms.Twilio twilio = props.getSms().getTwilio();
        if (twilio.isMock()) {
            log.info("[SMS MOCK] to={} message=\"{}\"", toPhone, message);
            return;
        }
        sendViaTwilio(toPhone, message, twilio);
    }

    private void sendViaTwilio(String toPhone, String message,
            LiberatedProperties.Sms.Twilio twilio) {
        if (twilio.getAccountSid() == null || twilio.getAuthToken() == null
                || twilio.getFromNumber() == null) {
            throw new IllegalStateException(
                    "Twilio live mode requires account-sid, auth-token and from-number");
        }
        if (!twilioInitialized) {
            synchronized (this) {
                if (!twilioInitialized) {
                    Twilio.init(twilio.getAccountSid(), twilio.getAuthToken());
                    twilioInitialized = true;
                }
            }
        }
        Message.creator(
                new PhoneNumber(toPhone),
                new PhoneNumber(twilio.getFromNumber()),
                message).create();
        log.info("[SMS] sent to={}", toPhone);
    }
}
