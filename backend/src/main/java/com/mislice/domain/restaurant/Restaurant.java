package com.mislice.domain.restaurant;

import com.mislice.common.entity.BaseEntity;
import com.mislice.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "restaurants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Restaurant extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(nullable = false, unique = true, length = 180)
    private String slug;

    @Column(length = 255)
    private String tagline;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 30)
    private String phone;

    @Column(name = "address_line", length = 255)
    private String addressLine;

    @Column(nullable = false, length = 120)
    @Builder.Default
    private String city = "Detroit";

    @Column(nullable = false, length = 2)
    @Builder.Default
    private String state = "MI";

    @Column(name = "postal_code", length = 12)
    private String postalCode;

    private Double latitude;
    private Double longitude;

    @Column(name = "logo_url", length = 512)
    private String logoUrl;

    @Column(name = "brand_color", length = 32)
    private String brandColor;

    @Column(name = "rating_avg", nullable = false)
    @Builder.Default
    private BigDecimal ratingAvg = BigDecimal.ZERO;

    @Column(name = "rating_count", nullable = false)
    @Builder.Default
    private Integer ratingCount = 0;

    @Column(name = "accepting_orders", nullable = false)
    @Builder.Default
    private boolean acceptingOrders = true;

    @Column(name = "is_approved", nullable = false)
    @Builder.Default
    private boolean approved = false;

    // V3 Alignments
    @Column(name = "application_status", nullable = false, length = 32)
    @Builder.Default
    private String applicationStatus = "DRAFT"; // DRAFT|SUBMITTED|UNDER_REVIEW|APPROVED|REJECTED|SUSPENDED

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "review_notes", length = 500)
    private String reviewNotes;

    @Column(name = "is_setup_complete", nullable = false)
    @Builder.Default
    private boolean setupComplete = false;

    @Column(name = "delivery_fee", nullable = false)
    @Builder.Default
    private BigDecimal deliveryFee = BigDecimal.ZERO;

    @Column(name = "delivery_radius_miles")
    private BigDecimal deliveryRadiusMiles;

    @Column(name = "minimum_order", nullable = false)
    @Builder.Default
    private BigDecimal minimumOrder = BigDecimal.ZERO;

    @Column(name = "average_eta_minutes")
    private Integer averageEtaMinutes;

    @Column(nullable = false, length = 16)
    @Builder.Default
    private String emoji = "🍕";

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String category = "LOCAL"; // CHAIN|LOCAL|ARTISAN|VEGAN|PREMIUM

    @Column(name = "price_range", nullable = false, length = 4)
    @Builder.Default
    private String priceRange = "$$";

    @Column(length = 120)
    private String neighborhood;

    @Column(length = 255)
    private String website;

    @Column(name = "trend_score", nullable = false)
    @Builder.Default
    private Integer trendScore = 0;

    @Column(name = "is_featured", nullable = false)
    @Builder.Default
    private boolean featured = false;

    @Column(name = "is_new", nullable = false)
    @Builder.Default
    private boolean newStore = false;

    @Column(name = "tags", columnDefinition = "text[]")
    private String[] tags;

    @Column(name = "badges", columnDefinition = "text[]")
    private String[] badges;

    @Column(name = "popular_items", columnDefinition = "text[]")
    private String[] popularItems;

    @Column(name = "delivery_partners", columnDefinition = "text[]")
    private String[] deliveryPartners;
}
