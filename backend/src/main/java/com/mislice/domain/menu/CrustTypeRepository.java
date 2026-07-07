package com.mislice.domain.menu;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CrustTypeRepository extends JpaRepository<CrustType, UUID> {
    List<CrustType> findByRestaurantIdAndDeletedFalse(UUID restaurantId);
}
