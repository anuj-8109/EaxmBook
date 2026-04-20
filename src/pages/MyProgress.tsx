import { useState, useEffect } from 'react';
import { UserLayout } from '@/components/UserLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Target, Clock, Trophy, Search,
  RefreshCw, ChevronDown, BarChart3, BookOpen,
  AlertTriangle, Play,
} from 'lucide-react';
import { progressAPI, categoriesAPI } from '@/lib/api';
import { toast } from 'sonner';
import Loader from '@/components/Loader';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell, ReferenceLine,
} from 'recharts';

interface Category { _id?: string; id?: string; name: string; }

const POPULAR_EXAMS = ['SSC CGL', 'RRB NTPC', 'Banking IBPS', 'UP Police', 'Railway Group D', 'Bihar SI'];

const TIME_TABS = ['This Week', 'This Month', 'All Time'];

const MyProgress = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedExam, setSelectedExam] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showExamPicker, setShowExamPicker] = useState(false);
  const [activeTab, setActiveTab] = useState('This Week');
  const [progressData, setProgressData] = useState<any>(null);

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    try {
      const [cats, analytics] = await Promise.all([
        categoriesAPI.getAll(),
        progressAPI.getAnalytics().catch(() => null),
      ]);
      const catsArray = Array.isArray(cats) ? cats : cats?.categories || [];
      setCategories(catsArray);
      setProgressData(analytics || buildFallback());
    } catch {
      toast.error('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const buildFallback = () => ({
    overall: { avgAccuracy: 78.5, avgTimePerQuestion: 72, totalAttempts: 12 },
    testWise: [
      { name: 'Test 15', score: 85 }, { name: 'Test 14', score: 78 },
      { name: 'Test 13', score: 87 }, { name: 'Test 12', score: 62 },
      { name: 'Test 11', score: 75 },
    ],
    subjectWise: [
      {
        name: 'Quantitative Aptitude', accuracy: 81, avgTime: 1.1, questions: 145, status: 'Need Practice',
        weakTopics: ['Percentage', 'Data Interpretation'], strongTopics: ['Simplification', 'Number System']
      },
      {
        name: 'General Intelligence', accuracy: 78, avgTime: 0.5, questions: 126, status: 'Average',
        weakTopics: ['Coding Decoding', 'Direction'], strongTopics: ['Analogy', 'Series']
      },
      {
        name: 'English Comprehension', accuracy: 87, avgTime: 1.1, questions: 120, status: 'Good Progress',
        weakTopics: ['Reading Comprehension', 'Vocabulary'], strongTopics: ['Grammar', 'Fill in Blanks']
      },
      {
        name: 'General Awareness', accuracy: 77, avgTime: 0.8, questions: 128, status: 'Average',
        weakTopics: ['Current Affairs', 'History'], strongTopics: ['Geography', 'Science']
      },
    ],
    weakTopics: [
      { subject: 'Quantitative Aptitude', topic: 'Percentage', score: 18 },
      { subject: 'Maths', topic: 'Vocabulary', score: 42 },
      { subject: 'General Intelligence', topic: 'Blood Relations', score: 45 },
      { subject: 'Quantitative Aptitude', topic: 'Data Interpretation', score: 12 },
      { subject: 'Maths', topic: 'Grammar', score: 53 },
      { subject: 'General Awareness', topic: 'Current Affairs', score: 38 },
    ],
  });

  const accuracy = progressData?.overall?.avgAccuracy ?? 78.5;
  const avgTimeSec = progressData?.overall?.avgTimePerQuestion ?? 72;
  const avgTimeMin = (avgTimeSec / 60).toFixed(1);
  const rank = 1234;
  const score = (accuracy * 0.95).toFixed(1);

  const chartData = (progressData?.testWise || []).map((t: any) => ({
    name: t.name, score: t.score ?? 0,
  }));
  const avgScore = chartData.length
    ? Math.round(chartData.reduce((s: number, d: any) => s + d.score, 0) / chartData.length)
    : 0;

  const filteredCats = categories.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <UserLayout>
        <div className="flex justify-center items-center h-[calc(100vh-120px)]">
          <Loader text="Analyzing your performance..." />
        </div>
      </UserLayout>
    );
  }

  /* ── Exam NOT selected: show selector ── */
  if (!selectedExam) {
    return (
      <UserLayout>
        <div className="w-full space-y-5">
          {/* Page title */}
          <h1 className="text-lg font-black text-slate-800">My Progress Dashboard</h1>

          {/* Exam Selector Card */}
          <div className="bg-green-50 border border-green-100 rounded-2xl p-10 flex flex-col items-center text-center shadow-sm">
            <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center mb-4 shadow-md">
              <Target className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-lg font-black text-slate-800 mb-1">Select Your Exam to View Progress</h2>
            <p className="text-xs text-slate-500 mb-6">Choose the exam you're preparing for to see detailed analysis</p>

            {/* Search */}
            <div className="flex gap-2 w-full max-w-md">
              <div className="relative flex-1">
                <Input
                  placeholder="Type exam name (e.g., SSC CGL, RRB NTPC, Banking)"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setShowExamPicker(true)}
                  className="pl-3 pr-3 rounded-xl text-xs border-slate-200 bg-white"
                />
                {showExamPicker && filteredCats.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                    {filteredCats.map(cat => (
                      <button
                        key={cat._id || cat.id}
                        onClick={() => { setSelectedExam(cat); setShowExamPicker(false); setSearchQuery(''); }}
                        className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={() => { if (filteredCats[0]) setSelectedExam(filteredCats[0]); }}
                className="bg-green-500 hover:bg-green-600 text-white rounded-xl px-5 text-xs font-semibold gap-1.5"
              >
                <Search className="w-3.5 h-3.5" /> Search
              </Button>
            </div>

            {/* Popular chips */}
            <div className="mt-5">
              <p className="text-[11px] text-slate-400 mb-2">Popular Exams</p>
              <div className="flex flex-wrap justify-center gap-2">
                {POPULAR_EXAMS.map(exam => {
                  const cat = categories.find(c => c.name.toLowerCase().includes(exam.toLowerCase()));
                  return (
                    <button
                      key={exam}
                      onClick={() => cat ? setSelectedExam(cat) : toast.error(`${exam} not found`)}
                      className="px-4 py-1.5 rounded-full border border-green-200 bg-white text-green-700 text-xs font-semibold hover:bg-green-500 hover:text-white hover:border-green-500 transition-all"
                    >
                      {exam}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </UserLayout>
    );
  }

  /* ── Dashboard View ── */
  return (
    <UserLayout>
      <div className="w-full space-y-5">

        {/* Page title */}
        <h1 className="text-lg font-black text-slate-800">My Progress Dashboard</h1>

        {/* ── Green Exam Header ── */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl px-5 py-4 text-white flex items-center justify-between shadow-lg">
          <div>
            <h2 className="text-base font-black">{selectedExam.name} 2024</h2>
            <p className="text-green-100 text-[11px] mt-0.5">Combined Graduate Level Examination • Most Attempted Exam</p>
          </div>
          <Button
            size="sm"
            className="bg-white text-green-700 hover:bg-green-50 rounded-xl text-xs font-bold px-4 gap-1.5 flex-shrink-0"
            onClick={() => setSelectedExam(null)}
          >
            <RefreshCw className="w-3 h-3" /> Change Exam
          </Button>
        </div>

        {/* ── Time Filter Tabs ── */}
        <div className="flex bg-white border border-slate-100 rounded-xl p-1 gap-1 w-fit shadow-sm">
          {TIME_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === tab
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── 4 Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: '📊', label: 'Overall Score', value: `${score}%`, delta: '+3.2%', up: true },
            { icon: '🎯', label: 'Accuracy', value: `${accuracy.toFixed(1)}%`, delta: '+2.9%', up: true },
            { icon: '⏱', label: 'Avg Time/Q', value: `${avgTimeMin} min`, delta: '-0.2 min', up: false },
            { icon: '🏆', label: 'Your Rank', value: `#${rank.toLocaleString()}`, delta: '+156', up: true },
          ].map(stat => (
            <div
              key={stat.label}
              className="bg-white border border-green-100 rounded-2xl p-3.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xl">{stat.icon}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${stat.up ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                  {stat.up ? '↑' : '↓'} {stat.delta}
                </span>
              </div>
              <div className="text-xl font-black text-slate-800">{stat.value}</div>
              <p className="text-[11px] text-slate-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Recent Tests Performance ── */}
        <div className="bg-white border border-green-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-green-600" /> Recent Tests Performance
            </h3>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-green-500 text-white rounded-full">
                📈 Improving Trend
              </span>
              <Button
                size="sm"
                className="bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs h-7 px-3"
                onClick={() => navigate('/tests')}
              >
                View All Tests
              </Button>
            </div>
          </div>
          <div className="p-5">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0fdf4" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #dcfce7', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    cursor={{ fill: '#f0fdf4' }}
                    formatter={(v: any) => [`${v}%`, 'Score']}
                  />
                  <ReferenceLine y={avgScore} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `Avg: ${avgScore}%`, fontSize: 10, fill: '#f59e0b', position: 'right' }} />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={32}>
                    {chartData.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.score >= 75 ? '#22c55e' : entry.score >= 60 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Subject Analysis ── */}
        <div className="bg-white border border-green-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-green-600" /> Subject Analysis — {selectedExam.name}
            </h3>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(progressData?.subjectWise || []).map((sub: any) => {
              const isGood = sub.accuracy >= 85;
              const isBad = sub.accuracy < 75;
              return (
                <div
                  key={sub.name}
                  className="border border-slate-100 rounded-xl p-4 flex flex-col gap-3 hover:border-green-200 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-800 leading-snug">{sub.name}</h4>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${isGood ? 'bg-green-100 text-green-700' :
                        isBad ? 'bg-red-100 text-red-600' :
                          'bg-orange-100 text-orange-600'
                      }`}>
                      {sub.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <span className="font-black text-slate-800 text-sm">{sub.accuracy}%</span>
                    <span className="text-slate-400">{sub.avgTime} min/Q</span>
                    <span className="text-slate-400">{sub.questions} Qs</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${isGood ? 'bg-green-500' : isBad ? 'bg-red-500' : 'bg-orange-400'
                        }`}
                      style={{ width: `${sub.accuracy}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <p className="text-slate-400 font-semibold mb-1">Weak Topics</p>
                      <div className="flex flex-wrap gap-1">
                        {(sub.weakTopics || []).map((t: string) => (
                          <span key={t} className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded-md font-medium">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-400 font-semibold mb-1">Strong Topics</p>
                      <div className="flex flex-wrap gap-1">
                        {(sub.strongTopics || []).map((t: string) => (
                          <span key={t} className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded-md font-medium">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs h-7 font-semibold gap-1.5"
                    onClick={() => navigate('/practice')}
                  >
                    <Play className="w-3 h-3" /> Practice Now
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Boost These Topics ── */}
        <div className="bg-white border border-green-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-bold text-slate-800">Boost These Topics</h3>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(progressData?.weakTopics || []).map((item: any) => (
              <div
                key={`${item.subject}-${item.topic}`}
                className="border border-slate-100 rounded-xl p-3.5 flex flex-col gap-3 hover:border-orange-200 hover:shadow-sm transition-all"
              >
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">{item.subject}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <h4 className="text-xs font-bold text-slate-800">{item.topic}</h4>
                    <span className={`text-xs font-black ${item.score < 30 ? 'text-red-500' : item.score < 50 ? 'text-orange-500' : 'text-yellow-500'}`}>
                      {item.score}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${item.score < 30 ? 'bg-red-500' : item.score < 50 ? 'bg-orange-400' : 'bg-yellow-400'}`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>

                <Button
                  size="sm"
                  className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs h-7 font-semibold gap-1"
                  onClick={() => navigate('/practice')}
                >
                  <Play className="w-3 h-3" /> Practice Now
                </Button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </UserLayout>
  );
};

export default MyProgress;
