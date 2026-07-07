package com.mislice.domain.restaurant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RestaurantRepository extends JpaRepository<Restaurant, UUID> {

    Optional<Restaurant> findBySlugAndDeletedFalse(String slug);

    List<Restaurant> findByApprovedTrueAndDeletedFalse();

    @Query("SELECT r FROM Restaurant r WHERE LOWER(r.city) = LOWER(:city) AND r.approved = true AND r.deleted = false")
    List<Restaurant> findByCityAndApprovedTrueAndDeletedFalse(@Param("city") String city);

    List<Restaurant> findByOwnerIdAndDeletedFalse(UUID ownerId);

    List<Restaurant> findByDeletedFalse();

    @Query("SELECT DISTINCT r.city FROM Restaurant r WHERE r.approved = true AND r.deleted = false")
    List<String> findDistinctCities();
}
