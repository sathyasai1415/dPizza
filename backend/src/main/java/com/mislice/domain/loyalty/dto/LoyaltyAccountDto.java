package com.mislice.domain.loyalty.dto;

import java.util.UUID;

public record LoyaltyAccountDto(
    UUID id,
    int points,
    int lifetimePoints,
    String referralCode
) {}
