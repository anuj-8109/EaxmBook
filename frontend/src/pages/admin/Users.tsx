import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { usersAPI } from '@/lib/api';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { showError, showSuccess, showDeleteConfirm } from '@/lib/sweetalert';
import { RefreshCw, Users as UsersIcon, UserCheck, Target, Clock, Trophy, TrendingUp, Pencil, Eye, Crown, User, Search, Sparkles, Monitor } from 'lucide-react';
import Loader from '@/components/Loader';
import { PaginationControls } from '@/components/PaginationControls';
import gsap from 'gsap';

interface User {
   _id?: string;
   id?: string;
   email: string;
   full_name: string;
   username?: string | null;
   avatar_url?: string | null;
   created_at: string;
   role: string;
}

interface UserStats {
   totalAttempts: number;
   totalQuestions: number;
   totalCorrect: number;
   totalWrong: number;
   totalScore: number;
   avgScorePercent: number;
   avgAccuracyPercent: number;
   bestScorePercent: number;
   totalTimeMinutes: number;
   lastAttemptAt?: string | null;
}

interface UserAttemptReport {
   id: string;
   started_at: string;
   completed_at: string;
   time_taken_seconds: number;
   total_questions: number;
   correct_answers: number;
   wrong_answers: number;
   unanswered: number;
   score: number;
   score_percent: number;
   accuracy_percent: number;
   test?: { id: string; name: string; duration_minutes: number; total_marks: number; negative_marking: boolean } | null;
   category?: { id: string; name: string; icon?: string } | null;
}

interface UserActivityResponse {
   user: User;
   stats: UserStats;
   attempts: UserAttemptReport[];
}

