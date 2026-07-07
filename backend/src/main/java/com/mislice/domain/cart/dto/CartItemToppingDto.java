package com.mislice.domain.cart.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record CartItemToppingDto(
    UUID toppingId,
    String toppingName,
    BigDecimal price
) {}
