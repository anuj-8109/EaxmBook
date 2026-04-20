import { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { categoriesAPI } from '@/lib/api';
import { Plus, Pencil, Trash2, GripVertical, ArrowUp, ArrowDown, FolderTree, Sparkles, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import Loader from '@/components/Loader';
import { PaginationControls } from '@/components/PaginationControls';
import gsap from 'gsap';

interface Category {
  _id?: string;
  id?: string;
  name: string;
  description: string;
  icon: string;
  test_category_type?: string;
  order?: number;
}

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', icon: '📚', test_category_type: 'Other' });
  const [reordering, setReordering] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const pageRef = useRef<HTMLDivElement>(null);

  // Pagination
  const totalPages = Math.ceil(categories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCategories = categories.slice(startIndex, endIndex);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!loading && pageRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo('.category-card', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' });
      });
      return () => ctx.revert();
    }
  }, [loading, categories]);


  const fetchCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      // Handle new pagination response format
      const categories = Array.isArray(data) ? data : (data?.categories || []);
      const sorted = categories.sort((a: Category, b: Category) => (a.order ?? 0) - (b.order ?? 0));
      setCategories(sorted);
    } catch (error: any) {
      toast.error('Failed to load categories: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await categoriesAPI.update(editingId, formData);
        toast.success('Exam name updated successfully!');
      } else {
        await categoriesAPI.create(formData);
        toast.success('Exam name created successfully!');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', description: '', icon: '📚', test_category_type: 'Other' });
      fetchCategories();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleEdit = (category: Category) => {
    setFormData({ name: category.name, description: category.description || '', icon: category.icon || '📚', test_category_type: category.test_category_type || 'Other' });
    setEditingId(category._id || category.id || null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exam name?')) return;
    try {
      await categoriesAPI.delete(id);
      toast.success('Exam name deleted successfully!');
      fetchCategories();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newCategories = [...categories];
    [newCategories[index], newCategories[index - 1]] = [newCategories[index - 1], newCategories[index]];
    setCategories(newCategories);
    await saveOrder(newCategories);
  };

  const handleMoveDown = async (index: number) => {
    if (index === categories.length - 1) return;
    const newCategories = [...categories];
    [newCategories[index], newCategories[index + 1]] = [newCategories[index + 1], newCategories[index]];
    setCategories(newCategories);
    await saveOrder(newCategories);
  };

  const saveOrder = async (orderedCategories: Category[]) => {
    setReordering(true);
    try {
      const reorderData = orderedCategories.map((cat, index) => ({ id: cat._id || cat.id, order: index, parent_id: null }));
      await categoriesAPI.reorder(reorderData);
      toast.success('Exam name order updated!');
    } catch (error: any) {
      toast.error('Failed to save order: ' + error.message);
      fetchCategories();
    } finally {
      setReordering(false);
    }
  };

  const categoryTypeColors: Record<string, string> = {
    'Previous Year Paper': 'from-amber-500 to-orange-500',
    'Mock Test': 'from-blue-500 to-cyan-500',
    'Subject-Wise Test': 'from-emerald-500 to-teal-500',
    'Other': 'from-violet-500 to-purple-500',
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8"><Loader text="Loading categories..." /></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div ref={pageRef} className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 p-6 sm:p-8 text-white">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '24px 24px' }} />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
                <FolderTree className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Exam Names</h1>
                <p className="text-white/80 mt-1">Organize your tests by exam names</p>
              </div>
            </div>
            <Button
              onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', description: '', icon: '📚', test_category_type: 'Other' }); }}
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Exam Name
            </Button>
          </div>
        </div>

        {/* Form Dialog */}
        <Dialog open={showForm} onOpenChange={(open) => {
          setShowForm(open);
          if (!open) {
            setEditingId(null);
            setFormData({ name: '', description: '', icon: '📚', test_category_type: 'Other' });
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-500" />
                {editingId ? 'Edit Exam Name' : 'Create New Exam Name'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-semibold">Exam Name</Label>
                  <Input id="name" placeholder="e.g., SSC, UPSC, Banking" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="rounded-xl" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icon" className="font-semibold">Icon (Emoji)</Label>
                  <Input id="icon" placeholder="📚" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} className="rounded-xl text-2xl" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="test_category_type" className="font-semibold">Exam Type</Label>
                <Select value={formData.test_category_type} onValueChange={(value) => setFormData({ ...formData, test_category_type: value })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Previous Year Paper">📋 Previous Year Paper</SelectItem>
                    <SelectItem value="Mock Test">🎯 Mock Test</SelectItem>
                    <SelectItem value="Subject-Wise Test">📖 Subject-Wise Test</SelectItem>
                    <SelectItem value="Other">📦 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="font-semibold">Description</Label>
                <Textarea id="description" placeholder="Brief description of the exam..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="rounded-xl min-h-[100px]" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 px-6">
                  {editingId ? 'Update Exam Name' : 'Create Exam Name'}
                </Button>
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => { setShowForm(false); setEditingId(null); setFormData({ name: '', description: '', icon: '📚', test_category_type: 'Other' }); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Categories List */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-violet-500" />
                Exam Names ({categories.length})
              </CardTitle>
              <p className="text-sm text-muted-foreground">Use arrows to reorder</p>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {categories.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
                  <FolderTree className="w-10 h-10 text-violet-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Exam Names Yet</h3>
                <p className="text-muted-foreground mb-4">Create your first exam name to get started.</p>
                <Button onClick={() => setShowForm(true)} className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-500">
                  <Plus className="w-4 h-4 mr-2" /> Create Exam Name
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedCategories.map((category, index) => {
                  const actualIndex = startIndex + index;
                  return (
                    <div
                      key={category._id || category.id}
                      className="category-card group flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-white hover:border-violet-300 hover:shadow-lg transition-all duration-200"
                    >
                      {/* Reorder Controls */}
                      <div className="flex items-center gap-1">
                        <GripVertical className="h-5 w-5 text-slate-300 cursor-move" />
                        <div className="flex flex-col gap-0.5">
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6 rounded-lg hover:bg-violet-100" onClick={() => handleMoveUp(actualIndex)} disabled={actualIndex === 0 || reordering}>
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6 rounded-lg hover:bg-violet-100" onClick={() => handleMoveDown(actualIndex)} disabled={actualIndex === categories.length - 1 || reordering}>
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Category Icon */}
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center text-3xl shrink-0">
                        {category.icon}
                      </div>

                      {/* Category Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-lg truncate">{category.name}</h3>
                          {category.test_category_type && (
                            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full text-white bg-gradient-to-r ${categoryTypeColors[category.test_category_type] || categoryTypeColors['Other']}`}>
                              {category.test_category_type}
                            </span>
                          )}
                        </div>
                        {category.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{category.description}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="outline" className="rounded-xl hover:bg-violet-50 hover:border-violet-300" onClick={() => handleEdit(category)}>
                          <Pencil className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-xl text-red-500 hover:bg-red-50 hover:border-red-300 hover:text-red-600" onClick={() => handleDelete(category._id || category.id || '')}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {categories.length > 0 && (
              <div className="p-4 border-t bg-slate-50/50">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Categories;
