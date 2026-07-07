package com.mislice.domain.review;

import com.mislice.common.entity.BaseEntity;
import com.mislice.domain.order.Order;
import com.mislice.domain.restaurant.Restaurant;
import com.mislice.domain.user.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @Column(nullable = false)
    private short rating;

    @Column(columnDefinition = "text")
    private String comment;

    @Column(name = "moderation_status", nullable = false, length = 20)
    @Builder.Default
    private String moderationStatus = "PENDING"; // PENDING|APPROVED|REJECTED
}
