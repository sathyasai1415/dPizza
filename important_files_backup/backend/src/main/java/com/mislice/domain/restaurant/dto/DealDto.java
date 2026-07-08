package com.mislice.domain.restaurant.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DealDto {
    private UUID id;
    private UUID restaurantId;
    private String title;
    private String description;
    private BigDecimal originalPrice;
    private BigDecimal discountedPrice;
    private String imageUrl;
    private String deliveryType;
    private Instant startsAt;
    private Instant expiresAt;
    private boolean active;
}
