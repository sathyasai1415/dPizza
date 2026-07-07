package com.mislice.domain.coupon;

import com.mislice.common.entity.BaseEntity;
import com.mislice.domain.restaurant.Restaurant;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "coupons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id")
    private Restaurant restaurant;

    @Column(nullable = false, unique = true, length = 40)
    private String code;

    @Column(length = 255)
    private String description;

    @Column(name = "discount_type", nullable = false, length = 20)
    private String discountType; // PERCENT|FIXED|FREE_DELIVERY|BOGO

    @Column(name = "discount_value", nullable = false)
    @Builder.Default
    private BigDecimal discountValue = BigDecimal.ZERO;

    @Column(name = "min_order", nullable = false)
    @Builder.Default
    private BigDecimal minOrder = BigDecimal.ZERO;

    @Column(name = "starts_at")
    private Instant startsAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Column(name = "used_count", nullable = false)
    @Builder.Default
    private int usedCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(length = 20)
    private String provider; // store|doordash|ubereats|grubhub
}
