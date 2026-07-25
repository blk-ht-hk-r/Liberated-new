package com.liberated.auth;

import com.liberated.config.LiberatedProperties;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Verifies a Google ID token and returns the profile. While
 * {@code liberated.auth.google.mock=true} it trusts the token string as a fake
 * identity so the flow can be exercised without real Google credentials.
 */
@Service
public class GoogleAuthService {

    private final LiberatedProperties props;
    private final RestClient restClient = RestClient.create();

    public GoogleAuthService(LiberatedProperties props) {
        this.props = props;
    }

    public GoogleProfile verify(String idToken) {
        if (props.getAuth().getGoogle().isMock()) {
            // Mock identity derived from the token so repeated logins are stable.
            String fakeId = "mock-google-" + Math.abs(idToken.hashCode());
            String email = "user" + Math.abs(idToken.hashCode() % 100000) + "@gmail.com";
            return new GoogleProfile(fakeId, email, "Liberated User");
        }
        return verifyWithGoogle(idToken);
    }

    private GoogleProfile verifyWithGoogle(String idToken) {
        @SuppressWarnings("unchecked")
        Map<String, Object> body = restClient.get()
                .uri("https://oauth2.googleapis.com/tokeninfo?id_token={t}", idToken)
                .retrieve()
                .body(Map.class);

        if (body == null || body.get("sub") == null) {
            throw new IllegalArgumentException("Invalid Google token");
        }
        String expectedAud = props.getAuth().getGoogle().getClientId();
        if (expectedAud != null && !expectedAud.isBlank()
                && !expectedAud.equals(body.get("aud"))) {
            throw new IllegalArgumentException("Google token audience mismatch");
        }
        return new GoogleProfile(
                String.valueOf(body.get("sub")),
                String.valueOf(body.get("email")),
                String.valueOf(body.getOrDefault("name", "Liberated User")));
    }

    public record GoogleProfile(String googleId, String email, String name) {
    }
}
