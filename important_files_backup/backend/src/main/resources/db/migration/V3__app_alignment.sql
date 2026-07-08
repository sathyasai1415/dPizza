-- ============================================================================
-- MiSlice schema V3 — align with the full marketplace app feature set
-- Adds: store application workflow, marketplace discovery fields, order QR /
-- payment fields, chain compare engine, favorites, price history, staff,
-- holiday hours, prep times, loyalty, payouts, user preferences.
-- Conventions follow V1: uuid PK, audit cols, soft delete, optimistic version.
-- ============================================================================

-- ── Restaurants: approval workflow + delivery defaults + discovery fields ───

ALTER TABLE restaurants
    ADD COLUMN application_status   VARCHAR(32) NOT NULL DEFAULT 'DRAFT',  -- DRAFT|SUBMITTED|UNDER_REVIEW|APPROVED|REJECTED|SUSPENDED
    ADD COLUMN submitted_at         TIMESTAMPTZ,
    ADD COLUMN reviewed_at          TIMESTAMPTZ,
    ADD COLUMN rejection_reason     VARCHAR(500),
    ADD COLUMN review_notes         VARCHAR(500),
    ADD COLUMN is_setup_complete    BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN delivery_fee         NUMERIC(8,2) NOT NULL DEFAULT 0,
    ADD COLUMN delivery_radius_miles NUMERIC(5,2),
    ADD COLUMN minimum_order        NUMERIC(8,2) NOT NULL DEFAULT 0,
    ADD COLUMN average_eta_minutes  INTEGER,
    ADD COLUMN emoji                VARCHAR(16) NOT NULL DEFAULT '🍕',
    ADD COLUMN category             VARCHAR(20) NOT NULL DEFAULT 'LOCAL',  -- CHAIN|LOCAL|ARTISAN|VEGAN|PREMIUM
    ADD COLUMN price_range          VARCHAR(4)  NOT NULL DEFAULT '$$',
    ADD COLUMN neighborhood         VARCHAR(120),
    ADD COLUMN website              VARCHAR(255),
    ADD COLUMN trend_score          INTEGER NOT NULL DEFAULT 0,            -- 0-100, "Most Ordered Tonight" ranking
    ADD COLUMN is_featured          BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN is_new               BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN tags                 TEXT[],                                -- dietary: vegan, vegetarian, gluten-free, halal, spicy
    ADD COLUMN badges               TEXT[],                                -- display: New, Top Rated, Free Delivery, ...
    ADD COLUMN popular_items        TEXT[],
    ADD COLUMN delivery_partners    TEXT[];                                -- store|doordash|ubereats|grubhub|pickup

CREATE INDEX ix_restaurants_application_status ON restaurants (application_status) WHERE is_deleted = FALSE;

-- Existing approved seed restaurants get a consistent workflow state.
UPDATE restaurants
SET application_status = 'APPROVED', is_setup_complete = TRUE
WHERE is_approved = TRUE;

-- ── Orders: QR pickup handoff, payment snapshot, platform/provider fee split ─

ALTER TABLE orders RENAME COLUMN service_fee TO provider_service_fee;

ALTER TABLE orders
    ADD COLUMN platform_service_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN payment_method       VARCHAR(32) NOT NULL DEFAULT 'PAY_AT_STORE',  -- CASH_ON_DELIVERY|PAY_AT_STORE|CARD
    ADD COLUMN payment_status       VARCHAR(20) NOT NULL DEFAULT 'UNPAID',        -- UNPAID|PENDING|PAID|FAILED|REFUNDED
    ADD COLUMN qr_token             VARCHAR(64),
    ADD COLUMN qr_scanned_at        TIMESTAMPTZ;

-- ── Users: profile preferences used by the customer profile screen ───────────

ALTER TABLE users
    ADD COLUMN dietary_prefs         TEXT[],           -- vegetarian|vegan|gluten-free|halal|spicy
    ADD COLUMN meat_prefs            TEXT[],
    ADD COLUMN favorite_toppings     TEXT[],
    ADD COLUMN budget_range          VARCHAR(20),      -- under10|10to15|15to20|over20
    ADD COLUMN avatar_url            VARCHAR(512),
    ADD COLUMN notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- ── Coupons: optional delivery-provider affinity (DASH10 → doordash, …) ─────

ALTER TABLE coupons
    ADD COLUMN provider VARCHAR(20);   -- store|doordash|ubereats|grubhub; null = any provider

