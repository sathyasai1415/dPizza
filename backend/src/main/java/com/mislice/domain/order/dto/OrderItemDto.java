package com.mislice.domain.order.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderItemDto(
    UUID id,
    UUID menuItemId,
    String itemName,
    String size,
    String crust,
    String sauce,
    String[] toppings,
    int quantity,
    BigDecimal unitPrice,
    BigDecimal lineTotal
) {}
