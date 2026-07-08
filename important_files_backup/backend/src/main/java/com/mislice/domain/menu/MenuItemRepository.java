package com.mislice.domain.menu;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface MenuItemRepository extends JpaRepository<MenuItem, UUID> {
    List<MenuItem> findByRestaurantIdAndDeletedFalse(UUID restaurantId);
    List<MenuItem> findByCategoryIdAndDeletedFalse(UUID categoryId);
}
