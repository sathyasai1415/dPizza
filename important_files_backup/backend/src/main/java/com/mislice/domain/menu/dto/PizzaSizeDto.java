package com.mislice.domain.menu.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PizzaSizeDto {
    private UUID id;
    private UUID restaurantId;
    private String name;
    private BigDecimal priceDelta;
    private int sortOrder;
}
