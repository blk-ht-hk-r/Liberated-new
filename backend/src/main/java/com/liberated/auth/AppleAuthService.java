package com.liberated.auth;

import com.liberated.config.LiberatedProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.LocatorAdapter;
import io.jsonwebtoken.ProtectedHeader;
import io.jsonwebtoken.security.Jwk;
import io.jsonwebtoken.security.JwkSet;
import io.jsonwebtoken.security.Jwks;
import io.jsonwebtoken.security.PublicJwk;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.security.Key;
import java.security.PublicKey;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * Verifies the identity token issued by "Sign in with Apple".
 *
 * <p>
 * The token is a JWT signed by Apple. We validate it against Apple's public
 * JWKS ({@code https://appleid.apple.com/auth/keys}), check the issuer and the
 * audience (which must match our bundle id / Services ID). No client secret is
 * required for this verification.
 *
 * <p>
 * While {@code liberated.auth.apple.mock=true} it trusts the token string as a
 * fake identity so the flow can be exercised without Apple credentials.
 */
@Service
public class AppleAuthService {

    private static final String APPLE_ISSUER = "https://appleid.apple.com";
    private static final String APPLE_KEYS_URL = APPLE_ISSUER + "/auth/keys";

    private final LiberatedProperties props;
    private final RestClient restClient = RestClient.create();

    /** Cache of kid -> public key, refreshed when an unknown kid appears. */
    private volatile Map<String, PublicKey> keyCache = Map.of();

    public AppleAuthService(LiberatedProperties props) {
        this.props = props;
    }

    public AppleProfile verify(String identityToken) {
        if (props.getAuth().getApple().isMock()) {
            String fakeId = "mock-apple-" + Math.abs(identityToken.hashCode());
            String email = "user" + Math.abs(identityToken.hashCode() % 100000) + "@privaterelay.appleid.com";
            return new AppleProfile(fakeId, email);
        }
        return verifyWithApple(identityToken);
    }

    private AppleProfile verifyWithApple(String identityToken) {
        Jws<Claims> jws = Jwts.parser()
                .keyLocator(new LocatorAdapter<Key>() {
                    @Override
                    protected Key locate(ProtectedHeader header) {
                        return resolveKey(header.getKeyId());
                    }
                })
                .requireIssuer(APPLE_ISSUER)
                .build()
                .parseSignedClaims(identityToken);

        Claims claims = jws.getPayload();
        verifyAudience(claims);

        String sub = claims.getSubject();
        if (sub == null || sub.isBlank()) {
            throw new IllegalArgumentException("Apple token missing subject");
        }
        return new AppleProfile(sub, claims.get("email", String.class));
    }

    private void verifyAudience(Claims claims) {
        String configured = props.getAuth().getApple().getClientId();
        if (configured == null || configured.isBlank()) {
            return;
        }
        Set<String> accepted = claims.getAudience();
        boolean match = Arrays.stream(configured.split(","))
                .map(String::trim)
                .anyMatch(id -> accepted != null && accepted.contains(id));
        if (!match) {
            throw new IllegalArgumentException("Apple token audience mismatch");
        }
    }

    private PublicKey resolveKey(String kid) {
        PublicKey key = keyCache.get(kid);
        if (key == null) {
            keyCache = fetchKeys();
            key = keyCache.get(kid);
        }
        if (key == null) {
            throw new IllegalArgumentException("Unknown Apple signing key: " + kid);
        }
        return key;
    }

    private Map<String, PublicKey> fetchKeys() {
        String json = restClient.get()
                .uri(APPLE_KEYS_URL)
                .retrieve()
                .body(String.class);
        if (json == null || json.isBlank()) {
            throw new IllegalStateException("Could not fetch Apple public keys");
        }
        JwkSet set = Jwks.setParser().build().parse(json);
        Map<String, PublicKey> keys = new HashMap<>();
        for (Jwk<?> jwk : set.getKeys()) {
            if (jwk instanceof PublicJwk<?> publicJwk) {
                keys.put(jwk.getId(), (PublicKey) publicJwk.toKey());
            }
        }
        return keys;
    }

    public record AppleProfile(String appleId, String email) {
    }
}
