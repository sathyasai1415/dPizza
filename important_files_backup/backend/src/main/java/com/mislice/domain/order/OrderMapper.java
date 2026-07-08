package com.mislice.domain.order;

import com.mislice.domain.order.dto.OrderDto;
import com.mislice.domain.order.dto.OrderItemDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface OrderMapper {

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "restaurantId", source = "restaurant.id")
    @Mapping(target = "restaurantName", source = "restaurant.name")
    OrderDto toDto(Order order);

    @Mapping(target = "menuItemId", source = "menuItem.id")
    OrderItemDto toDto(OrderItem item);
}
