import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronRight, ChevronDown, GripVertical, Plus, Edit, Trash2 } from 'lucide-react';
import { categoriesAPI } from '@/lib/api';
import { toast } from 'sonner';
import { AdminPageHeading } from '@/components/AdminPageHeading';

interface Category {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  icon?: string;
  parent_id?: string | null;
  order?: number;
  test_category_type?: string;
  children?: Category[];
}

export const CategoryTree = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📚',
    parent_id: '',
    test_category_type: 'Other',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await categoriesAPI.getAll(true);
      setCategories(data || []);
    } catch (error: any) {
      toast.error('Failed to load categories');
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await categoriesAPI.update(editingId, formData);
        toast.success('Category updated successfully!');
      } else {
        await categoriesAPI.create(formData);
        toast.success('Category created successfully!');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', description: '', icon: '📚', parent_id: '', test_category_type: 'Other' });
      fetchCategories();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '📚',
      parent_id: category.parent_id || '',
      test_category_type: category.test_category_type || 'Other',
    });
    setEditingId(category._id || category.id || null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await categoriesAPI.delete(id);
      toast.success('Category deleted successfully!');
      fetchCategories();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleReorder = async (newOrder: Category[]) => {
    try {
      const reorderData = flattenCategories(newOrder).map((cat, index) => ({
        id: cat._id || cat.id,
        order: index,
        parent_id: cat.parent_id || null,
      }));
      await categoriesAPI.reorder(reorderData);
      toast.success('Categories reordered successfully!');
      fetchCategories();
    } catch (error: any) {
      toast.error('Failed to reorder categories');
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

  const renderCategory = (category: Category, level: number = 0) => {
    const id = category._id || category.id || '';
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expanded[id];

    return (
      <div key={id} className="mb-2">
        <div
          className={`flex items-center gap-2 p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/50 transition ${
            level > 0 ? 'ml-6' : ''
          }`}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
          {hasChildren ? (
            <button onClick={() => toggleExpand(id)} className="p-1">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <div className="w-6" />
          )}
          <span className="text-xl">{category.icon || '📚'}</span>
          <div className="flex-1">
            <p className="font-semibold">{category.name}</p>
            {category.test_category_type && (
              <p className="text-xs text-muted-foreground">{category.test_category_type}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => handleEdit(category)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleDelete(id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-2">
            {category.children?.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <AdminPageHeading
        eyebrow="Structure"
        title="Category Tree"
        description="Manage exam categories in a hierarchical tree structure"
        action={
          <Button variant="outline" className="rounded-2xl border border-border/70 px-4 py-2 text-xs" onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ name: '', description: '', icon: '📚', parent_id: '', test_category_type: 'Other' });
          }}>
            <Plus className="h-4 w-4 mr-2" />
            {showForm ? 'Close form' : 'Add category'}
          </Button>
        }
      />

      {showForm && (
        <Card className="border border-border/70 rounded-[1.5rem] shadow-lg">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit' : 'Create'} Category</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Railway"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icon">Icon (Emoji)</Label>
                  <Input
                    id="icon"
                    placeholder="🚂"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent_id">Parent Category (Optional)</Label>
                <Select value={formData.parent_id || 'none'} onValueChange={(v) => setFormData({ ...formData, parent_id: v === 'none' ? '' : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Root Category)</SelectItem>
                    {flattenCategories(categories).map((cat) => {
                      const catId = (cat._id || cat.id)?.toString();
                      if (!catId) return null;
                      return (
                        <SelectItem key={catId} value={catId}>
                          {cat.icon} {cat.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="test_category_type">Test Category Type</Label>
                <Select
                  value={formData.test_category_type}
                  onValueChange={(v) => setFormData({ ...formData, test_category_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Previous Year Paper">Previous Year Paper</SelectItem>
                    <SelectItem value="Mock Test">Mock Test</SelectItem>
                    <SelectItem value="Subject-Wise Test">Subject-Wise Test</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="rounded-2xl px-6">
                  {editingId ? 'Update' : 'Create'} Category
                </Button>
                <Button type="button" variant="outline" className="rounded-2xl" onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border border-border/70 rounded-[1.5rem] shadow-lg">
        <CardHeader>
          <CardTitle>Category Tree Structure</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No categories yet. Create one to get started.</p>
          ) : (
            <div className="space-y-2">
              {categories.map(category => renderCategory(category))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

