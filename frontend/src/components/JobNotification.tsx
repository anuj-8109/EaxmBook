import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Bell, Briefcase, ExternalLink, X } from 'lucide-react';
import { jobsAPI, notificationsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { connectSocket, onNewJob, offNewJob, disconnectSocket } from '@/lib/socket';
import { useAuth } from '@/contexts/AuthContext';
// import { formatDistanceToNow } from 'date-fns';

interface Job {
  _id: string;
  title: string;
  company: string;
  location?: string;
  salary?: string;
  application_deadline?: string;
  application_link?: string;
  created_at: string;
}

export const JobNotification = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [total, setTotal] = useState(0);
  const [unreadJobIds, setUnreadJobIds] = useState<string[]>([]);
  const [notificationsData, setNotificationsData] = useState<any[]>([]);
  const openRef = useRef(open);
  const hasCheckedInitial = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Check unread count only once when component mounts (header par sirf ek baar)
  useEffect(() => {
    if (!user || hasCheckedInitial.current) return;
    
    // Only check once - header mount par
    hasCheckedInitial.current = true;
    // checkUnreadCount();
  }, [user]);

  const checkUnreadCount = async () => {
    try {
      // Sirf ek baar call - header mount par
      const data = await notificationsAPI.getAll(1, 50); // Get first 50 notifications
      const notifications = data.notifications || data || [];
      setNotificationsData(notifications); // Store for later use
      
      const jobNotifications = notifications.filter((n: any) => n.type === 'new_job' && !n.read);
      setUnreadCount(jobNotifications.length);
      
      // Get job IDs from notifications
      const jobIds = jobNotifications.map((n: any) => n.related_id).filter(Boolean);
      setUnreadJobIds(jobIds);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const fetchLatestJobs = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Use stored notifications data instead of fetching again
      const jobNotifications = notificationsData.filter((n: any) => n.type === 'new_job' && !n.read);
      const jobIds = jobNotifications.map((n: any) => n.related_id).filter(Boolean);
      
      // Fetch latest jobs (not just featured) - show recent 5 jobs
      const data = await jobsAPI.getAll({ limit: 5 });
      if (data && data.jobs) {
        // If we have job IDs from notifications, prioritize those jobs
        let jobsToShow = data.jobs;
        if (jobIds.length > 0) {
          // Sort: jobs with notifications first, then others
          jobsToShow = [...data.jobs].sort((a, b) => {
            const aHasNotif = jobIds.includes(a._id);
            const bHasNotif = jobIds.includes(b._id);
            if (aHasNotif && !bHasNotif) return -1;
            if (!aHasNotif && bHasNotif) return 1;
            return 0;
          });
        }
        
        setJobs(jobsToShow);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Setup socket listener once when component mounts
  useEffect(() => {
    if (!user) return;
    
    // Connect to socket for real-time notifications
    connectSocket();
    
    // Listen for new job notifications
    const handleNewJob = (data: any) => {
      console.log('New job received:', data);
      toast.info(`New Job: ${data.job.title} at ${data.job.company}`, {
        action: {
          label: 'View',
          onClick: () => window.location.href = '/jobs',
        },
      });
      // Update unread count directly from socket notification
      setUnreadCount(prev => prev + 1);
      
      // Add to unread job IDs if job ID is available
      if (data.job?._id) {
        setUnreadJobIds(prev => [...prev, data.job._id]);
      }
      
      // Only refresh jobs list if popover is open
      if (openRef.current) {
        fetchLatestJobs();
      }
    };
    
    onNewJob(handleNewJob);
    
    return () => {
      offNewJob(handleNewJob);
    };
  }, [user]);

  const handleJobClick = async (job: Job) => {
    // Mark notification as read using stored notifications data
    try {
      // Use stored notifications data instead of fetching again
      const jobNotification = notificationsData.find((n: any) => n.type === 'new_job' && n.related_id === job._id && !n.read);
      if (jobNotification) {
        await notificationsAPI.markAsRead(jobNotification._id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setUnreadJobIds(prev => prev.filter(id => id !== job._id));
        
        // Update stored notifications data
        setNotificationsData(prev => 
          prev.map(n => n._id === jobNotification._id ? { ...n, read: true } : n)
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }

    if (job.application_link) {
      window.open(job.application_link, '_blank');
    } else {
      // If no link, navigate to jobs page
      window.location.href = '/jobs';
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    // Fetch jobs and check unread count when popover is opened
    if (newOpen && user) {
      fetchLatestJobs(); // This will also fetch notifications
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-xl bg-slate-100 hover:bg-slate-200 relative">
          <Bell className="h-4 w-4 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Latest Jobs
            </h3>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
          ) : jobs.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No jobs available</div>
          ) : (
            <div className="divide-y">
              {jobs.map((job) => {
                // Check if this job has an unread notification
                const hasUnreadNotif = unreadJobIds.includes(job._id);
                
                return (
                  <div
                    key={job._id}
                    className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                      hasUnreadNotif ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                    }`}
                    onClick={() => handleJobClick(job)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-slate-900 truncate">{job.title}</h4>
                          {hasUnreadNotif && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{job.company}</p>
                        {job.location && (
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            📍 {job.location}
                          </p>
                        )}
                        {job.salary && (
                          <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                            💰 {job.salary}
                          </p>
                        )}
                        {job.application_deadline && (
                          <p className="text-xs text-slate-500 mt-1">
                            ⏰ Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(job.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {job.application_link && (
                        <ExternalLink className="h-4 w-4 text-slate-400 flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="p-3 border-t bg-slate-50">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              setOpen(false);
              window.location.href = '/jobs';
            }}
          >
            View All Jobs ({total || jobs.length})
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

