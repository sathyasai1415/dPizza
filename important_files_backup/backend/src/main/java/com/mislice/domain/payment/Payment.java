package com.mislice.domain.payment;

import com.mislice.common.entity.BaseEntity;
import com.mislice.domain.order.Order;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(nullable = false, length = 20)
    private String provider; // STRIPE|PAYPAL|CASH

    @Column(nullable = false, length = 20)
    private String method; // CARD|CASH|WALLET

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING"; // PENDING|AUTHORIZED|CAPTURED|FAILED|REFUNDED

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String currency = "USD";

    @Column(name = "provider_ref", length = 255)
    private String providerRef;

    @OneToMany(mappedBy = "payment", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PaymentTransaction> transactions = new ArrayList<>();
}
