import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, Home, Settings, GraduationCap, Info, Mail, LogIn, UserPlus, Search, Stethoscope, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export function PublicLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { name: 'Home', icon: Home, path: '/' },
    { name: 'Courses', icon: GraduationCap, path: '/courses' },
    { name: 'Exam Bank', icon: BookOpen, path: '/exams' },
    { name: 'Pricing', icon: Settings, path: '/pricing' },
    { name: 'About', icon: Info, path: '/about' },
    { name: 'Contact', icon: Mail, path: '/contact' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            <Stethoscope className="w-5 h-5" />
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
            <Stethoscope className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-blue-900 italic">Nurse Prep</span>
        </div>

        <div className="p-4 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search exams..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-2">Navigation</div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/');
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
        
        <div className="p-4 border-t border-slate-100 space-y-3 shrink-0 mt-auto">
          <Link to="/login" className="block">
            <Button variant="outline" className="w-full justify-center gap-2 text-xs font-bold uppercase tracking-wider h-10">
              <LogIn className="w-4 h-4" />
              Login
            </Button>
          </Link>
          <Link to="/register" className="block">
            <Button className="w-full justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider h-10">
              <UserPlus className="w-4 h-4" />
              Sign Up
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col h-[calc(100vh-73px)] md:h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
        
        <footer className="h-10 bg-white border-t border-slate-200 px-8 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <p>© {new Date().getFullYear()} Nurse Prep. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
