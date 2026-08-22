import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, ShieldAlert, LogOut, RefreshCw, AlertTriangle } from 'lucide-react';
import { auth, signOut } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// 30 Minutes Inactivity Timeout
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_THRESHOLD_MS = 2 * 60 * 1000;   // Show warning 2 minutes before timeout (at 28 min mark)
const STORAGE_KEY = 'nurseprep_last_activity';

export function SessionTimeoutManager() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!auth.currentUser || !!localStorage.getItem('userRole');
  });

  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(120);
  const lastActiveRef = useRef<number>(Date.now());
  const lastThrottledWriteRef = useRef<number>(0);

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const hasRole = !!localStorage.getItem('userRole');
      const loggedIn = !!user || hasRole;
      setIsAuthenticated(loggedIn);

      if (loggedIn) {
        // Initialize or update last active timestamp on login
        const saved = localStorage.getItem(STORAGE_KEY);
        const parsed = saved ? parseInt(saved, 10) : NaN;
        const currentNow = Date.now();
        if (!isNaN(parsed) && currentNow - parsed < INACTIVITY_TIMEOUT_MS) {
          lastActiveRef.current = parsed;
        } else {
          lastActiveRef.current = currentNow;
          localStorage.setItem(STORAGE_KEY, currentNow.toString());
        }
      } else {
        setShowWarning(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Update activity timestamp with throttling (max once every 3 seconds)
  const recordActivity = useCallback(() => {
    const now = Date.now();
    lastActiveRef.current = now;

    if (now - lastThrottledWriteRef.current > 3000) {
      lastThrottledWriteRef.current = now;
      try {
        localStorage.setItem(STORAGE_KEY, now.toString());
      } catch (e) {
        // Ignore storage write quota exceptions if any
      }
    }

    // If warning is active and user actively interacts, dismiss warning if more than 30s remaining
    if (showWarning && secondsRemaining > 30) {
      setShowWarning(false);
    }
  }, [showWarning, secondsRemaining]);

  // Handle explicit session extension
  const handleExtendSession = () => {
    const now = Date.now();
    lastActiveRef.current = now;
    lastThrottledWriteRef.current = now;
    try {
      localStorage.setItem(STORAGE_KEY, now.toString());
    } catch (e) {}
    setShowWarning(false);
    setSecondsRemaining(Math.floor(WARNING_THRESHOLD_MS / 1000));
  };

  // Perform logout on timeout
  const handleLogout = useCallback(async (isTimeout = true) => {
    setShowWarning(false);
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Session timeout signOut error:", e);
    }
    localStorage.removeItem('userRole');
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);

    if (isTimeout) {
      navigate('/login?reason=timeout', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // Listen to multi-tab storage synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const remoteTime = parseInt(e.newValue, 10);
        if (!isNaN(remoteTime)) {
          lastActiveRef.current = remoteTime;
          // If remote tab was active, close warning on this tab as well
          const elapsed = Date.now() - remoteTime;
          if (elapsed < INACTIVITY_TIMEOUT_MS - WARNING_THRESHOLD_MS) {
            setShowWarning(false);
          }
        }
      } else if (e.key === 'userRole' && !e.newValue) {
        // User logged out in another tab
        setIsAuthenticated(false);
        setShowWarning(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Set up DOM interaction event listeners to track user presence
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    const onUserInteraction = () => recordActivity();

    events.forEach((evt) => {
      window.addEventListener(evt, onUserInteraction, { passive: true });
    });

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, onUserInteraction);
      });
    };
  }, [isAuthenticated, recordActivity]);

  // Master interval timer: checks inactivity every 1000ms
  useEffect(() => {
    if (!isAuthenticated) return;

    const timer = setInterval(() => {
      const now = Date.now();
      // Read latest from localStorage if available in case updated by another tab
      let lastActive = lastActiveRef.current;
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed > lastActive) {
          lastActive = parsed;
          lastActiveRef.current = parsed;
        }
      }

      const elapsed = now - lastActive;
      const remaining = INACTIVITY_TIMEOUT_MS - elapsed;

      if (remaining <= 0) {
        // 30 min of inactivity reached -> log out
        clearInterval(timer);
        handleLogout(true);
      } else if (remaining <= WARNING_THRESHOLD_MS) {
        // Less than 2 minutes remaining -> show countdown warning modal
        setShowWarning(true);
        setSecondsRemaining(Math.max(0, Math.ceil(remaining / 1000)));
      } else {
        if (showWarning) {
          setShowWarning(false);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isAuthenticated, showWarning, handleLogout]);

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isAuthenticated || !showWarning) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-800 relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Inactivity Timeout Warning
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">Your session is about to expire</h3>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          For your security, you will be automatically signed out after <span className="font-semibold text-slate-800">30 minutes</span> of inactivity.
        </p>

        {/* Countdown Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 text-center">
          <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">Signing out in</span>
          <div className="text-3xl font-mono font-black text-rose-600 my-1">
            {formatTime(secondsRemaining)}
          </div>
          <span className="text-xs text-slate-400">Click below or interact to keep your session active.</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={handleExtendSession}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-blue-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Stay Signed In
          </button>
          <button
            onClick={() => handleLogout(false)}
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors border border-slate-200"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
