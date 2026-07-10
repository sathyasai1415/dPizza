package com.mislice.domain.admin;

import com.mislice.domain.admin.PlatformSetting;
import com.mislice.domain.admin.dto.PlatformSettingDto;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface PlatformSettingMapper {
    PlatformSettingDto toDto(PlatformSetting entity);
    PlatformSetting toEntity(PlatformSettingDto dto);
    void updateEntityFromDto(PlatformSettingDto dto, @MappingTarget PlatformSetting entity);
}
