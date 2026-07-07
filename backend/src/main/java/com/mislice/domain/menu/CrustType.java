package com.mislice.domain.menu;

import com.mislice.common.entity.BaseEntity;
import com.mislice.domain.restaurant.Restaurant;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "crust_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrustType extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Column(nullable = false, length = 60)
    private String name;

    @Column(name = "price_delta", nullable = false)
    @Builder.Default
    private BigDecimal priceDelta = BigDecimal.ZERO;
}
