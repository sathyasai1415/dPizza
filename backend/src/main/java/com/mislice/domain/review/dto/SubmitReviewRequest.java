package com.mislice.domain.review.dto;

import java.util.UUID;

public record SubmitReviewRequest(
    UUID restaurantId,
    UUID orderId,
    short rating,
    String comment
) {}
