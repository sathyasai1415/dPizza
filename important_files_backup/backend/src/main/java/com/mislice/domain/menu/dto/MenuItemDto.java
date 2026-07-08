package com.mislice.domain.menu.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuItemDto {
    private UUID id;
    private UUID restaurantId;
    private UUID categoryId;
    private String name;
    private String description;
    private BigDecimal basePrice;
    private String photoUrl;
    private String[] tags;
    private String itemType;
    private boolean available;
    private Integer stockQty;
}
