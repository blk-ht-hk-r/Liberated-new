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
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
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
 * <li>Challenge is COMPLETED at the end of the day on which the final
 * ({@code baseDays}-th) task is completed - i.e. once the local date has rolled
 * past that day. Finishing the last task does not complete the challenge
 * instantly.</li>
 * </ul>
 * No private proof content is ever stored here - only booleans/timestamps.
 */
@Service
public class ChallengeService {

    private final ChallengeRepository challengeRepository;
    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;
    private final PushService pushService;
    private volatile Instant testNowOverride = null;

    public ChallengeService(ChallengeRepository challengeRepository,
            ActivityRepository activityRepository,
            UserRepository userRepository,
            PushService pushService) {
        this.challengeRepository = challengeRepository;
        this.activityRepository = activityRepository;
        this.userRepository = userRepository;
        this.pushService = pushService;
    }

    // --- test clock (dev only) ---------------------------------------------
    // When set (via the local-profile dev endpoint), the whole service treats
    // this instant as "now", so every day-math path (evaluate, completeToday,
    // rollover, buildState) can be advanced day-by-day without touching the OS
    // clock. Null in production => real time. Volatile: set from a request
    // thread, read by the scheduler thread.

    /** Current time, honoring the dev test-clock override when present. */
    private Instant now() {
        return testNowOverride != null ? testNowOverride : Instant.now();
    }

    /** Local date "today" in the given zone, honoring the test clock. */
    private LocalDate today(ZoneId zone) {
        return now().atZone(zone).toLocalDate();
    }

    /** Dev only: pin "today" to the given date (noon UTC). Null clears it. */
    public void setTestDate(LocalDate date) {
        this.testNowOverride = (date == null)
                ? null
                : date.atTime(12, 0).atZone(ZoneOffset.UTC).toInstant();
    }

    /** Dev only: current override date, or null when running on the real clock. */
    public LocalDate getTestDate() {
        return testNowOverride == null
                ? null
                : testNowOverride.atZone(ZoneOffset.UTC).toLocalDate();
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
        challenge.setStartedAt(now());
        challenge.setBaseDays(ids.size());
        challenge.setStatus(ChallengeStatus.ACTIVE);
        challenge.setTimezone(sanitizeZone(req.timezone()));
        challenge.getSelectedActivityIds().addAll(ids);

        // Seed day 0 for the start date.
        LocalDate startDate = today(ZoneId.of(challenge.getTimezone()));
        challenge.getDayLogs().add(new DayLog(challenge, 0, startDate));

        challengeRepository.save(challenge);
        return buildState(challenge, now(), false);
    }

    @Transactional
    public ChallengeStateView getState(Long userId) {
        Challenge challenge = challengeRepository.findFirstByUserIdOrderByIdDesc(userId)
                .orElse(null);
        if (challenge == null) {
            return notStartedView();
        }
        evaluate(challenge, now());
        challengeRepository.save(challenge);
        return buildState(challenge, now(), false);
    }

    @Transactional
    public ChallengeStateView completeToday(Long userId) {
        Challenge challenge = requireActive(userId);
        Instant now = now();
        evaluate(challenge, now);

        ZoneId zone = ZoneId.of(challenge.getTimezone());
        LocalDate today = today(zone);
        DayLog todayLog = ensureDayLog(challenge, today);

        if (!todayLog.isCompleted()) {
            todayLog.setCompleted(true);
            todayLog.setCompletedAt(now);
        }

        // Completion is deferred to end-of-day (see evaluate): finishing the
        // final task does NOT immediately complete the challenge. The rollover
        // job / next fetch after local midnight flips the status to COMPLETED.
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
        return buildState(challenge, now(), false);
    }

    @Transactional
    public ChallengeStateView changeTodayActivity(Long userId, Long activityId) {
        Challenge challenge = requireActive(userId);
        Instant now = now();
        evaluate(challenge, now);

        ZoneId zone = ZoneId.of(challenge.getTimezone());
        LocalDate today = today(zone);
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

        // End-of-day completion: once all base tasks are done, the challenge
        // completes only after the local day on which the final task was logged
        // has ended (today has rolled past that day). This runs on fetch and on
        // the hourly rollover job, so it fires right after local midnight.
        if (countCompleted(challenge) >= challenge.getBaseDays()) {
            LocalDate lastCompletedDate = challenge.getDayLogs().stream()
                    .filter(DayLog::isCompleted)
                    .map(DayLog::getDueDate)
                    .max(Comparator.naturalOrder())
                    .orElse(null);
            if (lastCompletedDate != null && today.isAfter(lastCompletedDate)) {
                challenge.setStatus(ChallengeStatus.COMPLETED);
                if (challenge.getCompletedAt() == null) {
                    challenge.setCompletedAt(now);
                    challenge.setPendingCompletion(true);
                }
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

        boolean todayCompleted = challenge.getDayLogs().stream()
                .anyMatch(dl -> dl.getDueDate().equals(today) && dl.isCompleted());

        // Progress bar tracks calendar days elapsed (capped to the base window).
        int currentDayIndex = todayLog != null
                ? Math.min(todayLog.getDayIndex(), challenge.getBaseDays() - 1)
                : Math.min(completedDays, challenge.getBaseDays() - 1);

        // Uncapped elapsed-day count (1-based) for the progress bar, capped only
        // at totalDays. Unlike currentDayIndex (pinned to baseDays for activity
        // selection), this advances through penalty-extended days so the bar
        // reads e.g. 8/9 instead of freezing at 6/9.
        int daysElapsed = todayLog != null
                ? Math.min(todayLog.getDayIndex(), challenge.getTotalDays())
                : Math.min(completedDays, challenge.getTotalDays());

        // Today's task is the NEXT UNCOMPLETED activity - so a skipped day keeps
        // showing the same task the user skipped until they complete it, and
        // penalty-extended days never repeat a later activity. If today is
        // already completed, keep showing the task they just finished.
        int activityIdx = todayCompleted
                ? Math.min(completedDays - 1, challenge.getBaseDays() - 1)
                : Math.min(completedDays, challenge.getBaseDays() - 1);

        ActivityView todayActivity = null;
        if (challenge.getStatus() == ChallengeStatus.ACTIVE
                && activityIdx >= 0
                && activityIdx < selectedViews.size()) {
            todayActivity = selectedViews.get(activityIdx);
        }

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
                daysElapsed,
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
                0, 0, 0, 0, 0, 0, null, false,
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
        evaluate(challenge, now());
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
