package com.mislice.domain.payout.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayoutDto {
    private UUID id;
    private UUID restaurantId;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private int orderCount;
    private BigDecimal grossRevenue;
    private BigDecimal platformFee;
    private BigDecimal netPayout;
    private String status;
    private Instant paidAt;
    private Instant createdAt;
}
