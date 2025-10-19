-- Recreate the view with SECURITY INVOKER to use querying user's permissions
DROP VIEW IF EXISTS public.quiz_progress_summary;

CREATE VIEW public.quiz_progress_summary 
WITH (security_invoker = true) AS
SELECT 
  user_id,
  count(DISTINCT id) AS total_attempts,
  round(avg(score_percentage), 2) AS average_score,
  round(avg(correct_answers::numeric / total_questions::numeric * 100::numeric), 2) AS overall_accuracy,
  sum(total_questions) AS total_questions_attempted,
  sum(correct_answers) AS total_correct_answers,
  (SELECT round(avg(recent.score_percentage), 2) 
   FROM (SELECT a2.score_percentage
         FROM quiz_attempts_v2 a2
         WHERE a2.user_id = a.user_id
         ORDER BY a2.created_at DESC
         LIMIT 5) recent) AS recent_average_score,
  (SELECT array_agg(DISTINCT ans.topic)
   FROM quiz_answers ans
   JOIN quiz_attempts_v2 att ON ans.attempt_id = att.id
   WHERE att.user_id = a.user_id AND ans.topic IS NOT NULL
   GROUP BY ans.topic
   HAVING avg(CASE WHEN ans.is_correct THEN 1.0 ELSE 0.0 END) > 0.8) AS strengths,
  (SELECT array_agg(DISTINCT ans.topic)
   FROM quiz_answers ans
   JOIN quiz_attempts_v2 att ON ans.attempt_id = att.id
   WHERE att.user_id = a.user_id AND ans.topic IS NOT NULL
   GROUP BY ans.topic
   HAVING avg(CASE WHEN ans.is_correct THEN 1.0 ELSE 0.0 END) < 0.6) AS weaknesses,
  max(created_at) AS last_attempt_at
FROM quiz_attempts_v2 a
WHERE user_id = auth.uid()
GROUP BY user_id;