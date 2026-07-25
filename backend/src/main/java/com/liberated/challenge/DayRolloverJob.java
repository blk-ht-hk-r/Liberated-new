package com.liberated.challenge;

import com.liberated.domain.Challenge;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Hourly rollover pass. Because challenges span multiple timezones, running
 * every
 * hour catches local midnight for every zone. {@link ChallengeService#evaluate}
 * is idempotent per day, so extra runs are harmless.
 */
@Component
public class DayRolloverJob {

    private static final Logger log = LoggerFactory.getLogger(DayRolloverJob.class);

    private final ChallengeService challengeService;

    public DayRolloverJob(ChallengeService challengeService) {
        this.challengeService = challengeService;
    }

    // Top of every hour.
    @Scheduled(cron = "0 0 * * * *")
    public void rollover() {
        List<Challenge> active = challengeService.activeChallenges();
        log.info("Rollover pass over {} active challenge(s)", active.size());
        for (Challenge challenge : active) {
            try {
                challengeService.evaluateAndNotify(challenge);
            } catch (Exception e) {
                log.warn("Rollover failed for challenge {}: {}",
                        challenge.getId(), e.getMessage());
            }
        }
    }
}
