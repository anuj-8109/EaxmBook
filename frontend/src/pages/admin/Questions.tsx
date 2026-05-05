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
import { Plus, Pencil, Trash2, Eye, Upload, Search, Filter, X, Trash, Download, Rocket, Tags } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { showError, showSuccess, showWarning, showInfo, showDeleteConfirm } from '@/lib/sweetalert';
import { questionsAPI, tagsAPI, categoriesAPI } from '@/lib/api';
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
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('list');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  // Multi-select states
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());

  // Quick Add states
  const [quickAddEnglish, setQuickAddEnglish] = useState('');
  const [quickAddHindi, setQuickAddHindi] = useState('');
  const [quickAddCategory, setQuickAddCategory] = useState('');
  const [quickAddDifficulty, setQuickAddDifficulty] = useState('5');
  const [quickAddTime, setQuickAddTime] = useState('60');
  const [quickAddSource, setQuickAddSource] = useState('');
  const [quickAddTags, setQuickAddTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);

  // Add Tags to Selected modal
  const [showAddTagsModal, setShowAddTagsModal] = useState(false);
  const [selectedTagsToAdd, setSelectedTagsToAdd] = useState<string[]>([]);

  // View Question modal enhanced
  const [viewingQuestionDetails, setViewingQuestionDetails] = useState<Question | null>(null);

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
    fetchQuestions();
    fetchCategoriesAndTags();
  }, [currentPage]);

  const fetchCategoriesAndTags = async () => {
    try {
      const [categoriesData, tagsData] = await Promise.all([
        categoriesAPI.getAll(true),
        tagsAPI.getAll()
      ]);
      setCategories(categoriesData || []);
      setTags(tagsData?.data || tagsData || []);
    } catch (error) {
      console.error('Failed to load categories or tags:', error);
    }
  };

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
    const questionId = question._id || (question as any).id;
    if (questionId) {
      navigate(`/admin/questions/edit/${questionId}`);
    } else {
      showError('Cannot edit this question', 'Invalid Question ID');
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
      'question_text', 'question_text_hindi', 'option_a', 'option_a_hindi',
      'option_b', 'option_b_hindi', 'option_c', 'option_c_hindi',
      'option_d', 'option_d_hindi', 'option_x', 'option_x_hindi',
      'correct_answer', 'answer_type', 'difficulty_level', 'time_duration',
      'question_reference', 'exam_names', 'category_ids', 'subject_ids', 'topic_ids',
      'hint', 'hint_hindi', 'explanation', 'explanation_hindi'
    ];
    const sampleRow = [
      'What is the capital of India?', 'भारत की राजधानी क्या है?',
      'Mumbai', 'मुंबई', 'Delhi', 'दिल्ली', 'Kolkata', 'कोलकाता',
      'Chennai', 'चेन्नई', 'None of the above', 'इनमें से कोई नहीं',
      '1', 'single', '5', '60', 'Sample Reference', 'UPSC|SSC',
      'cat_id_1|cat_id_2', 'sub_id_1', 'topic_id_1',
      'Hint text', 'संकेत हिंदी में', 'Explanation text', 'व्याख्या हिंदी में'
    ];
    const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'questions_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess('Template downloaded successfully!');
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
    if (!quickAddEnglish.trim() || !quickAddHindi.trim() || !quickAddCategory) {
      showError('Please provide English text, Hindi text, and select a category.');
      return;
    }

    const enQuestions = parseQuickAddText('[Q]' + quickAddEnglish);
    const hiQuestions = parseQuickAddText('[Q]' + quickAddHindi);

    if (enQuestions.length !== hiQuestions.length) {
      showError(`Parsing Error: The number of questions do not match. Found ${enQuestions.length} English questions and ${hiQuestions.length} Hindi questions.`);
      return;
    }

    if (enQuestions.length === 0) {
      showError('No valid questions found. Format: [Q] question... (a)...(b)...(c)...(d)... [ANS]... [SOL]...');
      return;
    }

    setLoading(true);
    try {
      const questionsToCreate = enQuestions.map((qEn, index) => {
        const qHi = hiQuestions[index];
        const difficulty = qEn.difficulty || parseInt(quickAddDifficulty) || 5;
        const answerMap: { [key: string]: number } = { a: 0, b: 1, c: 2, d: 3 };

        return {
          question_text: qEn.question,
          question_text_hindi: qHi.question,
          option_a: qEn.options.a,
          option_a_hindi: qHi.options.a,
          option_b: qEn.options.b,
          option_b_hindi: qHi.options.b,
          option_c: qEn.options.c,
          option_c_hindi: qHi.options.c,
          option_d: qEn.options.d,
          option_d_hindi: qHi.options.d,
          correct_answer: answerMap[qEn.answer] ?? 0,
          answer_type: 'single',
          difficulty_level: difficulty,
          time_duration: parseInt(quickAddTime) || 60,
          question_reference: quickAddSource,
          category_ids: [quickAddCategory],
          explanation: qEn.solution,
          explanation_hindi: qHi.solution,
          tags: quickAddTags
        };
      });

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
            if (text.includes('question text hindi')) return 'question_text_hindi';
            if (text === 'question' || text.includes('question')) return 'question_text';
            if (text.includes('option a')) return 'option_a';
            if (text.includes('option b')) return 'option_b';
            if (text.includes('option c')) return 'option_c';
            if (text.includes('option d')) return 'option_d';
            if (text.includes('answer')) return 'correct_answer';
            if (text.includes('explanation')) return 'explanation';
            if (text.includes('hint')) return 'hint';
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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddTagsModal(true)}
                      className="text-xs sm:text-sm"
                    >
                      <Tags className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Add Tags ({selectedQuestions.size})
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleBatchDelete} className="text-xs sm:text-sm">
                      <Trash className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Delete ({selectedQuestions.size})
                    </Button>
                  </div>
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
                                  {(question.hint || question.hint_hindi) && (
                                    <div>
                                      <Label className="text-[10px] sm:text-xs text-muted-foreground">Hint</Label>
                                      {question.hint && <p className="text-xs sm:text-sm break-words">{question.hint}</p>}
                                      {question.hint_hindi && (
                                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words italic">
                                          (Hindi) {question.hint_hindi}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                  {(question.explanation || question.explanation_hindi) && (
                                    <div>
                                      <Label className="text-[10px] sm:text-xs text-muted-foreground">Explanation</Label>
                                      {question.explanation && <p className="text-xs sm:text-sm break-words">{question.explanation}</p>}
                                      {question.explanation_hindi && (
                                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words italic">
                                          (Hindi) {question.explanation_hindi}
                                        </p>
                                      )}
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
                    [Q] What is 2+2? [LVL] 3<br/>
                    (a) 3 (b) 4 (c) 5 (d) 6<br/>
                    [ANS] b [SOL] Basic addition
                  </p>
                </div>

                {/* Common Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div>
                    <Label className="text-xs sm:text-sm">Category *</Label>
                    <Select value={quickAddCategory} onValueChange={setQuickAddCategory}>
                      <SelectTrigger className="mt-1 rounded-lg text-xs sm:text-sm">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id} className="text-xs sm:text-sm">
                            {cat.name || cat.category_name}
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
                  <Label className="text-xs sm:text-sm">Common Tags (Optional)</Label>
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
                    <Label className="text-xs sm:text-sm font-medium">English Questions</Label>
                    <textarea
                      value={quickAddEnglish}
                      onChange={(e) => setQuickAddEnglish(e.target.value)}
                      placeholder="Paste all English questions here...&#10;[Q] What is the capital of France?&#10;(a) London (b) Paris (c) Berlin (d) Madrid&#10;[ANS] b [SOL] Paris is the capital city of France."
                      className="w-full mt-1 min-h-[250px] sm:min-h-[300px] p-3 sm:p-4 text-xs sm:text-sm font-mono border rounded-lg resize-y focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm font-medium">Hindi Questions</Label>
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
      </div>
    </AdminLayout>
  );
};

export default Questions;
