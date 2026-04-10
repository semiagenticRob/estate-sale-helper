-- Migration 015: get_sale_scores RPC
-- Batch fetch sale scores for map pin coloring.

CREATE OR REPLACE FUNCTION public.get_sale_scores(p_sale_ids UUID[])
RETURNS TABLE (
  sale_id UUID,
  worth_it_count INTEGER,
  skip_it_count INTEGER,
  heat_score DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sale_id, worth_it_count, skip_it_count, heat_score
  FROM sale_scores
  WHERE sale_id = ANY(p_sale_ids);
$$;
