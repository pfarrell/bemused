-- Migration: Add desktop_devices for the P·Share Amp desktop player's long-lived logins
-- Date: 2026-10-14
--
-- Same model as jukebox_devices (051): one row per paired desktop install,
-- created by POST /auth/desktop-pair. The issued JWT carries this row's id as
-- a `desktopDeviceId` claim; authMiddleware checks the row still exists on
-- every request, so deleting it is how a desktop install gets revoked.
-- last_seen_at is refreshed at most hourly by authMiddleware.

CREATE TABLE desktop_devices (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ
);
