package com.mislice.domain.review.dto;

import java.time.Instant;
import java.util.UUID;

public record ReviewDto(
    UUID id,
    String userFullName,
    short rating,
    String comment,
    Instant createdAt
) {}
