-- ============================================================================
-- V8: Customer Profile redesign support
-- Adds profile personalization fields, richer address contact details, and a
-- lightweight (demo/masked-only, non-PCI) saved payment methods table.
-- ============================================================================

-- Personal info: preferred language, timezone, default fulfillment method,
-- and a tag-array of notification preference keys (mirrors dietary_prefs style).
ALTER TABLE users ADD COLUMN preferred_language VARCHAR(10);
ALTER TABLE users ADD COLUMN time_zone VARCHAR(64);
ALTER TABLE users ADD COLUMN default_fulfillment VARCHAR(20);
ALTER TABLE users ADD COLUMN notification_prefs TEXT[];

-- Saved addresses: contact + delivery instructions
ALTER TABLE addresses ADD COLUMN delivery_instructions VARCHAR(500);
ALTER TABLE addresses ADD COLUMN contact_name VARCHAR(120);
ALTER TABLE addresses ADD COLUMN contact_phone VARCHAR(30);

-- Saved payment methods — masked card metadata only (brand/last4/expiry).
-- No raw card numbers or CVV are ever stored here; real tokenization via a
-- payment processor (e.g. Stripe) is required before this can process a
-- live charge. This table exists to power the "Payment Methods" UI list.
CREATE TABLE payment_methods (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    brand           VARCHAR(30) NOT NULL,
    last4           VARCHAR(4) NOT NULL,
    exp_month       INTEGER NOT NULL,
    exp_year        INTEGER NOT NULL,
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    version         BIGINT NOT NULL DEFAULT 0
);
CREATE INDEX ix_payment_methods_user ON payment_methods (user_id);
