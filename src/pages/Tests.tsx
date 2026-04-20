import { useState, useEffect, useMemo } from 'react';
import { UserLayout } from '@/components/UserLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Clock, FileText, Award, Play, Search, BookOpen, Target, TrendingUp,
  BarChart3, CheckSquare, RefreshCw, BellRing, Calendar, Users, ChevronDown,
} from 'lucide-react';
import { categoriesAPI, testsAPI } from '@/lib/api';
import { showError } from '@/lib/sweetalert';
import Loader from '@/components/Loader';
import { PaginationControls } from '@/components/PaginationControls';

interface Category {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  icon?: string;
}

interface Test {
  _id?: string;
  id?: string;
  name: string;
  description: string;
  duration_minutes: number;
  total_marks: number;
  total_questions?: number;
  category_id: any;
  subject_id: any;
  exam_name?: string;
  is_active: boolean;
  is_paid?: boolean;
  price?: number;
  negative_marking?: boolean;
  negative_marks_per_question?: number;
  test_type: 'static' | 'dynamic';
}

const QUICK_ACTIONS = [
  { label: 'Custom Practice', icon: Target, emoji: '🎯', path: '/practice' },
  { label: 'Basic to Advance', icon: BookOpen, emoji: '📚', path: '/basic-to-advance' },
  { label: 'My Progress', icon: TrendingUp, emoji: '📈', path: '/progress' },
  { label: 'Mock Tests', icon: BarChart3, emoji: '📝', path: '#mock' },
  { label: 'Topic Wise Questions', icon: CheckSquare, emoji: '🗂️', path: '/practice' },
];

const TABS = ['Overview', 'Syllabus', 'Previous Papers', 'Mock Tests', 'Cut-offs'];

