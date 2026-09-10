-- server/migrations/048_password_reset.sql
-- Migration: Add password reset tokens and password_changed_at tracking
-- Date: 2026-09-10
--
-- token_hash stores only the sha256 hex digest of the raw reset token —
-- the raw token is emailed to the user and never persisted server-side,
-- same principle as password storage. password_changed_at lets
-- authMiddleware reject JWTs issued before the most recent password
-- change, invalidating other sessions on reset without a token blocklist.

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='users' AND column_name='password_changed_at') THEN
    ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP;
  END IF;
END $$;
