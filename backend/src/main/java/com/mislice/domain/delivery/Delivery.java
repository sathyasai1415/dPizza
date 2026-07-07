package com.mislice.domain.delivery;

import com.mislice.common.entity.BaseEntity;
import com.mislice.domain.order.Order;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "deliveries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Delivery extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private Driver driver;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "PENDING"; // PENDING|ASSIGNED|PICKED_UP|EN_ROUTE|DELIVERED|FAILED

    @Column(name = "assigned_at")
    private Instant assignedAt;

    @Column(name = "picked_up_at")
    private Instant pickedUpAt;

    @Column(name = "delivered_at")
    private Instant deliveredAt;

    @Column(name = "eta_minutes")
    private Integer etaMinutes;
}
