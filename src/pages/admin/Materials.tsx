import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, FileText, Upload, Download, Search, Video, BookOpen, X } from 'lucide-react';
import { toast } from 'sonner';
import { materialsAPI, categoriesAPI, subjectsAPI, topicsAPI, uploadAPI } from '@/lib/api';
import Loader from '@/components/Loader';
import { PaginationControls } from '@/components/PaginationControls';
import { AdminPageHeading } from '@/components/AdminPageHeading';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Material {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  material_type: string;
  file_url?: string;
  file_size?: number;
  duration?: number;
  category_id?: any;
  subject_id?: any;
  topic_id?: any;
  level_number?: number;
  is_paid: boolean;
  price: number;
  download_count: number;
  view_count: number;
  is_active: boolean;
}

const Materials = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [uploadingPDF, setUploadingPDF] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    material_type: 'pdf',
    file_url: '',
    file_size: '',
    duration: '',
    category_id: '',
    subject_id: '',
    topic_id: '',
    level_number: '',
    is_paid: false,
    price: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.category_id) {
      fetchSubjects(formData.category_id);
    }
  }, [formData.category_id]);

  useEffect(() => {
    if (formData.subject_id) {
      fetchTopics(formData.subject_id);
    }
  }, [formData.subject_id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [materialsData, categoriesData] = await Promise.all([
        materialsAPI.getAll({ limit: 100 }),
        categoriesAPI.getAll(false), // Get flat list, not tree
      ]);
      setMaterials(materialsData?.materials || []);
      // Handle new pagination response format
      let categories = [];
      if (Array.isArray(categoriesData)) {
        categories = categoriesData;
      } else if (categoriesData && typeof categoriesData === 'object') {
        categories = categoriesData.categories || [];
      }
      setCategories(Array.isArray(categories) ? categories : []);
    } catch (error: any) {
      toast.error('Failed to load data');
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
    } catch (error) {
      console.error('Failed to load subjects');
    }
  };

  const fetchTopics = async (subjectId: string) => {
    try {
      const data = await topicsAPI.getAll(subjectId);
      // Handle new pagination response format
      const topics = Array.isArray(data)
        ? data
        : (data?.topics || []);
      setTopics(topics);
    } catch (error) {
      console.error('Failed to load topics');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        file_size: formData.file_size ? parseInt(formData.file_size) : undefined,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        level_number: formData.level_number ? parseInt(formData.level_number) : undefined,
        price: formData.price ? parseFloat(formData.price) : 0,
        category_id: formData.category_id || undefined,
        subject_id: formData.subject_id || undefined,
        topic_id: formData.topic_id || undefined,
      };

      if (editingMaterial) {
        await materialsAPI.update(editingMaterial._id || editingMaterial.id || '', payload);
        toast.success('Material updated successfully!');
      } else {
        await materialsAPI.create(payload);
        toast.success('Material created successfully!');
      }
      setShowForm(false);
      setEditingMaterial(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save material');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      title: material.title,
      description: material.description || '',
      material_type: material.material_type,
      file_url: material.file_url || '',
      file_size: material.file_size?.toString() || '',
      duration: material.duration?.toString() || '',
      category_id: typeof material.category_id === 'object'
        ? (material.category_id._id || material.category_id.id)
        : material.category_id || '',
      subject_id: typeof material.subject_id === 'object'
        ? (material.subject_id._id || material.subject_id.id)
        : material.subject_id || '',
      topic_id: typeof material.topic_id === 'object'
        ? (material.topic_id._id || material.topic_id.id)
        : material.topic_id || '',
      level_number: material.level_number?.toString() || '',
      is_paid: material.is_paid || false,
      price: material.price?.toString() || '',
    });
    if (material.category_id) {
      const catId = typeof material.category_id === 'object'
        ? (material.category_id._id || material.category_id.id)
        : material.category_id;
      fetchSubjects(catId);
    }
    if (material.subject_id) {
      const subId = typeof material.subject_id === 'object'
        ? (material.subject_id._id || material.subject_id.id)
        : material.subject_id;
      fetchTopics(subId);
    }
    setShowForm(true);
  };

  const handleDelete = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;
    setLoading(true);
    try {
      await materialsAPI.delete(materialId);
      toast.success('Material deleted successfully!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete material');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      material_type: 'pdf',
      file_url: '',
      file_size: '',
      duration: '',
      category_id: '',
      subject_id: '',
      topic_id: '',
      level_number: '',
      is_paid: false,
      price: '',
    });
    setSubjects([]);
    setTopics([]);
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || material.material_type === filterType;
    return matchesSearch && matchesType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMaterials = filteredMaterials.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (loading && materials.length === 0) {
    return (
      <AdminLayout>
        <div className="p-3 sm:p-4 md:p-6 lg:p-8">
          <Loader text="Loading materials..." />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        <AdminPageHeading
          eyebrow="Study Materials"
          title="Material Management"
          description="Upload and manage PDFs, videos, notes, and reading materials"
          action={
            <Button
              variant="outline"
              className="rounded-xl sm:rounded-2xl text-xs sm:text-sm"
              size="sm"
              onClick={() => {
                setEditingMaterial(null);
                resetForm();
                setShowForm(true);
              }}
            >
              <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Add Material</span>
              <span className="sm:hidden">Add</span>
            </Button>
          }
        />

        <Dialog open={showForm} onOpenChange={(open) => {
          setShowForm(open);
          if (!open) {
            setEditingMaterial(null);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg md:text-xl">{editingMaterial ? 'Edit Material' : 'Create New Material'}</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="md:col-span-2">
                    <Label className="text-xs sm:text-sm">Title *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="text-xs sm:text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs sm:text-sm">Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm">Material Type *</Label>
                    <Select value={formData.material_type} onValueChange={(value) => setFormData({ ...formData, material_type: value })}>
                      <SelectTrigger className="text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="note">Note</SelectItem>
                        <SelectItem value="formula">Formula</SelectItem>
                        <SelectItem value="theory">Theory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm">File URL *</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.file_url}
                        onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                        placeholder="https://... or upload PDF"
                        required
                        className="text-xs sm:text-sm"
                      />
                      {formData.material_type === 'pdf' && (
                        <>
                          <input
                            type="file"
                            id="material_pdf_upload"
                            accept="application/pdf"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;

                              // Validate file size (50MB)
                              if (file.size > 50 * 1024 * 1024) {
                                toast.error('PDF size must be less than 50MB');
                                return;
                              }

                              // Validate file type
                              if (file.type !== 'application/pdf') {
                                toast.error('Only PDF files are allowed');
                                return;
                              }

                              setUploadingPDF(true);
                              try {
                                const result = await uploadAPI.uploadMaterialPDF(file);
                                setFormData(prev => ({
                                  ...prev,
                                  file_url: result.url,
                                  file_size: result.size.toString()
                                }));
                                toast.success('PDF uploaded successfully');
                              } catch (error: any) {
                                toast.error(error.message || 'Failed to upload PDF');
                              } finally {
                                setUploadingPDF(false);
                                // Reset input
                                e.target.value = '';
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => document.getElementById('material_pdf_upload')?.click()}
                            disabled={uploadingPDF}
                            className="rounded-xl"
                            title="Upload PDF"
                          >
                            {uploadingPDF ? (
                              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                      {formData.file_url && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setFormData(prev => ({ ...prev, file_url: '', file_size: '' }))}
                          className="rounded-xl"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.material_type === 'pdf'
                        ? 'Paste PDF URL or click upload button to upload PDF file'
                        : 'Enter file URL'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm">File Size (bytes)</Label>
                    <Input
                      type="number"
                      value={formData.file_size}
                      onChange={(e) => setFormData({ ...formData, file_size: e.target.value })}
                      placeholder="e.g., 1048576"
                      className="text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm">Duration (seconds, for videos)</Label>
                    <Input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="e.g., 3600"
                      className="text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm">Exam Name</Label>
                    <Select value={formData.category_id || 'none'} onValueChange={(value) => {
                      const categoryId = value === 'none' ? '' : value;
                      setFormData({ ...formData, category_id: categoryId, subject_id: '', topic_id: '' });
                    }}>
                      <SelectTrigger className="text-xs sm:text-sm">
                        <SelectValue placeholder="Select exam name" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {Array.isArray(categories) && categories.map((cat) => (
                          <SelectItem key={cat._id || cat.id} value={cat._id || cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm">Subject</Label>
                    <Select value={formData.subject_id || 'none'} onValueChange={(value) => {
                      const subjectId = value === 'none' ? '' : value;
                      setFormData({ ...formData, subject_id: subjectId, topic_id: '' });
                    }}>
                      <SelectTrigger className="text-xs sm:text-sm">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {Array.isArray(subjects) && subjects.map((sub) => (
                          <SelectItem key={sub._id || sub.id} value={sub._id || sub.id}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm">Topic</Label>
                    <Select value={formData.topic_id || 'none'} onValueChange={(value) => {
                      const topicId = value === 'none' ? '' : value;
                      setFormData({ ...formData, topic_id: topicId });
                    }}>
                      <SelectTrigger className="text-xs sm:text-sm">
                        <SelectValue placeholder="Select topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {Array.isArray(topics) && topics.map((topic) => (
                          <SelectItem key={topic._id || topic.id} value={topic._id || topic.id}>
                            {topic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm">Level Number (for Basic to Advance)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.level_number}
                      onChange={(e) => setFormData({ ...formData, level_number: e.target.value })}
                      placeholder="1-10"
                      className="text-xs sm:text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_paid}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_paid: checked })}
                    />
                    <Label className="text-xs sm:text-sm">Paid Material</Label>
                  </div>
                  {formData.is_paid && (
                    <div>
                      <Label className="text-xs sm:text-sm">Price (₹)</Label>
                      <Input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="0"
                        className="text-xs sm:text-sm"
                      />
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  <Button type="submit" disabled={loading} className="text-xs sm:text-sm" size="sm">
                    {editingMaterial ? 'Update Material' : 'Create Material'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setShowForm(false);
                    setEditingMaterial(null);
                    resetForm();
                  }} className="text-xs sm:text-sm" size="sm">
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        <Card className="border border-border/70 rounded-xl sm:rounded-[1.5rem] shadow-lg">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <CardTitle className="text-base sm:text-lg md:text-xl">All Materials</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-32 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="formula">Formula</SelectItem>
                    <SelectItem value="theory">Theory</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search materials..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-7 sm:pl-8 w-full text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="space-y-3 sm:space-y-4">
              {paginatedMaterials.map((material) => (
                <div key={material._id || material.id} className="p-3 sm:p-4 border rounded-lg sm:rounded-xl hover:bg-slate-50">
                  <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-4">
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                        {material.material_type === 'pdf' && <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 flex-shrink-0" />}
                        {material.material_type === 'video' && <Video className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />}
                        {material.material_type === 'note' && <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />}
                        <h3 className="font-semibold text-sm sm:text-base break-words flex-1 min-w-0">{material.title}</h3>
                        <Badge variant="outline" className="text-[10px] sm:text-xs flex-shrink-0">{material.material_type.toUpperCase()}</Badge>
                        {material.is_paid && <Badge variant="default" className="text-[10px] sm:text-xs flex-shrink-0">₹{material.price}</Badge>}
                      </div>
                      {material.description && <p className="text-xs sm:text-sm text-muted-foreground mb-2 break-words">{material.description}</p>}
                      <div className="flex gap-1.5 sm:gap-2 flex-wrap mb-2">
                        {material.category_id && (
                          <Badge variant="secondary" className="text-[10px] sm:text-xs">
                            {typeof material.category_id === 'object' ? material.category_id.name : 'Exam Name'}
                          </Badge>
                        )}
                        {material.subject_id && (
                          <Badge variant="secondary" className="text-[10px] sm:text-xs">
                            {typeof material.subject_id === 'object' ? material.subject_id.name : 'Subject'}
                          </Badge>
                        )}
                        {material.topic_id && (
                          <Badge variant="secondary" className="text-[10px] sm:text-xs">
                            {typeof material.topic_id === 'object' ? material.topic_id.name : 'Topic'}
                          </Badge>
                        )}
                        {material.level_number && (
                          <Badge variant="secondary" className="text-[10px] sm:text-xs">Level {material.level_number}</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 sm:gap-4 mt-2 text-[10px] sm:text-xs text-muted-foreground">
                        <span>📥 {material.download_count || 0} downloads</span>
                        <span>👁️ {material.view_count || 0} views</span>
                        {material.file_size && <span>📦 {formatFileSize(material.file_size)}</span>}
                        {material.duration && <span>⏱️ {Math.floor(material.duration / 60)} min</span>}
                      </div>
                    </div>
                    <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
                      {material.file_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(material.file_url, '_blank')}
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                        >
                          <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleEdit(material)} className="h-8 w-8 sm:h-9 sm:w-9 p-0">
                        <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(material._id || material.id || '')} className="h-8 w-8 sm:h-9 sm:w-9 p-0">
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredMaterials.length === 0 && (
                <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-muted-foreground">No materials found</div>
              )}
            </div>
            {filteredMaterials.length > 0 && (
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

export default Materials;

