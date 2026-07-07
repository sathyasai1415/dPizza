package com.mislice.domain.cart;

import com.mislice.domain.cart.dto.CartDto;
import com.mislice.domain.cart.dto.CartItemDto;
import com.mislice.domain.cart.dto.CartItemToppingDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CartMapper {

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "restaurantId", source = "restaurant.id")
    @Mapping(target = "restaurantName", source = "restaurant.name")
    @Mapping(target = "couponCode", source = "coupon.code")
    CartDto toDto(Cart cart);

    @Mapping(target = "menuItemId", source = "menuItem.id")
    CartItemDto toDto(CartItem item);

    CartItemToppingDto toDto(CartItemTopping topping);
}
