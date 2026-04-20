import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserLayout } from '@/components/UserLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Clock, ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { testsAPI, attemptsAPI, bookmarksAPI } from '@/lib/api';
import Loader from '@/components/Loader';

interface Question {
  _id?: string;
  id?: string;
  question_text: string;
  question_text_hindi?: string;
  option_a: string;
  option_a_hindi?: string;
  option_b: string;
  option_b_hindi?: string;
  option_c: string;
  option_c_hindi?: string;
  option_d: string;
  option_d_hindi?: string;
  correct_answer: number;
  explanation?: string;
  explanation_hindi?: string;
  question_image_url?: string;
  question_video_url?: string;
  option_a_image_url?: string;
  option_b_image_url?: string;
  option_c_image_url?: string;
  option_d_image_url?: string;
  hint?: string;
  hint_hindi?: string;
  hint_image_url?: string;
  explanation_image_url?: string;
}

interface Test {
  _id?: string;
  id?: string;
  name: string;
  category_id: any;
  duration_minutes: number;
  total_marks: number;
  negative_marking: boolean;
  negative_marks_per_question?: number;
}

interface Category {
  _id?: string;
  id?: string;
  name: string;
  icon: string;
}

const TestAttempt = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [test, setTest] = useState<Test | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime] = useState(new Date().toISOString());
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchTest();
  }, [testId]);

  useEffect(() => {
    if (test && timeLeft === 0) {
      setTimeLeft(test.duration_minutes * 60);
    }
  }, [test]);

  useEffect(() => {
    if (timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const fetchTest = async () => {
    if (!testId) return;

    try {
      const testData = await testsAPI.getById(testId);

      if (!testData) {
        toast.error('Test not found');
        navigate('/tests');
        return;
      }

      const categoryData = testData.category_id;
      const testQuestions = await testsAPI.getQuestions(testId);

      // Extract questions from test questions array
      const questionsData = testQuestions?.map((item: any) => {
        // Handle both populated and non-populated responses
        if (item.question_id) {
          return typeof item.question_id === 'object' ? item.question_id : item;
        }
        return item;
      }).filter(Boolean) || [];

      if (questionsData.length === 0) {
        toast.error('This test has no questions yet');
        navigate('/tests');
        return;
      }

      setTest(testData);
      setCategory(categoryData);
      setQuestions(questionsData);
    } catch (error: any) {
      toast.error('Failed to load test');
      console.error(error);
      navigate('/tests');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="p-8">
          <Loader text="Preparing your test..." />
        </div>
      </UserLayout>
    );
  }

  if (!test || !questions.length) return null;

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswerSelect = (optionIndex: number) => {
    setAnswers({ ...answers, [currentQ._id || currentQ.id]: optionIndex });
  };

  const handleToggleBookmark = async () => {
    const id = currentQ._id || currentQ.id;
    if (id) {
      try {
        await bookmarksAPI.toggle(id);
        setBookmarked(prev => ({ ...prev, [id]: !prev[id] }));
        toast.success(bookmarked[id] ? 'Bookmark removed' : 'Question marked for review');
      } catch (error) {
        toast.error('Failed to update bookmark');
      }
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user || !test) return;

    const endTime = new Date().toISOString();
    const startTimeDate = new Date(startTime);
    const endTimeDate = new Date(endTime);
    const timeTakenSeconds = Math.floor((endTimeDate.getTime() - startTimeDate.getTime()) / 1000);

    let correctAnswers = 0;
    let wrongAnswers = 0;
    let unanswered = 0;
    let totalScore = 0;

    const answersToSave: any[] = [];

    questions.forEach((q) => {
      const questionId = q._id || q.id;
      const userAnswer = answers[questionId];
      const isCorrect = userAnswer === q.correct_answer;

      if (userAnswer === undefined || userAnswer === null) {
        unanswered++;
        return;
      }

      if (isCorrect) {
        correctAnswers++;
        totalScore += 1;
      } else {
        wrongAnswers++;
        if (test.negative_marking) {
          const negativeMarks = test.negative_marks_per_question || 0.25;
          totalScore -= negativeMarks;
        }
      }
    });

    totalScore = Math.max(0, totalScore);

    try {
      questions.forEach((q) => {
        const userAnswer = answers[q._id || q.id];
        const isCorrect = userAnswer === q.correct_answer;
        let marksAwarded = 0;

        if (userAnswer !== undefined) {
          if (isCorrect) {
            marksAwarded = 1;
          } else if (test.negative_marking) {
            const negativeMarks = test.negative_marks_per_question || 0.25;
            marksAwarded = -negativeMarks;
          }

          answersToSave.push({
            question_id: q._id || q.id,
            selected_answer: userAnswer,
            is_correct: isCorrect,
            marks_awarded: marksAwarded,
          });
        }
      });

      const attemptData = await attemptsAPI.create({
        test_id: test._id || test.id,
        started_at: startTime,
        completed_at: endTime,
        time_taken_seconds: timeTakenSeconds,
        total_questions: questions.length,
        correct_answers: correctAnswers,
        wrong_answers: wrongAnswers,
        unanswered,
        score: totalScore,
        answers: answersToSave,
      });

      toast.success('Test submitted successfully!');
      navigate(`/result/${attemptData._id || attemptData.id}`);
    } catch (error: any) {
      toast.error('Failed to submit test');
      console.error(error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <UserLayout>
      <div className="w-full flex flex-col min-h-[calc(100vh-80px)]">
        {/* Header Bar (Optional, can use the one from practice session style if preferred) */}

        <main className="flex-1 flex flex-row gap-0 w-full mx-auto p-4 gap-4 relative overflow-hidden">

          {/* Left: Question Area */}
          <div className="flex-1 flex flex-col gap-3">
            {/* Top Info Card */}
            <Card className="bg-gradient-to-r from-green-600 to-green-500 border-0 text-white shadow-md">
              <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl font-bold border border-white/30">
                    {category?.icon || '📝'}
                  </div>
                  <div>
                    <h2 className="font-black text-sm tracking-tight">{test.name}</h2>
                    <p className="text-[10px] opacity-80 font-bold uppercase tracking-wider">{category?.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black opacity-80 uppercase">Time Remaining</span>
                    <div className={`text-xl font-black font-mono flex items-center gap-1.5 ${timeLeft < 60 ? 'text-red-200 animate-pulse' : 'text-white'}`}>
                      <Clock className="w-4 h-4" />
                      {formatTime(timeLeft)}
                    </div>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    className="bg-white text-green-600 hover:bg-green-50 font-black rounded-xl h-9 px-5 shadow-lg border-0"
                  >
                    Submit Test
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Question Card */}
            <Card className="flex-1 flex flex-col overflow-hidden border-slate-100 shadow-sm relative">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-3 px-5">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Question No.</span>
                  <span className="text-lg font-black text-green-600">{currentQuestion + 1} <span className="text-slate-300 font-medium">/ {questions.length}</span></span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleBookmark}
                    className={`p-2 rounded-xl border transition-all ${bookmarked[currentQ._id || currentQ.id || '']
                        ? 'bg-orange-100 border-orange-200 text-orange-600'
                        : 'bg-white border-slate-200 text-slate-400 hover:border-orange-200 hover:text-orange-500'
                      }`}
                    title="Mark for Review"
                  >
                    <Flag className={`h-4 w-4 ${bookmarked[currentQ._id || currentQ.id || ''] ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </CardHeader>

              <CardContent className="p-0 flex flex-col flex-1">
                <div className="p-6 flex-1 overflow-y-auto">
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 leading-relaxed mb-6">
                    {currentQ.question_text || currentQ.question_text_hindi}
                  </h3>

                  {currentQ.question_text_hindi && currentQ.question_text && (
                    <p className="text-xs sm:text-sm text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 italic">
                      {currentQ.question_text_hindi}
                    </p>
                  )}

                  {currentQ.question_image_url && (
                    <div className="mb-6 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                      <img src={currentQ.question_image_url} alt="Question" className="w-full max-h-80 object-contain mx-auto" />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { text: currentQ.option_a, key: 0, label: 'A' },
                      { text: currentQ.option_b, key: 1, label: 'B' },
                      { text: currentQ.option_c, key: 2, label: 'C' },
                      { text: currentQ.option_d, key: 3, label: 'D' }
                    ].map((opt) => {
                      const qId = currentQ._id || currentQ.id || '';
                      const isSelected = answers[qId] === opt.key;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => handleAnswerSelect(opt.key)}
                          className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group ${isSelected
                              ? 'border-green-500 bg-green-50 ring-4 ring-green-500/5'
                              : 'border-slate-100 bg-white hover:border-green-200 hover:bg-green-50/30'
                            }`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-colors ${isSelected ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-green-100 group-hover:text-green-600'
                            }`}>
                            {opt.label}
                          </div>
                          <span className={`text-sm font-bold ${isSelected ? 'text-green-800' : 'text-slate-600 group-hover:text-slate-800'}`}>
                            {opt.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 relative">
                  <Button
                    variant="ghost"
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                    className="font-black text-slate-500 rounded-xl px-6"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                  </Button>

                  <button
                    onClick={() => setPaletteCollapsed(!paletteCollapsed)}
                    className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-white border border-slate-200 rounded-lg items-center justify-center shadow-md z-10 hover:bg-slate-50 transition-all text-slate-400 hover:text-green-600"
                  >
                    {paletteCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setAnswers({ ...answers, [currentQ._id || currentQ.id || '']: -1 })}
                      className="border-slate-200 text-slate-400 rounded-xl px-6 font-bold hover:bg-slate-100"
                    >
                      Clear
                    </Button>
                    <Button
                      onClick={handleNext}
                      disabled={currentQuestion === questions.length - 1}
                      className="bg-green-600 hover:bg-green-700 text-white font-black rounded-xl px-8 shadow-lg shadow-green-600/20"
                    >
                      Next <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Question Palette */}
          <div className={`transition-all duration-300 ease-in-out ${paletteCollapsed
              ? 'w-0 opacity-0 pointer-events-none -mr-4'
              : 'w-full lg:w-72 opacity-100'
            } flex flex-col gap-4 lg:sticky top-4 self-start`}>

            <Card className="border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Questions Palette</h4>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-green-500 shadow-sm shadow-green-500/20" />
                    <span className="text-[10px] font-bold text-slate-500">Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-slate-200" />
                    <span className="text-[10px] font-bold text-slate-500">Not Visited</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-orange-400 shadow-sm shadow-orange-500/20" />
                    <span className="text-[10px] font-bold text-slate-500">To Review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm border-2 border-slate-300 bg-white" />
                    <span className="text-[10px] font-bold text-slate-500">Skipped</span>
                  </div>
                </div>
              </div>

              <CardContent className="p-4 bg-white max-h-[400px] overflow-y-auto scrollbar-hide">
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, idx) => {
                    const qId = q._id || q.id || '';
                    const isAnswered = answers[qId] !== undefined && answers[qId] !== -1;
                    const isReview = bookmarked[qId];
                    const isCurrent = idx === currentQuestion;

                    let cls = 'bg-slate-100 text-slate-400 border-transparent hover:bg-slate-200';
                    if (isCurrent) cls = 'bg-white border-green-500 text-green-600 ring-4 ring-green-600/10 font-black';
                    else if (isReview) cls = 'bg-orange-400 border-orange-400 text-white shadow-md shadow-orange-500/20';
                    else if (isAnswered) cls = 'bg-green-500 border-green-500 text-white shadow-md shadow-green-500/20';

                    return (
                      <button
                        key={idx}
                        onClick={() => setCurrentQuestion(idx)}
                        className={`h-9 w-full rounded-xl border text-xs font-bold transition-all ${cls}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </CardContent>

              <div className="p-4 bg-slate-50 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>PROGRESS</span>
                  <span>{Object.values(answers).filter(v => v !== -1).length} / {questions.length}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${(Object.values(answers).filter(v => v !== -1).length / questions.length) * 100}%` }}
                  />
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-0 p-5 text-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors" />
              <CardContent className="p-0 relative z-10">
                <h5 className="font-black text-xs uppercase tracking-widest mb-2 opacity-50">Exam Mode</h5>
                <p className="text-[11px] font-medium leading-relaxed opacity-90">Please ensure a stable connection. All progress is saved automatically.</p>
              </CardContent>
            </Card>
          </div>

        </main>
      </div>
    </UserLayout>
  );
};

export default TestAttempt;
