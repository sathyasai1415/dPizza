package com.mislice.domain.order.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OrderDto(
    UUID id,
    String orderNumber,
    UUID userId,
    UUID restaurantId,
    String restaurantName,
    String status,
    String deliveryType,
    String deliveryProvider,
    String deliveryAddress,
    String deliveryNotes,
    BigDecimal subtotal,
    BigDecimal deliveryFee,
    BigDecimal providerServiceFee,
    BigDecimal platformServiceFee,
    BigDecimal tax,
    BigDecimal tip,
    BigDecimal discount,
    BigDecimal total,
    String couponCode,
    Integer estimatedEtaMin,
    Integer estimatedEtaMax,
    Instant placedAt,
    String paymentMethod,
    String paymentStatus,
    String qrToken,
    Instant qrScannedAt,
    List<OrderItemDto> items
) {}
