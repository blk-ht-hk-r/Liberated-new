package com.liberated.challenge;

import com.liberated.challenge.dto.ChallengeDtos.*;
import com.liberated.domain.*;
import com.liberated.repository.ActivityRepository;
import com.liberated.repository.ChallengeRepository;
import com.liberated.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Owns all challenge/day math. Backend is the source of truth. Model:
 * <ul>
 * <li>User completes {@code baseDays} (7) daily tasks in order (the selected
 * activities).</li>
 * <li>Each calendar day presents the next uncompleted task. Completing it marks
 * that
 * day's {@link DayLog} done and advances progress.</li>
 * <li>A calendar day that passes (local midnight) without completion is a miss:
 * it adds
 * one penalty day ({@code extraDays}) and queues a failure popup.</li>
 * <li>Challenge is COMPLETED once {@code baseDays} tasks are done.</li>
 * </ul>
 * No private proof content is ever stored here - only booleans/timestamps.
 */
@Service
public class ChallengeService {

    private final ChallengeRepository challengeRepository;
    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;
    private final PushService pushService;

    public ChallengeService(ChallengeRepository challengeRepository,
            ActivityRepository activityRepository,
            UserRepository userRepository,
            PushService pushService) {
        this.challengeRepository = challengeRepository;
        this.activityRepository = activityRepository;
        this.userRepository = userRepository;
        this.pushService = pushService;
    }

