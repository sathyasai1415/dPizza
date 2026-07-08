package com.mislice.domain.restaurant.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantDto {
    private UUID id;
    private String name;
    private String slug;
    private String tagline;
    private String description;
    private String phone;
    private String addressLine;
    private String city;
    private String state;
    private String postalCode;
    private Double latitude;
    private Double longitude;
    private String logoUrl;
    private String brandColor;
    private BigDecimal ratingAvg;
    private Integer ratingCount;
    private boolean acceptingOrders;
    private boolean approved;

    // V3 properties
    private String applicationStatus;
    private Instant submittedAt;
    private Instant reviewedAt;
    private String rejectionReason;
    private String reviewNotes;
    private boolean setupComplete;
    private BigDecimal deliveryFee;
    private BigDecimal deliveryRadiusMiles;
    private BigDecimal minimumOrder;
    private Integer averageEtaMinutes;
    private String emoji;
    private String category;
    private String priceRange;
    private String neighborhood;
    private String website;
    private Integer trendScore;
    private boolean featured;
    private boolean newStore;
    private String[] tags;
    private String[] badges;
    private String[] popularItems;
    private String[] deliveryPartners;
}
