import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Home, Settings, GraduationCap, LayoutDashboard, Brain, BrainCircuit, Library, FileText, Bell, LogOut, ChevronRight, Menu, X, Video, MessageSquare, Edit3, Database, Award, Server, BarChart3, Clock, Sparkles, ShieldAlert, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { auth, signOut, onAuthStateChanged } from '@/lib/firebase';
import { NotificationBell } from '@/components/NotificationBell';
import { useTrialCountdown, setSimulatedTrialExpired } from '@/lib/trialManager';

export function DashboardLayout({ userRole = 'student' }: { userRole?: 'student' | 'staff' | 'admin' }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string>('User');
  const [userEmail, setUserEmail] = useState<string>('');
  const location = useLocation();
  const navigate = useNavigate();
  const { trial, refreshTrial } = useTrialCountdown(auth.currentUser);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        if (currentUser.displayName) {
          setUserName(currentUser.displayName);
        } else if (currentUser.email) {
          const namePart = currentUser.email.split('@')[0];
          setUserName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
        } else {
          setUserName('User');
        }
        setUserEmail(currentUser.email || '');
      } else {
        setUserName('User');
      }
    });
    return () => unsubscribe();
  }, []);

  const getInitials = (name: string) => {
    if (!name || name === 'User') return 'U';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const accountTypeLabel = 
    userRole === 'admin' ? 'Admin Account' :
    userRole === 'staff' ? 'Staff Account' :
    'Student Account';

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Sign out warning:", e);
    }
    localStorage.removeItem('userRole');
    localStorage.removeItem('nurseprep_last_activity');
    navigate('/login');
  };

  const getNavItems = () => {
    if (userRole === 'admin') {
      return [
        { name: 'Overview', icon: LayoutDashboard, path: '/admin' },
        { name: 'Badges & Streak Config', icon: Award, path: '/admin/badges' },
        { name: 'Question Bank & Creator', icon: Edit3, path: '/admin/questions' },
        { name: 'User Management', icon: GraduationCap, path: '/admin/users' },
        { name: 'Payments', icon: FileText, path: '/admin/payments' },
        { name: 'System Analytics', icon: BarChart3, path: '/admin/analytics' },
        { name: 'Cloud Scalability', icon: Server, path: '/admin/scalability' },
      ];
    }
    if (userRole === 'staff') {
      return [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/staff' },
        { name: 'Upload Exams', icon: FileText, path: '/staff/upload' },
        { name: 'Live Sessions', icon: Video, path: '/staff/sessions' },
        { name: 'Student Queries', icon: MessageSquare, path: '/staff/queries' },
      ];
    }
    return [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { name: 'My Courses', icon: BookOpen, path: '/dashboard/courses' },
      { name: 'Exam Bank', icon: BookOpen, path: '/dashboard/exams' },
      { name: 'Practice Exam Generator', icon: Brain, path: '/dashboard/generator' },
      { name: 'Performance', icon: FileText, path: '/dashboard/performance' },
      { name: 'Clinical Library', icon: Library, path: '/dashboard/library' },
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
          <div className="mx-3 my-3">
            {trial.isPaid ? (
              <div className="p-3.5 bg-slate-900 rounded-xl text-white shadow-md border border-slate-800">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-emerald-400 font-extrabold uppercase tracking-wider">{trial.planName}</p>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <p className="font-extrabold text-sm mt-1 text-slate-100">Full Repository Access</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Active Premium Member</p>
              </div>
            ) : trial.isExpired ? (
              <div className="p-3.5 bg-gradient-to-b from-rose-950 to-slate-950 rounded-xl text-white shadow-lg border border-rose-700/80">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Trial Expired
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Locked
                  </span>
                </div>
                <p className="font-extrabold text-xs text-rose-100 mt-1.5 leading-snug">
                  Exams Repository Locked
                </p>
                <p className="text-[11px] text-rose-300/80 mt-1 leading-normal">
                  Your 14-day trial has ended. Upgrade to regain full access.
                </p>
                <button 
                  onClick={() => navigate('/pricing')}
                  className="mt-2.5 w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-black uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Upgrade Account
                </button>
                <button
                  onClick={async () => {
                    await setSimulatedTrialExpired(false, auth.currentUser);
                    await refreshTrial();
                  }}
                  className="mt-2 w-full py-1 text-[10px] text-rose-300/90 hover:text-white font-medium flex items-center justify-center gap-1 transition-colors"
                  title="Reset trial to 14 days for testing"
                >
                  <RotateCcw className="w-3 h-3" /> Reset 14-Day Trial (Demo)
                </button>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-900 rounded-xl text-white shadow-lg shadow-slate-200 border border-slate-800">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-amber-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> 14-Day Free Trial
                  </p>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    Active
                  </span>
                </div>
                <div className="mt-2">
                  <div className="flex items-baseline justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Countdown:</span>
                    <span className="font-mono text-xs font-black text-amber-300 tracking-tight">
                      {trial.daysRemaining}d {trial.hoursRemaining}h {trial.minutesRemaining}m {trial.secondsRemaining}s
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${Math.max(4, Math.min(100, (trial.totalSecondsRemaining / (14 * 86400)) * 100))}%` }}
                    />
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/pricing')}
                  className="mt-3 w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-black uppercase tracking-wider shadow-xs transition-colors flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Upgrade Plan
                </button>
                <button
                  onClick={async () => {
                    await setSimulatedTrialExpired(true, auth.currentUser);
                    await refreshTrial();
                  }}
                  className="mt-1.5 w-full py-1 text-[10px] text-slate-400 hover:text-amber-300 font-medium transition-colors text-center"
                  title="Simulate what happens when the 14 days finish"
                >
                  ⚡ Test: Expire Countdown Now
                </button>
              </div>
            )}
          </div>
        )}
        
        <div className="p-4 border-t border-slate-100 shrink-0 mt-auto">
          <Button onClick={handleSignOut} variant="ghost" className="w-full justify-start gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col h-[calc(100vh-73px)] md:h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-slate-900 capitalize">{userRole} Dashboard</h1>
            {userRole === 'student' && (
              <>
                {trial.isPaid ? (
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-300 hidden md:inline-flex items-center gap-1">
                    ✓ {trial.planName}
                  </span>
                ) : trial.isExpired ? (
                  <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 text-xs font-bold rounded-full border border-rose-300 hidden md:inline-flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-rose-600" /> Trial Expired (Repository Locked)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 text-xs font-bold rounded-full border border-amber-200 hidden md:inline-flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-amber-600" /> Free Trial: {trial.daysRemaining}d {trial.hoursRemaining}h left
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-6">
            <NotificationBell userRole={userRole} />
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200 hidden sm:flex">
              <div className="text-right">
                <p className="text-sm font-bold leading-none text-slate-900">{userName}</p>
                <p className="text-[11px] font-semibold text-blue-600 leading-none mt-1">{accountTypeLabel}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white border-2 border-white shadow-sm flex items-center justify-center font-extrabold text-sm overflow-hidden shrink-0">
                 {getInitials(userName)}
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
