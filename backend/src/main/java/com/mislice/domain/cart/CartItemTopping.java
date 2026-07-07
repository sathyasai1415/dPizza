package com.mislice.domain.cart;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItemTopping {

    @Column(name = "topping_id")
    private UUID toppingId;

    @Column(name = "topping_name", nullable = false, length = 80)
    private String toppingName;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal price = BigDecimal.ZERO;
}
