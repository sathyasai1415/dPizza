package com.mislice.domain.coupon.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record CouponDto(
    UUID id,
    UUID restaurantId,
    String code,
    String description,
    String discountType,
    BigDecimal discountValue,
    BigDecimal minOrder,
    boolean active,
    String provider
) {}
