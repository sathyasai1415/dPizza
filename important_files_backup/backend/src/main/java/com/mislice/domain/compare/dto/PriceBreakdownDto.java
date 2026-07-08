package com.mislice.domain.compare.dto;

import java.math.BigDecimal;

public record PriceBreakdownDto(
    BigDecimal subtotal,
    BigDecimal deliveryFee,
    BigDecimal serviceFee,
    BigDecimal tax,
    BigDecimal tip,
    BigDecimal discount,
    BigDecimal grandTotal
) {}
