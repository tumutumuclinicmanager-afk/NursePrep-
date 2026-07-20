import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Stethoscope, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function PublicLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                <Stethoscope className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-blue-900 italic">Nurse Prep</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-4">
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
          <div className="md:hidden bg-white border-t border-slate-200">
            <div className="px-4 py-4 space-y-3">
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
