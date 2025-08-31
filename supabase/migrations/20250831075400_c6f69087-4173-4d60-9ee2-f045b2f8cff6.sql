-- Add quiz type to chapter_materials to embed quizzes in course content
ALTER TABLE public.chapter_materials ADD COLUMN quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL;

-- Add sequential order for proper locking sequence
ALTER TABLE public.chapter_materials ADD COLUMN order_position INTEGER DEFAULT 0;

-- Update existing materials to have proper order
UPDATE public.chapter_materials 
SET order_position = ROW_NUMBER() OVER (PARTITION BY chapter_id ORDER BY created_at);

-- Create index for better performance on ordering
CREATE INDEX idx_chapter_materials_order ON public.chapter_materials(chapter_id, order_position);