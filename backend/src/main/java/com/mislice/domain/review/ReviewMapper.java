package com.mislice.domain.review;

import com.mislice.domain.review.dto.ReviewDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ReviewMapper {

    @Mapping(target = "userFullName", source = "user.fullName")
    ReviewDto toDto(Review review);
}
