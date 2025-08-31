-- Enable RLS on forum_messages table
ALTER TABLE public.forum_messages ENABLE ROW LEVEL SECURITY;

-- Policy for viewing forum messages: Students enrolled in the course and instructors teaching the course can view messages
CREATE POLICY "Users can view forum messages in their courses" 
ON public.forum_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM enrollments e 
    WHERE e.course_id = forum_messages.course_id 
    AND e.student_id = auth.uid()
  ) 
  OR 
  EXISTS (
    SELECT 1 FROM courses c 
    WHERE c.id = forum_messages.course_id 
    AND c.instructor_id = auth.uid()
  )
);

-- Policy for creating forum messages: Users who have access to the course can create messages
CREATE POLICY "Users can create forum messages in their courses" 
ON public.forum_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND (
    EXISTS (
      SELECT 1 FROM enrollments e 
      WHERE e.course_id = forum_messages.course_id 
      AND e.student_id = auth.uid()
    ) 
    OR 
    EXISTS (
      SELECT 1 FROM courses c 
      WHERE c.id = forum_messages.course_id 
      AND c.instructor_id = auth.uid()
    )
  )
);

-- Policy for updating forum messages: Users can update their own messages
CREATE POLICY "Users can update their own forum messages" 
ON public.forum_messages 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for deleting forum messages: Users can delete their own messages or instructors can delete any message in their courses
CREATE POLICY "Users can delete forum messages" 
ON public.forum_messages 
FOR DELETE 
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM courses c 
    WHERE c.id = forum_messages.course_id 
    AND c.instructor_id = auth.uid()
  )
);