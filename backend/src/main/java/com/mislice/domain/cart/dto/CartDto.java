package com.mislice.domain.cart.dto;

import java.util.List;
import java.util.UUID;

public record CartDto(
    UUID id,
    UUID userId,
    UUID restaurantId,
    String restaurantName,
    String couponCode,
    List<CartItemDto> items
) {}
