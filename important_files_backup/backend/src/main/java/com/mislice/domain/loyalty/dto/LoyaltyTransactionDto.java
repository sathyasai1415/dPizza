package com.mislice.domain.loyalty.dto;

import java.time.Instant;
import java.util.UUID;

public record LoyaltyTransactionDto(
    UUID id,
    String type,
    int points,
    String description,
    Instant createdAt
) {}
