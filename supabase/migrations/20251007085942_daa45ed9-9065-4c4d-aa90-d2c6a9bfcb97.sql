-- Fix security definer view by explicitly setting SECURITY INVOKER
DROP VIEW IF EXISTS public.quiz_progress_summary;

CREATE VIEW public.quiz_progress_summary
WITH (security_invoker=true)
AS
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