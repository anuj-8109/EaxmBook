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
import { topicsAPI, subjectsAPI, categoriesAPI, aiAPI } from '@/lib/api';
import { Plus, Pencil, Trash2, BookOpen, Search, Filter, X, ChevronLeft, ChevronRight, Tag, Bot, Loader2, Trash, FolderTree, RotateCcw } from 'lucide-react';

import { toast } from 'sonner';
import Loader from '@/components/Loader';
import { PaginationControls } from '@/components/PaginationControls';
import { AdminPageHeading } from '@/components/AdminPageHeading';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Topic {
  _id?: string;
  id?: string;
  name: string;
  description: string;
  subject_id: any;
  subject_id_populated?: { name: string; category_id?: any };
}

interface Subject {
  _id?: string;
  id?: string;
  name: string;
  description: string;
  category_id: any;
}

interface Category {
  _id?: string;
  id?: string;
  name: string;
  icon: string;
}

const Topics = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', subject_id: '' });
  const [aiLoading, setAiLoading] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  
  // Server-side Pagination states
  const [totalPages, setTotalPages] = useState(1);
  const [paginatedTopics, setPaginatedTopics] = useState<Topic[]>([]);
  
  // Multi-select states
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage, selectedSubject]);

  // Fetch subjects when category changes
  useEffect(() => {
    if (selectedCategory && selectedCategory !== 'all') {
      fetchSubjectsForCategory(selectedCategory);
    } else {
      fetchAllSubjects();
    }
  }, [selectedCategory]);

  const fetchData = async () => {
    try {
      const [topicsData, subjectsData, categoriesData] = await Promise.all([
        topicsAPI.getAll(selectedSubject !== 'all' ? selectedSubject : undefined, currentPage, itemsPerPage),
        subjectsAPI.getAll(),
        categoriesAPI.getAll()
      ]);

      // Handle new pagination response format
      const topics = Array.isArray(topicsData) ? topicsData : (topicsData?.topics || []);
      const subjects = Array.isArray(subjectsData) ? subjectsData : (subjectsData?.subjects || []);
      const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.categories || []);

      setTopics(topics);
      setPaginatedTopics(topics);
      if (topicsData?.pagination) {
        setTotalPages(topicsData.pagination.totalPages || 1);
      } else {
        setTotalPages(Math.ceil(topics.length / itemsPerPage) || 1);
      }
      setSubjects(subjects);
      setCategories(categories);
    } catch (error: any) {
      toast.error('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSubjects = async () => {
    try {
      const data = await subjectsAPI.getAll();
      const subjects = Array.isArray(data) ? data : (data?.subjects || []);
      setSubjects(subjects);
    } catch (error: any) {
      console.error('Failed to fetch subjects', error);
    }
  };

  const fetchSubjectsForCategory = async (categoryId: string) => {
    try {
      const data = await subjectsAPI.getAll(categoryId);
      const subjects = Array.isArray(data) ? data : (data?.subjects || []);
      setSubjects(subjects);
    } catch (error: any) {
      console.error('Failed to fetch subjects for category', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await topicsAPI.update(editingId, formData);
        toast.success('Topic updated successfully!');
      } else {
        await topicsAPI.create(formData);
        toast.success('Topic created successfully!');
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', description: '', subject_id: '' });
      fetchData();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleEdit = (topic: Topic) => {
    const subId = topic.subject_id && typeof topic.subject_id === 'object'
      ? (topic.subject_id._id || topic.subject_id.id)
      : topic.subject_id;
    setFormData({
      name: topic.name,
      description: topic.description || '',
      subject_id: subId || ''
    });
    setEditingId(topic._id || topic.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this topic? This will also delete all levels and content associated with it.')) return;

    try {
      await topicsAPI.delete(id);
      toast.success('Topic deleted successfully!');
      fetchData();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  // Multi-select handlers
  const handleSelectTopic = (id: string) => {
    setSelectedTopics(prev => {
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
    if (selectedTopics.size === paginatedTopics.length) {
      setSelectedTopics(new Set());
    } else {
      const allIds = paginatedTopics.map(t => t._id || t.id).filter(Boolean) as string[];
      setSelectedTopics(new Set(allIds));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedTopics.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedTopics.size} topics? This will also delete all levels and content associated with them.`)) return;

    try {
      await topicsAPI.batchDelete(Array.from(selectedTopics));
      toast.success(`${selectedTopics.size} topics deleted successfully!`);
      setSelectedTopics(new Set());
      fetchData();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleAiSuggest = async () => {
    setAiLoading(true);
    try {
      let contextSubject = 'General Subject';
      if (formData.subject_id) {
        const sub = subjects.find(s => (s._id || s.id)?.toString() === formData.subject_id);
        if (sub) contextSubject = sub.name;
      }

      const response = await aiAPI.generate({
        type: 'topics',
        context: { subject: contextSubject },
        count: 1
      });

      if (response.topics && response.topics.length > 0) {
        const generated = response.topics[0];
        setFormData(prev => ({
          ...prev,
          name: generated.name || prev.name,
          description: generated.description || prev.description
        }));
        toast.success('AI successfully suggested a topic!');
      } else {
        toast.error('AI failed to suggest a valid topic');
      }
    } catch (err: any) {
      toast.error(err.message || 'AI generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  // Filter topics (client-side for search only, server-side for pagination)
  const filteredTopics = useMemo(() => {
    // If searching, filter locally
    if (searchQuery) {
      return topics.filter((topic) => {
        const query = searchQuery.toLowerCase();
        const matchesName = topic.name?.toLowerCase().includes(query);
        const matchesDescription = topic.description?.toLowerCase().includes(query);
        return matchesName || matchesDescription;
      });
    }
    return topics;
  }, [topics, searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSubject, selectedCategory]);
  const hasActiveFilters = searchQuery || (selectedSubject && selectedSubject !== 'all') || (selectedCategory && selectedCategory !== 'all');

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedSubject('all');
    setSelectedCategory('all');
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8">
          <Loader text="Loading topics..." />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeading
          title="Topics"
          description="Manage topics under each subject (e.g., Algebra, Trigonometry under Mathematics)"
          action={
            <Button
              variant="outline"
              className="rounded-2xl border border-border/70 px-4 py-2 text-xs"
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setFormData({ name: '', description: '', subject_id: '' });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add topic
            </Button>
          }
        />

        <Dialog open={showForm} onOpenChange={(open) => {
          setShowForm(open);
          if (!open) {
            setEditingId(null);
            setFormData({ name: '', description: '', subject_id: '' });
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex justify-between items-center mr-6">
                <DialogTitle>{editingId ? 'Edit' : 'Create'} Topic</DialogTitle>
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
                  <Label htmlFor="name">Topic Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Algebra, Trigonometry, Geometry"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select value={formData.subject_id} onValueChange={(v) => setFormData({ ...formData, subject_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((sub) => {
                        const subId = sub._id || sub.id;
                        const category = sub.category_id && typeof sub.category_id === 'object'
                          ? sub.category_id
                          : categories.find(c => (c._id || c.id)?.toString() === sub.category_id?.toString());
                        return (
                          <SelectItem key={subId} value={subId?.toString()}>
                            {sub.name} {category && `(${category.icon} ${category.name})`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the topic..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="bg-gradient-primary">
                  {editingId ? 'Update' : 'Create'} Topic
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({ name: '', description: '', subject_id: '' });
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
              Filter Topics
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Search */}
              <div className="md:col-span-1">
                <Label className="text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-1.5 ml-1">
                  <Search className="h-3 w-3 text-indigo-500" /> Search Topics
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

              {/* Subject Filter */}
              <div>
                <Label className="text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-1.5 ml-1">
                  <BookOpen className="h-3 w-3 text-indigo-500" /> Subject
                </Label>
                <Select value={selectedSubject || 'all'} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="h-10 text-xs rounded-xl border-gray-200 bg-gray-50/30 focus:bg-white transition-all hover:border-indigo-200">
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map(sub => {
                      const subId = sub._id || sub.id;
                      const category = sub.category_id && typeof sub.category_id === 'object'
                        ? sub.category_id
                        : categories.find(c => (c._id || c.id)?.toString() === sub.category_id?.toString());
                      return (
                        <SelectItem key={subId} value={subId?.toString()}>
                          {sub.name} {category && `(${category.icon} ${category.name})`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bottom bar for topics */}
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
                    <option value="10">10 topics</option>
                    <option value="25">25 topics</option>
                    <option value="50">50 topics</option>
                    <option value="100">100 topics</option>
                  </select>
                </div>
            </div>
          </CardContent>
        </Card>


        {/* Topics Table */}
        <Card className="border border-border/70 rounded-xl sm:rounded-[1.5rem] shadow-lg">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg md:text-xl">
                Topics ({filteredTopics.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                {selectedTopics.size > 0 && (
                  <Button variant="destructive" size="sm" onClick={handleBatchDelete} className="text-xs sm:text-sm">
                    <Trash className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Delete ({selectedTopics.size})
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
            {filteredTopics.length === 0 ? (
              <div className="py-12 sm:py-16 text-center">
                <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">📚</div>
                <h3 className="text-base sm:text-lg font-semibold mb-2">
                  {topics.length === 0 ? 'No topics created yet' : 'No topics found'}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                  {hasActiveFilters
                    ? 'Try adjusting your filters or search query'
                    : 'Create your first topic to get started. Topics are created under subjects (e.g., Algebra under Mathematics)'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px] text-xs sm:text-sm">
                        <Checkbox
                          checked={paginatedTopics.length > 0 && selectedTopics.size === paginatedTopics.length}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all topics"
                        />
                      </TableHead>
                      <TableHead className="w-[50px] text-xs sm:text-sm">#</TableHead>
                      <TableHead className="text-xs sm:text-sm">Topic Name</TableHead>
                      <TableHead className="text-xs sm:text-sm">Subject</TableHead>
                      <TableHead className="hidden md:table-cell text-xs sm:text-sm">Exam Name</TableHead>
                      <TableHead className="hidden sm:table-cell text-xs sm:text-sm">Description</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTopics.map((topic, index) => {
                      const subject = topic.subject_id && typeof topic.subject_id === 'object'
                        ? topic.subject_id
                        : subjects.find(s => (s._id || s.id)?.toString() === topic.subject_id?.toString());
                      const category = subject && subject.category_id && typeof subject.category_id === 'object'
                        ? subject.category_id
                        : subject && categories.find(c => (c._id || c.id)?.toString() === subject.category_id?.toString());
                      return (
                        <TableRow key={topic._id || topic.id} className="hover:bg-muted/50">
                          <TableCell className="w-[40px]">
                            <Checkbox
                              checked={selectedTopics.has(topic._id || topic.id || '')}
                              onCheckedChange={() => handleSelectTopic(topic._id || topic.id || '')}
                              aria-label={`Select ${topic.name}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium text-xs sm:text-sm">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                              <span className="font-semibold text-xs sm:text-sm break-words">{topic.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs sm:text-sm break-words">
                              {subject?.name || <span className="text-muted-foreground">—</span>}
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
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
                              {topic.description || '—'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 sm:h-8 sm:w-9 p-0"
                                onClick={() => handleEdit(topic)}
                              >
                                <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 sm:h-8 sm:w-9 p-0 border-destructive/40 text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(topic._id || topic.id)}
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
            {paginatedTopics.length > 0 && totalPages > 1 && (
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
                  totalItems={topics.length}
                />

              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Topics;

