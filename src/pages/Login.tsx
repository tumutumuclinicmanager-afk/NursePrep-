import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Stethoscope, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword } from '@/lib/firebase';

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userEmail = userCredential.user.email || '';
      
      if (userEmail.endsWith('@nurseprep.ai')) {
        localStorage.setItem('userRole', 'staff');
        navigate('/staff');
      } else if (userEmail === 'admin@nurseprep.ai' || userEmail === 'wangechigodfrey77@gmail.com') {
        localStorage.setItem('userRole', 'admin');
        navigate('/admin');
      } else {
        localStorage.setItem('userRole', 'student');
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      const result = await signInWithPopup(auth, googleProvider);
      const userEmail = result.user.email || '';
      
      if (userEmail.endsWith('@nurseprep.ai')) {
        localStorage.setItem('userRole', 'staff');
        navigate('/staff');
      } else if (userEmail === 'wangechigodfrey77@gmail.com') {
        localStorage.setItem('userRole', 'admin');
        navigate('/admin');
      } else {
        localStorage.setItem('userRole', 'student');
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-8 pb-6 border-b border-slate-100 text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mx-auto mb-4">
            <Stethoscope className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome Back</h2>
          <p className="text-slate-500 mt-2 text-sm">Sign in to your Nurse Prep account to continue your journey.</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
              <input 
                type="email" 
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Password</label>
                <a href="#" className="text-xs text-blue-600 font-bold hover:underline">Forgot?</a>
              </div>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                required
              />
            </div>
            
            <Button type="submit" disabled={loading} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider text-sm mt-2 shadow-md shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Or continue with</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          <Button 
            type="button" 
            variant="outline" 
            className="w-full h-12 gap-3 font-bold text-slate-700 hover:bg-slate-50"
            onClick={handleGoogleSignIn}
          >
            <Chrome className="w-5 h-5 text-blue-500" />
            Sign in with Google
          </Button>

          <p className="text-center text-sm text-slate-500 mt-8">
            Don't have an account? <Link to="/register" className="text-blue-600 font-bold hover:underline">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
