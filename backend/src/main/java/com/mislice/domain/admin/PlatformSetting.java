package com.mislice.domain.admin;

import com.mislice.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "platform_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformSetting extends BaseEntity {

    @Column(name = "commission_rate", nullable = false)
    @Builder.Default
    private BigDecimal commissionRate = BigDecimal.valueOf(20.00);

    @Column(name = "flat_service_fee", nullable = false)
    @Builder.Default
    private BigDecimal flatServiceFee = BigDecimal.valueOf(1.50);

    @Column(name = "min_payout_amount", nullable = false)
    @Builder.Default
    private BigDecimal minPayoutAmount = BigDecimal.valueOf(50.00);

    @Column(name = "maintenance_mode", nullable = false)
    @Builder.Default
    private boolean maintenanceMode = false;

    @Column(name = "support_phone", nullable = false, length = 30)
    @Builder.Default
    private String supportPhone = "1-800-MISLICE";

    @Column(name = "support_email", nullable = false, length = 100)
    @Builder.Default
    private String supportEmail = "support@mislice.com";

    @Column(name = "payout_interval_days", nullable = false)
    @Builder.Default
    private Integer payoutIntervalDays = 7;

    @Column(name = "driver_base_pay", nullable = false)
    @Builder.Default
    private BigDecimal driverBasePay = BigDecimal.valueOf(3.00);

    @Column(name = "max_delivery_radius_miles", nullable = false)
    @Builder.Default
    private BigDecimal maxDeliveryRadiusMiles = BigDecimal.valueOf(15.00);

    @Column(name = "allowed_zip_codes", columnDefinition = "text[]")
    private String[] allowedZipCodes;

    @Column(name = "auto_approve_restaurants", nullable = false)
    @Builder.Default
    private boolean autoApproveRestaurants = false;
}
