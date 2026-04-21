import { useEffect, useState, useRef } from 'react';
import { UserLayout } from '@/components/UserLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Play, Calendar, ExternalLink, Star, Clock, BookOpen, Target, Sparkles,
  AlertCircle, Radio, ChevronRight, Users, MapPin, Search, Award, TrendingUp, CheckCircle, FileText
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import Loader from '@/components/Loader';
import Logo from '@/components/Logo';
import gsap from 'gsap';
import { attemptsAPI, categoriesAPI, jobsAPI, testsAPI, feedbackAPI } from '@/lib/api';
import { toast } from 'sonner';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [topSearchedExams, setTopSearchedExams] = useState<any[]>([]);
  const [liveForms, setLiveForms] = useState<any[]>([]);
  const [liveTests, setLiveTests] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Fetch Recent Tasks (Attempts) - first page, limited results
        const attemptsData = await attemptsAPI.getAll(1, 4);
        const attempts = attemptsData.attempts || [];
        const recent = attempts.slice(0, 4).map((a: any) => ({
          title: a.test_id?.name || 'Custom Practice',
          category: a.test_id?.category_id?.name || 'General',
          progress: Math.round(a.score || 0),
          icon: a.test_id?.name ? BookOpen : Target,
          id: a._id
        }));
        setRecentTasks(recent);

        // 2. Fetch Top Searched Exams (Categories)
        const categoriesData = await categoriesAPI.getAll(false);
        const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.categories || []);
        const topExams = categories.slice(0, 4).map((c: any) => ({
          title: c.name,
          description: c.description || 'Explore tests and practice materials',
          tag: 'Popular',
          id: c._id
        }));
        setTopSearchedExams(topExams);

        // 3. Fetch Live Forms (Featured Jobs)
        const jobsData = await jobsAPI.getAll({ is_featured: true, limit: 3 });
        const jobs = Array.isArray(jobsData) ? jobsData : (jobsData?.jobs || []);
        const forms = jobs.slice(0, 3).map((j: any) => ({
          examName: j.title,
          lastDate: j.application_deadline ? new Date(j.application_deadline).toLocaleDateString() : 'N/A',
          tags: [j.category || 'Job'],
          category: j.company,
          link: j.application_link
        }));
        setLiveForms(forms);

        // 4. Fetch Live Tests
        const testsData = await testsAPI.getAll({ isLive: true, limit: 4 });
        const tests = Array.isArray(testsData) ? testsData : (testsData?.tests || []);
        const lives = tests.slice(0, 4).map((t: any) => ({
          title: t.name,
          date: t.start_time ? new Date(t.start_time).toLocaleDateString() : 'Active',
          time: t.duration ? `${t.duration} Mins` : 'No Limit',
          registered: 'Join Now',
          id: t._id
        }));
        setLiveTests(lives);

        // 5. Fetch Testimonials (Feedback)
        const feedbackData = await feedbackAPI.getAll(1, 3);
        const feedback = Array.isArray(feedbackData) ? feedbackData : (feedbackData?.feedback || []);
        const fb = feedback.map((f: any) => ({
          name: f.user_id?.full_name || 'Anonymous User',
          exam: 'Platform User',
          text: `"${f.comment || 'Great experience!'}"`,
          rating: f.rating || 5
        }));
        setTestimonials(fb.length > 0 ? fb : [
          { name: 'Rahul Kumar', exam: 'SSC CGL Aspirant', text: '"Best platform for exam preparation."', rating: 5 },
          { name: 'Priya Sharma', exam: 'Railway Candidate', text: '"Very helpful practice sessions."', rating: 5 },
          { name: 'Amit Singh', exam: 'State Exam Prep', text: '"Mock tests are really useful."', rating: 4 }
        ]);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load some dashboard content');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      if (containerRef.current) {
        gsap.fromTo(
          containerRef.current.children,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
        );
      }

      // Testimonial Marquee Animation
      const scroller = document.querySelector('.testimonial-scroller');
      if (scroller) {
        gsap.to(scroller, {
          xPercent: -50,
          ease: "none",
          duration: 16, // Faster speed
          repeat: -1
        });
      }
    });
    return () => ctx.revert();
  }, [loading]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/tests?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="p-8">
          <Loader text="Loading your study planner..." />
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div ref={containerRef} className="w-full space-y-8">

        {/* ── 0. Search Hero (Testbook Style) ── */}


        {/* ── 0.5. Feedback Ticker ── */}
        <section className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden py-1.5 -mt-2">
          <div className="flex items-center">
            {/* Tag/Label */}
            <div className="px-4 border-r border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider whitespace-nowrap">Feedback</span>
              </div>
            </div>

            <div className="relative flex-1 overflow-hidden">
              {/* Gradient Fades */}
              <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-white to-transparent z-10" />
              <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-white to-transparent z-10" />

              <div className="flex w-max gap-12 testimonial-scroller py-0.5">
                {[...testimonials, ...testimonials, ...testimonials].map((t, idx) => (
                  <div key={idx} className="flex items-center gap-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-green-600">{t.name}</span>
                      <div className="flex text-amber-400">
                        {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-2 h-2 fill-current" />)}
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">{t.text.replace(/"/g, '')}</span>
                    <span className="text-slate-200 text-[10px]">|</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 1. Continue Your Recent Task ── */}
        {recentTasks.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-5 h-5 text-green-600" />
                Continue Your Recent Task
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentTasks.map((task, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-green-50 text-green-600">
                      <task.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{task.title}</h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{task.category}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1">
                      <div
                        className="bg-green-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{task.progress}% Max Score</p>
                  </div>

                  <Button
                    size="sm"
                    className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold mt-auto"
                    onClick={() => navigate('/history')}
                  >
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 2. Tabbed Exam Categories (Testbook Style) ── */}
        <section>
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
            <button
              onClick={() => navigate('/tests')}
              className="px-4 py-2 rounded-full whitespace-nowrap bg-green-500 text-white text-xs font-bold shadow-md shadow-green-500/20"
            >
              All Exams
            </button>
            {topSearchedExams.map((exam, idx) => (
              <button
                key={idx}
                onClick={() => navigate(`/tests?categoryId=${exam.id}`)}
                className="px-4 py-2 rounded-full whitespace-nowrap bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:border-green-300 hover:text-green-600 transition-all"
              >
                {exam.title}
              </button>
            ))}
            <Button variant="ghost" size="sm" onClick={() => navigate('/tests')} className="text-green-600 text-xs font-bold whitespace-nowrap">
              Explore More →
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {topSearchedExams.map((exam, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-100 rounded-[1.5rem] p-5 shadow-sm hover:shadow-xl hover:border-green-300 hover:-translate-y-1 transition-all flex flex-col gap-4 relative overflow-hidden group border-b-4 border-b-green-500/10 hover:border-b-green-500"
              >
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-green-50 rounded-full group-hover:scale-150 transition-transform duration-500 opacity-50" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-green-50 text-green-700 border border-green-100">
                      {exam.tag}
                    </span>
                    <Award className="w-5 h-5 text-slate-200 group-hover:text-green-500 transition-colors" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base leading-tight mb-2 group-hover:text-green-600 transition-colors">{exam.title}</h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{exam.description}</p>
                </div>

                <div className="mt-auto relative z-10">
                  <div className="flex items-center justify-between mb-4 text-[10px] font-bold text-slate-400">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg">
                      <Users className="w-3 h-3 text-blue-500" />
                      {Math.floor(Math.random() * 5000) + 1000}+ Selectees
                    </div>
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      Active
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full bg-green-50 text-green-700 hover:bg-green-600 hover:text-white rounded-xl font-black transition-all h-10 border border-green-100"
                    onClick={() => navigate('/tests')}
                  >
                    View All Tests
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. Last Date to Fill Forms ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-5 h-5 text-orange-500" />
              Recruitment Alerts
            </h2>
            <button
              className="text-sm text-green-600 font-semibold hover:underline flex items-center gap-1"
              onClick={() => navigate('/jobs')}
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {liveForms.map((form, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all relative"
              >
                <div className="absolute top-4 right-4 animate-bounce">
                  <span className="bg-orange-100 text-orange-600 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">Expiring</span>
                </div>
                <div className="flex items-center gap-2">
                  {form.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wide bg-blue-50 text-blue-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{form.examName}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{form.category}</p>
                  <div className="flex items-center justify-between mt-3 bg-red-50/50 p-2 rounded-lg border border-red-100/50">
                    <p className="text-[11px] text-red-600 font-extrabold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Deadline: {form.lastDate}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-slate-900 hover:bg-black text-white rounded-xl font-bold mt-1"
                  onClick={() => form.link && window.open(form.link, '_blank')}
                >
                  Apply Now <ExternalLink className="w-3 h-3 ml-1.5" />
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. Live Mock Tests (Testbook Style) ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
              <Radio className="w-5 h-5 text-red-600 animate-pulse" />
              Trending Live Tests
            </h2>
            <button
              className="text-xs text-green-600 font-bold hover:underline flex items-center gap-0.5"
              onClick={() => navigate('/tests')}
            >
              All Live Tests <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {liveTests.map((test, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between gap-4 hover:shadow-lg hover:border-red-100 transition-all group relative"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      Live TEST
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 capitalize bg-slate-100 px-2 py-0.5 rounded-full">
                      Free Admission
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-red-600 transition-colors">{test.title}</h3>

                  <div className="flex items-center gap-4 mt-3 text-[11px] font-bold">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      100 Questions
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-orange-500" />
                      {test.time}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className={`w-5 h-5 rounded-full border-2 border-white bg-green-${i + 2}00 flex items-center justify-center text-[8px] text-white font-bold`}>
                          {String.fromCharCode(64 + i)}
                        </div>
                      ))}
                    </div>
                    <span className="text-[10px] text-green-600 font-extrabold">{Math.floor(Math.random() * 500) + 100} students attempting now</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-5 h-9 font-black flex-shrink-0 animate-pulse shadow-lg shadow-red-500/20"
                  onClick={() => navigate('/tests')}
                >
                  START TEST
                </Button>
              </div>
            ))}
          </div>
        </section>

      </div>
    </UserLayout>
  );
};

export default Dashboard;
