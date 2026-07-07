package com.mislice.domain.delivery;

import com.mislice.domain.delivery.dto.DeliveryDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DeliveryMapper {

    @Mapping(target = "orderId", source = "order.id")
    @Mapping(target = "driverName", source = "driver.user.fullName")
    DeliveryDto toDto(Delivery delivery);
}
