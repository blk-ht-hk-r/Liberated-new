package com.liberated.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * A user's 7-day (plus penalty days) liberation challenge. Backend is the
 * source of truth for timing and day math. Holds only booleans/timestamps -
 * never any private proof content.
 */
@Entity
@Table(name = "challenges")
public class Challenge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    private Instant startedAt;

    @Column(nullable = false)
    private int baseDays = 7;

    /** Extra days added as penalty for missed daily tasks. */
    @Column(nullable = false)
    private int extraDays = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChallengeStatus status = ChallengeStatus.NOT_STARTED;

    /**
     * IANA zone id captured at start so 12am rollover is evaluated in the user's
     * local time.
     */
    private String timezone = "UTC";

    private Instant completedAt;

    /**
     * Missed days not yet shown to the user as a failure popup. Incremented by the
     * rollover job / fetch evaluation, reset when the app acknowledges the popup.
     * Kept separate from evaluation so the popup still appears on next open even if
     * the scheduled job processed the miss first.
     */
    @Column(nullable = false)
    private int pendingFailureDays = 0;

    /** Whether a not-yet-shown congratulations popup is queued. */
    @Column(nullable = false)
    private boolean pendingCompletion = false;

    /** Ordered activity ids the user picked (one per day). */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "challenge_activities", joinColumns = @JoinColumn(name = "challenge_id"))
    @OrderColumn(name = "day_index")
    @Column(name = "activity_id")
    private List<Long> selectedActivityIds = new ArrayList<>();

    @OneToMany(mappedBy = "challenge", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("dayIndex ASC")
    private List<DayLog> dayLogs = new ArrayList<>();

    public int getTotalDays() {
        return baseDays + extraDays;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public int getBaseDays() {
        return baseDays;
    }

    public void setBaseDays(int baseDays) {
        this.baseDays = baseDays;
    }

    public int getExtraDays() {
        return extraDays;
    }

    public void setExtraDays(int extraDays) {
        this.extraDays = extraDays;
    }

    public void addPenaltyDay() {
        this.extraDays++;
    }

    public ChallengeStatus getStatus() {
        return status;
    }

    public void setStatus(ChallengeStatus status) {
        this.status = status;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }

    public int getPendingFailureDays() {
        return pendingFailureDays;
    }

    public void setPendingFailureDays(int pendingFailureDays) {
        this.pendingFailureDays = pendingFailureDays;
    }

    public boolean isPendingCompletion() {
        return pendingCompletion;
    }

    public void setPendingCompletion(boolean pendingCompletion) {
        this.pendingCompletion = pendingCompletion;
    }

    public List<Long> getSelectedActivityIds() {
        return selectedActivityIds;
    }

    public void setSelectedActivityIds(List<Long> selectedActivityIds) {
        this.selectedActivityIds = selectedActivityIds;
    }

    public List<DayLog> getDayLogs() {
        return dayLogs;
    }
}
