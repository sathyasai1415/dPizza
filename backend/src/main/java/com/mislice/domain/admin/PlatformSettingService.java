package com.mislice.domain.admin;

import com.mislice.common.exception.ApiException;
import com.mislice.domain.admin.dto.PlatformSettingDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PlatformSettingService {

    private final PlatformSettingRepository settingRepository;
    private final PlatformSettingMapper settingMapper;

    @Transactional(readOnly = true)
    public PlatformSettingDto getSettings() {
        PlatformSetting setting = settingRepository.findFirstByDeletedFalse()
                .orElseGet(() -> {
                    PlatformSetting defaultSetting = new PlatformSetting();
                    return settingRepository.save(defaultSetting);
                });
        return settingMapper.toDto(setting);
    }

    @Transactional
    public PlatformSettingDto updateSettings(PlatformSettingDto dto) {
        PlatformSetting setting = settingRepository.findFirstByDeletedFalse()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "SETTINGS_NOT_FOUND", "Platform settings row not initialized."));

        settingMapper.updateEntityFromDto(dto, setting);
        setting = settingRepository.save(setting);
        return settingMapper.toDto(setting);
    }
}
