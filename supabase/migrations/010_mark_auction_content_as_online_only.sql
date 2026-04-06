-- Migration 010: Mark auction-type sales as is_online_only=TRUE.
--
-- The scraper originally only checked isMarketplaceSale to skip auction sales.
-- Three API type values represent non-in-person-estate-sale formats:
--   type=2:     live in-person public auction (bidding format)
--   type=64:    online-only auction (bid on seller's website)
--   type=16384: online antique/shipping sale
--
-- The cleanup script (cleanup_online_auctions.py --apply) re-checks the live API
-- and flags confirmed cases. This migration is belt-and-suspenders: it catches
-- any already-expired listings the API can no longer confirm, using content
-- patterns unique to auction listings on estatesales.net.

UPDATE sales
SET is_online_only = TRUE
WHERE is_online_only = FALSE
  AND (
    -- "Auction Closes [date]" is the canonical pattern on online auction detail pages
    description ILIKE '%Auction Closes%'
    -- Online estate auction verbiage
    OR description ILIKE '%Online Estate Auction%'
    OR description ILIKE '%online only auction%'
    OR description ILIKE '%online-only auction%'
    -- Live auction descriptions
    OR description ILIKE '%Live Public Auction%'
    -- "Bid on Seller's Website" language (sometimes scraped into description)
    OR description ILIKE '%Bid on Seller%'
    -- Title-level patterns for cases where description is empty
    OR (description = '' AND (
      title ILIKE '%Online Auction%'
      OR title ILIKE '%Online Estate Auction%'
      OR title ILIKE '%Live Public Auction%'
      OR title ILIKE '%Storage Unit Auction%'
    ))
  );
