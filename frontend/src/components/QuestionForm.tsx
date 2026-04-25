import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { categoriesAPI, subjectsAPI, topicsAPI, uploadAPI, aiAPI } from '@/lib/api';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Bot, Loader2, CheckCircle2, Plus, X, Image as ImageIcon, Video, Upload, Trash2, Sigma, Keyboard, Table as TableIcon } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import 'mathlive';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Declare math-field for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        onInput?: (e: any) => void;
      };
    }
  }
}

/* ── Math Input Component ── */
const MathInput = ({
  value,
  onChange,
  placeholder,
  className = "",
  compact = false
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showMathEditor, setShowMathEditor] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(2);
  const [tableCols, setTableCols] = useState(2);
  const [tableData, setTableData] = useState<string[][]>([['', ''], ['', '']]);

  const generateTable = () => {
    let markdown = '\n| ' + tableData[0].join(' | ') + ' |\n';
    markdown += '| ' + tableData[0].map(() => '---').join(' | ') + ' |\n';
    for (let i = 1; i < tableData.length; i++) {
      markdown += '| ' + tableData[i].join(' | ') + ' |\n';
    }
    onChange(value + markdown);
    setShowTableModal(false);
    toast.success('Table inserted!');
  };

  const updateTableSize = (rows: number, cols: number) => {
    const newData = Array(rows).fill(0).map((_, r) =>
      Array(cols).fill(0).map((_, c) => (tableData[r] && tableData[r][c]) || '')
    );
    setTableRows(rows);
    setTableCols(cols);
    setTableData(newData);
  };

  // Function to extract first math expression from value for the editor
  const getMathValue = (text: string) => {
    const match = text.match(/\$(.*?)\$/) || text.match(/\$\$(.*?)\$\$/);
    return match ? match[1] : text;
  };

  const handleMathChange = (latex: string) => {
    // If it's pure math, wrap it in $
    if (!value.includes('$')) {
      onChange(`$${latex}$`);
    } else {
      // Replace the first $...$ or $$...$$ with new latex
      const newValue = value.replace(/\$(.*?)\$|\$\$(.*?)\$\$/, `$${latex}$`);
      onChange(newValue);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <div className="flex gap-1 mb-1">
          <Button
            type="button"
            variant={showMathEditor ? "default" : "outline"}
            size="xs"
            onClick={() => {
              setShowMathEditor(!showMathEditor);
              if (!showMathEditor) setShowPreview(false);
            }}
            className="h-7 text-[10px] rounded-lg px-2"
          >
            <Keyboard className="w-3 h-3 mr-1" />
            Formula Editor
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => setShowTableModal(true)}
            className="h-7 text-[10px] rounded-lg px-2 hover:bg-primary/5 border-dashed"
          >
            <TableIcon className="w-3 h-3 mr-1" />
            Table Generator
          </Button>
          <Button
            type="button"
            variant={showPreview ? "default" : "outline"}
            size="xs"
            onClick={() => {
              setShowPreview(!showPreview);
              if (!showPreview) setShowMathEditor(false);
            }}
            className="h-7 text-[10px] rounded-lg px-2"
          >
            <Sigma className="w-3 h-3 mr-1" />
            Preview
          </Button>
        </div>

        {/* Table Generator Modal */}
        {showTableModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-2xl shadow-2xl border border-primary/20">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <TableIcon className="w-5 h-5 text-primary" />
                  Table Generator
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setShowTableModal(false)} className="rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex gap-4 mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold uppercase tracking-wider opacity-60">Rows</Label>
                  <Input
                    type="number"
                    value={tableRows}
                    min={1}
                    max={20}
                    onChange={(e) => updateTableSize(parseInt(e.target.value) || 1, tableCols)}
                    className="w-20 rounded-xl border-primary/20"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold uppercase tracking-wider opacity-60">Columns</Label>
                  <Input
                    type="number"
                    value={tableCols}
                    min={1}
                    max={10}
                    onChange={(e) => updateTableSize(tableRows, parseInt(e.target.value) || 1)}
                    className="w-20 rounded-xl border-primary/20"
                  />
                </div>
                <div className="flex items-end text-xs text-muted-foreground pb-2 italic">
                  Tip: Use $...$ inside cells for math (e.g. $\frac{1}{2}$)
                </div>
              </div>

              <div className="max-h-[350px] overflow-auto border rounded-2xl bg-white dark:bg-slate-950 p-1 mb-6 custom-scrollbar">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {Array(tableCols).fill(0).map((_, c) => (
                        <th key={c} className="p-2 border bg-muted/30">
                          <Input
                            placeholder={`Header ${c + 1}`}
                            value={tableData[0][c]}
                            onChange={(e) => {
                              const newData = [...tableData];
                              newData[0][c] = e.target.value;
                              setTableData(newData);
                            }}
                            className="h-8 text-xs font-bold border-none bg-transparent text-center focus:bg-white dark:focus:bg-slate-900"
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array(tableRows - 1).fill(0).map((_, r) => (
                      <tr key={r}>
                        {Array(tableCols).fill(0).map((_, c) => (
                          <td key={c} className="p-1 border border-slate-100 dark:border-slate-800">
                            <Input
                              value={tableData[r + 1][c]}
                              onChange={(e) => {
                                const newData = [...tableData];
                                newData[r + 1][c] = e.target.value;
                                setTableData(newData);
                              }}
                              className="h-8 text-xs border-none bg-transparent focus:bg-white dark:focus:bg-slate-900"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button variant="outline" className="rounded-xl px-6" onClick={() => setShowTableModal(false)}>
                  Cancel
                </Button>
                <Button className="rounded-xl px-8 bg-primary shadow-lg shadow-primary/20" onClick={generateTable}>
                  Insert Table
                </Button>
              </div>
            </div>
          </div>
        )}

        {showMathEditor ? (
          <div className="border rounded-xl p-2 bg-white dark:bg-slate-950">
            <math-field
              onInput={(e: any) => handleMathChange(e.target.value)}
              style={{ padding: '8px', width: '100%', outline: 'none' }}
              ref={(el: any) => {
                if (el) {
                  el.value = getMathValue(value);
                  // Configure fonts path if needed
                  el.setOptions({
                    smartFence: true,
                    virtualKeyboardMode: 'onfocus',
                  });
                }
              }}
            />
            <p className="text-[10px] text-muted-foreground mt-2">
              Visual Editor: Type formulas naturally or use the virtual keyboard.
            </p>
          </div>
        ) : (
          <>
            {compact ? (
              <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder || "Use $ for math..."}
                className="h-11 rounded-xl"
              />
            ) : (
              <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder || "Use $$ for block math and $ for inline math..."}
                className="min-h-[100px] rounded-xl font-mono text-sm"
              />
            )}
          </>
        )}
      </div>

      {showPreview && value && (
        <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 dark:bg-primary/10 animate-in fade-in slide-in-from-top-1">
          <div className="prose prose-sm dark:prose-invert max-w-none overflow-x-auto">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => {
                  const content = Array.isArray(children) ? children.join('') : (children?.toString() || '');
                  return (
                    <p className="mb-2 last:mb-0">
                      {content.split(/(\$\$.*?\$\$|\$.*?\$)/g).map((part: string, i: number) => {
                        if (part.startsWith('$$') && part.endsWith('$$')) {
                          return <BlockMath key={i} math={part.slice(2, -2)} />;
                        }
                        if (part.startsWith('$') && part.endsWith('$')) {
                          return <InlineMath key={i} math={part.slice(1, -1)} />;
                        }
                        return part;
                      })}
                    </p>
                  );
                },
                table: ({ children }) => (
                  <div className="my-4 overflow-x-auto rounded-xl border border-primary/20 shadow-sm bg-white dark:bg-slate-900">
                    <table className="min-w-full divide-y divide-primary/10">{children}</table>
                  </div>
                ),
                thead: ({ children }) => <thead className="bg-primary/5 dark:bg-primary/20">{children}</thead>,
                th: ({ children }) => <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-primary">{children}</th>,
                td: ({ children }) => <td className="px-4 py-3 text-sm border-t border-primary/5 dark:border-primary/10">{children}</td>,
                tr: ({ children }) => <tr className="hover:bg-primary/[0.02] transition-colors">{children}</tr>,
              }}
            >
              {value}
            </ReactMarkdown>
          </div>
        </div>
      )}
      {!showMathEditor && (
        <p className="text-[9px] text-muted-foreground mt-1">
          Tip: Use <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">$...$</code> for math.
          Example: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">$\frac{2}{3}$</code>.
        </p>
      )}
    </div>
  );
};


interface Category {
  _id?: string;
  id?: string;
  name: string;
  icon?: string;
  parent_id?: string | null;
  children?: Category[];
}

interface Subject {
  _id?: string;
  id?: string;
  name: string;
  category_id?: any;
}

interface Topic {
  _id?: string;
  id?: string;
  name: string;
  subject_id?: string;
}

interface QuestionFormData {
  exam_names: string[];
  category_ids: string[];
  subject_ids: string[];
  topic_ids: string[];
  category_id?: string | null;
  subject_id?: string | null;
  topic_id?: string | null;
  // Optional names for initial display before API loads
  category_names?: string[];
  subject_names?: string[];
  topic_names?: string[];
  time_duration: number | null;
  difficulty_level: number;
  question_reference: string;
  question_text: string;
  question_text_hindi: string;
  option_a: string;
  option_a_hindi: string;
  option_b: string;
  option_b_hindi: string;
  option_c: string;
  option_c_hindi: string;
  option_d: string;
  option_d_hindi: string;
  option_x: string;
  option_x_hindi: string;
  answer_type: 'single' | 'multiple' | 'none';
  correct_answer: number | null;
  correct_answers: number[];
  hint: string;
  hint_hindi: string;
  explanation: string;
  explanation_hindi: string;
  question_image_url: string;
  question_video_url: string;
  option_a_image_url: string;
  option_b_image_url: string;
  option_c_image_url: string;
  option_d_image_url: string;
  option_x_image_url: string;
  hint_image_url: string;
  explanation_image_url: string;
}

interface QuestionFormProps {
  initialData?: QuestionFormData & { _id?: string };
  onSubmit: (data: QuestionFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const QuestionForm = ({ initialData, onSubmit, onCancel, loading }: QuestionFormProps) => {
  const renderCount = useRef(0);
  renderCount.current++;
  const lastInitializedId = useRef<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [allCategoriesFlat, setAllCategoriesFlat] = useState<Array<{ id: string; name: string; icon?: string }>>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showHindi, setShowHindi] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState(0); // Force re-render when data loads
  // Store initial names for display before API loads
  const [initialCategoryName, setInitialCategoryName] = useState<string>('');
  const [initialSubjectName, setInitialSubjectName] = useState<string>('');
  const [initialTopicName, setInitialTopicName] = useState<string>('');

  const [formData, setFormData] = useState<QuestionFormData>({
    exam_names: [],
    category_ids: [],
    subject_ids: [],
    topic_ids: [],
    category_id: null,
    subject_id: null,
    topic_id: null,
    time_duration: null,
    difficulty_level: 5,
    question_reference: '',
    question_text: '',
    question_text_hindi: '',
    option_a: '',
    option_a_hindi: '',
    option_b: '',
    option_b_hindi: '',
    option_c: '',
    option_c_hindi: '',
    option_d: '',
    option_d_hindi: '',
    option_x: '',
    option_x_hindi: '',
    answer_type: 'single',
    correct_answer: 0,
    correct_answers: [],
    hint: '',
    hint_hindi: '',
    explanation: '',
    explanation_hindi: '',
    question_image_url: '',
    question_video_url: '',
    option_a_image_url: '',
    option_b_image_url: '',
    option_c_image_url: '',
    option_d_image_url: '',
    option_x_image_url: '',
    hint_image_url: '',
    explanation_image_url: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (initialData) {
      const currentId = initialData._id || 'new';
      if (lastInitializedId.current === currentId && currentId !== 'new') {
        return;
      }
      lastInitializedId.current = currentId;

      setFormData({
        exam_names: initialData.exam_names || [],
        category_ids: initialData.category_ids || [],
        subject_ids: initialData.subject_ids || [],
        topic_ids: initialData.topic_ids || [],
        category_id: initialData.category_id || (initialData.category_ids?.[0] || null),
        subject_id: initialData.subject_id || (initialData.subject_ids?.[0] || null),
        topic_id: initialData.topic_id || (initialData.topic_ids?.[0] || null),
        time_duration: initialData.time_duration ?? null,
        difficulty_level: initialData.difficulty_level || 5,
        question_reference: initialData.question_reference || '',
        question_text: initialData.question_text || '',
        question_text_hindi: initialData.question_text_hindi || '',
        option_a: initialData.option_a || '',
        option_a_hindi: initialData.option_a_hindi || '',
        option_b: initialData.option_b || '',
        option_b_hindi: initialData.option_b_hindi || '',
        option_c: initialData.option_c || '',
        option_c_hindi: initialData.option_c_hindi || '',
        option_d: initialData.option_d || '',
        option_d_hindi: initialData.option_d_hindi || '',
        option_x: initialData.option_x || '',
        option_x_hindi: initialData.option_x_hindi || '',
        answer_type: initialData.answer_type || 'single',
        correct_answer: initialData.correct_answer ?? 0,
        correct_answers: initialData.correct_answers || [],
        hint: initialData.hint || '',
        hint_hindi: initialData.hint_hindi || '',
        explanation: initialData.explanation || '',
        explanation_hindi: initialData.explanation_hindi || '',
        question_image_url: initialData.question_image_url || '',
        question_video_url: initialData.question_video_url || '',
        option_a_image_url: initialData.option_a_image_url || '',
        option_b_image_url: initialData.option_b_image_url || '',
        option_c_image_url: initialData.option_c_image_url || '',
        option_d_image_url: initialData.option_d_image_url || '',
        option_x_image_url: initialData.option_x_image_url || '',
        hint_image_url: initialData.hint_image_url || '',
        explanation_image_url: initialData.explanation_image_url || '',
      });

      // Auto-enable Hindi toggle if question has any Hindi content
      const hasHindiContent = !!(
        initialData.question_text_hindi?.trim() ||
        initialData.option_a_hindi?.trim() ||
        initialData.option_b_hindi?.trim() ||
        initialData.option_c_hindi?.trim() ||
        initialData.option_d_hindi?.trim() ||
        initialData.option_x_hindi?.trim() ||
        initialData.hint_hindi?.trim() ||
        initialData.explanation_hindi?.trim()
      );
      setShowHindi(hasHindiContent);

      // Store initial names for display before API loads
      setInitialCategoryName(initialData.category_names?.[0] || '');
      setInitialSubjectName(initialData.subject_names?.[0] || '');
      setInitialTopicName(initialData.topic_names?.[0] || '');
    }
  }, [initialData]);



  const normalizeArrayData = (data: any, fieldName: string): any[] => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data[fieldName])) return data[fieldName];
    if (data && data.data && Array.isArray(data.data)) return data.data;
    return [];
  };



  const fetchData = async () => {
    setDataLoading(true);
    setDataError(null);
    try {
      const [catsData, topsData, subsData] = await Promise.all([
        categoriesAPI.getAll(true),
        topicsAPI.getAll(undefined, 1, 1000),
        subjectsAPI.getAll(undefined, 1, 1000), // Fetch all subjects with high limit
      ]);
      const normalizedCats = normalizeArrayData(catsData, 'categories');
      const normalizedTopics = normalizeArrayData(topsData, 'topics');
      const normalizedSubjects = normalizeArrayData(subsData, 'subjects');

      setCategories(normalizedCats);
      setTopics(normalizedTopics);
      setSubjects(normalizedSubjects);

      // Flatten categories
      const flat: Array<{ id: string; name: string; icon?: string }> = [];
      const flatten = (cats: Category[]) => {
        cats.forEach(cat => {
          flat.push({
            id: String(cat._id || cat.id),
            name: cat.name,
            icon: cat.icon,
          });
          if (cat.children && cat.children.length > 0) {
            flatten(cat.children);
          }
        });
      };
      flatten(catsData || []);
      setAllCategoriesFlat(flat);

      if (!catsData || catsData.length === 0) {
        toast.warning('No categories found');
      }
      if (!subsData || subsData.length === 0) {
        toast.warning('No subjects found');
      }
      if (!topsData || topsData.length === 0) {
        toast.warning('No topics found');
      }
    } catch (error: any) {
      console.error('Failed to load form data:', error);
      setDataError(error.message || 'Failed to load data');
      toast.error('Failed to load form data: ' + (error.message || 'Unknown error'));
    } finally {
      setDataLoading(false);
      setDataVersion(v => v + 1); // Force re-render so Select picks up new options
    }
  };

  // Client-side filtering for subjects and topics for instant performance
  const availableSubjects = useMemo(() => {
    const selectedCatId = formData.category_ids[0];
    if (!selectedCatId || selectedCatId === 'none') return subjects;
    return subjects.filter(subject => {
      const catId = typeof subject.category_id === 'object'
        ? String((subject.category_id as any)._id || (subject.category_id as any).id)
        : String(subject.category_id);
      return catId === selectedCatId;
    });
  }, [subjects, formData.category_ids]);

  const filteredTopics = formData.subject_ids.length > 0
    ? topics.filter(topic => {
      const subId = topic.subject_id;
      if (!subId) return false;
      const topicSubId = typeof subId === 'object'
        ? String((subId as any)._id || (subId as any).id)
        : String(subId);
      return formData.subject_ids.some(sid => String(sid) === topicSubId);
    })
    : topics; // If no subject selected, show all (or keep as [] if you prefer strict filtering)


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Helper function to check if a string is not empty
    const isNotEmpty = (str: string) => str && str.trim().length > 0;

    // Validate that at least English or Hindi question text is provided
    if (!isNotEmpty(formData.question_text) && !isNotEmpty(formData.question_text_hindi)) {
      toast.error('Please provide question text in English or Hindi (or both)');
      return;
    }

    // Validate that at least English or Hindi options are provided
    const hasEnglishOptions = isNotEmpty(formData.option_a) || isNotEmpty(formData.option_b) ||
      isNotEmpty(formData.option_c) || isNotEmpty(formData.option_d);
    const hasHindiOptions = isNotEmpty(formData.option_a_hindi) || isNotEmpty(formData.option_b_hindi) ||
      isNotEmpty(formData.option_c_hindi) || isNotEmpty(formData.option_d_hindi);

    if (!hasEnglishOptions && !hasHindiOptions) {
      toast.error('Please provide at least one option in English or Hindi');
      return;
    }

    // If English options are provided, all 4 should be filled
    if (hasEnglishOptions) {
      if (!isNotEmpty(formData.option_a) || !isNotEmpty(formData.option_b) ||
        !isNotEmpty(formData.option_c) || !isNotEmpty(formData.option_d)) {
        toast.error('Please fill all 4 options (A, B, C, D) in English');
        return;
      }
    }

    // If Hindi options are provided, all 4 should be filled
    if (hasHindiOptions) {
      if (!isNotEmpty(formData.option_a_hindi) || !isNotEmpty(formData.option_b_hindi) ||
        !isNotEmpty(formData.option_c_hindi) || !isNotEmpty(formData.option_d_hindi)) {
        toast.error('Please fill all 4 options (A, B, C, D) in Hindi');
        return;
      }
    }

    // Exam Category is now optional, so we don't validate it

    // Validate correct answer based on answer_type
    if (formData.answer_type === 'single') {
      if (formData.correct_answer === null || formData.correct_answer === undefined) {
        toast.error('Please select a correct answer for single answer type');
        return;
      }
    } else if (formData.answer_type === 'multiple') {
      if (!formData.correct_answers || formData.correct_answers.length === 0) {
        toast.error('Please select at least one correct answer for multiple answer type');
        return;
      }
    }
    // 'none' type doesn't require any correct answer

    await onSubmit(formData);
  };

  const handleAiSuggest = async () => {
    setAiLoading(true);
    try {
      let contextSubject = 'General';
      let contextTopic = 'General Topic';

      if (formData.subject_ids[0]) {
        const sub = subjects.find(s => (s._id || s.id)?.toString() === formData.subject_ids[0]);
        if (sub) contextSubject = sub.name;
      }
      if (formData.topic_ids[0]) {
        const top = topics.find(t => (t._id || t.id)?.toString() === formData.topic_ids[0]);
        if (top) contextTopic = top.name;
      }

      const response = await aiAPI.generate({
        type: 'questions',
        context: {
          subject: contextSubject,
          topic: contextTopic,
          difficulty: formData.difficulty_level || 5
        },
        count: 1
      });

      if (response && response.questions && response.questions.length > 0) {
        const generated = response.questions[0];
        setFormData(prev => ({
          ...prev,
          question_text: generated.question_text || prev.question_text,
          option_a: generated.option_a || prev.option_a,
          option_b: generated.option_b || prev.option_b,
          option_c: generated.option_c || prev.option_c,
          option_d: generated.option_d || prev.option_d,
          correct_answer: generated.correct_answer !== undefined ? generated.correct_answer : prev.correct_answer,
          explanation: generated.explanation || prev.explanation,
        }));
        toast.success('AI successfully suggested a question!');
      } else {
        toast.error('AI failed to suggest a valid question');
      }
    } catch (err: any) {
      toast.error(err.message || 'AI generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const options = [
    { key: 'a', label: 'A', field: 'option_a', hindiField: 'option_a_hindi' },
    { key: 'b', label: 'B', field: 'option_b', hindiField: 'option_b_hindi' },
    { key: 'c', label: 'C', field: 'option_c', hindiField: 'option_c_hindi' },
    { key: 'd', label: 'D', field: 'option_d', hindiField: 'option_d_hindi' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="rounded-2xl border border-border/70 bg-card/50">
        <CardContent className="p-6 space-y-6">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-base font-semibold">Basic Information</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAiSuggest}
                disabled={aiLoading}
                className="bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
              >
                {aiLoading ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Bot className="h-3 w-3 mr-2" />}
                Auto-fill Question via AI
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Exam Category (Optional)</Label>
                <Select value={formData.category_ids[0] || undefined} onValueChange={(val) => {
                  if (val === 'none') {
                    setFormData(prev => ({
                      ...prev,
                      category_ids: [],
                      category_id: null,
                      exam_names: []
                    }));
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      category_ids: [val],
                      category_id: val,
                      exam_names: [allCategoriesFlat.find(c => c.id === val)?.name || '']
                    }));
                  }
                }}>
                  <SelectTrigger id="category" className="rounded-xl">
                    <SelectValue placeholder="Select exam category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {allCategoriesFlat.map(cat => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.icon && <span className="mr-2">{cat.icon}</span>}
                        {cat.name}
                      </SelectItem>
                    ))}
                    {/* Fallback: Show selected category even if not in loaded list (during edit) */}
                    {formData.category_ids[0] && !allCategoriesFlat.find(c => String(c.id) === String(formData.category_ids[0])) && (
                      <SelectItem key={formData.category_ids[0]} value={formData.category_ids[0]}>
                        {initialCategoryName || '(Loading...)'}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level *</Label>
                <Select
                  value={formData.difficulty_level.toString()}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, difficulty_level: parseInt(val) }))}
                >
                  <SelectTrigger id="difficulty" className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                      <SelectItem key={level} value={level.toString()}>
                        Level {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject (Optional)</Label>
                <Select
                  value={formData.subject_ids[0] || undefined}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, subject_ids: val ? [val] : [], subject_id: val || null, topic_ids: [], topic_id: null }))}
                >
                  <SelectTrigger id="subject" className="rounded-xl">
                    <SelectValue placeholder="Select subject (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataLoading && (
                      <div className="py-6 px-2 text-center text-sm text-muted-foreground">
                        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Loading subjects...
                      </div>
                    )}
                    {!dataLoading && dataError && (
                      <div className="py-6 px-2 text-center text-sm text-red-500">
                        Error: {dataError}
                      </div>
                    )}
                    {!dataLoading && !dataError && availableSubjects.length === 0 && (
                      <div className="py-6 px-2 text-center text-sm text-muted-foreground">
                        No subjects available<br />
                        <span className="text-xs">Please create subjects in Admin → Subjects</span>
                      </div>
                    )}
                    {!dataLoading && availableSubjects.map(sub => (
                      <SelectItem key={String(sub._id || sub.id)} value={String(sub._id || sub.id)}>
                        {sub.name}
                      </SelectItem>
                    ))}
                    {/* Fallback: Show selected subject even if not in loaded list (during edit) */}
                    {formData.subject_ids[0] && !availableSubjects.find(s => String(s._id || s.id) === String(formData.subject_ids[0])) && (
                      <SelectItem key={formData.subject_ids[0]} value={formData.subject_ids[0]}>
                        {initialSubjectName || '(Loading...)'}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">
                  Topic {formData.subject_ids.length > 0 && <span className="text-muted-foreground text-xs">(Required for Basic to Advance)</span>}
                </Label>
                <Select
                  value={formData.topic_ids[0] || undefined}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, topic_ids: val ? [val] : [], topic_id: val || null }))}
                  disabled={formData.subject_ids.length === 0}
                >
                  <SelectTrigger id="topic" className="rounded-xl">
                    <SelectValue placeholder={formData.subject_ids.length > 0 ? "Select topic" : "Select subject first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {dataLoading && (
                      <div className="py-6 px-2 text-center text-sm text-muted-foreground">
                        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Loading topics...
                      </div>
                    )}
                    {!dataLoading && dataError && (
                      <div className="py-6 px-2 text-center text-sm text-red-500">
                        Error: {dataError}
                      </div>
                    )}
                    {!dataLoading && !dataError && filteredTopics.length === 0 && formData.subject_ids.length > 0 && (
                      <div className="py-6 px-2 text-center text-sm text-muted-foreground">
                        No topics available for this subject.<br />
                        <span className="text-xs">Please create topics in Admin → Topics</span>
                      </div>
                    )}
                    {!dataLoading && filteredTopics.map(topic => (
                      <SelectItem key={String(topic._id || topic.id)} value={String(topic._id || topic.id)}>
                        {topic.name}
                      </SelectItem>
                    ))}
                    {/* Fallback: Show selected topic even if not in filtered list (during edit) */}
                    {formData.topic_ids[0] && !filteredTopics.find(t => String(t._id || t.id) === String(formData.topic_ids[0])) && (
                      <SelectItem key={formData.topic_ids[0]} value={formData.topic_ids[0]}>
                        {initialTopicName || '(Loading...)'}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {formData.subject_ids.length > 0 && !formData.topic_ids[0] && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Selecting a topic is recommended for questions to appear in Basic to Advance levels
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="time_duration">Time Duration (seconds, Optional)</Label>
                <Input
                  id="time_duration"
                  type="number"
                  value={formData.time_duration || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, time_duration: e.target.value ? parseInt(e.target.value) : null }))}
                  placeholder="60"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="question_reference">Reference (Optional)</Label>
                <Input
                  id="question_reference"
                  value={formData.question_reference}
                  onChange={(e) => setFormData(prev => ({ ...prev, question_reference: e.target.value }))}
                  placeholder="e.g., PYQ 2023"
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Question Text Section */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-base font-semibold">Question Text *</h3>
              <div className="flex items-center gap-2">
                <Switch id="hindi-mode" checked={showHindi} onCheckedChange={setShowHindi} />
                <Label htmlFor="hindi-mode" className="cursor-pointer font-medium text-sm">Add Hindi Translation</Label>
              </div>
            </div>

            <div className={`grid grid-cols-1 ${showHindi ? 'md:grid-cols-2' : ''} gap-4`}>
              <div className="space-y-2">
                <Label htmlFor="question_text">English (Optional)</Label>
                <MathInput
                  value={formData.question_text}
                  onChange={(val) => setFormData(prev => ({ ...prev, question_text: val }))}
                  placeholder="Enter question in English (optional). Use $...$ for math."
                />
                <p className="text-xs text-muted-foreground">Fill English or Hindi (or both)</p>
              </div>
              {showHindi && (
                <div className="space-y-2">
                  <Label htmlFor="question_text_hindi">Hindi (Optional)</Label>
                  <MathInput
                    value={formData.question_text_hindi}
                    onChange={(val) => setFormData(prev => ({ ...prev, question_text_hindi: val }))}
                    placeholder="Enter question in Hindi (optional). Use $...$ for math."
                  />
                  <p className="text-xs text-muted-foreground">Fill Hindi or English (or both)</p>
                </div>
              )}
            </div>

            {/* Question Image & Video */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="question_image_url">Question Image (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="question_image_url"
                    value={formData.question_image_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, question_image_url: e.target.value }))}
                    placeholder="https://example.com/image.jpg or upload file"
                    className="rounded-xl"
                  />
                  <input
                    type="file"
                    id="question_image_upload"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      // Validate file size (5MB)
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error('Image size must be less than 5MB');
                        return;
                      }

                      // Validate file type
                      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
                      if (!allowedTypes.includes(file.type)) {
                        toast.error('Only image files are allowed (jpeg, jpg, png, gif, webp, svg)');
                        return;
                      }

                      setUploadingImage(true);
                      try {
                        const result = await uploadAPI.uploadQuestionImage(file);
                        setFormData(prev => ({ ...prev, question_image_url: result.url }));
                        toast.success('Image uploaded successfully');
                      } catch (error: any) {
                        toast.error(error.message || 'Failed to upload image');
                      } finally {
                        setUploadingImage(false);
                        // Reset input
                        e.target.value = '';
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => document.getElementById('question_image_upload')?.click()}
                    disabled={uploadingImage}
                    className="rounded-xl"
                    title="Upload image"
                  >
                    {uploadingImage ? (
                      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                  {formData.question_image_url && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setFormData(prev => ({ ...prev, question_image_url: '' }))}
                      className="rounded-xl"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {formData.question_image_url && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-border/50">
                    <img
                      src={formData.question_image_url}
                      alt="Question preview"
                      className="w-full h-32 object-contain bg-muted"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  Paste image URL or click upload button to upload image
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="question_video_url">Question Video URL (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="question_video_url"
                    value={formData.question_video_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, question_video_url: e.target.value }))}
                    placeholder="https://example.com/video.mp4"
                    className="rounded-xl"
                  />
                  {formData.question_video_url && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setFormData(prev => ({ ...prev, question_video_url: '' }))}
                      className="rounded-xl"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {formData.question_video_url && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-border/50">
                    <video
                      src={formData.question_video_url}
                      className="w-full h-32 object-contain bg-muted"
                      controls
                      onError={(e) => {
                        (e.target as HTMLVideoElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Video className="h-3 w-3" />
                  Paste video URL (MP4, WebM, etc.)
                </p>
              </div>
            </div>
          </div>

          {/* Options Section */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold">Options (Optional)</h3>
              </div>

              {/* Answer Type Selector */}
              <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-xl border border-border/50">
                <Label className="text-sm font-semibold text-foreground">Answer Type:</Label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={formData.answer_type === 'single' ? 'default' : 'outline'}
                    onClick={() => setFormData(prev => ({ ...prev, answer_type: 'single', correct_answer: null, correct_answers: [] }))}
                    className={`text-xs ${formData.answer_type === 'single' ? 'bg-green-600' : ''}`}
                  >
                    ✓ Single
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={formData.answer_type === 'multiple' ? 'default' : 'outline'}
                    onClick={() => setFormData(prev => ({ ...prev, answer_type: 'multiple', correct_answer: null, correct_answers: [] }))}
                    className={`text-xs ${formData.answer_type === 'multiple' ? 'bg-blue-600' : ''}`}
                  >
                    ✓✓ Multiple
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={formData.answer_type === 'none' ? 'default' : 'outline'}
                    onClick={() => setFormData(prev => ({ ...prev, answer_type: 'none', correct_answer: null, correct_answers: [] }))}
                    className={`text-xs ${formData.answer_type === 'none' ? 'bg-gray-600' : ''}`}
                  >
                    ✗ None
                  </Button>
                </div>
              </div>
            </div>

            {/* Answer Type Description */}
            <div className="p-3 rounded-xl bg-muted/50 border border-border/30">
              {formData.answer_type === 'single' && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Single Answer:</span> Select one correct option from A, B, C, D, or X.
                </p>
              )}
              {formData.answer_type === 'multiple' && (
                <p className="text-xs text-blue-600 font-medium">
                  ✓✓ Multiple Answers Mode: You can select multiple correct options (A, B, C, D together!)
                </p>
              )}
              {formData.answer_type === 'none' && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">No Answer:</span> This question has no correct answer (e.g., survey or opinion question).
                </p>
              )}
              {/* Debug Status */}
              <p className="text-[10px] text-gray-400 mt-1">
                Current Mode: {formData.answer_type} | Selected: {formData.correct_answers?.length || 0} answers
              </p>
            </div>

            <div className="space-y-4">
              {options.map((opt, idx) => {
                const optionImageField = `${opt.field}_image_url` as keyof QuestionFormData;
                const optionImageUrl = formData[optionImageField] as string;

                // Determine if this option is marked correct based on answer type
                const correctAnswersArray = formData.correct_answers || [];
                const isCorrect = formData.answer_type === 'single'
                  ? formData.correct_answer === idx
                  : formData.answer_type === 'multiple'
                    ? correctAnswersArray.includes(idx)
                    : false;

                const handleToggleCorrect = () => {
                  if (formData.answer_type === 'single') {
                    setFormData(prev => ({ ...prev, correct_answer: idx }));
                  } else if (formData.answer_type === 'multiple') {
                    setFormData(prev => {
                      const currentAnswers = prev.correct_answers || [];
                      const newAnswers = currentAnswers.includes(idx)
                        ? currentAnswers.filter(a => a !== idx)
                        : [...currentAnswers, idx];
                      return { ...prev, correct_answers: newAnswers };
                    });
                  }
                };

                return (
                  <div key={opt.key} className={`space-y-2 p-4 border rounded-xl bg-muted/30 transition-colors ${isCorrect ? 'border-green-500/50 bg-green-50/30' : 'border-border/50'}`}>
                    <div className="flex items-center justify-between">
                      <Label htmlFor={opt.field} className="font-medium">
                        Option {opt.label} (Optional)
                      </Label>
                      {formData.answer_type !== 'none' && (
                        <Button
                          type="button"
                          variant={isCorrect ? 'default' : 'outline'}
                          size="sm"
                          onClick={handleToggleCorrect}
                          className="rounded-xl"
                        >
                          <CheckCircle2 className={`h-4 w-4 mr-1 ${isCorrect ? '' : 'opacity-50'}`} />
                          {isCorrect
                            ? (formData.answer_type === 'multiple' ? 'Selected' : 'Correct')
                            : (formData.answer_type === 'multiple' ? 'Select' : 'Mark Correct')
                          }
                        </Button>
                      )}
                    </div>
                    <div className={`grid grid-cols-1 ${showHindi ? 'md:grid-cols-2' : ''} gap-3`}>
                      <div className="space-y-1">
                        <MathInput
                          compact
                          value={formData[opt.field as keyof QuestionFormData] as string}
                          onChange={(val) => setFormData(prev => ({ ...prev, [opt.field]: val }))}
                          placeholder={`Option ${opt.label} in English (optional)`}
                        />
                        <p className="text-xs text-muted-foreground">English (optional)</p>
                      </div>
                      {showHindi && (
                        <div className="space-y-1">
                          <MathInput
                            compact
                            value={formData[opt.hindiField as keyof QuestionFormData] as string}
                            onChange={(val) => setFormData(prev => ({ ...prev, [opt.hindiField]: val }))}
                            placeholder={`Option ${opt.label} in Hindi (optional)`}
                          />
                          <p className="text-xs text-muted-foreground">Hindi (optional)</p>
                        </div>
                      )}
                    </div>
                    {/* Option Image */}
                    <div className="space-y-2 pt-2 border-t border-border/30">
                      <Label className="text-sm flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Option {opt.label} Image URL (Optional)
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={optionImageUrl || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, [optionImageField]: e.target.value }))}
                          placeholder={`https://example.com/option-${opt.label.toLowerCase()}.jpg`}
                          className="rounded-xl"
                        />
                        {optionImageUrl && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setFormData(prev => ({ ...prev, [optionImageField]: '' }))}
                            className="rounded-xl"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {optionImageUrl && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-border/50">
                          <img
                            src={optionImageUrl}
                            alt={`Option ${opt.label} preview`}
                            className="w-full h-24 object-contain bg-muted"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-amber-600 mt-2">
                ⚠️ Fill all 4 options in English OR all 4 in Hindi (or both). At least one language is required.
              </p>
            </div>
          </div>

          {/* Hint Section */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-base font-semibold">Hint (Optional)</h3>
            <div className={`grid grid-cols-1 ${showHindi ? 'md:grid-cols-2' : ''} gap-3`}>
              <div className="space-y-1">
                <MathInput
                  value={formData.hint}
                  onChange={(val) => setFormData(prev => ({ ...prev, hint: val }))}
                  placeholder="Enter hint in English (optional)..."
                />
                <p className="text-xs text-muted-foreground">English (optional)</p>
              </div>
              {showHindi && (
                <div className="space-y-1">
                  <MathInput
                    value={formData.hint_hindi}
                    onChange={(val) => setFormData(prev => ({ ...prev, hint_hindi: val }))}
                    placeholder="Enter hint in Hindi (optional)..."
                  />
                  <p className="text-xs text-muted-foreground">Hindi (optional)</p>
                </div>
              )}
            </div>
            {/* Hint Image */}
            <div className="space-y-2 pt-2">
              <Label className="text-sm flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Hint Image URL (Optional)
              </Label>
              <div className="flex gap-2">
                <Input
                  value={formData.hint_image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, hint_image_url: e.target.value }))}
                  placeholder="https://example.com/hint-image.jpg"
                  className="rounded-xl"
                />
                {formData.hint_image_url && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setFormData(prev => ({ ...prev, hint_image_url: '' }))}
                    className="rounded-xl"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {formData.hint_image_url && (
                <div className="mt-2 rounded-lg overflow-hidden border border-border/50">
                  <img
                    src={formData.hint_image_url}
                    alt="Hint preview"
                    className="w-full h-24 object-contain bg-muted"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Explanation Section */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-base font-semibold">Explanation (Optional)</h3>
            <div className={`grid grid-cols-1 ${showHindi ? 'md:grid-cols-2' : ''} gap-3`}>
              <div className="space-y-1">
                <MathInput
                  value={formData.explanation}
                  onChange={(val) => setFormData(prev => ({ ...prev, explanation: val }))}
                  placeholder="Enter explanation in English..."
                />
                <p className="text-xs text-muted-foreground">English (optional)</p>
              </div>
              {showHindi && (
                <div className="space-y-1">
                  <MathInput
                    value={formData.explanation_hindi}
                    onChange={(val) => setFormData(prev => ({ ...prev, explanation_hindi: val }))}
                    placeholder="Enter explanation in Hindi..."
                  />
                  <p className="text-xs text-muted-foreground">Hindi (optional)</p>
                </div>
              )}
            </div>
            {/* Explanation Image */}
            <div className="space-y-2 pt-2">
              <Label className="text-sm flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Explanation Image URL (Optional)
              </Label>
              <div className="flex gap-2">
                <Input
                  value={formData.explanation_image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, explanation_image_url: e.target.value }))}
                  placeholder="https://example.com/explanation-image.jpg"
                  className="rounded-xl"
                />
                {formData.explanation_image_url && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setFormData(prev => ({ ...prev, explanation_image_url: '' }))}
                    className="rounded-xl"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {formData.explanation_image_url && (
                <div className="mt-2 rounded-lg overflow-hidden border border-border/50">
                  <img
                    src={formData.explanation_image_url}
                    alt="Explanation preview"
                    className="w-full h-24 object-contain bg-muted"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" className="rounded-xl" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl px-6" disabled={loading}>
              {loading ? 'Saving...' : 'Save Question'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};
