import { useState, useEffect, useMemo, useCallback } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { subjectsAPI, categoriesAPI, aiAPI } from '@/lib/api';
import { Plus, Pencil, Trash2, BookOpen, Search, Filter, X, ChevronLeft, ChevronRight, Bot, Loader2, Trash, FolderTree, RotateCcw } from 'lucide-react';

import { toast } from 'sonner';
import Loader from '@/components/Loader';
import { PaginationControls } from '@/components/PaginationControls';
import { AdminPageHeading } from '@/components/AdminPageHeading';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Subject {
  _id?: string;
  id?: string;
  name: string;
  description: string;
  category_id: any;
  category_id_populated?: { name: string; icon: string };
}

interface Category {
  _id?: string;
  id?: string;
  name: string;
  icon: string;
}

const Subjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', category_id: '' });
  const [aiLoading, setAiLoading] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  
  // Server-side Pagination states
  const [totalPages, setTotalPages] = useState(1);
  const [paginatedSubjects, setPaginatedSubjects] = useState<Subject[]>([]);
  
  // Multi-select states
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage, selectedCategory]);

  const fetchData = async () => {
    try {
      const [subjectsData, categoriesData] = await Promise.all([
        subjectsAPI.getAll(selectedCategory !== 'all' ? selectedCategory : undefined, currentPage, itemsPerPage),
        categoriesAPI.getAll()
      ]);

      // Handle new pagination response format
      const subjects = Array.isArray(subjectsData) ? subjectsData : (subjectsData?.subjects || []);
      const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.categories || []);

      setSubjects(subjects);
      setPaginatedSubjects(subjects);
      if (subjectsData?.pagination) {
        setTotalPages(subjectsData.pagination.totalPages || 1);
      } else {
        setTotalPages(Math.ceil(subjects.length / itemsPerPage) || 1);
      }
      setCategories(categories);
    } catch (error: any) {
      toast.error('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        category_id: formData.category_id || undefined, // Convert empty string to undefined for optional field
      };

      if (editingId) {
        await subjectsAPI.update(editingId, payload);
        toast.success('Subject updated successfully!');
      } else {
        await subjectsAPI.create(payload);
        toast.success('Subject created successfully!');
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', description: '', category_id: '' });
      fetchData();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleEdit = (subject: Subject) => {
    const catId = subject.category_id && typeof subject.category_id === 'object'
      ? (subject.category_id._id || subject.category_id.id)
      : subject.category_id;
    setFormData({
      name: subject.name,
      description: subject.description || '',
      category_id: catId || ''
    });
    setEditingId(subject._id || subject.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;

    try {
      await subjectsAPI.delete(id);
      toast.success('Subject deleted successfully!');
      fetchData();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  // Multi-select handlers
  const handleSelectSubject = (id: string) => {
    setSelectedSubjects(prev => {
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
    if (selectedSubjects.size === paginatedSubjects.length) {
      setSelectedSubjects(new Set());
    } else {
      const allIds = paginatedSubjects.map(s => s._id || s.id).filter(Boolean) as string[];
      setSelectedSubjects(new Set(allIds));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedSubjects.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedSubjects.size} subjects?`)) return;

    try {
      await subjectsAPI.batchDelete(Array.from(selectedSubjects));
      toast.success(`${selectedSubjects.size} subjects deleted successfully!`);
      setSelectedSubjects(new Set());
      fetchData();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleAiSuggest = async () => {
    setAiLoading(true);
    try {
      let contextSubject = 'General';
      if (formData.category_id) {
        const cat = categories.find(c => (c._id || c.id)?.toString() === formData.category_id);
        if (cat) contextSubject = cat.name;
      }
      const response = await aiAPI.generate({
        type: 'subjects',
        context: { subject: contextSubject },
        count: 1
      });
      if (response.subjects && response.subjects.length > 0) {
        const generated = response.subjects[0];
        setFormData(prev => ({
          ...prev,
          name: generated.name || prev.name,
          description: generated.description || prev.description
        }));
        toast.success('AI successfully suggested a subject!');
      } else {
        toast.error('AI failed to suggest a valid subject');
      }
    } catch (err: any) {
      toast.error(err.message || 'AI generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  // Memoize filtered subjects to avoid recalculating on every render
  const filteredSubjects = useMemo(() => {
    return subjects.filter(subject => {
      // Category filter
      if (selectedCategory && selectedCategory !== 'all') {
        const catId = subject.category_id && typeof subject.category_id === 'object'
          ? (subject.category_id._id || subject.category_id.id)
          : subject.category_id;
        if (catId?.toString() !== selectedCategory?.toString()) {
          return false;
        }
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const subjectName = subject.name?.toLowerCase() || '';
        const description = subject.description?.toLowerCase() || '';
        const categoryName = subject.category_id && typeof subject.category_id === 'object'
          ? subject.category_id?.name?.toLowerCase() || ''
          : '';

        if (!subjectName.includes(query) &&
          !description.includes(query) &&
          !categoryName.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [subjects, selectedCategory, searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);
  const hasActiveFilters = searchQuery || (selectedCategory && selectedCategory !== 'all');

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
    setCurrentPage(1);
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8">
          <Loader text="Loading subjects..." />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeading
          title="Subjects"
          description="Manage subjects for each exam name"
          action={
            <Button
              variant="outline"
              className="rounded-2xl border border-border/70 px-4 py-2 text-xs"
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setFormData({ name: '', description: '', category_id: '' });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add subject
            </Button>
          }
        />

        <Dialog open={showForm} onOpenChange={(open) => {
          setShowForm(open);
          if (!open) {
            setEditingId(null);
            setFormData({ name: '', description: '', category_id: '' });
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex justify-between items-center mr-6">
                <DialogTitle>{editingId ? 'Edit' : 'Create'} Subject</DialogTitle>
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
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Subject Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., History"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Exam Name (Optional)</Label>
                  <Select value={formData.category_id || 'none'} onValueChange={(v) => setFormData({ ...formData, category_id: v === 'none' ? '' : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select exam name (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat._id || cat.id} value={(cat._id || cat.id)?.toString()}>
                          {cat.icon} {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the subject..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="bg-gradient-primary">
                  {editingId ? 'Update' : 'Create'} Subject
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({ name: '', description: '', category_id: '' });
                }}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modernized Filters Section */}
        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden transition-all hover:shadow-md">
          <div className="bg-gray-50/50 border-b border-gray-100 px-5 py-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Filter className="h-3.5 w-3.5" />
              Filter Subjects
            </h3>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="xs" 
                className="h-7 px-2 text-[10px] font-bold text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                onClick={clearFilters}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset All
              </Button>
            </div>
          </div>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Search */}
              <div className="md:col-span-1">
                <Label className="text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-1.5 ml-1">
                  <Search className="h-3 w-3 text-indigo-500" /> Search Subjects
                </Label>
                <div className="relative group">
                  <Input
                    placeholder="Search name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 text-xs rounded-xl border-gray-200 bg-gray-50/30 pl-9 focus:bg-white transition-all group-hover:border-indigo-200"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <Label className="text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-1.5 ml-1">
                  <FolderTree className="h-3 w-3 text-indigo-500" /> Exam Name
                </Label>
                <Select value={selectedCategory || 'all'} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-10 text-xs rounded-xl border-gray-200 bg-gray-50/30 focus:bg-white transition-all hover:border-indigo-200">
                    <SelectValue placeholder="All Exam Names" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                    <SelectItem value="all">All Exam Names</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat._id || cat.id} value={(cat._id || cat.id)?.toString()}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bottom bar for subjects */}
            <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Live Filtering Active
                  </span>
               </div>
               <div className="flex items-center gap-3 bg-gray-50/50 px-3 py-1.5 rounded-xl border border-gray-100">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight whitespace-nowrap">Show</Label>
                  <select 
                    value={itemsPerPage.toString()} 
                    onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
                    className="bg-transparent border-none text-[11px] font-bold text-indigo-600 focus:ring-0 cursor-pointer"
                  >
                    <option value="10">10 subjects</option>
                    <option value="25">25 subjects</option>
                    <option value="50">50 subjects</option>
                    <option value="100">100 subjects</option>
                  </select>
                </div>
            </div>
          </CardContent>
        </Card>


        {/* Subjects Table */}
        <Card className="border border-border/70 rounded-xl sm:rounded-[1.5rem] shadow-lg">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg md:text-xl">
                Subjects ({subjects.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                {selectedSubjects.size > 0 && (
                  <Button variant="destructive" size="sm" onClick={handleBatchDelete} className="text-xs sm:text-sm">
                    <Trash className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Delete ({selectedSubjects.size})
                  </Button>
                )}
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="text-xs sm:text-sm">
                    <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {paginatedSubjects.length === 0 ? (
              <div className="py-12 sm:py-16 text-center">
                <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">📚</div>
                <h3 className="text-base sm:text-lg font-semibold mb-2">
                  {subjects.length === 0 ? 'No subjects created yet' : 'No subjects found'}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                  {hasActiveFilters
                    ? 'Try adjusting your filters or search query'
                    : 'Create your first subject to get started'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px] text-xs sm:text-sm">
                        <Checkbox
                          checked={paginatedSubjects.length > 0 && selectedSubjects.size === paginatedSubjects.length}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all subjects"
                        />
                      </TableHead>
                      <TableHead className="w-[50px] text-xs sm:text-sm">#</TableHead>
                      <TableHead className="text-xs sm:text-sm">Subject Name</TableHead>
                      <TableHead className="text-xs sm:text-sm">Exam Name</TableHead>
                      <TableHead className="hidden sm:table-cell text-xs sm:text-sm">Description</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSubjects.map((subject, index) => {
                      const category = subject.category_id && typeof subject.category_id === 'object'
                        ? subject.category_id
                        : categories.find(c => (c._id || c.id)?.toString() === subject.category_id?.toString());
                      return (
                        <TableRow key={subject._id || subject.id} className="hover:bg-muted/50">
                          <TableCell className="w-[40px]">
                            <Checkbox
                              checked={selectedSubjects.has(subject._id || subject.id || '')}
                              onCheckedChange={() => handleSelectSubject(subject._id || subject.id || '')}
                              aria-label={`Select ${subject.name}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium text-xs sm:text-sm">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                              <span className="font-semibold text-xs sm:text-sm break-words">{subject.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {category ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-base sm:text-lg">{category.icon}</span>
                                <span className="text-xs sm:text-sm break-words">{category.name}</span>
                              </div>
                            ) : (
                              <span className="text-xs sm:text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <span className="text-xs sm:text-sm text-muted-foreground line-clamp-2 break-words">
                              {subject.description || '—'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 sm:h-8 sm:w-9 p-0"
                                onClick={() => handleEdit(subject)}
                              >
                                <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 sm:h-8 sm:w-9 p-0 border-destructive/40 text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(subject._id || subject.id)}
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            {paginatedSubjects.length > 0 && totalPages > 1 && (
              <div className="p-4 border-t bg-slate-50/50">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={(val) => {
                    setItemsPerPage(val);
                    setCurrentPage(1);
                  }}
                  totalItems={subjects.length} // Note: This might be inaccurate if backend paginates differently, but let's assume this for now
                />

              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Subjects;
