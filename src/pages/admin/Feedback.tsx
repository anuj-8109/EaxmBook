import { useEffect, useState, useRef } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, CheckCircle, Clock, Eye, RefreshCw, Bug, Lightbulb, Sparkles, HelpCircle, MoreHorizontal, AlertCircle, Inbox, Send, Star } from 'lucide-react';
import { feedbackAPI } from '@/lib/api';
import { showError, showSuccess } from '@/lib/sweetalert';
import Loader from '@/components/Loader';
import { PaginationControls } from '@/components/PaginationControls';
import gsap from 'gsap';

interface UserProfile {
  full_name: string;
  email: string;
}

interface Feedback {
  _id?: string;
  id?: string;
  message: string;
  category: string;
  rating?: number;
  status: string;
  admin_response?: string;
  created_at: string;
  user_id: any;
  user_id_populated?: UserProfile;
}

const AdminFeedback = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const pageRef = useRef<HTMLDivElement>(null);

  const fetchFeedbacks = async () => {
    const isRefreshing = !loading;
    if (isRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const response = await feedbackAPI.getAll(currentPage, itemsPerPage);
      // Handle new pagination response format
      const feedback = Array.isArray(response) 
        ? response 
        : (response?.feedback || []);
      setFeedbacks(feedback);
      if (response.pagination) {
        setTotalPages(response.pagination.totalPages || 1);
      }
    } catch (error: any) {
      showError('Failed to load feedback');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    if (!loading && pageRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo('.feedback-card', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' });
      });
      return () => ctx.revert();
    }
  }, [loading]);

  const updateStatus = async (id: string, status: string, response?: string) => {
    setUpdatingStatus(id);
    try {
      await feedbackAPI.update(id, { status, admin_response: response || null });
      showSuccess(`Feedback ${status === 'resolved' ? 'resolved' : 'reopened'}!`, 'Email sent to user.');
      setAdminResponse('');
      await fetchFeedbacks();
    } catch (error: any) {
      showError('Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const categoryConfig: Record<string, { icon: any; color: string; bg: string }> = {
    bug: { icon: Bug, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
    feature: { icon: Lightbulb, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
    improvement: { icon: Sparkles, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
    question: { icon: HelpCircle, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    other: { icon: MoreHorizontal, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
  };

  const openFeedbackDialog = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setAdminResponse(feedback.admin_response || '');
    setDialogOpen(true);
  };

  const stats = {
    total: feedbacks.length,
    pending: feedbacks.filter(f => f.status === 'pending').length,
    resolved: feedbacks.filter(f => f.status === 'resolved').length,
  };

  // Load feedbacks when page changes
  useEffect(() => {
    fetchFeedbacks();
  }, [currentPage]);

  return (
    <AdminLayout>
      <div ref={pageRef} className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-fuchsia-600 p-6 sm:p-8 text-white">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '24px 24px' }} />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">User Feedback</h1>
                <p className="text-white/80 mt-1">Review and respond to user feedback</p>
              </div>
            </div>
            <Button onClick={fetchFeedbacks} disabled={refreshing} variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-xl">
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="feedback-card border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-600 shadow-lg">
                <Inbox className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Feedback</p>
                <p className="text-3xl font-bold text-slate-700">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="feedback-card border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Pending</p>
                <p className="text-3xl font-bold text-amber-700">{stats.pending}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="feedback-card border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Resolved</p>
                <p className="text-3xl font-bold text-emerald-700">{stats.resolved}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback List */}
        {loading ? (
          <Card className="feedback-card border-0 shadow-lg p-8 text-center">
            <Loader text="Loading feedback..." />
          </Card>
        ) : feedbacks.length === 0 ? (
          <Card className="feedback-card border-0 shadow-lg">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-fuchsia-100 to-pink-100 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-fuchsia-500" />
              </div>
              <h3 className="text-lg font-bold mb-2">No Feedback Yet</h3>
              <p className="text-muted-foreground">User feedback will appear here when submitted.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="feedback-card border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b pb-4">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-fuchsia-500" />
                All Feedback ({feedbacks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead className="font-semibold">User</TableHead>
                      <TableHead className="font-semibold">Category</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Message</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedbacks.map((feedback) => {
                      const user = typeof feedback.user_id === 'object' ? feedback.user_id : null;
                      const cat = categoryConfig[feedback.category] || categoryConfig.other;
                      const CatIcon = cat.icon;
                      return (
                        <TableRow key={feedback._id || feedback.id} className="hover:bg-slate-50/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 ring-2 ring-slate-100">
                                <AvatarFallback className="bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white font-semibold text-xs">
                                  {user?.full_name?.[0]?.toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{user?.full_name || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[120px]">{user?.email || 'No email'}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cat.bg}`}>
                              <CatIcon className={`w-3 h-3 ${cat.color}`} />
                              <span className={cat.color}>{feedback.category}</span>
                            </span>
                          </TableCell>
                          <TableCell>
                            {feedback.status === 'resolved' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">
                                <CheckCircle className="w-3 h-3" /> Resolved
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200">
                                <Clock className="w-3 h-3" /> Pending
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]">{feedback.message}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-xs text-muted-foreground">{new Date(feedback.created_at).toLocaleDateString()}</p>
                            <p className="text-xs text-muted-foreground">{new Date(feedback.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" className="rounded-xl h-8" onClick={() => openFeedbackDialog(feedback)}>
                                <Eye className="h-3.5 w-3.5 mr-1" /> View
                              </Button>
                              {feedback.status === 'pending' ? (
                                <Button size="sm" className="rounded-xl h-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600" onClick={() => updateStatus(feedback._id || feedback.id || '', 'resolved')} disabled={updatingStatus !== null}>
                                  {updatingStatus === (feedback._id || feedback.id) ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle className="h-3.5 w-3.5 mr-1" /> Resolve</>}
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" className="rounded-xl h-8" onClick={() => updateStatus(feedback._id || feedback.id || '', 'pending')} disabled={updatingStatus !== null}>
                                  <Clock className="h-3.5 w-3.5 mr-1" /> Reopen
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {feedbacks.length > 0 && (
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
        )}

        {/* Detail Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-fuchsia-500" />
                Feedback Details
              </DialogTitle>
              <DialogDescription>
                {selectedFeedback && (
                  <div className="flex items-center gap-2 mt-2">
                    {(() => {
                      const cat = categoryConfig[selectedFeedback.category] || categoryConfig.other;
                      const CatIcon = cat.icon;
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cat.bg}`}>
                          <CatIcon className={`w-3 h-3 ${cat.color}`} />
                          <span className={cat.color}>{selectedFeedback.category}</span>
                        </span>
                      );
                    })()}
                    {selectedFeedback.status === 'resolved' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">
                        <CheckCircle className="w-3 h-3" /> Resolved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            {selectedFeedback && (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10 ring-2 ring-slate-100">
                      <AvatarFallback className="bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white font-semibold">
                        {typeof selectedFeedback.user_id === 'object' ? selectedFeedback.user_id?.full_name?.[0]?.toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{typeof selectedFeedback.user_id === 'object' ? selectedFeedback.user_id?.full_name : 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{typeof selectedFeedback.user_id === 'object' ? selectedFeedback.user_id?.email : 'No email'}</p>
                    </div>
                    <p className="text-xs text-muted-foreground ml-auto">{new Date(selectedFeedback.created_at).toLocaleString()}</p>
                  </div>
                  {selectedFeedback.rating && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium text-slate-600">Rating:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= selectedFeedback.rating!
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-slate-200 text-slate-300'
                            }`}
                          />
                        ))}
                        <span className="text-xs font-semibold text-amber-600 ml-1">
                          {selectedFeedback.rating}/5
                        </span>
                      </div>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{selectedFeedback.message}</p>
                </div>

                {selectedFeedback.admin_response && (
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <p className="text-xs font-semibold text-blue-600 mb-2">Previous Response</p>
                    <p className="text-sm whitespace-pre-wrap text-blue-800">{selectedFeedback.admin_response}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="font-semibold">Your Response</Label>
                  <Textarea placeholder="Add your response (will be emailed to user)..." value={adminResponse} onChange={(e) => setAdminResponse(e.target.value)} className="min-h-[100px] rounded-xl" />
                  <p className="text-xs text-muted-foreground">This response will be sent to the user via email.</p>
                </div>

                <div className="flex gap-3 pt-2">
                  {selectedFeedback.status === 'pending' ? (
                    <Button onClick={async () => { await updateStatus(selectedFeedback._id || selectedFeedback.id || '', 'resolved', adminResponse); setDialogOpen(false); }} disabled={updatingStatus !== null} className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                      {updatingStatus ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Mark Resolved
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={async () => { await updateStatus(selectedFeedback._id || selectedFeedback.id || '', 'pending', adminResponse); setDialogOpen(false); }} disabled={updatingStatus !== null} className="rounded-xl">
                      <Clock className="w-4 h-4 mr-2" /> Reopen
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">Close</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminFeedback;
