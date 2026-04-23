import { useState, useEffect, useMemo, useCallback } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Clock, FileText, X, Link, Search, Filter, AlertCircle, CheckCircle2, DollarSign, BookOpen, Award, ChevronLeft, ChevronRight, Calendar, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showError, showSuccess, showWarning, showInfo, showDeleteConfirm } from '@/lib/sweetalert';
import { categoriesAPI, testsAPI, subjectsAPI, aiAPI } from '@/lib/api';
import Loader from '@/components/Loader';
import { Bot, Loader2 } from 'lucide-react';
import { AdminPageHeading } from '@/components/AdminPageHeading';
import { PaginationControls } from '@/components/PaginationControls';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

interface Category {
   _id?: string;
   id?: string;
   name: string;
   icon: string;
}

interface Subject {
   _id?: string;
   id?: string;
   name: string;
}

interface SubjectDistribution {
   subject_id: string;
   question_count: number;
}

interface CutoffCategory {
   category: string;
   cutoff_percentage: number;
}

interface Test {
   _id?: string;
   id?: string;
   name: string;
   category_id: string | any;
   subject_id?: string | any;
   duration_minutes: number;
   total_marks: number;
   negative_marking: boolean;
   negative_marks_per_question?: number;
   is_paid?: boolean;
   price?: number;
   exam_name?: string;
   subject_wise_distribution?: SubjectDistribution[];
   show_questions_subject_wise?: boolean;
   has_cutoff?: boolean;
   cutoff_by_category?: CutoffCategory[];
   total_questions?: number;
   description?: string;
   is_active?: boolean;
   created_at?: string | Date;
}

