package com.mislice.domain.compare;

import com.mislice.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "chains")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Chain extends BaseEntity {

    @Column(name = "chain_key", nullable = false, unique = true, length = 60)
    private String chainKey;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 60)
    private String color;

    @Column(length = 255)
    private String website;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "base_prices", columnDefinition = "jsonb", nullable = false)
    private Map<String, BigDecimal> basePrices;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "crust_premiums", columnDefinition = "jsonb", nullable = false)
    private Map<String, BigDecimal> crustPremiums;

    @Column(name = "topping_price", nullable = false)
    @Builder.Default
    private BigDecimal toppingPrice = BigDecimal.ZERO;

    @Column(name = "store_delivery_fee", nullable = false)
    @Builder.Default
    private BigDecimal storeDeliveryFee = BigDecimal.ZERO;

    @Column(name = "default_delivery_type", nullable = false, length = 32)
    @Builder.Default
    private String defaultDeliveryType = "STORE_DELIVERY";

    @Column(name = "supports_store_delivery", nullable = false)
    @Builder.Default
    private boolean supportsStoreDelivery = false;

    @Column(name = "supports_pickup", nullable = false)
    @Builder.Default
    private boolean supportsPickup = true;

    @Column(name = "supports_doordash", nullable = false)
    @Builder.Default
    private boolean supportsDoordash = false;

    @Column(name = "supports_ubereats", nullable = false)
    @Builder.Default
    private boolean supportsUbereats = false;

    @Column(name = "supports_grubhub", nullable = false)
    @Builder.Default
    private boolean supportsGrubhub = false;

    @Column(name = "distance_label", length = 40)
    private String distanceLabel;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;

    @OneToMany(mappedBy = "chain", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ChainReview> reviews = new ArrayList<>();
}
