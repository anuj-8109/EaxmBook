import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { examTreeAPI, categoriesAPI } from '@/lib/api';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  BookOpen,
  Tag,
  FileText,
  HelpCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { showError, showSuccess, showDeleteConfirm } from '@/lib/sweetalert';
import Loader from '@/components/Loader';
import { AdminPageHeading } from '@/components/AdminPageHeading';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import gsap from 'gsap';
import { Search } from 'lucide-react';


interface Question {
  id: string;
  questionText: string;
  difficulty: string;
  difficultyLevel: number;
}

interface Topic {
  topicId: string;
  topicName: string;
  description: string | null;
  questionCount: number;
  questions: Question[];
}

interface Test {
  testId: string;
  testName: string;
  description: string | null;
  durationMinutes: number;
  totalMarks: number;
  totalQuestions: number;
  questionCount: number;
  isActive: boolean;
  questions: Question[];
}

interface Subject {
  subjectId: string;
  subjectName: string;
  description: string | null;
  topics: Topic[];
  tests: Test[];
  topicCount: number;
  testCount: number;
}

interface ExamCategory {
  examName: string;
  examId: string;
  description: string | null;
  icon: string;
  children?: ExamCategory[];
  subjects: Subject[];
  subjectCount: number;
}

interface Category {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  icon?: string;
  parent_id?: string | null;
  children?: Category[];
  childrenCount?: number;
}

