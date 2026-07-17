import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, Home, Settings, GraduationCap, LayoutDashboard, Brain, FileText, Bell, LogOut, ChevronRight, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export function DashboardLayout({ userRole = 'student' }: { userRole?: 'student' | 'staff' | 'admin' }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const getNavItems = () => {
    if (userRole === 'admin') {
      return [
        { name: 'Overview', icon: LayoutDashboard, path: '/admin' },
        { name: 'User Management', icon: GraduationCap, path: '/admin/users' },
        { name: 'Payments', icon: FileText, path: '/admin/payments' },
        { name: 'Analytics', icon: Brain, path: '/admin/analytics' },
      ];
    }
    if (userRole === 'staff') {
      return [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/staff' },
        { name: 'Upload Exams', icon: FileText, path: '/staff/upload' },
        { name: 'AI Mixer', icon: Brain, path: '/staff/mixer' },
        { name: 'My Courses', icon: BookOpen, path: '/staff/courses' },
      ];
    }
    return [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { name: 'My Courses', icon: BookOpen, path: '/dashboard/courses' },
      { name: 'AI Exam Generator', icon: Brain, path: '/dashboard/generator' },
      { name: 'Performance', icon: FileText, path: '/dashboard/performance' },
    ];
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      {/* Mobile Header (visible only on small screens) */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            <Brain className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-blue-900 italic">Nurse Prep</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={cn(
        "w-full md:w-64 bg-white border-r border-slate-200 flex-col flex-shrink-0 sticky top-0 md:h-screen z-10 transition-all duration-300 md:flex",
        isMobileMenuOpen ? "flex fixed inset-0 top-[73px] h-[calc(100vh-73px)] z-20" : "hidden"
      )}>
        <div className="p-6 border-b border-slate-100 items-center gap-3 hidden md:flex">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            <Brain className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-blue-900 italic">Nurse Prep</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-2">Menu</div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/' && item.path !== '/dashboard' && item.path !== '/admin' && item.path !== '/staff');
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
                  isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "")} />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        
        {userRole === 'student' && (
          <div className="p-4 bg-blue-600 m-4 rounded-xl text-white shadow-lg shadow-blue-200 shrink-0">
            <p className="text-xs opacity-90">Pro Plan expires in</p>
            <p className="font-bold text-lg">12 Days</p>
            <button className="mt-2 w-full py-2 bg-white text-blue-600 rounded-lg text-xs font-bold uppercase tracking-wider">Renew Plan</button>
          </div>
        )}
        
        <div className="p-4 border-t border-slate-100 shrink-0 mt-auto">
          <Link to="/" onClick={() => localStorage.removeItem('userRole')} className="block">
            <Button variant="ghost" className="w-full justify-start gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col h-[calc(100vh-73px)] md:h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-900 capitalize">{userRole} Dashboard</h1>
            {userRole === 'student' && (
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded uppercase hidden md:inline-block">Active: NCLEX-RN</span>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <button className="relative text-slate-400 hover:text-slate-600 transition-colors flex items-center">
                <Bell className="w-6 h-6" />
              </button>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 border-2 border-white rounded-full text-[10px] text-white flex items-center justify-center font-bold">3</span>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200 hidden sm:flex">
              <div className="text-right">
                <p className="text-sm font-bold leading-none text-slate-900">Jane Doe</p>
                <p className="text-[11px] text-slate-500 leading-none mt-1 capitalize">{userRole}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center font-bold text-slate-500 overflow-hidden">
                 JD
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </div>
        
        {/* Status Bar */}
        <footer className="h-10 bg-white border-t border-slate-200 px-8 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="flex gap-6">
            <span>Server Status: <span className="text-emerald-500">Optimal</span></span>
            <span>User ID: NP-88219</span>
          </div>
          <div className="flex gap-6 hidden sm:flex">
            <span className="text-blue-600">Terms of Service</span>
            <span className="text-blue-600">Privacy Policy</span>
            <span>&copy; {new Date().getFullYear()} Nurse Prep</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
