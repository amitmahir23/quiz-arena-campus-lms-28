-- Fix security issues identified by the linter

-- Enable RLS on tables that need it
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dcourses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for leaderboard
CREATE POLICY "Anyone can view leaderboard" ON public.leaderboard
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own scores" ON public.leaderboard
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for dcourses (static course data)
CREATE POLICY "Anyone can view dcourses" ON public.dcourses
FOR SELECT USING (true);

-- Create RLS policies for goal
CREATE POLICY "Users can manage their own goals" ON public.goal
FOR ALL USING (auth.uid() = user_id);

-- Fix the view to be security invoker instead of definer
DROP VIEW IF EXISTS public.instructor_course_analytics;
CREATE VIEW public.instructor_course_analytics 
WITH (security_invoker = true) AS
SELECT 
  c.id as course_id,
  c.title,
  c.instructor_id,
  c.price,
  COUNT(DISTINCT cp.user_id) as total_purchases,
  COALESCE(SUM(cp_count.purchase_amount), 0) as total_revenue,
  COUNT(DISTINCT e.student_id) as enrolled_students,
  c.created_at
FROM courses c
LEFT JOIN course_purchases cp ON c.id = cp.course_id
LEFT JOIN enrollments e ON c.id = e.course_id
LEFT JOIN (
  SELECT cp2.course_id, cp2.user_id, c2.price as purchase_amount
  FROM course_purchases cp2
  JOIN courses c2 ON cp2.course_id = c2.id
) cp_count ON c.id = cp_count.course_id
GROUP BY c.id, c.title, c.instructor_id, c.price, c.created_at;

-- Fix function search paths
ALTER FUNCTION public.generate_course_code() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;