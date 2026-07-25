package com.liberated.repository;

import com.liberated.domain.Challenge;
import com.liberated.domain.ChallengeStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChallengeRepository extends JpaRepository<Challenge, Long> {

    /** Latest challenge for a user (NOT_STARTED / ACTIVE / COMPLETED). */
    Optional<Challenge> findFirstByUserIdOrderByIdDesc(Long userId);

    List<Challenge> findByStatus(ChallengeStatus status);
}
