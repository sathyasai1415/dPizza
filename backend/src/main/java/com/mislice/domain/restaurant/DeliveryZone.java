package com.mislice.domain.restaurant;

import com.mislice.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "delivery_zones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryZone extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "postal_code", length = 12)
    private String postalCode;

    @Column(name = "radius_miles")
    private BigDecimal radiusMiles;

    @Column(name = "delivery_fee", nullable = false)
    @Builder.Default
    private BigDecimal deliveryFee = BigDecimal.ZERO;

    @Column(name = "min_order", nullable = false)
    @Builder.Default
    private BigDecimal minOrder = BigDecimal.ZERO;
}
