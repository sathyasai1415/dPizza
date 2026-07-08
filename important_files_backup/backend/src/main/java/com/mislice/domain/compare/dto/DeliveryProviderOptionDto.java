package com.mislice.domain.compare.dto;

import com.mislice.domain.coupon.dto.CouponDto;
import java.util.List;

public record DeliveryProviderOptionDto(
    String providerId,
    String providerName,
    PriceBreakdownDto priceBreakdown,
    int estimatedTimeMin,
    int estimatedTimeMax,
    List<String> badges,
    List<CouponDto> availableCoupons
) {}