const ExamHierarchy = () => {
  const [examTree, setExamTree] = useState<ExamCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<{
    type: 'exam' | 'subject' | 'topic' | 'test';
    data: any;
  } | null>(null);
  const [showQuestions, setShowQuestions] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📚',
    parent_id: '',
    test_category_type: 'Other'
  });
  const [allCategoriesFlat, setAllCategoriesFlat] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState('tree');
  const [treeSearchQuery, setTreeSearchQuery] = useState('');
  const [catSearchQuery, setCatSearchQuery] = useState('');


  useEffect(() => {
    fetchExamTree();
    fetchCategories();
    fetchAllCategories();

    // Initial animation
    gsap.from('.hierarchy-card', {
      opacity: 0,
      y: 20,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power3.out'
    });
  }, []);


  const fetchExamTree = async () => {
    try {
      const data = await examTreeAPI.getTree();
      setExamTree(data || []);
      // Auto-expand first exam category
      if (data && data.length > 0) {
        setExpandedItems(new Set([data[0].examId]));
      }
    } catch (error: any) {
      console.error('Exam tree fetch error:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoriesAPI.getAll(true); // Get tree structure
      setCategories(data || []);
      // Auto-expand root categories
      if (data && data.length > 0) {
        const rootIds = data.map(cat => cat._id || cat.id).filter(Boolean) as string[];
        setExpandedItems(prev => {
          const newSet = new Set(prev);
          rootIds.forEach(id => newSet.add(id));
          return newSet;
        });
      }
    } catch (error: any) {
      showError('Failed to load categories', error.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCategories = async () => {
    try {
      const data = await categoriesAPI.getAll(false);
      setAllCategoriesFlat(data || []);
    } catch (error) {
      console.error('Failed to fetch all categories:', error);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await categoriesAPI.update(editingId, {
          ...formData,
          parent_id: formData.parent_id || null
        });
        showSuccess('Category updated successfully!');
      } else {
        await categoriesAPI.create({
          ...formData,
          parent_id: formData.parent_id || null
        });
        showSuccess('Category added successfully!');
      }
      setShowAddModal(false);
      setEditingId(null);
      setFormData({ name: '', description: '', icon: '📚', parent_id: '', test_category_type: 'Other' });
      fetchCategories();
      fetchAllCategories();
      fetchExamTree();
    } catch (error: any) {
      showError('Failed to save category', error.message || 'Unknown error');
    }
  };

  const handleEditCategory = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '📚',
      parent_id: category.parent_id || '',
      test_category_type: 'Other'
    });
    setEditingId(category._id || category.id || null);
    setShowAddModal(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const result = await showDeleteConfirm('this category');
    if (!result.isConfirmed) return;

    try {
      await categoriesAPI.delete(categoryId);
      showSuccess('Category deleted successfully!');
      fetchCategories();
      fetchAllCategories();
      fetchExamTree();
    } catch (error: any) {
      showError('Failed to delete category', error.message || 'Unknown error');
    }
  };

  const flattenCategories = (cats: Category[]): Category[] => {
    const result: Category[] = [];
    const flatten = (items: Category[]) => {
      items.forEach(item => {
        result.push(item);
        if (item.children) flatten(item.children);
      });
    };
    flatten(cats);
    return result;
  };

  const getChildrenCount = (category: Category): number => {
    if (!category.children || category.children.length === 0) return 0;
    return category.children.length;
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleQuestions = (id: string) => {
    setShowQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const collectIds = (nodes: ExamCategory[], set: Set<string>) => {
    nodes.forEach(exam => {
      set.add(exam.examId);
      if (exam.children && exam.children.length > 0) {
        collectIds(exam.children, set);
      }
      exam.subjects?.forEach(subject => {
        set.add(subject.subjectId);
        subject.topics.forEach(topic => set.add(topic.topicId));
        subject.tests.forEach(test => set.add(test.testId));
      });
    });
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    collectIds(examTree, allIds);
    setExpandedItems(allIds);
  };

  const collapseAll = () => {
    setExpandedItems(new Set());
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'hard':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    }
  };

  const filterTree = (nodes: ExamCategory[], query: string): ExamCategory[] => {
    if (!query) return nodes;
    const lowerQuery = query.toLowerCase();

    return nodes.filter(node => {
      const nameMatch = node.examName.toLowerCase().includes(lowerQuery);
      const subjectMatch = node.subjects?.some(s => s.subjectName.toLowerCase().includes(lowerQuery));
      const childMatch = node.children && filterTree(node.children, query).length > 0;

      return nameMatch || subjectMatch || childMatch;
    });
  };

  const filterCategories = (nodes: Category[], query: string): Category[] => {
    if (!query) return nodes;
    const lowerQuery = query.toLowerCase();

    return nodes.filter(node => {
      const nameMatch = node.name.toLowerCase().includes(lowerQuery);
      const childMatch = node.children && filterCategories(node.children, query).length > 0;
      return nameMatch || childMatch;
    });
  };


  const renderSubjects = (subjects: Subject[], baseIndent = 0) => {
    return (
      <div className="bg-muted/10 border-t border-border/50">
        {subjects.map((subject) => (
          <div key={subject.subjectId} className="border-b border-border/30 last:border-b-0">
            {/* Subject */}
            <Collapsible
              open={expandedItems.has(subject.subjectId)}
              onOpenChange={() => toggleExpand(subject.subjectId)}
            >
              <CollapsibleTrigger className="w-full">
                <div className={`flex items-center gap-1.5 py-1.5 px-2 hover:bg-primary/5 transition-all cursor-pointer group ${selectedItem?.type === 'subject' && selectedItem.data.subjectId === subject.subjectId ? 'bg-primary/10 border-l-2 border-primary' : ''
                  }`}
                  style={{ paddingLeft: Math.max(20, 20 + baseIndent) }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItem({ type: 'subject', data: subject });
                  }}
                >
                  <div className="w-3 flex justify-center">
                    {expandedItems.has(subject.subjectId) ? (
                      <ChevronDown className="h-2.5 w-2.5 text-muted-foreground group-hover:text-primary" />
                    ) : (
                      <ChevronRight className="h-2.5 w-2.5 text-muted-foreground group-hover:text-primary" />
                    )}
                  </div>
                  <div className="w-5 h-5 rounded-md bg-blue-500/10 flex items-center justify-center">
                    <BookOpen className="h-2.5 w-2.5 text-blue-500" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-[12px] font-semibold text-slate-800 leading-tight">{subject.subjectName}</div>
                    <div className="text-[8px] text-muted-foreground flex items-center gap-1.5">
                      <span className="flex items-center gap-0.5"><Tag className="h-2 w-2" /> {subject.topicCount} Topics</span>
                      <span className="flex items-center gap-0.5"><FileText className="h-2 w-2" /> {subject.testCount} Tests</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-0 rounded h-4 px-1 text-[8px]">
                    {subject.topicCount + subject.testCount}
                  </Badge>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="bg-white/50 py-0.5">
                  {/* Topics */}
                  {subject.topics.length > 0 && (
                    <div className="pl-3 border-l border-slate-200 ml-10 my-1.5 space-y-1">
                      {subject.topics.map((topic) => (
                        <div key={topic.topicId} className="group">
                          <Collapsible
                            open={expandedItems.has(topic.topicId)}
                            onOpenChange={() => toggleExpand(topic.topicId)}
                          >
                            <CollapsibleTrigger className="w-full">
                                <div
                                  className={`flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-orange-50 transition-all cursor-pointer mr-1 ${selectedItem?.type === 'topic' && selectedItem.data.topicId === topic.topicId ? 'bg-orange-50 border border-orange-100' : ''
                                    }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedItem({ type: 'topic', data: topic });
                                  }}
                                >
                                  {expandedItems.has(topic.topicId) ? (
                                    <ChevronDown className="h-2 w-2 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-2 w-2 text-muted-foreground" />
                                  )}
                                  <Tag className="h-2.5 w-2.5 text-orange-500" />
                                  <div className="flex-1 text-left">
                                    <div className="text-[12px] font-medium text-slate-700 leading-tight">{topic.topicName}</div>
                                  </div>
                                  <Badge variant="outline" className="h-4 text-[8px] px-0.5 border-orange-100 text-orange-600 bg-orange-50/50">
                                    {topic.questionCount}
                                  </Badge>
                                </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="pl-6 py-1 pr-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 text-[9px] text-muted-foreground hover:text-primary mb-1"
                                  onClick={() => toggleQuestions(topic.topicId)}
                                >
                                  {showQuestions.has(topic.topicId) ? 'Hide Preview' : `Preview (${Math.min(topic.questions.length, 3)})`}
                                </Button>
                                {showQuestions.has(topic.topicId) && (
                                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                                    {topic.questions.slice(0, 3).map((q, idx) => (
                                      <div key={q.id} className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[10px]">
                                        <div className="flex justify-between items-start gap-3">
                                          <span className="text-slate-600 line-clamp-1">Q{idx + 1}: {q.questionText}</span>
                                          <Badge className={`h-3.5 text-[8px] ${getDifficultyColor(q.difficulty)}`}>{q.difficulty}</Badge>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tests */}
                  {subject.tests.length > 0 && (
                    <div className="pl-3 border-l border-slate-200 ml-10 my-1.5 space-y-1">
                      {subject.tests.map((test) => (
                        <div key={test.testId}>
                          <div
                            className={`flex items-center gap-2 p-1.5 rounded-lg hover:bg-purple-50 transition-all cursor-pointer mr-1.5 border border-transparent ${selectedItem?.type === 'test' && selectedItem.data.testId === test.testId ? 'bg-purple-50 border-purple-200' : ''
                              }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem({ type: 'test', data: test });
                            }}
                          >
                            <div className="w-5 h-5 rounded bg-purple-100 flex items-center justify-center">
                              <FileText className="h-2.5 w-2.5 text-purple-600" />
                            </div>
                            <div className="flex-1 text-left">
                              <div className="text-[13px] font-medium text-slate-700">{test.testName}</div>
                              <div className="text-[9px] text-muted-foreground">
                                {test.durationMinutes}m • {test.totalMarks}M • {test.questionCount}Qs
                              </div>
                            </div>
                            {!test.isActive && <Badge variant="secondary" className="h-3.5 text-[8px] px-1 bg-slate-100 text-slate-500">Draft</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        ))}
      </div>
    );
  };



  const renderCategoryRow = (category: Category, level: number = 0) => {
    const id = category._id || category.id || '';
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedItems.has(id);
    const childrenCount = getChildrenCount(category);

    return (
      <div key={id} className={`border-b border-border/30 last:border-b-0 ${level === 0 ? 'bg-slate-50/50' : 'bg-transparent'}`}>
        <div
          className="flex items-center gap-2.5 p-2 hover:bg-slate-100 transition-all group"
          style={{ paddingLeft: Math.max(12, 12 + level * 16) }}
        >
          {/* Expand/Collapse */}
          <div className="w-5 flex justify-center">
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(id)}
                className={`p-0.5 hover:bg-white rounded transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              >
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary" />
              </button>
            ) : (
              <div className="w-3 h-3 rounded-full bg-slate-200/50" />
            )}
          </div>

          {/* Icon Box */}
          <div className="w-8 h-8 rounded-lg bg-white border border-border/50 flex items-center justify-center text-lg shadow-sm group-hover:scale-105 transition-transform">
            {category.icon || '📚'}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="font-semibold text-slate-800 text-[14px]">{category.name}</div>
            {category.description && (
              <div className="text-[10px] text-muted-foreground line-clamp-1">{category.description}</div>
            )}
          </div>

          {/* Children Badge */}
          <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-0 h-5 text-[9px]">
            {childrenCount > 0 ? `${childrenCount} sub` : 'End'}
          </Badge>

          {/* Action Buttons */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setFormData({
                  name: '',
                  description: '',
                  icon: '📚',
                  parent_id: id,
                  test_category_type: 'Other'
                });
                setEditingId(null);
                setShowAddModal(true);
              }}
              className="h-7 w-7 text-primary hover:bg-primary/10"
              title="Add Sub-category"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleEditCategory(category)}
              className="h-7 w-7 text-slate-500 hover:bg-slate-100"
              title="Edit"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleDeleteCategory(id)}
              className="h-7 w-7 text-destructive hover:bg-destructive/10"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Children Render */}
        {hasChildren && isExpanded && (
          <div className="bg-white/30 border-l-2 border-slate-100 ml-6">
            {category.children!.map(child => renderCategoryRow(child, level + 1))}
          </div>
        )}
      </div>
    );
  };


  const renderCategoryNode = (category: ExamCategory, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const hasLeafSubjects = category.subjects && category.subjects.length > 0;
    const id = category.examId;
    const isSelected = selectedItem?.type === 'exam' && selectedItem.data.examId === id;

    return (
      <div key={id} className={`hierarchy-card rounded-xl border transition-all duration-300 ${isSelected ? 'border-primary ring-1 ring-primary/20 bg-primary/5 shadow-md' : 'border-border/50 bg-white hover:border-primary/30 hover:shadow-sm'
        }`}>
        <Collapsible
          open={expandedItems.has(id)}
          onOpenChange={() => toggleExpand(id)}
        >
          <CollapsibleTrigger className="w-full">
            <div
              className={`flex items-center gap-2 py-2 px-3 cursor-pointer group`}
              style={{ paddingLeft: Math.max(8, 8 + level * 12) }}
              onClick={() => setSelectedItem({ type: 'exam', data: category })}
            >
              <div className="w-4 flex justify-center">
                {expandedItems.has(id) ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </div>
              <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-sm shadow-inner group-hover:scale-105 transition-transform">
                {category.icon || '🎓'}
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-slate-800 text-[13px] leading-tight">{category.examName}</div>
                <div className="text-[8px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
                  <span>{category.subjectCount} Subj</span>
                  {hasChildren && <span>• {category.children?.length} Levels</span>}
                </div>
              </div>
              <Badge className="bg-primary/10 text-primary border-0 rounded h-6 px-1.5 font-bold text-[10px]">
                {category.subjectCount + (category.children?.length || 0)}
              </Badge>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t border-slate-100 mt-1">
              {/* Child categories */}
              {hasChildren && (
                <div className="p-2 space-y-2">
                  {category.children?.map(child => renderCategoryNode(child, level + 1))}
                </div>
              )}

              {/* Leaf subjects */}
              {hasLeafSubjects && renderSubjects(category.subjects, level * 16)}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };


  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 max-w-[1600px] mx-auto pb-6">
        <AdminPageHeading
          eyebrow="Curriculum Builder"
          title="Exam Hierarchy"
          description="Manage the complete academic structure from parent categories to tests."
          action={
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border shadow-sm">
              <Button
                variant="outline"
                size="sm"
                onClick={expandAll}
                className="rounded-lg h-8 text-[11px] border-slate-200"
              >
                Expand All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={collapseAll}
                className="rounded-lg h-8 text-[11px] border-slate-200"
              >
                Collapse All
              </Button>
              <div className="w-[1px] h-3 bg-slate-200 mx-1" />
              <Button
                onClick={() => {
                  setFormData({ name: '', description: '', icon: '📚', parent_id: '', test_category_type: 'Other' });
                  setEditingId(null);
                  setShowAddModal(true);
                }}
                size="sm"
                className="rounded-lg h-8 bg-primary hover:bg-primary/90 text-white shadow-primary text-[11px]"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Category
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center justify-between bg-white p-2 rounded-xl border shadow-sm mb-4">
                <TabsList className="bg-slate-100/50 p-1 rounded-lg h-9">
                  <TabsTrigger value="tree" className="rounded-md px-4 py-1.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 mr-1.5 text-primary" />
                    View Hierarchy
                  </TabsTrigger>
                  <TabsTrigger value="manage" className="rounded-md px-4 py-1.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <Edit className="h-3.5 w-3.5 mr-1.5 text-primary" />
                    Manage Categories
                  </TabsTrigger>
                </TabsList>

                <div className="relative w-64 group">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder={activeTab === 'tree' ? "Search Hierarchy..." : "Search Categories..."}
                    className="pl-9 h-8.5 text-xs border-slate-200 rounded-lg focus:ring-primary/10 transition-all"
                    value={activeTab === 'tree' ? treeSearchQuery : catSearchQuery}
                    onChange={(e) => activeTab === 'tree' ? setTreeSearchQuery(e.target.value) : setCatSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <TabsContent value="manage" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-400">
                <Card className="border border-border/70 rounded-[1.5rem] shadow-xl overflow-hidden">
                  {/* <CardHeader className="bg-slate-50/50 border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                             <Folder className="h-4 w-4 text-primary" />
                             Category Architect
                          </CardTitle>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Build and organize your exam structure.</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            fetchCategories();
                            fetchAllCategories();
                          }}
                          className="h-8 rounded-lg"
                        >
                          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
                        </Button>
                      </div>
                    </CardHeader> */}
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-320px)]">
                      {categories.length === 0 ? (
                        <div className="text-center py-24">
                          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Folder className="h-10 w-10 text-slate-300" />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-800">No categories found</h3>
                          <p className="text-muted-foreground max-w-sm mx-auto mt-2 text-sm">Start building your hierarchy by adding a root category.</p>
                          <Button
                            onClick={() => setShowAddModal(true)}
                            className="mt-6 rounded-xl px-8"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Root Category
                          </Button>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {filterCategories(categories, catSearchQuery).map(category => renderCategoryRow(category, 0))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tree" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-400">
                <Card className="border border-border/70 rounded-[1.5rem] shadow-xl overflow-hidden bg-slate-50/20">
                  {/* <CardHeader className="bg-slate-50/50 border-b">
                       <div className="flex items-center justify-between">
                         <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            Hierarchical Map
                          </CardTitle>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Explore Subjects, Topics, and Tests across all categories.</p>
                         </div>
                         <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={fetchExamTree}
                          className="h-8 rounded-lg"
                        >
                          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Sync Tree
                        </Button>
                       </div>
                    </CardHeader> */}
                  <CardContent className="p-4">
                    <ScrollArea className="h-[calc(100vh-320px)] pr-2">
                      {examTree.length === 0 ? (
                        <div className="text-center py-20">
                          <Sparkles className="h-12 w-12 mx-auto text-slate-200 mb-4" />
                          <p className="text-muted-foreground">Tree is initializing or empty...</p>
                          <p className="text-xs text-muted-foreground mt-2">Check 'Manage Categories' if nothing appears here.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filterTree(examTree, treeSearchQuery).map((exam) => renderCategoryNode(exam, 0))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Details Panel - Sticky Right */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              <Card className="border-0 rounded-[1.5rem] shadow-2xl bg-gradient-to-b from-slate-900 to-slate-800 text-white overflow-hidden">
                <CardHeader className="border-b border-white/10 pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <HelpCircle className="h-4 w-4 text-primary" />
                    </div>
                    Details Panel
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {selectedItem ? (
                    <div className="space-y-4 animate-in fade-in duration-500">
                      {selectedItem.type === 'exam' && (
                        <>
                          <div className="flex flex-col items-center text-center gap-2">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl shadow-inner border border-white/5">
                              {selectedItem.data.icon}
                            </div>
                            <div>
                              <h3 className="font-bold text-xl tracking-tight">{selectedItem.data.examName}</h3>
                              <Badge className="mt-1 bg-primary text-white border-0 px-3 h-5 text-[9px] uppercase tracking-wider">Main Category</Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                              <div className="text-xl font-bold">{selectedItem.data.subjectCount}</div>
                              <div className="text-[9px] uppercase tracking-widest text-slate-400">Subjects</div>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                              <div className="text-xl font-bold">{selectedItem.data.children?.length || 0}</div>
                              <div className="text-[9px] uppercase tracking-widest text-slate-400">Sub-Levels</div>
                            </div>
                          </div>
                        </>
                      )}

                      {selectedItem.type === 'subject' && (
                        <>
                          <div className="flex flex-col items-center text-center gap-2">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/10">
                              <BookOpen className="h-6 w-6 text-blue-400" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg tracking-tight">{selectedItem.data.subjectName}</h3>
                              <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">Academic Subject</p>
                            </div>
                          </div>

                          <div className="space-y-2 pt-2">
                            <div className="flex justify-between items-center p-2 bg-white/5 rounded-xl border border-white/5">
                              <span className="text-xs text-slate-300">Total Topics</span>
                              <Badge className="bg-orange-500/20 text-orange-400 border-0 h-5 text-[10px]">{selectedItem.data.topicCount}</Badge>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-white/5 rounded-xl border border-white/5">
                              <span className="text-xs text-slate-300">Test Sets</span>
                              <Badge className="bg-purple-500/20 text-purple-400 border-0 h-5 text-[10px]">{selectedItem.data.testCount}</Badge>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-white/5 rounded-xl border border-white/5">
                              <span className="text-xs text-slate-300">Questions</span>
                              <Badge className="bg-primary/20 text-primary border-0 h-5 text-[10px]">
                                {selectedItem.data.topics.reduce((sum: number, t: Topic) => sum + t.questionCount, 0) +
                                  selectedItem.data.tests.reduce((sum: number, t: Test) => sum + t.questionCount, 0)}
                              </Badge>
                            </div>
                          </div>
                        </>
                      )}

                      {selectedItem.type === 'topic' && (
                        <>
                          <div className="flex flex-col items-center text-center gap-2">
                            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center border border-orange-500/20 shadow-lg shadow-orange-500/10">
                              <Tag className="h-6 w-6 text-orange-400" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg tracking-tight">{selectedItem.data.topicName}</h3>
                              <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">Learning Topic</p>
                            </div>
                          </div>
                          <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                            <div className="text-2xl font-bold text-orange-400">{selectedItem.data.questionCount}</div>
                            <div className="text-[9px] uppercase tracking-widest text-slate-400">Total Questions</div>
                          </div>
                        </>
                      )}

                      {selectedItem.type === 'test' && (
                        <>
                          <div className="flex flex-col items-center text-center gap-2">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/20 shadow-lg shadow-purple-500/10">
                              <FileText className="h-6 w-6 text-purple-400" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg tracking-tight">{selectedItem.data.testName}</h3>
                              <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider font-semibold">Test Evaluation</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div className="bg-white/5 p-2 rounded-xl border border-white/5 text-center">
                              <div className="text-base font-bold">{selectedItem.data.durationMinutes}m</div>
                              <div className="text-[8px] uppercase text-slate-500 font-bold">Time</div>
                            </div>
                            <div className="bg-white/5 p-2 rounded-xl border border-white/5 text-center">
                              <div className="text-base font-bold">{selectedItem.data.totalMarks}</div>
                              <div className="text-[8px] uppercase text-slate-500 font-bold">Marks</div>
                            </div>
                          </div>
                        </>
                      )}

                      {selectedItem.data.description && (
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 mt-4">
                          <p className="text-xs text-slate-300 leading-relaxed italic">"{selectedItem.data.description}"</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-20 px-4">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <HelpCircle className="h-8 w-8 text-slate-500" />
                      </div>
                      <h4 className="font-medium text-slate-300">Intelligent Explorer</h4>
                      <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                        Select any element from the hierarchy tree to unlock deep insights and configuration options.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="p-4 rounded-xl bg-indigo-600/10 border border-indigo-500/20">
                <h5 className="text-[11px] font-bold text-indigo-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="h-3 w-3" /> Pro Tip
                </h5>
                <p className="text-[10px] text-indigo-600/80 mt-1.5 leading-snug">
                  Use 'Manage Categories' to restructure your portal using nested additions.
                </p>
              </div>
            </div>
          </div>
        </div>


        {/* Add/Edit Category Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddCategory} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., All India Exam, Railway"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icon">Icon (Emoji) *</Label>
                  <Input
                    id="icon"
                    placeholder="📚"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="text-2xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parent_id">Parent Category</Label>
                <Select
                  value={formData.parent_id || 'root'}
                  onValueChange={(v) => setFormData({ ...formData, parent_id: v === 'root' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="root">Root Level</SelectItem>
                    {flattenCategories(categories).map((cat) => {
                      const catId = (cat._id || cat.id)?.toString();
                      if (!catId || catId === editingId) return null;
                      return (
                        <SelectItem key={catId} value={catId}>
                          {cat.icon} {cat.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select parent category to create nested structure. Leave as "Root Level" for top-level category.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description of the category..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit">
                  {editingId ? 'Update Category' : 'Save Category'}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowAddModal(false);
                  setEditingId(null);
                  setFormData({ name: '', description: '', icon: '📚', parent_id: '', test_category_type: 'Other' });
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default ExamHierarchy;

