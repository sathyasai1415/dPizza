package com.mislice.domain.user.dto;

import java.util.UUID;

public record PaymentMethodDto(
        UUID id,
        String brand,
        String last4,
        Integer expMonth,
        Integer expYear,
        boolean isDefault
) {}
