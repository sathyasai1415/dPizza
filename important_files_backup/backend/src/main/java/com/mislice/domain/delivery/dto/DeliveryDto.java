package com.mislice.domain.delivery.dto;

import java.time.Instant;
import java.util.UUID;

public record DeliveryDto(
    UUID id,
    UUID orderId,
    String driverName,
    String status,
    Instant assignedAt,
    Instant pickedUpAt,
    Instant deliveredAt,
    Integer etaMinutes
) {}
