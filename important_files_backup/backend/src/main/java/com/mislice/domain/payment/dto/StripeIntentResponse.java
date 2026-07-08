package com.mislice.domain.payment.dto;

import java.math.BigDecimal;

public record StripeIntentResponse(
    String clientSecret,
    String paymentIntentId,
    BigDecimal amount
) {}
