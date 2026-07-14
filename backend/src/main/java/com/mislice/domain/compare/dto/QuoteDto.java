package com.mislice.domain.compare.dto;

import java.math.BigDecimal;
import java.util.List;

public record QuoteDto(
    String chainId,
    String chainName,
    String logoColor,
    BigDecimal basePrice,
    BigDecimal toppingsCost,
    double rating,
    List<ChainReviewDto> reviews,
    String distance,
    List<String> badges,
    List<DeliveryProviderOptionDto> deliveryOptions,
    String cheapestOptionId,
    String fastestOptionId,
    String bestValueOptionId,
    String nativeMenuName,
    String nativeSize
) {}
