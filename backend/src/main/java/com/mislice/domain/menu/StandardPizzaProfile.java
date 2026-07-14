package com.mislice.domain.menu;

import com.mislice.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "standard_pizza_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StandardPizzaProfile extends BaseEntity {

    @Column(nullable = false, unique = true, length = 100)
    private String category; // e.g. "Meat Lovers", "Margherita"

    @Column(name = "core_ingredients", columnDefinition = "text[]")
    private String[] coreIngredients;

    @Column(name = "cheese_type", length = 100)
    private String cheeseType;

    @Column(name = "sauce_type", length = 100)
    private String sauceType;

    @Column(length = 100)
    private String style; // e.g. "Traditional", "Detroit"

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
