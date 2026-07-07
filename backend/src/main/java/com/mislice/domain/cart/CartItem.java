package com.mislice.domain.cart;

import com.mislice.common.entity.BaseEntity;
import com.mislice.domain.menu.MenuItem;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cart_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cart_id", nullable = false)
    private Cart cart;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_item_id")
    private MenuItem menuItem;

    @Column(name = "item_name", nullable = false, length = 160)
    private String itemName;

    @Column(length = 40)
    private String size;

    @Column(length = 60)
    private String crust;

    @Column(length = 80)
    private String sauce;

    @Column(nullable = false)
    @Builder.Default
    private int quantity = 1;

    @Column(name = "unit_price", nullable = false)
    private BigDecimal unitPrice;

    @Column(length = 500)
    private String notes;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "cart_item_toppings", joinColumns = @JoinColumn(name = "cart_item_id"))
    @Builder.Default
    private List<CartItemTopping> toppings = new ArrayList<>();
}
