import { useEffect, useState, useMemo } from 'react';
import { UserLayout } from '@/components/UserLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import {
  Search, CheckCircle2, XCircle, SkipForward, HelpCircle,
  Eye, FileText, Home, RefreshCw,
} from 'lucide-react';
import { attemptsAPI } from '@/lib/api';
import { toast } from 'sonner';
import Loader from '@/components/Loader';
import { format, isThisWeek, isThisMonth } from 'date-fns';
import { PaginationControls } from '@/components/PaginationControls';

interface Attempt {
  _id?: string; id?: string;
  test_id: any;
  score: number;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  skipped?: number;
  time_taken_seconds: number;
  completed_at: string;
  test_name?: string;
  category_name?: string;
  session_id?: string;
  subjects?: string;
  type?: 'custom' | 'exam';
}

// Fake custom practice history for demo
const DEMO_CUSTOM: Attempt[] = [
  {
    _id: 'cp1019', session_id: 'CP-1019', type: 'custom',
    test_id: null, test_name: 'SSC CGL',
    subjects: 'Quantitative Aptitude • General Intelligence • English Comprehension',
    score: 75, total_questions: 25, correct_answers: 18, wrong_answers: 4, skipped: 3,
    time_taken_seconds: 720, completed_at: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
    category_name: 'SSC CGL',
  },
  {
    _id: 'cp987', session_id: 'CP-987', type: 'custom',
    test_id: null, test_name: 'SSC CGL',
    subjects: 'Quantitative Aptitude • General Awareness • Reasoning',
    score: 70, total_questions: 20, correct_answers: 14, wrong_answers: 4, skipped: 2,
    time_taken_seconds: 600, completed_at: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
    category_name: 'SSC CGL',
  },
  {
    _id: 'cp994', session_id: 'CP-994', type: 'custom',
    test_id: null, test_name: 'SSC CGL',
    subjects: 'English Comprehension • Grammar',
    score: 53, total_questions: 15, correct_answers: 8, wrong_answers: 5, skipped: 2,
    time_taken_seconds: 540, completed_at: new Date(Date.now() - 35 * 24 * 3600000).toISOString(),
    category_name: 'SSC CGL',
  },
];
const DEMO_EXAM: Attempt[] = [
  {
    _id: 'ex443', session_id: 'EX-443', type: 'exam',
    test_id: { name: 'SSC CGL — Full Mock Test' }, test_name: 'SSC CGL — Full Mock Test',
    subjects: 'Quantitative Aptitude • General Intelligence • English Comprehension',
    score: 72, total_questions: 50, correct_answers: 31, wrong_answers: 5, skipped: 12,
    time_taken_seconds: 1500, completed_at: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
    category_name: 'SSC CGL',
  },
  {
    _id: 'ex437', session_id: 'EX-437', type: 'exam',
    test_id: { name: 'CHSL — Tier 1 Mock' }, test_name: 'CHSL — Tier 1 Mock',
    subjects: 'Quantitative Aptitude • General Awareness • Reasoning',
    score: 58, total_questions: 50, correct_answers: 22, wrong_answers: 10, skipped: 8,
    time_taken_seconds: 1200, completed_at: new Date(Date.now() - 40 * 24 * 3600000).toISOString(),
    category_name: 'CHSL',
  },
  {
    _id: 'ex419', session_id: 'EX-419', type: 'exam',
    test_id: { name: 'RRB NTPC Stage 1 Mock' }, test_name: 'RRB NTPC Stage 1 Mock',
    subjects: 'Mathematics • General Intelligence • General Awareness',
    score: 65, total_questions: 50, correct_answers: 26, wrong_answers: 8, skipped: 6,
    time_taken_seconds: 2160, completed_at: new Date(Date.now() - 60 * 24 * 3600000).toISOString(),
    category_name: 'RRB NTPC',
  },
];

