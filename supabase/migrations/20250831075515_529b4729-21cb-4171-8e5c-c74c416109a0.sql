-- Fix security issues: Enable RLS on all tables that have policies but RLS disabled
-- Based on the security warnings, we need to enable RLS on tables in public schema

-- Enable RLS on instructor_course_analytics if it has policies
ALTER TABLE public.instructor_course_analytics ENABLE ROW LEVEL SECURITY;

-- Create basic policies for instructor_course_analytics (view for instructors only)
CREATE POLICY "Instructors can view their own course analytics" 
ON public.instructor_course_analytics
FOR SELECT 
USING (instructor_id = auth.uid());

-- Fix function search path for security
DROP FUNCTION IF EXISTS public.handle_new_user();
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', new.email));
  RETURN new;
END;
$function$;