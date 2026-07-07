package com.mislice.domain.menu;

import com.mislice.common.entity.BaseEntity;
import com.mislice.domain.restaurant.Restaurant;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "pizza_sizes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PizzaSize extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Column(nullable = false, length = 40)
    private String name; // Small, Medium, Large, Extra Large

    @Column(name = "price_delta", nullable = false)
    @Builder.Default
    private BigDecimal priceDelta = BigDecimal.ZERO;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;
}
