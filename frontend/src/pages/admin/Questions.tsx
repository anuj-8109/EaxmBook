import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Eye, Upload, Search, Filter, X, Trash } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { showError, showSuccess, showWarning, showInfo, showDeleteConfirm } from '@/lib/sweetalert';
import { questionsAPI } from '@/lib/api';
import { AdminPageHeading } from '@/components/AdminPageHeading';
import { QuestionForm } from '@/components/QuestionForm';
import { DuplicateDetector } from '@/components/DuplicateDetector';
import { BulkUpload } from '@/components/BulkUpload';
import { GenerateSampleQuestions } from '@/components/GenerateSampleQuestions';
import { BulkDataGenerator } from '@/components/BulkDataGenerator';
import Loader from '@/components/Loader';
import { PaginationControls } from '@/components/PaginationControls';

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
  option_x?: string;
  option_x_hindi?: string;
  answer_type?: 'single' | 'multiple' | 'none';
  correct_answer?: number;
  correct_answers?: number[];
  hint?: string;
  hint_hindi?: string;
  explanation?: string;
  explanation_hindi?: string;
  exam_names?: string[];
  difficulty_level?: number;
  time_duration?: number;
  question_reference?: string;
  category_ids?: any[];
  subject_ids?: any[];
  topic_ids?: any[];
}

