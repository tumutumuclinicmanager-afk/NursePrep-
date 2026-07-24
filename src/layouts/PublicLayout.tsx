import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Stethoscope, Menu, X, LayoutDashboard, LogOut, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { auth, signOut } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export function PublicLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [userRole, setUserRole] = useState<string | null>(localStorage.getItem('userRole'));
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      const role = localStorage.getItem('userRole');
      setUserRole(role);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    localStorage.removeItem('userRole');
    setUserRole(null);
    setCurrentUser(null);
    navigate('/login');
  };

  const dashboardPath = userRole === 'admin' ? '/admin' : userRole === 'staff' ? '/staff' : '/dashboard';
  const isLoggedIn = !!currentUser || !!userRole;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to={isLoggedIn ? dashboardPath : "/"} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                <Stethoscope className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-blue-900 italic">Nurse Prep</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
                Home
              </Link>
              {isLoggedIn && (
                <Link to="/dashboard/exams" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  Exam Bank
                </Link>
              )}
              <Link to="/pricing" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
                Pricing
              </Link>
            </nav>
            
            <div className="hidden md:flex items-center space-x-3">
              {isLoggedIn ? (
                <>
                  <Link to={dashboardPath}>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider gap-2">
                      <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    onClick={handleSignOut}
                    className="text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-100 gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" className="text-sm font-bold uppercase tracking-wider text-slate-600">
                      Login
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold uppercase tracking-wider">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
            
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 shadow-md">
            <div className="px-4 py-4 space-y-3">
              <Link to="/" className="block py-2 text-sm font-semibold text-slate-700">Home</Link>
              {isLoggedIn && (
                <Link to="/dashboard/exams" className="block py-2 text-sm font-semibold text-blue-600 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Exam Bank
                </Link>
              )}
              <Link to="/pricing" className="block py-2 text-sm font-semibold text-slate-700">Pricing</Link>
              <div className="pt-2 border-t border-slate-100 space-y-2">
                {isLoggedIn ? (
                  <>
                    <Link to={dashboardPath} className="block">
                      <Button className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider gap-2">
                        <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      onClick={handleSignOut}
                      className="w-full justify-center text-xs font-bold uppercase tracking-wider text-slate-600 gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="block">
                      <Button variant="outline" className="w-full justify-center text-sm font-bold uppercase tracking-wider">
                        Login
                      </Button>
                    </Link>
                    <Link to="/register" className="block">
                      <Button className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold uppercase tracking-wider">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1">
          <Outlet />
        </div>
        <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <p>© {new Date().getFullYear()} Nurse Prep. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
