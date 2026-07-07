package com.mislice.domain.restaurant;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface DeliveryZoneRepository extends JpaRepository<DeliveryZone, UUID> {
    List<DeliveryZone> findByRestaurantIdAndDeletedFalse(UUID restaurantId);
}
