-- Create exam categories table (UPSC, SSC, NTPC, CGL, MTS, etc.)
CREATE TABLE IF NOT EXISTS public.exam_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT '📚',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.exam_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(name, category_id)
);

-- Create difficulty levels enum
CREATE TYPE public.difficulty_level AS ENUM ('easy', 'medium', 'hard');

-- Create test type enum
CREATE TYPE public.test_type AS ENUM ('static', 'dynamic');

-- Create questions table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer INTEGER NOT NULL CHECK (correct_answer >= 0 AND correct_answer <= 3),
  explanation TEXT,
  difficulty public.difficulty_level NOT NULL DEFAULT 'medium',
  category_id UUID REFERENCES public.exam_categories(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create mock tests table
CREATE TABLE IF NOT EXISTS public.mock_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.exam_categories(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  negative_marking BOOLEAN DEFAULT false,
  negative_marks_per_question DECIMAL(3,2) DEFAULT 0.25,
  test_type public.test_type NOT NULL DEFAULT 'static',
  difficulty_distribution JSONB DEFAULT '{"easy": 0, "medium": 0, "hard": 0}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create test questions junction table (for static tests)
CREATE TABLE IF NOT EXISTS public.test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES public.mock_tests(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(test_id, question_id),
  UNIQUE(test_id, question_order)
);

-- Create test attempts table
CREATE TABLE IF NOT EXISTS public.test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id UUID REFERENCES public.mock_tests(id) ON DELETE CASCADE,
  score DECIMAL(6,2) NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  wrong_answers INTEGER NOT NULL DEFAULT 0,
  unanswered INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create test answers table
CREATE TABLE IF NOT EXISTS public.test_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES public.test_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_answer INTEGER CHECK (selected_answer >= 0 AND selected_answer <= 3),
  is_correct BOOLEAN NOT NULL,
  marks_awarded DECIMAL(4,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(attempt_id, question_id)
);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- Enable RLS on all tables
ALTER TABLE public.exam_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exam_categories
CREATE POLICY "Everyone can view categories" ON public.exam_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.exam_categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for subjects
CREATE POLICY "Everyone can view subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Admins can manage subjects" ON public.subjects FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for questions
CREATE POLICY "Everyone can view questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Admins can manage questions" ON public.questions FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for mock_tests
CREATE POLICY "Everyone can view active tests" ON public.mock_tests FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage tests" ON public.mock_tests FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for test_questions
CREATE POLICY "Everyone can view test questions" ON public.test_questions FOR SELECT USING (true);
CREATE POLICY "Admins can manage test questions" ON public.test_questions FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for test_attempts
CREATE POLICY "Users can view own attempts" ON public.test_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own attempts" ON public.test_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all attempts" ON public.test_attempts FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for test_answers
CREATE POLICY "Users can view own answers" ON public.test_answers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.test_attempts 
    WHERE test_attempts.id = test_answers.attempt_id 
    AND test_attempts.user_id = auth.uid()
  )
);
CREATE POLICY "Users can create own answers" ON public.test_answers FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.test_attempts 
    WHERE test_attempts.id = test_answers.attempt_id 
    AND test_attempts.user_id = auth.uid()
  )
);
CREATE POLICY "Admins can view all answers" ON public.test_answers FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for bookmarks
CREATE POLICY "Users can view own bookmarks" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own bookmarks" ON public.bookmarks FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_questions_category ON public.questions(category_id);
CREATE INDEX idx_questions_subject ON public.questions(subject_id);
CREATE INDEX idx_questions_difficulty ON public.questions(difficulty);
CREATE INDEX idx_mock_tests_category ON public.mock_tests(category_id);
CREATE INDEX idx_test_attempts_user ON public.test_attempts(user_id);
CREATE INDEX idx_test_attempts_test ON public.test_attempts(test_id);
CREATE INDEX idx_test_answers_attempt ON public.test_answers(attempt_id);
CREATE INDEX idx_bookmarks_user ON public.bookmarks(user_id);

-- Update updated_at trigger
CREATE TRIGGER update_exam_categories_updated_at BEFORE UPDATE ON public.exam_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mock_tests_updated_at BEFORE UPDATE ON public.mock_tests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default exam categories
INSERT INTO public.exam_categories (name, description, icon) VALUES
  ('UPSC', 'Union Public Service Commission', '🏛️'),
  ('SSC CGL', 'Staff Selection Commission Combined Graduate Level', '📊'),
  ('SSC CHSL', 'Staff Selection Commission Combined Higher Secondary Level', '📝'),
  ('Railway NTPC', 'Railway Non-Technical Popular Categories', '🚂'),
  ('Railway Group D', 'Railway Group D Recruitment', '🛤️'),
  ('Banking', 'Bank PO, Clerk, and other banking exams', '🏦'),
  ('General Knowledge', 'General awareness and current affairs', '🌍'),
  ('Mathematics', 'Quantitative aptitude and mathematics', '🔢'),
  ('Reasoning', 'Logical and analytical reasoning', '🧩'),
  ('English', 'English language and comprehension', '📚')
ON CONFLICT (name) DO NOTHING;