const AdminLiveTests = () => {
   const navigate = useNavigate();
   const [showForm, setShowForm] = useState(false);
   const [categories, setCategories] = useState<Category[]>([]);
   const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
   const [subjects, setSubjects] = useState<Subject[]>([]);
   const [tests, setTests] = useState<Test[]>([]);
   const [loading, setLoading] = useState(true);
   const [editingTest, setEditingTest] = useState<Test | null>(null);

   // Pagination states
   const [currentPage, setCurrentPage] = useState(1);
   const [itemsPerPage, setItemsPerPage] = useState(10);
   const [totalTests, setTotalTests] = useState(0);
   const [totalPages, setTotalPages] = useState(0);

   // Filter states
   const [searchQuery, setSearchQuery] = useState('');
   const [selectedCategory, setSelectedCategory] = useState<string>('all');
   const [selectedSubject, setSelectedSubject] = useState<string>('all');
   const [negativeMarkingFilter, setNegativeMarkingFilter] = useState<string>('all');
   const [paidFilter, setPaidFilter] = useState<string>('all');
   const [showFilters, setShowFilters] = useState(false);
   const [generating, setGenerating] = useState(false);
   const [aiLoading, setAiLoading] = useState(false);

   // Multi-select states
   const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());

   const [formData, setFormData] = useState({
      name: '',
      categoryId: '',
      subjectId: '',
      exam_name: '',
      duration: '',
      totalMarks: '',
      totalQuestions: '',
      isPaid: false,
      price: '',
      negativeMarking: false,
      negativeMarksPerQuestion: '0.25',
      showQuestionsSubjectWise: false,
      hasCutoff: false,
      description: '',
      subjectDistributions: [] as SubjectDistribution[],
      cutoffCategories: [] as CutoffCategory[],
      liveStartTime: '',
      liveEndTime: '',
      liveResultTime: '',
   });

   useEffect(() => {
      setCurrentPage(1); // Reset to page 1 when filters change
   }, [selectedCategory, searchQuery]);

   useEffect(() => {
      fetchData();
   }, [currentPage, itemsPerPage, selectedCategory, searchQuery]);

   useEffect(() => {
      if (formData.categoryId) {
         fetchSubjects(formData.categoryId);
      }
   }, [formData.categoryId]);

   const fetchData = async () => {
      setLoading(true);
      try {
         const [categoriesData, subjectsData] = await Promise.all([
            categoriesAPI.getAll(),
            subjectsAPI.getAll(),
         ]);

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
         setAllSubjects(Array.isArray(subjects) ? subjects : []);

         // Fetch tests with pagination
         const testsResponse = await testsAPI.getAll({
            categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
            page: currentPage,
            limit: itemsPerPage,
            search: searchQuery || undefined,
            isLive: true,
         });

         // Handle paginated response
         if (testsResponse && testsResponse.tests) {
            const testsArray = Array.isArray(testsResponse.tests) ? testsResponse.tests : [];
            setTests(testsArray);
            setTotalTests(testsResponse.pagination?.total || 0);
            setTotalPages(testsResponse.pagination?.totalPages || 0);
         } else if (Array.isArray(testsResponse)) {
            // Fallback for non-paginated response
            setTests(testsResponse);
            setTotalTests(testsResponse.length);
            setTotalPages(1);
         } else {
            setTests([]);
            setTotalTests(0);
            setTotalPages(1);
         }
      } catch (error: any) {
         showError('Failed to load data');
         setTests([]);
         setTotalTests(0);
         setTotalPages(1);
      } finally {
         setLoading(false);
      }
   };

   const fetchSubjects = async (categoryId: string) => {
      try {
         const data = await subjectsAPI.getAll(categoryId);
         // Handle new pagination response format
         const subjects = Array.isArray(data)
            ? data
            : (data?.subjects || []);
         setSubjects(subjects);
      } catch (error: any) {
         console.error('Failed to load subjects');
      }
   };

   const validateForm = () => {
      if (!formData.name.trim()) {
         showError("Test name is required");
         return false;
      }
      if (!formData.categoryId) {
         showError("Please select an exam name");
         return false;
      }
      if (!formData.duration || Number(formData.duration) <= 0) {
         showError("Duration must be a valid number");
         return false;
      }
      if (!formData.totalMarks || Number(formData.totalMarks) <= 0) {
         showError("Total marks must be a valid number");
         return false;
      }
      if (!formData.totalQuestions || Number(formData.totalQuestions) <= 0) {
         showError("Number of questions is required");
         return false;
      }
      if (formData.isPaid && (!formData.price || Number(formData.price) <= 0)) {
         showError("Price is required for paid tests");
         return false;
      }
      if (formData.negativeMarking) {
         if (!formData.negativeMarksPerQuestion || formData.negativeMarksPerQuestion.trim() === '') {
            showError("Please specify negative marks per question");
            return false;
         }
         const negativeMarks = parseFloat(formData.negativeMarksPerQuestion);
         if (isNaN(negativeMarks) || negativeMarks < 0) {
            showError("Negative marks per question must be a valid positive number");
            return false;
         }
      }
      return true;
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) return;

      setLoading(true);

      try {
         const payload: any = {
            name: formData.name,
            category_id: formData.categoryId,
            exam_name: formData.exam_name || null,
            duration_minutes: parseInt(formData.duration),
            total_marks: parseInt(formData.totalMarks),
            total_questions: parseInt(formData.totalQuestions),
            negative_marking: formData.negativeMarking,
            negative_marks_per_question: formData.negativeMarking
               ? parseFloat(formData.negativeMarksPerQuestion)
               : 0.25,
            is_paid: formData.isPaid,
            price: formData.isPaid ? parseFloat(formData.price) : 0,
            show_questions_subject_wise: formData.showQuestionsSubjectWise,
            has_cutoff: formData.hasCutoff,
            subject_wise_distribution: formData.subjectDistributions,
            cutoff_by_category: formData.hasCutoff ? formData.cutoffCategories : [],
            description: formData.description,
            test_type: 'static',
            is_live: true,
            live_start_time: formData.liveStartTime ? new Date(formData.liveStartTime).toISOString() : null,
            live_end_time: formData.liveEndTime ? new Date(formData.liveEndTime).toISOString() : null,
            live_result_time: formData.liveResultTime ? new Date(formData.liveResultTime).toISOString() : null,
         };

         if (editingTest) {
            await testsAPI.update(editingTest._id || editingTest.id, payload);
            showSuccess("Test updated successfully!");
         } else {
            await testsAPI.create(payload);
            showSuccess("Test created successfully!");
         }

         setShowForm(false);
         setEditingTest(null);
         resetForm();
         fetchData();
      } catch (error: any) {
         showError("Failed to save test", error.message);
      } finally {
         setLoading(false);
      }
   };

   const resetForm = () => {
      setFormData({
         name: '',
         categoryId: '',
         subjectId: '',
         exam_name: '',
         duration: '',
         totalMarks: '',
         totalQuestions: '',
         isPaid: false,
         price: '',
         negativeMarking: false,
         negativeMarksPerQuestion: '0.25',
         showQuestionsSubjectWise: false,
         hasCutoff: false,
         description: '',
         subjectDistributions: [],
         cutoffCategories: [],
         liveStartTime: '',
         liveEndTime: '',
         liveResultTime: '',
      });
      setSubjects([]);
   };

   const handleEdit = (test: Test) => {
      const catId =
         test.category_id && typeof test.category_id === "object"
            ? (test.category_id._id || test.category_id.id)
            : test.category_id;

      const subId =
         test.subject_id && typeof test.subject_id === "object"
            ? (test.subject_id._id || test.subject_id.id)
            : test.subject_id;

      setEditingTest(test);
      setFormData({
         name: test.name,
         categoryId: catId || "",
         subjectId: subId || "",
         exam_name: test.exam_name || '',
         duration: test.duration_minutes.toString(),
         totalMarks: test.total_marks.toString(),
         totalQuestions: (test.total_questions || 0).toString(),
         isPaid: test.is_paid || false,
         price: (test.price || 0).toString(),
         negativeMarking: test.negative_marking,
         negativeMarksPerQuestion: (test.negative_marks_per_question || 0.25).toString(),
         showQuestionsSubjectWise: test.show_questions_subject_wise || false,
         hasCutoff: test.has_cutoff || false,
         description: test.description || "",
         subjectDistributions: test.subject_wise_distribution || [],
         cutoffCategories: test.cutoff_by_category || [],
         liveStartTime: formatDateTimeLocal((test as any).live_start_time),
         liveEndTime: formatDateTimeLocal((test as any).live_end_time),
         liveResultTime: formatDateTimeLocal((test as any).live_result_time),
      });

      if (catId) {
         fetchSubjects(catId);
      }
      setShowForm(true);
   };

   const handleDelete = async (testId: string) => {
      const result = await showDeleteConfirm('this test');
      if (!result.isConfirmed) return;

      setLoading(true);
      try {
         await testsAPI.delete(testId);
         showSuccess("Test deleted successfully!");
         fetchData();
      } catch (error: any) {
         showError("Failed to delete test", error.message);
      } finally {
         setLoading(false);
      }
   };

   const handleSelectTest = (id: string) => {
      setSelectedTests(prev => {
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
      if (selectedTests.size === filteredTests.length) {
         setSelectedTests(new Set());
      } else {
         const allIds = filteredTests.map(t => t._id || t.id).filter(Boolean) as string[];
         setSelectedTests(new Set(allIds));
      }
   };

   const handleBatchDelete = async () => {
      if (selectedTests.size === 0) return;
      const result = await showDeleteConfirm(`${selectedTests.size} tests`);
      if (!result.isConfirmed) return;

      setLoading(true);
      try {
         // Delete tests one by one since API might not support batch delete
         const deletePromises = Array.from(selectedTests).map(id => testsAPI.delete(id));
         await Promise.all(deletePromises);
         showSuccess(`${selectedTests.size} tests deleted successfully!`);
         setSelectedTests(new Set());
         fetchData();
      } catch (error: any) {
         showError('Failed to delete tests', error.message);
      } finally {
         setLoading(false);
      }
   };

   const handleToggleActive = async (test: Test) => {
      const testId = test._id || test.id;
      if (!testId) return;

      const newStatus = !(test.is_active ?? true);
      setLoading(true);
      try {
         await testsAPI.update(testId, { is_active: newStatus });
         showSuccess(`Test ${newStatus ? 'activated' : 'deactivated'} successfully!`);
         fetchData();
      } catch (error: any) {
         showError("Failed to update test status", error.message);
      } finally {
         setLoading(false);
      }
   };

   const handleAiSuggest = async () => {
      setAiLoading(true);
      try {
         let contextSubject = 'General Mock Test';
         if (formData.categoryId) {
            const cat = categories.find(c => (c._id || c.id)?.toString() === formData.categoryId);
            if (cat) contextSubject = cat.name;
         }
         
         const response = await aiAPI.generate({
            type: 'test',
            context: { subject: contextSubject }
         });
         
         if (response && response.title) {
            setFormData(prev => ({
               ...prev,
               name: response.title || prev.name,
               exam_name: response.exam_name || prev.exam_name,
               description: response.description || prev.description,
               duration: (response.duration || prev.duration).toString(),
               totalMarks: (response.passing_marks ? response.passing_marks * 2 : prev.totalMarks).toString(),
               totalQuestions: (response.passing_marks ? response.passing_marks * 2 : prev.totalQuestions).toString(),
            }));
            showSuccess('AI successfully suggested test details!');
         } else {
            showError('AI failed to suggest test details');
         }
      } catch (err: any) {
         showError(err.message || 'AI generation failed');
      } finally {
         setAiLoading(false);
      }
   };

   const formatDate = (date: string | Date | undefined) => {
      if (!date) return 'N/A';
      const d = new Date(date);
      return d.toLocaleDateString('en-IN', {
         day: '2-digit',
         month: 'short',
         year: 'numeric',
         hour: '2-digit',
         minute: '2-digit',
         hour12: true
      });
   };

   const formatDateTimeLocal = (date: string | Date | undefined | null) => {
      if (!date) return '';
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
   };

   const addSubjectDistribution = () => {
      if (subjects.length === 0) {
         showError('Please select an exam name first to load subjects');
         return;
      }
      setFormData(prev => ({
         ...prev,
         subjectDistributions: [
            ...prev.subjectDistributions,
            { subject_id: '', question_count: 0 },
         ],
      }));
   };

   const updateSubjectDistribution = (index: number, field: keyof SubjectDistribution, value: string | number) => {
      setFormData(prev => {
         const updated = [...prev.subjectDistributions];
         updated[index] = { ...updated[index], [field]: value };
         return { ...prev, subjectDistributions: updated };
      });
   };

   const removeSubjectDistribution = (index: number) => {
      setFormData(prev => ({
         ...prev,
         subjectDistributions: prev.subjectDistributions.filter((_, i) => i !== index),
      }));
   };





   const addCutoffCategory = () => {
      setFormData(prev => ({
         ...prev,
         cutoffCategories: [
            ...prev.cutoffCategories,
            { category: '', cutoff_percentage: 0 },
         ],
      }));
   };

   const updateCutoffCategory = (index: number, field: keyof CutoffCategory, value: string | number) => {
      setFormData(prev => {
         const updated = [...prev.cutoffCategories];
         updated[index] = { ...updated[index], [field]: value };
         return { ...prev, cutoffCategories: updated };
      });
   };

   const removeCutoffCategory = (index: number) => {
      setFormData(prev => ({
         ...prev,
         cutoffCategories: prev.cutoffCategories.filter((_, i) => i !== index),
      }));
   };

   // Memoize filtered tests to avoid recalculating on every render
   const filteredTests = useMemo(() => {
      // Ensure tests is an array - defensive check
      if (!tests || !Array.isArray(tests)) {
         return [];
      }
      return tests.filter(test => {
         // Subject filter (client-side)
         if (selectedSubject && selectedSubject !== 'all') {
            const subId = test.subject_id?._id || test.subject_id?.id || test.subject_id;
            if (subId?.toString() !== selectedSubject?.toString()) {
               return false;
            }
         }

         // Negative marking filter
         if (negativeMarkingFilter === 'yes' && !test.negative_marking) {
            return false;
         }
         if (negativeMarkingFilter === 'no' && test.negative_marking) {
            return false;
         }

         // Paid/Free filter
         if (paidFilter === 'paid' && !test.is_paid) {
            return false;
         }
         if (paidFilter === 'free' && test.is_paid) {
            return false;
         }

         return true;
      });
   }, [tests, selectedSubject, negativeMarkingFilter, paidFilter]);
   const hasActiveFilters = searchQuery || (selectedCategory && selectedCategory !== 'all') || (selectedSubject && selectedSubject !== 'all') || negativeMarkingFilter !== 'all' || paidFilter !== 'all';

   const clearFilters = useCallback(() => {
      setSearchQuery('');
      setSelectedCategory('all');
      setSelectedSubject('all');
      setNegativeMarkingFilter('all');
      setPaidFilter('all');
   }, []);

   // Get subjects for selected category filter
   const filteredSubjects = selectedCategory && selectedCategory !== 'all'
      ? allSubjects.filter(sub => {
         const subCatId = sub.category_id && typeof sub.category_id === 'object'
            ? (sub.category_id._id || sub.category_id.id)
            : sub.category_id;
         return subCatId?.toString() === selectedCategory?.toString();
      })
      : allSubjects;

   if (loading && tests.length === 0) {
      return (
         <AdminLayout>
            <div className="p-8">
               <Loader text="Loading tests..." />
            </div>
         </AdminLayout>
      );
   }

   return (
      <AdminLayout>
         <div className="space-y-6">
            <AdminPageHeading
               eyebrow="Assessments"
               title="Live Tests Management"
               description="Create and schedule live mock tests with strict time windows."
               action={
                  <div className="flex gap-2">


                     <Button
                        variant="outline"
                        className="rounded-2xl border border-border/70 px-4 py-2 text-xs"
                        onClick={() => {
                           setEditingTest(null);
                           resetForm();
                           setShowForm(true);
                        }}
                     >
                        <Plus className="mr-2 h-4 w-4" />
                        Create test
                     </Button>
                  </div>
               }
            />

            <Dialog open={showForm} onOpenChange={(open) => {
               setShowForm(open);
               if (!open) {
                  setEditingTest(null);
                  resetForm();
               }
            }}>
               <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                     <div className="flex justify-between items-center mr-6">
                        <DialogTitle>{editingTest ? "Edit Test" : "Create New Test"}</DialogTitle>
                        <Button 
                           type="button" 
                           variant="outline" 
                           size="sm" 
                           onClick={handleAiSuggest} 
                           disabled={aiLoading}
                           className="bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
                        >
                           {aiLoading ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Bot className="h-3 w-3 mr-2" />}
                           AI Suggest
                        </Button>
                     </div>
                  </DialogHeader>
                  <div className="mt-4">
                     <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                           <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                              Basic Information
                           </h3>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                 <Label>Test Name *</Label>
                                 <Input
                                    placeholder="e.g., GK Mock Test 1"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                 />
                              </div>

                              <div className="space-y-2">
                                 <Label>Exam Name *</Label>
                                 <Select
                                    value={formData.categoryId}
                                    onValueChange={(v) => {
                                       setFormData({ ...formData, categoryId: v, subjectId: '' }); // Reset subject when category changes
                                       fetchSubjects(v);
                                    }}
                                    required
                                 >
                                    <SelectTrigger>
                                       <SelectValue placeholder="Select exam name" />
                                    </SelectTrigger>
                                    <SelectContent>
                                       {Array.isArray(categories) && categories.map((cat) => (
                                          <SelectItem key={cat._id || cat.id} value={cat._id || cat.id}>
                                             {cat.icon} {cat.name}
                                          </SelectItem>
                                       ))}
                                    </SelectContent>
                                 </Select>
                              </div>
                           </div>

                           <div className="space-y-2">
                              <Label>Subject (Optional)</Label>
                              <Select
                                 value={formData.subjectId}
                                 onValueChange={(v) => setFormData({ ...formData, subjectId: v })}
                                 disabled={!formData.categoryId || subjects.length === 0}
                              >
                                 <SelectTrigger>
                                    <SelectValue placeholder={!formData.categoryId ? "Select exam name first" : "Select subject"} />
                                 </SelectTrigger>
                                 <SelectContent>
                                    {Array.isArray(subjects) && subjects.map((sub) => (
                                       <SelectItem key={sub._id || sub.id} value={sub._id || sub.id}>
                                          {sub.name}
                                       </SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">
                                 Follow hierarchy: Exam Name → Subject → Test
                              </p>
                           </div>

                           <div className="space-y-2">
                              <Label>Exam Name</Label>
                              <Input
                                 placeholder="e.g., UPSC Prelims, SSC CGL"
                                 value={formData.exam_name}
                                 onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
                              />
                           </div>

                           <div className="space-y-2">
                              <Label>Description (Optional)</Label>
                              <Input
                                 placeholder="Brief description"
                                 value={formData.description}
                                 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              />
                           </div>
                        </div>

                        {/* Test Configuration */}
                        <div className="space-y-4">
                           <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                              Test Configuration
                           </h3>

                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                 <Label>Duration (minutes) *</Label>
                                 <Input
                                    type="number"
                                    placeholder="60"
                                    min="1"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    required
                                 />
                              </div>

                              <div className="space-y-2">
                                 <Label>Total Marks *</Label>
                                 <Input
                                    type="number"
                                    placeholder="100"
                                    min="1"
                                    value={formData.totalMarks}
                                    onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                                    required
                                 />
                              </div>

                              <div className="space-y-2">
                                 <Label>Number of Questions *</Label>
                                 <Input
                                    type="number"
                                    placeholder="50"
                                    min="1"
                                    value={formData.totalQuestions}
                                    onChange={(e) => setFormData({ ...formData, totalQuestions: e.target.value })}
                                    required
                                 />
                              </div>
                           </div>
                        </div>

                        {/* Payment Settings */}
                        <div className="space-y-4">
                           <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                              Payment Settings
                           </h3>

                           <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                              <div>
                                 <Label>Paid/Free</Label>
                                 <p className="text-xs text-muted-foreground">Enable if this is a paid test</p>
                              </div>
                              <Switch
                                 checked={formData.isPaid}
                                 onCheckedChange={(checked) => setFormData({ ...formData, isPaid: checked })}
                              />
                           </div>

                           {formData.isPaid && (
                              <div className="space-y-2">
                                 <Label>Price (₹) *</Label>
                                 <Input
                                    type="number"
                                    placeholder="99"
                                    min="0"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    required={formData.isPaid}
                                 />
                              </div>
                           )}
                        </div>

                        {/* Live Test Timings */}
                        <div className="space-y-4">
                           <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                              Live Test Schedule
                           </h3>

                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-xl bg-muted/20">
                              <div className="space-y-2">
                                 <Label>Start Time *</Label>
                                 <Input
                                    type="datetime-local"
                                    value={formData.liveStartTime}
                                    onChange={(e) => setFormData({ ...formData, liveStartTime: e.target.value })}
                                    required
                                 />
                              </div>

                              <div className="space-y-2">
                                 <Label>End Time *</Label>
                                 <Input
                                    type="datetime-local"
                                    value={formData.liveEndTime}
                                    onChange={(e) => setFormData({ ...formData, liveEndTime: e.target.value })}
                                    required
                                 />
                              </div>

                              <div className="space-y-2">
                                 <Label>Result Publish Time *</Label>
                                 <Input
                                    type="datetime-local"
                                    value={formData.liveResultTime}
                                    onChange={(e) => setFormData({ ...formData, liveResultTime: e.target.value })}
                                    required
                                 />
                              </div>
                           </div>
                        </div>

                        {/* Negative Marking */}
                        <div className="space-y-4">
                           <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                              Negative Marking
                           </h3>

                           <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                              <div>
                                 <Label>Enable Negative Marking</Label>
                                 <p className="text-xs text-muted-foreground">Deduct marks for wrong answers</p>
                              </div>
                              <Switch
                                 checked={formData.negativeMarking}
                                 onCheckedChange={(checked) => setFormData({ ...formData, negativeMarking: checked })}
                              />
                           </div>

                           {formData.negativeMarking && (
                              <div className="space-y-2">
                                 <Label>Negative Marks Per Question *</Label>
                                 <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="e.g., 0.25, 0.5, 1, etc."
                                    value={formData.negativeMarksPerQuestion}
                                    onChange={(e) => {
                                       const value = e.target.value;
                                       // Allow empty string, numbers, and decimals
                                       if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                          setFormData({ ...formData, negativeMarksPerQuestion: value });
                                       }
                                    }}
                                    className="rounded-xl"
                                 />
                                 <p className="text-xs text-muted-foreground">
                                    Enter any value (e.g., 0.25, 0.33, 0.5, 1, 2, etc.)
                                 </p>
                              </div>
                           )}
                        </div>

                        {/* Subject Wise Distribution */}
                        <div className="space-y-4">
                           <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                 Subject Wise Distribution
                              </h3>
                              <Button
                                 type="button"
                                 variant="outline"
                                 size="sm"
                                 className="rounded-xl"
                                 onClick={addSubjectDistribution}
                                 disabled={!formData.categoryId}
                              >
                                 <Plus className="h-4 w-4 mr-1" />
                                 Add Subject
                              </Button>
                           </div>

                           {formData.subjectDistributions.length > 0 && (
                              <div className="space-y-3">
                                 {formData.subjectDistributions.map((dist, index) => (
                                    <div key={index} className="flex gap-3 p-3 border border-border/60 rounded-xl bg-muted/30">
                                       <div className="flex-1 space-y-2">
                                          <Label className="text-xs">Subject</Label>
                                          <Select
                                             value={dist.subject_id}
                                             onValueChange={(v) => updateSubjectDistribution(index, 'subject_id', v)}
                                          >
                                             <SelectTrigger>
                                                <SelectValue placeholder="Select subject" />
                                             </SelectTrigger>
                                             <SelectContent>
                                                {Array.isArray(subjects) && subjects.map((sub) => (
                                                   <SelectItem key={sub._id || sub.id} value={sub._id || sub.id}>
                                                      {sub.name}
                                                   </SelectItem>
                                                ))}
                                             </SelectContent>
                                          </Select>
                                       </div>
                                       <div className="w-32 space-y-2">
                                          <Label className="text-xs">Questions</Label>
                                          <Input
                                             type="number"
                                             min="0"
                                             value={dist.question_count}
                                             onChange={(e) =>
                                                updateSubjectDistribution(index, 'question_count', parseInt(e.target.value) || 0)
                                             }
                                          />
                                       </div>
                                       <div className="flex items-end">
                                          <Button
                                             type="button"
                                             variant="ghost"
                                             size="icon"
                                             className="rounded-xl"
                                             onClick={() => removeSubjectDistribution(index)}
                                          >
                                             <X className="h-4 w-4" />
                                          </Button>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           )}

                           <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                              <div>
                                 <Label>Show Questions Subject Wise</Label>
                                 <p className="text-xs text-muted-foreground">
                                    Candidates will see questions grouped by subject
                                 </p>
                              </div>
                              <Switch
                                 checked={formData.showQuestionsSubjectWise}
                                 onCheckedChange={(checked) =>
                                    setFormData({ ...formData, showQuestionsSubjectWise: checked })
                                 }
                              />
                           </div>
                        </div>

                        {/* Cut-Off Settings */}
                        <div className="space-y-4">
                           <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                                 Cut-Off Settings
                              </h3>
                              {formData.hasCutoff && (
                                 <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl"
                                    onClick={addCutoffCategory}
                                 >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Exam Name
                                 </Button>
                              )}
                           </div>

                           <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                              <div>
                                 <Label>Enable Cut-Off</Label>
                                 <p className="text-xs text-muted-foreground">Set cutoff percentages for different exam names</p>
                              </div>
                              <Switch
                                 checked={formData.hasCutoff}
                                 onCheckedChange={(checked) => setFormData({ ...formData, hasCutoff: checked })}
                              />
                           </div>

                           {formData.hasCutoff && formData.cutoffCategories.length > 0 && (
                              <div className="space-y-3">
                                 {formData.cutoffCategories.map((cutoff, index) => (
                                    <div key={index} className="flex gap-3 p-3 border border-border/60 rounded-xl bg-muted/30">
                                       <div className="flex-1 space-y-2">
                                          <Label className="text-xs">Category</Label>
                                          <Input
                                             placeholder="e.g., General, OBC, SC, ST"
                                             value={cutoff.category}
                                             onChange={(e) => updateCutoffCategory(index, 'category', e.target.value)}
                                          />
                                       </div>
                                       <div className="w-32 space-y-2">
                                          <Label className="text-xs">Cut-Off (%)</Label>
                                          <Input
                                             type="number"
                                             min="0"
                                             max="100"
                                             step="0.01"
                                             value={cutoff.cutoff_percentage}
                                             onChange={(e) =>
                                                updateCutoffCategory(index, 'cutoff_percentage', parseFloat(e.target.value) || 0)
                                             }
                                          />
                                       </div>
                                       <div className="flex items-end">
                                          <Button
                                             type="button"
                                             variant="ghost"
                                             size="icon"
                                             className="rounded-xl"
                                             onClick={() => removeCutoffCategory(index)}
                                          >
                                             <X className="h-4 w-4" />
                                          </Button>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-4">
                           <Button type="submit" disabled={loading} className="rounded-2xl px-6">
                              {editingTest ? "Update Test" : "Create Test"}
                           </Button>
                           <Button
                              type="button"
                              variant="outline"
                              className="rounded-2xl"
                              onClick={() => {
                                 setShowForm(false);
                                 setEditingTest(null);
                                 resetForm();
                              }}
                           >
                              Cancel
                           </Button>
                        </div>
                     </form>
                  </div>
               </DialogContent>
            </Dialog>

            {/* Filters Section - Collapsible */}
            <div className="relative">
               {/* Side Filter Toggle Button */}
               <Button
                  variant="outline"
                  size="sm"
                  className={`absolute right-0 top-0 z-10 rounded-l-xl rounded-r-none border-r-0 ${showFilters ? 'rounded-bl-none' : ''
                     }`}
                  onClick={() => setShowFilters(!showFilters)}
               >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {hasActiveFilters && (
                     <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                        {[searchQuery, selectedCategory !== 'all', selectedSubject !== 'all', negativeMarkingFilter !== 'all', paidFilter !== 'all'].filter(Boolean).length}
                     </span>
                  )}
                  {showFilters ? (
                     <ChevronRight className="h-4 w-4 ml-2" />
                  ) : (
                     <ChevronLeft className="h-4 w-4 ml-2" />
                  )}
               </Button>

               {/* Filter Card */}
               {showFilters && (
                  <Card className="border border-border/70 rounded-xl rounded-tr-none">
                     <CardHeader className="pb-3">
                        <div className="flex items-center justify-between pr-24">
                           <div className="flex items-center gap-2">
                              <Filter className="h-4 w-4" />
                              <CardTitle className="text-base">Filters</CardTitle>
                           </div>
                           {hasActiveFilters && (
                              <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={clearFilters}
                                 className="h-8 text-xs"
                              >
                                 <X className="h-3 w-3 mr-1" />
                                 Clear All
                              </Button>
                           )}
                        </div>
                     </CardHeader>
                     <CardContent className="pt-0 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                           {/* Search */}
                           <div className="space-y-2">
                              <Label>Search Tests</Label>
                              <div className="relative">
                                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                 <Input
                                    placeholder="Search by name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 rounded-xl"
                                 />
                              </div>
                           </div>

                           {/* Category Filter */}
                           <div className="space-y-2">
                              <Label>Exam Name</Label>
                              <Select value={selectedCategory || 'all'} onValueChange={(val) => {
                                 setSelectedCategory(val);
                                 setSelectedSubject('all');
                              }}>
                                 <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="All Exam Names" />
                                 </SelectTrigger>
                                 <SelectContent>
                                    <SelectItem value="all">All Exam Names</SelectItem>
                                    {Array.isArray(categories) && categories.map(cat => (
                                       <SelectItem key={cat._id || cat.id} value={(cat._id || cat.id)?.toString()}>
                                          {cat.icon} {cat.name}
                                       </SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                           </div>

                           {/* Subject Filter */}
                           <div className="space-y-2">
                              <Label>Subject</Label>
                              <Select value={selectedSubject || 'all'} onValueChange={setSelectedSubject}>
                                 <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="All Subjects" />
                                 </SelectTrigger>
                                 <SelectContent>
                                    <SelectItem value="all">All Subjects</SelectItem>
                                    {filteredSubjects.map(sub => (
                                       <SelectItem key={sub._id || sub.id} value={(sub._id || sub.id)?.toString()}>
                                          {sub.name}
                                       </SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                           </div>

                           {/* Negative Marking Filter */}
                           <div className="space-y-2">
                              <Label>Negative Marking</Label>
                              <Select value={negativeMarkingFilter} onValueChange={setNegativeMarkingFilter}>
                                 <SelectTrigger className="rounded-xl">
                                    <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="yes">With Negative Marking</SelectItem>
                                    <SelectItem value="no">Without Negative Marking</SelectItem>
                                 </SelectContent>
                              </Select>
                           </div>

                           {/* Paid/Free Filter */}
                           <div className="space-y-2">
                              <Label>Test Type</Label>
                              <Select value={paidFilter} onValueChange={setPaidFilter}>
                                 <SelectTrigger className="rounded-xl">
                                    <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="free">Free Tests</SelectItem>
                                    <SelectItem value="paid">Paid Tests</SelectItem>
                                 </SelectContent>
                              </Select>
                           </div>
                        </div>
                     </CardContent>
                  </Card>
               )}
            </div>

            {/* Tests Count and Multi-select Actions */}
            <div className="flex items-center justify-between flex-wrap gap-2">
               <div className="flex items-center gap-3">
                  <Checkbox
                     checked={filteredTests.length > 0 && selectedTests.size === filteredTests.length}
                     onCheckedChange={handleSelectAll}
                     aria-label="Select all tests"
                  />
                  <p className="text-xs sm:text-sm text-muted-foreground">
                     Showing <span className="font-semibold text-foreground">{filteredTests.length}</span> of <span className="font-semibold text-foreground">{totalTests}</span> test(s)
                     {hasActiveFilters && <span className="ml-1">(filtered)</span>}
                  </p>
                  {selectedTests.size > 0 && (
                     <Button variant="destructive" size="sm" onClick={handleBatchDelete} className="text-xs">
                        <Trash className="h-3 w-3 mr-1" />
                        Delete ({selectedTests.size})
                     </Button>
                  )}
               </div>
               {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                     <Label className="text-xs sm:text-sm">Items per page:</Label>
                     <Select value={itemsPerPage.toString()} onValueChange={(val) => {
                        setItemsPerPage(parseInt(val));
                        setCurrentPage(1);
                     }}>
                        <SelectTrigger className="h-8 w-20 text-xs">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="10">10</SelectItem>
                           <SelectItem value="20">20</SelectItem>
                           <SelectItem value="50">50</SelectItem>
                           <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
               )}
            </div>

            {/* Tests List */}
            <div className="space-y-4">
               {filteredTests.length === 0 ? (
                  <Card className="rounded-[1.5rem] border border-border/70">
                     <CardContent className="py-16 text-center">
                        <div className="text-6xl mb-4">📝</div>
                        <h3 className="text-lg font-semibold mb-2">
                           {tests.length === 0 ? 'No tests created yet' : 'No tests found'}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                           {hasActiveFilters
                              ? 'Try adjusting your filters or search query'
                              : 'Create your first test to get started'}
                        </p>
                        {hasActiveFilters && (
                           <Button variant="outline" onClick={clearFilters}>
                              Clear Filters
                           </Button>
                        )}
                     </CardContent>
                  </Card>
               ) : (
                  filteredTests.map((test) => {
                     const testId = test._id || test.id || '';
                     const catId =
                        typeof test.category_id === "object" && test.category_id !== null
                           ? test.category_id._id || test.category_id.id
                           : test.category_id;

                     const category = categories.find((c) => (c._id || c.id) === catId);
                     const subjectName = typeof test.subject_id === 'object' && test.subject_id !== null
                        ? test.subject_id?.name
                        : '';

                     return (
                        <Card
                           key={testId}
                           className={`rounded-[1.5rem] border transition-all duration-300 ${selectedTests.has(testId) ? 'border-red-300 bg-red-50/30' : test.is_active
                                 ? 'border-border/70 hover:border-primary/30 hover:shadow-xl hover:-translate-y-0.5'
                                 : 'border-border/40 opacity-75 hover:opacity-100'
                              }`}
                        >
                           <CardContent className="p-6">
                              <div className="flex flex-col lg:flex-row gap-6">
                                 {/* Checkbox Column */}
                                 <div className="flex items-start pt-1">
                                    <Checkbox
                                       checked={selectedTests.has(testId)}
                                       onCheckedChange={() => handleSelectTest(testId)}
                                       aria-label={`Select test ${test.name}`}
                                    />
                                 </div>
                                 {/* Left Section - Main Content */}
                                 <div className="flex-1 space-y-4">
                                    {/* Header with Title and Badges */}
                                    <div className="flex items-start justify-between gap-4">
                                       <div className="flex items-start gap-3 flex-1">
                                          <div className="p-2.5 rounded-xl bg-muted/50 border border-border/50 shrink-0">
                                             <span className="text-2xl">{category?.icon}</span>
                                          </div>
                                          <div className="flex-1 min-w-0">
                                             <div className="flex items-start gap-2 mb-1.5">
                                                <h3 className="text-lg font-semibold leading-tight">{test.name}</h3>
                                                {test.is_paid ? (
                                                   <Badge variant="default" className="shrink-0 text-[10px] px-2 py-0.5">
                                                      <DollarSign className="h-3 w-3 mr-1" />
                                                      Paid
                                                   </Badge>
                                                ) : (
                                                   <Badge variant="secondary" className="shrink-0 text-[10px] px-2 py-0.5">Free</Badge>
                                                )}
                                                <Badge
                                                   variant={test.is_active ? "default" : "secondary"}
                                                   className={`shrink-0 text-[10px] px-2 py-0.5 ${test.is_active
                                                         ? 'bg-green-500/10 text-green-600 border-green-500/20'
                                                         : 'bg-muted text-muted-foreground'
                                                      }`}
                                                >
                                                   {test.is_active ? "Active" : "Inactive"}
                                                </Badge>
                                             </div>
                                             {test.description && (
                                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{test.description}</p>
                                             )}
                                             <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                {category && (
                                                   <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50">
                                                      <span>{category.icon}</span>
                                                      <span className="font-medium">{category.name}</span>
                                                   </span>
                                                )}
                                                {subjectName && (
                                                   <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50">
                                                      <BookOpen className="h-3 w-3" />
                                                      <span className="font-medium">{subjectName}</span>
                                                   </span>
                                                )}
                                                {test.exam_name && (
                                                   <span className="px-2 py-1 rounded-md bg-muted/50 font-medium">{test.exam_name}</span>
                                                )}
                                             </div>
                                          </div>
                                       </div>
                                    </div>

                                    {/* Test Stats Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                       <div className="p-3 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                                          <div className="flex items-center gap-2 mb-1">
                                             <Clock className="h-4 w-4 text-primary" />
                                             <span className="text-xs font-medium text-muted-foreground">Duration</span>
                                          </div>
                                          <p className="text-base font-bold">{test.duration_minutes} mins</p>
                                       </div>

                                       <div className="p-3 rounded-xl bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/20">
                                          <div className="flex items-center gap-2 mb-1">
                                             <Award className="h-4 w-4 text-accent" />
                                             <span className="text-xs font-medium text-muted-foreground">Total Marks</span>
                                          </div>
                                          <p className="text-base font-bold">{test.total_marks}</p>
                                       </div>

                                       {test.total_questions && (
                                          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-500/20">
                                             <div className="flex items-center gap-2 mb-1">
                                                <FileText className="h-4 w-4 text-blue-600" />
                                                <span className="text-xs font-medium text-muted-foreground">Questions</span>
                                             </div>
                                             <p className="text-base font-bold">{test.total_questions}</p>
                                          </div>
                                       )}

                                       {test.is_paid && test.price ? (
                                          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/5 to-purple-500/10 border border-purple-500/20">
                                             <div className="flex items-center gap-2 mb-1">
                                                <DollarSign className="h-4 w-4 text-purple-600" />
                                                <span className="text-xs font-medium text-muted-foreground">Price</span>
                                             </div>
                                             <p className="text-base font-bold text-primary">₹{test.price}</p>
                                          </div>
                                       ) : (
                                          <div className="p-3 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
                                             <div className="flex items-center gap-2 mb-1">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-xs font-medium text-muted-foreground">Scheduled</span>
                                             </div>
                                             <p className="text-xs font-semibold text-muted-foreground leading-tight">
                                                {formatDate((test as any).live_start_time)}
                                             </p>
                                          </div>
                                       )}

                                    </div>

                                    {/* Additional Info Row */}
                                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/50">
                                       {/* Negative Marking */}
                                       <div className="flex items-center gap-2">
                                          {test.negative_marking ? (
                                             <>
                                                <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
                                                <div>
                                                   <span className="text-xs font-medium text-orange-600">Negative Marking</span>
                                                   {test.negative_marks_per_question && (
                                                      <p className="text-[10px] text-muted-foreground">
                                                         -{test.negative_marks_per_question} per wrong
                                                      </p>
                                                   )}
                                                </div>
                                             </>
                                          ) : (
                                             <>
                                                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                                <span className="text-xs font-medium text-green-600">No Negative Marking</span>
                                             </>
                                          )}
                                       </div>

                                       {/* Creation Date (if price is shown) */}
                                       {test.is_paid && test.price && (
                                          <>
                                             <span className="text-muted-foreground">•</span>
                                             <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span>{formatDate(test.created_at)}</span>
                                             </div>
                                          </>
                                       )}
                                    </div>
                                 </div>

                                 {/* Right Section - Actions */}
                                 <div className="flex flex-col gap-3 lg:w-48 shrink-0">
                                    {/* Status Toggle */}
                                    <div className="p-3.5 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
                                       <div className="flex items-center justify-between mb-2">
                                          <Label className="text-xs font-semibold text-muted-foreground">Test Status</Label>
                                          <Switch
                                             checked={test.is_active ?? true}
                                             onCheckedChange={() => handleToggleActive(test)}
                                             disabled={loading}
                                             className="data-[state=checked]:bg-green-500"
                                          />
                                       </div>
                                       <p className="text-[10px] text-muted-foreground">
                                          {test.is_active ? 'Test is visible to users' : 'Test is hidden from users'}
                                       </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-2">
                                       <Button
                                          size="sm"
                                          variant="default"
                                          className="w-full rounded-xl justify-start"
                                          onClick={() => navigate(`/admin/tests/${test._id || test.id}/assign`)}
                                       >
                                          <Link className="h-4 w-4 mr-2" />
                                          Assign Questions
                                       </Button>
                                       <div className="flex gap-2">
                                          <Button
                                             size="sm"
                                             variant="outline"
                                             className="flex-1 rounded-xl"
                                             onClick={() => handleEdit(test)}
                                          >
                                             <Pencil className="h-4 w-4 mr-1.5" />
                                             Edit
                                          </Button>
                                          <Button
                                             size="sm"
                                             variant="outline"
                                             className="rounded-xl border-destructive/40 text-destructive hover:text-destructive hover:bg-destructive/10"
                                             onClick={() => handleDelete(testId)}
                                          >
                                             <Trash2 className="h-4 w-4" />
                                          </Button>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </CardContent>
                        </Card>
                     );
                  })
               )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
               <div className="mt-6">
                  <PaginationControls
                     currentPage={currentPage}
                     totalPages={totalPages}
                     onPageChange={(page) => setCurrentPage(page)}
                     className="flex-wrap gap-4"
                  />
               </div>
            )}
         </div>
      </AdminLayout>
   );
};

export default AdminLiveTests;
