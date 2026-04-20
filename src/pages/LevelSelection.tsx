import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserLayout } from '@/components/UserLayout';
import { Button } from '@/components/ui/button';
import {
   ChevronRight, Lock, CheckCircle2, Play, Clock, Target,
   FileText, AlertTriangle, BookOpen, Brain,
} from 'lucide-react';
import { levelsAPI } from '@/lib/api';
import { toast } from 'sonner';
import Loader from '@/components/Loader';

interface Level {
   _id: string;
   level_number: number;
   name: string;
   description: string;
   total_questions: number;
   progress: {
      status: 'locked' | 'unlocked' | 'in_progress' | 'completed' | 'skipped';
      practice_questions_attempted: number;
      practice_questions_correct: number;
      practice_accuracy: number;
      skip_test_passed: boolean;
   };
}

// Demo level history data
const DEMO_PREVIOUS = [
   { level: 3, score: 47, passed: true },
   { level: 2, score: 49, passed: true },
   { level: 1, score: 50, passed: true },
];
const DEMO_CURRENT_ATTEMPTS = [
   { attempt: 2, score: 41, passed: false, date: '15 Jan 2025 - 3:00 PM' },
   { attempt: 1, score: 38, passed: false, date: '14 Jan 2025 - 1:31 PM' },
];

