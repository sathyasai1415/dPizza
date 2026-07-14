package com.mislice.domain.menu;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface MenuItemRepository extends JpaRepository<MenuItem, UUID> {
    List<MenuItem> findByRestaurantIdAndDeletedFalse(UUID restaurantId);
    List<MenuItem> findByCategoryIdAndDeletedFalse(UUID categoryId);
    List<MenuItem> findByStandardProfileIdAndDeletedFalse(UUID standardProfileId);

    @Query("SELECT m FROM MenuItem m WHERE m.itemType = 'PIZZA' AND m.standardProfile IS NULL AND m.deleted = false")
    List<MenuItem> findUnmappedPizzas(Pageable pageable);
}
