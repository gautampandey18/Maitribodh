-- Migration 0009: remove overstay_cutoff from category
ALTER TABLE mams.category DROP COLUMN IF EXISTS overstay_cutoff;
