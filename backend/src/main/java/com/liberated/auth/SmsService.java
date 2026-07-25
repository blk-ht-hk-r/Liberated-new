package com.liberated.auth;

import com.liberated.config.LiberatedProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Sends SMS via Twilio. While {@code liberated.sms.twilio.mock=true} it only
 * logs
 * the message (no external call, no credentials required). Flip the flag and
 * add
 * real Twilio credentials to go live - wire the actual Twilio SDK call in
 * {@link #sendViaTwilio}.
 */
@Service
public class SmsService {

    private static final Logger log = LoggerFactory.getLogger(SmsService.class);

    private final LiberatedProperties props;

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
        // TODO: add com.twilio:twilio dependency and uncomment when going live.
        //
        // Twilio.init(twilio.getAccountSid(), twilio.getAuthToken());
        // Message.creator(
        // new PhoneNumber(toPhone),
        // new PhoneNumber(twilio.getFromNumber()),
        // message).create();
        log.warn("Twilio live mode requested but SDK call not wired. to={} message=\"{}\"",
                toPhone, message);
    }
}
