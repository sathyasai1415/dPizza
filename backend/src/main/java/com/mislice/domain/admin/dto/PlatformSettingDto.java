package com.mislice.domain.admin.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record PlatformSettingDto(
        UUID id,
        BigDecimal commissionRate,
        BigDecimal flatServiceFee,
        BigDecimal minPayoutAmount,
        boolean maintenanceMode,
        String supportPhone,
        String supportEmail,
        Integer payoutIntervalDays,
        BigDecimal driverBasePay,
        BigDecimal maxDeliveryRadiusMiles,
        String[] allowedZipCodes,
        boolean autoApproveRestaurants
) {}
