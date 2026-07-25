package com.liberated.challenge;

import com.liberated.config.LiberatedProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Sends Expo push notifications. While {@code liberated.push.expo.mock=true} it
 * only logs (no external call). Flip the flag to deliver via Expo's push API.
 */
@Service
public class PushService {

    private static final Logger log = LoggerFactory.getLogger(PushService.class);

    private final LiberatedProperties props;
    private final RestClient restClient = RestClient.create();

    public PushService(LiberatedProperties props) {
        this.props = props;
    }

    public void send(String expoPushToken, String title, String body) {
        if (expoPushToken == null || expoPushToken.isBlank()) {
            return;
        }
        LiberatedProperties.Push.Expo expo = props.getPush().getExpo();
        if (expo.isMock()) {
            log.info("[PUSH MOCK] to={} title=\"{}\" body=\"{}\"", expoPushToken, title, body);
            return;
        }
        try {
            Map<String, Object> message = Map.of(
                    "to", expoPushToken,
                    "title", title,
                    "body", body,
                    "sound", "default");
            restClient.post()
                    .uri(expo.getEndpoint())
                    .body(List.of(message))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.warn("Failed to send Expo push to {}: {}", expoPushToken, e.getMessage());
        }
    }
}
