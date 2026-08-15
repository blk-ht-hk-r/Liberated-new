package com.liberated.challenge;

import com.liberated.challenge.dto.ChallengeDtos.*;
import com.liberated.domain.Activity;
import com.liberated.repository.ActivityRepository;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ChallengeController {

    private final ChallengeService challengeService;
    private final ActivityRepository activityRepository;

    public ChallengeController(ChallengeService challengeService,
            ActivityRepository activityRepository) {
        this.challengeService = challengeService;
        this.activityRepository = activityRepository;
    }

    /** Public catalog used by the Pill selector. */
    @GetMapping("/activities")
    public List<ActivityView> activities() {
        return activityRepository.findAll().stream()
                .map(this::toView)
                .toList();
    }

    @GetMapping("/challenge")
    public ChallengeStateView state(@AuthenticationPrincipal Long userId) {
        return challengeService.getState(userId);
    }

    @PostMapping("/challenge/start")
    public ChallengeStateView start(@AuthenticationPrincipal Long userId,
            @Valid @RequestBody StartChallengeRequest req) {
        return challengeService.startChallenge(userId, req);
    }

    @PostMapping("/challenge/complete-today")
    public ChallengeStateView completeToday(@AuthenticationPrincipal Long userId) {
        return challengeService.completeToday(userId);
    }

    @PostMapping("/challenge/acknowledge-popups")
    public ChallengeStateView acknowledge(@AuthenticationPrincipal Long userId) {
        return challengeService.acknowledgePopups(userId);
    }

    @PostMapping("/challenge/change-activity")
    public ChallengeStateView changeActivity(@AuthenticationPrincipal Long userId,
            @RequestBody ChangeActivityRequest req) {
        return challengeService.changeTodayActivity(userId, req.activityId());
    }

    private ActivityView toView(Activity a) {
        return new ActivityView(a.getId(), a.getTitle(), a.getDescription(),
                a.getCategory(), a.getProofType(), a.getTrackingConfig());
    }
}
