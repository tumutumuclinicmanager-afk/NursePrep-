import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

export const TRIAL_DURATION_DAYS = 14;
export const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;

export interface TrialState {
  isPaid: boolean;
  isUnlimited: boolean; // Admin, staff, or paid plan
  isTrial: boolean;
  isExpired: boolean;
  plan: 'free' | 'basic' | 'gold' | 'platinum' | 'admin' | 'staff';
  planName: string;
  startDate: string;
  expiresAt: string;
  totalSecondsRemaining: number;
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  secondsRemaining: number;
  formattedTimeLeft: string;
}

const DEFAULT_STATE: TrialState = {
  isPaid: false,
  isUnlimited: false,
  isTrial: true,
  isExpired: false,
  plan: 'free',
  planName: 'Free Trial',
  startDate: new Date().toISOString(),
  expiresAt: new Date(Date.now() + TRIAL_DURATION_MS).toISOString(),
  totalSecondsRemaining: TRIAL_DURATION_DAYS * 86400,
  daysRemaining: TRIAL_DURATION_DAYS,
  hoursRemaining: 0,
  minutesRemaining: 0,
  secondsRemaining: 0,
  formattedTimeLeft: '14 Days Remaining'
};

/**
 * Calculates accurate trial timing from a given start timestamp or ISO string
 */
export function calculateTrialFromDates(
  startDateStr?: string | null,
  planType: string = 'free',
  role: string = 'student'
): TrialState {
  const normalizedRole = (role || 'student').toLowerCase();
  const normalizedPlan = (planType || 'free').toLowerCase();

  // Admin and Staff have lifetime unlimited access
  if (normalizedRole === 'admin' || normalizedRole === 'staff') {
    return {
      isPaid: true,
      isUnlimited: true,
      isTrial: false,
      isExpired: false,
      plan: normalizedRole as any,
      planName: normalizedRole === 'admin' ? 'Administrator' : 'Faculty / Staff',
      startDate: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      totalSecondsRemaining: 9999999,
      daysRemaining: 365,
      hoursRemaining: 0,
      minutesRemaining: 0,
      secondsRemaining: 0,
      formattedTimeLeft: 'Unlimited Access'
    };
  }

  // Check if user has an active paid subscription tier
  const isPaid = ['basic', 'gold', 'platinum', 'silver', 'surepass', 'mastery'].some(p => normalizedPlan.includes(p));
  if (isPaid) {
    const formattedPlan = normalizedPlan.charAt(0).toUpperCase() + normalizedPlan.slice(1);
    return {
      isPaid: true,
      isUnlimited: true,
      isTrial: false,
      isExpired: false,
      plan: (normalizedPlan.includes('plat') ? 'platinum' : normalizedPlan.includes('gold') ? 'gold' : 'basic') as any,
      planName: `${formattedPlan} Plan`,
      startDate: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      totalSecondsRemaining: 9999999,
      daysRemaining: 365,
      hoursRemaining: 0,
      minutesRemaining: 0,
      secondsRemaining: 0,
      formattedTimeLeft: 'Active Subscription'
    };
  }

  // Parse start date or fallback
  let startMs = Date.now();
  if (startDateStr) {
    const parsed = new Date(startDateStr).getTime();
    if (!isNaN(parsed)) {
      startMs = parsed;
    }
  }

  const expireMs = startMs + TRIAL_DURATION_MS;
  const nowMs = Date.now();
  const diffMs = expireMs - nowMs;
  const isExpired = diffMs <= 0;

  if (isExpired) {
    return {
      isPaid: false,
      isUnlimited: false,
      isTrial: true,
      isExpired: true,
      plan: 'free',
      planName: 'Trial Expired',
      startDate: new Date(startMs).toISOString(),
      expiresAt: new Date(expireMs).toISOString(),
      totalSecondsRemaining: 0,
      daysRemaining: 0,
      hoursRemaining: 0,
      minutesRemaining: 0,
      secondsRemaining: 0,
      formattedTimeLeft: 'Trial Expired'
    };
  }

  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let formatted = '';
  if (days > 0) {
    formatted = `${days}d ${hours}h left`;
  } else if (hours > 0) {
    formatted = `${hours}h ${minutes}m left`;
  } else {
    formatted = `${minutes}m ${seconds}s left`;
  }

  return {
    isPaid: false,
    isUnlimited: false,
    isTrial: true,
    isExpired: false,
    plan: 'free',
    planName: '14-Day Free Trial',
    startDate: new Date(startMs).toISOString(),
    expiresAt: new Date(expireMs).toISOString(),
    totalSecondsRemaining: totalSeconds,
    daysRemaining: days,
    hoursRemaining: hours,
    minutesRemaining: minutes,
    secondsRemaining: seconds,
    formattedTimeLeft: formatted
  };
}

/**
 * Fetch or initialize the user's trial in Firestore and cache
 */
