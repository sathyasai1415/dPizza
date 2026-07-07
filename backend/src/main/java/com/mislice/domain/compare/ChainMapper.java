package com.mislice.domain.compare;

import com.mislice.domain.compare.dto.ChainDto;
import com.mislice.domain.compare.dto.ChainReviewDto;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ChainMapper {

    ChainDto toDto(Chain chain);

    ChainReviewDto toDto(ChainReview review);
}
