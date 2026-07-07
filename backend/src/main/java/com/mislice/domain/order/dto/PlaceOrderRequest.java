package com.mislice.domain.order.dto;

import java.math.BigDecimal;

public record PlaceOrderRequest(
    String deliveryType,
    String deliveryProvider,
    String deliveryAddress,
    String deliveryNotes,
    BigDecimal tip,
    String paymentMethod
) {}