const LevelSelection = () => {
   const location = useLocation();
   const navigate = useNavigate();
   const { topicId, topicName, subjectName, categoryName } = location.state || {};

   const [loading, setLoading] = useState(true);
   const [levels, setLevels] = useState<Level[]>([]);
   const [selectedLevel, setSelectedLevel] = useState<number>(4);

   useEffect(() => {
      if (!topicId) { toast.error('Topic not selected'); navigate('/basic-to-advance'); return; }
      fetchLevels();
   }, [topicId]);

   const fetchLevels = async () => {
      try {
         const data = await levelsAPI.getLevelsByTopic(topicId);
         setLevels(data || []);
      } catch { /* use demo */ }
      finally { setLoading(false); }
   };

   const currentLevel = selectedLevel;
   const totalLevels = 10;
   const doneCount = 3;
   const bestScore = 49;
   const totalQuestions = 10000;
   const masteredCount = 1240;
   const masteredTotal = 18000;
   const failedCount = DEMO_CURRENT_ATTEMPTS.length;
   const attemptsLeft = Math.max(0, 2 - failedCount);
   const hasFailed = failedCount >= 2;

   const levelMeta = (n: number) => {
      if (n < 4) return { status: 'done', score: [50, 49, 47][n - 1] };
      if (n === 4) return { status: 'current', score: null };
      return { status: 'locked', score: null };
   };

   const handleStart = () => {
      sessionStorage.setItem('customPracticeData', JSON.stringify({
         mode: 'exam',
         categoryIds: [],
         subjectIds: [],
         topicIds: [topicId],
         difficultyLevel: selectedLevel,
         timerType: 'question',
         questionTime: 45,
         numQuestions: 10,
         showAnswers: 'after',
      }));
      navigate('/practice/session');
   };

   const handleSelfStudy = () => navigate('/practice');

   if (loading) return (
      <UserLayout>
         <div className="flex justify-center items-center h-[calc(100vh-120px)]">
            <Loader text="Loading levels..." />
         </div>
      </UserLayout>
   );

   return (
      <UserLayout>
         <div className="w-full space-y-4">

            {/* Breadcrumb */}
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
               <button onClick={() => navigate('/basic-to-advance')} className="hover:text-green-600 font-semibold">
                  Basic to Advance
               </button>
               <ChevronRight className="w-3 h-3" />
               <button onClick={() => navigate(-1)} className="hover:text-green-600 font-semibold">
                  {subjectName || 'Quantitative Aptitude'}
               </button>
               <ChevronRight className="w-3 h-3" />
               <span className="text-green-700 font-bold">{topicName || 'Percentage'}</span>
            </div>

            {/* ── Green Header ── */}
            <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl px-5 py-4 text-white shadow-lg">
               <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5" />
                     </div>
                     <div>
                        <h2 className="text-sm font-black">{topicName || 'Percentage'}</h2>
                        <p className="text-green-100 text-xs mt-0.5">
                           {subjectName || 'Quantitative Aptitude'} • {categoryName || 'SSC CGL'}
                        </p>
                     </div>
                  </div>
                  <div className="flex gap-5 text-center">
                     {[
                        { val: `${currentLevel} / ${totalLevels}`, label: 'Current Level' },
                        { val: doneCount, label: 'Levels Done' },
                        { val: `${bestScore}/50`, label: 'Best Score' },
                        { val: totalQuestions.toLocaleString(), label: 'Total Questions' },
                     ].map(s => (
                        <div key={s.label} className="hidden sm:block">
                           <div className="text-base font-black">{s.val}</div>
                           <div className="text-green-100 text-xs leading-tight">{s.label}</div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* ── Questions Mastered ── */}
            <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-4">
               <div className="flex items-center gap-3 mb-2">
                  <Brain className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-xs font-bold text-slate-700">Questions Mastered — {topicName || 'Percentage'}</span>
                  <span className="ml-auto text-xs font-black text-green-600">{masteredCount.toLocaleString()} / {masteredTotal.toLocaleString()}</span>
               </div>
               <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                     className="h-2 rounded-full bg-green-500 transition-all duration-1000"
                     style={{ width: `${(masteredCount / masteredTotal) * 100}%` }}
                  />
               </div>
               <p className="text-[10px] text-slate-400 mt-1">
                  Go for a correct question's score! 0 {masteredTotal.toLocaleString()} remaining in pool
               </p>
            </div>

            {/* ── Level Stepper ── */}
            <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-4 overflow-x-auto">
               <div className="flex items-center gap-2 min-w-max">
                  {Array.from({ length: totalLevels }, (_, i) => i + 1).map((n, idx) => {
                     const meta = levelMeta(n);
                     const isDone = meta.status === 'done';
                     const isCur = meta.status === 'current';
                     const isLocked = meta.status === 'locked';
                     const isSelected = n === selectedLevel;

                     return (
                        <div key={n} className="flex items-center gap-2">
                           <div className="flex flex-col items-center gap-1">
                              <button
                                 onClick={() => !isLocked && setSelectedLevel(n)}
                                 disabled={isLocked}
                                 className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all border-2 ${isDone ? 'bg-green-500 border-green-500 text-white' :
                                       isCur ? 'bg-white border-green-500 text-green-700 ring-2 ring-green-200' :
                                          'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                    } ${isSelected && !isCur ? 'ring-2 ring-green-200' : ''}`}
                              >
                                 {isDone ? <CheckCircle2 className="w-4 h-4" /> : isLocked ? <Lock className="w-3.5 h-3.5" /> : n}
                              </button>
                              <div className="text-center">
                                 <div className="text-[9px] font-semibold text-slate-500">
                                    {isDone ? 'Done' : isCur ? 'Current' : 'Level ' + n}
                                 </div>
                                 {isDone && (
                                    <div className="text-[9px] text-green-600 font-bold">{meta.score}/50</div>
                                 )}
                                 {isCur && (
                                    <div className="text-[9px] text-green-600 font-bold">3 Q's</div>
                                 )}
                              </div>
                           </div>
                           {idx < totalLevels - 1 && (
                              <div className={`w-6 h-0.5 mb-3 ${n < currentLevel ? 'bg-green-300' : 'bg-slate-200'}`} />
                           )}
                        </div>
                     );
                  })}
               </div>
            </div>

            {/* ── Failed Banner ── */}
            {hasFailed && (
               <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div className="flex-1">
                     <p className="text-xs font-black text-amber-800">
                        2 baar fail ho gaye — ek baar Self Study karo
                     </p>
                     <p className="text-[11px] text-amber-600 mt-0.5">
                        Kisi practice ki questions solve karo, concepts clear karo, phir attempt do.
                     </p>
                  </div>
                  <Button
                     size="sm"
                     className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-7 px-3 text-[11px] font-bold flex-shrink-0"
                     onClick={handleSelfStudy}
                  >
                     Self Study Mode
                  </Button>
               </div>
            )}

            {/* ── Level Detail + Attempt History ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

               {/* Level detail card */}
               <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-5 space-y-4">
                  <div className="flex items-center justify-between">
                     <h3 className="text-sm font-black text-slate-800">
                        Level {selectedLevel} — {topicName || 'Percentage'}
                     </h3>
                     <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-200">
                        Medium
                     </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Intermediate difficulty • 10 Que from • Random each attempt</p>

                  <div className="grid grid-cols-2 gap-3">
                     {[
                        { icon: <Target className="w-4 h-4 text-green-600" />, label: 'Questions', val: '50' },
                        { icon: <Clock className="w-4 h-4 text-blue-500" />, label: 'Time Limit', val: '45 min' },
                        { icon: <CheckCircle2 className="w-4 h-4 text-green-600" />, label: 'Pass Criteria', val: '45 / 50' },
                        {
                           icon: (
                              <div className="flex gap-0.5">
                                 {[...Array(attemptsLeft)].map((_, i) => <span key={i} className="w-2 h-2 rounded-full bg-green-400" />)}
                                 {[...Array(2 - attemptsLeft)].map((_, i) => <span key={i} className="w-2 h-2 rounded-full bg-red-400" />)}
                              </div>
                           ),
                           label: 'Attempts Today', val: `${attemptsLeft} left`,
                        },
                     ].map(s => (
                        <div key={s.label} className="flex items-start gap-2 bg-slate-50 rounded-xl p-3">
                           <div className="mt-0.5 flex-shrink-0">{s.icon}</div>
                           <div>
                              <div className="text-sm font-black text-slate-800">{s.val}</div>
                              <div className="text-[10px] text-slate-400">{s.label}</div>
                           </div>
                        </div>
                     ))}
                  </div>

                  <Button
                     disabled={attemptsLeft === 0}
                     className="w-full h-10 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-sm gap-2 shadow-md shadow-green-500/30"
                     onClick={handleStart}
                  >
                     <Play className="w-4 h-4" /> 🚀 Start Level {selectedLevel}
                  </Button>

                  <button
                     onClick={handleSelfStudy}
                     className="w-full text-center text-[11px] font-semibold text-slate-400 hover:text-green-600 flex items-center justify-center gap-1"
                  >
                     <FileText className="w-3 h-3" /> Self Study Mode — Practice without pressure
                  </button>
               </div>

               {/* Attempt History */}
               <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-5 flex flex-col gap-4">
                  <h3 className="text-sm font-black text-slate-800">Attempt History — Level {selectedLevel}</h3>

                  {/* Current level attempts */}
                  <div className="space-y-2">
                     {DEMO_CURRENT_ATTEMPTS.map(a => (
                        <div
                           key={a.attempt}
                           className="flex items-center justify-between gap-3 bg-red-50 border border-red-100 rounded-xl p-3"
                        >
                           <div>
                              <p className="text-[11px] font-bold text-slate-700">Attempt {a.attempt} ✓</p>
                              <p className="text-[10px] text-slate-400">{a.date}</p>
                           </div>
                           <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-red-600">{a.score} / 50</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full border border-red-200">
                                 ❌ Failed
                              </span>
                              <button className="text-[10px] font-semibold text-slate-500 hover:text-green-600 hover:underline">
                                 Review
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>

                  {/* Previous levels */}
                  <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Previous Levels</p>
                     <div className="space-y-2">
                        {DEMO_PREVIOUS.map(p => (
                           <div
                              key={p.level}
                              className="flex items-center justify-between gap-3 bg-green-50 border border-green-100 rounded-xl p-3"
                           >
                              <span className="text-[11px] font-bold text-slate-700">Level {p.level}</span>
                              <div className="flex items-center gap-2">
                                 <span className="text-xs font-black text-green-700">{p.score} / 50</span>
                                 <span className="text-[9px] font-bold px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">
                                    ✅ Passed
                                 </span>
                                 <button className="text-[10px] font-semibold text-slate-500 hover:text-green-600 hover:underline">
                                    Review
                                 </button>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

         </div>
      </UserLayout>
   );
};

export default LevelSelection;
