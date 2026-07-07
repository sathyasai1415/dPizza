package com.mislice.domain.cart.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CartItemDto(
    UUID id,
    UUID menuItemId,
    String itemName,
    String size,
    String crust,
    String sauce,
    int quantity,
    BigDecimal unitPrice,
    String notes,
    List<CartItemToppingDto> toppings
) {}
