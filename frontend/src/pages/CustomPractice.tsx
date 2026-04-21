import { useState, useEffect, useCallback } from 'react';
import { UserLayout } from '@/components/UserLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { Target, Search, X, Play, Minus, Plus } from 'lucide-react';
import { categoriesAPI, subjectsAPI, topicsAPI, bookmarksAPI } from '@/lib/api';
import { toast } from 'sonner';
import Loader from '@/components/Loader';

interface Category { _id?: string; id?: string; name: string; icon: string; }
interface Subject { _id?: string; id?: string; name: string; }
interface Topic { _id?: string; id?: string; name: string; }

/* ── Reusable Search Select ── */
const SearchSelect = ({
  label, placeholder, results, selected, onSelect, onRemove, onSearch, searchVal,
}: {
  label: string; placeholder: string;
  results: { id: string; name: string }[];
  selected: { id: string; name: string }[];
  onSelect: (item: { id: string; name: string }) => void;
  onRemove: (id: string) => void;
  onSearch: (v: string) => void;
  searchVal: string;
}) => {
  const [open, setOpen] = useState(false);
  const filtered = results.filter(r => r.name.toLowerCase().includes(searchVal.toLowerCase()));

  return (
    <div className="relative">
      <Label className="text-xs font-bold text-green-700 mb-1.5 block">{label}</Label>

      {/* Search input */}
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors">
          <Search className="w-3.5 h-3.5" />
        </div>
        <Input
          className="pl-10 h-10 rounded-xl border-slate-200 text-xs bg-white focus:border-green-400 focus:ring-4 focus:ring-green-400/10 transition-all font-medium"
          placeholder={placeholder}
          value={searchVal}
          onChange={e => { onSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
        />
        {open && filtered.length > 0 && (
          <div className="absolute z-30 left-0 right-0 top-full mt-1.5 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
            {filtered.map(item => (
              <button
                key={item.id}
                onMouseDown={() => { onSelect(item); onSearch(''); setOpen(false); }}
                className={`w-full text-left px-3 py-2.5 text-xs rounded-xl transition-all ${selected.some(s => s.id === item.id)
                    ? 'bg-green-50 text-green-700 font-bold'
                    : 'text-slate-700 hover:bg-green-50/50 hover:text-green-600'
                  }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected chips — Now below the search input */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
          {selected.map(s => (
            <span key={s.id} className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-white border border-green-100 text-green-700 rounded-xl text-[11px] font-bold shadow-sm hover:border-green-300 transition-all group">
              {s.name}
              <button 
                onClick={() => onRemove(s.id)} 
                className="p-0.5 rounded-md hover:bg-red-50 hover:text-red-500 transition-colors"
                title="Remove"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const CustomPractice = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [wrongAnswersCount, setWrongAnswersCount] = useState(0);

  // Search vals
  const [examSearch, setExamSearch] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [topicSearch, setTopicSearch] = useState('');

  // Selected items
  const [selCats, setSelCats] = useState<{ id: string; name: string }[]>([]);
  const [selSubs, setSelSubs] = useState<{ id: string; name: string }[]>([]);
  const [selTopics, setSelTopics] = useState<{ id: string; name: string }[]>([]);

  // Settings
  const [difficultyLevel, setDifficultyLevel] = useState<number[] | 'all'>('all');
  const [numQuestions, setNumQuestions] = useState(20);
  const [enableTimer, setEnableTimer] = useState(false);
  const [timerType, setTimerType] = useState<'question' | 'overall'>('question');
  const [questionTime, setQuestionTime] = useState(60);
  const [overallTime, setOverallTime] = useState(20);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    if (selCats.length > 0) fetchSubjects();
    else { setSubjects([]); setSelSubs([]); }
  }, [selCats]);
  useEffect(() => {
    if (selSubs.length > 0) fetchTopics();
    else { setTopics([]); setSelTopics([]); }
  }, [selSubs]);

  const fetchData = async () => {
    try {
      const [data] = await Promise.all([
        categoriesAPI.getAll(),
        bookmarksAPI.getWrongAnswers(1, 1).then(d => setWrongAnswersCount(d.totalQuestions || d.total || 0)).catch(() => { }),
      ]);
      setCategories(Array.isArray(data) ? data : data?.categories || []);
    } catch { toast.error('Failed to load exams'); }
    finally { setLoading(false); }
  };

  const fetchSubjects = useCallback(async () => {
    try {
      const results = await Promise.all(selCats.map(c => subjectsAPI.getAll(c.id)));
      setSubjects(results.flatMap(r => Array.isArray(r) ? r : r?.subjects || []));
    } catch { console.error('subjects fetch failed'); }
  }, [selCats]);

  const fetchTopics = useCallback(async () => {
    try {
      const results = await Promise.all(selSubs.map(s => topicsAPI.getAll(s.id)));
      setTopics(results.flatMap(r => Array.isArray(r) ? r : r?.topics || []));
    } catch { console.error('topics fetch failed'); }
  }, [selSubs]);

  const addItem = (setter: any, item: { id: string; name: string }, type?: 'category' | 'subject') => {
    if (type === 'category' || type === 'subject') {
      setter([item]);
      if (type === 'category') {
        toast.info(`${item.name} selected. You can only select one exam at a time.`);
      } else {
        toast.info(`${item.name} selected. You can only select one subject at a time.`);
      }
    } else {
      setter((prev: any[]) => prev.some(p => p.id === item.id) ? prev : [...prev, item]);
    }
  };

  const removeItem = (setter: any, id: string) =>
    setter((prev: any[]) => prev.filter(p => p.id !== id));

  const handleStart = () => {
    if (!selCats.length) { toast.error('Please select at least one exam'); return; }
    sessionStorage.setItem('customPracticeData', JSON.stringify({
      mode: 'exam',
      categoryIds: selCats.map(c => c.id),
      subjectIds: selSubs.map(s => s.id),
      topicIds: selTopics.map(t => t.id),
      difficultyLevel: difficultyLevel === 'all' ? undefined : difficultyLevel,
      timerType: enableTimer ? timerType : 'none',
      questionTime: enableTimer && timerType === 'question' ? questionTime : undefined,
      overallTime: enableTimer && timerType === 'overall' ? overallTime : undefined,
      numQuestions,
      showAnswers: 'after',
    }));
    navigate('/practice/session');
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="flex justify-center items-center h-[calc(100vh-120px)]">
          <Loader text="Loading Practice Setup..." />
        </div>
      </UserLayout>
    );
  }

  const catItems = categories.map(c => ({ id: (c._id || c.id) as string, name: c.name }));
  const subItems = subjects.map(s => ({ id: (s._id || s.id) as string, name: s.name }));
  const topItems = topics.map(t => ({ id: (t._id || t.id) as string, name: t.name }));
  const diffLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <UserLayout>
      <div className="w-full space-y-4">

        {/* ── Green Header ── */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl px-6 py-5 text-white shadow-lg flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center border border-white/30 flex-shrink-0">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div className="relative z-10">
            <h1 className="text-lg font-black">🎯 Custom Practice</h1>
            <p className="text-green-100 text-xs mt-0.5">Select exam, subject &amp; topics to build your practice set</p>
          </div>
        </div>

        {/* ── Main Card ── */}
        <div className="bg-green-50 border border-green-100 rounded-2xl p-6 space-y-5 shadow-sm">

          {/* Exam Search */}
          <SearchSelect
            label="Select Exam"
            placeholder="Search exam e.g. SSC CGL, RRB NTPC"
            results={catItems}
            selected={selCats}
            onSelect={item => addItem(setSelCats, item, 'category')}
            onRemove={id => removeItem(setSelCats, id)}
            onSearch={setExamSearch}
            searchVal={examSearch}
          />

          {/* Subject Search */}
          <SearchSelect
            label="Select Subject"
            placeholder="Search subject e.g. Quantitative Aptitude"
            results={subItems}
            selected={selSubs}
            onSelect={item => addItem(setSelSubs, item, 'subject')}
            onRemove={id => removeItem(setSelSubs, id)}
            onSearch={setSubjectSearch}
            searchVal={subjectSearch}
          />

          {/* Topics Search — multiselect */}
          <SearchSelect
            label="Select Topics"
            placeholder="Search topic e.g. Algebra, Grammar"
            results={topItems}
            selected={selTopics}
            onSelect={item => addItem(setSelTopics, item)}
            onRemove={id => removeItem(setSelTopics, id)}
            onSearch={setTopicSearch}
            searchVal={topicSearch}
          />

          {/* ── Difficulty Level ── */}
          <div>
            <Label className="text-xs font-bold text-green-700 mb-2 block flex items-center gap-2">
              Difficulty Level <span className="font-normal text-slate-400">(Optional)</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setDifficultyLevel('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${difficultyLevel === 'all'
                    ? 'bg-green-500 text-white border-green-500 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-green-300 hover:text-green-600'
                  }`}
              >
                All Levels
              </button>
              {diffLevels.map(lvl => {
                const isSelected = Array.isArray(difficultyLevel) ? (difficultyLevel as number[]).includes(lvl) : (difficultyLevel === (lvl as any));
                return (
                  <button
                    key={lvl}
                    onClick={() => {
                      if (difficultyLevel === 'all') {
                        setDifficultyLevel([lvl]);
                      } else {
                        const current = Array.isArray(difficultyLevel) ? difficultyLevel : [difficultyLevel];
                        if (current.includes(lvl)) {
                          const next = current.filter(l => l !== lvl);
                          setDifficultyLevel(next.length === 0 ? 'all' : next);
                        } else {
                          setDifficultyLevel([...current, lvl]);
                        }
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${isSelected
                        ? 'bg-green-500 text-white border-green-500 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-green-300 hover:text-green-600'
                      }`}
                  >
                    Level {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Number of Questions ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-bold text-green-700 flex items-center gap-1.5">
                Number of Questions <span className="text-slate-400 font-normal">(Max 50)</span>
              </Label>
              <span className="text-xs font-bold text-green-600">{numQuestions} Questions</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-10 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-sm font-black text-slate-800">
                {numQuestions}
              </span>
              <input
                type="range" min="5" max="50" step="5"
                value={numQuestions}
                onChange={e => setNumQuestions(+e.target.value)}
                className="flex-1 h-2 rounded-full accent-green-500 cursor-pointer"
              />
            </div>
          </div>

          {/* ── Timer ── */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            {/* Toggle row */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <Label className="text-xs font-bold text-green-700">Timer</Label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableTimer}
                  onChange={e => setEnableTimer(e.target.checked)}
                  className="sr-only peer"
                />
                <span className="text-xs font-medium text-slate-500 mr-2.5">Enable Timer</span>
                <div className="w-11 h-6 bg-slate-200 rounded-full peer
                  peer-checked:bg-green-500
                  after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                  after:bg-white after:rounded-full after:h-5 after:w-5
                  after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>

            {/* Timer options (visible when ON) */}
            {enableTimer && (
              <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Type selector */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTimerType('question')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-all ${timerType === 'question'
                        ? 'bg-green-50 border-green-400 text-green-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-green-200'
                      }`}
                  >
                    ⏱ Time per Question
                  </button>
                  <button
                    onClick={() => setTimerType('overall')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-all ${timerType === 'overall'
                        ? 'bg-green-50 border-green-400 text-green-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-green-200'
                      }`}
                  >
                    ⏰ Overall Timer
                  </button>
                </div>

                {/* +/- counter */}
                <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3">
                  <button
                    onClick={() => {
                      if (timerType === 'question') setQuestionTime(v => Math.max(10, v - 10));
                      else setOverallTime(v => Math.max(1, v - 5));
                    }}
                    className="w-8 h-8 rounded-full border border-slate-300 bg-white flex items-center justify-center text-slate-600 hover:border-green-400 hover:text-green-600 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-2xl font-black text-slate-800 min-w-[2.5rem] text-center">
                    {timerType === 'question' ? questionTime : overallTime}
                  </span>
                  <button
                    onClick={() => {
                      if (timerType === 'question') setQuestionTime(v => Math.min(300, v + 10));
                      else setOverallTime(v => Math.min(180, v + 5));
                    }}
                    className="w-8 h-8 rounded-full border border-slate-300 bg-white flex items-center justify-center text-slate-600 hover:border-green-400 hover:text-green-600 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-semibold text-slate-500">
                    {timerType === 'question' ? 'seconds / question' : 'minutes total'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── Start Button ── */}
          <Button
            onClick={handleStart}
            className="w-full h-12 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm shadow-lg shadow-green-500/30 gap-2 group transition-all"
          >
            <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
            🚀 Start Practice
          </Button>

        </div>
      </div>
    </UserLayout>
  );
};

export default CustomPractice;
