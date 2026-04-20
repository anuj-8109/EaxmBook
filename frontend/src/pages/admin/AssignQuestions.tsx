import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search, Filter, CheckCircle2, XCircle, Eye, Save, Trash2,
  Calendar, Clock, FileText, Users, CheckSquare, Square
} from 'lucide-react';
import { toast } from 'sonner';
import {
  testsAPI, questionsAPI, categoriesAPI, subjectsAPI, topicsAPI
} from '@/lib/api';
import { AdminPageHeading } from '@/components/AdminPageHeading';
import Loader from '@/components/Loader';

interface Question {
  _id?: string;
  id?: string;
  question_text: string;
  exam_names?: string[];
  subject_ids?: any[];
  topic_ids?: any[];
  time_duration?: number;
  difficulty_level?: number;
  question_reference?: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: number;
}

interface Test {
  _id?: string;
  id?: string;
  name: string;
  category_id: any;
  exam_name?: string;
  status?: string;
  publish_at?: string;
}

interface FilterState {
  exam_names: string[];
  subject_ids: string[];
  topic_ids: string[];
  time_duration: string;
  difficulty_level: string;
  question_reference: string;
}

const AssignQuestions = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [assignedQuestions, setAssignedQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [examNames, setExamNames] = useState<string[]>([]);

  const [filters, setFilters] = useState<FilterState>({
    exam_names: [],
    subject_ids: [],
    topic_ids: [],
    time_duration: '',
    difficulty_level: '',
    question_reference: '',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [publishLater, setPublishLater] = useState(false);
  const [publishDate, setPublishDate] = useState('');

  useEffect(() => {
    if (testId) {
      fetchData();
    }
  }, [testId]);

  useEffect(() => {
    filterQuestions();
  }, [questions, filters, searchQuery]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [testData, questionsData, categoriesData, subjectsData, topicsData] = await Promise.all([
        testsAPI.getById(testId!),
        questionsAPI.getAll(),
        categoriesAPI.getAll(true),
        subjectsAPI.getAll(),
        topicsAPI.getAll(),
      ]);

      setTest(testData);

      // Get assigned questions - handle both array and object response
      const testQuestionsResponse = await testsAPI.getQuestions(testId!);
      let testQuestions = [];
      if (Array.isArray(testQuestionsResponse)) {
        testQuestions = testQuestionsResponse;
      } else if (testQuestionsResponse && Array.isArray(testQuestionsResponse.questions)) {
        testQuestions = testQuestionsResponse.questions;
      } else if (testQuestionsResponse && testQuestionsResponse.data && Array.isArray(testQuestionsResponse.data)) {
        testQuestions = testQuestionsResponse.data;
      }

      const assigned = testQuestions.map((tq: any) => {
        // Handle both question_id and question object
        if (typeof tq.question_id === 'object' && tq.question_id) {
          return tq.question_id;
        }
        return tq.question_id || tq.question || tq;
      }).filter(Boolean);
      setAssignedQuestions(assigned);

      // Handle paginated response: {questions: [...], total: 75, page: 1, limit: 50}
      // or direct array response
      let questionsArray: Question[] = [];
      if (Array.isArray(questionsData)) {
        questionsArray = questionsData;
      } else if (questionsData && Array.isArray(questionsData.questions)) {
        questionsArray = questionsData.questions;
      } else if (questionsData && questionsData.data && Array.isArray(questionsData.data)) {
        questionsArray = questionsData.data;
      }

      setQuestions(questionsArray);

      // Handle new pagination response format
      let categories = [];
      if (Array.isArray(categoriesData)) {
        categories = categoriesData;
      } else if (categoriesData && typeof categoriesData === 'object') {
        categories = categoriesData.categories || [];
      }
      setCategories(Array.isArray(categories) ? categories : []);

      let subjects = [];
      if (Array.isArray(subjectsData)) {
        subjects = subjectsData;
      } else if (subjectsData && typeof subjectsData === 'object') {
        subjects = subjectsData.subjects || [];
      }
      setSubjects(Array.isArray(subjects) ? subjects : []);

      let topics = [];
      if (Array.isArray(topicsData)) {
        topics = topicsData;
      } else if (topicsData && typeof topicsData === 'object') {
        topics = topicsData.topics || [];
      }
      setTopics(Array.isArray(topics) ? topics : []);

      // Extract unique exam names
      const uniqueExamNames = new Set<string>();
      questionsArray.forEach((q: Question) => {
        if (q.exam_names && Array.isArray(q.exam_names)) {
          q.exam_names.forEach(name => uniqueExamNames.add(name));
        }
      });
      setExamNames(Array.from(uniqueExamNames));

    } catch (error: any) {
      toast.error('Failed to load data: ' + error.message);
      console.error('Fetch data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterQuestions = () => {
    // Ensure questions is an array before filtering
    if (!Array.isArray(questions)) {
      setFilteredQuestions([]);
      return;
    }

    let filtered = [...questions];

    // Remove already assigned questions (duplicate prevention)
    // Also check for questions already assigned to tests in the same category hierarchy
    const assignedIds = new Set(
      Array.isArray(assignedQuestions)
        ? assignedQuestions.map(q => q._id || q.id).filter(Boolean)
        : []
    );
    filtered = filtered.filter(q => {
      const qId = q._id || q.id;
      // Don't show if already assigned to this test
      if (assignedIds.has(qId)) return false;

      // TODO: Implement category hierarchy duplicate check
      // For now, we just prevent duplicates within the same test
      return true;
    });

    // Apply filters
    if (filters.exam_names.length > 0) {
      filtered = filtered.filter(q =>
        q.exam_names?.some(name => filters.exam_names.includes(name))
      );
    }

    if (filters.subject_ids.length > 0) {
      filtered = filtered.filter(q =>
        q.subject_ids?.some((s: any) => {
          const subId = typeof s === 'object' ? (s._id || s.id) : s;
          return filters.subject_ids.includes(subId);
        })
      );
    }

    if (filters.topic_ids.length > 0) {
      filtered = filtered.filter(q =>
        q.topic_ids?.some((t: any) => {
          const topId = typeof t === 'object' ? (t._id || t.id) : t;
          return filters.topic_ids.includes(topId);
        })
      );
    }

    if (filters.time_duration) {
      filtered = filtered.filter(q => q.time_duration === parseInt(filters.time_duration));
    }

    if (filters.difficulty_level) {
      filtered = filtered.filter(q => q.difficulty_level === parseInt(filters.difficulty_level));
    }

    if (filters.question_reference) {
      filtered = filtered.filter(q =>
        q.question_reference?.toLowerCase().includes(filters.question_reference.toLowerCase())
      );
    }

    // Search
    if (searchQuery) {
      filtered = filtered.filter(q =>
        q.question_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.question_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.exam_names?.some(name => name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredQuestions(filtered);
  };

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedQuestions(new Set(filteredQuestions.map(q => (q._id || q.id) as string)));
  };

  const deselectAll = () => {
    setSelectedQuestions(new Set());
  };

  const handleBulkAssign = async () => {
    if (selectedQuestions.size === 0) {
      toast.error('Please select questions to assign');
      return;
    }

    setSaving(true);
    try {
      const selectedArray = Array.from(selectedQuestions);
      const currentOrder = assignedQuestions.length;

      for (let i = 0; i < selectedArray.length; i++) {
        await testsAPI.addQuestion(testId!, selectedArray[i], currentOrder + i + 1);
      }

      toast.success(`${selectedQuestions.size} questions assigned successfully!`);
      setSelectedQuestions(new Set());
      fetchData();
    } catch (error: any) {
      toast.error('Failed to assign questions: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUnassign = async () => {
    if (selectedQuestions.size === 0) {
      toast.error('Please select questions to unassign');
      return;
    }

    setSaving(true);
    try {
      const selectedArray = Array.from(selectedQuestions);

      for (const questionId of selectedArray) {
        await testsAPI.removeQuestion(testId!, questionId);
      }

      toast.success(`${selectedQuestions.size} questions unassigned successfully!`);
      setSelectedQuestions(new Set());
      fetchData();
    } catch (error: any) {
      toast.error('Failed to unassign questions: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await testsAPI.update(testId!, { status: 'draft' });
      toast.success('Test saved as draft!');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to save draft: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setSaving(true);
    try {
      const updateData: any = { status: 'published' };
      if (publishLater && publishDate) {
        updateData.status = 'scheduled';
        updateData.publish_at = new Date(publishDate).toISOString();
      }
      await testsAPI.update(testId!, updateData);
      toast.success(publishLater ? 'Test scheduled for publication!' : 'Test published successfully!');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to publish test: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (confirm('Are you sure you want to discard all changes?')) {
      fetchData();
      setSelectedQuestions(new Set());
      toast.info('Changes discarded');
    }
  };

  const getSubjectCounts = () => {
    const counts: Record<string, number> = {};
    assignedQuestions.forEach(q => {
      if (q.subject_ids && q.subject_ids.length > 0) {
        q.subject_ids.forEach((s: any) => {
          const subName = typeof s === 'object' ? (s.name || 'Unknown') : (subjects.find(sub => (sub._id || sub.id) === s)?.name || 'Unknown');
          counts[subName] = (counts[subName] || 0) + 1;
        });
      } else {
        counts['Uncategorized'] = (counts['Uncategorized'] || 0) + 1;
      }
    });
    return counts;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8">
          <Loader text="Loading test and questions..." />
        </div>
      </AdminLayout>
    );
  }

  if (!test) {
    return (
      <AdminLayout>
        <div className="p-8">
          <p className="text-center text-muted-foreground">Test not found</p>
        </div>
      </AdminLayout>
    );
  }

  const subjectCounts = getSubjectCounts();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeading
          eyebrow="Question Assignment"
          title={`Assign Questions: ${test.name}`}
          description="Filter, select, and assign questions to this test"
        />

        {/* Subject-wise Question Count */}
        {Object.keys(subjectCounts).length > 0 && (
          <Card className="rounded-[1.5rem] border border-border/70 shadow-lg">
            <CardHeader className="border-b border-border/60 px-4 py-3">
              <CardTitle className="text-sm font-semibold">Assigned Questions by Subject</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3">
                {Object.entries(subjectCounts).map(([subject, count]) => (
                  <Badge key={subject} variant="secondary" className="rounded-full px-4 py-2">
                    {subject}: {count} questions
                  </Badge>
                ))}
                <Badge variant="default" className="rounded-full px-4 py-2">
                  Total: {assignedQuestions.length} questions
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Search */}
        <Card className="rounded-[1.5rem] border border-border/70 shadow-lg">
          <CardHeader className="border-b border-border/60 px-4 py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Filter Questions</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by question text, reference, or exam name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-border/60">
                <div className="space-y-2">
                  <Label>Exam Names (Multi-select)</Label>
                  <div className="border border-border/60 rounded-xl p-2 max-h-32 overflow-y-auto">
                    {examNames.map(name => (
                      <label key={name} className="flex items-center gap-2 p-1 cursor-pointer hover:bg-muted/50 rounded">
                        <Checkbox
                          checked={filters.exam_names.includes(name)}
                          onCheckedChange={(checked) => {
                            setFilters(prev => ({
                              ...prev,
                              exam_names: checked
                                ? [...prev.exam_names, name]
                                : prev.exam_names.filter(n => n !== name)
                            }));
                          }}
                        />
                        <span className="text-sm">{name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Subjects (Multi-select)</Label>
                  <div className="border border-border/60 rounded-xl p-2 max-h-32 overflow-y-auto">
                    {Array.isArray(subjects) && subjects.map(sub => (
                      <label key={sub._id || sub.id} className="flex items-center gap-2 p-1 cursor-pointer hover:bg-muted/50 rounded">
                        <Checkbox
                          checked={filters.subject_ids.includes((sub._id || sub.id) as string)}
                          onCheckedChange={(checked) => {
                            setFilters(prev => ({
                              ...prev,
                              subject_ids: checked
                                ? [...prev.subject_ids, (sub._id || sub.id) as string]
                                : prev.subject_ids.filter(id => id !== (sub._id || sub.id))
                            }));
                          }}
                        />
                        <span className="text-sm">{sub.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Topics (Multi-select)</Label>
                  <div className="border border-border/60 rounded-xl p-2 max-h-32 overflow-y-auto">
                    {Array.isArray(topics) && topics.map(topic => (
                      <label key={topic._id || topic.id} className="flex items-center gap-2 p-1 cursor-pointer hover:bg-muted/50 rounded">
                        <Checkbox
                          checked={filters.topic_ids.includes((topic._id || topic.id) as string)}
                          onCheckedChange={(checked) => {
                            setFilters(prev => ({
                              ...prev,
                              topic_ids: checked
                                ? [...prev.topic_ids, (topic._id || topic.id) as string]
                                : prev.topic_ids.filter(id => id !== (topic._id || topic.id))
                            }));
                          }}
                        />
                        <span className="text-sm">{topic.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Time Duration (seconds)</Label>
                  <Input
                    type="number"
                    placeholder="60"
                    value={filters.time_duration}
                    onChange={(e) => setFilters(prev => ({ ...prev, time_duration: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Difficulty Level (1-10)</Label>
                  <Select
                    value={filters.difficulty_level || 'all'}
                    onValueChange={(v) => setFilters(prev => ({ ...prev, difficulty_level: v === 'all' ? '' : v }))}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All levels</SelectItem>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                        <SelectItem key={level} value={level.toString()}>Level {level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Question Reference</Label>
                  <Input
                    placeholder="e.g., PYQ 2023"
                    value={filters.question_reference}
                    onChange={(e) => setFilters(prev => ({ ...prev, question_reference: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Questions List */}
        <Card className="rounded-[1.5rem] border border-border/70 shadow-lg">
          <CardHeader className="border-b border-border/60 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Available Questions ({filteredQuestions.length})
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedQuestions.size} selected
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={selectAll}
                >
                  <CheckSquare className="h-4 w-4 mr-1" />
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={deselectAll}
                >
                  <Square className="h-4 w-4 mr-1" />
                  Deselect
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="rounded-xl"
                  onClick={handleBulkAssign}
                  disabled={selectedQuestions.size === 0 || saving}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Assign Selected ({selectedQuestions.size})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">No questions available</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredQuestions.map((question) => {
                  const qId = (question._id || question.id) as string;
                  const isSelected = selectedQuestions.has(qId);

                  return (
                    <div
                      key={qId}
                      className={`flex items-start gap-3 p-4 rounded-xl border transition ${isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border/70 bg-card hover:bg-muted/50'
                        }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleQuestionSelection(qId)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{question.question_text}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {question.exam_names?.map((name, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {name}
                            </Badge>
                          ))}
                          {question.difficulty_level && (
                            <Badge variant="outline" className="text-xs">
                              Level {question.difficulty_level}
                            </Badge>
                          )}
                          {question.question_reference && (
                            <Badge variant="outline" className="text-xs">
                              {question.question_reference}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assigned Questions */}
        {assignedQuestions.length > 0 && (
          <Card className="rounded-[1.5rem] border border-border/70 shadow-lg">
            <CardHeader className="border-b border-border/60 px-4 py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  Assigned Questions ({assignedQuestions.length})
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={handleBulkUnassign}
                  disabled={selectedQuestions.size === 0 || saving}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Unassign Selected ({selectedQuestions.size})
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {assignedQuestions.map((question, idx) => {
                  const qId = (question._id || question.id) as string;
                  const isSelected = selectedQuestions.has(qId);

                  return (
                    <div
                      key={qId}
                      className={`flex items-start gap-3 p-4 rounded-xl border transition ${isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border/70 bg-card'
                        }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleQuestionSelection(qId)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-muted-foreground">
                            Q{idx + 1}
                          </span>
                        </div>
                        <p className="font-medium text-sm">{question.question_text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <Card className="rounded-[1.5rem] border border-border/70 shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  onClick={handleSaveDraft}
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl text-destructive"
                  onClick={handleDiscard}
                  disabled={saving}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Discard
                </Button>
              </div>

              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="rounded-2xl">
                      <Eye className="h-4 w-4 mr-2" />
                      View Test
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Test Preview: {test.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Total Questions</Label>
                          <p className="font-semibold">{assignedQuestions.length}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Status</Label>
                          <p className="font-semibold">{test.status || 'draft'}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {assignedQuestions.map((q, idx) => (
                          <div key={q._id || q.id} className="p-4 border rounded-xl">
                            <p className="font-semibold mb-2">Q{idx + 1}. {q.question_text}</p>
                            <div className="space-y-1 text-sm">
                              <div className={q.correct_answer === 0 ? 'text-green-600 font-semibold' : ''}>
                                A. {q.option_a}
                              </div>
                              <div className={q.correct_answer === 1 ? 'text-green-600 font-semibold' : ''}>
                                B. {q.option_b}
                              </div>
                              <div className={q.correct_answer === 2 ? 'text-green-600 font-semibold' : ''}>
                                C. {q.option_c}
                              </div>
                              <div className={q.correct_answer === 3 ? 'text-green-600 font-semibold' : ''}>
                                D. {q.option_d}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={publishLater}
                    onCheckedChange={setPublishLater}
                  />
                  <Label className="text-xs">Publish Later</Label>
                </div>

                {publishLater && (
                  <Input
                    type="datetime-local"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    className="rounded-xl w-48"
                  />
                )}

                <Button
                  className="rounded-2xl"
                  onClick={handlePublish}
                  disabled={saving || assignedQuestions.length === 0}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {publishLater ? 'Schedule Publish' : 'Publish Now'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AssignQuestions;

