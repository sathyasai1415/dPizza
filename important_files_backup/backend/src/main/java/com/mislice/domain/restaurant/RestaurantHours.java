package com.mislice.domain.restaurant;

import com.mislice.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalTime;

@Entity
@Table(name = "restaurant_hours", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"restaurant_id", "day_of_week"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantHours extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Column(name = "day_of_week", nullable = false)
    private short dayOfWeek; // 0=Sun .. 6=Sat

    @Column(name = "open_time")
    private LocalTime openTime;

    @Column(name = "close_time")
    private LocalTime closeTime;

    @Column(nullable = false)
    @Builder.Default
    private boolean closed = false;
}
