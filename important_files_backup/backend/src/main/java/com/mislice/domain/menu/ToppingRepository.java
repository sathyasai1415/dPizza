package com.mislice.domain.menu;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ToppingRepository extends JpaRepository<Topping, UUID> {
    List<Topping> findByRestaurantIdAndDeletedFalse(UUID restaurantId);
}