    @Transactional
    public ChallengeStateView startChallenge(Long userId, StartChallengeRequest req) {
        challengeRepository.findFirstByUserIdOrderByIdDesc(userId).ifPresent(existing -> {
            if (existing.getStatus() == ChallengeStatus.ACTIVE) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "An active challenge already exists");
            }
        });

        List<Long> ids = req.activityIds();
        // Validate all activity ids exist.
        for (Long id : ids) {
            if (!activityRepository.existsById(id)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Unknown activity id: " + id);
            }
        }

        Challenge challenge = new Challenge();
        challenge.setUserId(userId);
        challenge.setStartedAt(Instant.now());
        challenge.setBaseDays(ids.size());
        challenge.setStatus(ChallengeStatus.ACTIVE);
        challenge.setTimezone(sanitizeZone(req.timezone()));
        challenge.getSelectedActivityIds().addAll(ids);

        // Seed day 0 for the start date.
        LocalDate startDate = LocalDate.now(ZoneId.of(challenge.getTimezone()));
        challenge.getDayLogs().add(new DayLog(challenge, 0, startDate));

        challengeRepository.save(challenge);
        return buildState(challenge, Instant.now(), false);
    }

    @Transactional
    public ChallengeStateView getState(Long userId) {
        Challenge challenge = challengeRepository.findFirstByUserIdOrderByIdDesc(userId)
                .orElse(null);
        if (challenge == null) {
            return notStartedView();
        }
        evaluate(challenge, Instant.now());
        challengeRepository.save(challenge);
        return buildState(challenge, Instant.now(), false);
    }

    @Transactional
    public ChallengeStateView completeToday(Long userId) {
        Challenge challenge = requireActive(userId);
        Instant now = Instant.now();
        evaluate(challenge, now);

        ZoneId zone = ZoneId.of(challenge.getTimezone());
        LocalDate today = LocalDate.now(zone);
        DayLog todayLog = ensureDayLog(challenge, today);

        if (!todayLog.isCompleted()) {
            todayLog.setCompleted(true);
            todayLog.setCompletedAt(now);
        }

        // Completing the final task finishes the challenge.
        long completed = countCompleted(challenge);
        if (completed >= challenge.getBaseDays()
                && challenge.getStatus() == ChallengeStatus.ACTIVE) {
            challenge.setStatus(ChallengeStatus.COMPLETED);
            challenge.setCompletedAt(now);
            challenge.setPendingCompletion(true);
        }

        challengeRepository.save(challenge);
        return buildState(challenge, now, false);
    }

    @Transactional
    public ChallengeStateView acknowledgePopups(Long userId) {
        Challenge challenge = challengeRepository.findFirstByUserIdOrderByIdDesc(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No challenge"));
        challenge.setPendingFailureDays(0);
        challenge.setPendingCompletion(false);
        challengeRepository.save(challenge);
        return buildState(challenge, Instant.now(), false);
    }

    @Transactional
    public ChallengeStateView changeTodayActivity(Long userId, Long activityId) {
        Challenge challenge = requireActive(userId);
        Instant now = Instant.now();
        evaluate(challenge, now);

        ZoneId zone = ZoneId.of(challenge.getTimezone());
        LocalDate today = LocalDate.now(zone);
        DayLog todayLog = ensureDayLog(challenge, today);

        if (todayLog.isCompleted()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Today's activity already completed");
        }

        if (!activityRepository.existsById(activityId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown activity id: " + activityId);
        }

        int idx = todayLog.getDayIndex();
        if (idx < 0 || idx >= challenge.getSelectedActivityIds().size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid day index");
        }

        challenge.getSelectedActivityIds().set(idx, activityId);
        challengeRepository.save(challenge);
        return buildState(challenge, now, false);
    }

    // --- core evaluation ----------------------------------------------------

    /**
     * Brings the challenge up to date as of {@code now}: creates missing day logs,
     * applies penalties for past uncompleted days, and flips status to COMPLETED.
     * Idempotent per day thanks to {@code missedEvaluated}.
     */
    void evaluate(Challenge challenge, Instant now) {
        if (challenge.getStatus() != ChallengeStatus.ACTIVE) {
            return;
        }
        ZoneId zone = ZoneId.of(challenge.getTimezone());
        LocalDate startDate = challenge.getStartedAt().atZone(zone).toLocalDate();
        LocalDate today = now.atZone(zone).toLocalDate();

        // Ensure a DayLog exists for each calendar date from start..today.
        Map<LocalDate, DayLog> byDate = new LinkedHashMap<>();
        for (DayLog dl : challenge.getDayLogs()) {
            byDate.put(dl.getDueDate(), dl);
        }
        int index = 0;
        for (LocalDate d = startDate; !d.isAfter(today); d = d.plusDays(1), index++) {
            if (!byDate.containsKey(d)) {
                DayLog dl = new DayLog(challenge, index, d);
                challenge.getDayLogs().add(dl);
                byDate.put(d, dl);
            }
        }

        // Any past (before today) uncompleted, not-yet-evaluated day is a miss.
        int newMisses = 0;
        for (DayLog dl : challenge.getDayLogs()) {
            if (dl.getDueDate().isBefore(today)
                    && !dl.isCompleted()
                    && !dl.isMissedEvaluated()) {
                dl.setMissedEvaluated(true);
                challenge.addPenaltyDay();
                newMisses++;
            }
        }
        if (newMisses > 0) {
            challenge.setPendingFailureDays(challenge.getPendingFailureDays() + newMisses);
        }

        if (countCompleted(challenge) >= challenge.getBaseDays()) {
            challenge.setStatus(ChallengeStatus.COMPLETED);
            if (challenge.getCompletedAt() == null) {
                challenge.setCompletedAt(now);
                challenge.setPendingCompletion(true);
            }
        }
    }

    // --- helpers ------------------------------------------------------------

    private Challenge requireActive(Long userId) {
        Challenge challenge = challengeRepository.findFirstByUserIdOrderByIdDesc(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No challenge"));
        if (challenge.getStatus() != ChallengeStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Challenge is not active");
        }
        return challenge;
    }

    private DayLog ensureDayLog(Challenge challenge, LocalDate date) {
        return challenge.getDayLogs().stream()
                .filter(dl -> dl.getDueDate().equals(date))
                .findFirst()
                .orElseGet(() -> {
                    int idx = challenge.getDayLogs().size();
                    DayLog dl = new DayLog(challenge, idx, date);
                    challenge.getDayLogs().add(dl);
                    return dl;
                });
    }

    private long countCompleted(Challenge challenge) {
        return challenge.getDayLogs().stream().filter(DayLog::isCompleted).count();
    }

    private ChallengeStateView buildState(Challenge challenge, Instant now, boolean forJob) {
        List<Activity> selected = challenge.getSelectedActivityIds().stream()
                .map(id -> activityRepository.findById(id).orElse(null))
                .filter(a -> a != null)
                .toList();
        List<ActivityView> selectedViews = selected.stream()
                .map(this::toView)
                .toList();

        int completedDays = (int) countCompleted(challenge);
        ZoneId zone = ZoneId.of(challenge.getTimezone());
        LocalDate today = now.atZone(zone).toLocalDate();
        DayLog todayLog = challenge.getDayLogs().stream()
                .filter(dl -> dl.getDueDate().equals(today))
                .findFirst()
                .orElse(null);

        int currentDayIndex = todayLog != null
                ? Math.min(todayLog.getDayIndex(), challenge.getBaseDays() - 1)
                : Math.min(completedDays, challenge.getBaseDays() - 1);

        ActivityView todayActivity = null;
        if (challenge.getStatus() == ChallengeStatus.ACTIVE
                && currentDayIndex >= 0
                && currentDayIndex < selectedViews.size()) {
            todayActivity = selectedViews.get(currentDayIndex);
        }

        boolean todayCompleted = challenge.getDayLogs().stream()
                .anyMatch(dl -> dl.getDueDate().equals(today) && dl.isCompleted());

        List<DayView> dayViews = new ArrayList<>();
        for (DayLog dl : challenge.getDayLogs()) {
            dayViews.add(new DayView(dl.getDayIndex(), dl.getDueDate().toString(),
                    dl.isCompleted(), dl.getCompletedAt()));
        }

        return new ChallengeStateView(
                challenge.getId(),
                challenge.getStatus().name(),
                challenge.getStartedAt(),
                challenge.getTotalDays(),
                challenge.getBaseDays(),
                challenge.getExtraDays(),
                completedDays,
                currentDayIndex,
                todayActivity,
                todayCompleted,
                dayViews,
                selectedViews,
                challenge.getPendingFailureDays() > 0,
                challenge.getPendingFailureDays(),
                challenge.isPendingCompletion());
    }

    private ChallengeStateView notStartedView() {
        return new ChallengeStateView(
                null, ChallengeStatus.NOT_STARTED.name(), null,
                0, 0, 0, 0, 0, null, false,
                List.of(), List.of(), false, 0, false);
    }

    ActivityView toView(Activity a) {
        return new ActivityView(a.getId(), a.getTitle(), a.getDescription(),
                a.getCategory(), a.getProofType(), a.getTrackingConfig());
    }

    private String sanitizeZone(String tz) {
        if (tz == null || tz.isBlank()) {
            return "UTC";
        }
        try {
            ZoneId.of(tz);
            return tz;
        } catch (Exception e) {
            return "UTC";
        }
    }

    // Exposed for the scheduled rollover job.
    List<Challenge> activeChallenges() {
        return challengeRepository.findByStatus(ChallengeStatus.ACTIVE);
    }

    @Transactional
    public void evaluateAndNotify(Challenge challenge) {
        int beforeFailures = challenge.getPendingFailureDays();
        boolean beforeCompletion = challenge.isPendingCompletion();
        evaluate(challenge, Instant.now());
        challengeRepository.save(challenge);

        int newMisses = challenge.getPendingFailureDays() - beforeFailures;
        boolean newlyCompleted = challenge.isPendingCompletion() && !beforeCompletion;

        userRepository.findById(challenge.getUserId()).ifPresent(user -> {
            String pushToken = user.getExpoPushToken();
            if (newlyCompleted) {
                pushService.send(pushToken, "You are Liberated \uD83C\uDF3F",
                        "You completed the challenge. Freedom looks good on you.");
            } else if (newMisses > 0) {
                pushService.send(pushToken, "A day was added",
                        "You missed yesterday's task. One more day has been added to your challenge.");
            }
        });
    }
}
