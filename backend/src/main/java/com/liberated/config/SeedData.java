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
                                        new Activity("50 squats", "Do 50 squats through the day.",
                                                        Category.PHYSICAL, ProofType.COUNTER,
                                                        "{\"counterTarget\":50,\"counterLabel\":\"Squats completed now\"}"),
                                        new Activity("30 push-ups", "Complete 30 push-ups through the day.",
                                                        Category.PHYSICAL, ProofType.COUNTER,
                                                        "{\"counterTarget\":30,\"counterLabel\":\"Push-ups completed now\"}"),
                                        new Activity("Cold shower", "Take a cold shower.",
                                                        Category.PHYSICAL, ProofType.PHOTO, "{}"),
                                        new Activity("Walk 30 minutes", "Get outside for a 30 minute walk.",
                                                        Category.PHYSICAL, ProofType.PHOTO, "{}"),
                                        new Activity("Run for 30 minutes",
                                                        "Run for 30 minutes and add a photo or running-app screenshot.",
                                                        Category.PHYSICAL, ProofType.PHOTO, "{}"),
                                        new Activity("Declutter one small space",
                                                        "Organize a drawer, shelf, desk, or another small space.",
                                                        Category.PHYSICAL, ProofType.PHOTO, "{}"),

                                        // SPIRITUAL
                                        new Activity("Meditate 10 minutes", "Sit in stillness for 10 minutes.",
                                                        Category.SPIRITUAL, ProofType.TIMER, "{\"timerTargetMin\":10}"),
                                        new Activity("Pray", "Spend a few minutes in prayer.",
                                                        Category.SPIRITUAL, ProofType.TIMER, "{\"timerTargetMin\":5}"),
                                        new Activity("Read a book", "Read a chapter of a real book.",
                                                        Category.SPIRITUAL, ProofType.PHOTO, "{}"),
                                        new Activity("Visit a place of worship",
                                                        "Spend meaningful time at a place of worship.",
                                                        Category.SPIRITUAL, ProofType.PHOTO, "{}"),
                                        new Activity("Listen to a full album",
                                                        "Listen to an album from beginning to end without scrolling.",
                                                        Category.SPIRITUAL, ProofType.PHOTO, "{}"),

                                        // CAREER / BUSINESS
                                        new Activity("Deep work block", "One focused, distraction-free work block.",
                                                        Category.CAREER, ProofType.TEXT_ENTRY, "{}"),
                                        new Activity("Organize your finances",
                                                        "Review and organize your budget, bills, savings, or spending.",
                                                        Category.CAREER, ProofType.HONOR_TOGGLE, "{}"),
                                        new Activity("Learn about investing",
                                                        "Study one investing concept and record what you learned.",
                                                        Category.CAREER, ProofType.TEXT_ENTRY, "{}"),
                                        new Activity("Set your yearly goals",
                                                        "Write down your goals and the next steps for reaching them.",
                                                        Category.CAREER, ProofType.PHOTO, "{}"),
                                        new Activity("Improve your resume or portfolio",
                                                        "Make one meaningful improvement to your resume or portfolio.",
                                                        Category.CAREER, ProofType.PHOTO, "{}"),
                                        new Activity("Learn something for 30 minutes",
                                                        "Spend 30 focused minutes learning a useful skill or topic.",
                                                        Category.CAREER, ProofType.TIMER, "{\"timerTargetMin\":30}"),

                                        // RELATIONAL
                                        new Activity("Reconnect with one old friend",
                                                        "Reach out to one person you miss.",
                                                        Category.RELATIONAL, ProofType.NAMED_LIST, "{\"listSize\":1}"),
                                        new Activity("Make plans with someone",
                                                        "Arrange a walk, meal, call, or meetup with someone.",
                                                        Category.RELATIONAL, ProofType.NAMED_LIST, "{\"listSize\":1}"),

                                        // CREATIVITY
                                        new Activity("Make a dish you've wanted to try",
                                                        "Cook a dish you have been meaning to make.",
                                                        Category.CREATIVITY, ProofType.PHOTO, "{}"),
                                        new Activity("Make a sketch", "Draw something you can see or imagine.",
                                                        Category.CREATIVITY, ProofType.PHOTO, "{}"),
                                        new Activity("Spend 30 minutes on a hobby",
                                                        "Give an offline hobby your full attention for 30 minutes.",
                                                        Category.CREATIVITY, ProofType.TIMER,
                                                        "{\"timerTargetMin\":30}"),

                                        // PROCESSING
                                        new Activity("Sit with a feeling", "Notice a feeling and reflect on it.",
                                                        Category.PROCESSING, ProofType.TEXT_ENTRY, "{}"),
                                        new Activity("Journal about your day",
                                                        "Write about your day in a private journal.",
                                                        Category.PROCESSING, ProofType.PHOTO, "{}"),
                                        new Activity("Reflect on your day or week",
                                                        "Review your activities and notice what made you happier or unhappier.",
                                                        Category.PROCESSING, ProofType.TEXT_ENTRY, "{}")));
                };
        }
}
