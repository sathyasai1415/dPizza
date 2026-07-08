package com.mislice.domain.menu;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {
    List<Category> findByRestaurantIdAndDeletedFalseOrderBySortOrderAsc(UUID restaurantId);
}
