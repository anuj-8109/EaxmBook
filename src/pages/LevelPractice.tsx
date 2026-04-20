import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserLayout } from '@/components/UserLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { levelsAPI, bookmarksAPI } from '@/lib/api';
import { toast } from 'sonner';
import Loader from '@/components/Loader';
import { Bookmark, BookmarkCheck } from 'lucide-react';

interface Question {
   _id: string;
   question_text: string;
   option_a: string;
   option_b: string;
   option_c: string;
   option_d: string;
   correct_answer: number;
   explanation?: string;
}

const LevelPractice = () => {
   const location = useLocation();
   const navigate = useNavigate();
   const { levelId, levelNumber, levelName, topicName, progress } = location.state || {};

   const [loading, setLoading] = useState(true);
   const [questions, setQuestions] = useState<Question[]>([]);
   const [totalQuestions, setTotalQuestions] = useState(0);
   const [currentPage, setCurrentPage] = useState(1);
   const [answers, setAnswers] = useState<Record<string, number>>({});
   const [results, setResults] = useState<Record<string, boolean>>({});
   const [showResults, setShowResults] = useState(false);
   const [correctCount, setCorrectCount] = useState(0);
   const [wrongCount, setWrongCount] = useState(0);
   const [questionPage, setQuestionPage] = useState(1);
   const [paletteCollapsed, setPaletteCollapsed] = useState(false);
   const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
   const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
   const limit = 50; // Questions per page

   useEffect(() => {
      if (!levelId) {
         toast.error('Level not selected');
         navigate('/basic-to-advance');
         return;
      }
      fetchQuestions();
   }, [levelId, currentPage]);

   const fetchQuestions = async () => {
      try {
         setLoading(true);
         console.log('Fetching questions for level:', levelId, 'page:', currentPage, 'limit:', limit);
         const data = await levelsAPI.getPracticeQuestions(levelId, currentPage, limit);
         console.log('Questions received:', data);
         console.log('Questions array:', data?.questions);
         console.log('Total questions:', data?.total);

         if (data) {
            setQuestions(Array.isArray(data.questions) ? data.questions : []);
            setTotalQuestions(data.total || 0);

            if (!data.questions || data.questions.length === 0) {
               if (data.total === 0) {
                  toast.warning('No questions available for this level. Please add questions in admin panel.');
               } else {
                  toast.info(`No questions on page ${currentPage}. Total questions: ${data.total}`);
               }
            }
         } else {
            setQuestions([]);
            setTotalQuestions(0);
            toast.warning('No data received from server.');
         }
      } catch (error: any) {
         console.error('Failed to load questions:', error);
         console.error('Error details:', {
            message: error?.message,
            stack: error?.stack,
            response: error?.response
         });
         toast.error(error?.message || 'Failed to load questions. Please check console for details.');
         setQuestions([]);
         setTotalQuestions(0);
      } finally {
         setLoading(false);
      }
   };

   const handleAnswerSelect = (questionId: string, answer: number) => {
      setAnswers({ ...answers, [questionId]: answer });
   };

   const handleToggleBookmark = async () => {
      const q = questions[currentQuestionIdx];
      if (!q) return;
      const id = q._id;
      try {
         await bookmarksAPI.toggle(id);
         setBookmarked(prev => ({ ...prev, [id]: !prev[id] }));
         toast.success(bookmarked[id] ? 'Bookmark removed' : 'Question bookmarked');
      } catch (error) {
         toast.error('Failed to update bookmark');
      }
   };

   const handleSubmit = async () => {
      let correct = 0;
      let wrong = 0;
      const newResults: Record<string, boolean> = {};

      questions.forEach((q) => {
         const userAnswer = answers[q._id];
         const isCorrect = userAnswer === q.correct_answer;
         newResults[q._id] = isCorrect;
         if (isCorrect) {
            correct++;
         } else if (userAnswer !== undefined) {
            wrong++;
         }
      });

      setResults(newResults);
      setShowResults(true);
      setCorrectCount(correct);
      setWrongCount(wrong);

      // Update progress
      try {
         await levelsAPI.updatePracticeProgress(levelId, {
            correct,
            wrong,
            total: questions.length
         });
      } catch (error) {
         console.error('Failed to update progress', error);
      }
   };

   const handleNextPage = () => {
      if (currentPage * limit < totalQuestions) {
         setCurrentPage(currentPage + 1);
         setShowResults(false);
         setAnswers({});
         setResults({});
      }
   };

   const handlePreviousPage = () => {
      if (currentPage > 1) {
         setCurrentPage(currentPage - 1);
         setShowResults(false);
         setAnswers({});
         setResults({});
         setCurrentQuestionIdx(0);
      }
   };

   if (loading) {
      return (
         <UserLayout>
            <div className="w-full h-[60vh] flex items-center justify-center">
               <Loader text="Loading practice questions..." />
            </div>
         </UserLayout>
      );
   }

   const progressPercent = totalQuestions > 0 ? ((currentPage * limit) / totalQuestions) * 100 : 0;
   const answeredCount = Object.keys(answers).length;
   const currentQ = questions[currentQuestionIdx];

   if (!currentQ && !loading && questions.length > 0) {
      // Fallback if index gets out of bounds during page change
      setCurrentQuestionIdx(0);
   }


   return (
      <UserLayout>
         <div className="w-full flex flex-col min-h-[calc(100vh-80px)]">

            <main className="flex-1 flex flex-row gap-0 w-full mx-auto p-4 gap-4 relative overflow-hidden">

               {/* Left: Question Area */}
               <div className="flex-1 flex flex-col gap-3">
                  {/* Header Card */}
                  <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 border-0 text-white shadow-md">
                     <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                           <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate('/basic-to-advance/level-content', { state: location.state })}
                              className="text-white hover:bg-white/20 rounded-xl"
                           >
                              <ArrowLeft className="w-5 h-5" />
                           </Button>
                           <div>
                              <h2 className="font-black text-sm tracking-tight">Level {levelNumber} Practice</h2>
                              <p className="text-[10px] opacity-80 font-bold uppercase tracking-wider">{topicName}</p>
                           </div>
                        </div>

                        <div className="flex items-center gap-3">
                           <div className="text-right hidden sm:block">
                              <p className="text-[10px] font-black opacity-70 uppercase">Overall Progress</p>
                              <p className="text-xs font-bold">{Math.round(progressPercent)}% Complete</p>
                           </div>
                           <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden hidden sm:block">
                              <div className="h-full bg-white transition-all" style={{ width: `${progressPercent}%` }} />
                           </div>
                        </div>
                     </CardContent>
                  </Card>

                  {/* Results Summary */}
                  {showResults && (
                     <Card className="bg-green-50 border-green-200 border-2 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                        <CardContent className="p-4">
                           <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-green-500/30">
                                    {Math.round((correctCount / questions.length) * 100)}%
                                 </div>
                                 <div>
                                    <p className="text-sm font-black text-green-800">Practice Completed!</p>
                                    <p className="text-[11px] text-green-700 font-bold">
                                       Correct: {correctCount} • Wrong: {wrongCount} • Skipped: {questions.length - correctCount - wrongCount}
                                    </p>
                                 </div>
                              </div>
                              <Button
                                 onClick={handleNextPage}
                                 disabled={currentPage * limit >= totalQuestions}
                                 className="bg-green-600 hover:bg-green-700 text-white font-black rounded-xl"
                              >
                                 Next Page <ChevronRight className="w-4 h-4 ml-1" />
                              </Button>
                           </div>
                        </CardContent>
                     </Card>
                  )}

                  {/* Question Card */}
                  {questions.length > 0 ? (
                     <Card className="flex-1 flex flex-col overflow-hidden border-slate-100 shadow-sm relative">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-3 px-5">
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Question {((currentPage - 1) * limit) + currentQuestionIdx + 1}</span>
                              <span className="text-sm font-bold text-slate-700">Page {currentPage} of {Math.ceil(totalQuestions / limit)}</span>
                           </div>
                           <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleToggleBookmark}
                              className={`h-9 w-9 rounded-xl transition-all ${bookmarked[currentQ._id]
                                    ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                                    : 'bg-white border border-slate-200 text-slate-400 hover:text-orange-500'
                                 }`}
                           >
                              {bookmarked[currentQ._id] ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                           </Button>
                        </CardHeader>

                        <CardContent className="p-0 flex flex-col flex-1">
                           <div className="p-6 flex-1 overflow-y-auto">
                              <h3 className="text-base sm:text-lg font-bold text-slate-800 leading-relaxed mb-8">
                                 {currentQ.question_text}
                              </h3>

                              <div className="grid grid-cols-1 gap-4">
                                 {[currentQ.option_a, currentQ.option_b, currentQ.option_c, currentQ.option_d].map((option, optIdx) => {
                                    const userAnswer = answers[currentQ._id];
                                    const isSelected = userAnswer === optIdx;
                                    const isCorrect = currentQ.correct_answer === optIdx;
                                    const showAnswer = showResults;

                                    return (
                                       <button
                                          key={optIdx}
                                          onClick={() => !showAnswer && handleAnswerSelect(currentQ._id, optIdx)}
                                          disabled={showAnswer}
                                          className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group ${showAnswer && isCorrect
                                                ? 'border-green-500 bg-green-50 ring-4 ring-green-500/5'
                                                : showAnswer && isSelected && !isCorrect
                                                   ? 'border-red-500 bg-red-50 ring-4 ring-red-500/5'
                                                   : isSelected
                                                      ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-500/5'
                                                      : 'border-slate-100 bg-white hover:border-blue-200 hover:bg-blue-50/30'
                                             } ${showAnswer ? 'cursor-default' : 'cursor-pointer'}`}
                                       >
                                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-colors ${showAnswer && isCorrect ? 'bg-green-500 text-white' :
                                                showAnswer && isSelected && !isCorrect ? 'bg-red-500 text-white' :
                                                   isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                                             }`}>
                                             {String.fromCharCode(65 + optIdx)}
                                          </div>
                                          <div className="flex-1">
                                             <span className={`text-sm font-bold ${showAnswer && isCorrect ? 'text-green-800' :
                                                   showAnswer && isSelected && !isCorrect ? 'text-red-800' :
                                                      isSelected ? 'text-blue-800' : 'text-slate-600 group-hover:text-slate-800'
                                                }`}>
                                                {option}
                                             </span>
                                             {showAnswer && isCorrect && <span className="ml-2 text-[10px] text-green-600 font-black">CORRECT ✓</span>}
                                             {showAnswer && isSelected && !isCorrect && <span className="ml-2 text-[10px] text-red-600 font-black">WRONG ✗</span>}
                                          </div>
                                       </button>
                                    );
                                 })}
                              </div>

                              {showResults && currentQ.explanation && (
                                 <div className="mt-8 p-5 bg-blue-50/50 rounded-2xl border border-blue-100 animate-in fade-in zoom-in duration-300">
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Explanation</p>
                                    <p className="text-sm text-blue-800 font-medium leading-relaxed">{currentQ.explanation}</p>
                                 </div>
                              )}
                           </div>

                           <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 relative">
                              <Button
                                 variant="ghost"
                                 onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                                 disabled={currentQuestionIdx === 0}
                                 className="font-black text-slate-500 rounded-xl px-6"
                              >
                                 <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                              </Button>

                              <button
                                 onClick={() => setPaletteCollapsed(!paletteCollapsed)}
                                 className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-white border border-slate-200 rounded-lg items-center justify-center shadow-md z-10 hover:bg-slate-50 transition-all text-slate-400 hover:text-blue-600"
                              >
                                 {paletteCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </button>

                              <div className="flex items-center gap-3">
                                 {!showResults && (
                                    <Button
                                       onClick={handleSubmit}
                                       disabled={answeredCount === 0}
                                       className="bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl px-8 shadow-lg shadow-blue-600/20"
                                    >
                                       Submit Answers
                                    </Button>
                                 )}
                                 <Button
                                    variant="outline"
                                    onClick={() => setCurrentQuestionIdx(prev => Math.min(questions.length - 1, prev + 1))}
                                    disabled={currentQuestionIdx === questions.length - 1}
                                    className="border-slate-200 text-slate-600 font-black rounded-xl px-8"
                                 >
                                    Next <ChevronRight className="h-4 w-4 ml-2" />
                                 </Button>
                              </div>
                           </div>
                        </CardContent>
                     </Card>
                  ) : (
                     <Card className="flex-1 flex flex-col items-center justify-center p-12 text-center border-slate-100 shadow-sm">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                           <ArrowLeft className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 mb-2">No Questions Found</h3>
                        <p className="text-sm text-slate-500 mb-8 max-w-sm">There are no practice questions available for this level at the moment.</p>
                        <Button onClick={() => navigate('/basic-to-advance/level-content', { state: location.state })} variant="outline" className="rounded-xl px-8">
                           Go Back
                        </Button>
                     </Card>
                  )}
               </div>

               {/* Right: Question Palette */}
               <div className={`transition-all duration-300 ease-in-out ${paletteCollapsed
                     ? 'w-0 opacity-0 pointer-events-none -mr-4'
                     : 'w-full lg:w-72 opacity-100'
                  } flex flex-col gap-4 lg:sticky top-4 self-start`}>

                  <Card className="border-slate-100 shadow-sm overflow-hidden">
                     <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                        <div className="flex items-center justify-between mb-4">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Questions Palette</h4>
                           <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-md">PAGE {currentPage}</span>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                           <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-sm bg-blue-600" />
                              <span className="text-[10px] font-bold text-slate-500">Current</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-sm bg-green-500" />
                              <span className="text-[10px] font-bold text-slate-500">Answered</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-sm bg-slate-200" />
                              <span className="text-[10px] font-bold text-slate-500">Unanswered</span>
                           </div>
                        </div>
                     </div>

                     <CardContent className="p-4 bg-white max-h-[400px] overflow-y-auto scrollbar-hide">
                        <div className="grid grid-cols-5 gap-2">
                           {questions.map((q, idx) => {
                              const isAnswered = answers[q._id] !== undefined;
                              const isCurrent = idx === currentQuestionIdx;

                              let cls = 'bg-slate-100 text-slate-500 border-transparent hover:bg-slate-200';
                              if (isCurrent) cls = 'bg-white border-blue-600 text-blue-600 ring-4 ring-blue-600/10 font-black';
                              else if (isAnswered) cls = 'bg-green-500 border-green-500 text-white shadow-md shadow-green-500/20';

                              return (
                                 <button
                                    key={idx}
                                    onClick={() => setCurrentQuestionIdx(idx)}
                                    className={`h-9 w-full rounded-xl border text-xs font-bold transition-all ${cls}`}
                                 >
                                    {idx + 1}
                                 </button>
                              );
                           })}
                        </div>
                     </CardContent>

                     <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-1">
                           <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-8 rounded-lg text-[10px] font-black"
                              onClick={handlePreviousPage}
                              disabled={currentPage === 1}
                           >
                              <ChevronLeft className="w-3 h-3 mr-1" /> PREV PAGE
                           </Button>
                           <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-8 rounded-lg text-[10px] font-black"
                              onClick={handleNextPage}
                              disabled={currentPage * limit >= totalQuestions}
                           >
                              NEXT PAGE <ChevronRight className="w-3 h-3 ml-1" />
                           </Button>
                        </div>
                        <div className="text-center">
                           <p className="text-[9px] font-black text-slate-400">TOTAL QUESTIONS: {totalQuestions}</p>
                        </div>
                     </div>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 border-0 p-5 text-white shadow-xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors" />
                     <CardContent className="p-0 relative z-10">
                        <h5 className="font-black text-xs uppercase tracking-widest mb-2 opacity-60">Practice Tip</h5>
                        <p className="text-[11px] font-medium leading-relaxed opacity-90">Review explanations for every question to strengthen your concepts!</p>
                     </CardContent>
                  </Card>
               </div>

            </main>
         </div>
      </UserLayout>
   );
};

export default LevelPractice;

