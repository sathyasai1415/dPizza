package com.mislice.domain.user;

import com.mislice.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A saved payment method entry — masked card metadata only (brand/last4/expiry).
 * No raw card number or CVV is ever stored or accepted here. This backs the
 * "Payment Methods" profile UI; a real charge still requires a live payment
 * processor integration (e.g. Stripe Elements + tokenization) which is out of
 * scope for this table.
 */
@Entity
@Table(name = "payment_methods")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentMethod extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 30)
    private String brand; // Visa | Mastercard | Amex | Discover

    @Column(nullable = false, length = 4)
    private String last4;

    @Column(name = "exp_month", nullable = false)
    private Integer expMonth;

    @Column(name = "exp_year", nullable = false)
    private Integer expYear;

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private boolean isDefault = false;
}
