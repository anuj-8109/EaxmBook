export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface MockTest {
  id: string;
  name: string;
  categoryId: string;
  duration: number; // in minutes
  totalQuestions: number;
  totalMarks: number;
  negativeMarking: boolean;
  questions: Question[];
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface TestAttempt {
  id: string;
  userId: string;
  testId: string;
  categoryId: string;
  answers: Record<string, number>;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  timeTaken: number; // in seconds
  attemptDate: Date;
}

export const categories: Category[] = [
  {
    id: 'cat-1',
    name: 'General Knowledge',
    description: 'Test your general awareness and current affairs knowledge',
    icon: '🌍',
  },
  {
    id: 'cat-2',
    name: 'Mathematics Aptitude',
    description: 'Sharpen your mathematical and quantitative reasoning skills',
    icon: '🔢',
  },
  {
    id: 'cat-3',
    name: 'Logical Reasoning',
    description: 'Enhance your analytical and logical thinking abilities',
    icon: '🧩',
  },
];

export const mockTests: MockTest[] = [];

// Initialize with empty attempts array
export let testAttempts: TestAttempt[] = [];

export const addTestAttempt = (attempt: TestAttempt) => {
  testAttempts.push(attempt);
};

export const getUserAttempts = (userId: string) => {
  return testAttempts.filter(attempt => attempt.userId === userId);
};

export const getAllAttempts = () => {
  return testAttempts;
};