const History = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [apiAttempts, setApiAttempts] = useState<Attempt[]>([]);
  const [activeTab, setActiveTab] = useState<'custom' | 'exam'>('custom');
  const [timeFilter, setTimeFilter] = useState<'All' | 'This Week' | 'This Month'>('All');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAttempts();
  }, [currentPage]);

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      const data = await attemptsAPI.getAll(currentPage, itemsPerPage);
      const attempts = data.attempts || data || [];
      const fmt = attempts.map((a: any) => ({
        ...a,
        test_name: a.test_id?.name || 'Custom Practice Session',
        category_name: a.test_id?.category_id?.name || 'General Practice',
        type: a.test_id?.name ? 'exam' : 'custom',
        session_id: a._id?.slice(-6)?.toUpperCase(),
        subjects: '',
      }));
      setApiAttempts(fmt);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
      }
    } catch { /* use demo */ }
    finally { setLoading(false); }
  };

  const allCustom = [...DEMO_CUSTOM, ...apiAttempts.filter(a => a.type === 'custom')];
  const allExam = [...DEMO_EXAM, ...apiAttempts.filter(a => a.type === 'exam')];
  const baseList = activeTab === 'custom' ? allCustom : allExam;

  const filtered = useMemo(() => {
    return baseList.filter(a => {
      const dt = new Date(a.completed_at);
      if (timeFilter === 'This Week' && !isThisWeek(dt)) return false;
      if (timeFilter === 'This Month' && !isThisMonth(dt)) return false;
      const q = search.toLowerCase();
      if (q && !(a.test_name || '').toLowerCase().includes(q) &&
        !(a.category_name || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [baseList, timeFilter, search]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const isRecent = (dt: string) => Date.now() - new Date(dt).getTime() < 3 * 24 * 3600000;
  const scoreColor = (s: number) => s >= 70 ? 'text-green-600' : s >= 50 ? 'text-orange-500' : 'text-red-500';

  if (loading) return (
    <UserLayout>
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader text="Loading your test history..." />
      </div>
    </UserLayout>
  );

  return (
    <UserLayout>
      <div className="w-full space-y-4">

        {/* ── Green Navbar-style header ── */}
        <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-2xl px-5 py-3 flex items-center justify-between text-white shadow-lg">
          <div className="flex items-center gap-3">
            <span className="font-black text-sm hidden sm:block">EXAMPULSE</span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-green-100">
              <FileText className="w-3.5 h-3.5" /> Test History
            </div>
          </div>
          <Button
            size="sm"
            className="bg-white text-green-700 hover:bg-green-50 rounded-xl h-7 px-3 text-xs font-bold gap-1.5"
            onClick={() => navigate('/dashboard')}
          >
            <Home className="w-3 h-3" /> Dashboard
          </Button>
        </div>

        {/* ── Tab + Search + Time Filter ── */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 space-y-3">
          {/* Tabs */}
          <div className="flex gap-1 border-b border-slate-100 pb-3">
            {(['custom', 'exam'] as const).map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === t ? 'bg-green-500 text-white' : 'text-slate-600 hover:text-green-700'
                  }`}
              >
                {t === 'custom' ? <RefreshCw className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                {t === 'custom' ? 'Custom Practice' : 'Exam-wise'}
              </button>
            ))}
          </div>

          {/* Search + time filter */}
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                placeholder="Search by exam, subject or test ID"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 text-xs rounded-xl border-slate-200 h-9"
              />
            </div>
            <div className="flex gap-1">
              {(['All', 'This Week', 'This Month'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setTimeFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${timeFilter === f ? 'bg-green-500 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Attempt Cards ── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-400 text-sm bg-white rounded-2xl border border-slate-100">
              No {activeTab === 'custom' ? 'custom practice' : 'exam'} sessions found.
            </div>
          )}
          
          {/* Only show API results when not searching/filtering demo data */}
          {(search || timeFilter !== 'All') ? filtered.map((a, idx) => {
            const pct = Math.round(a.score);
            const skipped = a.skipped ?? (a.total_questions - a.correct_answers - a.wrong_answers);
            const qs = a.total_questions - a.correct_answers - a.wrong_answers - (a.skipped || 0);

            return (
              <div
                key={a._id || idx}
                className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden hover:border-green-200 hover:shadow-md transition-all"
              >
                <div className="p-4 flex flex-col sm:flex-row gap-4">
                  {/* Left: details */}
                  <div className="flex-1 min-w-0">
                    {/* ID + date + recent badge */}
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-md">
                        {a.session_id || (activeTab === 'custom' ? 'CP' : 'EX') + '-' + String(idx + 100)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {format(new Date(a.completed_at), 'dd MMM yyyy')} · {formatTime(a.time_taken_seconds)}
                      </span>
                      {isRecent(a.completed_at) && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-200">
                          Recent
                        </span>
                      )}
                    </div>

                    {/* Test name */}
                    <h3 className="text-sm font-black text-slate-800 mb-0.5">
                      {a.test_name || a.category_name || 'Practice Session'}
                    </h3>

                    {/* Subjects */}
                    {a.subjects && (
                      <p className="text-[11px] text-slate-400 mb-2 line-clamp-1">{a.subjects}</p>
                    )}

                    {/* Stats row */}
                    <div className="flex flex-wrap gap-3 text-[11px] font-semibold">
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="w-3 h-3" /> {a.correct_answers} Correct
                      </span>
                      <span className="flex items-center gap-1 text-red-500">
                        <XCircle className="w-3 h-3" /> {a.wrong_answers} Wrong
                      </span>
                      <span className="flex items-center gap-1 text-orange-500">
                        <SkipForward className="w-3 h-3" /> {skipped} Skipped
                      </span>
                      <span className="flex items-center gap-1 text-blue-500">
                        <HelpCircle className="w-3 h-3" /> {Math.max(0, qs)} Questions
                      </span>
                    </div>
                  </div>

                  {/* Right: score + actions */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 flex-shrink-0">
                    <span className={`text-2xl font-black ${scoreColor(pct)}`}>{pct}%</span>
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => navigate('/practice/result')}
                        className="flex items-center gap-1 text-[11px] font-semibold text-green-600 hover:underline"
                      >
                        <Eye className="w-3 h-3" /> View Result
                      </button>
                      <button
                        onClick={() => navigate('/practice/result')}
                        className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:underline"
                      >
                        <FileText className="w-3 h-3" /> Review Answers
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          }) : apiAttempts.map((a, idx) => {
            const pct = Math.round(a.score);
            const skipped = a.skipped ?? (a.total_questions - a.correct_answers - a.wrong_answers);
            const qs = a.total_questions - a.correct_answers - a.wrong_answers - (a.skipped || 0);

            return (
              <div
                key={a._id || idx}
                className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden hover:border-green-200 hover:shadow-md transition-all"
              >
                <div className="p-4 flex flex-col sm:flex-row gap-4">
                  {/* Left: details */}
                  <div className="flex-1 min-w-0">
                    {/* ID + date + recent badge */}
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-md">
                        {a.session_id || (activeTab === 'custom' ? 'CP' : 'EX') + '-' + String(idx + 100)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {format(new Date(a.completed_at), 'dd MMM yyyy')} · {formatTime(a.time_taken_seconds)}
                      </span>
                      {isRecent(a.completed_at) && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-200">
                          Recent
                        </span>
                      )}
                    </div>

                    {/* Test name */}
                    <h3 className="text-sm font-black text-slate-800 mb-0.5">
                      {a.test_name || a.category_name || 'Practice Session'}
                    </h3>

                    {/* Subjects */}
                    {a.subjects && (
                      <p className="text-[11px] text-slate-400 mb-2 line-clamp-1">{a.subjects}</p>
                    )}

                    {/* Stats row */}
                    <div className="flex flex-wrap gap-3 text-[11px] font-semibold">
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="w-3 h-3" /> {a.correct_answers} Correct
                      </span>
                      <span className="flex items-center gap-1 text-red-500">
                        <XCircle className="w-3 h-3" /> {a.wrong_answers} Wrong
                      </span>
                      <span className="flex items-center gap-1 text-orange-500">
                        <SkipForward className="w-3 h-3" /> {skipped} Skipped
                      </span>
                      <span className="flex items-center gap-1 text-blue-500">
                        <HelpCircle className="w-3 h-3" /> {Math.max(0, qs)} Questions
                      </span>
                    </div>
                  </div>

                  {/* Right: score + actions */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 flex-shrink-0">
                    <span className={`text-2xl font-black ${scoreColor(pct)}`}>{pct}%</span>
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => navigate('/practice/result')}
                        className="flex items-center gap-1 text-[11px] font-semibold text-green-600 hover:underline"
                      >
                        <Eye className="w-3 h-3" /> View Result
                      </button>
                      <button
                        onClick={() => navigate('/practice/result')}
                        className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:underline"
                      >
                        <FileText className="w-3 h-3" /> Review Answers
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Pagination - only show when not using demo data filters */}
          {!loading && !search && timeFilter === 'All' && (
            <div className="pt-4">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
};

export default History;
