package com.mislice.domain.restaurant.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryZoneDto {
    private UUID id;
    private UUID restaurantId;
    private String name;
    private String postalCode;
    private BigDecimal radiusMiles;
    private BigDecimal deliveryFee;
    private BigDecimal minOrder;
}
