package com.mislice.domain.restaurant;

import com.mislice.domain.restaurant.dto.DealDto;
import com.mislice.domain.restaurant.dto.DeliveryZoneDto;
import com.mislice.domain.restaurant.dto.RestaurantDto;
import com.mislice.domain.restaurant.dto.RestaurantHoursDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import java.util.List;

@Mapper(componentModel = "spring")
public interface RestaurantMapper {

    @Mapping(target = "owner", ignore = true)
    Restaurant toEntity(RestaurantDto dto);

    RestaurantDto toDto(Restaurant entity);

    List<RestaurantDto> toDtoList(List<Restaurant> entities);

    @Mapping(target = "restaurant", ignore = true)
    RestaurantHours toEntity(RestaurantHoursDto dto);

    @Mapping(source = "restaurant.id", target = "restaurantId")
    RestaurantHoursDto toDto(RestaurantHours entity);

    List<RestaurantHoursDto> toHoursDtoList(List<RestaurantHours> entities);

    @Mapping(target = "restaurant", ignore = true)
    DeliveryZone toEntity(DeliveryZoneDto dto);

    @Mapping(source = "restaurant.id", target = "restaurantId")
    DeliveryZoneDto toDto(DeliveryZone entity);

    List<DeliveryZoneDto> toZoneDtoList(List<DeliveryZone> entities);

    @Mapping(target = "restaurant", ignore = true)
    Deal toEntity(DealDto dto);

    @Mapping(source = "restaurant.id", target = "restaurantId")
    DealDto toDto(Deal entity);

    List<DealDto> toDealDtoList(List<Deal> entities);
}
