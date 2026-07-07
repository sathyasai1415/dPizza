package com.mislice.domain.delivery;

import com.mislice.common.entity.BaseEntity;
import com.mislice.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "drivers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Driver extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 120)
    private String vehicle;

    @Column(nullable = false)
    @Builder.Default
    private boolean available = false;

    @Column(name = "current_lat")
    private Double currentLat;

    @Column(name = "current_lng")
    private Double currentLng;

    @Column(name = "rating_avg", nullable = false)
    @Builder.Default
    private BigDecimal ratingAvg = BigDecimal.ZERO;
}