const Tests = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChangePicker, setShowChangePicker] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const catId = params.get('categoryId');
    const search = params.get('search');

    if (search) {
      setSearchQuery(search);
    }

    if (catId && categories.length > 0) {
      const cat = categories.find(c => (c._id || c.id)?.toString() === catId);
      if (cat) setSelectedCategory(cat);
    } else if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [location.search, categories]);

  const fetchData = async () => {
    try {
      const [categoriesData, testsData] = await Promise.all([
        categoriesAPI.getAll(),
        testsAPI.getAll({ isActive: true }),
      ]);

      const cats = Array.isArray(categoriesData)
        ? categoriesData
        : categoriesData?.categories || [];
      setCategories(Array.isArray(cats) ? cats : []);

      const testsArray = Array.isArray(testsData) ? testsData : (testsData?.tests || []);
      setTests(testsArray);
    } catch {
      showError('Failed to load exam data');
    } finally {
      setLoading(false);
    }
  };

  const filteredTests = useMemo(() => {
    return tests.filter(test => {
      if (selectedCategory) {
        const catId = test.category_id?._id || test.category_id?.id || test.category_id;
        if (catId?.toString() !== (selectedCategory._id || selectedCategory.id)?.toString()) return false;
      }
      if (searchQuery) {
        return test.name?.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [tests, selectedCategory, searchQuery]);

  if (loading) {
    return (
      <UserLayout>
        <div className="p-8">
          <Loader text="Loading exam details..." />
        </div>
      </UserLayout>
    );
  }

  /* ─── TAB RENDERERS ──────────────────────────────── */

  const renderOverview = () => (
    <div className="animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* ── Exam Pattern ── */}
        <div className="bg-white border border-green-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 bg-green-50 border-b border-green-100">
            <h4 className="font-bold text-green-800 text-xs tracking-wide uppercase">Exam Pattern</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Tier', 'Type', 'Questions', 'Marks', 'Time'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {[
                  { tier: 'Tier I', type: 'Objective MCQ', q: '100', m: '200', t: '60 min' },
                  { tier: 'Tier II', type: 'Objective MCQ', q: '100', m: '780', t: '2h 30m' },
                  { tier: 'Tier III', type: 'Descriptive', q: '—', m: '100', t: '60 min' },
                ].map(row => (
                  <tr key={row.tier} className="hover:bg-green-50/30 transition-colors">
                    <td className="px-3 py-2.5 font-semibold text-slate-800 whitespace-nowrap">{row.tier}</td>
                    <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{row.type}</td>
                    <td className="px-3 py-2.5 text-center">{row.q}</td>
                    <td className="px-3 py-2.5 text-center font-semibold text-slate-800">{row.m}</td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">{row.t}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Marking Scheme ── */}
        <div className="bg-white border border-green-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 bg-green-50 border-b border-green-100">
            <h4 className="font-bold text-green-800 text-xs tracking-wide uppercase">Marking Scheme</h4>
          </div>
          <div className="p-4 space-y-2.5">
            {[
              { label: 'Correct Answer', value: '+2', cls: 'text-green-600 font-bold text-sm' },
              { label: 'Wrong Answer', value: '-0.5', cls: 'text-red-500 font-bold text-sm' },
              { label: 'Unattempted', value: '0', cls: 'text-slate-500 font-semibold text-sm' },
              { label: 'Negative Marking', value: 'Yes', cls: 'text-red-600 font-bold text-sm' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between border-b border-slate-50 last:border-0 pb-2.5 last:pb-0">
                <span className="text-xs text-slate-600">{row.label}</span>
                <span className={row.cls}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Important Dates ── */}
        <div className="bg-white border border-green-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 bg-green-50 border-b border-green-100">
            <h4 className="font-bold text-green-800 text-xs tracking-wide uppercase">Important Dates</h4>
          </div>
          <div className="p-4 space-y-2.5">
            {[
              { label: 'Notification', date: 'Dec 2024' },
              { label: 'Apply Start', date: 'Jan 2025' },
              { label: 'Apply End', date: 'Feb 2025' },
              { label: 'Tier I Exam', date: 'June 2025' },
              { label: 'Result', date: 'Aug 2025' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between border-b border-slate-50 last:border-0 pb-2.5 last:pb-0">
                <span className="text-xs text-slate-600">{item.label}</span>
                <span className="text-xs font-bold text-green-600">{item.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Eligibility ── */}
        <div className="bg-white border border-green-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 bg-green-50 border-b border-green-100">
            <h4 className="font-bold text-green-800 text-xs tracking-wide uppercase">Eligibility</h4>
          </div>
          <div className="p-4 space-y-3">
            {[
              { icon: '🎓', text: 'Graduation in any stream' },
              { icon: '🎂', text: 'Age: 18–32 years' },
              { icon: '🇮🇳', text: 'Indian Citizen' },
              { icon: '✅', text: 'Age relaxation as per govt rules' },
            ].map(item => (
              <div key={item.text} className="flex items-start gap-2.5">
                <span className="text-sm leading-none mt-0.5">{item.icon}</span>
                <span className="text-xs text-slate-700 leading-relaxed">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );


  const renderSyllabus = () => (
    <div className="space-y-3 animate-in fade-in duration-300">
      {['Quantitative Aptitude', 'General Intelligence & Reasoning', 'English Language', 'General Awareness'].map((subject, i) => (
        <div key={subject} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-3 px-5 py-4 bg-slate-50 border-b border-slate-100">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white ${['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500'][i]
              }`}>{i + 1}</div>
            <h4 className="font-bold text-slate-800">{subject}</h4>
          </div>
          <div className="px-5 py-4 text-sm text-slate-600 leading-relaxed">
            Covers all major topics for {subject} as per the latest official exam pattern and syllabus.
            Includes previous year topic distribution and expected difficulty band.
          </div>
        </div>
      ))}
    </div>
  );

  const renderTestList = (isPreviousYear: boolean) => {
    const list = filteredTests.filter(t =>
      isPreviousYear
        ? t.name.toLowerCase().includes('previous') || t.name.toLowerCase().includes('pyq')
        : !t.name.toLowerCase().includes('previous') && !t.name.toLowerCase().includes('pyq')
    );
    const startIdx = (currentPage - 1) * itemsPerPage;
    const paginatedList = list.slice(startIdx, startIdx + itemsPerPage);
    const totalPages = Math.ceil(list.length / itemsPerPage);

    return (
      <div className="space-y-5 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <h3 className="text-lg font-bold text-slate-800">
            {isPreviousYear ? 'Previous Year Papers' : 'Available Mock Tests'}
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search tests..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl border-slate-200"
            />
          </div>
        </div>

        {list.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-lg font-bold text-slate-700">No tests available</h3>
            <p className="text-slate-400 text-sm mt-1">Check back later for new additions.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {paginatedList.map((test, idx) => (
                <div
                  key={test._id || test.id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col overflow-hidden group"
                >
                  <div className="h-1.5 bg-green-500" />
                  <div className="p-4 flex flex-col flex-1 gap-3 relative">
                    {/* Free Badge - Randomly assigned for demo */}
                    {idx % 3 === 0 && (
                      <div className="absolute top-4 right-4 z-10">
                        <span className="bg-green-100 text-green-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase border border-green-200">Free</span>
                      </div>
                    )}
                    
                    <h4 className="font-bold text-slate-800 text-sm line-clamp-2 leading-snug group-hover:text-green-600 transition-colors">{test.name}</h4>
                    
                    <div className="flex flex-wrap gap-1.5">
                      <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-500">
                        <FileText className="w-3 h-3 text-blue-500" />
                        {test.total_questions || '?'}+ Qs
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-500">
                        <Clock className="w-3 h-3 text-orange-500" />
                        {test.duration_minutes} M
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-500">
                        <Award className="w-3 h-3 text-emerald-500" />
                        {test.total_marks} M
                      </div>
                    </div>

                    <div className="mt-auto pt-3 border-t border-dashed border-slate-100">
                       <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                          <div className="flex items-center gap-1">
                             <Users className="w-3 h-3" />
                             {Math.floor(Math.random() * 2000) + 500} Attempts
                          </div>
                          <div className="flex items-center gap-1 text-blue-500">
                             <TrendingUp className="w-3 h-3" />
                             Popular
                          </div>
                       </div>
                    </div>

                    <Button
                      size="sm"
                      className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl mt-2 font-bold shadow-lg shadow-green-500/10 h-9"
                      onClick={() => navigate(`/test/${test._id || test.id}`)}
                    >
                      <Play className="w-3 h-3 mr-2" /> Start Attempt
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            )}
          </>
        )}
      </div>
    );
  };

  const renderCutoffs = () => (
    <div className="animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
          <h4 className="font-bold text-slate-800">Previous Year Cutoffs</h4>
          <p className="text-xs text-slate-500 mt-0.5">Category-wise qualifying marks</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-green-50 text-green-800 font-semibold text-xs uppercase">
              <tr>
                {['Year', 'UR', 'OBC', 'SC', 'ST', 'EWS'].map(h => (
                  <th key={h} className="px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {[
                ['2025', '130.5', '125.0', '105.5', '95.0', '120.0'],
                ['2024', '128.0', '122.5', '101.0', '92.5', '118.5'],
                ['2023', '125.0', '119.0', '97.5', '89.0', '115.0'],
              ].map(row => (
                <tr key={row[0]} className="hover:bg-slate-50 transition-colors">
                  {row.map((cell, i) => (
                    <td key={i} className={`px-5 py-3 ${i === 0 ? 'font-bold text-slate-800' : ''}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  /* ─── RENDER ─────────────────────────────────────── */
  return (
    <UserLayout>
      <div className="w-full space-y-5">

        {/* ── Exam Header Card ── */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {/* Exam Badge */}
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-2xl font-black text-green-600 flex-shrink-0 shadow-md">
                {selectedCategory?.icon || (selectedCategory?.name?.slice(0, 3).toUpperCase()) || '📚'}
              </div>

              <div>
                <h1 className="text-2xl font-black leading-tight">
                  {selectedCategory?.name || 'Select an Exam'}
                </h1>
                <p className="text-green-100 text-sm mt-0.5">
                  {selectedCategory?.description || 'Select an exam to see details, syllabus, and mock tests.'}
                </p>

                {/* Status badges */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-semibold">
                    <BellRing className="w-3 h-3" /> Notification Active
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-semibold">
                    <Calendar className="w-3 h-3" /> Exam June 2025
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-semibold">
                    <Users className="w-3 h-3" /> 2,41,000 Vacancies
                  </span>
                </div>
              </div>
            </div>

            {/* Change Exam */}
            <div className="relative flex-shrink-0">
              <Button
                size="sm"
                className="bg-white text-green-700 hover:bg-green-50 font-semibold rounded-xl shadow-sm flex items-center gap-2"
                onClick={() => setShowChangePicker(!showChangePicker)}
              >
                <RefreshCw className="w-3.5 h-3.5" /> Change Exam
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showChangePicker ? 'rotate-180' : ''}`} />
              </Button>

              {/* Dropdown Picker */}
              {showChangePicker && (
                <div className="absolute right-0 top-10 z-50 bg-white border border-slate-100 rounded-2xl shadow-xl w-56 p-2 max-h-72 overflow-y-auto">
                  {categories.map(cat => (
                    <button
                      key={cat._id || cat.id}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setShowChangePicker(false);
                        setCurrentPage(1);
                        setActiveTab('Overview');
                      }}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${(selectedCategory?._id || selectedCategory?.id) === (cat._id || cat.id)
                          ? 'bg-green-50 text-green-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      <span className="text-lg">{cat.icon || '📚'}</span>
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Quick Action Icons ── */}
        <div className="grid grid-cols-5 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                if (action.path === '#mock') setActiveTab('Mock Tests');
                else navigate(action.path);
              }}
              className="flex flex-col items-center justify-center gap-2 bg-white border border-slate-100 rounded-2xl p-4 hover:border-green-200 hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <span className="text-2xl">{action.emoji}</span>
              <span className="text-xs font-semibold text-slate-600 group-hover:text-green-700 text-center leading-tight">
                {action.label}
              </span>
            </button>
          ))}
        </div>

        {/* ── Tab Bar ── */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex overflow-x-auto scrollbar-none">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={`flex-1 min-w-fit px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${activeTab === tab
                    ? 'text-white bg-green-500 border-green-500'
                    : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-50'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div>
          {activeTab === 'Overview' && renderOverview()}
          {activeTab === 'Syllabus' && renderSyllabus()}
          {activeTab === 'Previous Papers' && renderTestList(true)}
          {activeTab === 'Mock Tests' && renderTestList(false)}
          {activeTab === 'Cut-offs' && renderCutoffs()}
        </div>

      </div>
    </UserLayout>
  );
};

export default Tests;
