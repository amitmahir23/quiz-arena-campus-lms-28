-- Clear existing courses data as requested - delete in correct order to avoid foreign key violations
DELETE FROM study_sessions;
DELETE FROM comments;
DELETE FROM course_discussions;
DELETE FROM quiz_participants;
DELETE FROM quiz_questions;
DELETE FROM quiz_rooms;
DELETE FROM quizzes;
DELETE FROM submissions;
DELETE FROM assignments;
DELETE FROM completed_materials;
DELETE FROM chapter_materials;
DELETE FROM chapters;
DELETE FROM enrollments;
DELETE FROM courses;

-- Add price field to courses table
ALTER TABLE public.courses ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.courses ADD COLUMN is_published BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.courses ADD COLUMN preview_image TEXT;
ALTER TABLE public.courses ADD COLUMN preview_description TEXT;

-- Create cart table for marketplace functionality
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Create orders table for payment tracking
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_items table for individual course purchases
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course_purchases table to track what users have purchased
CREATE TABLE public.course_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS on new tables
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_purchases ENABLE ROW LEVEL SECURITY;

-- RLS policies for cart_items
CREATE POLICY "Users can manage their own cart items" ON public.cart_items
FOR ALL USING (auth.uid() = user_id);

-- RLS policies for orders
CREATE POLICY "Users can view their own orders" ON public.orders
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage orders" ON public.orders
FOR ALL USING (true);

-- RLS policies for order_items
CREATE POLICY "Users can view their order items" ON public.order_items
FOR SELECT USING (EXISTS (
  SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
));

CREATE POLICY "Service role can manage order items" ON public.order_items
FOR ALL USING (true);

-- RLS policies for course_purchases
CREATE POLICY "Users can view their own purchases" ON public.course_purchases
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage purchases" ON public.course_purchases
FOR ALL USING (true);

-- Update enrollments policies to check for purchases
DROP POLICY IF EXISTS "Only students can enroll in courses" ON public.enrollments;
DROP POLICY IF EXISTS "Students can enroll in courses" ON public.enrollments;
DROP POLICY IF EXISTS "Students can insert enrollments" ON public.enrollments;

-- Create new enrollment policy that checks for purchase
CREATE POLICY "Students can enroll after purchase" ON public.enrollments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'student'
  ) AND
  EXISTS (
    SELECT 1 FROM course_purchases 
    WHERE course_purchases.user_id = auth.uid() AND course_purchases.course_id = enrollments.course_id
  ) AND
  enrollments.student_id = auth.uid()
);

-- Update course access policies to require purchase for students
DROP POLICY IF EXISTS "Students can view courses they are enrolled in" ON public.courses;
CREATE POLICY "Students can view purchased courses" ON public.courses
FOR SELECT USING (
  (instructor_id = auth.uid()) OR
  (EXISTS (
    SELECT 1 FROM course_purchases 
    WHERE course_purchases.user_id = auth.uid() AND course_purchases.course_id = courses.id
  )) OR
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ))
);

-- Update courses table to allow instructors to delete their courses
DROP POLICY IF EXISTS "Instructors can update their own courses" ON public.courses;
CREATE POLICY "Instructors can manage their own courses" ON public.courses
FOR ALL USING (instructor_id = auth.uid());

-- Create instructor analytics view
CREATE VIEW public.instructor_course_analytics AS
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