-- Migration: Add invitation token and status to store_members
-- Run this in your Supabase SQL Editor before deploying the new backend

ALTER TABLE store_members
  ADD COLUMN IF NOT EXISTS invitation_token UUID UNIQUE DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS invitation_status TEXT NOT NULL DEFAULT 'accepted';

-- Existing rows with user_id are confirmed members → keep 'accepted' (the default)
-- Existing pending rows (user_id IS NULL, not yet linked) → mark as pending_email
-- so they receive an email re-invitation on the next owner action
UPDATE store_members
SET invitation_status = 'pending_email'
WHERE user_id IS NULL;
