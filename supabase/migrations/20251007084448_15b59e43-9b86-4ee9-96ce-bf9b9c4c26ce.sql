-- Update vector dimension from 768 to 1536 for text-embedding-3-large
-- Drop and recreate the search function with new dimension
DROP FUNCTION IF EXISTS public.search_pdf_chunks(vector(768), float, int, uuid);

-- Alter the embedding column to use 1536 dimensions
ALTER TABLE public.pdf_chunks 
ALTER COLUMN embedding TYPE vector(1536);

-- Recreate the search function with new dimension
CREATE OR REPLACE FUNCTION public.search_pdf_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_pdf_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  pdf_id uuid,
  chunk_text text,
  page_number integer,
  similarity float
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pdf_chunks.id,
    pdf_chunks.pdf_id,
    pdf_chunks.chunk_text,
    pdf_chunks.page_number,
    1 - (pdf_chunks.embedding <=> query_embedding) as similarity
  FROM public.pdf_chunks
  WHERE
    (filter_pdf_id IS NULL OR pdf_chunks.pdf_id = filter_pdf_id)
    AND 1 - (pdf_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY pdf_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;