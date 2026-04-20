import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserLayout } from '@/components/UserLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, CheckCircle2, XCircle, Target, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { levelsAPI } from '@/lib/api';
import { toast } from 'sonner';
import Loader from '@/components/Loader';

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

const SkipTest = () => {
   const location = useLocation();
   const navigate = useNavigate();
   const { levelId, levelNumber, levelName, topicName, subjectName, categoryName, progress } = location.state || {};

   const [loading, setLoading] = useState(true);
   const [submitting, setSubmitting] = useState(false);
   const [questions, setQuestions] = useState<Question[]>([]);
   const [currentQuestion, setCurrentQuestion] = useState(0);
   const [answers, setAnswers] = useState<Record<string, number>>({});
   const [startTime] = useState(new Date().toISOString());
   const [resultDialogOpen, setResultDialogOpen] = useState(false);
   const [testResult, setTestResult] = useState<any>(null);
   const [questionPage, setQuestionPage] = useState(1);

   useEffect(() => {
      if (!levelId) {
         toast.error('Level not selected');
         navigate('/basic-to-advance');
         return;
      }
      fetchQuestions();
   }, [levelId]);

   const fetchQuestions = async () => {
      try {
         const data = await levelsAPI.getSkipTestQuestions(levelId);
         setQuestions(data.questions || []);
         setLoading(false);
      } catch (error: any) {
         toast.error('Failed to load skip test questions');
         console.error(error);
         setLoading(false);
      }
   };

   const handleAnswerSelect = (questionId: string, answer: number) => {
      setAnswers({ ...answers, [questionId]: answer });
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
      const unanswered = questions.filter(q => answers[q._id] === undefined).length;
      if (unanswered > 0) {
         const confirm = window.confirm(`You have ${unanswered} unanswered questions. Are you sure you want to submit?`);
         if (!confirm) return;
      }

      setSubmitting(true);
      const endTime = new Date().toISOString();
      const timeTaken = Math.floor((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000);

      try {
         const answersArray = questions.map(q => ({
            question_id: q._id,
            selected_answer: answers[q._id] !== undefined ? answers[q._id] : null
         }));

         const result = await levelsAPI.submitSkipTest(levelId, {
            answers: answersArray,
            time_taken_seconds: timeTaken,
            started_at: startTime
         });

         setTestResult(result);
         setResultDialogOpen(true);
      } catch (error: any) {
         toast.error('Failed to submit test');
         console.error(error);
      } finally {
         setSubmitting(false);
      }
   };

   const handleCloseResult = () => {
      setResultDialogOpen(false);
      if (testResult?.passed) {
         // Navigate back to levels page
         navigate('/basic-to-advance/levels', {
            state: {
               topicId: location.state?.topicId,
               topicName: location.state?.topicName || topicName,
               subjectName: location.state?.subjectName || subjectName,
               categoryName: location.state?.categoryName || categoryName
            }
         });
      } else {
         // If failed, allow retake - reset and fetch new questions
         setAnswers({});
         setCurrentQuestion(0);
         setTestResult(null);
         fetchQuestions();
      }
   };

   if (loading) {
      return (
         <UserLayout>
            <div className="p-8">
               <Loader text="Loading skip test..." />
            </div>
         </UserLayout>
      );
   }

   const currentQ = questions[currentQuestion];
   const progressPercent = ((currentQuestion + 1) / questions.length) * 100;
   const answeredCount = Object.keys(answers).length;
   const requiredCorrect = Math.ceil(questions.length * 0.8); // 80% of 30 = 24

   return (
      <UserLayout>
         <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-3 sm:mb-4">
               <Button
                  variant="outline"
                  onClick={() => navigate('/basic-to-advance/level-content', { state: location.state })}
                  className="mb-3 sm:mb-4 text-xs sm:text-sm"
                  size="sm"
               >
                  <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Back to Content
               </Button>

               <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-200">
                  <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                        <div className="flex-1">
                           <CardTitle className="text-base sm:text-lg">Skip Test - Level {levelNumber}</CardTitle>
                           <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                              {levelName || `Level ${levelNumber}`} • {topicName}
                           </p>
                        </div>
                        <div className="text-left sm:text-right">
                           <p className="text-xs sm:text-sm font-semibold text-purple-700">
                              Pass Requirement: 80%
                           </p>
                           <p className="text-[10px] sm:text-xs text-muted-foreground">
                              Need {requiredCorrect} correct out of {questions.length}
                           </p>
                        </div>
                     </div>
                  </CardHeader>
               </Card>
            </div>

            {/* Progress */}
            <div className="mb-3 sm:mb-4">
               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0 mb-2">
                  <span className="text-xs sm:text-sm font-semibold">
                     Question {currentQuestion + 1} of {questions.length}
                  </span>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                     {answeredCount} / {questions.length} answered
                  </span>
               </div>
               <Progress value={progressPercent} className="h-2" />
            </div>

            {/* Warning Card */}
            <Card className="mb-3 sm:mb-4 bg-yellow-50 border-yellow-200">
               <CardContent className="p-2 sm:p-3">
                  <p className="text-xs sm:text-sm text-yellow-800 break-words">
                     <strong>Important:</strong> You need to score at least 80% ({requiredCorrect} correct answers) to pass this skip test and unlock the next level.
                     If you fail, you can retake the test with different questions.
                  </p>
               </CardContent>
            </Card>

            {/* Question */}
            {currentQ && (
               <Card className="mb-3 sm:mb-4">
                  <CardContent className="p-3 sm:p-4 md:p-6">
                     <h3 className="font-semibold text-sm sm:text-base md:text-lg mb-3 sm:mb-4 break-words">
                        Q{currentQuestion + 1}. {currentQ.question_text}
                     </h3>
                     <div className="space-y-2">
                        {[currentQ.option_a, currentQ.option_b, currentQ.option_c, currentQ.option_d].map((option, optIdx) => {
                           const questionId = currentQ._id;
                           const isSelected = answers[questionId] === optIdx;

                           return (
                              <button
                                 key={optIdx}
                                 onClick={() => handleAnswerSelect(questionId, optIdx)}
                                 className={`w-full p-2 sm:p-3 text-left rounded-lg border-2 transition-all text-xs sm:text-sm ${isSelected
                                       ? 'border-blue-500 bg-blue-50 font-bold shadow-md'
                                       : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                    }`}
                              >
                                 <div className="flex items-center gap-2 sm:gap-2.5">
                                    <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected
                                          ? 'border-blue-500 bg-blue-500 text-white'
                                          : 'border-gray-300'
                                       }`}>
                                       {isSelected && <span className="text-[10px] sm:text-xs font-bold">✓</span>}
                                    </div>
                                    <span className="font-bold mr-1 sm:mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                                    <span className="flex-1 font-medium break-words">{option}</span>
                                 </div>
                              </button>
                           );
                        })}
                     </div>
                  </CardContent>
               </Card>
            )}

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0">
               <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  className="text-xs sm:text-sm"
                  size="sm"
               >
                  <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Previous
               </Button>

               <div className="flex gap-2">
                  {currentQuestion === questions.length - 1 ? (
                     <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm"
                        size="sm"
                     >
                        {submitting ? 'Submitting...' : 'Submit Test'}
                     </Button>
                  ) : (
                     <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm" size="sm">
                        Next
                        <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 rotate-180" />
                     </Button>
                  )}
               </div>
            </div>

            {/* Question Navigation Grid with Pagination */}
            <Card className="mt-4 sm:mt-6">
               <CardHeader className="p-3 sm:p-4">
                  <CardTitle className="text-xs sm:text-sm">Question Navigation</CardTitle>
               </CardHeader>
               <CardContent className="p-3 sm:p-4">
                  {(() => {
                     const questionsPerPage = 30;
                     const totalPages = Math.ceil(questions.length / questionsPerPage);
                     const startIdx = (questionPage - 1) * questionsPerPage;
                     const endIdx = startIdx + questionsPerPage;
                     const visibleQuestions = questions.slice(startIdx, endIdx);

                     return (
                        <>
                           <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5 sm:gap-2">
                              {visibleQuestions.map((q, idx) => {
                                 const actualIdx = startIdx + idx;
                                 const isAnswered = answers[q._id] !== undefined;
                                 const isCurrent = actualIdx === currentQuestion;
                                 return (
                                    <button
                                       key={q._id}
                                       onClick={() => setCurrentQuestion(actualIdx)}
                                       className={`h-7 sm:h-8 rounded text-[10px] sm:text-xs font-semibold ${isCurrent
                                             ? 'bg-blue-600 text-white ring-1 sm:ring-2 ring-blue-300'
                                             : isAnswered
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                          }`}
                                    >
                                       {actualIdx + 1}
                                    </button>
                                 );
                              })}
                           </div>

                           {totalPages > 1 && (
                              <div className="mt-3 sm:mt-4 flex justify-center">
                                 <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                                    <Button
                                       variant="outline"
                                       size="sm"
                                       onClick={() => setQuestionPage(p => Math.max(1, p - 1))}
                                       disabled={questionPage === 1}
                                       className="text-xs"
                                    >
                                       <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                       Previous
                                    </Button>
                                    <span className="flex items-center px-2 sm:px-4 text-xs sm:text-sm text-muted-foreground">
                                       Page {questionPage} of {totalPages}
                                    </span>
                                    <Button
                                       variant="outline"
                                       size="sm"
                                       onClick={() => setQuestionPage(p => Math.min(totalPages, p + 1))}
                                       disabled={questionPage === totalPages}
                                       className="text-xs"
                                    >
                                       Next
                                       <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                                    </Button>
                                 </div>
                              </div>
                           )}

                           <div className="flex flex-wrap gap-2 sm:gap-4 mt-3 sm:mt-4 text-[10px] sm:text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                 <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-600 rounded" />
                                 <span>Current</span>
                              </div>
                              <div className="flex items-center gap-1">
                                 <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded" />
                                 <span>Answered</span>
                              </div>
                              <div className="flex items-center gap-1">
                                 <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gray-200 rounded" />
                                 <span>Unanswered</span>
                              </div>
                           </div>
                        </>
                     );
                  })()}
               </CardContent>
            </Card>
         </div>

         {/* Result Dialog */}
         <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
            <DialogContent className="max-w-md mx-4">
               <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                     {testResult?.passed ? (
                        <>
                           <CheckCircle2 className="w-6 h-6 text-green-600" />
                           Test Passed!
                        </>
                     ) : (
                        <>
                           <XCircle className="w-6 h-6 text-red-600" />
                           Test Failed
                        </>
                     )}
                  </DialogTitle>
                  <DialogDescription>
                     {testResult?.passed
                        ? 'Congratulations! You have passed the skip test and unlocked the next level.'
                        : `You scored ${testResult?.scorePercentage?.toFixed(1)}% but need 80% to pass. You can retake the test with different questions.`
                     }
                  </DialogDescription>
               </DialogHeader>
               {testResult && (
                  <div className="space-y-3 py-4">
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Score:</span>
                        <span className="font-semibold">{testResult.scorePercentage?.toFixed(1)}%</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Correct:</span>
                        <span className="font-semibold text-green-600">{testResult.attempt?.correct_answers} / {testResult.attempt?.total_questions}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Wrong:</span>
                        <span className="font-semibold text-red-600">{testResult.attempt?.wrong_answers}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Required:</span>
                        <span className="font-semibold">80%</span>
                     </div>
                     {testResult.nextLevelUnlocked && (
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                           <p className="text-sm text-green-800 font-semibold">
                              ✓ Next level has been unlocked!
                           </p>
                        </div>
                     )}
                  </div>
               )}
               <DialogFooter>
                  <Button onClick={handleCloseResult} className="w-full">
                     {testResult?.passed ? 'Continue to Next Level' : 'Retake Test'}
                  </Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>
      </UserLayout>
   );
};

export default SkipTest;

