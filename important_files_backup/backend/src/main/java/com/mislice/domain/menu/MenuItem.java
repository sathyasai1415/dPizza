package com.mislice.domain.menu;

import com.mislice.common.entity.BaseEntity;
import com.mislice.domain.restaurant.Restaurant;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "menu_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "base_price", nullable = false)
    private BigDecimal basePrice;

    @Column(name = "photo_url", length = 512)
    private String photoUrl;

    @Column(name = "tags", columnDefinition = "text[]")
    private String[] tags;

    @Column(name = "item_type", nullable = false, length = 32)
    @Builder.Default
    private String itemType = "PIZZA"; // PIZZA|SIDE|DRINK|DESSERT|TOPPING|COMBO

    @Column(nullable = false)
    @Builder.Default
    private boolean available = true;

    @Column(name = "stock_qty")
    private Integer stockQty;
}
