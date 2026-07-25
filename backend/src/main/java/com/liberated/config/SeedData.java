package com.liberated.config;

import com.liberated.domain.Activity;
import com.liberated.domain.Category;
import com.liberated.domain.ProofType;
import com.liberated.repository.ActivityRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Seeds the activity catalog on first run (one time, if the table is empty).
 */
@Configuration
public class SeedData {

        @Bean
        CommandLineRunner seedActivities(ActivityRepository repo) {
                return args -> {
                        if (repo.count() > 0) {
                                return;
                        }
                        repo.saveAll(List.of(
                                        // PHYSICAL
                                        new Activity("Go for a workout", "Hit the gym or train at home.",
                                                        Category.PHYSICAL, ProofType.PHOTO, "{}"),
                                        new Activity("100 squats", "Do 100 squats through the day.",
                                                        Category.PHYSICAL, ProofType.COUNTER,
                                                        "{\"counterTarget\":100}"),
                                        new Activity("Cold shower", "Take a cold shower.",
                                                        Category.PHYSICAL, ProofType.PHOTO, "{}"),
                                        new Activity("Walk 30 minutes", "Get outside for a 30 minute walk.",
                                                        Category.PHYSICAL, ProofType.PHOTO, "{}"),

                                        // SPIRITUAL
                                        new Activity("Meditate 10 minutes", "Sit in stillness for 10 minutes.",
                                                        Category.SPIRITUAL, ProofType.TIMER, "{\"timerTargetMin\":10}"),
                                        new Activity("Pray", "Spend a few minutes in prayer.",
                                                        Category.SPIRITUAL, ProofType.TIMER, "{\"timerTargetMin\":5}"),
                                        new Activity("Read a book", "Read a chapter of a real book.",
                                                        Category.SPIRITUAL, ProofType.PHOTO, "{}"),

                                        // CAREER / BUSINESS
                                        new Activity("Deep work block", "One focused, distraction-free work block.",
                                                        Category.CAREER, ProofType.TEXT_ENTRY, "{}"),
                                        new Activity("Help a customer", "Do something that genuinely helps a customer.",
                                                        Category.CAREER, ProofType.TEXT_ENTRY, "{}"),
                                        new Activity("Move money forward", "Take one concrete step toward income.",
                                                        Category.CAREER, ProofType.TEXT_ENTRY, "{}"),

                                        // RELATIONAL
                                        new Activity("Talk to 3 old friends", "Reach out to 3 people you miss.",
                                                        Category.RELATIONAL, ProofType.NAMED_LIST, "{\"listSize\":3}"),
                                        new Activity("Call someone you love", "Call a person you care about.",
                                                        Category.RELATIONAL, ProofType.NAMED_LIST, "{\"listSize\":1}"),
                                        new Activity("An act of love", "Do something kind for someone.",
                                                        Category.RELATIONAL, ProofType.NAMED_LIST, "{\"listSize\":1}"),

                                        // CONTENT
                                        new Activity("Write something", "Write a page, a post, or an idea.",
                                                        Category.CONTENT, ProofType.PHOTO, "{}"),
                                        new Activity("Create or produce", "Make something and capture it.",
                                                        Category.CONTENT, ProofType.PHOTO, "{}"),

                                        // PROCESSING
                                        new Activity("Sit with a feeling", "Notice a feeling and reflect on it.",
                                                        Category.PROCESSING, ProofType.TEXT_ENTRY, "{}"),
                                        new Activity("Understand a reaction",
                                                        "Write about why you reacted the way you did.",
                                                        Category.PROCESSING, ProofType.TEXT_ENTRY, "{}")));
                };
        }
}
