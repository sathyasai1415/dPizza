-- ============================================================================
-- MiSlice V6 migration — Platform Admin settings and parameters
-- ============================================================================

CREATE TABLE platform_settings (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commission_rate           NUMERIC(5,2) NOT NULL DEFAULT 20.00,
    flat_service_fee          NUMERIC(5,2) NOT NULL DEFAULT 1.50,
    min_payout_amount         NUMERIC(12,2) NOT NULL DEFAULT 50.00,
    maintenance_mode          BOOLEAN NOT NULL DEFAULT FALSE,
    support_phone             VARCHAR(30) NOT NULL DEFAULT '1-800-MISLICE',
    support_email             VARCHAR(100) NOT NULL DEFAULT 'support@mislice.com',
    payout_interval_days      INTEGER NOT NULL DEFAULT 7,
    driver_base_pay           NUMERIC(5,2) NOT NULL DEFAULT 3.00,
    max_delivery_radius_miles NUMERIC(5,2) NOT NULL DEFAULT 15.00,
    allowed_zip_codes         TEXT[],
    auto_approve_restaurants  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by                VARCHAR(255),
    updated_by                VARCHAR(255),
    is_deleted                BOOLEAN NOT NULL DEFAULT FALSE,
    version                   BIGINT NOT NULL DEFAULT 0
);

INSERT INTO platform_settings (commission_rate, flat_service_fee, min_payout_amount, maintenance_mode, support_phone, support_email, payout_interval_days, driver_base_pay, max_delivery_radius_miles, allowed_zip_codes, auto_approve_restaurants, created_by, updated_by)
VALUES (20.00, 1.50, 50.00, FALSE, '1-800-MISLICE', 'support@mislice.com', 7, 3.00, 15.00, ARRAY['48201', '48202', '48203', '48204', '48226'], FALSE, 'system', 'system');
