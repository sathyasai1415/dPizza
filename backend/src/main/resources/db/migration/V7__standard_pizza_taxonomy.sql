CREATE TABLE standard_pizza_profiles (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    category VARCHAR(100) NOT NULL UNIQUE,
    core_ingredients TEXT[],
    cheese_type VARCHAR(100),
    sauce_type VARCHAR(100),
    style VARCHAR(100),
    active BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE TABLE standard_pizza_sizes (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    category VARCHAR(50) NOT NULL,
    measurement_inches INTEGER,
    shape VARCHAR(50),
    sort_order INTEGER DEFAULT 0 NOT NULL
);

ALTER TABLE menu_items ADD COLUMN standard_profile_id UUID REFERENCES standard_pizza_profiles(id);
ALTER TABLE menu_items ADD COLUMN standard_size_id UUID REFERENCES standard_pizza_sizes(id);
