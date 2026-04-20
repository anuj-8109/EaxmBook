import { ReactNode, useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, TrendingUp, Target, Bookmark, BookOpen, MessageSquare, Heart, Phone, LogOut, Menu, Bell, User, ChevronRight, ChevronLeft, Search, FileText } from 'lucide-react';
import Logo from '@/components/Logo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { JobNotification } from '@/components/JobNotification';
import gsap from 'gsap';

interface UserLayoutProps {
  children: ReactNode;
}

export const UserLayout = ({ children }: UserLayoutProps) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Refs for animations
  const sidebarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  // Debounced search logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        navigate(`/tests?search=${encodeURIComponent(searchQuery.trim())}`);
      } else if (searchQuery === '' && location.pathname === '/tests') {
        // Clear search if input is empty and we are on tests page
        navigate('/tests');
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, navigate, location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tests?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home, gradient: 'from-white/30 to-white/10' },
    { path: '/tests', label: 'Mock Tests', icon: FileText, gradient: 'from-white/30 to-white/10', badge: 'New' },
    { path: '/progress', label: 'My Progress', icon: TrendingUp, gradient: 'from-white/30 to-white/10' },
    { path: '/practice', label: 'Custom Practice', icon: Target, gradient: 'from-white/30 to-white/10' },
    { path: '/bookmarks', label: 'Bookmarks', icon: Bookmark, gradient: 'from-white/30 to-white/10' },
    { path: '/jobs', label: 'Live forms', icon: BookOpen, gradient: 'from-white/30 to-white/10', isLive: true },
    { path: '/feedback', label: 'Feedback', icon: MessageSquare, gradient: 'from-white/30 to-white/10' },
    { path: '/donate', label: 'Donate us', icon: Heart, gradient: 'from-white/30 to-white/10' },
    { path: '/contact', label: 'Contact us', icon: Phone, gradient: 'from-white/30 to-white/10' },
  ];

  // Content animation on route change
  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(contentRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, [location.pathname]);

  const SidebarContent = () => (
    <>
      {/* Logo Section */}
      <div className={`p-4 lg:p-5 border-b border-white/20 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed ? (
          <Logo size="sm" />
        ) : (
          <div className="w-8 h-8 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center font-bold text-white text-lg">
            E
          </div>
        )}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden lg:flex text-white/70 hover:text-white transition-colors">
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 sm:p-4 space-y-1.5 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (location.pathname === '/' && item.path === '/dashboard');

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`nav-link group relative flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-start px-3 gap-3'} rounded-xl py-2.5 text-sm font-medium transition-all duration-300 ${isActive
                ? 'bg-white/10 text-white shadow-lg'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              title={isCollapsed ? item.label : undefined}
            >
              {/* Active indicator */}
              {isActive && (
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b ${item.gradient}`} />
              )}

              {/* Icon with gradient background when active */}
              <div className={`p-2 rounded-lg transition-all duration-300 ${isActive
                ? `bg-gradient-to-br ${item.gradient} shadow-lg`
                : 'bg-white/5 group-hover:bg-white/10'
                }`}>
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-white/70'}`} />
              </div>

              {!isCollapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  
                  {/* Testbook Style Badges */}
                  {(item as any).badge && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-orange-500 text-[8px] font-black text-white hover:scale-110 transition-transform">
                      {(item as any).badge}
                    </span>
                  )}
                  {(item as any).isLive && (
                    <span className="ml-2 flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}

                  {/* Arrow indicator on hover */}
                  <ChevronRight className={`ml-auto h-4 w-4 transition-all duration-300 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0'
                    }`} />
                </>
              )}
            </Link>
          );
        })}

        {/* Standard Logout Button injected directly to nav */}
        <button
          onClick={handleLogout}
          className={`w-full mt-2 nav-link group relative flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-start px-3 gap-3'} rounded-xl py-2.5 text-sm font-medium transition-all duration-300 text-red-400 hover:bg-red-500/10 hover:text-red-300`}
          title={isCollapsed ? "Logout" : undefined}
        >
          <div className="p-2 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-all duration-300">
            <LogOut className="h-4 w-4 text-red-400 group-hover:text-red-300" />
          </div>
          {!isCollapsed && <span className="truncate text-sm">logout</span>}
        </button>
      </nav>
    </>
  );

  return (
    <div className="min-h-screen flex w-full bg-[#f8fafc]">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200">
              <Menu className="h-5 w-5 text-slate-700" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[280px] sm:w-[320px] p-0 border-0 bg-green-600 text-white"
          >
            <div className="flex flex-col h-full bg-green-600">
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex-1 flex items-center justify-center">
          <Logo size="sm" />
        </div>

        <div className="flex items-center gap-2">
          <JobNotification />
        </div>
      </header>

      {/* Desktop Header */}
      <header className={`hidden lg:flex fixed top-0 right-0 z-40 border-b border-slate-200/50 bg-white/80 backdrop-blur-xl shadow-sm transition-all duration-300 ${isCollapsed ? 'left-20' : 'left-64'}`}>
        <div className="mx-auto flex w-full items-center justify-between px-6 py-4">
          <div className="flex-1 max-w-xl pr-10">
            <form onSubmit={handleSearch} className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-green-600 transition-colors" />
              <Input 
                type="text"
                placeholder="Search exams, subjects, topics..."
                className="w-full h-11 pl-10 pr-4 bg-slate-50 border-slate-200/60 rounded-xl focus:bg-white focus:ring-4 focus:ring-green-500/10 transition-all text-sm font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
          <div className="flex items-center gap-3">
            <JobNotification />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200/50 bg-white transition-all hover:border-green-300 hover:shadow-md group active:scale-95">
                  <User className="h-5 w-5 text-slate-600 group-hover:text-green-600 transition-colors" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-xl border-slate-200/50 shadow-xl">
                <DropdownMenuLabel className="pb-2">
                  <p className="font-bold">{user?.full_name || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate font-medium">{user?.email || 'user@example.com'}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')} className="rounded-lg cursor-pointer font-medium text-slate-700">
                  <User className="mr-2 h-4 w-4" />
                  Profile & Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 rounded-lg cursor-pointer font-bold">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside
        ref={sidebarRef}
        className={`hidden lg:flex text-white flex-col fixed left-0 top-0 h-screen shadow-2xl transition-all duration-300 bg-green-600 ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        <div className="flex h-full flex-col">
          <SidebarContent />
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-auto pt-16 lg:pt-20 transition-all duration-300 ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <div ref={contentRef} className="py-4 px-3 sm:py-5 sm:px-4 lg:py-6 lg:px-6 pb-20">
          {children}
        </div>
      </main>
    </div>
  );
};
