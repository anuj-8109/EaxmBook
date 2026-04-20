import { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, AlertTriangle, MessageSquare, BarChart3, DollarSign, UserCheck, UserX, FileText, Activity, Shield, CheckCircle2, Clock, ArrowRight, Sparkles, Zap, GitBranch, HelpCircle } from 'lucide-react';
import { dashboardAPI } from '@/lib/api';
import { showError } from '@/lib/sweetalert';
import Loader from '@/components/Loader';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';

interface DashboardStats {
   users: { total: number; active: number; inactive: number };
   revenue: { total: number; transactions: number; pending: number };
   security: { warnings: any[]; threats: number };
   testimonials: { pending: number };
   testDemand: Array<{ test_id: string; test_name: string; attempts: number; avgScore: number }>;
   overview: { totalTests: number; totalAttempts: number; recentAttempts: number; totalQuestions?: number; totalExams?: number };
}

// Mock Data for Charts
const userGrowthData = [
   { name: 'Mon', users: 120 },
   { name: 'Tue', users: 150 },
   { name: 'Wed', users: 180 },
   { name: 'Thu', users: 220 },
   { name: 'Fri', users: 280 },
   { name: 'Sat', users: 350 },
   { name: 'Sun', users: 400 },
];

const dailyAttemptsData = [
   { name: 'Week 1', attempts: 1200 },
   { name: 'Week 2', attempts: 1800 },
   { name: 'Week 3', attempts: 2400 },
   { name: 'Week 4', attempts: 2100 },
   { name: 'Week 5', attempts: 3000 },
];

const AdminDashboard = () => {
   const navigate = useNavigate();
   const [loading, setLoading] = useState(true);
   const [stats, setStats] = useState<DashboardStats | null>(null);

   const statsRef = useRef<HTMLDivElement>(null);
   const chartsRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      fetchData();
   }, []);

   // GSAP Animations
   useEffect(() => {
      if (loading || !stats) return;

      const ctx = gsap.context(() => {
         if (statsRef.current) {
            gsap.fromTo(statsRef.current.querySelectorAll('.stat-card'),
               { opacity: 0, y: 30 },
               { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
            );
         }
         if (chartsRef.current) {
            gsap.fromTo(chartsRef.current.querySelectorAll('.chart-card'),
               { opacity: 0, y: 20 },
               { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: 'power2.out', delay: 0.2 }
            );
         }
      });

      return () => ctx.revert();
   }, [loading, stats]);

   const fetchData = async () => {
      try {
         const data = await dashboardAPI.getStats();
         // Provide defaults for missing mock fields if not in actual API
         if (!data.overview.totalQuestions) data.overview.totalQuestions = 1540;
         if (!data.overview.totalExams) data.overview.totalExams = 45;
         setStats(data);
      } catch (error: any) {
         showError('Failed to load dashboard data');
      } finally {
         setLoading(false);
      }
   };

   if (loading || !stats) {
      return (
         <AdminLayout>
            <div className="p-8">
               <Loader text="Loading live analytics..." />
            </div>
         </AdminLayout>
      );
   }

   const statCards = [
      { label: 'Total Users', value: stats.users.total, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
      { label: 'Active Users', value: stats.users.active, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-100' },
      { label: 'Total Exams', value: stats.overview.totalExams || 0, icon: GitBranch, color: 'text-blue-600', bg: 'bg-blue-100' },
      { label: 'Total Questions', value: stats.overview.totalQuestions || 0, icon: HelpCircle, color: 'text-orange-600', bg: 'bg-orange-100' },
      { label: 'Total Tests', value: stats.overview.totalTests, icon: FileText, color: 'text-pink-600', bg: 'bg-pink-100' },
   ];

   const popularExamsData = stats.testDemand.slice(0, 5).map(t => ({
      name: t.test_name.substring(0, 15) + (t.test_name.length > 15 ? '...' : ''),
      attempts: t.attempts
   }));

   return (
      <AdminLayout>
         <div className="space-y-8 animate-in fade-in duration-500">
            {/* Welcome Hero */}
            <div className="bg-gradient-to-r from-green-700 via-green-600 to-green-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
               <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-inner border border-white/30">
                     <Sparkles className="w-10 h-10 text-emerald-300" />
                  </div>
                  <div className="text-center sm:text-left">
                     <h1 className="text-3xl sm:text-4xl font-bold mb-2">Admin Dashboard</h1>
                     <p className="text-white/90 text-lg max-w-2xl">
                        Monitor EXAMPULSE platform metrics, user growth, and exam statistics in real-time.
                     </p>
                  </div>
               </div>
            </div>

            {/* Analytic Cards */}
            <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
               {statCards.map((card, idx) => (
                  <Card key={idx} className="stat-card border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl">
                     <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                           <div>
                              <p className="text-sm font-semibold text-slate-500 mb-1">{card.label}</p>
                              <h3 className="text-3xl font-bold text-slate-800">{card.value}</h3>
                           </div>
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${card.bg}`}>
                              <card.icon className={`w-6 h-6 ${card.color}`} />
                           </div>
                        </div>
                     </CardContent>
                  </Card>
               ))}
            </div>

            {/* Charts Section */}
            <div ref={chartsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8">

               {/* User Growth Chart */}
               <Card className="chart-card border-slate-100 shadow-md rounded-3xl overflow-hidden">
                  <CardHeader className="bg-slate-50 border-b border-slate-100">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-xl text-green-600">
                           <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                           <CardTitle className="text-xl">User Growth</CardTitle>
                           <CardDescription>New registrations over the past week</CardDescription>
                        </div>
                     </div>
                  </CardHeader>
                  <CardContent className="p-6">
                     <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={userGrowthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                              <defs>
                                 <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                 </linearGradient>
                              </defs>
                              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                              <Area type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </CardContent>
               </Card>

               {/* Daily Test Attempts Chart */}
               <Card className="chart-card border-slate-100 shadow-md rounded-3xl overflow-hidden">
                  <CardHeader className="bg-slate-50 border-b border-slate-100">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-xl text-green-600">
                           <Activity className="w-5 h-5" />
                        </div>
                        <div>
                           <CardTitle className="text-xl">Daily Test Attempts</CardTitle>
                           <CardDescription>Mock test completions per week</CardDescription>
                        </div>
                     </div>
                  </CardHeader>
                  <CardContent className="p-6">
                     <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={dailyAttemptsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                              <Bar dataKey="attempts" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                  </CardContent>
               </Card>

               {/* Popular Exams Chart (Bottom Full Width) */}
               <Card className="chart-card lg:col-span-2 border-slate-100 shadow-md rounded-3xl overflow-hidden">
                  <CardHeader className="bg-slate-50 border-b border-slate-100">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                           <BarChart3 className="w-5 h-5" />
                        </div>
                        <div>
                           <CardTitle className="text-xl">Popular Exams</CardTitle>
                           <CardDescription>Most attempted exams and practice tests</CardDescription>
                        </div>
                     </div>
                  </CardHeader>
                  <CardContent className="p-6">
                     <div className="h-80 w-full">
                        {popularExamsData.length > 0 ? (
                           <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={popularExamsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                 <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                 <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                 <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                 <Line type="monotone" dataKey="attempts" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                              </LineChart>
                           </ResponsiveContainer>
                        ) : (
                           <div className="flex h-full items-center justify-center text-slate-400">
                              No exam data available to chart
                           </div>
                        )}
                     </div>
                  </CardContent>
               </Card>
            </div>

         </div>
      </AdminLayout>
   );
};

export default AdminDashboard;
