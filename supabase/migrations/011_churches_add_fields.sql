-- Migration: 011_churches_add_fields.sql
-- Description: Add district_pastor and region columns to churches table

BEGIN;

ALTER TABLE churches
ADD COLUMN district_pastor TEXT,
ADD COLUMN region INTEGER;

COMMIT;