-- ── Chains: cross-chain price-comparison reference data ─────────────────────

CREATE TABLE chains (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_key               VARCHAR(60)  NOT NULL,     -- stable key: dominos, papa-johns, ...
    name                    VARCHAR(120) NOT NULL,
    color                   VARCHAR(60),               -- brand color (Tailwind class or hex)
    website                 VARCHAR(255),
    base_prices             JSONB NOT NULL,            -- {"Small": 8.99, "Medium": 12.99, ...}
    crust_premiums          JSONB NOT NULL,            -- {"Hand Tossed": 0, "Parmesan Stuffed Crust": 2.50, ...}
    topping_price           NUMERIC(8,2) NOT NULL DEFAULT 0,
    store_delivery_fee      NUMERIC(8,2) NOT NULL DEFAULT 0,
    default_delivery_type   VARCHAR(32)  NOT NULL DEFAULT 'STORE_DELIVERY',
    supports_store_delivery BOOLEAN NOT NULL DEFAULT FALSE,
    supports_pickup         BOOLEAN NOT NULL DEFAULT TRUE,
    supports_doordash       BOOLEAN NOT NULL DEFAULT FALSE,
    supports_ubereats       BOOLEAN NOT NULL DEFAULT FALSE,
    supports_grubhub        BOOLEAN NOT NULL DEFAULT FALSE,
    distance_label          VARCHAR(40),
    sort_order              INTEGER NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              VARCHAR(255),
    updated_by              VARCHAR(255),
    is_deleted              BOOLEAN NOT NULL DEFAULT FALSE,
    version                 BIGINT  NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX ux_chains_key ON chains (chain_key) WHERE is_deleted = FALSE;

-- Customer reviews left on chains from the compare screen (separate from
-- restaurant reviews; chains are comparison entities, not marketplace stores).
CREATE TABLE chain_reviews (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id    UUID NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,   -- null = seeded/anonymous
    author_name VARCHAR(120) NOT NULL,
    rating      SMALLINT NOT NULL,
    comment     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by  VARCHAR(255),
    updated_by  VARCHAR(255),
    is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
    version     BIGINT  NOT NULL DEFAULT 0,
    CONSTRAINT ck_chain_reviews_rating CHECK (rating BETWEEN 1 AND 5)
);
CREATE INDEX ix_chain_reviews_chain ON chain_reviews (chain_id) WHERE is_deleted = FALSE;

-- ── Favorites: saved pizza configs + favorite stores/chains ─────────────────

CREATE TABLE favorite_configs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(120) NOT NULL,
    config      JSONB NOT NULL,                        -- full PizzaConfig snapshot
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by  VARCHAR(255),
    updated_by  VARCHAR(255),
    is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
    version     BIGINT  NOT NULL DEFAULT 0
);
CREATE INDEX ix_favorite_configs_user ON favorite_configs (user_id) WHERE is_deleted = FALSE;

