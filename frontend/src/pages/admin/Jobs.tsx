import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Briefcase, ExternalLink, RefreshCw, Search, Filter, Trash } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { jobsAPI } from '@/lib/api';
import Loader from '@/components/Loader';
import { PaginationControls } from '@/components/PaginationControls';
import { AdminPageHeading } from '@/components/AdminPageHeading';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface Job {
  _id?: string;
  id?: string;
  title: string;
  company: string;
  description?: string;
  location?: string;
  salary?: string;
  job_type: string;
  category?: string;
  exam_name?: string;
  application_deadline?: string;
  application_link?: string;
  source: string;
  is_active: boolean;
  is_featured: boolean;
  views: number;
  created_at?: string;
}

const Jobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Multi-select states
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    location: '',
    salary: '',
    job_type: 'Full-time',
    category: '',
    exam_name: '',
    application_deadline: '',
    application_link: '',
    is_featured: false,
  });

  const [syncData, setSyncData] = useState({
    api_url: '',
    api_key: '',
    api_name: 'custom',
  });
  
  // Server-side Pagination states
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchJobs();
  }, [currentPage]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await jobsAPI.getAll({ limit: itemsPerPage, page: currentPage });
      setJobs(data?.jobs || []);
      if (data?.total) {
        setTotalPages(Math.ceil(data.total / itemsPerPage) || 1);
      }
    } catch (error: any) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingJob) {
        await jobsAPI.update(editingJob._id || editingJob.id || '', formData);
        toast.success('Job updated successfully!');
      } else {
        await jobsAPI.create(formData);
        toast.success('Job created successfully!');
      }
      setShowForm(false);
      setEditingJob(null);
      resetForm();
      fetchJobs();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save job');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      company: job.company,
      description: job.description || '',
      location: job.location || '',
      salary: job.salary || '',
      job_type: job.job_type,
      category: job.category || '',
      exam_name: job.exam_name || '',
      application_deadline: job.application_deadline ? new Date(job.application_deadline).toISOString().split('T')[0] : '',
      application_link: job.application_link || '',
      is_featured: job.is_featured || false,
    });
    setShowForm(true);
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    setLoading(true);
    try {
      await jobsAPI.delete(jobId);
      toast.success('Job deleted successfully!');
      fetchJobs();
    } catch (error: any) {
      toast.error('Failed to delete job');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectJob = (id: string) => {
    setSelectedJobs(prev => {
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
    if (selectedJobs.size === jobs.length) {
      setSelectedJobs(new Set());
    } else {
      const allIds = jobs.map(j => j._id || j.id).filter(Boolean) as string[];
      setSelectedJobs(new Set(allIds));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedJobs.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedJobs.size} jobs?`)) return;

    try {
      await jobsAPI.batchDelete(Array.from(selectedJobs));
      toast.success(`${selectedJobs.size} jobs deleted successfully!`);
      setSelectedJobs(new Set());
      fetchJobs();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleSync = async () => {
    if (!syncData.api_url) {
      toast.error('API URL is required');
      return;
    }
    setLoading(true);
    try {
      const result = await jobsAPI.syncAPI(syncData.api_url, syncData.api_key, syncData.api_name);
      toast.success(result.message || 'Jobs synced successfully!');
      setShowSyncDialog(false);
      setSyncData({ api_url: '', api_key: '', api_name: 'custom' });
      fetchJobs();
    } catch (error: any) {
      toast.error(error.message || 'Failed to sync jobs');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      company: '',
      description: '',
      location: '',
      salary: '',
      job_type: 'Full-time',
      category: '',
      exam_name: '',
      application_deadline: '',
      application_link: '',
      is_featured: false,
    });
  };

  // Client-side filter for search only
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchQuery || 
      job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || job.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory]);

  if (loading && jobs.length === 0) {
    return (
      <AdminLayout>
        <div className="p-8">
          <Loader text="Loading jobs..." />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeading
          eyebrow="Jobs & Vacancies"
          title="Job Management"
          description="Create and manage job postings and vacancies"
          action={
            <div className="flex gap-2">
              <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="rounded-2xl">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync API
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Sync Jobs from API</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>API URL *</Label>
                      <Input
                        value={syncData.api_url}
                        onChange={(e) => setSyncData({ ...syncData, api_url: e.target.value })}
                        placeholder="https://api.example.com/jobs"
                      />
                    </div>
                    <div>
                      <Label>API Key (Optional)</Label>
                      <Input
                        type="password"
                        value={syncData.api_key}
                        onChange={(e) => setSyncData({ ...syncData, api_key: e.target.value })}
                        placeholder="Bearer token or API key"
                      />
                    </div>
                    <div>
                      <Label>API Name</Label>
                      <Input
                        value={syncData.api_name}
                        onChange={(e) => setSyncData({ ...syncData, api_name: e.target.value })}
                        placeholder="custom"
                      />
                    </div>
                    <Button onClick={handleSync} className="w-full">Sync Jobs</Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={() => {
                  setEditingJob(null);
                  resetForm();
                  setShowForm(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Job
              </Button>
            </div>
          }
        />

        <Dialog open={showForm} onOpenChange={(open) => {
          setShowForm(open);
          if (!open) {
            setEditingJob(null);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingJob ? 'Edit Job' : 'Create New Job'}</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Job Title *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Company *</Label>
                    <Input
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Salary</Label>
                    <Input
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      placeholder="e.g., ₹50,000 - ₹80,000"
                    />
                  </div>
                  <div>
                    <Label>Job Type</Label>
                    <Select value={formData.job_type} onValueChange={(value) => setFormData({ ...formData, job_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                        <SelectItem value="Internship">Internship</SelectItem>
                        <SelectItem value="Remote">Remote</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., Government, Private, Banking"
                    />
                  </div>
                  <div>
                    <Label>Exam Name</Label>
                    <Input
                      value={formData.exam_name}
                      onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
                      placeholder="e.g., SSC CGL, Bank PO"
                    />
                  </div>
                  <div>
                    <Label>Application Deadline</Label>
                    <Input
                      type="date"
                      value={formData.application_deadline}
                      onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Application Link</Label>
                    <Input
                      value={formData.application_link}
                      onChange={(e) => setFormData({ ...formData, application_link: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                    />
                    <Label>Featured Job</Label>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={loading}>
                    {editingJob ? 'Update Job' : 'Create Job'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setShowForm(false);
                    setEditingJob(null);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        <Card className="border border-border/70 rounded-[1.5rem] shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={jobs.length > 0 && selectedJobs.size === jobs.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all jobs"
                />
                <CardTitle>All Jobs</CardTitle>
              </div>
              <div className="flex gap-2">
                {selectedJobs.size > 0 && (
                  <Button variant="destructive" size="sm" onClick={handleBatchDelete}>
                    <Trash className="h-4 w-4 mr-1" />
                    Delete ({selectedJobs.size})
                  </Button>
                )}
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search jobs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jobs.map((job) => {
                const jobId = job._id || job.id || '';
                return (
                <div key={jobId} className={`p-4 border rounded-xl hover:bg-slate-50 ${selectedJobs.has(jobId) ? 'border-red-300 bg-red-50/30' : ''}`}>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedJobs.has(jobId)}
                      onCheckedChange={() => handleSelectJob(jobId)}
                      aria-label={`Select ${job.title}`}
                    />
                    <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold">{job.title}</h3>
                        {job.is_featured && <Badge variant="default">Featured</Badge>}
                        {job.source === 'api' && <Badge variant="secondary">API</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{job.company}</p>
                      {job.location && <p className="text-xs text-muted-foreground">{job.location}</p>}
                      {job.salary && <p className="text-xs text-muted-foreground mt-1">💰 {job.salary}</p>}
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{job.job_type}</Badge>
                        {job.category && <Badge variant="outline">{job.category}</Badge>}
                        {job.exam_name && <Badge variant="outline">{job.exam_name}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Views: {job.views || 0}</p>
                    </div>
                    <div className="flex gap-2">
                      {job.application_link && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(job.application_link, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleEdit(job)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(job._id || job.id || '')}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )})}
              {jobs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No jobs found</div>
              )}
            </div>
            {jobs.length > 0 && totalPages > 1 && (
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

export default Jobs;

