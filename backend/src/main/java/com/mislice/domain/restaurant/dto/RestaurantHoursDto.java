package com.mislice.domain.restaurant.dto;

import lombok.*;
import java.time.LocalTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantHoursDto {
    private UUID id;
    private UUID restaurantId;
    private short dayOfWeek;
    private LocalTime openTime;
    private LocalTime closeTime;
    private boolean closed;
}