-- A favorite may point at a marketplace restaurant OR a comparison chain.
CREATE TABLE favorite_restaurants (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    chain_id      UUID REFERENCES chains(id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by    VARCHAR(255),
    updated_by    VARCHAR(255),
    is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
    version       BIGINT  NOT NULL DEFAULT 0,
    CONSTRAINT ck_favorite_restaurants_target CHECK (restaurant_id IS NOT NULL OR chain_id IS NOT NULL)
);
CREATE UNIQUE INDEX ux_favorite_restaurants_restaurant ON favorite_restaurants (user_id, restaurant_id)
    WHERE restaurant_id IS NOT NULL AND is_deleted = FALSE;
CREATE UNIQUE INDEX ux_favorite_restaurants_chain ON favorite_restaurants (user_id, chain_id)
    WHERE chain_id IS NOT NULL AND is_deleted = FALSE;

-- ── Price history: append-only ledger of menu item price changes ─────────────

CREATE TABLE price_history (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    menu_item_id  UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    price         NUMERIC(8,2) NOT NULL,
    source        VARCHAR(32) NOT NULL DEFAULT 'STORE_OWNER',   -- STORE_OWNER|SYSTEM|ADMIN
    captured_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_price_history_restaurant ON price_history (restaurant_id, captured_at DESC);
CREATE INDEX ix_price_history_item ON price_history (menu_item_id, captured_at DESC);

-- ── Restaurant staff (sub-roles inside a store) ──────────────────────────────

CREATE TABLE restaurant_members (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_role   VARCHAR(32) NOT NULL DEFAULT 'EMPLOYEE',      -- OWNER|MANAGER|CASHIER|KITCHEN_STAFF|EMPLOYEE
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by    VARCHAR(255),
    updated_by    VARCHAR(255),
    is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
    version       BIGINT  NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX ux_restaurant_members_pair ON restaurant_members (restaurant_id, user_id) WHERE is_deleted = FALSE;
CREATE INDEX ix_restaurant_members_user ON restaurant_members (user_id) WHERE is_deleted = FALSE;

-- ── Holiday hours & prep times ───────────────────────────────────────────────

CREATE TABLE restaurant_holiday_hours (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    holiday_date  DATE NOT NULL,
    label         VARCHAR(120),
    open_time     TIME,
    close_time    TIME,
    closed        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by    VARCHAR(255),
    updated_by    VARCHAR(255),
    is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
    version       BIGINT  NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX ux_restaurant_holiday_date ON restaurant_holiday_hours (restaurant_id, holiday_date) WHERE is_deleted = FALSE;

CREATE TABLE restaurant_prep_times (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category      VARCHAR(80) NOT NULL,                 -- menu category / item type name
    minutes       INTEGER NOT NULL DEFAULT 15,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by    VARCHAR(255),
    updated_by    VARCHAR(255),
    is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
    version       BIGINT  NOT NULL DEFAULT 0,
    CONSTRAINT ck_prep_times_minutes CHECK (minutes > 0)
);
CREATE UNIQUE INDEX ux_restaurant_prep_category ON restaurant_prep_times (restaurant_id, category) WHERE is_deleted = FALSE;

-- ── Loyalty (rewards program) ────────────────────────────────────────────────

CREATE TABLE loyalty_accounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points          INTEGER NOT NULL DEFAULT 0,
    lifetime_points INTEGER NOT NULL DEFAULT 0,
    referral_code   VARCHAR(20),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    version         BIGINT  NOT NULL DEFAULT 0,
    CONSTRAINT ck_loyalty_points CHECK (points >= 0)
);
CREATE UNIQUE INDEX ux_loyalty_accounts_user ON loyalty_accounts (user_id) WHERE is_deleted = FALSE;
CREATE UNIQUE INDEX ux_loyalty_accounts_referral ON loyalty_accounts (referral_code) WHERE referral_code IS NOT NULL AND is_deleted = FALSE;

CREATE TABLE loyalty_transactions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id  UUID NOT NULL REFERENCES loyalty_accounts(id) ON DELETE CASCADE,
    type        VARCHAR(20) NOT NULL,                   -- EARN|REDEEM
    points      INTEGER NOT NULL,
    description VARCHAR(255),
    order_id    UUID REFERENCES orders(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_loyalty_tx_account ON loyalty_transactions (account_id, created_at DESC);

-- ── Payouts (weekly restaurant settlements, 20% platform commission) ─────────

CREATE TABLE payouts (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id  UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    period_start   DATE NOT NULL,
    period_end     DATE NOT NULL,
    order_count    INTEGER NOT NULL DEFAULT 0,
    gross_revenue  NUMERIC(12,2) NOT NULL DEFAULT 0,
    platform_fee   NUMERIC(12,2) NOT NULL DEFAULT 0,
    net_payout     NUMERIC(12,2) NOT NULL DEFAULT 0,
    status         VARCHAR(20) NOT NULL DEFAULT 'PENDING',   -- PENDING|PAID
    paid_by        UUID REFERENCES users(id),
    paid_at        TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by     VARCHAR(255),
    updated_by     VARCHAR(255),
    is_deleted     BOOLEAN NOT NULL DEFAULT FALSE,
    version        BIGINT  NOT NULL DEFAULT 0
);
CREATE INDEX ix_payouts_restaurant ON payouts (restaurant_id, period_end DESC) WHERE is_deleted = FALSE;

-- ── Fix V2 seed credentials ──────────────────────────────────────────────────
-- The V2 hash did not correspond to the documented password. This is
-- BCrypt("password"); dev/demo only — rotate before any real deployment.

UPDATE users
SET password_hash = '$2y$10$psLnGc7w/JKusJm2GtVAH.osm/AE3Zj3ozcSTZfvsPI2x8xnWH6cy'
WHERE email IN ('admin@mislice.com', 'owner@shamzpizza.com');
