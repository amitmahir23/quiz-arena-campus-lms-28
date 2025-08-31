-- Create students table
CREATE TABLE IF NOT EXISTS public.students (
    id SERIAL PRIMARY KEY,
    student_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create courses table
CREATE TABLE IF NOT EXISTS public.courses (
    id SERIAL PRIMARY KEY,
    course_name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create progress table
CREATE TABLE IF NOT EXISTS public.progress (
    id SERIAL PRIMARY KEY,
    student_id TEXT NOT NULL,
    course_name TEXT NOT NULL,
    completed_modules INTEGER DEFAULT 0,
    total_modules INTEGER NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- Create deadlines table
CREATE TABLE IF NOT EXISTS public.deadlines (
    id SERIAL PRIMARY KEY,
    student_id TEXT NOT NULL,
    course_name TEXT NOT NULL,
    task TEXT NOT NULL,
    due_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
    id SERIAL PRIMARY KEY,
    student_id TEXT NOT NULL,
    course_name TEXT NOT NULL,
    quiz_name TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- Create goals table
CREATE TABLE IF NOT EXISTS public.goals (
    id SERIAL PRIMARY KEY,
    student_id TEXT NOT NULL,
    goal TEXT NOT NULL,
    date_set DATE DEFAULT CURRENT_DATE,
    completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- Create streaks table
CREATE TABLE IF NOT EXISTS public.streaks (
    id SERIAL PRIMARY KEY,
    student_id TEXT UNIQUE NOT NULL,
    streak INTEGER DEFAULT 0,
    last_activity DATE DEFAULT CURRENT_DATE,
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- Create leaderboard table
CREATE TABLE IF NOT EXISTS public.leaderboard (
    id SERIAL PRIMARY KEY,
    course_name TEXT NOT NULL,
    name TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    student_id TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- Insert sample data for testing
INSERT INTO public.students (student_id, name, email) VALUES
('1001', 'John Doe', 'john.doe@example.com'),
('1002', 'Jane Smith', 'jane.smith@example.com'),
('1003', 'Mike Johnson', 'mike.johnson@example.com')
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO public.courses (course_name, description) VALUES
('Mathematics', 'Advanced Mathematics Course'),
('Physics', 'Introduction to Physics'),
('Computer Science', 'Programming and Algorithms'),
('Chemistry', 'General Chemistry')
ON CONFLICT (course_name) DO NOTHING;

INSERT INTO public.progress (student_id, course_name, completed_modules, total_modules) VALUES
('1001', 'Mathematics', 8, 10),
('1001', 'Physics', 5, 12),
('1001', 'Computer Science', 15, 20),
('1002', 'Mathematics', 9, 10),
('1002', 'Chemistry', 7, 15),
('1003', 'Physics', 3, 12)
ON CONFLICT DO NOTHING;

INSERT INTO public.deadlines (student_id, course_name, task, due_date) VALUES
('1001', 'Mathematics', 'Final Exam', '2025-09-15'),
('1001', 'Physics', 'Lab Report', '2025-09-10'),
('1001', 'Computer Science', 'Project Submission', '2025-09-20'),
('1002', 'Mathematics', 'Assignment 3', '2025-09-12'),
('1002', 'Chemistry', 'Research Paper', '2025-09-25')
ON CONFLICT DO NOTHING;

INSERT INTO public.quizzes (student_id, course_name, quiz_name, score) VALUES
('1001', 'Mathematics', 'Quiz 1', 85),
('1001', 'Mathematics', 'Quiz 2', 92),
('1001', 'Physics', 'Quiz 1', 78),
('1001', 'Computer Science', 'Quiz 1', 95),
('1002', 'Mathematics', 'Quiz 1', 88),
('1002', 'Chemistry', 'Quiz 1', 82),
('1003', 'Physics', 'Quiz 1', 65)
ON CONFLICT DO NOTHING;

INSERT INTO public.goals (student_id, goal) VALUES
('1001', 'Complete Mathematics module 9 today'),
('1002', 'Study for Chemistry quiz'),
('1003', 'Review Physics concepts')
ON CONFLICT DO NOTHING;

INSERT INTO public.streaks (student_id, streak, last_activity) VALUES
('1001', 5, CURRENT_DATE),
('1002', 3, CURRENT_DATE),
('1003', 1, CURRENT_DATE)
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO public.leaderboard (course_name, name, score, student_id) VALUES
('Mathematics', 'Jane Smith', 94, '1002'),
('Mathematics', 'John Doe', 89, '1001'),
('Physics', 'John Doe', 78, '1001'),
('Physics', 'Mike Johnson', 65, '1003'),
('Computer Science', 'John Doe', 95, '1001'),
('Chemistry', 'Jane Smith', 82, '1002')
ON CONFLICT DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Create simple policies (allow all for development)
CREATE POLICY "Allow all operations" ON public.students FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.courses FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.progress FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.deadlines FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.quizzes FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.goals FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.streaks FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.leaderboard FOR ALL USING (true);