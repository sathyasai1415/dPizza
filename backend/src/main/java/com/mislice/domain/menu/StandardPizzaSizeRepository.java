package com.mislice.domain.menu;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StandardPizzaSizeRepository extends JpaRepository<StandardPizzaSize, UUID> {
    Optional<StandardPizzaSize> findByCategoryIgnoreCase(String category);
}
