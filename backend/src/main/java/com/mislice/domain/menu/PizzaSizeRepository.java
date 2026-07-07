package com.mislice.domain.menu;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface PizzaSizeRepository extends JpaRepository<PizzaSize, UUID> {
    List<PizzaSize> findByRestaurantIdAndDeletedFalseOrderBySortOrderAsc(UUID restaurantId);
}