const Questions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('list');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  // Multi-select states
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());

  // Memoize initialData to prevent unnecessary re-renders of QuestionForm
  const questionFormInitialData = useMemo(() => {
    if (!editingQuestion) return undefined;
    return {
      exam_names: editingQuestion.exam_names || [],
      category_ids: editingQuestion.category_ids?.map((c: any) => c._id || c.id || c) || [],
      subject_ids: editingQuestion.subject_ids?.map((s: any) => s._id || s.id || s) || [],
      topic_ids: editingQuestion.topic_ids?.map((t: any) => t._id || t.id || t) || [],
      time_duration: editingQuestion.time_duration || null,
      difficulty_level: editingQuestion.difficulty_level || 5,
      question_reference: editingQuestion.question_reference || '',
      question_text: editingQuestion.question_text || '',
      question_text_hindi: editingQuestion.question_text_hindi || '',
      option_a: editingQuestion.option_a || '',
      option_a_hindi: editingQuestion.option_a_hindi || '',
      option_b: editingQuestion.option_b || '',
      option_b_hindi: editingQuestion.option_b_hindi || '',
      option_c: editingQuestion.option_c || '',
      option_c_hindi: editingQuestion.option_c_hindi || '',
      option_d: editingQuestion.option_d || '',
      option_d_hindi: editingQuestion.option_d_hindi || '',
      option_x: editingQuestion.option_x || '',
      option_x_hindi: editingQuestion.option_x_hindi || '',
      answer_type: editingQuestion.answer_type || 'single',
      correct_answer: editingQuestion.correct_answer ?? null,
      correct_answers: editingQuestion.correct_answers || [],
      hint: editingQuestion.hint || '',
      hint_hindi: editingQuestion.hint_hindi || '',
      explanation: editingQuestion.explanation || '',
      explanation_hindi: editingQuestion.explanation_hindi || '',
    };
  }, [editingQuestion]);

  useEffect(() => {
    fetchQuestions();
  }, [currentPage]);

  useEffect(() => {
    filterQuestions();
  }, [questions, searchQuery, filterDifficulty]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const data = await questionsAPI.getAll({ page: currentPage, limit: itemsPerPage });
      // Handle paginated response: {questions: [...], total: 75, page: 1, limit: 50}
      // or direct array response
      if (data && Array.isArray(data)) {
        setQuestions(data);
        setTotalPages(1);
      } else if (data && data.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions);
        if (data.total) {
          setTotalPages(Math.ceil(data.total / itemsPerPage) || 1);
        }
      } else {
        setQuestions([]);
        setTotalPages(1);
      }
    } catch (error: any) {
      showError('Failed to load questions');
      console.error(error);
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

    if (searchQuery) {
      filtered = filtered.filter(q =>
        q.question_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.question_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.exam_names?.some(name => name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (filterDifficulty !== 'all') {
      const level = parseInt(filterDifficulty);
      filtered = filtered.filter(q => q.difficulty_level === level);
    }

    setFilteredQuestions(filtered);
  };

  const handleSubmit = async (formData: any) => {
    setLoading(true);
    try {
      if (editingQuestion) {
        await questionsAPI.update(editingQuestion._id || editingQuestion.id, formData);
        showSuccess('Question updated successfully!');
      } else {
        await questionsAPI.create(formData);
        showSuccess('Question created successfully!');
      }
      setShowForm(false);
      setEditingQuestion(null);
      setActiveTab('list');
      fetchQuestions();
    } catch (error: any) {
      showError(error.message || 'Failed to save question');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setShowForm(true);
    setActiveTab('add');
  };

  const handleDelete = async (questionId: string) => {
    const result = await showDeleteConfirm('this question');
    if (!result.isConfirmed) return;

    try {
      await questionsAPI.delete(questionId);
      showSuccess('Question deleted successfully!');
      fetchQuestions();
    } catch (error: any) {
      showError('Failed to delete question', error.message);
    }
  };

  const handleSelectQuestion = (id: string) => {
    setSelectedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedQuestions.size === filteredQuestions.length) {
      setSelectedQuestions(new Set());
    } else {
      const allIds = filteredQuestions.map(q => q._id || q.id).filter(Boolean) as string[];
      setSelectedQuestions(new Set(allIds));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedQuestions.size === 0) return;
    const result = await showDeleteConfirm(`${selectedQuestions.size} questions`);
    if (!result.isConfirmed) return;

    try {
      await questionsAPI.batchDelete(Array.from(selectedQuestions));
      showSuccess(`${selectedQuestions.size} questions deleted successfully!`);
      setSelectedQuestions(new Set());
      fetchQuestions();
    } catch (error: any) {
      showError('Failed to delete questions', error.message);
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header and one data row');
    }

    const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());
    const questions: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, '').trim());
      if (values.length < headers.length) continue;

      const question: any = {};
      headers.forEach((header, index) => {
        const value = values[index] || '';

        // Handle different field types
        if (header === 'difficulty_level') {
          question.difficulty_level = parseInt(value) || 5;
        } else if (header === 'correct_answer') {
          question.correct_answer = parseInt(value) || 0;
        } else if (header === 'time_duration') {
          question.time_duration = value ? parseInt(value) : null;
        } else if (header === 'exam_names') {
          question.exam_names = value ? value.split('|').map((n: string) => n.trim()).filter(Boolean) : [];
        } else if (header === 'category_ids' || header === 'subject_ids' || header === 'topic_ids') {
          question[header] = value ? value.split('|').map((id: string) => id.trim()).filter(Boolean) : [];
        } else {
          question[header] = value;
        }
      });

      // Validate required fields
      if (!question.question_text || !question.option_a || !question.option_b ||
        !question.option_c || !question.option_d || question.correct_answer === undefined) {
        console.warn(`Row ${i + 1} skipped: Missing required fields`);
        continue;
      }

      // Ensure correct_answer is valid (0-4)
      if (question.correct_answer < 0 || question.correct_answer > 4) {
        console.warn(`Row ${i + 1} skipped: Invalid correct_answer (must be 0-4)`);
        continue;
      }

      questions.push(question);
    }

    if (questions.length === 0) {
      throw new Error('No valid questions found after parsing. Please check your CSV format.');
    }

    return questions;
  };

  const handleBulkUpload = async (file: File, format: 'csv' | 'docx') => {
    setLoading(true);
    try {
      if (format === 'csv') {
        const text = await file.text();
        const questions = parseCSV(text);

        if (questions.length === 0) {
          showError('No valid questions found in the file');
          setLoading(false);
          return;
        }

        showInfo('Processing', `Processing ${questions.length} question(s)...`);

        // Use bulk API endpoint
        try {
          const response = await questionsAPI.bulkCreate(questions);

          if (response.created > 0) {
            showSuccess(`Successfully uploaded ${response.created} out of ${response.total} question(s)!`);

            // Show errors if any
            if (response.errors && response.errors.length > 0) {
              console.warn('Upload errors:', response.errors);
              showWarning('Upload Warning', `${response.errors.length} question(s) had errors. Check console for details.`);
            }

            // Refresh questions list
            await fetchQuestions();

            // Switch to list tab to see uploaded questions
            setActiveTab('list');
          } else {
            showError('No questions were uploaded. Please check the file format.');
          }
        } catch (error: any) {
          console.error('Bulk upload error:', error);
          showError('Failed to upload questions', error.message || 'Unknown error');
        }
      } else {
        showInfo('Coming Soon', 'DOCX format support coming soon. Please use CSV format for now.');
      }
    } catch (error: any) {
      showError('Failed to process file', error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getOptionLabel = (index: number) => {
    const labels = ['A', 'B', 'C', 'D', 'X'];
    return labels[index] || '?';
  };

  // Helper to check if an option is correct based on answer type
  const isOptionCorrect = (question: Question, optIdx: number): boolean => {
    if (question.answer_type === 'none') return false;
    if (question.answer_type === 'multiple' && question.correct_answers) {
      return question.correct_answers.includes(optIdx);
    }
    return question.correct_answer === optIdx;
  };

  const getDifficultyColor = (level?: number) => {
    if (!level) return 'bg-muted';
    if (level <= 3) return 'bg-green-500/10 text-green-600';
    if (level <= 6) return 'bg-yellow-500/10 text-yellow-600';
    return 'bg-red-500/10 text-red-600';
  };

  // Show full page loader on initial load
  if (loading && questions.length === 0) {
    return (
      <AdminLayout>
        <div className="p-3 sm:p-4 md:p-6">
          <Loader text="Loading questions..." />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">


        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full overflow-x-auto gap-1 sm:gap-2 rounded-xl sm:rounded-2xl border border-border/70 p-1 sm:p-1.5 scrollbar-hide">
            <TabsTrigger value="list" className="rounded-lg sm:rounded-xl text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap flex-shrink-0">
              All Questions
            </TabsTrigger>
            <TabsTrigger value="add" className="rounded-lg sm:rounded-xl text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap flex-shrink-0">
              Add Question
            </TabsTrigger>
            <TabsTrigger value="bulk" className="rounded-lg sm:rounded-xl text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap flex-shrink-0">
              Bulk Upload
            </TabsTrigger>
            <TabsTrigger value="generate" className="rounded-lg sm:rounded-xl text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap flex-shrink-0">
              Generate Samples
            </TabsTrigger>
            <TabsTrigger value="duplicates" className="rounded-lg sm:rounded-xl text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap flex-shrink-0">
              Duplicates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-3 sm:space-y-4">
            {/* Filters */}
            <Card className="rounded-xl sm:rounded-[1.5rem] border border-border/70 shadow-lg">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex-1">
                    <Label className="text-xs sm:text-sm">Search</Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by question text, reference, or exam name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 sm:pl-10 rounded-lg sm:rounded-xl text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="w-full sm:w-48">
                      <Label className="text-xs sm:text-sm">Difficulty Level</Label>
                      <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                        <SelectTrigger className="mt-1 rounded-lg sm:rounded-xl text-xs sm:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Levels</SelectItem>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                            <SelectItem key={level} value={level.toString()}>
                              Level {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {(searchQuery || filterDifficulty !== 'all') && (
                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg sm:rounded-xl text-xs sm:text-sm"
                          onClick={() => {
                            setSearchQuery('');
                            setFilterDifficulty('all');
                          }}
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Questions List */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={filteredQuestions.length > 0 && selectedQuestions.size === filteredQuestions.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all questions"
                  />
                  <h2 className="text-xs sm:text-sm md:text-base font-semibold uppercase tracking-wide text-muted-foreground">
                    Questions ({filteredQuestions.length})
                  </h2>
                </div>
                {selectedQuestions.size > 0 && (
                  <Button variant="destructive" size="sm" onClick={handleBatchDelete} className="text-xs sm:text-sm">
                    <Trash className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Delete ({selectedQuestions.size})
                  </Button>
                )}
              </div>

              {loading ? (
                <Card className="rounded-xl sm:rounded-[1.5rem] border border-border/70">
                  <CardContent className="py-8 sm:py-12 md:py-14">
                    <Loader text="Loading questions..." />
                  </CardContent>
                </Card>
              ) : filteredQuestions.length === 0 ? (
                <Card className="rounded-xl sm:rounded-[1.5rem] border border-border/70">
                  <CardContent className="py-8 sm:py-12 md:py-14 text-center text-xs sm:text-sm">
                    <div className="mb-2 sm:mb-3 text-3xl sm:text-4xl md:text-5xl">❓</div>
                    <p className="font-semibold text-sm sm:text-base">No questions found</p>
                    <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                      {searchQuery || filterDifficulty !== 'all'
                        ? 'Try adjusting your filters'
                        : 'Click "Add question" to create your first one.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredQuestions.map((question, idx) => {
                  const questionId = question._id || question.id || '';
                  const options = [
                    question.option_a,
                    question.option_b,
                    question.option_c,
                    question.option_d,
                    question.option_x,
                  ];
                  return (
                    <Card
                      key={questionId}
                      className={`rounded-xl sm:rounded-[1.5rem] border hover:-translate-y-0.5 hover:shadow-xl transition ${selectedQuestions.has(questionId) ? 'border-red-300 bg-red-50/30' : 'border-border/70'}`}
                    >
                      <CardContent className="p-3 sm:p-4 md:p-5 space-y-2 sm:space-y-3">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedQuestions.has(questionId)}
                            onCheckedChange={() => handleSelectQuestion(questionId)}
                            aria-label={`Select question ${idx + 1}`}
                          />
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                              <h3 className="font-semibold text-xs sm:text-sm md:text-base break-words flex-1 min-w-0">
                                Q{(currentPage - 1) * itemsPerPage + idx + 1}. {question.question_text}
                              </h3>
                              {question.difficulty_level && (
                                <Badge className={`rounded-full text-[10px] sm:text-xs flex-shrink-0 ${getDifficultyColor(question.difficulty_level)}`}>
                                  Level {question.difficulty_level}
                                </Badge>
                              )}
                              <Badge 
                                variant="outline" 
                                className={`rounded-full text-[10px] sm:text-xs flex-shrink-0 ${
                                  question.answer_type === 'multiple' 
                                    ? 'border-blue-400 text-blue-600 bg-blue-50' 
                                    : question.answer_type === 'none'
                                      ? 'border-gray-400 text-gray-600 bg-gray-50'
                                      : 'border-green-400 text-green-600 bg-green-50'
                                }`}
                              >
                                {question.answer_type === 'multiple' 
                                  ? 'Multi Answer' 
                                  : question.answer_type === 'none' 
                                    ? 'No Answer' 
                                    : 'Single Answer'}
                              </Badge>
                            </div>
                            {question.question_text_hindi && (
                              <p className="text-xs sm:text-sm text-muted-foreground mb-2 break-words">
                                (Hindi) {question.question_text_hindi}
                              </p>
                            )}
                            {question.exam_names && question.exam_names.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
                                {question.exam_names.map((name, i) => (
                                  <Badge key={i} variant="secondary" className="rounded-full text-[10px] sm:text-xs">
                                    {name}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {question.question_reference && (
                              <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
                                Reference: {question.question_reference}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-lg sm:rounded-xl h-8 w-8 sm:h-9 sm:w-9 p-0"
                                  onClick={() => setViewingQuestion(question)}
                                >
                                  <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
                                <DialogHeader>
                                  <DialogTitle className="text-sm sm:text-base">Question Details</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-3 sm:space-y-4">
                                  <div>
                                    <Label className="text-[10px] sm:text-xs text-muted-foreground">Question</Label>
                                    <p className="font-medium text-xs sm:text-sm break-words">{question.question_text}</p>
                                    {question.question_text_hindi && (
                                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                                        (Hindi) {question.question_text_hindi}
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <Label className="text-[10px] sm:text-xs text-muted-foreground">Options</Label>
                                    <div className="space-y-2 mt-2">
                                      {options.map((opt, optIdx) => (
                                        opt && (
                                          <div
                                            key={optIdx}
                                            className={`rounded-lg sm:rounded-xl border px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm break-words ${isOptionCorrect(question, optIdx)
                                                ? 'border-success bg-success/10'
                                                : 'border-border bg-muted/60'
                                              }`}
                                          >
                                            <span className="font-semibold mr-1 sm:mr-2">
                                              {getOptionLabel(optIdx)}.
                                            </span>
                                            {opt}
                                            {isOptionCorrect(question, optIdx) && (
                                              <span className="ml-1 sm:ml-2 text-success font-semibold text-[10px] sm:text-xs">
                                                ✓ {question.answer_type === 'multiple' ? 'Correct' : 'Correct'}
                                              </span>
                                            )}
                                            {optIdx === 4 && (
                                              <Badge variant="outline" className="ml-1 sm:ml-2 text-[10px] sm:text-xs">Hidden</Badge>
                                            )}
                                          </div>
                                        )
                                      ))}
                                    </div>
                                  </div>
                                  {question.hint && (
                                    <div>
                                      <Label className="text-[10px] sm:text-xs text-muted-foreground">Hint</Label>
                                      <p className="text-xs sm:text-sm break-words">{question.hint}</p>
                                    </div>
                                  )}
                                  {question.explanation && (
                                    <div>
                                      <Label className="text-[10px] sm:text-xs text-muted-foreground">Explanation</Label>
                                      <p className="text-xs sm:text-sm break-words">{question.explanation}</p>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg sm:rounded-xl h-8 w-8 sm:h-9 sm:w-9 p-0"
                              onClick={() => handleEdit(question)}
                            >
                              <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg sm:rounded-xl border-destructive/40 text-destructive h-8 w-8 sm:h-9 sm:w-9 p-0"
                              onClick={() => handleDelete((question._id || question.id) as string)}
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1.5 sm:space-y-2">
                          {options.slice(0, 4).map((option, optIdx) => (
                            option && (
                              <div
                                key={optIdx}
                                className={`rounded-lg sm:rounded-xl border px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm break-words ${isOptionCorrect(question, optIdx)
                                    ? 'border-success bg-success/10'
                                    : 'border-border bg-muted/60'
                                  }`}
                              >
                                <span className="font-semibold mr-1 sm:mr-2">{getOptionLabel(optIdx)}.</span>
                                {option}
                                {isOptionCorrect(question, optIdx) && (
                                  <span className="ml-1 sm:ml-2 text-success font-semibold text-[10px] sm:text-xs">✓</span>
                                )}
                              </div>
                            )
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
              {filteredQuestions.length > 0 && totalPages > 1 && (
                <div className="pt-4">
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    {editingQuestion ? 'Edit Question' : 'Add New Question'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {editingQuestion ? 'Update the question details' : 'Create a new question with options, hints, and explanations'}
                  </p>
                </div>
              </div>
              <QuestionForm
                key={editingQuestion?._id || 'new'}
                initialData={questionFormInitialData}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingQuestion(null);
                  setActiveTab('list');
                }}
                loading={loading}
              />
            </div>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4">
            <BulkUpload onUpload={handleBulkUpload} />
          </TabsContent>

          <TabsContent value="generate" className="space-y-4">
            <div className="space-y-6">
              <BulkDataGenerator />
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Or Generate for Specific Topic</h3>
                <GenerateSampleQuestions onComplete={() => {
                  fetchQuestions();
                  setActiveTab('list');
                }} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="duplicates" className="space-y-4">
            <DuplicateDetector />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Questions;
