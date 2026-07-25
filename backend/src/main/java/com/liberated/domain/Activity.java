package com.liberated.domain;

import jakarta.persistence.*;

/**
 * A selectable task. Each activity belongs to a {@link Category} and declares a
 * {@link ProofType} that determines the on-device tracking form.
 * {@code trackingConfig}
 * is a small JSON blob for type-specific settings, e.g. {"listSize":3} or
 * {"timerTargetMin":10} or {"counterTarget":20}.
 */
@Entity
@Table(name = "activities")
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProofType proofType;

    @Column(length = 500)
    private String trackingConfig;

    protected Activity() {
    }

    public Activity(String title, String description, Category category,
            ProofType proofType, String trackingConfig) {
        this.title = title;
        this.description = description;
        this.category = category;
        this.proofType = proofType;
        this.trackingConfig = trackingConfig;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public Category getCategory() {
        return category;
    }

    public ProofType getProofType() {
        return proofType;
    }

    public String getTrackingConfig() {
        return trackingConfig;
    }
}
