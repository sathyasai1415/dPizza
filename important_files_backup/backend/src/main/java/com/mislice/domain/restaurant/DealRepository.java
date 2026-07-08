package com.mislice.domain.restaurant;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface DealRepository extends JpaRepository<Deal, UUID> {
    List<Deal> findByRestaurantIdAndDeletedFalse(UUID restaurantId);
    List<Deal> findByActiveTrueAndDeletedFalse();
}
