package com.liberated.challenge;

import org.springframework.context.annotation.Profile;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

/**
 * Dev-only test clock. Loaded in every profile EXCEPT "prod" (the deployed
 * profile), so it works out of the box in local dev but can never load in
 * production. Lets you drive the real online challenge flow day-by-day without
 * changing the OS clock:
 *
 * <pre>
 *   POST /api/dev/set-date?date=2026-08-20   -> pin "today" to that date
 *   POST /api/dev/clear-date                 -> back to the real clock
 *   GET  /api/dev/date                        -> inspect the current override
 * </pre>
 *
 * After changing the date, re-fetch GET /api/challenge so evaluate() recomputes
 * currentDayIndex, misses, penalties and end-of-day completion against it.
 * These endpoints require the same JWT as the rest of /api.
 */
@RestController
@RequestMapping("/api/dev")
@Profile("!prod")
public class DevClockController {

    private final ChallengeService challengeService;

    public DevClockController(ChallengeService challengeService) {
        this.challengeService = challengeService;
    }

    @PostMapping("/set-date")
    public Map<String, Object> setDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        challengeService.setTestDate(date);
        return Map.of("testDate", date.toString());
    }

    @PostMapping("/clear-date")
    public Map<String, Object> clearDate() {
        challengeService.setTestDate(null);
        return Map.of("testDate", "null");
    }

    @GetMapping("/date")
    public Map<String, Object> currentDate() {
        LocalDate d = challengeService.getTestDate();
        return Map.of("testDate", d == null ? "null" : d.toString());
    }
}
