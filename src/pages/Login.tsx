import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Stethoscope, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { auth, db, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

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
      
      // Look up user role and credentials in Firestore 'users' collection & localStorage backup
      const normalizedEmail = email.trim().toLowerCase();
      let userDoc: any = null;

      try {
        const q = query(collection(db, 'users'), where('email', '==', normalizedEmail));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.size > 0) {
          userDoc = querySnapshot.docs[0].data();
        }
      } catch (e) {
        console.warn("Firestore lookup failed, checking local backup:", e);
      }

      // If not found in Firestore, check localStorage custom users
      if (!userDoc) {
        const localUsers = JSON.parse(localStorage.getItem('nurseprep_custom_users') || '[]');
        userDoc = localUsers.find((u: any) => u.email?.toLowerCase() === normalizedEmail);
      }

      let userRole = 'student';
      let dbPassword = '';
      let isDbUser = false;
      let dbName = '';
      
      if (userDoc) {
        dbPassword = userDoc.password || '';
        dbName = userDoc.name || '';
        isDbUser = true;
        
        const role = userDoc.role || 'Student';
        if (role.toLowerCase().includes('admin')) {
          userRole = 'admin';
        } else if (role.toLowerCase().includes('staff') || role.toLowerCase().includes('lecturer')) {
          userRole = 'staff';
        } else {
          userRole = 'student';
        }
      } else {
        // Fallback for hardcoded emails or direct domain matches
        if (normalizedEmail === 'admin@nurseprep.ai' || normalizedEmail === 'wangechigodfrey77@gmail.com') {
          userRole = 'admin';
        } else if (normalizedEmail.endsWith('@nurseprep.ai')) {
          userRole = 'staff';
        } else {
          userRole = 'student';
        }
      }
      
      // If user is from the database and we have a temporary password set
      if (isDbUser && dbPassword) {
        if (password !== dbPassword) {
          throw new Error('Invalid email or password.');
        }
      }
      
      // Perform Auth Sign In
      try {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } catch (authErr: any) {
        // If user is registered in the DB (like lecturer/admin created by Super Admin) but not yet in Auth, create them now
        if (isDbUser && (authErr.code === 'auth/user-not-found' || authErr.message?.includes('user-not-found') || authErr.code === 'auth/invalid-credential')) {
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
            if (userCredential.user) {
              await updateProfile(userCredential.user, { displayName: dbName });
            }
          } catch (createErr: any) {
            console.error('Failed to auto-register db user in Auth:', createErr);
            throw authErr; // throw original login error if fallback registration fails
          }
        } else {
          throw authErr;
        }
      }
      
      localStorage.setItem('userRole', userRole);
      if (userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'staff') {
        navigate('/staff');
      } else {
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
      const userEmail = (result.user.email || '').trim().toLowerCase();
      
      // Look up user role in Firestore 'users' collection
      const q = query(collection(db, 'users'), where('email', '==', userEmail));
      const querySnapshot = await getDocs(q);
      
      let userRole = 'student';
      if (querySnapshot.size > 0) {
        const userDoc = querySnapshot.docs[0].data();
        const role = userDoc.role || 'Student';
        if (role.toLowerCase().includes('admin')) {
          userRole = 'admin';
        } else if (role.toLowerCase().includes('staff') || role.toLowerCase().includes('lecturer')) {
          userRole = 'staff';
        } else {
          userRole = 'student';
        }
      } else {
        if (userEmail === 'admin@nurseprep.ai' || userEmail === 'wangechigodfrey77@gmail.com') {
          userRole = 'admin';
        } else if (userEmail.endsWith('@nurseprep.ai')) {
          userRole = 'staff';
        } else {
          userRole = 'student';
        }
      }
      
      localStorage.setItem('userRole', userRole);
      if (userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'staff') {
        navigate('/staff');
      } else {
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
