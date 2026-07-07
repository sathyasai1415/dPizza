package com.mislice.domain.compare.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record ChainDto(
    UUID id,
    String chainKey,
    String name,
    String color,
    String website,
    Map<String, BigDecimal> basePrices,
    Map<String, BigDecimal> crustPremiums,
    BigDecimal toppingPrice,
    BigDecimal storeDeliveryFee,
    String defaultDeliveryType,
    boolean supportsStoreDelivery,
    boolean supportsPickup,
    boolean supportsDoordash,
    boolean supportsUbereats,
    boolean supportsGrubhub,
    String distanceLabel,
    List<ChainReviewDto> reviews
) {}
