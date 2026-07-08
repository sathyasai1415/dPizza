package com.mislice.domain.compare;

import com.mislice.common.entity.BaseEntity;
import com.mislice.domain.user.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "chain_reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChainReview extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "chain_id", nullable = false)
    private Chain chain;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "author_name", nullable = false, length = 120)
    private String authorName;

    @Column(nullable = false)
    private short rating;

    @Column(columnDefinition = "text")
    private String comment;
}