export async function getOrInitTrial(user: any): Promise<TrialState> {
  const role = localStorage.getItem('userRole') || 'student';
  if (!user) {
    return calculateTrialFromDates(null, 'free', role);
  }

  const userEmail = (user.email || '').toLowerCase();
  const storageKey = `nurseprep_trial_${user.uid || userEmail}`;
  
  // 1. Check for manual simulation override in localStorage
  const simOverride = localStorage.getItem('nurseprep_simulated_trial_state');
  if (simOverride) {
    try {
      const parsed = JSON.parse(simOverride);
      if (parsed && typeof parsed.isExpired === 'boolean') {
        return parsed;
      }
    } catch (e) {}
  }

  try {
    let userDocData: any = null;
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      userDocData = snap.data();
    } else if (userEmail) {
      const q = query(collection(db, 'users'), where('email', '==', userEmail));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        userDocData = qSnap.docs[0].data();
      }
    }

    // Check payment transactions
    let hasPaidRecord = false;
    let paidPlanName = '';
    if (userEmail) {
      const payQ = query(
        collection(db, 'payments'),
        where('user', '==', userEmail)
      );
      const paySnap = await getDocs(payQ);
      for (const pDoc of paySnap.docs) {
        const pData = pDoc.data();
        if (pData.status === 'Approved' || pData.status === 'Completed') {
          hasPaidRecord = true;
          paidPlanName = pData.plan || pData.planName || 'basic';
          break;
        }
      }
    }

    const currentPlan = hasPaidRecord 
      ? paidPlanName 
      : (userDocData?.subscriptionPlan || userDocData?.plan || 'free');

    let startDate = userDocData?.trialStartDate || userDocData?.createdAt || userDocData?.added;

    // If new or missing start date, save initial trial start date in Firestore
    if (!startDate) {
      startDate = new Date().toISOString();
      const expiresAt = new Date(Date.now() + TRIAL_DURATION_MS).toISOString();
      try {
        if (snap.exists()) {
          await updateDoc(userRef, {
            trialStartDate: startDate,
            trialExpiresAt: expiresAt,
            subscriptionPlan: currentPlan
          });
        } else {
          await setDoc(userRef, {
            userId: user.uid,
            email: userEmail,
            name: user.displayName || userEmail.split('@')[0],
            role: role,
            status: 'Active',
            subscriptionPlan: currentPlan,
            trialStartDate: startDate,
            trialExpiresAt: expiresAt,
            added: new Date().toISOString().split('T')[0]
          }, { merge: true });
        }
      } catch (saveErr) {
        console.warn("Could not save trial start date to Firestore:", saveErr);
      }
    }

    const state = calculateTrialFromDates(startDate, currentPlan, userDocData?.role || role);
    localStorage.setItem(storageKey, JSON.stringify(state));
    return state;
  } catch (err) {
    console.warn("Error fetching trial state from Firestore, falling back to local calculation:", err);
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    return calculateTrialFromDates(null, 'free', role);
  }
}

/**
 * Test & simulation helper: Force trial into expired or active state for testing
 */
export async function setSimulatedTrialExpired(expired: boolean, user?: any) {
  const userEmail = user?.email ? user.email.toLowerCase() : '';
  const storageKey = user ? `nurseprep_trial_${user.uid || userEmail}` : '';

  if (expired) {
    const expiredStartDate = new Date(Date.now() - (TRIAL_DURATION_MS + 3600000)).toISOString();
    const expiredState = calculateTrialFromDates(expiredStartDate, 'free', 'student');
    localStorage.setItem('nurseprep_simulated_trial_state', JSON.stringify(expiredState));
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(expiredState));
    }
  } else {
    localStorage.removeItem('nurseprep_simulated_trial_state');
    const freshStartDate = new Date().toISOString();
    const freshExpiresAt = new Date(Date.now() + TRIAL_DURATION_MS).toISOString();
    
    if (user?.uid) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          trialStartDate: freshStartDate,
          trialExpiresAt: freshExpiresAt,
          subscriptionPlan: 'free'
        });
      } catch (err) {
        console.warn("Could not reset trial in Firestore:", err);
      }
    }
    const freshState = calculateTrialFromDates(freshStartDate, 'free', 'student');
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(freshState));
    }
  }

  // Dispatch event so all open views immediately refresh
  window.dispatchEvent(new CustomEvent('nurseprep_trial_changed'));
}

/**
 * Custom React Hook that provides live countdown ticking every 1 second
 */
export function useTrialCountdown(user: any) {
  const [trial, setTrial] = useState<TrialState>(() => {
    const role = localStorage.getItem('userRole') || 'student';
    return calculateTrialFromDates(null, 'free', role);
  });
  const [loading, setLoading] = useState(true);

  const refreshTrial = useCallback(async () => {
    if (!user) {
      const role = localStorage.getItem('userRole') || 'student';
      setTrial(calculateTrialFromDates(null, 'free', role));
      setLoading(false);
      return;
    }
    const state = await getOrInitTrial(user);
    setTrial(state);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refreshTrial();

    const handleCustomChange = () => {
      refreshTrial();
    };

    window.addEventListener('nurseprep_trial_changed', handleCustomChange);
    window.addEventListener('storage', handleCustomChange);

    return () => {
      window.removeEventListener('nurseprep_trial_changed', handleCustomChange);
      window.removeEventListener('storage', handleCustomChange);
    };
  }, [refreshTrial]);

  // Live 1-second countdown ticker
  useEffect(() => {
    if (trial.isUnlimited || !trial.isTrial) return;

    const timer = setInterval(() => {
      setTrial(prev => {
        if (prev.isUnlimited || !prev.isTrial) return prev;
        const updated = calculateTrialFromDates(prev.startDate, prev.plan, 'student');
        return updated;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [trial.isUnlimited, trial.isTrial, trial.startDate, trial.plan]);

  return { trial, loading, refreshTrial };
}
