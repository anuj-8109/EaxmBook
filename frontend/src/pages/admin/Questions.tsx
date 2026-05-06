import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Plus, Pencil, Trash2, Eye, Upload, Search, Filter, X, Trash, Download, Rocket, Tags, HelpCircle, FolderTree, BookOpen, Tag, RotateCcw, Check, ChevronsUpDown, CheckCircle2, Globe, Star } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { showError, showSuccess, showWarning, showInfo, showDeleteConfirm } from '@/lib/sweetalert';
import { questionsAPI, tagsAPI, categoriesAPI, subjectsAPI, topicsAPI } from '@/lib/api';
import * as mammoth from 'mammoth';
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
  category_id?: any;
  subject_id?: any;
  topic_id?: any;
  question_image_url?: string;
  question_video_url?: string;
  option_a_image_url?: string;
  option_b_image_url?: string;
  option_c_image_url?: string;
  option_d_image_url?: string;
  option_x_image_url?: string;
  hint_image_url?: string;
  explanation_image_url?: string;
}

const Questions = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulties, setFilterDifficulties] = useState<string[]>([]);
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [filterExamNames, setFilterExamNames] = useState<string[]>([]);
  const [filterSubjects, setFilterSubjects] = useState<string[]>([]);
  const [filterTopics, setFilterTopics] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('list');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState(0);

  // Multi-select states
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());

  // Quick Add states
  const [quickAddEnglish, setQuickAddEnglish] = useState('');
  const [quickAddHindi, setQuickAddHindi] = useState('');
  const [quickAddCategory, setQuickAddCategory] = useState('');
  const [quickAddSubject, setQuickAddSubject] = useState('');
  const [quickAddTopic, setQuickAddTopic] = useState('');
  const [quickAddDifficulty, setQuickAddDifficulty] = useState('5');
  const [quickAddTime, setQuickAddTime] = useState('60');
  const [quickAddSource, setQuickAddSource] = useState('');
  const [quickAddTags, setQuickAddTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);

  // Add Tags to Selected modal
  const [showAddTagsModal, setShowAddTagsModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [selectedTagsToAdd, setSelectedTagsToAdd] = useState<string[]>([]);

  // View Question modal enhanced
  const [viewingQuestionDetails, setViewingQuestionDetails] = useState<Question | null>(null);

  // Quick Assign states
  const [quickAssignTarget, setQuickAssignTarget] = useState<{ question: Question, type: 'exam' | 'subject' | 'topic', isBatch?: boolean } | null>(null);
  const [assignSearchQuery, setAssignSearchQuery] = useState('');

  // Search states for comboboxes
  const [openExamSearch, setOpenExamSearch] = useState(false);
  const [openSubjectSearch, setOpenSubjectSearch] = useState(false);
  const [openTopicSearch, setOpenTopicSearch] = useState(false);

  // Memoize initialData to prevent unnecessary re-renders of QuestionForm
  const questionFormInitialData = useMemo(() => {
    if (!editingQuestion) return undefined;

    console.log('DEBUG: RAW editingQuestion for memo:', editingQuestion);

    // Helper to extract ID as string from various possible field formats
    const extractId = (item: any) => {
      if (!item) return null;
      if (typeof item === 'string') return item;
      return item._id || item.id || null;
    };

    // Helper to extract name from various possible field formats
    const extractName = (item: any) => {
      if (!item || typeof item === 'string') return null;
      return item.name || null;
    };

    // Extract category IDs and names (merging singular and plural fields)
    const allCategoryItems = [
      ...(Array.isArray(editingQuestion.category_ids) ? editingQuestion.category_ids : []),
      ...(editingQuestion.category_id ? [editingQuestion.category_id] : [])
    ];
    const categoryIds = Array.from(new Set(allCategoryItems.map(extractId).filter(Boolean))) as string[];
    const categoryNames = allCategoryItems.map(extractName).filter(Boolean) as string[];

    // Extract subject IDs and names (merging singular and plural fields)
    const allSubjectItems = [
      ...(Array.isArray(editingQuestion.subject_ids) ? editingQuestion.subject_ids : []),
      ...(editingQuestion.subject_id ? [editingQuestion.subject_id] : [])
    ];
    const subjectIds = Array.from(new Set(allSubjectItems.map(extractId).filter(Boolean))) as string[];
    const subjectNames = allSubjectItems.map(extractName).filter(Boolean) as string[];

    // Extract topic IDs and names (merging singular and plural fields)
    const allTopicItems = [
      ...(Array.isArray(editingQuestion.topic_ids) ? editingQuestion.topic_ids : []),
      ...(editingQuestion.topic_id ? [editingQuestion.topic_id] : [])
    ];
    const topicIds = Array.from(new Set(allTopicItems.map(extractId).filter(Boolean))) as string[];
    const topicNames = allTopicItems.map(extractName).filter(Boolean) as string[];

    return {
      _id: editingQuestion._id,
      exam_names: editingQuestion.exam_names || [],
      category_ids: categoryIds,
      subject_ids: subjectIds,
      topic_ids: topicIds,
      category_id: categoryIds[0] || null,
      subject_id: subjectIds[0] || null,
      topic_id: topicIds[0] || null,
      category_names: categoryNames,
      subject_names: subjectNames,
      topic_names: topicNames,
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
      question_image_url: editingQuestion.question_image_url || '',
      question_video_url: editingQuestion.question_video_url || '',
      option_a_image_url: editingQuestion.option_a_image_url || '',
      option_b_image_url: editingQuestion.option_b_image_url || '',
      option_c_image_url: editingQuestion.option_c_image_url || '',
      option_d_image_url: editingQuestion.option_d_image_url || '',
      option_x_image_url: editingQuestion.option_x_image_url || '',
      hint_image_url: editingQuestion.hint_image_url || '',
      explanation_image_url: editingQuestion.explanation_image_url || '',
    };
  }, [editingQuestion]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterDifficulties, filterExamNames, filterSubjects, filterTopics, languageFilter]);

  useEffect(() => {
    fetchQuestions();
  }, [currentPage, itemsPerPage, filterDifficulties, filterExamNames, filterSubjects, filterTopics, languageFilter]);

  useEffect(() => {
    fetchCategoriesAndTags();
  }, []);

  const fetchCategoriesAndTags = async () => {
    try {
      const [categoriesData, tagsData, subjectsData, topicsData] = await Promise.all([
        categoriesAPI.getAll(true),
        tagsAPI.getAll(),
        subjectsAPI.getAll(undefined, 1, 1000),
        topicsAPI.getAll(undefined, 1, 1000)
      ]);

      // Normalize data structure
      const normalizedCats = categoriesData?.categories || categoriesData?.data || categoriesData || [];
      const normalizedTags = tagsData?.data || tagsData || [];
      const normalizedSubs = subjectsData?.subjects || subjectsData?.data || subjectsData || [];
      const normalizedTops = topicsData?.topics || topicsData?.data || topicsData || [];

      setCategories(normalizedCats);
      setTags(normalizedTags);
      setSubjects(normalizedSubs);
      setTopics(normalizedTops);
    } catch (error) {
      console.error('Failed to load filter data:', error);
    }
  };

  useEffect(() => {
    filterQuestions();
  }, [questions, searchQuery, filterDifficulties, filterExamNames, filterSubjects, filterTopics, languageFilter]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params: any = { page: currentPage, limit: itemsPerPage };
      const data = await questionsAPI.getAll(params);
      // Handle paginated response: {questions: [...], total: 75, page: 1, limit: 50}
      // or direct array response
      if (data && Array.isArray(data)) {
        setQuestions(data);
        setTotalPages(1);
        setTotalQuestionsCount(data.length);
      } else if (data && data.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions);
        if (data.total) {
          setTotalQuestionsCount(data.total);
          setTotalPages(Math.ceil(data.total / itemsPerPage) || 1);
        }
      } else {
        setQuestions([]);
        setTotalPages(1);
        setTotalQuestionsCount(0);
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

    if (filterDifficulties.length > 0) {
      filtered = filtered.filter(q => filterDifficulties.includes(q.difficulty_level.toString()));
    }

    if (filterExamNames.length > 0) {
      filtered = filtered.filter(q =>
        q.exam_names?.some(name => filterExamNames.includes(name))
      );
    }

    if (filterSubjects.length > 0) {
      filtered = filtered.filter(q => {
        const questionSubs = (Array.isArray(q.subject_ids) ? q.subject_ids : (q.subject_id ? [q.subject_id] : []))
          .map((s: any) => typeof s === 'string' ? s : (s.name || s.subject_name || s));
        return questionSubs.some(s => filterSubjects.includes(s));
      });
    }

    if (filterTopics.length > 0) {
      filtered = filtered.filter(q => {
        const questionTops = (Array.isArray(q.topic_ids) ? q.topic_ids : (q.topic_id ? [q.topic_id] : []))
          .map((t: any) => typeof t === 'string' ? t : (t.name || t.topic_name || t));
        return questionTops.some(t => filterTopics.includes(t));
      });
    }

    if (languageFilter !== 'all') {
      filtered = filtered.filter(q => {
        if (languageFilter === 'Hindi') return !!q.question_text_hindi;
        if (languageFilter === 'English') return !!q.question_text && !q.question_text_hindi;
        return true;
      });
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
    const questionId = question._id || (question as any).id;
    if (questionId) {
      navigate(`/admin/questions/edit/${questionId}`);
    } else {
      showError('Cannot edit this question', 'Invalid Question ID');
    }
  };

  const handleQuickAssign = async (itemId: string, itemName: string) => {
    if (!quickAssignTarget) return;
    const { question, type, isBatch } = quickAssignTarget;

    if (isBatch && selectedQuestions.size > 0) {
      setLoading(true);
      try {
        const selectedIdsArray = Array.from(selectedQuestions);
        // Find all selected question objects from our state
        const questionsToUpdate = questions.filter(q => selectedIdsArray.includes(q._id || (q as any).id));
        
        let successCount = 0;
        for (const q of questionsToUpdate) {
          const qId = q._id || (q as any).id;
          if (!qId) continue;

          let updateData: any = {};
          if (type === 'exam') {
            const currentExams = q.exam_names || [];
            if (!currentExams.includes(itemName)) {
              updateData.exam_names = [...currentExams, itemName];
            } else {
              continue; // Skip if already assigned
            }
          } else if (type === 'subject') {
            const currentSubs = Array.isArray(q.subject_ids) ? q.subject_ids : (q.subject_id ? [q.subject_id] : []);
            const currentIds = currentSubs.map((s: any) => typeof s === 'string' ? s : (s._id || s.id));
            if (!currentIds.includes(itemId)) {
              updateData.subject_ids = [...currentIds, itemId];
            } else {
              continue;
            }
          } else if (type === 'topic') {
            const currentTops = Array.isArray(q.topic_ids) ? q.topic_ids : (q.topic_id ? [q.topic_id] : []);
            const currentIds = currentTops.map((t: any) => typeof t === 'string' ? t : (t._id || t.id));
            if (!currentIds.includes(itemId)) {
              updateData.topic_ids = [...currentIds, itemId];
            } else {
              continue;
            }
          }

          if (Object.keys(updateData).length > 0) {
            await questionsAPI.update(qId, updateData);
            successCount++;
          }
        }

        showSuccess(`Successfully updated ${successCount} questions`);
        setQuickAssignTarget(null);
        setSelectedQuestions(new Set());
        fetchQuestions();
      } catch (error: any) {
        showError(error.message || 'Failed to update questions');
      } finally {
        setLoading(false);
      }
      return;
    }

    const qId = question._id || (question as any).id;
    if (!qId) {
      showError('Invalid Question ID', 'Could not identify the question to update.');
      return;
    }

    setLoading(true);
    try {
      let updateData: any = {};

      if (type === 'exam') {
        const currentExams = question.exam_names || [];
        if (currentExams.includes(itemName)) {
          showWarning('Already assigned to this exam');
          setLoading(false);
          return;
        }
        updateData.exam_names = [...currentExams, itemName];
      } else if (type === 'subject') {
        const currentSubs = Array.isArray(question.subject_ids) ? question.subject_ids : (question.subject_id ? [question.subject_id] : []);
        const currentIds = currentSubs.map((s: any) => typeof s === 'string' ? s : (s._id || s.id));
        if (currentIds.includes(itemId)) {
          showWarning('Already assigned to this subject');
          setLoading(false);
          return;
        }
        updateData.subject_ids = [...currentIds, itemId];
      } else if (type === 'topic') {
        const currentTops = Array.isArray(question.topic_ids) ? question.topic_ids : (question.topic_id ? [question.topic_id] : []);
        const currentIds = currentTops.map((t: any) => typeof t === 'string' ? t : (t._id || t.id));
        if (currentIds.includes(itemId)) {
          showWarning('Already assigned to this topic');
          setLoading(false);
          return;
        }
        updateData.topic_ids = [...currentIds, itemId];
      }

      await questionsAPI.update(qId, updateData);
      showSuccess(`Successfully added ${type}`);
      setQuickAssignTarget(null);
      fetchQuestions();
    } catch (error: any) {
      showError(error.message || 'Failed to update assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (question: Question, type: 'exam' | 'subject' | 'topic', itemIdOrName: string) => {
    const qId = question._id || (question as any).id;
    if (!qId) {
      showError('Invalid Question ID', 'Could not identify the question to update.');
      return;
    }

    const result = await showDeleteConfirm(`this ${type} assignment`);
    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      let updateData: any = {};

      if (type === 'exam') {
        updateData.exam_names = (question.exam_names || []).filter(n => n !== itemIdOrName);
      } else if (type === 'subject') {
        const currentSubs = Array.isArray(question.subject_ids) ? question.subject_ids : (question.subject_id ? [question.subject_id] : []);
        updateData.subject_ids = currentSubs.map((s: any) => typeof s === 'string' ? s : (s._id || s.id)).filter((id: string) => id !== itemIdOrName);
      } else if (type === 'topic') {
        const currentTops = Array.isArray(question.topic_ids) ? question.topic_ids : (question.topic_id ? [question.topic_id] : []);
        updateData.topic_ids = currentTops.map((t: any) => typeof t === 'string' ? t : (t._id || t.id)).filter((id: string) => id !== itemIdOrName);
      }

      await questionsAPI.update(qId, updateData);
      showSuccess(`Removed ${type} assignment`);
      fetchQuestions();
    } catch (error: any) {
      showError(error.message || 'Failed to remove assignment');
    } finally {
      setLoading(false);
    }
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

  // Download CSV Template
  const handleDownloadTemplate = () => {
    const headers = [
      'question_text', 'question_text_hindi',
      'option_a', 'option_a_hindi',
      'option_b', 'option_b_hindi',
      'option_c', 'option_c_hindi',
      'option_d', 'option_d_hindi',
      'option_x', 'option_x_hindi',
      'correct_answer', 'answer_type', 'difficulty_level', 'time_duration',
      'question_reference', 'exam_names', 'category_ids', 'subject_ids', 'topic_ids',
      'hint', 'hint_hindi', 'explanation', 'explanation_hindi'
    ];
    const sampleRow = [
      'What is the capital of India?', 'भारत की राजधानी क्या है?',
      'Delhi', 'दिल्ली',
      'Mumbai', 'मुंबई',
      'Kolkata', 'कोलकाता',
      'Chennai', 'चेन्नई',
      'None', 'कोई नहीं',
      '0', 'single', '5', '60', 'Sample Reference', 'SSC|UPSC',
      'cat_id', 'sub_id', 'topic_id',
      'It is in North India', 'यह उत्तर भारत में है',
      'New Delhi became the capital in 1911', 'नई दिल्ली 1911 में राजधानी बनी'
    ];
    const csvContent = [headers.join(','), sampleRow.map(v => `"${v}"`).join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'bilingual_questions_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess('Bilingual template downloaded!');
  };


  // Parse Quick Add text format
  const parseQuickAddText = (text: string) => {
    const questions: any[] = [];
    // Split by [Q] marker
    const blocks = text.split(/\[Q\]/i).filter(b => b.trim());

    for (const block of blocks) {
      if (!block.trim()) continue;

      const data: any = {
        question: '',
        options: { a: '', b: '', c: '', d: '' },
        answer: '',
        solution: '',
        difficulty: null
      };

      // Extract Difficulty Level [LVL] number
      const lvlMatch = block.match(/\[LVL\]\s*(\d+)/is);
      if (lvlMatch) data.difficulty = parseInt(lvlMatch[1]);

      // Extract Question (everything before (a) or [ANS] or [LVL])
      const qMatch = block.match(/(.*?)((?:\(a\))|\[LVL\]|\[ANS\])/is);
      if (qMatch) data.question = qMatch[1].trim();

      // Extract Options (a), (b), (c), (d)
      const optMatches = [...block.matchAll(/\(([a-d])\)\s*(.*?)(?=\s*\([a-d]\)|\s*\[ANS\]|\s*\[SOL\]|$)/gis)];
      for (const match of optMatches) {
        data.options[match[1].toLowerCase()] = match[2].trim();
      }

      // Extract Answer [ANS]
      const ansMatch = block.match(/\[ANS\]\s*(.*?)(?=\s*\[SOL\]|$)/is);
      if (ansMatch) data.answer = ansMatch[1].trim().toLowerCase();

      // Extract Solution [SOL]
      const solMatch = block.match(/\[SOL\]\s*(.*)/is);
      if (solMatch) data.solution = solMatch[1].trim();

      if (data.question && data.answer) {
        questions.push(data);
      }
    }
    return questions;
  };

  // Handle Quick Add Submit
  const handleQuickAddSubmit = async () => {
    const hasEnglish = quickAddEnglish.trim().length > 0;
    const hasHindi = quickAddHindi.trim().length > 0;

    if (!hasEnglish && !hasHindi) {
      showError('Please provide at least English or Hindi question text.');
      return;
    }

    const enQuestions = hasEnglish ? parseQuickAddText('[Q]' + quickAddEnglish) : [];
    const hiQuestions = hasHindi ? parseQuickAddText('[Q]' + quickAddHindi) : [];

    // Validation for bilingual consistency ONLY if both are provided
    if (hasEnglish && hasHindi && enQuestions.length !== hiQuestions.length) {
      showError(`Parsing Error: The number of questions do not match. Found ${enQuestions.length} English questions and ${hiQuestions.length} Hindi questions.`);
      return;
    }

    const questionCount = Math.max(enQuestions.length, hiQuestions.length);
    if (questionCount === 0) {
      showError('No valid questions found. Please check your format (e.g., [Q] question... (a) option...)');
      return;
    }

    setLoading(true);
    try {
      const questionsToCreate = [];

      for (let i = 0; i < questionCount; i++) {
        const qEn = enQuestions[i] || { options: {}, question: '', answer: '', solution: '', difficulty: null };
        const qHi = hiQuestions[i] || { options: {}, question: '', answer: '', solution: '', difficulty: null };

        const difficulty = qEn.difficulty || qHi.difficulty || parseInt(quickAddDifficulty) || 5;
        const answerMap: { [key: string]: number } = { a: 0, b: 1, c: 2, d: 3 };
        const rawAns = qEn.answer || qHi.answer || 'a';

        questionsToCreate.push({
          question_text: qEn.question || qHi.question || '', // Fallback to other language if one is missing
          question_text_hindi: qHi.question || '',
          option_a: qEn.options.a || qHi.options.a || '',
          option_a_hindi: qHi.options.a || '',
          option_b: qEn.options.b || qHi.options.b || '',
          option_b_hindi: qHi.options.b || '',
          option_c: qEn.options.c || qHi.options.c || '',
          option_c_hindi: qHi.options.c || '',
          option_d: qEn.options.d || qHi.options.d || '',
          option_d_hindi: qHi.options.d || '',
          correct_answer: answerMap[rawAns] ?? 0,
          answer_type: 'single',
          difficulty_level: difficulty,
          time_duration: parseInt(quickAddTime) || 60,
          question_reference: quickAddSource,
          category_ids: quickAddCategory ? [quickAddCategory] : [],
          subject_ids: quickAddSubject ? [quickAddSubject] : [],
          topic_ids: quickAddTopic ? [quickAddTopic] : [],
          explanation: qEn.solution || qHi.solution || '',
          explanation_hindi: qHi.solution || '',
          tags: quickAddTags
        });
      }

      const response = await questionsAPI.bulkCreate(questionsToCreate);
      if (response.created > 0) {
        showSuccess(`${response.created} questions added successfully!`);
        setQuickAddEnglish('');
        setQuickAddHindi('');
        setQuickAddSource('');
        setQuickAddTags([]);
        fetchQuestions();
        setActiveTab('list');
      } else {
        showError('No questions were added. Please check your format.');
      }
    } catch (error: any) {
      showError('Failed to add questions', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Add Tags to Selected Questions
  const handleAddTagsToSelected = async () => {
    if (selectedQuestions.size === 0) {
      showError('Please select at least one question.');
      return;
    }
    if (selectedTagsToAdd.length === 0) {
      showError('Please select at least one tag to add.');
      return;
    }

    setLoading(true);
    try {
      await tagsAPI.addToQuestions(Array.from(selectedQuestions), selectedTagsToAdd);
      showSuccess(`Tags added to ${selectedQuestions.size} questions successfully!`);
      setShowAddTagsModal(false);
      setSelectedTagsToAdd([]);
      setSelectedQuestions(new Set());
      fetchQuestions();
    } catch (error: any) {
      showError('Failed to add tags', error.message);
    } finally {
      setLoading(false);
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

  // Parse DOCX file for bulk upload fallback
  const parseDocxFallback = async (arrayBuffer: ArrayBuffer): Promise<any[]> => {
    const questions: any[] = [];

    try {
      // Try HTML conversion for table parsing
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const tables = doc.querySelectorAll('table');

      let questionsTable: HTMLTableElement | null = null;

      // Find the questions table
      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        const firstRow = table.querySelector('tr');
        if (firstRow) {
          const text = firstRow.textContent?.toLowerCase() || '';
          if (text.includes('question') || text.includes('difficulty') ||
            text.includes('option') || text.includes('answer')) {
            questionsTable = table;
            break;
          }
        }
      }

      // Use largest table if no specific table found
      if (!questionsTable && tables.length > 0) {
        let maxRows = 0;
        for (const table of Array.from(tables)) {
          const rowCount = table.querySelectorAll('tr').length;
          if (rowCount > maxRows) {
            maxRows = rowCount;
            questionsTable = table;
          }
        }
      }

      // Parse table
      if (questionsTable) {
        const rows = Array.from(questionsTable.querySelectorAll('tr'));
        if (rows.length >= 2) {
          const headerCells = Array.from(rows[0].querySelectorAll('td, th'));
          const headers = headerCells.map(th => {

            let text = th.textContent?.trim().toLowerCase() || '';
            if (text.includes('difficulty')) return 'difficulty_level';
            if (text.includes('hindi') && text.includes('question')) return 'question_text_hindi';
            if (text.includes('hindi') && text.includes('a')) return 'option_a_hindi';
            if (text.includes('hindi') && text.includes('b')) return 'option_b_hindi';
            if (text.includes('hindi') && text.includes('c')) return 'option_c_hindi';
            if (text.includes('hindi') && text.includes('d')) return 'option_d_hindi';
            if (text.includes('hindi') && text.includes('hint')) return 'hint_hindi';
            if (text.includes('hindi') && text.includes('explanation')) return 'explanation_hindi';
            if (text.includes('hindi') && text.includes('solution')) return 'explanation_hindi';

            if (text === 'question' || text.includes('question')) return 'question_text';
            if (text.includes('option a') || (text.includes('option') && text.includes('a'))) return 'option_a';
            if (text.includes('option b') || (text.includes('option') && text.includes('b'))) return 'option_b';
            if (text.includes('option c') || (text.includes('option') && text.includes('c'))) return 'option_c';
            if (text.includes('option d') || (text.includes('option') && text.includes('d'))) return 'option_d';
            if (text.includes('answer') || text.includes('correct')) return 'correct_answer';
            if (text.includes('explanation') || text.includes('solution')) return 'explanation';
            if (text.includes('hint')) return 'hint';
            if (text.includes('exam')) return 'exam_names';
            if (text.includes('reference')) return 'question_reference';
            return text.replace(/\s+/g, '_');
          });


          for (let i = 1; i < rows.length; i++) {
            const cells = Array.from(rows[i].querySelectorAll('td, th'));
            if (cells.length < 3) continue;

            const question: any = { difficulty_level: 5, correct_answer: 0 };

            headers.forEach((header, index) => {
              const value = cells[index]?.textContent?.trim() || '';
              if (!value) return;

              if (header === 'difficulty_level') {
                const parsed = parseInt(value);
                question.difficulty_level = !isNaN(parsed) && parsed >= 1 && parsed <= 10 ? parsed : 5;
              } else if (header === 'correct_answer') {
                const strVal = value.toUpperCase().trim();
                if (strVal.startsWith('A') || strVal === '0') question.correct_answer = 0;
                else if (strVal.startsWith('B') || strVal === '1') question.correct_answer = 1;
                else if (strVal.startsWith('C') || strVal === '2') question.correct_answer = 2;
                else if (strVal.startsWith('D') || strVal === '3') question.correct_answer = 3;
                else {
                  const match = strVal.match(/\d/);
                  if (match) {
                    const num = parseInt(match[0]);
                    if (num >= 0 && num <= 4) question.correct_answer = num;
                  }
                }
              } else {
                question[header] = value;
              }
            });

            if (question.question_text && question.option_a && question.option_b) {
              if (!question.option_c) question.option_c = 'None';
              if (!question.option_d) question.option_d = 'None';
              if (question.correct_answer >= 0 && question.correct_answer <= 4) {
                questions.push(question);
              }
            }
          }
        }
      }

      // Fallback: Parse as raw text
      if (questions.length === 0) {
        const textResult = await mammoth.extractRawText({ arrayBuffer });
        const text = textResult.value;
        const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);

        let currentQuestion: any = null;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const lowerLine = line.toLowerCase();

          // Match question patterns
          const qMatch = line.match(/^(?:q(?:uestion)?\s*\d*[\.\:\-\)]\s*|\d+[\.\:\)\-\]]\s*)(.+)/i);
          const qWordMatch = line.match(/^question[\s\d\.\:\-]+(.+)/i);

          if (qMatch || qWordMatch) {
            if (currentQuestion && currentQuestion.question_text && currentQuestion.option_a) {
              if (!currentQuestion.option_c) currentQuestion.option_c = 'None';
              if (!currentQuestion.option_d) currentQuestion.option_d = 'None';
              questions.push({ ...currentQuestion });
            }

            const questionText = (qMatch?.[1] || qWordMatch?.[1] || line).trim();
            currentQuestion = {
              difficulty_level: 5,
              question_text: questionText,
              correct_answer: 0
            };
            continue;
          }

          if (!currentQuestion) continue;

          // Match options
          const optionAMatch = line.match(/^(?:a|option\s*a)[\.\)\-\:]\s*(.+)/i);
          const optionBMatch = line.match(/^(?:b|option\s*b)[\.\)\-\:]\s*(.+)/i);
          const optionCMatch = line.match(/^(?:c|option\s*c)[\.\)\-\:]\s*(.+)/i);
          const optionDMatch = line.match(/^(?:d|option\s*d)[\.\)\-\:]\s*(.+)/i);

          if (optionAMatch) currentQuestion.option_a = optionAMatch[1].trim();
          else if (optionBMatch) currentQuestion.option_b = optionBMatch[1].trim();
          else if (optionCMatch) currentQuestion.option_c = optionCMatch[1].trim();
          else if (optionDMatch) currentQuestion.option_d = optionDMatch[1].trim();
          else if (lowerLine.match(/^(?:ans(?:wer)?|correct)/)) {
            const ansStr = line.replace(/^(?:ans(?:wer)?|correct)[\s\:\-\=]+/i, '').trim().toUpperCase();
            if (ansStr.startsWith('A')) currentQuestion.correct_answer = 0;
            else if (ansStr.startsWith('B')) currentQuestion.correct_answer = 1;
            else if (ansStr.startsWith('C')) currentQuestion.correct_answer = 2;
            else if (ansStr.startsWith('D')) currentQuestion.correct_answer = 3;
          } else if (!currentQuestion.option_a) {
            currentQuestion.question_text += ' ' + line;
          }
        }

        if (currentQuestion && currentQuestion.question_text && currentQuestion.option_a) {
          if (!currentQuestion.option_c) currentQuestion.option_c = 'None';
          if (!currentQuestion.option_d) currentQuestion.option_d = 'None';
          questions.push({ ...currentQuestion });
        }
      }
    } catch (error) {
      console.error('Error parsing DOCX fallback:', error);
    }

    return questions;
  };

  const handleBulkUpload = async (file: File, format: 'csv' | 'docx', parsedQuestions?: any[]) => {
    setLoading(true);
    try {
      let questions = parsedQuestions || [];

      if (!questions || questions.length === 0) {
        if (format === 'csv') {
          const text = await file.text();
          questions = parseCSV(text);
        } else {
          // Parse DOCX file
          const arrayBuffer = await file.arrayBuffer();
          questions = await parseDocxFallback(arrayBuffer);
        }
      }

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
        <AdminPageHeading
          title={
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <HelpCircle className="h-6 w-6" />
              </div>
              <span>Question Manager</span>
            </div>
          }
          description="Manage and organize your question database"
          eyebrow="Content Management"
          action={
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setActiveTab('add')}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs h-8 px-3"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Question
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
                className="border-blue-400 text-blue-600 hover:bg-blue-50 rounded-md text-xs h-8 px-3"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                Export
              </Button>
              <Button
                onClick={() => setShowBulkUploadModal(true)}
                className="bg-[#2eb872] hover:bg-[#239e5f] text-white rounded-md text-xs h-8 px-3"
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                Bulk Add
              </Button>
              <Button
                variant="destructive"
                onClick={() => setActiveTab('duplicates')}
                className="bg-[#e63946] hover:bg-[#d62828] text-white rounded-md text-xs h-8 px-3"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete Duplicates
              </Button>
            </div>
          }
        />



        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full overflow-x-auto gap-1 sm:gap-2 rounded-xl sm:rounded-2xl border border-border/70 p-1 sm:p-1.5 scrollbar-hide">
            <TabsTrigger value="list" className="rounded-lg sm:rounded-xl text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap flex-shrink-0">
              All Questions
            </TabsTrigger>
            <TabsTrigger value="add" className="rounded-lg sm:rounded-xl text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap flex-shrink-0">
              Add Question
            </TabsTrigger>
            <TabsTrigger value="quick" className="rounded-lg sm:rounded-xl text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap flex-shrink-0">
              Quick Add
            </TabsTrigger>
            <TabsTrigger value="bulk" className="rounded-lg sm:rounded-xl text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap flex-shrink-0">
              Bulk Upload
            </TabsTrigger>
            {/* <TabsTrigger value="generate" className="rounded-lg sm:rounded-xl text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap flex-shrink-0">
              Generate Samples
            </TabsTrigger>
            <TabsTrigger value="duplicates" className="rounded-lg sm:rounded-xl text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap flex-shrink-0">
              Duplicates
            </TabsTrigger> */}
          </TabsList>

          <TabsContent value="list" className="space-y-3 sm:space-y-4">
            {/* Filters */}
            {/* Modernized Filters Section */}
            <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden transition-all hover:shadow-md">
              <div className="bg-gray-50/50 border-b border-gray-100 px-5 py-3 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5" />
                  Filter Questions
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="xs"
                    className="h-7 px-2 text-[10px] font-bold text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterDifficulties([]);
                      setLanguageFilter('all');
                      setFilterExamNames([]);
                      setFilterSubjects([]);
                      setFilterTopics([]);
                      setCurrentPage(1);
                    }}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset All
                  </Button>
                </div>
              </div>
              <CardContent className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                  {/* Search Field */}
                  <div className="xl:col-span-2">
                    <Label className="text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-1.5 ml-1">
                      <Search className="h-3 w-3 text-indigo-500" /> Search Content
                    </Label>
                    <div className="relative group">
                      <Input
                        placeholder="Search by text or keywords..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-10 text-xs rounded-xl border-gray-200 bg-gray-50/30 pl-9 focus:bg-white transition-all group-hover:border-indigo-200"
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    </div>
                  </div>

                  {/* Language Selector */}
                  <div>
                    <Label className="text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-1.5 ml-1">
                      <Globe className="h-3 w-3 text-indigo-500" /> Language
                    </Label>
                    <Select value={languageFilter} onValueChange={setLanguageFilter}>
                      <SelectTrigger className="h-10 text-xs rounded-xl border-gray-200 bg-gray-50/30 focus:bg-white transition-all hover:border-indigo-200">
                        <SelectValue placeholder="All Languages" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                        <SelectItem value="all">All Languages</SelectItem>
                        <SelectItem value="english">English Only</SelectItem>
                        <SelectItem value="hindi">Hindi Only</SelectItem>
                        <SelectItem value="bilingual">Bilingual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Exam Name Selector */}
                  <div>
                    <Label className="text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-1.5 ml-1">
                      <FolderTree className="h-3 w-3 text-indigo-500" /> Exam
                    </Label>
                    <Popover open={openExamSearch} onOpenChange={setOpenExamSearch}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="h-10 w-full justify-between text-xs font-medium border-gray-200 rounded-xl bg-gray-50/30 hover:bg-white hover:border-indigo-200 transition-all text-left px-3"
                        >
                          <span className="truncate">
                            {filterExamNames.length === 0 ? "All Exams" : `${filterExamNames.length} Selected`}
                          </span>
                          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-40" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0 rounded-xl shadow-xl border-gray-100">
                        <Command>
                          <CommandInput placeholder="Search exam..." className="h-10 text-xs" />
                          <CommandEmpty className="text-[10px] py-4 text-center text-gray-400">No exam found.</CommandEmpty>
                          <CommandGroup className="max-h-[220px] overflow-y-auto">
                            {categories.map((cat) => {
                              const name = cat.name || cat.category_name;
                              const isSelected = filterExamNames.includes(name);
                              return (
                                <CommandItem
                                  key={cat._id || cat.id}
                                  className="text-xs py-2 hover:bg-indigo-50 cursor-pointer"
                                  onSelect={() => {
                                    setFilterExamNames(prev =>
                                      isSelected ? prev.filter(n => n !== name) : [...prev, name]
                                    );
                                  }}
                                >
                                  <Check className={`mr-2 h-3.5 w-3.5 ${isSelected ? "text-indigo-600" : "opacity-0"}`} />
                                  {name}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Subject Selector */}
                  <div>
                    <Label className="text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-1.5 ml-1">
                      <BookOpen className="h-3 w-3 text-indigo-500" /> Subject
                    </Label>
                    <Popover open={openSubjectSearch} onOpenChange={setOpenSubjectSearch}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="h-10 w-full justify-between text-xs font-medium border-gray-200 rounded-xl bg-gray-50/30 hover:bg-white hover:border-indigo-200 transition-all text-left px-3"
                        >
                          <span className="truncate">
                            {filterSubjects.length === 0 ? "All Subjects" : `${filterSubjects.length} Selected`}
                          </span>
                          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-40" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0 rounded-xl shadow-xl border-gray-100">
                        <Command>
                          <CommandInput placeholder="Search subject..." className="h-10 text-xs" />
                          <CommandEmpty className="text-[10px] py-4 text-center text-gray-400">No subject found.</CommandEmpty>
                          <CommandGroup className="max-h-[220px] overflow-y-auto">
                            {subjects.map((sub) => {
                              const name = sub.name || sub.subject_name;
                              const isSelected = filterSubjects.includes(name);
                              return (
                                <CommandItem
                                  key={sub._id || sub.id}
                                  className="text-xs py-2 hover:bg-indigo-50 cursor-pointer"
                                  onSelect={() => {
                                    setFilterSubjects(prev =>
                                      isSelected ? prev.filter(n => n !== name) : [...prev, name]
                                    );
                                  }}
                                >
                                  <Check className={`mr-2 h-3.5 w-3.5 ${isSelected ? "text-indigo-600" : "opacity-0"}`} />
                                  {name}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Topic Selector */}
                  <div>
                    <Label className="text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-1.5 ml-1">
                      <Tag className="h-3 w-3 text-indigo-500" /> Topic
                    </Label>
                    <Popover open={openTopicSearch} onOpenChange={setOpenTopicSearch}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="h-10 w-full justify-between text-xs font-medium border-gray-200 rounded-xl bg-gray-50/30 hover:bg-white hover:border-indigo-200 transition-all text-left px-3"
                        >
                          <span className="truncate">
                            {filterTopics.length === 0 ? "All Topics" : `${filterTopics.length} Selected`}
                          </span>
                          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-40" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0 rounded-xl shadow-xl border-gray-100">
                        <Command>
                          <CommandInput placeholder="Search topic..." className="h-10 text-xs" />
                          <CommandEmpty className="text-[10px] py-4 text-center text-gray-400">No topic found.</CommandEmpty>
                          <CommandGroup className="max-h-[220px] overflow-y-auto">
                            {topics.map((topic) => {
                              const name = topic.name || topic.topic_name;
                              const isSelected = filterTopics.includes(name);
                              return (
                                <CommandItem
                                  key={topic._id || topic.id}
                                  className="text-xs py-2 hover:bg-indigo-50 cursor-pointer"
                                  onSelect={() => {
                                    setFilterTopics(prev =>
                                      isSelected ? prev.filter(n => n !== name) : [...prev, name]
                                    );
                                  }}
                                >
                                  <Check className={`mr-2 h-3.5 w-3.5 ${isSelected ? "text-indigo-600" : "opacity-0"}`} />
                                  {name}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Second Row of Filters */}
                <div className="mt-6 pt-6 border-t border-gray-50 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-6">
                    {/* Difficulty Filter */}
                    <div className="flex items-center gap-3">
                      <Label className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
                        Difficulty Level
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="h-9 w-[140px] justify-between text-xs font-medium border-gray-200 rounded-xl bg-gray-50/30 hover:bg-white hover:border-indigo-200 transition-all text-left px-3"
                          >
                            <span className="truncate">
                              {filterDifficulties.length === 0 ? "All Levels" : `${filterDifficulties.length} Selected`}
                            </span>
                            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-40" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[180px] p-0 rounded-xl shadow-xl border-gray-100">
                          <Command>
                            <CommandInput placeholder="Search levels..." className="h-10 text-xs" />
                            <CommandEmpty className="text-[10px] py-4 text-center text-gray-400">No level found.</CommandEmpty>
                            <CommandGroup className="max-h-[220px] overflow-y-auto">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => {
                                const val = level.toString();
                                const isSelected = filterDifficulties.includes(val);
                                return (
                                  <CommandItem
                                    key={level}
                                    className="text-xs py-2 hover:bg-indigo-50 cursor-pointer"
                                    onSelect={() => {
                                      setFilterDifficulties(prev =>
                                        isSelected ? prev.filter(v => v !== val) : [...prev, val]
                                      );
                                    }}
                                  >
                                    <Check className={`mr-2 h-3.5 w-3.5 ${isSelected ? "text-indigo-600" : "opacity-0"}`} />
                                    Level {level}
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Quick Access Icons */}
                    <div className="h-6 w-px bg-gray-100 hidden sm:block" />
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg border-gray-200 text-gray-400 hover:text-indigo-600 transition-all hover:border-indigo-200 hover:bg-indigo-50">
                        <Rocket className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg border-gray-200 text-gray-400 hover:text-indigo-600 transition-all hover:border-indigo-200 hover:bg-indigo-50">
                        <Star className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Items Per Page */}
                    <div className="flex items-center gap-3 bg-gray-50/50 px-3 py-1.5 rounded-xl border border-gray-100">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight whitespace-nowrap">Show</Label>
                      <select
                        value={itemsPerPage.toString()}
                        onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                        className="bg-transparent border-none text-[11px] font-bold text-indigo-600 focus:ring-0 cursor-pointer"
                      >
                        <option value="10">10 results</option>
                        <option value="25">25 results</option>
                        <option value="50">50 results</option>
                        <option value="100">100 results</option>
                      </select>
                    </div>
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
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuickAssignTarget({ question: filteredQuestions.find(q => selectedQuestions.has(q._id || q.id)) as Question, type: 'exam', isBatch: true })}
                      className="text-xs border-blue-200 text-blue-600 hover:bg-blue-50 h-8"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Exam
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuickAssignTarget({ question: filteredQuestions.find(q => selectedQuestions.has(q._id || q.id)) as Question, type: 'subject', isBatch: true })}
                      className="text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50 h-8"
                    >
                      <BookOpen className="h-3 w-3 mr-1" />
                      Subject
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuickAssignTarget({ question: filteredQuestions.find(q => selectedQuestions.has(q._id || q.id)) as Question, type: 'topic', isBatch: true })}
                      className="text-xs border-purple-200 text-purple-600 hover:bg-purple-50 h-8"
                    >
                      <FolderTree className="h-3 w-3 mr-1" />
                      Topic
                    </Button>
                   
                    <Button variant="destructive" size="sm" onClick={handleBatchDelete} className="text-xs sm:text-sm">
                      <Trash className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Delete ({selectedQuestions.size})
                    </Button>
                  </div>
                )}
              </div>

              {loading ? (
                <Card className="rounded-xl border border-border/70 shadow-sm">
                  <CardContent className="py-12">
                    <Loader text="Loading questions..." />
                  </CardContent>
                </Card>
              ) : filteredQuestions.length === 0 ? (
                <Card className="rounded-xl border border-border/70 shadow-sm">
                  <CardContent className="py-12 text-center">
                    <div className="mb-3 text-4xl">❓</div>
                    <p className="font-semibold text-base">No questions found</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      {searchQuery || filterDifficulties.length > 0 || filterExamNames.length > 0 || filterSubjects.length > 0 || filterTopics.length > 0
                        ? 'Try adjusting your filters'
                        : 'Click "Add question" to create your first one.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="border border-border/70 rounded-xl overflow-hidden shadow-sm bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/80 border-b border-border/70">
                          <th className="p-3 w-12">
                            <Checkbox
                              checked={filteredQuestions.length > 0 && selectedQuestions.size === filteredQuestions.length}
                              onCheckedChange={handleSelectAll}
                            />
                          </th>
                          <th className="p-3 text-[11px] font-bold uppercase text-gray-500 w-16">ID</th>
                          <th className="p-3 text-[11px] font-bold uppercase text-gray-500 min-w-[250px]">Question</th>
                          <th className="p-3 text-[11px] font-bold uppercase text-gray-500">Exam</th>
                          <th className="p-3 text-[11px] font-bold uppercase text-gray-500">Subject</th>
                          <th className="p-3 text-[11px] font-bold uppercase text-gray-500">Topic</th>
                          <th className="p-3 text-[11px] font-bold uppercase text-gray-500 w-16">Level</th>
                          <th className="p-3 text-[11px] font-bold uppercase text-gray-500 w-32">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {filteredQuestions.map((question, idx) => {
                          const questionId = question._id || question.id || '';
                          const examNames = question.exam_names || [];
                          const subs = (Array.isArray(question.subject_ids) ? question.subject_ids :
                            (question.subject_id ? [question.subject_id] : []));
                          const tops = (Array.isArray(question.topic_ids) ? question.topic_ids :
                            (question.topic_id ? [question.topic_id] : []));

                          return (
                            <tr key={questionId} className={`hover:bg-gray-50/50 transition-colors ${selectedQuestions.has(questionId) ? 'bg-blue-50/30' : ''}`}>
                              <td className="p-3">
                                <Checkbox
                                  checked={selectedQuestions.has(questionId)}
                                  onCheckedChange={() => handleSelectQuestion(questionId)}
                                />
                              </td>
                              <td className="p-3">
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                  {questionId.slice(-4)}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="space-y-1">
                                  <p className="text-xs font-medium line-clamp-2" title={question.question_text}>
                                    {question.question_text}
                                  </p>
                                  {question.question_text_hindi && (
                                    <p className="text-[10px] text-muted-foreground line-clamp-1" title={question.question_text_hindi}>
                                      {question.question_text_hindi}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex flex-wrap gap-1">
                                  {examNames.map((name, i) => (
                                    <Badge key={i} variant="secondary" className="bg-[#e6f7ff] text-[#1890ff] hover:bg-[#bae7ff] border-none text-[9px] h-5 px-1.5 rounded flex items-center gap-1">
                                      {name}
                                      <X className="h-2 w-2 cursor-pointer" onClick={() => handleRemoveAssignment(question, 'exam', name)} />
                                    </Badge>
                                  ))}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 rounded-full hover:bg-gray-100 text-gray-400"
                                    onClick={() => setQuickAssignTarget({ question, type: 'exam' })}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex flex-wrap gap-1">
                                  {subs.map((s: any, i: number) => (
                                    <Badge key={i} variant="secondary" className="bg-[#e6fffb] text-[#13c2c2] hover:bg-[#b5f5ec] border-none text-[9px] h-5 px-1.5 rounded flex items-center gap-1">
                                      {typeof s === 'string' ? s : (s.name || s.subject_name)}
                                      <X className="h-2 w-2 cursor-pointer" onClick={() => handleRemoveAssignment(question, 'subject', typeof s === 'string' ? s : (s._id || s.id))} />
                                    </Badge>
                                  ))}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 rounded-full hover:bg-gray-100 text-gray-400"
                                    onClick={() => setQuickAssignTarget({ question, type: 'subject' })}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex flex-wrap gap-1">
                                  {tops.map((t: any, i: number) => (
                                    <Badge key={i} variant="secondary" className="bg-[#f6ffed] text-[#52c41a] hover:bg-[#d9f7be] border-none text-[9px] h-5 px-1.5 rounded flex items-center gap-1">
                                      {typeof t === 'string' ? t : (t.name || t.topic_name)}
                                      <X className="h-2 w-2 cursor-pointer" onClick={() => handleRemoveAssignment(question, 'topic', typeof t === 'string' ? t : (t._id || t.id))} />
                                    </Badge>
                                  ))}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 rounded-full hover:bg-gray-100 text-gray-400"
                                    onClick={() => setQuickAssignTarget({ question, type: 'topic' })}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${question.difficulty_level <= 3 ? 'bg-green-100 text-green-700' :
                                  question.difficulty_level <= 7 ? 'bg-orange-100 text-orange-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                  {question.difficulty_level}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 rounded-lg hover:bg-blue-50 text-blue-600"
                                    onClick={() => setViewingQuestion(question)}
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 rounded-lg hover:bg-amber-50 text-amber-600"
                                    onClick={() => handleEdit(question)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 rounded-lg hover:bg-red-50 text-red-600"
                                    onClick={() => handleDelete(questionId)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {filteredQuestions.length > 0 && totalPages > 1 && (
                <div className="pt-4">
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={(newItemsPerPage) => {
                      setItemsPerPage(newItemsPerPage);
                      setCurrentPage(1);
                    }}
                    totalItems={totalQuestionsCount}
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
                key={editingQuestion?._id || editingQuestion?.id || 'new'}
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

          <TabsContent value="quick" className="space-y-4">
            <Card className="rounded-xl sm:rounded-[1.5rem] border border-border/70 shadow-lg">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <Rocket className="h-4 w-4 sm:h-5 sm:w-5" />
                  Quick Add Questions
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Paste multiple questions in bulk using a simple text format. Supports both English and Hindi.
                </p>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-6">
                {/* Instructions */}
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 sm:p-4 rounded-r-lg">
                  <h4 className="text-xs sm:text-sm font-semibold text-blue-800 mb-1">Format Instructions:</h4>
                  <p className="text-xs text-blue-700 mb-2">
                    Use markers: <code className="bg-blue-100 px-1 rounded">[Q]</code> for question,
                    <code className="bg-blue-100 px-1 rounded">(a)</code> for options,
                    <code className="bg-blue-100 px-1 rounded">[ANS]</code> for answer,
                    <code className="bg-blue-100 px-1 rounded">[SOL]</code> for solution,
                    <code className="bg-blue-100 px-1 rounded">[LVL]</code> for difficulty (optional).
                  </p>
                  <p className="text-xs text-blue-700 font-mono bg-blue-100/50 p-2 rounded">
                    [Q] What is 2+2? [LVL] 3<br />
                    (a) 3 (b) 4 (c) 5 (d) 6<br />
                    [ANS] b [SOL] Basic addition
                  </p>
                </div>

                {/* Common Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div>
                    <Label className="text-xs sm:text-sm">Category (Optional)</Label>

                    <Select value={quickAddCategory} onValueChange={setQuickAddCategory}>
                      <SelectTrigger className="mt-1 rounded-lg text-xs sm:text-sm">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat._id || cat.id} value={cat._id || cat.id} className="text-xs sm:text-sm">
                            {cat.category_name || cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm">Subject (Optional)</Label>
                    <Select value={quickAddSubject} onValueChange={setQuickAddSubject}>
                      <SelectTrigger className="mt-1 rounded-lg text-xs sm:text-sm">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {subjects.map((sub) => (
                          <SelectItem key={sub._id || sub.id} value={sub._id || sub.id} className="text-xs sm:text-sm">
                            {sub.subject_name || sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm">Topic (Optional)</Label>
                    <Select value={quickAddTopic} onValueChange={setQuickAddTopic}>
                      <SelectTrigger className="mt-1 rounded-lg text-xs sm:text-sm">
                        <SelectValue placeholder="Select topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {topics.filter(t => {
                          // If no subject selected, show all topics
                          if (!quickAddSubject) return true;
                          // Handle subject_id as string or object
                          const topicSubId = t.subject_id ? (typeof t.subject_id === 'object' ? String(t.subject_id._id || t.subject_id.id || t.subject_id) : String(t.subject_id)) : null;
                          // Check single subject_id
                          if (topicSubId === quickAddSubject) return true;
                          // Check subject_ids array
                          if (t.subject_ids?.length > 0) {
                            return t.subject_ids.some((sid: any) => String(sid) === quickAddSubject || (typeof sid === 'object' && String(sid._id || sid.id) === quickAddSubject));
                          }
                          // Show topics with no subject (orphan topics)
                          return true;
                        }).map((topic) => (
                          <SelectItem key={topic._id || topic.id} value={topic._id || topic.id} className="text-xs sm:text-sm">
                            {topic.topic_name || topic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm">Default Difficulty</Label>
                    <Select value={quickAddDifficulty} onValueChange={setQuickAddDifficulty}>
                      <SelectTrigger className="mt-1 rounded-lg text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(l => (
                          <SelectItem key={l} value={l.toString()} className="text-xs sm:text-sm">Level {l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm">Time Limit (seconds)</Label>
                    <Input
                      type="number"
                      value={quickAddTime}
                      onChange={(e) => setQuickAddTime(e.target.value)}
                      className="mt-1 rounded-lg text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm">Source (Optional)</Label>
                    <Input
                      type="text"
                      placeholder="e.g., RRB Group-D 2022"
                      value={quickAddSource}
                      onChange={(e) => setQuickAddSource(e.target.value)}
                      className="mt-1 rounded-lg text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Common Tags */}
                <div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={quickAddTags.includes(tag.id) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => {
                          setQuickAddTags(prev =>
                            prev.includes(tag.id)
                              ? prev.filter(id => id !== tag.id)
                              : [...prev, tag.id]
                          );
                        }}
                      >
                        {tag.tag_name || tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Question Text Areas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label className="text-xs sm:text-sm font-medium">English Questions (Optional)</Label>
                    <textarea
                      value={quickAddEnglish}
                      onChange={(e) => setQuickAddEnglish(e.target.value)}
                      placeholder="Paste all English questions here...&#10;[Q] What is the capital of France?&#10;(a) London (b) Paris (c) Berlin (d) Madrid&#10;[ANS] b [SOL] Paris is the capital city of France."
                      className="w-full mt-1 min-h-[250px] sm:min-h-[300px] p-3 sm:p-4 text-xs sm:text-sm font-mono border rounded-lg resize-y focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm font-medium">Hindi Questions (Optional)</Label>
                    <textarea
                      value={quickAddHindi}
                      onChange={(e) => setQuickAddHindi(e.target.value)}
                      placeholder="Paste all Hindi questions here...&#10;[Q] फ्रांस की राजधानी क्या है?&#10;(a) लंदन (b) पेरिस (c) बर्लिन (d) मैड्रिड&#10;[ANS] b [SOL] पेरिस फ्रांस की राजधानी है।"
                      className="w-full mt-1 min-h-[250px] sm:min-h-[300px] p-3 sm:p-4 text-xs sm:text-sm font-mono border rounded-lg resize-y focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center pt-2 sm:pt-4">
                  <Button
                    onClick={handleQuickAddSubmit}
                    disabled={loading}
                    className="rounded-lg sm:rounded-xl text-sm sm:text-base px-6 sm:px-8 py-2 sm:py-3"
                  >
                    <Rocket className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    {loading ? 'Processing...' : 'Process and Add Questions'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4">
            <div className="flex justify-end mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="rounded-lg text-xs sm:text-sm"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Download CSV Template
              </Button>
            </div>
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

        {/* View Question Modal */}
        <Dialog open={!!viewingQuestion} onOpenChange={(open) => !open && setViewingQuestion(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[95vh] overflow-y-auto mx-2 sm:mx-4 p-0 rounded-2xl border-none shadow-2xl bg-white">

            <DialogHeader className="p-4 sm:p-6 bg-gray-50 border-b">
              <DialogTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-600" />
                Question Details
              </DialogTitle>
            </DialogHeader>
            {viewingQuestion && (
              <div className="p-4 sm:p-8 space-y-6">
                {/* Language Toggle in Modal */}
                <div className="flex items-center justify-between pb-2">
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    {['both', 'english', 'hindi'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguageFilter(lang)}
                        className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${languageFilter === lang
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                          }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                  <Badge variant="outline" className="text-[10px] font-medium border-blue-200 text-blue-600 bg-blue-50">
                    Bilingual Content Detected
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">The Question</Label>
                  <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 text-sm sm:text-base text-gray-800 leading-relaxed font-medium">
                    <div className="flex flex-col gap-4">
                      {(languageFilter === 'both' || languageFilter === 'english') && viewingQuestion.question_text && (
                        <div className="flex gap-3">
                          <span className="shrink-0 px-1.5 py-0.5 h-fit rounded text-[8px] font-bold bg-blue-100 text-blue-600 uppercase tracking-tight">EN</span>
                          <p>{viewingQuestion.question_text}</p>
                        </div>
                      )}
                      {(languageFilter === 'both' || languageFilter === 'hindi') && viewingQuestion.question_text_hindi && (
                        <div className="flex gap-3 pt-3 border-t border-gray-200">
                          <span className="shrink-0 px-1.5 py-0.5 h-fit rounded text-[8px] font-bold bg-orange-100 text-orange-600 uppercase tracking-tight">HI</span>
                          <p className="text-gray-700 font-hindi">{viewingQuestion.question_text_hindi}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">Options (Bilingual)</Label>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { label: 'A', text: viewingQuestion.option_a, hindi: viewingQuestion.option_a_hindi },
                      { label: 'B', text: viewingQuestion.option_b, hindi: viewingQuestion.option_b_hindi },
                      { label: 'C', text: viewingQuestion.option_c, hindi: viewingQuestion.option_c_hindi },
                      { label: 'D', text: viewingQuestion.option_d, hindi: viewingQuestion.option_d_hindi },
                    ].map((opt, idx) => {
                      const isCorrect = Array.isArray(viewingQuestion.correct_answers)
                        ? viewingQuestion.correct_answers.includes(idx)
                        : viewingQuestion.correct_answer === idx;

                      return (opt.text || opt.hindi) && (
                        <div
                          key={idx}
                          className={`rounded-xl border p-4 transition-all shadow-sm ${isCorrect
                            ? 'border-green-500 bg-green-50/50 ring-1 ring-green-500/20'
                            : 'border-gray-100 bg-white'
                            }`}
                        >
                          <div className="flex items-start gap-4">
                            <span className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${isCorrect ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'
                              }`}>
                              {opt.label}
                            </span>
                            <div className="flex-1 min-w-0 space-y-2">
                              {(languageFilter === 'both' || languageFilter === 'english') && opt.text && (
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[9px] uppercase h-4 px-1 text-blue-600 border-blue-200">English</Badge>
                                  <p className={`text-xs sm:text-sm font-medium ${isCorrect ? 'text-green-800' : 'text-gray-700'}`}>{opt.text}</p>
                                </div>
                              )}
                              {(languageFilter === 'both' || languageFilter === 'hindi') && opt.hindi && (
                                <div className={`flex items-center gap-2 ${(languageFilter === 'both' && opt.text) ? 'pt-2 border-t border-gray-50' : ''}`}>
                                  <Badge variant="outline" className="text-[9px] uppercase h-4 px-1 text-orange-600 border-orange-200">Hindi</Badge>
                                  <p className={`text-xs sm:text-sm font-medium font-hindi ${isCorrect ? 'text-green-800' : 'text-gray-600 italic'}`}>{opt.hindi}</p>
                                </div>
                              )}
                            </div>
                            {isCorrect && <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t">
                  <div className="space-y-2">
                    <Label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">Classification</Label>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Level {viewingQuestion.difficulty_level}
                      </Badge>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 capitalize">
                        {viewingQuestion.answer_type || 'Single'} Answer
                      </Badge>
                    </div>
                  </div>
                  {viewingQuestion.question_reference && (
                    <div className="space-y-2">
                      <Label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">Reference</Label>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">{viewingQuestion.question_reference}</p>
                    </div>
                  )}
                </div>

                {(viewingQuestion.hint || viewingQuestion.hint_hindi) && (
                  <div className="space-y-2 pt-4 border-t">
                    <Label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">Hint</Label>
                    <div className="p-3 bg-blue-50/30 rounded-xl border border-blue-100/50">
                      <p className="text-xs sm:text-sm text-gray-700">{viewingQuestion.hint}</p>
                      {viewingQuestion.hint_hindi && <p className="text-xs text-gray-500 mt-1 italic">{viewingQuestion.hint_hindi}</p>}
                    </div>
                  </div>
                )}

                {(viewingQuestion.explanation || viewingQuestion.explanation_hindi) && (
                  <div className="space-y-2 pt-4 border-t">
                    <Label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">Explanation</Label>
                    <div className="p-3 bg-green-50/30 rounded-xl border border-green-100/50">
                      <p className="text-xs sm:text-sm text-gray-700">{viewingQuestion.explanation}</p>
                      {viewingQuestion.explanation_hindi && <p className="text-xs text-gray-500 mt-1 italic">{viewingQuestion.explanation_hindi}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="p-4 sm:p-6 bg-gray-50 border-t flex justify-end">
              <Button onClick={() => setViewingQuestion(null)} className="rounded-xl px-8">Close</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Tags Modal */}
        <Dialog open={showAddTagsModal} onOpenChange={setShowAddTagsModal}>
          <DialogContent className="max-w-[95vw] sm:max-w-md mx-2 sm:mx-4">
            <DialogHeader>
              <DialogTitle className="text-sm sm:text-base flex items-center gap-2">
                <Tags className="h-4 w-4 sm:h-5 sm:w-5" />
                Add Tags to Selected Questions
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Select one or more tags to add to {selectedQuestions.size} selected question(s).
              </p>
              <div className="flex flex-wrap gap-2 max-h-[200px] sm:max-h-[250px] overflow-y-auto p-2 border rounded-lg">
                {tags.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No tags available. Create tags first.</p>
                ) : (
                  tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTagsToAdd.includes(tag.id) ? "default" : "outline"}
                      className="cursor-pointer text-xs sm:text-sm py-1 px-2 sm:px-3"
                      onClick={() => {
                        setSelectedTagsToAdd(prev =>
                          prev.includes(tag.id)
                            ? prev.filter(id => id !== tag.id)
                            : [...prev, tag.id]
                        );
                      }}
                    >
                      {selectedTagsToAdd.includes(tag.id) && '✓ '}
                      {tag.tag_name || tag.name}
                    </Badge>
                  ))
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddTagsModal(false);
                    setSelectedTagsToAdd([]);
                  }}
                  className="text-xs sm:text-sm"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddTagsToSelected}
                  disabled={loading || selectedTagsToAdd.length === 0}
                  className="text-xs sm:text-sm"
                >
                  {loading ? 'Adding...' : 'Apply Tags'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Quick Assign Modal */}
        <Dialog open={!!quickAssignTarget} onOpenChange={(open) => !open && setQuickAssignTarget(null)}>
          <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-xl">
            <DialogHeader className="p-4 border-b bg-gray-50">
              <DialogTitle className="text-sm font-bold flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                Assign {quickAssignTarget?.type === 'exam' ? 'Exam' : quickAssignTarget?.type === 'subject' ? 'Subject' : 'Topic'}
              </DialogTitle>
            </DialogHeader>
            <div className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={`Search ${quickAssignTarget?.type}...`}
                  value={assignSearchQuery}
                  onChange={(e) => setAssignSearchQuery(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1">
                {(quickAssignTarget?.type === 'exam' ? categories :
                  quickAssignTarget?.type === 'subject' ? subjects :
                    topics).filter(item =>
                      (item.name || item.category_name || item.subject_name || item.topic_name || "")
                        .toLowerCase().includes(assignSearchQuery.toLowerCase())
                    ).map((item) => (
                      <Button
                        key={item._id || item.id}
                        variant="ghost"
                        className="w-full justify-start text-xs h-9 hover:bg-primary/5 hover:text-primary"
                        onClick={() => handleQuickAssign(item._id || item.id, item.name || item.category_name || item.subject_name || item.topic_name)}
                      >
                        {item.name || item.category_name || item.subject_name || item.topic_name}
                      </Button>
                    ))
                }
              </div>
            </div>
            <div className="p-3 bg-gray-50 border-t flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setQuickAssignTarget(null)}>Cancel</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk Upload Modal */}
        <Dialog open={showBulkUploadModal} onOpenChange={setShowBulkUploadModal}>
          <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-lg">
            <DialogHeader className="px-6 py-4 border-b border-gray-100 flex flex-row items-center justify-between">
              <DialogTitle className="text-lg font-semibold text-gray-800">Bulk Add Questions</DialogTitle>
            </DialogHeader>
            <div className="p-6">
              <BulkUpload
                onUpload={async (file, format) => {
                  await handleBulkUpload(file, format);
                  setShowBulkUploadModal(false);
                }}
                onCancel={() => setShowBulkUploadModal(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default Questions;
