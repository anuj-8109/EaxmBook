import { useState, useEffect, useCallback } from 'react';
import { UserLayout } from '@/components/UserLayout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Target, CheckCircle2, Clock, Lock, RefreshCw, ChevronRight, BookOpen,
  Brain, Globe, Pencil, Play,
} from 'lucide-react';
import { categoriesAPI, subjectsAPI, topicsAPI } from '@/lib/api';
import { toast } from 'sonner';
import Loader from '@/components/Loader';
import { ModeCard } from '@/components/ui/mode-card';

interface Category { _id?: string; id?: string; name: string; icon?: string; }
interface Subject { _id?: string; id?: string; name: string; topicCount?: number; }
interface Topic { _id?: string; id?: string; name: string; questionCount?: number; }

// ── Utility ──────────────────────────────────────────────────────────────────
const subjectIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('quant') || n.includes('math')) return <BookOpen className="w-4 h-4" />;
  if (n.includes('intel') || n.includes('reason')) return <Brain className="w-4 h-4" />;
  if (n.includes('english') || n.includes('compre')) return <Pencil className="w-4 h-4" />;
  if (n.includes('aware') || n.includes('general')) return <Globe className="w-4 h-4" />;
  return <BookOpen className="w-4 h-4" />;
};

// Mock progress per subject (in real app, from API)
const mockSubProgress: Record<string, { level: number; status: 'In Progress' | 'Not Started' | 'Completed' }> = {};
const getSubProg = (id: string) => mockSubProgress[id] || {
  level: Math.floor(Math.random() * 7) + 1,
  status: Math.random() > 0.2 ? 'In Progress' : 'Not Started',
};

// Progress dots (10 dots)
const LevelDots = ({ level, max = 10 }: { level: number; max?: number }) => (
  <div className="flex gap-1">
    {Array.from({ length: max }).map((_, i) => (
      <span
        key={i}
        className={`w-2.5 h-2.5 rounded-full border transition-all ${i < level ? 'bg-green-500 border-green-500' : 'bg-slate-100 border-slate-300'
          }`}
      />
    ))}
  </div>
);

// Topic status dot-row
const TopicDots = ({ score, max = 10 }: { score: number; max?: number }) => (
  <div className="flex gap-1 items-center">
    {Array.from({ length: max }).map((_, i) => (
      <span
        key={i}
        className={`w-2 h-2 rounded-full ${i < score ? (score < 4 ? 'bg-red-500' : 'bg-green-500') : 'bg-slate-200'
          }`}
      />
    ))}
  </div>
);

