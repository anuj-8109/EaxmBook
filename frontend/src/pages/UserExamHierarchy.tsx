import { useState, useEffect, MouseEvent } from 'react';
import { UserLayout } from '@/components/UserLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { categoriesAPI } from '@/lib/api';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import Loader from '@/components/Loader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useNavigate } from 'react-router-dom';

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

const UserExamHierarchy = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoriesAPI.getAll(true); // Get tree structure
      setCategories(data || []);
      // Auto-expand root categories
      if (data && data.length > 0) {
        const rootIds = data.map(cat => cat._id || cat.id).filter(Boolean) as string[];
        setExpandedItems(new Set(rootIds));
      }
    } catch (error: any) {
      toast.error('Failed to load exam hierarchy: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
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

  const getChildrenCount = (category: Category): number => {
    if (!category.children || category.children.length === 0) return 0;
    return category.children.length;
  };

  const handleNavigateToTests = (event: MouseEvent, categoryId?: string) => {
    event.preventDefault();
    event.stopPropagation();
    if (!categoryId) return;
    navigate(`/tests?categoryId=${categoryId}`);
  };

  const renderCategoryRow = (category: Category, level: number = 0) => {
    const id = category._id || category.id || '';
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedItems.has(id);
    const childrenCount = getChildrenCount(category);

    return (
      <div key={id} className="border-b border-border/30 last:border-b-0">
        <Collapsible
          open={isExpanded}
          onOpenChange={() => toggleExpand(id)}
        >
          <CollapsibleTrigger className="w-full" asChild>
            <div
              className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer justify-between"
              style={{ paddingLeft: Math.max(16, 16 + level * 12) }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {hasChildren ? (
                  isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )
                ) : (
                  <div className="w-4" />
                )}

                {/* Icon */}
                <span className="text-2xl">{category.icon || '📚'}</span>

                {/* Category Name */}
                <div className="flex-1 text-left min-w-0">
                  <div className="font-semibold text-lg truncate">{category.name}</div>
                  {category.description && (
                    <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{category.description}</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Children Count */}
                {childrenCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {childrenCount} {childrenCount === 1 ? 'child' : 'children'}
                  </Badge>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={(event) => handleNavigateToTests(event, id)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View tests
                </Button>
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {hasChildren && (
              <div className="bg-muted/30">
                {category.children!.map(child => renderCategoryRow(child, level + 1))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (cats: Category[]) => {
      cats.forEach(cat => {
        const id = cat._id || cat.id;
        if (id) allIds.add(id);
        if (cat.children) collectIds(cat.children);
      });
    };
    collectIds(categories);
    setExpandedItems(allIds);
  };

  const collapseAll = () => {
    setExpandedItems(new Set());
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader />
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Exam Hierarchy</h1>
            <p className="text-muted-foreground mt-1">
              Browse through the complete exam category structure
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Hierarchy Tree */}
        <Card className="border border-border/70 rounded-[1.5rem] shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Exam Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-280px)]">
              {categories.length === 0 ? (
                <div className="text-center py-12">
                  <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No exam categories found.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {categories.map(category => renderCategoryRow(category, 0))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
};

export default UserExamHierarchy;
