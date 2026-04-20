import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserLayout } from '@/components/UserLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Award, Clock, Home } from 'lucide-react';
import { attemptsAPI } from '@/lib/api';
import { toast } from 'sonner';
import Loader from '@/components/Loader';

interface Answer {
  _id?: string;
  id?: string;
  question_id: any;
  selected_answer: number | null;
  is_correct: boolean;
}

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
  question_image_url?: string;
  question_video_url?: string;
  option_a_image_url?: string;
  option_b_image_url?: string;
  option_c_image_url?: string;
  option_d_image_url?: string;
  explanation?: string;
  explanation_hindi?: string;
  explanation_image_url?: string;
  explanation?: string;
}

const TestResult = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [category, setCategory] = useState<any>(null);

  useEffect(() => {
    fetchResult();
  }, [attemptId]);

  const fetchResult = async () => {
    if (!attemptId) return;

    try {
      const attemptData = await attemptsAPI.getById(attemptId);

      if (!attemptData) {
        toast.error('Result not found');
        navigate('/dashboard');
        return;
      }

      const answersData = attemptData.answers || [];
      const questionsData = answersData.map((a: any) => a.question_id).filter(Boolean);

      setAttempt(attemptData);
      setAnswers(answersData);
      setQuestions(questionsData);

      if (attemptData.test_id?.category_id) {
        setCategory(attemptData.test_id.category_id);
      }
    } catch (error: any) {
      toast.error('Failed to load result');
      console.error(error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="p-8">
          <Loader text="Calculating your results..." />
        </div>
      </UserLayout>
    );
  }

  if (!attempt) {
    return (
      <UserLayout>
        <div className="p-8 text-center">
          <p>Result not found</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">Go to Dashboard</Button>
        </div>
      </UserLayout>
    );
  }

  const percentage = Math.round((attempt.score / attempt.total_questions) * 100);
  const timeTaken = Math.floor(attempt.time_taken_seconds / 60);

  // Calculate score breakdown for negative marking
  const test = attempt.test_id;
  const hasNegativeMarking = test?.negative_marking || false;
  const negativeMarksPerQuestion = test?.negative_marks_per_question || 0.25;
  const positiveMarks = attempt.correct_answers * 1;
  const negativeMarksDeducted = hasNegativeMarking ? attempt.wrong_answers * negativeMarksPerQuestion : 0;
  const finalScore = attempt.score;

  return (
    <UserLayout>
      <div className="p-8 max-w-5xl mx-auto">
        {/* Result Header */}
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center">
              <Award className="h-12 w-12 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl mb-2">Test Completed!</CardTitle>
            <p className="text-muted-foreground">{attempt.test_id?.name || 'Test'} • {category?.name}</p>
          </CardHeader>
        </Card>

        {/* Score Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="text-center border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <p className="text-sm text-muted-foreground">Your Score</p>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold ${percentage >= 70 ? 'text-success' : percentage >= 40 ? 'text-warning' : 'text-destructive'}`}>
                {percentage}%
              </div>
              <p className="text-sm text-muted-foreground mt-2">{attempt.score.toFixed(2)} / {attempt.total_questions}</p>
            </CardContent>
          </Card>

          <Card className="text-center border-l-4 border-l-success">
            <CardHeader className="pb-3">
              <p className="text-sm text-muted-foreground">Correct</p>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-success">{attempt.correct_answers}</div>
              <CheckCircle2 className="h-5 w-5 mx-auto mt-2 text-success" />
            </CardContent>
          </Card>

          <Card className="text-center border-l-4 border-l-destructive">
            <CardHeader className="pb-3">
              <p className="text-sm text-muted-foreground">Wrong</p>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-destructive">{attempt.wrong_answers}</div>
              <XCircle className="h-5 w-5 mx-auto mt-2 text-destructive" />
            </CardContent>
          </Card>

          <Card className="text-center border-l-4 border-l-accent">
            <CardHeader className="pb-3">
              <p className="text-sm text-muted-foreground">Time Taken</p>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-accent">{timeTaken}</div>
              <p className="text-sm text-muted-foreground mt-2">minutes</p>
            </CardContent>
          </Card>
        </div>

        {/* Negative Marking Breakdown */}
        {hasNegativeMarking && (
          <Card className="mb-8 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-orange-900">Score Breakdown (Negative Marking)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-green-100 border-2 border-green-300">
                  <p className="text-sm font-medium text-green-800 mb-1">Positive Marks</p>
                  <p className="text-2xl font-bold text-green-900">
                    +{positiveMarks.toFixed(2)}
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    {attempt.correct_answers} correct × 1 mark
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-red-100 border-2 border-red-300">
                  <p className="text-sm font-medium text-red-800 mb-1">Negative Marks Deducted</p>
                  <p className="text-2xl font-bold text-red-900">
                    -{negativeMarksDeducted.toFixed(2)}
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    {attempt.wrong_answers} wrong × {negativeMarksPerQuestion} marks
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-blue-100 border-2 border-blue-300">
                  <p className="text-sm font-medium text-blue-800 mb-1">Final Score</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {finalScore.toFixed(2)}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {positiveMarks.toFixed(2)} - {negativeMarksDeducted.toFixed(2)} = {finalScore.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Answer Sheet */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Detailed Answer Sheet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((question, idx) => {
              const questionId = question._id || question.id;
              const answer = answers.find((a: any) => {
                const aqId = typeof a.question_id === 'object'
                  ? (a.question_id._id || a.question_id.id)
                  : a.question_id;
                return aqId?.toString() === questionId?.toString();
              });
              const userAnswer = answer?.selected_answer;
              const isCorrect = answer?.is_correct || false;
              const wasAttempted = userAnswer !== null && userAnswer !== undefined;
              const options = [question.option_a, question.option_b, question.option_c, question.option_d];

              return (
                <div key={question._id || question.id} className={`p-4 rounded-lg border-2 ${isCorrect ? 'border-success/30 bg-success/5' : wasAttempted ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-muted/30'}`}>
                  <div className="flex items-start gap-3 mb-3">
                    {isCorrect ? (
                      <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0 mt-1" />
                    ) : wasAttempted ? (
                      <XCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
                    ) : (
                      <div className="h-6 w-6 rounded-full border-2 border-muted-foreground flex-shrink-0 mt-1" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold mb-3">Q{idx + 1}. {question.question_text || question.question_text_hindi}</h3>
                      {question.question_text_hindi && question.question_text && (
                        <p className="text-sm text-muted-foreground mb-3">(Hindi) {question.question_text_hindi}</p>
                      )}

                      {/* Question Image */}
                      {question.question_image_url && (
                        <div className="mb-3 rounded-lg overflow-hidden border border-border/50 bg-muted/30">
                          <img
                            src={question.question_image_url}
                            alt="Question"
                            className="w-full max-h-96 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      {/* Question Video */}
                      {question.question_video_url && (
                        <div className="mb-3 rounded-lg overflow-hidden border border-border/50 bg-muted/30">
                          <video
                            src={question.question_video_url}
                            className="w-full max-h-96"
                            controls
                            onError={(e) => {
                              (e.target as HTMLVideoElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        {[
                          { text: question.option_a, hindi: question.option_a_hindi, image: question.option_a_image_url },
                          { text: question.option_b, hindi: question.option_b_hindi, image: question.option_b_image_url },
                          { text: question.option_c, hindi: question.option_c_hindi, image: question.option_c_image_url },
                          { text: question.option_d, hindi: question.option_d_hindi, image: question.option_d_image_url }
                        ].map((option, optIdx) => {
                          const isUserAnswer = userAnswer === optIdx;
                          const isCorrectAnswer = question.correct_answer === optIdx;
                          const optionText = option.text || option.hindi || '';

                          return (
                            <div
                              key={optIdx}
                              className={`p-3 rounded-md ${isCorrectAnswer ? 'bg-success/20 border-2 border-success' : isUserAnswer ? 'bg-destructive/20 border-2 border-destructive' : 'bg-muted/50'}`}
                            >
                              <div className="flex items-start gap-2">
                                <span className="font-semibold">{String.fromCharCode(65 + optIdx)}.</span>
                                <div className="flex-1">
                                  <span>{optionText}</span>
                                  {option.hindi && option.text && (
                                    <p className="text-xs text-muted-foreground mt-1">(Hindi) {option.hindi}</p>
                                  )}
                                  {/* Option Image */}
                                  {option.image && (
                                    <div className="mt-2 rounded-lg overflow-hidden border border-border/30 bg-muted/20">
                                      <img
                                        src={option.image}
                                        alt={`Option ${String.fromCharCode(65 + optIdx)}`}
                                        className="w-full max-h-48 object-contain"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="mt-2 flex gap-2">
                                {isCorrectAnswer && <span className="text-success font-semibold text-sm">✓ Correct</span>}
                                {isUserAnswer && !isCorrectAnswer && <span className="text-destructive font-semibold text-sm">✗ Your Answer</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {(question.explanation || question.explanation_hindi) && (
                        <div className="mt-3 p-3 bg-primary/10 rounded-md">
                          <p className="text-sm font-semibold mb-1">Explanation:</p>
                          {question.explanation && <p className="text-sm mb-1">{question.explanation}</p>}
                          {question.explanation_hindi && (
                            <p className="text-sm text-muted-foreground">(Hindi) {question.explanation_hindi}</p>
                          )}
                          {question.explanation_image_url && (
                            <div className="mt-2 rounded-lg overflow-hidden border border-border/30">
                              <img
                                src={question.explanation_image_url}
                                alt="Explanation"
                                className="w-full max-h-48 object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => navigate('/tests')}>
            <Clock className="h-4 w-4 mr-2" />
            Take Another Test
          </Button>
          <Button onClick={() => navigate('/dashboard')} className="bg-gradient-primary">
            <Home className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </UserLayout>
  );
};

export default TestResult;
