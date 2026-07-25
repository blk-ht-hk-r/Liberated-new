# Liberated

A 7-day social-media detox challenge. Each day the app gives you one meaningful
task to fill the space the apps used to take. Miss a day and it costs you a day.
Your daily "proof" (names, reflections, photos) stays **encrypted on your phone
and is never sent to a server** — the backend only ever knows a boolean "done".

- **Mobile**: React Native (Expo, TypeScript) — iOS + Android
- **Backend**: Java 17 + Spring Boot + H2 (source of truth for auth & challenge state)

## Repository layout

```
liberated/
├─ backend/   Spring Boot API (auth, challenge state, midnight rollover, push)
└─ mobile/    Expo app (login, quote, home, pill selector, tracking pages)
```

---

## Backend — run it

Requirements: JDK 17+, Maven.

```powershell
cd backend
mvn spring-boot:run
```

- API: `http://localhost:8080`
- H2 console: `http://localhost:8080/h2-console`
  (JDBC URL `jdbc:h2:file:./data/liberated`, user `sa`, empty password)

### Mock mode (default — no credentials needed)

Every external integration ships with a mock fallback so the whole app works
without any keys:

| Integration      | Mock behaviour                                   | Flag                      |
| ---------------- | ------------------------------------------------ | ------------------------- |
| Google OAuth     | Trusts the token string as a fake identity       | `GOOGLE_MOCK`             |
| SMS OTP (Twilio) | OTP is always **`000000`**, code logged not sent | `OTP_MOCK`, `TWILIO_MOCK` |
| Push (Expo)      | Notifications are logged, not delivered          | `EXPO_PUSH_MOCK`          |

To go live, set the matching env vars (e.g. `GOOGLE_CLIENT_ID`,
`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`) and flip the
mock flag to `false`. Wiring points are marked with `TODO` in `SmsService`.

### Key endpoints

| Method | Path                                | Notes                                   |
| ------ | ----------------------------------- | --------------------------------------- |
| POST   | `/api/auth/register`                | email + password → JWT                  |
| POST   | `/api/auth/login`                   | email + password → JWT                  |
| POST   | `/api/auth/otp/request`             | `{ phone }` (mock code `000000`)        |
| POST   | `/api/auth/otp/verify`              | `{ phone, code }` → JWT                 |
| POST   | `/api/auth/google`                  | `{ idToken }` → JWT                     |
| POST   | `/api/auth/push-token`              | store Expo push token (auth)            |
| GET    | `/api/activities`                   | activity catalog (public)               |
| GET    | `/api/challenge`                    | full state; evaluates rollover on fetch |
| POST   | `/api/challenge/start`              | `{ activityIds[], timezone }`           |
| POST   | `/api/challenge/complete-today`     | marks today's task done                 |
| POST   | `/api/challenge/acknowledge-popups` | clears failure/completion popups        |

The **rollover job** (`DayRolloverJob`) runs hourly to catch local midnight in
every timezone. A missed day adds a penalty day and queues a push + failure
popup; completing all tasks queues a congratulations popup.

---

## Mobile — run it

Requirements: Node 18+, the Expo Go app on your phone (or an emulator).

```powershell
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS).

### Pointing the app at the backend

`mobile/app.json → expo.extra.apiBaseUrl` controls the API URL.

- **Android emulator**: resolves to `http://10.0.2.2:8080` automatically.
- **iOS simulator**: `http://localhost:8080` works.
- **Physical device**: set `apiBaseUrl` to your computer's LAN IP, e.g.
  `http://192.168.1.20:8080`, so the phone can reach the backend.

### Try the flow

1. Sign in (email/password, phone + OTP `000000`, or Google — all mock-friendly).
2. Read the opening reflection, then tap **Start the challenge**.
3. Pick **7** activities in the pill selector.
4. Home shows the live "Time since liberation" timer, progress, and today's task.
5. Tap the task → tracking page → submit proof (kept only on-device).
6. Reopen the task the same day → your saved proof shows read-only (no re-submit).

---

## Privacy design

- Text proof is stored in the OS secure enclave (Keychain / Keystore) via
  `expo-secure-store`; photos live in the app's private sandbox directory.
- Proof is auto-purged once its day passes (`purgeOldProof`).
- The backend persists only booleans and timestamps — verify in the H2 console.

## Note on "blocking" social apps

A normal app cannot forcibly block other apps (OS sandboxing). Liberated enforces
the detox through commitment and daily proof, not device-level blocking. A future
version could integrate OS Screen Time / Family Link APIs for hard blocking.
