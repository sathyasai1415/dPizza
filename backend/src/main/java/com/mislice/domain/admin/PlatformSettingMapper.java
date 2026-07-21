package com.mislice.domain.admin;

import com.mislice.domain.admin.PlatformSetting;
import com.mislice.domain.admin.dto.PlatformSettingDto;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface PlatformSettingMapper {
    PlatformSettingDto toDto(PlatformSetting entity);
    PlatformSetting toEntity(PlatformSettingDto dto);
    void updateEntityFromDto(PlatformSettingDto dto, @MappingTarget PlatformSetting entity);
}
