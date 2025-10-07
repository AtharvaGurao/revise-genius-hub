-- Clean up and recreate properly
DROP VIEW IF EXISTS public.quiz_progress_summary CASCADE;
DROP TABLE IF EXISTS public.quiz_answers CASCADE;
DROP TABLE IF EXISTS public.quiz_attempts_v2 CASCADE;

-- Create quiz_attempts_v2 table
CREATE TABLE public.quiz_attempts_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pdf_id uuid REFERENCES public.pdfs(id) ON DELETE CASCADE,
  quiz_type text NOT NULL,
  total_questions integer NOT NULL,
  correct_answers integer NOT NULL DEFAULT 0,
  score_percentage numeric(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_questions > 0 
    THEN (correct_answers::numeric / total_questions::numeric * 100)
    ELSE 0 
    END
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create quiz_answers table
CREATE TABLE public.quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.quiz_attempts_v2(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  question_type text NOT NULL,
  question_text text NOT NULL,
  user_answer text,
  correct_answer text,
  is_correct boolean NOT NULL DEFAULT false,
  topic text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quiz_attempts_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own quiz attempts"
  ON public.quiz_attempts_v2 FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz attempts"
  ON public.quiz_attempts_v2 FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own quiz answers"
  ON public.quiz_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_attempts_v2
      WHERE quiz_attempts_v2.id = quiz_answers.attempt_id
      AND quiz_attempts_v2.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own quiz answers"
  ON public.quiz_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_attempts_v2
      WHERE quiz_attempts_v2.id = quiz_answers.attempt_id
      AND quiz_attempts_v2.user_id = auth.uid()
    )
  );

-- Create progress summary view
CREATE VIEW public.quiz_progress_summary AS
SELECT 
  a.user_id,
  COUNT(DISTINCT a.id) as total_attempts,
  ROUND(AVG(a.score_percentage)::numeric, 2) as average_score,
  ROUND(AVG(a.correct_answers::numeric / a.total_questions::numeric * 100)::numeric, 2) as overall_accuracy,
  SUM(a.total_questions) as total_questions_attempted,
  SUM(a.correct_answers) as total_correct_answers,
  (
    SELECT ROUND(AVG(score_percentage)::numeric, 2)
    FROM (
      SELECT score_percentage 
      FROM public.quiz_attempts_v2 a2
      WHERE a2.user_id = a.user_id
      ORDER BY created_at DESC
      LIMIT 5
    ) recent
  ) as recent_average_score,
  (
    SELECT ARRAY_AGG(DISTINCT topic)
    FROM public.quiz_answers ans
    JOIN public.quiz_attempts_v2 att ON ans.attempt_id = att.id
    WHERE att.user_id = a.user_id
    AND ans.topic IS NOT NULL
    GROUP BY ans.topic
    HAVING AVG(CASE WHEN ans.is_correct THEN 1.0 ELSE 0.0 END) > 0.8
  ) as strengths,
  (
    SELECT ARRAY_AGG(DISTINCT topic)
    FROM public.quiz_answers ans
    JOIN public.quiz_attempts_v2 att ON ans.attempt_id = att.id
    WHERE att.user_id = a.user_id
    AND ans.topic IS NOT NULL
    GROUP BY ans.topic
    HAVING AVG(CASE WHEN ans.is_correct THEN 1.0 ELSE 0.0 END) < 0.6
  ) as weaknesses,
  MAX(a.created_at) as last_attempt_at
FROM public.quiz_attempts_v2 a
GROUP BY a.user_id;

GRANT SELECT ON public.quiz_progress_summary TO authenticated;

-- Indexes
CREATE INDEX idx_quiz_attempts_v2_user_id ON public.quiz_attempts_v2(user_id);
CREATE INDEX idx_quiz_attempts_v2_created_at ON public.quiz_attempts_v2(created_at DESC);
CREATE INDEX idx_quiz_answers_attempt_id ON public.quiz_answers(attempt_id);
CREATE INDEX idx_quiz_answers_topic ON public.quiz_answers(topic);
CREATE INDEX idx_quiz_answers_is_correct ON public.quiz_answers(is_correct);

-- Enable realtime
ALTER TABLE public.quiz_attempts_v2 REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_attempts_v2;