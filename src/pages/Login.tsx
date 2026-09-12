import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Chrome, Clock, AlertCircle, Eye, EyeOff, ArrowLeft, Mail, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { auth, db, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import NurseLoadingAnimation from '@/components/NurseLoadingAnimation';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isTimeout = searchParams.get('reason') === 'timeout';
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');
  
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
        // Fallback for default system admin accounts
        if (normalizedEmail === 'admin@nurseprep.com' || normalizedEmail === 'wangechigodfrey77@gmail.com') {
          userRole = 'admin';
          isDbUser = true;
          dbPassword = 'password123';
          dbName = normalizedEmail === 'admin@nurseprep.com' ? 'System Admin' : 'Godfrey Wangechi';
        } else {
          userRole = 'student';
        }
      }
      
      // If user is from database/admin list and has a password recorded
      if (isDbUser && dbPassword) {
        if (password !== dbPassword) {
          throw new Error('Invalid email or password.');
        }
      }
      
      // Perform Auth Sign In with fallback auto-registration for staff/admin users created in DB
      try {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } catch (authErr: any) {
        // If user is in DB (e.g. created by admin) or is default system admin but not yet registered in Firebase Auth
        if (isDbUser) {
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
            if (userCredential.user) {
              await updateProfile(userCredential.user, { displayName: dbName || email.split('@')[0] });
            }
          } catch (createErr: any) {
            // If email is already in use in Auth, attempt login error or message
            if (createErr.code === 'auth/email-already-in-use') {
              throw new Error('Invalid email or password.');
            }
            console.error('Failed to auto-register db user in Auth:', createErr);
            throw authErr;
          }
        } else {
          throw new Error('Invalid email or password.');
        }
      }
      
      localStorage.setItem('userRole', userRole);
      localStorage.setItem('nurseprep_last_activity', Date.now().toString());
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
        if (userEmail === 'admin@nurseprep.com' || userEmail === 'wangechigodfrey77@gmail.com') {
          userRole = 'admin';
        } else {
          userRole = 'student';
        }
      }
      
      localStorage.setItem('userRole', userRole);
      localStorage.setItem('nurseprep_last_activity', Date.now().toString());
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

  const handleOpenForgotPassword = () => {
    setResetEmail(email.trim());
    setResetError('');
    setResetSuccess(false);
    setIsForgotPassword(true);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = resetEmail.trim();
    if (!targetEmail) {
      setResetError('Please enter your email address.');
      return;
    }

    try {
      setResetLoading(true);
      setResetError('');
      await sendPasswordResetEmail(auth, targetEmail);
      setResetSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/user-not-found') {
        setResetError('No registered account found with this email address.');
      } else if (err.code === 'auth/invalid-email') {
        setResetError('Please enter a valid email address.');
      } else {
        setResetError(err.message || 'Failed to send reset link. Please check the email and try again.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 sm:p-6 bg-slate-50 relative overflow-hidden">
      <div className="w-full max-w-[390px] bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 overflow-hidden relative z-20 my-auto transition-all">
        {/* Compact Nurse Art Header */}
        <div className="pt-4 pb-1 border-b border-slate-100 flex justify-center bg-slate-50/50">
          <NurseLoadingAnimation 
            title={isForgotPassword ? "Reset Password" : "Welcome Back"} 
            subtitle={isForgotPassword ? "Enter your email to receive a password reset link" : "Sign in to continue your journey"} 
            progress={loading || resetLoading ? 85 : 100}
            showStatus={false}
            showProgress={false}
            compact={true}
          />
        </div>

        <div className="p-5 sm:p-6">
          {/* Timeout Banner */}
          {isTimeout && !error && !isForgotPassword && (
            <div className="mb-3.5 p-2.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs flex items-start gap-2 shadow-2xs">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block">Session Expired</strong>
                <span>Your session expired due to inactivity. Please sign in again.</span>
              </div>
            </div>
          )}

          {/* Forgot Password Flow */}
          {isForgotPassword ? (
            <div className="space-y-4">
              {resetSuccess ? (
                <div className="text-center py-2 space-y-3">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Check Your Email</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      We've sent a password reset link to <strong className="text-slate-800">{resetEmail}</strong>. Follow the instructions in the email to set a new password.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-2">
                      Didn't see it? Please check your spam or junk folder.
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setResetSuccess(false);
                    }}
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider mt-2"
                  >
                    Return to Sign In
                  </Button>
                </div>
              ) : (
                <form onSubmit={handlePasswordReset} className="space-y-3.5">
                  {resetError && (
                    <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Your Account Email</label>
                    <div className="relative">
                      <input 
                        type="email" 
                        placeholder="jane@example.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        required
                        autoFocus
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={resetLoading} 
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider text-xs shadow-xs disabled:opacity-50"
                  >
                    {resetLoading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending Link...
                      </span>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setResetError('');
                    }}
                    className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5 pt-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* Standard Sign In Flow */
            <>
              {error && (
                <div className="mb-3 p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="jane@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Password</label>
                    <button 
                      type="button" 
                      onClick={handleOpenForgotPassword} 
                      className="text-xs text-blue-600 font-bold hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-slate-600" />
                      ) : (
                        <Eye className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider text-xs mt-1 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>

              <div className="my-3.5 flex items-center gap-3">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or continue with</span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>

              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-10 gap-2.5 font-bold text-xs text-slate-700 hover:bg-slate-50"
                onClick={handleGoogleSignIn}
              >
                <Chrome className="w-4 h-4 text-blue-500" />
                Sign in with Google
              </Button>

              <p className="text-center text-xs text-slate-500 mt-4">
                Don't have an account? <Link to="/register" className="text-blue-600 font-bold hover:underline">Sign Up</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
