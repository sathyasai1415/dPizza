package com.mislice.domain.compare.dto;

import java.time.Instant;
import java.util.UUID;

public record ChainReviewDto(
    UUID id,
    String authorName,
    int rating,
    String comment,
    Instant createdAt
) {}
