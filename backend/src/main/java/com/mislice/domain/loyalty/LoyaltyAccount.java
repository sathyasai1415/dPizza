package com.mislice.domain.loyalty;

import com.mislice.common.entity.BaseEntity;
import com.mislice.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "loyalty_accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoyaltyAccount extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    @Builder.Default
    private int points = 0;

    @Column(name = "lifetime_points", nullable = false)
    @Builder.Default
    private int lifetimePoints = 0;

    @Column(name = "referral_code", length = 20)
    private String referralCode;

    @OneToMany(mappedBy = "account", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LoyaltyTransaction> transactions = new ArrayList<>();
}
