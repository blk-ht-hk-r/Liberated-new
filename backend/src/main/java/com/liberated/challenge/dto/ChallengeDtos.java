package com.liberated.challenge.dto;

import com.liberated.domain.Category;
import com.liberated.domain.ProofType;
import jakarta.validation.constraints.NotEmpty;

import java.time.Instant;
import java.util.List;

public class ChallengeDtos {

        private ChallengeDtos() {
        }

        public record ActivityView(
                        Long id,
                        String title,
                        String description,
                        Category category,
                        ProofType proofType,
                        String trackingConfig) {
        }

        public record StartChallengeRequest(
                        @NotEmpty List<Long> activityIds,
                        String timezone) {
        }

        public record CompleteDayRequest(
                        int dayIndex) {
        }

        public record DayView(
                        int dayIndex,
                        String dueDate,
                        boolean completed,
                        Instant completedAt) {
        }

        /** Full challenge state the mobile home screen renders from. */
        public record ChallengeStateView(
                        Long challengeId,
                        String status,
                        Instant startedAt,
                        int totalDays,
                        int baseDays,
                        int extraDays,
                        int completedDays,
                        int currentDayIndex,
                        ActivityView todayActivity,
                        boolean todayCompleted,
                        List<DayView> days,
                        List<ActivityView> selectedActivities,
                        boolean showFailurePopup,
                        int missedCountJustEvaluated,
                        boolean showCompletionPopup) {
        }
}
