-- server/migrations/047_create_signup_log.sql
-- Migration: Create signup_log table so newly reopened public signup
-- (password and Google OAuth) is visible to the admin without SSH access.
-- Date: 2026-09-10
--
-- seen_at is null until the admin views the /admin/signups list, which
-- marks every unseen row seen — powers the unread badge on the Admin nav
-- link. Mirrors error_log's shape (see migration 038).

CREATE TABLE IF NOT EXISTS signup_log (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  method VARCHAR(20) NOT NULL DEFAULT 'password',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  seen_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_signup_log_seen_at ON signup_log(seen_at);
