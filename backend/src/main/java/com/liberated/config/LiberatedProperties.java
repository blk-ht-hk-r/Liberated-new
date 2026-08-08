package com.liberated.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/** Strongly-typed binding of the {@code liberated.*} config tree. */
@Component
@ConfigurationProperties(prefix = "liberated")
public class LiberatedProperties {

    private final Jwt jwt = new Jwt();
    private final Challenge challenge = new Challenge();
    private final Auth auth = new Auth();
    private final Sms sms = new Sms();
    private final Push push = new Push();

    public Jwt getJwt() {
        return jwt;
    }

    public Challenge getChallenge() {
        return challenge;
    }

    public Auth getAuth() {
        return auth;
    }

    public Sms getSms() {
        return sms;
    }

    public Push getPush() {
        return push;
    }

    public static class Jwt {
        private String secret;
        private long expirationMs;

        public String getSecret() {
            return secret;
        }

        public void setSecret(String secret) {
            this.secret = secret;
        }

        public long getExpirationMs() {
            return expirationMs;
        }

        public void setExpirationMs(long expirationMs) {
            this.expirationMs = expirationMs;
        }
    }

    public static class Challenge {
        private int defaultDays = 7;

        public int getDefaultDays() {
            return defaultDays;
        }

        public void setDefaultDays(int defaultDays) {
            this.defaultDays = defaultDays;
        }
    }

    public static class Auth {
        private final Google google = new Google();
        private final Apple apple = new Apple();
        private final Otp otp = new Otp();

        public Google getGoogle() {
            return google;
        }

        public Apple getApple() {
            return apple;
        }

        public Otp getOtp() {
            return otp;
        }

        public static class Google {
            private boolean mock = true;
            private String clientId;

            public boolean isMock() {
                return mock;
            }

            public void setMock(boolean mock) {
                this.mock = mock;
            }

            public String getClientId() {
                return clientId;
            }

            public void setClientId(String clientId) {
                this.clientId = clientId;
            }
        }

        public static class Apple {
            private boolean mock = true;
            /**
             * Accepted audience(s) - normally your app bundle id
             * (and Services ID for web). Comma-separated.
             */
            private String clientId;

            public boolean isMock() {
                return mock;
            }

            public void setMock(boolean mock) {
                this.mock = mock;
            }

            public String getClientId() {
                return clientId;
            }

            public void setClientId(String clientId) {
                this.clientId = clientId;
            }
        }

        public static class Otp {
            private boolean mock = true;
            private String mockCode = "000000";
            private int ttlSeconds = 300;

            public boolean isMock() {
                return mock;
            }

            public void setMock(boolean mock) {
                this.mock = mock;
            }

            public String getMockCode() {
                return mockCode;
            }

            public void setMockCode(String mockCode) {
                this.mockCode = mockCode;
            }

            public int getTtlSeconds() {
                return ttlSeconds;
            }

            public void setTtlSeconds(int ttlSeconds) {
                this.ttlSeconds = ttlSeconds;
            }
        }
    }

    public static class Sms {
        private final Twilio twilio = new Twilio();

        public Twilio getTwilio() {
            return twilio;
        }

        public static class Twilio {
            private boolean mock = true;
            private String accountSid;
            private String authToken;
            private String fromNumber;

            public boolean isMock() {
                return mock;
            }

            public void setMock(boolean mock) {
                this.mock = mock;
            }

            public String getAccountSid() {
                return accountSid;
            }

            public void setAccountSid(String accountSid) {
                this.accountSid = accountSid;
            }

            public String getAuthToken() {
                return authToken;
            }

            public void setAuthToken(String authToken) {
                this.authToken = authToken;
            }

            public String getFromNumber() {
                return fromNumber;
            }

            public void setFromNumber(String fromNumber) {
                this.fromNumber = fromNumber;
            }
        }
    }

    public static class Push {
        private final Expo expo = new Expo();

        public Expo getExpo() {
            return expo;
        }

        public static class Expo {
            private boolean mock = true;
            private String endpoint;

            public boolean isMock() {
                return mock;
            }

            public void setMock(boolean mock) {
                this.mock = mock;
            }

            public String getEndpoint() {
                return endpoint;
            }

            public void setEndpoint(String endpoint) {
                this.endpoint = endpoint;
            }
        }
    }
}
