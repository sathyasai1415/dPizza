package com.mislice.domain.coupon;

import com.mislice.domain.coupon.dto.CouponDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CouponMapper {

    @Mapping(target = "restaurantId", source = "restaurant.id")
    CouponDto toDto(Coupon coupon);
}
