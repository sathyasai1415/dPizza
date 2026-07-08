package com.mislice.domain.restaurant;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface RestaurantHoursRepository extends JpaRepository<RestaurantHours, UUID> {
    List<RestaurantHours> findByRestaurantIdAndDeletedFalse(UUID restaurantId);
}
