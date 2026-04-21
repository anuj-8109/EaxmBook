import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, ChevronLeft, ChevronRight, Pencil, AlertTriangle, Bookmark, X } from 'lucide-react';
import { questionsAPI, bookmarksAPI } from '@/lib/api';
import { toast } from 'sonner';
import Loader from '@/components/Loader';

interface Question {
  _id?: string; id?: string;
  question_text: string;
  option_a: string; option_b: string; option_c: string; option_d: string;
  correct_answer: number;
  explanation?: string;
  category_id?: any; subject_id?: any; topic_id?: any;
}
interface PracticeData {
  mode: 'exam' | 'wrong';
  categoryIds: string[]; subjectIds: string[]; topicIds: string[];
  difficultyLevel?: number;
  timerType: 'question' | 'overall' | 'none';
  questionTime?: number; overallTime?: number;
  numQuestions: number; showAnswers: 'individual' | 'after';
}

const OPTS = ['A', 'B', 'C', 'D'];

const CustomPracticeSession = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
  const [practiceData, setPracticeData] = useState<PracticeData | null>(null);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(0);
  const [overallTimeLeft, setOverallTimeLeft] = useState(0);
  const [startTime] = useState(new Date().toISOString());
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);

  useEffect(() => {
    const data = sessionStorage.getItem('customPracticeData');
    if (!data) { toast.error('Practice session data not found'); navigate('/practice'); return; }
    const parsed = JSON.parse(data) as PracticeData;
    setPracticeData(parsed);
    fetchQuestions(parsed);
  }, [navigate]);

  useEffect(() => {
    if (!practiceData || questions.length === 0) return;
    if (practiceData.timerType === 'question' && practiceData.questionTime)
      setQuestionTimeLeft(practiceData.questionTime);
    if (practiceData.timerType === 'overall' && practiceData.overallTime)
      setOverallTimeLeft(practiceData.overallTime * 60);
  }, [practiceData, questions.length]);

  useEffect(() => {
    if (practiceData?.timerType !== 'overall' || overallTimeLeft <= 0) return;
    const t = setInterval(() => setOverallTimeLeft(p => { if (p <= 1) { handleSubmit(); return 0; } return p - 1; }), 1000);
    return () => clearInterval(t);
  }, [practiceData?.timerType, overallTimeLeft]);

  useEffect(() => {
    if (practiceData?.timerType !== 'question' || questionTimeLeft <= 0) return;
    const t = setInterval(() => setQuestionTimeLeft(p => { if (p <= 1) { handleNext(); return 0; } return p - 1; }), 1000);
    return () => clearInterval(t);
  }, [practiceData?.timerType, questionTimeLeft, currentQuestion]);

  const fetchQuestions = async (data: PracticeData) => {
    try {
      let list: Question[] = [];
      if (data.mode === 'wrong') {
        // Fetch all wrong answers (up to 100) for practice
        const wd = await bookmarksAPI.getWrongAnswers(1, 100);
        const ids = wd.questionIds || [];
        if (!ids.length) { toast.error('No wrong answers found'); navigate('/practice'); return; }
        list = (await Promise.all(ids.slice(0, data.numQuestions).map((id: string) =>
          questionsAPI.getById(id).catch(() => null)
        ))).filter(Boolean) as Question[];
      } else {
        const f: any = { limit: data.numQuestions * 2 };
        if (data.categoryIds.length) f.category_ids = data.categoryIds;
        if (data.subjectIds.length) f.subject_ids = data.subjectIds;
        if (data.topicIds.length) f.topic_ids = data.topicIds;
        const resp = await questionsAPI.getAll(f);
        list = (resp.questions || []).slice(0, data.numQuestions);
      }
      list = list.sort(() => Math.random() - 0.5);
      if (!list.length) { toast.error('No questions found'); navigate('/practice'); return; }
      setQuestions(list);
    } catch { toast.error('Failed to load questions'); navigate('/practice'); }
    finally { setLoading(false); }
  };

  const qid = (q: Question) => (q._id || q.id)!;
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const bookmarkedCount = Object.values(bookmarked).filter(Boolean).length;

  const handleAnswerSelect = (idx: number) => {
    const id = qid(questions[currentQuestion]);
    setAnswers(prev => ({ ...prev, [id]: idx }));
  };
  const handleClear = () => {
    const id = qid(questions[currentQuestion]);
    setAnswers(prev => { const n = { ...prev }; delete n[id]; return n; });
  };
  const handleToggleBookmark = async () => {
    const id = qid(questions[currentQuestion]);
    try {
      await bookmarksAPI.toggle(id);
      setBookmarked(prev => ({ ...prev, [id]: !prev[id] }));
      toast.success(bookmarked[id] ? 'Bookmark removed' : 'Question bookmarked');
    } catch (error) {
      toast.error('Failed to update bookmark');
    }
  };
  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(p => p + 1);
      if (practiceData?.timerType === 'question' && practiceData.questionTime)
        setQuestionTimeLeft(practiceData.questionTime);
    } else { setSubmitDialogOpen(true); }
  };
  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(p => p - 1);
      if (practiceData?.timerType === 'question' && practiceData.questionTime)
        setQuestionTimeLeft(practiceData.questionTime);
    }
  };
  const handleSubmit = () => {
    setSubmitDialogOpen(false);
    let correct = 0, wrong = 0, unanswered = 0;
    questions.forEach(q => {
      const ua = answers[qid(q)];
      if (ua === undefined) unanswered++;
      else if (ua === q.correct_answer) correct++;
      else wrong++;
    });
    sessionStorage.setItem('customPracticeResults', JSON.stringify({
      questions, answers, correct, wrong, unanswered,
      total: questions.length, practiceData, startTime,
      endTime: new Date().toISOString(),
    }));
    navigate('/practice/result');
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const examLabel = useMemo(() => {
    const pd = practiceData;
    if (!pd) return 'Custom Practice';
    return 'SSC CGL › Quantitative Aptitude';
  }, [practiceData]);

  if (loading || !practiceData) return (
    <div className="w-full min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader text="Preparing your test..." />
    </div>
  );

  if (!questions.length) return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      <p className="font-semibold text-slate-700">No questions available</p>
      <Button onClick={() => navigate('/practice')}>Go Back</Button>
    </div>
  );

  const currentQ = questions[currentQuestion];
  const userAnswer = answers[qid(currentQ)];
  const isBookmark = bookmarked[qid(currentQ)];
  const opts = [currentQ.option_a, currentQ.option_b, currentQ.option_c, currentQ.option_d];
  const timerSecs = practiceData.timerType === 'overall' ? overallTimeLeft : questionTimeLeft;
  const showTimer = practiceData.timerType !== 'none' && timerSecs > 0;

  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col text-slate-900">

      {/* ── Top Green Navbar ── */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-green-700 to-green-600 text-white px-4 h-12 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3 min-w-0">
          {/* Brand */}
          <span className="font-black text-sm tracking-wide hidden sm:block">EXAMPULSE</span>
          {/* Session badge */}
          <span className="bg-white/20 border border-white/30 rounded-md px-2 py-0.5 text-[10px] font-bold">CP-2025</span>
          {/* Exam label */}
          <span className="text-[11px] text-green-100 hidden md:block truncate">{examLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Timer pill */}
          {showTimer && (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-bold ${timerSecs < 60 ? 'bg-red-500/90 border-red-300 animate-pulse' : 'bg-white/20 border-white/30'
              }`}>
              <Clock className="w-3 h-3" />
              {formatTime(timerSecs)}
            </div>
          )}
          {/* Font size controls */}
          <button className="w-7 h-7 rounded bg-white/20 border border-white/30 text-xs font-bold hover:bg-white/30">A-</button>
          <button className="w-7 h-7 rounded bg-white/20 border border-white/30 text-xs font-bold hover:bg-white/30">A+</button>
          <button className="w-7 h-7 rounded bg-white/20 border border-white/30 text-[10px] font-bold hover:bg-white/30">EN</button>
          <button
            onClick={handleToggleBookmark}
            className={`w-7 h-7 rounded border flex items-center justify-center transition-colors ${isBookmark ? 'bg-orange-400 border-orange-300' : 'bg-white/20 border-white/30 hover:bg-white/30'
              }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
          </button>
          <Button
            size="sm"
            className="bg-white text-green-700 hover:bg-green-50 rounded-lg h-7 px-3 text-xs font-bold"
            onClick={() => setSubmitDialogOpen(true)}
          >
            Submit Test
          </Button>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="flex-1 flex flex-row gap-0 max-w-full w-full mx-auto p-4 gap-4 relative overflow-hidden">


        {/* ── Left: Question Area ── */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">

            {/* Question header */}
            <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <div className="flex items-center gap-2">
                <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100">
                  <Pencil className="w-3.5 h-3.5 text-slate-500" />
                </button>
                <button className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100">
                  <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Question text */}
            <div className="px-5 py-4 border-b border-slate-50">
              <p className="text-sm font-medium text-slate-800 leading-relaxed">{currentQ.question_text}</p>
            </div>

            {/* Options */}
            <div className="px-5 py-4 space-y-3 flex-1">
              {opts.map((opt, idx) => {
                const isSelected = userAnswer === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(idx)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-sm ${isSelected
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-200 bg-white hover:border-green-300 hover:bg-green-50/30'
                      }`}
                  >
                    <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold ${isSelected ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300 text-slate-500'
                      }`}>{OPTS[idx]}</span>
                    <span className={`font-medium ${isSelected ? 'text-green-800' : 'text-slate-700'}`}>{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Bottom nav row */}
            <div className="bg-slate-50 border-t border-slate-100 px-5 py-3 flex items-center justify-between gap-3 relative">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs border-slate-200 font-semibold gap-1.5"
                  onClick={handlePrev}
                  disabled={currentQuestion === 0}
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </Button>
              </div>

              {/* Floating Collapse Button (visible on LG screens) */}
              <button
                onClick={() => setPaletteCollapsed(!paletteCollapsed)}
                className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-white border border-slate-200 rounded-lg items-center justify-center shadow-md z-10 hover:bg-slate-50 transition-all text-slate-400 hover:text-green-600"
              >
                {paletteCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>


              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs border-slate-200 text-slate-600 font-semibold"
                  onClick={handleClear}
                  disabled={userAnswer === undefined}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  className="rounded-xl text-xs bg-green-500 hover:bg-green-600 text-white font-semibold gap-1.5"
                  onClick={handleNext}
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Question Palette ── */}
        <div className={`transition-all duration-300 ease-in-out ${paletteCollapsed
            ? 'w-0 opacity-0 pointer-events-none -mr-4'
            : 'w-full lg:w-64 opacity-100'
          } flex flex-col gap-3 lg:sticky top-16 self-start`}>

          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">

            {/* Legend */}
            <div className="px-4 pt-4 pb-3 border-b border-slate-50">
              <div className="flex flex-col gap-1.5 text-[11px] font-semibold text-slate-600 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-green-500" /> Answered
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-white border border-slate-300" /> Not Answered
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm bg-orange-400" /> Bookmarked
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { val: answeredCount, label: 'Answered', cls: 'text-green-600' },
                  { val: unansweredCount, label: 'Unanswered', cls: 'text-slate-700' },
                  { val: bookmarkedCount, label: 'Bookmarked', cls: 'text-orange-500' },
                ].map(s => (
                  <div key={s.label}>
                    <div className={`text-lg font-black ${s.cls}`}>{s.val}</div>
                    <div className="text-[9px] text-slate-400 leading-tight">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="p-3 grid grid-cols-5 gap-1.5">
              {questions.map((q, idx) => {
                const id = qid(q);
                const isAns = answers[id] !== undefined;
                const isBk = bookmarked[id];
                const isCur = idx === currentQuestion;
                let cls = 'bg-white border-slate-200 text-slate-600 hover:border-green-300';
                if (isCur) cls = 'bg-white border-green-500 text-green-700 ring-2 ring-green-200 font-black';
                else if (isBk) cls = 'bg-orange-400 border-orange-400 text-white';
                else if (isAns) cls = 'bg-green-500 border-green-500 text-white';
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuestion(idx)}
                    className={`h-8 w-full rounded-lg border text-[11px] font-bold transition-all ${cls}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

          </div>
        </div>
      </main>

      {/* ── Submit Dialog ── */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent className="sm:max-w-sm rounded-3xl border-0 shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 text-center">
            <DialogTitle className="text-base font-black text-green-700">Submit Test?</DialogTitle>
          </DialogHeader>

          {/* 3 stats */}
          <div className="grid grid-cols-3 gap-3 px-6">
            {[
              { val: answeredCount, label: 'Answered', cls: 'text-green-600 bg-green-50 border-green-200' },
              { val: unansweredCount, label: 'Unanswered', cls: 'text-slate-700 bg-slate-50 border-slate-200' },
              { val: bookmarkedCount, label: 'Bookmarked', cls: 'text-orange-500 bg-orange-50 border-orange-200' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border ${s.cls} p-3 text-center`}>
                <div className={`text-2xl font-black ${s.cls.split(' ')[0]}`}>{s.val}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-slate-500 px-6 mt-3">Are you sure you want to submit?</p>

          <div className="grid grid-cols-2 gap-3 px-6 pb-6 mt-4">
            <Button variant="outline" className="rounded-xl font-semibold text-sm" onClick={() => setSubmitDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm" onClick={handleSubmit}>
              Yes, Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomPracticeSession;
