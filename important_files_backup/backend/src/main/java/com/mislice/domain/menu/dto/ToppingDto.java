package com.mislice.domain.menu.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ToppingDto {
    private UUID id;
    private UUID restaurantId;
    private String name;
    private String category;
    private BigDecimal price;
    private boolean available;
}
