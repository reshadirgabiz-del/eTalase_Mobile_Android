-- Add is_disabled flag to store_members.
-- Used when a plan is downgraded: all non-owner members are suspended
-- and the owner must manually re-enable them one by one (up to the new plan limit).
ALTER TABLE store_members
  ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN NOT NULL DEFAULT FALSE;
