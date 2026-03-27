-- Add is_online_only flag to sales table.
-- Online-only sales have a physical address on estatesales.net (and thus valid
-- lat/lng) but are not in-person events and should not appear in search results.

ALTER TABLE sales ADD COLUMN is_online_only BOOLEAN NOT NULL DEFAULT FALSE;

-- Mark the known online-only sale that slipped through.
UPDATE sales SET is_online_only = TRUE WHERE external_id = '4843968';
