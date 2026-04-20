import { useState, useEffect } from 'react';
import { UserLayout } from '@/components/UserLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, ExternalLink, Search, MapPin, DollarSign, Calendar, Clock } from 'lucide-react';
import { jobsAPI, bookmarkedMaterialsAPI } from '@/lib/api';
import { toast } from 'sonner';
import Loader from '@/components/Loader';
import { PaginationControls } from '@/components/PaginationControls';

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
  is_featured: boolean;
  created_at: string;
}

const Jobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterJobType, setFilterJobType] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchJobs();
  }, [page, filterCategory, filterJobType]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await jobsAPI.getAll({
        category: filterCategory !== 'all' ? filterCategory : undefined,
        job_type: filterJobType !== 'all' ? filterJobType : undefined,
        page,
        limit,
      });
      if (data) {
        setJobs(data.jobs || []);
        setTotal(data.total || 0);
      }
    } catch (error: any) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (job: Job) => {
    try {
      await bookmarkedMaterialsAPI.create({
        material_type: 'job',
        material_id: job._id || job.id,
        title: job.title,
        description: `${job.company} - ${job.location || ''}`,
        category_id: null,
        subject_id: null,
        topic_id: null,
      });
      toast.success('Job bookmarked!');
    } catch (error: any) {
      if (error.message?.includes('already bookmarked')) {
        toast.info('Job already bookmarked');
      } else {
        toast.error('Failed to bookmark job');
      }
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.location && job.location.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  if (loading && jobs.length === 0) {
    return (
      <UserLayout>
        <div className="p-8">
          <Loader text="Loading jobs..." />
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="w-full py-6 space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Job Opportunities</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Find your dream job from latest vacancies</p>
        </div>

        {/* Filters */}
        <Card className="border border-border/70 rounded-xl sm:rounded-[1.5rem] shadow-lg">
          <CardContent className="p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Government">Government</SelectItem>
                  <SelectItem value="Private">Private</SelectItem>
                  <SelectItem value="Banking">Banking</SelectItem>
                  <SelectItem value="SSC">SSC</SelectItem>
                  <SelectItem value="UPSC">UPSC</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterJobType} onValueChange={setFilterJobType}>
                <SelectTrigger>
                  <SelectValue placeholder="Job Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                  <SelectItem value="Remote">Remote</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchJobs} variant="outline" className="w-full text-xs sm:text-sm" size="sm">
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        <div className="grid gap-3 sm:gap-4">
          {filteredJobs.map((job) => (
            <Card key={job._id || job.id} className={`border rounded-lg sm:rounded-xl hover:shadow-lg transition-shadow ${job.is_featured ? 'border-amber-300 bg-amber-50/50' : ''}`}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-4">
                  <div className="flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      <h3 className="text-base sm:text-lg font-semibold break-words flex-1">{job.title}</h3>
                      {job.is_featured && (
                        <Badge className="bg-amber-500 text-[10px] sm:text-xs">Featured</Badge>
                      )}
                    </div>
                    <p className="text-sm sm:text-base md:text-lg font-medium text-muted-foreground mb-2 sm:mb-3 break-words">{job.company}</p>

                    <div className="flex flex-wrap gap-2 sm:gap-4 mb-2 sm:mb-3 text-xs sm:text-sm text-muted-foreground">
                      {job.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="break-words">{job.location}</span>
                        </div>
                      )}
                      {job.salary && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="break-words">{job.salary}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="break-words">{job.job_type}</span>
                      </div>
                      {job.application_deadline && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="break-words">Deadline: {new Date(job.application_deadline).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {job.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2 break-words">{job.description}</p>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      {job.category && (
                        <Badge variant="outline">{job.category}</Badge>
                      )}
                      {job.exam_name && (
                        <Badge variant="outline">{job.exam_name}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {job.application_link && (
                      <Button
                        onClick={() => window.open(job.application_link, '_blank')}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Apply Now
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => handleBookmark(job)}
                    >
                      Bookmark
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredJobs.length === 0 && !loading && (
          <Card>
            <CardContent className="p-8 text-center">
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No jobs found. Try adjusting your filters.</p>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="mt-6">
            <PaginationControls
              currentPage={page}
              totalPages={Math.ceil(total / limit)}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default Jobs;

