import { ReactNode, useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LayoutDashboard, FolderTree, FileText, HelpCircle, Users, LogOut, MessageSquare, BookOpen, Settings, Menu, Bell, ChevronLeft, ChevronRight, LucideIcon, Monitor, User, Shield, Sparkles, Tag, Briefcase, Upload, GitBranch, BarChart3, PlayCircle } from 'lucide-react';
import Logo from '@/components/Logo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import gsap from 'gsap';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  gradient: string;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  // Animation on route change
  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(contentRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
    }
  }, [location.pathname]);

  const navItems: NavItem[] = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, gradient: 'from-white/30 to-white/10' },
    { path: '/admin/users', label: 'Users', icon: Users, gradient: 'from-white/30 to-white/10' },
    { path: '/admin/exam-hierarchy', label: 'Exam Name', icon: GitBranch, gradient: 'from-white/30 to-white/10' },
    { path: '/admin/subjects', label: 'Subjects', icon: BookOpen, gradient: 'from-white/30 to-white/10' },
    { path: '/admin/topics', label: 'Topics', icon: Tag, gradient: 'from-white/30 to-white/10' },
    { path: '/admin/questions', label: 'Questions', icon: HelpCircle, gradient: 'from-white/30 to-white/10' },
    { path: '/admin/tests', label: 'Tests', icon: FileText, gradient: 'from-white/30 to-white/10' },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3, gradient: 'from-white/30 to-white/10' },
    { path: '/admin/live-tests', label: 'Live Tests', icon: PlayCircle, gradient: 'from-white/30 to-white/10' },
    { path: '/admin/feedback', label: 'Feedback', icon: MessageSquare, gradient: 'from-white/30 to-white/10' },
    { path: '/admin/notifications', label: 'Notifications', icon: Bell, gradient: 'from-white/30 to-white/10' },
    { path: '/admin/settings', label: 'Settings', icon: Settings, gradient: 'from-white/30 to-white/10' },
  ];

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <>
      {/* Logo Section */}
      <div className={`p-4 lg:p-5 border-b border-white/10 ${collapsed ? 'flex justify-center' : ''}`}>
        {!collapsed ? <Logo size="sm" /> : <Logo size="sm" showText={false} />}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              title={collapsed ? item.label : undefined}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive
                ? 'bg-white/15 text-white shadow-lg'
                : 'text-white/60 hover:bg-white/10 hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`}
            >
              {/* Active indicator */}
              {isActive && (
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b ${item.gradient}`} />
              )}

              {/* Icon */}
              <div className={`p-2 rounded-lg transition-all duration-200 ${isActive
                ? `bg-gradient-to-br ${item.gradient} shadow-lg`
                : 'bg-white/10 group-hover:bg-white/15'
                }`}>
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-white/70'}`} />
              </div>

              {!collapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Switch to Web View Button */}
      <div className={`p-4 border-t border-white/10 ${collapsed ? 'flex justify-center' : ''}`}>
        <button
          onClick={() => navigate('/dashboard')}
          className={`flex items-center gap-3 w-full p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10 group ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? "Go to Dashboard" : undefined}
        >
          <div className="p-1.5 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors">
             <Monitor className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/50 leading-none mb-1">Student View</p>
              <p className="text-[11px] font-bold">Go to Dashboard</p>
            </div>
          )}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/50 px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200">
              <Menu className="h-5 w-5 text-slate-700" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 border-0 bg-green-600 text-white">
            <div className="flex flex-col h-full">
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex-1 flex items-center justify-center">
          <Logo size="sm" />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200 relative">
            <Bell className="h-4 w-4 text-slate-700" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full p-0 ring-2 ring-slate-200 hover:ring-green-300 transition-all">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                    {user?.full_name?.[0]?.toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <DropdownMenuLabel>
                <p className="font-semibold">{user?.full_name || 'Administrator'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/admin/profile')} className="rounded-lg cursor-pointer">
                <User className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/admin/settings')} className="rounded-lg cursor-pointer">
                <Settings className="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/admin/system')} className="rounded-lg cursor-pointer">
                <Monitor className="mr-2 h-4 w-4" /> System
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 rounded-lg cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Desktop Header */}
      <header className={`hidden lg:flex fixed top-0 right-0 ${sidebarCollapsed ? 'left-20' : 'left-64'} z-40 border-b border-slate-200/50 bg-white/90 backdrop-blur-xl shadow-sm transition-all duration-300`}>
        <div className="flex w-full items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-green-500" />
              <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Admin Panel</p>
            </div>
            <div className="h-4 w-[1px] bg-slate-200 mx-2 hidden md:block" />
            <Button 
               variant="ghost" 
               size="sm" 
               onClick={() => navigate('/dashboard')}
               className="hidden md:flex items-center gap-2 h-8 px-3 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200/50 transition-all font-bold text-[11px]"
            >
               <Monitor className="w-3.5 h-3.5" />
               User Dashboard
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl bg-slate-100 hover:bg-slate-200 relative">
              <Bell className="h-4 w-4 text-slate-600" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200/50 bg-white shadow-sm hover:border-green-300 hover:shadow-md transition-all group active:scale-95">
                   <Shield className="h-5 w-5 text-slate-600 group-hover:text-green-600 transition-colors" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-xl">
                <DropdownMenuLabel>
                  <p className="font-semibold">{user?.full_name || 'Administrator'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/admin/profile')} className="rounded-lg cursor-pointer">
                  <User className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/admin/settings')} className="rounded-lg cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/admin/system')} className="rounded-lg cursor-pointer">
                  <Monitor className="mr-2 h-4 w-4" /> System
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 rounded-lg cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <aside
        ref={sidebarRef}
        className={`hidden lg:flex ${sidebarCollapsed ? 'w-20' : 'w-64'} bg-green-600 text-white flex-col fixed left-0 top-0 h-screen shadow-2xl transition-all duration-300 z-50`}
      >
        <div className="flex h-full flex-col relative">
          {/* Sidebar Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-4 top-20 z-50 h-8 w-8 rounded-full bg-white border-2 border-slate-300 shadow-xl hover:bg-green-500 hover:text-white hover:border-green-500 transition-all flex items-center justify-center group"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4 text-slate-700 group-hover:text-white transition-colors" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-slate-700 group-hover:text-white transition-colors" />
            )}
          </Button>
          <SidebarContent collapsed={sidebarCollapsed} />
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-auto ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'} pt-16 lg:pt-20 transition-all duration-300`}>
        <div ref={contentRef} className="p-4 sm:p-6">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
