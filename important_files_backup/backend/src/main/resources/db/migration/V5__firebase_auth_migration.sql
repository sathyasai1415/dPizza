-- ============================================================================
-- V5: Firebase Authentication Migration
-- Add uid column, remove password_hash, drop legacy tokens
-- ============================================================================

ALTER TABLE users ADD COLUMN uid VARCHAR(255) UNIQUE;

-- Populate existing seeded users with a mock UID
UPDATE users SET uid = 'mock_uid_' || REPLACE(email, '@', '_') WHERE uid IS NULL;

-- Make uid column NOT NULL after populating default values
ALTER TABLE users ALTER COLUMN uid SET NOT NULL;

-- Remove legacy password storage
ALTER TABLE users DROP COLUMN password_hash;

-- Drop legacy security tables now handled by Firebase Auth
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS email_verification_tokens CASCADE;
