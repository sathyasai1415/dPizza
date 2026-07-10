package com.mislice.domain.admin;

import com.mislice.domain.admin.dto.PlatformSettingDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/settings")
@RequiredArgsConstructor
@Tag(name = "Admin Platform Settings", description = "Global commission, fees, support contacts, and radius limits")
public class PlatformSettingController {

    private final PlatformSettingService settingService;

    @Operation(summary = "Get current global platform settings")
    @GetMapping
    public ResponseEntity<PlatformSettingDto> getSettings() {
        return ResponseEntity.ok(settingService.getSettings());
    }

    @Operation(summary = "Update global platform settings")
    @PutMapping
    public ResponseEntity<PlatformSettingDto> updateSettings(@RequestBody PlatformSettingDto dto) {
        return ResponseEntity.ok(settingService.updateSettings(dto));
    }
}
