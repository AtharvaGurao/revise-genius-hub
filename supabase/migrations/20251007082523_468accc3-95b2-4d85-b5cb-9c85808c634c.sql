-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table for storing PDF chunks with embeddings
CREATE TABLE public.pdf_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdf_id UUID NOT NULL REFERENCES public.pdfs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  chunk_text TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding vector(768),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for vector similarity search
CREATE INDEX pdf_chunks_embedding_idx ON public.pdf_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for faster lookups
CREATE INDEX pdf_chunks_pdf_id_idx ON public.pdf_chunks(pdf_id);
CREATE INDEX pdf_chunks_user_id_idx ON public.pdf_chunks(user_id);

-- Enable RLS
ALTER TABLE public.pdf_chunks ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own PDF chunks"
ON public.pdf_chunks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PDF chunks"
ON public.pdf_chunks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PDF chunks"
ON public.pdf_chunks
FOR DELETE
USING (auth.uid() = user_id);

-- Function to search similar chunks
CREATE OR REPLACE FUNCTION public.search_pdf_chunks(
  query_embedding vector(768),
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