const BasicToAdvance = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [selectedSub, setSelectedSub] = useState<Subject | null>(null);
  const [view, setView] = useState<'home' | 'subjects' | 'topics'>('home');

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { if (selectedCat) fetchSubjects(); }, [selectedCat]);
  useEffect(() => { if (selectedSub) fetchTopics(); }, [selectedSub]);

  const fetchCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      setCategories(Array.isArray(data) ? data : data?.categories || []);
    } catch { toast.error('Failed to load exams'); }
    finally { setLoading(false); }
  };

  const fetchSubjects = useCallback(async () => {
    if (!selectedCat) return;
    try {
      const catId = selectedCat._id || selectedCat.id;
      const data = await subjectsAPI.getAll(catId);
      setSubjects(Array.isArray(data) ? data : data?.subjects || []);
    } catch { console.error('subjects fetch failed'); }
  }, [selectedCat]);

  const fetchTopics = useCallback(async () => {
    if (!selectedSub) return;
    try {
      const subId = selectedSub._id || selectedSub.id;
      const data = await topicsAPI.getAll(subId);
      setTopics(Array.isArray(data) ? data : data?.topics || []);
    } catch { console.error('topics fetch failed'); }
  }, [selectedSub]);

  const handleStartLevel = (topicId: string, level: number) => {
    sessionStorage.setItem('customPracticeData', JSON.stringify({
      mode: 'exam',
      categoryIds: [selectedCat?._id || selectedCat?.id],
      subjectIds: [selectedSub?._id || selectedSub?.id],
      topicIds: [topicId],
      difficultyLevel: level,
      timerType: 'question',
      questionTime: 45 + level * 5,
      numQuestions: 10,
      showAnswers: 'after',
    }));
    navigate('/practice/session');
  };

  if (loading) return (
    <UserLayout>
      <div className="flex justify-center items-center h-[calc(100vh-120px)]">
        <Loader text="Loading..." />
      </div>
    </UserLayout>
  );

  /* ── View: Topics ── */
  if (view === 'topics' && selectedSub && selectedCat) {
    const stats = { attempted: 3, inProgress: 4, notStarted: topics.length - 7 };
    return (
      <UserLayout>
        <div className="w-full space-y-4">
          {/* Breadcrumb */}
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <button onClick={() => setView('home')} className="hover:text-green-600 font-semibold">Basic to Advance</button>
            <ChevronRight className="w-3 h-3" />
            <button onClick={() => setView('subjects')} className="hover:text-green-600 font-semibold">{selectedCat.name}</button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-green-700 font-bold">{selectedSub.name}</span>
          </div>

          {/* Green header */}
          <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl px-5 py-4 text-white shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white">
                  {subjectIcon(selectedSub.name)}
                </div>
                <div>
                  <h2 className="text-sm font-black">{selectedSub.name}</h2>
                  <p className="text-green-100 text-[11px] mt-0.5">
                    {selectedCat.name} • {topics.length || 12} Topics • 10 Levels • Test
                  </p>
                </div>
              </div>
              <div className="flex gap-4 text-center text-xs">
                {[
                  { val: stats.attempted, label: 'Levels Attempted' },
                  { val: stats.inProgress, label: 'In Progress' },
                  { val: Math.max(0, topics.length - stats.attempted - stats.inProgress), label: 'Not Started' },
                ].map(s => (
                  <div key={s.label}>
                    <div className="text-xl font-black">{s.val}</div>
                    <div className="text-green-100 text-[10px] leading-tight">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Topics list */}
          <div className="bg-white border border-green-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-50">
              <h3 className="text-xs font-bold text-green-700 uppercase tracking-wide">All Topics</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {(topics.length > 0 ? topics : [
                { _id: 't1', name: 'Number System', questionCount: 100 },
                { _id: 't2', name: 'Percentage', questionCount: 86 },
                { _id: 't3', name: 'Simple & Compound Interest', questionCount: 64 },
                { _id: 't4', name: 'Profit & Loss', questionCount: 98 },
                { _id: 't5', name: 'Time & Work', questionCount: 75 },
                { _id: 't6', name: 'Ratio & Proportion', questionCount: 60 },
              ]).map((topic, idx) => {
                const topicId = topic._id || topic.id || String(idx);
                const level = [10, 2, 3, 1, 5, 4][idx % 6];
                const dotScore = [10, 4, 3, 2, 5, 4][idx % 6];
                const status = ['Mastered', 'Level 2 | 93', 'Level 3 | 93', 'Continue Test', 'In Progress', 'Level 4 | 85'][idx % 6];
                const isGood = status === 'Mastered';
                const isBad = status === 'Continue Test';
                const nextPct = [43, 16, 17, null, 22, 18][idx % 6];

                return (
                  <div key={topicId} className="flex items-center gap-4 px-5 py-3.5 hover:bg-green-50/30 transition-colors group">
                    <span className="w-5 text-xs font-bold text-slate-400">{String(idx + 1).padStart(2, '0')}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800">{topic.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        In level: {topic.questionCount || '10 Q\'s'}/Level
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <TopicDots score={dotScore} />
                        {nextPct !== null && (
                          <span className="text-[10px] text-slate-400">Free: {nextPct}%</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isGood ? 'bg-green-100 text-green-700' :
                          isBad ? 'bg-red-100 text-red-600' :
                            'bg-blue-50 text-blue-600'
                        }`}>
                        {isGood ? '✅ Mastered' : isBad ? '❌ Continue Test' : status}
                      </span>
                      {nextPct !== null && (
                        <span className="text-[10px] text-slate-400">Next: {nextPct}%</span>
                      )}
                      <Button
                        size="sm"
                        className="h-6 px-2.5 text-[10px] bg-green-500 hover:bg-green-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity gap-1"
                        onClick={() => handleStartLevel(topicId, level)}
                      >
                        <Play className="w-2.5 h-2.5" /> Start Level {level}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </UserLayout>
    );
  }

  /* ── View: Subjects ── */
  if (view === 'subjects' && selectedCat) {
    const subList = subjects.length > 0 ? subjects : [
      { _id: 's1', name: 'Quantitative Aptitude', topicCount: 12 },
      { _id: 's2', name: 'General Intelligence', topicCount: 6 },
      { _id: 's3', name: 'English Comprehension', topicCount: 8 },
      { _id: 's4', name: 'General Awareness', topicCount: 16 },
    ];

    return (
      <UserLayout>
        <div className="w-full space-y-4">
          {/* Breadcrumb */}
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <button onClick={() => setView('home')} className="hover:text-green-600 font-semibold">Basic to Advance</button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-green-700 font-bold">{selectedCat.name}</span>
          </div>

          <div className="bg-white border border-green-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-50">
              <h3 className="text-xs font-bold text-green-700 uppercase tracking-wide">Subjects — {selectedCat.name}</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {subList.map((sub, idx) => {
                const subId = sub._id || sub.id || String(idx);
                const prog = [4, 2, 6, 0][idx % 4];
                const status = prog > 0 ? 'In Progress' : 'Not Started';

                return (
                  <button
                    key={subId}
                    onClick={() => { setSelectedSub(sub); setView('topics'); }}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-green-50/40 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                      {subjectIcon(sub.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800">{sub.name}</p>
                      <p className="text-[10px] text-slate-400">{sub.topicCount || '?'} Topics</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-[10px] font-bold text-green-600 whitespace-nowrap">
                        Level {prog}/10
                      </span>
                      <div className="w-24 bg-slate-100 rounded-full h-1">
                        <div className="h-1 rounded-full bg-green-500" style={{ width: `${prog * 10}%` }} />
                      </div>
                      <span className={`text-[9px] font-bold ${status === 'In Progress' ? 'text-green-600' : 'text-slate-400'}`}>
                        {status}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </UserLayout>
    );
  }

  /* ── View: Home ── */
  return (
    <UserLayout>
      <div className="w-full space-y-4">

        {/* ── Green Header ── */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl px-6 py-5 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="relative z-10">
            <h1 className="text-lg font-black">🎯 Basic to Advance</h1>
            <p className="text-green-100 text-xs mt-1">
              Master every topic level by level — unlock the next only when you're ready
            </p>
          </div>
        </div>

        {/* ── Info cards row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: <Target className="w-5 h-5 text-red-500" />, title: '10 Questions / Level', desc: 'Each level has 10 random questions' },
            { icon: <CheckCircle2 className="w-5 h-5 text-green-600" />, title: '45/50 to Unlock Next', desc: 'Score 45 or more to proceed' },
            { icon: <Clock className="w-5 h-5 text-blue-500" />, title: 'Fixed Timer per Level', desc: 'Time depends on level difficulty' },
            { icon: <Lock className="w-5 h-5 text-slate-500" />, title: '2 Attempts / 24 hrs', desc: 'Max 2 failed attempts per day' },
          ].map(card => (
            <div key={card.title} className="bg-white border border-green-100 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
              {card.icon}
              <h4 className="text-xs font-black text-slate-800 leading-tight">{card.title}</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Your Exam selector ── */}
        <div className="bg-white border border-green-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-50">
            <h3 className="text-xs font-bold text-green-700 uppercase tracking-wide">Your Exam</h3>
          </div>
          <div className="p-4">
            {selectedCat ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">{selectedCat.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Combined Graduate Level • 42% Overall Progress
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-green-200 text-green-700 text-xs h-7 gap-1.5"
                  onClick={() => { setSelectedCat(null); setView('home'); }}
                >
                  <RefreshCw className="w-3 h-3" /> Change Exam
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(categories.slice(0, 6).length > 0 ? categories.slice(0, 6) : [
                  { _id: 'c1', name: 'SSC CGL', icon: '📊' },
                  { _id: 'c2', name: 'RRB NTPC', icon: '🚂' },
                  { _id: 'c3', name: 'Banking IBPS', icon: '🏦' },
                  { _id: 'c4', name: 'UP Police', icon: '👮' },
                ]).map(cat => (
                  <button
                    key={cat._id || cat.id}
                    onClick={() => { setSelectedCat(cat); setView('subjects'); }}
                    className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 hover:border-green-400 hover:bg-green-50 transition-all text-left"
                  >
                    <span className="text-lg">{cat.icon || '📚'}</span>
                    <span className="text-xs font-bold text-slate-700">{cat.name}</span>
                    <ChevronRight className="w-3 h-3 text-slate-400 ml-auto" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Subjects preview (only after exam selected) ── */}
        {selectedCat && (
          <div className="bg-white border border-green-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-green-700 uppercase tracking-wide">
                Subjects — {selectedCat.name}
              </h3>
              <button
                onClick={() => setView('subjects')}
                className="text-[11px] font-semibold text-green-600 hover:underline flex items-center gap-0.5"
              >
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-slate-50">
              {(subjects.length > 0 ? subjects.slice(0, 4) : [
                { _id: 's1', name: 'Quantitative Aptitude', topicCount: 12 },
                { _id: 's2', name: 'General Intelligence', topicCount: 6 },
                { _id: 's3', name: 'English Comprehension', topicCount: 8 },
                { _id: 's4', name: 'General Awareness', topicCount: 16 },
              ]).map((sub, idx) => {
                const prog = [4, 2, 6, 0][idx % 4];
                const status = prog > 0 ? 'In Progress' : 'Not Started';
                return (
                  <button
                    key={sub._id || idx}
                    onClick={() => { setSelectedSub(sub); setView('topics'); }}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-green-50/40 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                      {subjectIcon(sub.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800">{sub.name}</p>
                      <p className="text-[10px] text-slate-400">{sub.topicCount || '?'} Topics</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-bold text-green-600">Level {prog}/10</span>
                      <div className="w-20 bg-slate-100 rounded-full h-1">
                        <div className="h-1 rounded-full bg-green-500" style={{ width: `${prog * 10}%` }} />
                      </div>
                      <span className={`text-[9px] font-semibold ${status === 'In Progress' ? 'text-green-600' : 'text-slate-400'}`}>
                        {status}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </UserLayout>
  );
};

export default BasicToAdvance;
