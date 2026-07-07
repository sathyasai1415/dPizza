package com.mislice.domain.menu.dto;

import lombok.*;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryDto {
    private UUID id;
    private UUID restaurantId;
    private String name;
    private int sortOrder;
}
