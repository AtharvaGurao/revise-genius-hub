-- Create schema for app-specific tables
CREATE SCHEMA IF NOT EXISTS app;

-- Create attempts table to track each quiz attempt
CREATE TABLE app.attempts (
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

-- Create answers table to track individual question answers
CREATE TABLE app.answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES app.attempts(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  question_type text NOT NULL,
  question_text text NOT NULL,
  user_answer text,
  correct_answer text,
  is_correct boolean NOT NULL DEFAULT false,
  topic text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE app.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attempts
CREATE POLICY "Users can view their own attempts"
  ON app.attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attempts"
  ON app.attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for answers
CREATE POLICY "Users can view their own answers"
  ON app.answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app.attempts
      WHERE attempts.id = answers.attempt_id
      AND attempts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own answers"
  ON app.answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app.attempts
      WHERE attempts.id = answers.attempt_id
      AND attempts.user_id = auth.uid()
    )
  );

-- Create progress_summary view
CREATE OR REPLACE VIEW app.progress_summary AS
SELECT 
  a.user_id,
  COUNT(DISTINCT a.id) as total_attempts,
  ROUND(AVG(a.score_percentage)::numeric, 2) as average_score,
  ROUND(AVG(a.correct_answers::numeric / a.total_questions::numeric * 100)::numeric, 2) as overall_accuracy,
  SUM(a.total_questions) as total_questions_attempted,
  SUM(a.correct_answers) as total_correct_answers,
  -- Recent performance (last 5 attempts)
  (
    SELECT ROUND(AVG(score_percentage)::numeric, 2)
    FROM (
      SELECT score_percentage 
      FROM app.attempts a2
      WHERE a2.user_id = a.user_id
      ORDER BY created_at DESC
      LIMIT 5
    ) recent
  ) as recent_average_score,
  -- Topic-based strengths (topics with >80% accuracy)
  (
    SELECT ARRAY_AGG(DISTINCT topic)
    FROM app.answers ans
    JOIN app.attempts att ON ans.attempt_id = att.id
    WHERE att.user_id = a.user_id
    AND ans.topic IS NOT NULL
    GROUP BY ans.topic
    HAVING AVG(CASE WHEN ans.is_correct THEN 1.0 ELSE 0.0 END) > 0.8
  ) as strengths,
  -- Topic-based weaknesses (topics with <60% accuracy)
  (
    SELECT ARRAY_AGG(DISTINCT topic)
    FROM app.answers ans
    JOIN app.attempts att ON ans.attempt_id = att.id
    WHERE att.user_id = a.user_id
    AND ans.topic IS NOT NULL
    GROUP BY ans.topic
    HAVING AVG(CASE WHEN ans.is_correct THEN 1.0 ELSE 0.0 END) < 0.6
  ) as weaknesses,
  MAX(a.created_at) as last_attempt_at
FROM app.attempts a
GROUP BY a.user_id;

-- Grant access to the view
GRANT SELECT ON app.progress_summary TO authenticated;

-- Create indexes for better performance
CREATE INDEX idx_attempts_user_id ON app.attempts(user_id);
CREATE INDEX idx_attempts_created_at ON app.attempts(created_at DESC);
CREATE INDEX idx_answers_attempt_id ON app.answers(attempt_id);
CREATE INDEX idx_answers_topic ON app.answers(topic);
CREATE INDEX idx_answers_is_correct ON app.answers(is_correct);

-- Enable realtime for attempts table
ALTER TABLE app.attempts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE app.attempts;