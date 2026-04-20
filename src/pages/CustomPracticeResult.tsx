import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
   CheckCircle2, XCircle, Download, RotateCcw, Home,
   Bookmark, BookmarkCheck, ChevronDown, ChevronUp, ArrowLeft,
} from 'lucide-react';
import { bookmarksAPI } from '@/lib/api';
import { toast } from 'sonner';
import Loader from '@/components/Loader';
import {
   ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';

interface Question {
   _id?: string; id?: string;
   question_text: string;
   option_a: string; option_b: string; option_c: string; option_d: string;
   correct_answer: number; explanation?: string;
   category_id?: any; subject_id?: any; topic_id?: any;
}
interface PracticeResults {
   questions: Question[];
   answers: Record<string, number>;
   correct: number; wrong: number; unanswered: number; total: number;
   practiceData: any; startTime: string; endTime: string;
}

const OPTS = ['A', 'B', 'C', 'D'];

/* Circular SVG progress */
const DonutScore = ({ pct }: { pct: number }) => {
   const r = 52; const c = 2 * Math.PI * r;
   const stroke = c - (pct / 100) * c;
   const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444';
   const label = pct >= 70 ? 'Good To Have Not' : pct >= 40 ? 'Needs Improvement' : 'Keep Practicing';
   return (
      <div className="flex flex-col items-center">
         <div className="relative w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
               <circle cx="60" cy="60" r={r} fill="none" stroke="#f0fdf4" strokeWidth="10" />
               <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
                  strokeDasharray={c} strokeDashoffset={stroke} strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
               <span className="text-2xl font-black" style={{ color }}>{pct}%</span>
               <span className="text-[11px] text-slate-400 font-semibold">Score</span>
            </div>
         </div>
         <p className="text-[11px] font-bold mt-1" style={{ color }}>{label} ↑</p>
         <p className="text-[10px] text-slate-400">1 of 233 highest marks</p>
      </div>
   );
};

const CustomPracticeResult = () => {
   const navigate = useNavigate();
   const [loading, setLoading] = useState(true);
   const [results, setResults] = useState<PracticeResults | null>(null);
   const [bookmarkedQs, setBookmarkedQs] = useState<Set<string>>(new Set());
   const [view, setView] = useState<'summary' | 'review'>('summary');
   const [reviewFilter, setReviewFilter] = useState('All');
   const [subjectFilter, setSubjectFilter] = useState('All Subjects');
   const [expandedQs, setExpandedQs] = useState<Set<string>>(new Set());

   useEffect(() => {
      const data = sessionStorage.getItem('customPracticeResults');
      if (!data) { toast.error('Results not found'); navigate('/practice'); return; }
      const parsed = JSON.parse(data) as PracticeResults;
      setResults(parsed);
      loadBookmarks(parsed.questions);
   }, [navigate]);

   const loadBookmarks = async (qs: Question[]) => {
      try {
         const ids = qs.map(q => (q._id || q.id)!).filter(Boolean);
         const checks = await Promise.all(ids.map(async id => {
            try { const r = await bookmarksAPI.check(id); return { id, bm: r.isBookmarked }; }
            catch { return { id, bm: false }; }
         }));
         setBookmarkedQs(new Set(checks.filter(c => c.bm).map(c => c.id)));
      } catch { } finally { setLoading(false); }
   };

   const toggleBookmark = async (id: string) => {
      try {
         const r = await bookmarksAPI.toggle(id);
         setBookmarkedQs(prev => { const s = new Set(prev); r.isBookmarked ? s.add(id) : s.delete(id); return s; });
         toast.success(r.isBookmarked ? 'Bookmarked!' : 'Bookmark removed');
      } catch { toast.error('Failed'); }
   };

   const toggleExpand = (id: string) =>
      setExpandedQs(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

   const subjectData = useMemo(() => {
      if (!results) return [];
      const map: Record<string, { total: number; correct: number }> = {};
      results.questions.forEach(q => {
         const qid = (q._id || q.id)!;
         const sn = typeof q.subject_id === 'object' && q.subject_id?.name ? q.subject_id.name : (q.subject_id || 'General');
         if (!map[sn]) map[sn] = { total: 0, correct: 0 };
         map[sn].total++;
         if (results.answers[qid] === q.correct_answer) map[sn].correct++;
      });
      return Object.entries(map).map(([name, d]) => ({ name, accuracy: Math.round((d.correct / d.total) * 100), correct: d.correct, total: d.total }));
   }, [results]);

   const subjects = useMemo(() => ['All Subjects', ...subjectData.map(s => s.name)], [subjectData]);

   if (loading || !results) return (
      <div className="w-full min-h-screen bg-slate-50 flex items-center justify-center">
         <Loader text="Generating Results..." />
      </div>
   );

   const { correct, wrong, unanswered, total } = results;
   const attempted = total - unanswered;
   const accuracy = attempted > 0 ? ((correct / attempted) * 100).toFixed(1) : '0';
   const scoreVal = Math.round((correct / total) * 100);
   const marks = ((correct / total) * 25).toFixed(2);

   // Time taken
   const elapsed = Math.floor((new Date(results.endTime).getTime() - new Date(results.startTime).getTime()) / 1000);
   const timeTaken = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;

   // Filtered questions for review
   const filteredQs = results.questions.filter(q => {
      const qid = (q._id || q.id)!;
      const ua = results.answers[qid];
      const isA = ua !== undefined;
      const isC = ua === q.correct_answer;
      const subName = typeof q.subject_id === 'object' && q.subject_id?.name ? q.subject_id.name : (q.subject_id || 'General');
      if (subjectFilter !== 'All Subjects' && subName !== subjectFilter) return false;
      if (reviewFilter === 'All') return true;
      if (reviewFilter === 'Correct') return isC;
      if (reviewFilter === 'Wrong') return isA && !isC;
      if (reviewFilter === 'Skipped') return !isA;
      return true;
   });

   const filterCounts = {
      All: results.questions.length,
      Correct: correct, Wrong: wrong, Skipped: unanswered,
      Invalid: 0, 'Multiple Answers': 0,
   };

   return (
      <div className="w-full min-h-screen bg-slate-50 flex flex-col text-slate-900">

         {/* ── Green Navbar ── */}
         <header className="sticky top-0 z-50 bg-gradient-to-r from-green-700 to-green-600 text-white px-4 h-12 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
               <span className="font-black text-sm hidden sm:block">EXAMPULSE</span>
               <span className="bg-white/20 border border-white/30 rounded-md px-2 py-0.5 text-[10px] font-bold">CP-2025</span>
               <span className="text-[11px] text-green-100 hidden md:block">SSC CGL › Quantitative Aptitude</span>
            </div>
            <div className="flex items-center gap-2">
               {view === 'summary' ? (
                  <>
                     <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 h-7 text-xs gap-1.5">
                        <Download className="w-3.5 h-3.5" /> Download
                     </Button>
                     <Button
                        size="sm"
                        className="bg-white text-green-700 hover:bg-green-50 rounded-lg h-7 px-3 text-xs font-bold gap-1.5"
                        onClick={() => navigate('/practice')}
                     >
                        <RotateCcw className="w-3 h-3" /> New Practice
                     </Button>
                  </>
               ) : (
                  <>
                     <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 h-7 text-xs gap-1.5" onClick={() => navigate('/dashboard')}>
                        <Home className="w-3 h-3" /> Dashboard
                     </Button>
                     <Button
                        size="sm"
                        className="bg-white text-green-700 hover:bg-green-50 rounded-lg h-7 px-3 text-xs font-bold gap-1.5"
                        onClick={() => setView('summary')}
                     >
                        <ArrowLeft className="w-3 h-3" /> Back to Result
                     </Button>
                  </>
               )}
            </div>
         </header>

         {/* ── Summary View ── */}
         {view === 'summary' && (
            <div className="w-full p-4 space-y-4 animate-in fade-in duration-300">

               {/* Score card */}
               <div className="bg-green-50 border border-green-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                     {/* Donut */}
                     <DonutScore pct={scoreVal} />

                     {/* Stats grid */}
                     <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                           { label: 'Marks Obtained', val: `${marks} / ${total}`, bg: '' },
                           { label: 'Time Taken', val: timeTaken, bg: '' },
                           { label: 'Correct Q\'s', val: correct, bg: 'text-green-600' },
                           { label: 'Wrong Q\'s', val: wrong, bg: 'text-red-500' },
                           { label: 'Analysis: A+', val: 3, bg: '' },
                           { label: 'Accuracy', val: `${accuracy}%`, bg: 'text-green-600' },
                           { label: 'Skipped', val: unanswered, bg: 'text-slate-500' },
                           { label: 'Unattempted', val: 0, bg: 'text-blue-500' },
                        ].map(s => (
                           <div key={s.label} className="bg-white border border-slate-100 rounded-xl p-3 text-center">
                              <div className={`text-base font-black ${s.bg || 'text-slate-800'}`}>{s.val}</div>
                              <div className="text-xs text-slate-400 mt-0.5 leading-tight">{s.label}</div>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5 border-t border-green-100 pt-4">
                     {[
                        { label: '📊 Subject wise Analysis', action: () => { } },
                        { label: '📝 Review Answers', action: () => setView('review') },
                        { label: '🏠 Dashboard', action: () => navigate('/dashboard') },
                        { label: '🎯 New Custom Practice', action: () => navigate('/practice') },
                     ].map(btn => (
                        <button
                           key={btn.label}
                           onClick={btn.action}
                           className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-green-200 text-green-700 text-[11px] font-bold hover:bg-green-500 hover:text-white hover:border-green-500 transition-all"
                        >
                           {btn.label}
                        </button>
                     ))}
                  </div>
               </div>

               {/* Subject-wise Analysis */}
               <div className="bg-white border border-green-100 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-100">
                     <h3 className="text-sm font-bold text-slate-800">Subject-wise Analysis</h3>
                  </div>
                  <div className="p-4 space-y-3">
                     {subjectData.map((sub, i) => (
                        <div key={sub.name} className="flex items-center gap-3">
                           <div className="w-32 text-xs font-semibold text-slate-600 truncate">{sub.name}</div>
                           <div className="flex-1 flex items-center gap-2">
                              {/* Correct bar */}
                              <div className="flex-1 bg-slate-100 rounded-full h-2 relative">
                                 <div className="h-2 rounded-full bg-green-500 transition-all" style={{ width: `${sub.accuracy}%` }} />
                              </div>
                              {/* Wrong bar overlay - just show wrong portion */}
                              <span className="text-[11px] font-bold text-green-600 w-8 text-right">{sub.accuracy}%</span>
                           </div>
                        </div>
                     ))}
                     {subjectData.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-4">No subject data available</p>
                     )}
                  </div>
               </div>

            </div>
         )}

         {/* ── Review View ── */}
         {view === 'review' && (
            <div className="w-full p-4 space-y-3 animate-in fade-in duration-300">

               {/* Filter tabs row */}
               <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-3 flex flex-wrap gap-2 items-center">
                  {Object.entries(filterCounts).map(([f, cnt]) => (
                     <button
                        key={f}
                        onClick={() => setReviewFilter(f)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${reviewFilter === f ? 'bg-green-500 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                           }`}
                     >
                        {f} {cnt > 0 && <span className="ml-1 opacity-75">({cnt})</span>}
                     </button>
                  ))}
               </div>

               {/* Subject filter tabs */}
               <div className="flex gap-1.5 flex-wrap">
                  {subjects.map(s => (
                     <button
                        key={s}
                        onClick={() => setSubjectFilter(s)}
                        className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${subjectFilter === s ? 'bg-green-500 text-white border-green-500' : 'bg-white text-slate-600 border-slate-200 hover:border-green-200'
                           }`}
                     >
                        {s}
                     </button>
                  ))}
               </div>

               {/* Question cards */}
               <div className="space-y-3">
                  {filteredQs.map((q, idx) => {
                     const qid = (q._id || q.id)!;
                     const ua = results.answers[qid];
                     const isC = ua === q.correct_answer;
                     const isA = ua !== undefined;
                     const isBk = bookmarkedQs.has(qid);
                     const subName = typeof q.subject_id === 'object' && q.subject_id?.name ? q.subject_id.name : (q.subject_id || 'General');
                     const isExp = expandedQs.has(qid);

                     return (
                        <div key={qid} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                           {/* Q header */}
                           <div
                              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                              onClick={() => toggleExpand(qid)}
                           >
                              <div className="flex items-center gap-3 min-w-0">
                                 <span className="text-xs font-black text-slate-500 flex-shrink-0">Q{results.questions.indexOf(q) + 1}</span>
                                 <span className="text-[11px] text-slate-400 flex-shrink-0">{subName}</span>
                                 {isC ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold flex-shrink-0">
                                       <CheckCircle2 className="w-3 h-3" /> Correct
                                    </span>
                                 ) : isA ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold flex-shrink-0">
                                       <XCircle className="w-3 h-3" /> Wrong
                                    </span>
                                 ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex-shrink-0">
                                       — Skipped
                                    </span>
                                 )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                 <button
                                    onClick={e => { e.stopPropagation(); toggleBookmark(qid); }}
                                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100"
                                 >
                                    {isBk ? <BookmarkCheck className="w-4 h-4 text-orange-500" /> : <Bookmark className="w-4 h-4 text-slate-400" />}
                                 </button>
                                 {isExp ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                              </div>
                           </div>

                           {/* Expanded content */}
                           {isExp && (
                              <div className="border-t border-slate-50 px-4 pb-4 animate-in fade-in duration-200">
                                 <p className="text-sm font-medium text-slate-800 py-3 leading-relaxed">{q.question_text}</p>

                                 <div className="space-y-2">
                                    {[q.option_a, q.option_b, q.option_c, q.option_d].map((opt, oIdx) => {
                                       const isUserOpt = ua === oIdx;
                                       const isCorrectOpt = q.correct_answer === oIdx;
                                       let cls = 'border-slate-200 bg-white text-slate-700';
                                       if (isCorrectOpt) cls = 'border-green-400 bg-green-50 text-green-800';
                                       else if (isUserOpt) cls = 'border-red-300 bg-red-50 text-red-800';

                                       return (
                                          <div key={oIdx} className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${cls} text-xs`}>
                                             <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 font-bold text-[10px] ${isCorrectOpt ? 'border-green-500 bg-green-500 text-white' :
                                                   isUserOpt ? 'border-red-400 bg-red-400 text-white' :
                                                      'border-slate-300 text-slate-500'
                                                }`}>{OPTS[oIdx]}</span>
                                             <span className="flex-1">{opt}</span>
                                             {isCorrectOpt && <span className="text-[10px] font-bold text-green-600">✓ Your Answer</span>}
                                             {isUserOpt && !isCorrectOpt && <span className="text-[10px] font-bold text-red-500">✗ Your Answer</span>}
                                          </div>
                                       );
                                    })}
                                 </div>

                                 {q.explanation && (
                                    <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
                                       <p className="text-[11px] font-bold text-blue-800 mb-1">Solution</p>
                                       <p className="text-[11px] text-blue-700 leading-relaxed">{q.explanation}</p>
                                    </div>
                                 )}

                                 <button className="mt-3 text-[11px] font-semibold text-green-600 hover:text-green-700 hover:underline">
                                    View Solution →
                                 </button>
                              </div>
                           )}
                        </div>
                     );
                  })}

                  {filteredQs.length === 0 && (
                     <div className="text-center py-12 text-slate-400 text-sm">No questions match the selected filter.</div>
                  )}
               </div>
            </div>
         )}
      </div>
   );
};

export default CustomPracticeResult;
