import { useState, useEffect, useMemo, useCallback } from 'react';
import { UserLayout } from '@/components/UserLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Video, BookOpen, Search, Filter, X, DollarSign, Clock, File, Play, Bookmark, BookmarkCheck } from 'lucide-react';
import { materialsAPI, categoriesAPI, subjectsAPI, bookmarkedMaterialsAPI } from '@/lib/api';
import { toast } from 'sonner';
import Loader from '@/components/Loader';
import { PaginationControls } from '@/components/PaginationControls';

interface Material {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  material_type: string;
  file_url?: string;
  file_size?: number;
  duration?: number;
  thumbnail_url?: string;
  category_id?: any;
  subject_id?: any;
  topic_id?: any;
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
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const itemsPerPage = 12;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (filterCategory && filterCategory !== 'all') {
      fetchSubjects(filterCategory);
    } else {
      setSubjects([]);
    }
  }, [filterCategory]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [materialsData, categoriesData] = await Promise.all([
        materialsAPI.getAll({ limit: 100 }), // Reduced from 1000 to 100 for better performance
        categoriesAPI.getAll(),
      ]);

      // Filter only active materials
      const activeMaterials = (materialsData?.materials || []).filter((m: Material) => m.is_active);
      setMaterials(activeMaterials);
      // Handle new pagination response format
      let categories = [];
      if (Array.isArray(categoriesData)) {
        categories = categoriesData;
      } else if (categoriesData && typeof categoriesData === 'object') {
        categories = categoriesData.categories || [];
      }
      setCategories(Array.isArray(categories) ? categories : []);

      // Fetch bookmarked materials
      const bookmarksResp = await bookmarkedMaterialsAPI.getAll();
      const bIds = new Set<string>((bookmarksResp?.bookmarkedMaterials || []).map((b: any) => b.material_id?._id || b.material_id?.id));
      setBookmarkedIds(bIds);
    } catch (error: any) {
      toast.error('Failed to load materials');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async (material: Material) => {
    const mId = material._id || material.id;
    if (!mId) return;

    try {
      const isBookmarked = bookmarkedIds.has(mId);
      if (isBookmarked) {
        // Find bookmark record ID to delete
        const bookmarksResp = await bookmarkedMaterialsAPI.getAll();
        const bookmarkRecord = bookmarksResp?.bookmarkedMaterials?.find((b: any) => (b.material_id?._id || b.material_id?.id) === mId);
        if (bookmarkRecord) {
          await bookmarkedMaterialsAPI.delete(bookmarkRecord._id || bookmarkRecord.id);
          setBookmarkedIds(prev => {
            const next = new Set(prev);
            next.delete(mId);
            return next;
          });
          toast.success('Bookmark removed');
        }
      } else {
        await bookmarkedMaterialsAPI.create({ material_id: mId, material_type: material.material_type });
        setBookmarkedIds(prev => {
          const next = new Set(prev);
          next.add(mId);
          return next;
        });
        toast.success('Material bookmarked');
      }
    } catch (error) {
      toast.error('Failed to update bookmark');
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

  // Memoize filtered materials to avoid recalculating on every render
  const filteredMaterials = useMemo(() => {
    return materials.filter(material => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const title = material.title?.toLowerCase() || '';
        const description = material.description?.toLowerCase() || '';
        if (!title.includes(query) && !description.includes(query)) {
          return false;
        }
      }

      // Type filter
      if (filterType !== 'all' && material.material_type !== filterType) {
        return false;
      }

      // Category filter
      if (filterCategory !== 'all') {
        const catId = material.category_id?._id || material.category_id?.id || material.category_id;
        if (catId?.toString() !== filterCategory?.toString()) {
          return false;
        }
      }

      // Subject filter
      if (filterSubject !== 'all') {
        const subId = material.subject_id?._id || material.subject_id?.id || material.subject_id;
        if (subId?.toString() !== filterSubject?.toString()) {
          return false;
        }
      }

      return true;
    });
  }, [materials, searchQuery, filterType, filterCategory, filterSubject]);
  const hasActiveFilters = searchQuery || filterType !== 'all' || filterCategory !== 'all' || filterSubject !== 'all';

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setFilterType('all');
    setFilterCategory('all');
    setFilterSubject('all');
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, filterCategory, filterSubject]);

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5" />;
      case 'pdf':
        return <FileText className="h-5 w-5" />;
      case 'note':
        return <BookOpen className="h-5 w-5" />;
      case 'formula':
        return <File className="h-5 w-5" />;
      case 'theory':
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="p-8">
          <Loader text="Loading materials..." />
        </div>
      </UserLayout>
    );
  }

  const paginatedMaterials = filteredMaterials.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);

  return (
    <UserLayout>
      <div className="w-full py-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Study Materials</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Access PDFs, videos, notes, and more study resources</p>
        </div>

        {/* Filters */}
        <Card className="border border-border/70 rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
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
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Material Type" />
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

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Array.isArray(categories) && categories.map(cat => (
                    <SelectItem key={cat._id || cat.id} value={(cat._id || cat.id)?.toString()}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterSubject} onValueChange={setFilterSubject} disabled={filterCategory === 'all'}>
                <SelectTrigger>
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {Array.isArray(subjects) && subjects.map(sub => (
                    <SelectItem key={sub._id || sub.id} value={(sub._id || sub.id)?.toString()}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Materials Grid */}
        {filteredMaterials.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No materials found</h3>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters
                  ? 'Try adjusting your filters to find more materials'
                  : 'No materials available at the moment'}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {paginatedMaterials.map((material) => {
                const categoryName = material.category_id?.name || '';
                const subjectName = material.subject_id?.name || '';

                return (
                  <Card
                    key={material._id || material.id}
                    className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-border/50"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            {getMaterialIcon(material.material_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base sm:text-lg line-clamp-2 break-words">
                              {material.title}
                            </CardTitle>
                          </div>
                        </div>
                        {material.is_paid && (
                          <Badge className="bg-amber-500 shrink-0">
                            <DollarSign className="h-3 w-3 mr-1" />
                            Paid
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); toggleBookmark(material); }}
                          className={`h-8 w-8 rounded-lg ${bookmarkedIds.has(material._id || material.id || '') ? 'text-orange-500 bg-orange-50' : 'text-slate-400'}`}
                        >
                          {bookmarkedIds.has(material._id || material.id || '') ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                        </Button>
                      </div>
                      {material.description && (
                        <CardDescription className="line-clamp-2 text-sm break-words">
                          {material.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {categoryName && (
                          <Badge variant="outline">{categoryName}</Badge>
                        )}
                        {subjectName && (
                          <Badge variant="outline">{subjectName}</Badge>
                        )}
                        <Badge variant="secondary" className="capitalize">
                          {material.material_type}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {material.file_size && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {formatFileSize(material.file_size)}
                          </div>
                        )}
                        {material.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(material.duration)}
                          </div>
                        )}
                        {material.download_count > 0 && (
                          <div className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {material.download_count}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {material.file_url && (
                          <Button
                            className="flex-1"
                            onClick={() => {
                              if (material.is_paid) {
                                toast.info('This is a paid material. Please purchase to access.');
                              } else {
                                window.open(material.file_url, '_blank');
                              }
                            }}
                            variant={material.material_type === 'video' ? 'default' : 'default'}
                          >
                            {material.material_type === 'video' ? (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Watch
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </>
                            )}
                          </Button>
                        )}
                        {material.is_paid && (
                          <Button variant="outline" className="shrink-0">
                            <DollarSign className="h-4 w-4 mr-1" />
                            ₹{material.price}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              </div>
            )}
          </>
        )}
      </div>
    </UserLayout>
  );
};

export default Materials;

