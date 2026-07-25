package com.liberated.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

/**
 * One day of a challenge. Records ONLY whether the day's task was completed and
 * when - never the private proof content, which stays encrypted on the device.
 */
@Entity
@Table(name = "day_logs")
public class DayLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "challenge_id", nullable = false)
    private Challenge challenge;

    /** 0-based index into the challenge's selected activity list. */
    @Column(nullable = false)
    private int dayIndex;

    /** The local calendar date this day's task is due (challenge timezone). */
    @Column(nullable = false)
    private LocalDate dueDate;

    @Column(nullable = false)
    private boolean completed = false;

    private Instant completedAt;

    /** Whether the rollover job has already evaluated a miss for this day. */
    @Column(nullable = false)
    private boolean missedEvaluated = false;

    protected DayLog() {
    }

    public DayLog(Challenge challenge, int dayIndex, LocalDate dueDate) {
        this.challenge = challenge;
        this.dayIndex = dayIndex;
        this.dueDate = dueDate;
    }

    public Long getId() {
        return id;
    }

    public Challenge getChallenge() {
        return challenge;
    }

    public int getDayIndex() {
        return dayIndex;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }

    public boolean isMissedEvaluated() {
        return missedEvaluated;
    }

    public void setMissedEvaluated(boolean missedEvaluated) {
        this.missedEvaluated = missedEvaluated;
    }
}