const Users = () => {
   const navigate = useNavigate();
   const [users, setUsers] = useState<User[]>([]);
   const [loading, setLoading] = useState(true);
   const [reportUser, setReportUser] = useState<User | null>(null);
   const [reportOpen, setReportOpen] = useState(false);
   const [reportLoading, setReportLoading] = useState(false);
   const [reportData, setReportData] = useState<UserActivityResponse | null>(null);
   const [editUser, setEditUser] = useState<User | null>(null);
   const [editOpen, setEditOpen] = useState(false);
   const [editForm, setEditForm] = useState({ full_name: '', email: '', username: '' });
   const [editLoading, setEditLoading] = useState(false);
   const [searchQuery, setSearchQuery] = useState('');
   const [currentPage, setCurrentPage] = useState(1);
   const [totalPages, setTotalPages] = useState(1);
   const itemsPerPage = 10;

   const pageRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      loadUsers();
   }, [currentPage]);

   useEffect(() => {
      if (!loading && pageRef.current) {
         const ctx = gsap.context(() => {
            gsap.fromTo('.user-card', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' });
         });
         return () => ctx.revert();
      }
   }, [loading]);

   const loadUsers = async () => {
      setLoading(true);
      try {
         const response = await usersAPI.getAll(currentPage, itemsPerPage);
         if (response.users) {
            setUsers(response.users || []);
            if (response.pagination) {
               setTotalPages(response.pagination.totalPages || 1);
            }
         } else {
            // Fallback for old format
            setUsers(Array.isArray(response) ? response : []);
         }
      } catch (error: any) {
         showError('Error loading users');
      } finally {
         setLoading(false);
      }
   };

   const handleRoleChange = useCallback(async (userId: string, newRole: string) => {
      try {
         await usersAPI.updateRole(userId, newRole);
         showSuccess('Role updated successfully');
         loadUsers();
      } catch (error: any) {
         showError('Error updating role');
      }
   }, [loadUsers]);

   const fetchUserActivity = useCallback(async (user: User) => {
      const userId = getUserId(user);
      if (!userId) return;
      setReportLoading(true);
      try {
         const data = await usersAPI.getActivity(userId);
         setReportData(data);
      } catch (error: any) {
         showError('Failed to load user report', error.message);
      } finally {
         setReportLoading(false);
      }
   }, []);

   const handleOpenReport = useCallback((user: User) => {
      setReportUser(user);
      setReportOpen(true);
      fetchUserActivity(user);
   }, [fetchUserActivity]);

   const handleOpenEdit = useCallback((user: User) => {
      setEditUser(user);
      setEditForm({ full_name: user.full_name || '', email: user.email || '', username: user.username || '' });
      setEditOpen(true);
   }, []);

   const handleEditSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editUser) return;
      const userId = getUserId(editUser);
      if (!userId) return;

      setEditLoading(true);
      try {
         const updatedUser = await usersAPI.update(userId, editForm);
         setUsers((prev) => prev.map((user) => (getUserId(user) === userId ? updatedUser : user)));
         showSuccess('User details updated');
         setEditOpen(false);
         setEditUser(null);
      } catch (error: any) {
         showError('Failed to update user', error.message);
      } finally {
         setEditLoading(false);
      }
   };

   const getUserId = (user?: User | null) => user?._id || user?.id || '';
   const formatDate = (value?: string | null) => value ? new Date(value).toLocaleString() : '—';

   // Memoize filtered users to avoid recalculating on every render
   const filteredUsers = useMemo(() => {
      if (!searchQuery) return users;
      const query = searchQuery.toLowerCase();
      return users.filter((user) =>
         user.full_name?.toLowerCase().includes(query) ||
         user.email?.toLowerCase().includes(query) ||
         user.username?.toLowerCase().includes(query)
      );
   }, [users, searchQuery]);

   // Frontend pagination for search results
   const searchTotalPages = Math.ceil(filteredUsers.length / itemsPerPage);
   const searchStartIndex = (currentPage - 1) * itemsPerPage;
   const searchEndIndex = searchStartIndex + itemsPerPage;
   const paginatedUsers = searchQuery ? filteredUsers.slice(searchStartIndex, searchEndIndex) : filteredUsers;

   // Use backend pagination when no search, frontend when searching
   const displayTotalPages = searchQuery ? searchTotalPages : totalPages;

   // Reset to page 1 when search changes
   useEffect(() => {
      setCurrentPage(1);
   }, [searchQuery]);

   // Load users when page changes (only if no search)
   useEffect(() => {
      if (!searchQuery) {
         loadUsers();
      }
   }, [currentPage]);

   const userStats = {
      total: users.length,
      admins: users.filter((u) => u.role === 'admin').length,
      regular: users.filter((u) => u.role === 'user').length,
   };

   return (
      <AdminLayout>
         <div ref={pageRef} className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 p-6 sm:p-8 text-white">
               <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '24px 24px' }} />
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
               <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                     <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
                        <UsersIcon className="w-8 h-8" />
                     </div>
                     <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">User Management</h1>
                        <p className="text-white/80 mt-1">Manage users, roles, and view performance reports</p>
                     </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                     <Button onClick={() => navigate('/dashboard')} variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-xl backdrop-blur-sm">
                        <Monitor className="h-4 w-4 mr-2" /> Go to Web Dashboard
                     </Button>
                     <Button onClick={loadUsers} variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-xl">
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                     </Button>
                  </div>
               </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <Card className="user-card border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardContent className="p-5 flex items-center gap-4">
                     <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg">
                        <UsersIcon className="w-6 h-6 text-white" />
                     </div>
                     <div>
                        <p className="text-sm text-muted-foreground font-medium">Total Users</p>
                        <p className="text-3xl font-bold text-blue-700">{userStats.total}</p>
                     </div>
                  </CardContent>
               </Card>
               <Card className="user-card border-0 shadow-lg bg-gradient-to-br from-violet-50 to-purple-50">
                  <CardContent className="p-5 flex items-center gap-4">
                     <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg">
                        <Crown className="w-6 h-6 text-white" />
                     </div>
                     <div>
                        <p className="text-sm text-muted-foreground font-medium">Administrators</p>
                        <p className="text-3xl font-bold text-violet-700">{userStats.admins}</p>
                     </div>
                  </CardContent>
               </Card>
               <Card className="user-card border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50">
                  <CardContent className="p-5 flex items-center gap-4">
                     <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
                        <User className="w-6 h-6 text-white" />
                     </div>
                     <div>
                        <p className="text-sm text-muted-foreground font-medium">Regular Users</p>
                        <p className="text-3xl font-bold text-emerald-700">{userStats.regular}</p>
                     </div>
                  </CardContent>
               </Card>
            </div>

            {/* Search and Users Table */}
            <Card className="user-card border-0 shadow-lg overflow-hidden">
               <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                     <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                           <Sparkles className="w-5 h-5 text-indigo-500" />
                           All Users
                        </CardTitle>
                        <CardDescription>View and manage all registered users</CardDescription>
                     </div>
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                           placeholder="Search users..."
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           className="pl-10 w-full sm:w-64 rounded-xl border-slate-200"
                        />
                     </div>
                  </div>
               </CardHeader>
               <CardContent className="p-0">
                  {loading ? (
                     <div className="py-12">
                        <Loader text="Loading users..." size="sm" />
                     </div>
                  ) : (
                     <div className="overflow-x-auto">
                        <Table>
                           <TableHeader>
                              <TableRow className="bg-slate-50/50">
                                 <TableHead className="font-semibold">User</TableHead>
                                 <TableHead className="font-semibold">Email</TableHead>
                                 <TableHead className="font-semibold">Role</TableHead>
                                 <TableHead className="font-semibold">Joined</TableHead>
                                 <TableHead className="text-right font-semibold">Actions</TableHead>
                              </TableRow>
                           </TableHeader>
                           <TableBody>
                              {paginatedUsers.map((user) => (
                                 <TableRow key={user._id || user.id} className="hover:bg-slate-50/50">
                                    <TableCell>
                                       <div className="flex items-center gap-3">
                                          <Avatar className="h-10 w-10 ring-2 ring-slate-100">
                                             <AvatarImage src={user.avatar_url || undefined} />
                                             <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-500 text-white font-semibold">
                                                {user.full_name?.[0]?.toUpperCase() || 'U'}
                                             </AvatarFallback>
                                          </Avatar>
                                          <div>
                                             <p className="font-semibold">{user.full_name}</p>
                                             {user.username && <p className="text-xs text-muted-foreground">@{user.username}</p>}
                                          </div>
                                       </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                    <TableCell>
                                       <Select value={user.role} onValueChange={(value) => handleRoleChange(user._id || user.id || '', value)}>
                                          <SelectTrigger className={`w-32 rounded-xl ${user.role === 'admin' ? 'bg-violet-50 border-violet-200' : 'bg-slate-50'}`}>
                                             <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                             <SelectItem value="user">
                                                <span className="flex items-center gap-2"><User className="w-3 h-3" /> User</span>
                                             </SelectItem>
                                             <SelectItem value="admin">
                                                <span className="flex items-center gap-2"><Crown className="w-3 h-3" /> Admin</span>
                                             </SelectItem>
                                          </SelectContent>
                                       </Select>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                       <div className="flex justify-end gap-2">
                                          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => handleOpenReport(user)}>
                                             <Eye className="h-4 w-4 mr-1" /> Report
                                          </Button>
                                          <Button size="sm" className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600" onClick={() => handleOpenEdit(user)}>
                                             <Pencil className="h-4 w-4 mr-1" /> Edit
                                          </Button>
                                       </div>
                                    </TableCell>
                                 </TableRow>
                              ))}
                           </TableBody>
                        </Table>
                     </div>
                  )}
                  {!loading && (searchQuery ? filteredUsers.length > 0 : users.length > 0) && (
                     <div className="p-4 border-t bg-slate-50/50">
                        <PaginationControls
                           currentPage={currentPage}
                           totalPages={displayTotalPages}
                           onPageChange={setCurrentPage}
                        />
                     </div>
                  )}
               </CardContent>
            </Card>
         </div>

         {/* Report Dialog */}
         <Dialog open={reportOpen} onOpenChange={(isOpen) => { setReportOpen(isOpen); if (!isOpen) { setReportUser(null); setReportData(null); } }}>
            <DialogContent className="max-w-4xl">
               <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                     <TrendingUp className="w-5 h-5 text-indigo-500" />
                     User Performance Report
                  </DialogTitle>
                  <DialogDescription>Detailed test history and performance overview</DialogDescription>
               </DialogHeader>

               {reportLoading ? (
                  <div className="py-12"><Loader text="Loading report..." /></div>
               ) : reportData ? (
                  <div className="space-y-6">
                     {/* User Info */}
                     <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100">
                        <Avatar className="h-16 w-16 ring-2 ring-indigo-100">
                           <AvatarImage src={reportData.user.avatar_url || undefined} />
                           <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-500 text-white text-xl font-bold">
                              {reportData.user.full_name?.[0]?.toUpperCase()}
                           </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                           <h3 className="text-xl font-bold">{reportData.user.full_name}</h3>
                           <p className="text-sm text-muted-foreground">{reportData.user.email}</p>
                        </div>
                        <Badge variant={reportData.user.role === 'admin' ? 'default' : 'secondary'} className="px-3 py-1">
                           {reportData.user.role === 'admin' ? <><Crown className="w-3 h-3 mr-1" /> Admin</> : <><User className="w-3 h-3 mr-1" /> User</>}
                        </Badge>
                     </div>

                     {/* Stats Cards */}
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
                           <CardContent className="p-4 text-center">
                              <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                              <p className="text-3xl font-bold text-blue-700">{reportData.stats.totalAttempts}</p>
                              <p className="text-xs text-muted-foreground">Total Tests</p>
                           </CardContent>
                        </Card>
                        <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-teal-50">
                           <CardContent className="p-4 text-center">
                              <TrendingUp className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                              <p className="text-3xl font-bold text-emerald-700">{reportData.stats.avgScorePercent}%</p>
                              <p className="text-xs text-muted-foreground">Avg Score</p>
                           </CardContent>
                        </Card>
                        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-50">
                           <CardContent className="p-4 text-center">
                              <Trophy className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                              <p className="text-3xl font-bold text-amber-700">{reportData.stats.bestScorePercent}%</p>
                              <p className="text-xs text-muted-foreground">Best Score</p>
                           </CardContent>
                        </Card>
                        <Card className="border-0 shadow-md bg-gradient-to-br from-violet-50 to-purple-50">
                           <CardContent className="p-4 text-center">
                              <Clock className="w-6 h-6 text-violet-500 mx-auto mb-2" />
                              <p className="text-3xl font-bold text-violet-700">{reportData.stats.totalTimeMinutes}</p>
                              <p className="text-xs text-muted-foreground">Minutes Spent</p>
                           </CardContent>
                        </Card>
                     </div>

                     {/* Recent Attempts */}
                     <Card className="border-0 shadow-md">
                        <CardHeader className="pb-3">
                           <CardTitle className="text-base">Recent Attempts</CardTitle>
                           <CardDescription>{reportData.stats.totalAttempts > 0 ? `Last attempt: ${formatDate(reportData.stats.lastAttemptAt)}` : 'No attempts yet'}</CardDescription>
                        </CardHeader>
                        <CardContent>
                           {reportData.attempts.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-8">No test attempts recorded.</p>
                           ) : (
                              <ScrollArea className="max-h-80 pr-4">
                                 <div className="space-y-3">
                                    {reportData.attempts.map((attempt) => (
                                       <div key={attempt.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors">
                                          <div className="flex items-center justify-between mb-2">
                                             <div>
                                                <p className="font-semibold">{attempt.test?.name || 'Mock Test'}</p>
                                                <p className="text-xs text-muted-foreground">{formatDate(attempt.completed_at)}</p>
                                             </div>
                                             <div className="text-right">
                                                <p className="text-2xl font-bold text-indigo-600">{attempt.score_percent}%</p>
                                                <p className="text-xs text-muted-foreground">{attempt.correct_answers}/{attempt.total_questions} correct</p>
                                             </div>
                                          </div>
                                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                             {attempt.category?.name && <span className="px-2 py-1 rounded-md bg-slate-100">{attempt.category.icon} {attempt.category.name}</span>}
                                             <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-600">Accuracy: {attempt.accuracy_percent}%</span>
                                             <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-600">Time: {Math.round(attempt.time_taken_seconds / 60)} min</span>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              </ScrollArea>
                           )}
                        </CardContent>
                     </Card>
                  </div>
               ) : (
                  <p className="text-sm text-muted-foreground">Select a user to view their report.</p>
               )}
            </DialogContent>
         </Dialog>

         {/* Edit Dialog */}
         <Dialog open={editOpen} onOpenChange={(isOpen) => { setEditOpen(isOpen); if (!isOpen) setEditUser(null); }}>
            <DialogContent className="max-w-lg">
               <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                     <Pencil className="w-5 h-5 text-indigo-500" />
                     Edit User
                  </DialogTitle>
                  <DialogDescription>Update basic information for this user.</DialogDescription>
               </DialogHeader>

               <form className="space-y-4" onSubmit={handleEditSubmit}>
                  <div className="space-y-2">
                     <Label htmlFor="edit-full-name">Full Name</Label>
                     <Input id="edit-full-name" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} className="rounded-xl" required />
                  </div>
                  <div className="space-y-2">
                     <Label htmlFor="edit-email">Email</Label>
                     <Input id="edit-email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="rounded-xl" required />
                  </div>
                  <div className="space-y-2">
                     <Label htmlFor="edit-username">Username (optional)</Label>
                     <Input id="edit-username" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} placeholder="Set a unique username" className="rounded-xl" />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                     <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="rounded-xl">Cancel</Button>
                     <Button type="submit" disabled={editLoading} className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600">
                        {editLoading ? 'Saving...' : 'Save Changes'}
                     </Button>
                  </div>
               </form>
            </DialogContent>
         </Dialog>
      </AdminLayout>
   );
};

export default Users;
