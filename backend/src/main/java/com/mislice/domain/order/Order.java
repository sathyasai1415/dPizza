package com.mislice.domain.order;

import com.mislice.common.entity.BaseEntity;
import com.mislice.domain.restaurant.Restaurant;
import com.mislice.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order extends BaseEntity {

    @Column(name = "order_number", nullable = false, unique = true, length = 20)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "PENDING"; // PENDING|CONFIRMED|PREPARING|READY|OUT_FOR_DELIVERY|DELIVERED|CANCELLED

    @Column(name = "delivery_type", nullable = false, length = 32)
    @Builder.Default
    private String deliveryType = "STORE_DELIVERY";

    @Column(name = "delivery_provider", length = 40)
    private String deliveryProvider;

    @Column(name = "delivery_address", length = 500)
    private String deliveryAddress;

    @Column(name = "delivery_notes", length = 500)
    private String deliveryNotes;

    @Column(nullable = false)
    private BigDecimal subtotal;

    @Column(name = "delivery_fee", nullable = false)
    private BigDecimal deliveryFee;

    @Column(name = "provider_service_fee", nullable = false)
    private BigDecimal providerServiceFee;

    @Column(name = "platform_service_fee", nullable = false)
    @Builder.Default
    private BigDecimal platformServiceFee = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal tax;

    @Column(nullable = false)
    private BigDecimal tip;

    @Column(nullable = false)
    private BigDecimal discount;

    @Column(nullable = false)
    private BigDecimal total;

    @Column(name = "coupon_code", length = 40)
    private String couponCode;

    @Column(name = "estimated_eta_min")
    private Integer estimatedEtaMin;

    @Column(name = "estimated_eta_max")
    private Integer estimatedEtaMax;

    @Column(name = "placed_at", nullable = false)
    @Builder.Default
    private Instant placedAt = Instant.now();

    // V3 Alignments
    @Column(name = "payment_method", nullable = false, length = 32)
    @Builder.Default
    private String paymentMethod = "PAY_AT_STORE"; // CASH_ON_DELIVERY|PAY_AT_STORE|CARD

    @Column(name = "payment_status", nullable = false, length = 20)
    @Builder.Default
    private String paymentStatus = "UNPAID"; // UNPAID|PENDING|PAID|FAILED|REFUNDED

    @Column(name = "qr_token", length = 64)
    private String qrToken;

    @Column(name = "qr_scanned_at")
    private Instant qrScannedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();
}
