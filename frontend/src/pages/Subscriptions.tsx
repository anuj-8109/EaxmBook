import { useEffect, useState } from 'react';
import { UserLayout } from '@/components/UserLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, BookMarked, FileText, CheckCircle2, X, Loader2, Clock, Trophy, TrendingUp } from 'lucide-react';
import { subscriptionsAPI, categoriesAPI, testsAPI, attemptsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import Loader from '@/components/Loader';

interface Category {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
}

interface Subject {
  _id: string;
  name: string;
  description?: string;
  category_id: Category;
}

interface Test {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  category_id: Category | string;
  subject_id?: Subject;
  duration_minutes: number;
  total_marks: number;
  is_active: boolean;
}

interface TestAttempt {
  _id: string;
  test_id: string | Test;
  time_taken_seconds: number;
  score: number;
  total_questions: number;
  correct_answers: number;
  completed_at: string;
  started_at: string;
}

interface Subscription {
  _id: string;
  category: Category;
  created_at: string;
}

const Subscriptions = () => {
  const [loading, setLoading] = useState(true);
  const [subscribedData, setSubscribedData] = useState<{
    subscriptions: Subscription[];
    subjects: Subject[];
    tests: Test[];
  } | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subscriptionsData, categoriesData, attemptsData] = await Promise.all([
        subscriptionsAPI.getMySubscriptions(),
        categoriesAPI.getAll(),
        attemptsAPI.getAll(1, 100), // Get first 100 attempts
      ]);

      setSubscribedData(subscriptionsData);
      // Handle new pagination response format
      let categories = [];
      if (Array.isArray(categoriesData)) {
        categories = categoriesData;
      } else if (categoriesData && typeof categoriesData === 'object') {
        categories = categoriesData.categories || [];
      }
      setAllCategories(Array.isArray(categories) ? categories : []);
      // Handle paginated response
      setAttempts(attemptsData.attempts || attemptsData || []);
    } catch (error: any) {
      toast.error('Failed to load subscriptions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubscribe = async (categoryId: string) => {
    setSubscribing(categoryId);
    try {
      await subscriptionsAPI.subscribe(categoryId);
      toast.success('Subscribed successfully!');
      await fetchData();
    } catch (error: any) {
      toast.error('Failed to subscribe: ' + error.message);
    } finally {
      setSubscribing(null);
    }
  };

  const handleUnsubscribe = async (categoryId: string) => {
    setSubscribing(categoryId);
    try {
      await subscriptionsAPI.unsubscribe(categoryId);
      toast.success('Unsubscribed successfully!');
      await fetchData();
    } catch (error: any) {
      toast.error('Failed to unsubscribe: ' + error.message);
    } finally {
      setSubscribing(null);
    }
  };

  const isSubscribed = (categoryId: string) => {
    return subscribedData?.subscriptions.some(
      sub => (sub.category._id || sub.category) === categoryId
    ) || false;
  };

  const getSubscribedCategoryIds = () => {
    return subscribedData?.subscriptions.map(
      sub => sub.category._id || sub.category
    ) || [];
  };

  const getSubjectsForCategory = (categoryId: string) => {
    return subscribedData?.subjects.filter(
      sub => (sub.category_id._id || sub.category_id) === categoryId
    ) || [];
  };

  const getTestsForCategory = (categoryId: string) => {
    return subscribedData?.tests.filter(test => {
      const testCatId = typeof test.category_id === 'object' 
        ? (test.category_id as Category)._id 
        : test.category_id;
      return testCatId === categoryId;
    }) || [];
  };

  const getAttemptsForTest = (testId: string) => {
    return attempts.filter(
      attempt => {
        if (!attempt.test_id) return false;
        const attemptTestId = typeof attempt.test_id === 'object'
          ? ((attempt.test_id as any)._id || (attempt.test_id as any).id || attempt.test_id)
          : attempt.test_id;
        return String(attemptTestId) === String(testId);
      }
    );
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getBestAttempt = (testAttempts: TestAttempt[]) => {
    if (testAttempts.length === 0) return null;
    return testAttempts.reduce((best, current) =>
      current.score > best.score ? current : best
    );
  };

  const getLatestAttempt = (testAttempts: TestAttempt[]) => {
    if (testAttempts.length === 0) return null;
    return testAttempts.reduce((latest, current) =>
      new Date(current.completed_at) > new Date(latest.completed_at) ? current : latest
    );
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="p-4 sm:p-6">
          <Loader text="Loading subscriptions..." />
        </div>
      </UserLayout>
    );
  }

  const subscribedCategoryIds = getSubscribedCategoryIds();

  return (
    <UserLayout>
      <div className="w-full py-6 space-y-6">


        <Tabs defaultValue="subscribed" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="subscribed">Subscribed Categories</TabsTrigger>
            <TabsTrigger value="all">All Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="subscribed" className="space-y-4">
            {!subscribedData || subscribedData.subscriptions.length === 0 ? (
              <Card className="rounded-[1.5rem] border border-border/70">
                <CardContent className="py-16 text-center">
                  <BookMarked className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-bold mb-2">No Subscriptions Yet</h3>
                  <p className="text-sm text-muted-foreground font-medium mb-4">
                    Subscribe to categories to see related subjects and tests
                  </p>
                  <Button onClick={() => (document.querySelector('[value="all"]') as HTMLElement)?.click()}>
                    Browse Categories
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {subscribedData.subscriptions.map((subscription) => {
                  const category = subscription.category;
                  const categoryId = typeof category === 'object' ? (category._id || (category as any).id) : category;
                  const subjects = getSubjectsForCategory(categoryId);
                  const tests = getTestsForCategory(categoryId);

                  return (
                    <Card key={subscription._id} className="rounded-[1.5rem] border border-border/70">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {category.icon && (
                                <span className="text-2xl">{category.icon}</span>
                              )}
                              <CardTitle className="text-xl font-bold">{category.name}</CardTitle>
                              <Badge variant="secondary" className="ml-2 font-semibold text-xs">
                                Subscribed
                              </Badge>
                            </div>
                            {category.description && (
                              <CardDescription className="text-sm font-medium">{category.description}</CardDescription>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnsubscribe(categoryId as string)}
                            disabled={subscribing === categoryId}
                            className="rounded-xl"
                          >
                            {subscribing === categoryId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <X className="h-4 w-4 mr-2" />
                                Unsubscribe
                              </>
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Subjects Section */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <BookOpen className="h-5 w-5 text-primary" />
                            <h3 className="font-bold text-base">Subjects ({subjects.length})</h3>
                          </div>
                          {subjects.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {subjects.map((subject) => (
                                <Card
                                  key={subject._id}
                                  className="border border-border/60 bg-muted/30"
                                >
                                  <CardContent className="p-3">
                                    <p className="font-bold text-sm">{subject.name}</p>
                                    {subject.description && (
                                      <p className="text-xs text-muted-foreground mt-1 font-medium">
                                        {subject.description}
                                      </p>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground font-medium">No subjects available</p>
                          )}
                        </div>

                        {/* Tests Section */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <h3 className="font-bold text-base">Mock Tests ({tests.length})</h3>
                          </div>
                          {tests.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {tests.map((test) => {
                                const testAttempts = getAttemptsForTest(test._id);
                                const bestAttempt = getBestAttempt(testAttempts);
                                const latestAttempt = getLatestAttempt(testAttempts);
                                const attemptCount = testAttempts.length;

                                return (
                                  <Card
                                    key={test._id}
                                    className="border border-border/60 bg-muted/30 hover:bg-muted/50 transition"
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-start justify-between mb-2">
                                        <h4 className="font-bold text-sm flex-1">{test.name}</h4>
                                        {test.is_active && (
                                          <Badge variant="outline" className="text-xs font-semibold">
                                            Active
                                          </Badge>
                                        )}
                                      </div>
                                      {test.description && (
                                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2 font-medium">
                                          {test.description}
                                        </p>
                                      )}
                                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 font-semibold">
                                        <span>{test.duration_minutes} min</span>
                                        <span>{test.total_marks} marks</span>
                                      </div>
                                      {test.subject_id && (
                                        <p className="text-xs text-muted-foreground mb-3 font-medium">
                                          Subject: <span className="font-semibold">{typeof test.subject_id === 'object' ? test.subject_id.name : 'N/A'}</span>
                                        </p>
                                      )}

                                      {/* Attempt Information */}
                                      {attemptCount > 0 && (
                                        <div className="mb-3 p-2.5 bg-primary/5 rounded-lg border border-primary/20">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                                              <TrendingUp className="h-3.5 w-3.5" />
                                              <span>{attemptCount} Attempt{attemptCount > 1 ? 's' : ''}</span>
                                            </div>
                                            {bestAttempt && (
                                              <div className="flex items-center gap-1.5 text-xs font-bold text-green-600">
                                                <Trophy className="h-3.5 w-3.5" />
                                                <span>Best: {bestAttempt.score}/{bestAttempt.total_questions}</span>
                                              </div>
                                            )}
                                          </div>
                                          {latestAttempt && (
                                            <div className="space-y-1.5 text-xs">
                                              <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span>Time: <span className="font-bold">{formatTime(latestAttempt.time_taken_seconds)}</span></span>
                                              </div>
                                              <div className="text-muted-foreground font-semibold">
                                                Last: <span className="font-bold">{new Date(latestAttempt.completed_at).toLocaleDateString()}</span>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      <Link to={`/test/${test._id}`}>
                                        <Button size="sm" className="w-full rounded-xl text-xs font-bold">
                                          {attemptCount > 0 ? 'Retake Test' : 'Start Test'}
                                        </Button>
                                      </Link>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground font-medium">No tests available</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.isArray(allCategories) && allCategories.map((category) => {
                const categoryId = category._id;
                const subscribed = isSubscribed(categoryId);

                return (
                  <Card
                    key={categoryId}
                    className="rounded-[1.5rem] border border-border/70 hover:border-primary/50 transition"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {category.icon && (
                            <span className="text-2xl">{category.icon}</span>
                          )}
                          <CardTitle className="text-lg font-bold">{category.name}</CardTitle>
                        </div>
                        {subscribed && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      {category.description && (
                        <CardDescription className="mt-2 text-sm font-medium">{category.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() =>
                          subscribed
                            ? handleUnsubscribe(categoryId)
                            : handleSubscribe(categoryId)
                        }
                        disabled={subscribing === categoryId}
                        variant={subscribed ? 'outline' : 'default'}
                        className="w-full rounded-xl font-bold"
                      >
                        {subscribing === categoryId ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : subscribed ? (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Unsubscribe
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Subscribe
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </UserLayout>
  );
};

export default Subscriptions;

