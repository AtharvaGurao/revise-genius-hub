-- Create storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pdfs',
  'pdfs',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf']::text[]
);

-- Create storage policies for PDF bucket
CREATE POLICY "Users can view their own PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'pdfs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pdfs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'pdfs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create pdfs table to track uploaded documents
CREATE TABLE public.pdfs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  pages INTEGER NOT NULL DEFAULT 0,
  file_size INTEGER NOT NULL DEFAULT 0,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.pdfs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own PDFs"
ON public.pdfs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PDFs"
ON public.pdfs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PDFs"
ON public.pdfs
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create quiz attempts table
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pdf_id UUID REFERENCES public.pdfs(id) ON DELETE CASCADE,
  quiz_type TEXT NOT NULL CHECK (quiz_type IN ('mcq', 'saq', 'laq')),
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL,
  questions JSONB NOT NULL,
  answers JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quiz attempts"
ON public.quiz_attempts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz attempts"
ON public.quiz_attempts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);