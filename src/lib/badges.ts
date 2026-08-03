import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Medal, Flame, Award, Star, Target, Shield, Zap, BookOpen, CheckCircle } from 'lucide-react';

export interface BadgeConfig {
  id: string;
  name: string;
  description: string;
  conditionType: 'beginner' | 'streak' | 'questionsCount' | 'score' | 'mastery' | 'unitMastery';
  conditionValue: number;
  icon: string;
  color: string;
  bg: string;
  enabled: boolean;
}

export interface UserBadgeState extends BadgeConfig {
  unlocked: boolean;
  progress: number;
  progressMax: number;
  unlockedAt?: string;
}

export const ICON_MAP: Record<string, any> = {
  Award,
  Flame,
  Medal,
  Star,
  Target,
  Shield,
  Zap,
  BookOpen,
  CheckCircle,
};

export const DEFAULT_BADGES: BadgeConfig[] = [
  {
    id: 'beginner',
    name: 'Beginner Nurse',
    description: 'Started your NCLEX prep & completed your 1st practice quiz',
    conditionType: 'beginner',
    conditionValue: 1,
    icon: 'Award',
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    enabled: true,
  },
  {
    id: 'streak_1',
    name: 'Day 1 Ignited',
    description: 'Logged in and completed at least 1 practice session',
    conditionType: 'streak',
    conditionValue: 1,
    icon: 'Flame',
    color: 'text-orange-500',
    bg: 'bg-orange-50 border-orange-200',
    enabled: true,
  },
  {
    id: 'streak_3',
    name: '3-Day Streak',
    description: 'Maintained a continuous 3-day study streak',
    conditionType: 'streak',
    conditionValue: 3,
    icon: 'Flame',
    color: 'text-amber-500',
    bg: 'bg-amber-50 border-amber-200',
    enabled: true,
  },
  {
    id: 'streak_7',
    name: '7-Day Master',
    description: 'Unbroken 7-day NCLEX study streak',
    conditionType: 'streak',
    conditionValue: 7,
    icon: 'Flame',
    color: 'text-orange-600',
    bg: 'bg-orange-100 border-orange-300',
    enabled: true,
  },
  {
    id: 'streak_14',
    name: '14-Day Champion',
    description: '14-day continuous study commitment',
    conditionType: 'streak',
    conditionValue: 14,
    icon: 'Shield',
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-200',
    enabled: true,
  },
  {
    id: 'streak_30',
    name: '30-Day Legend',
    description: 'Completed a full month (30 days) streak',
    conditionType: 'streak',
    conditionValue: 30,
    icon: 'Zap',
    color: 'text-rose-600',
    bg: 'bg-rose-50 border-rose-200',
    enabled: true,
  },
  {
    id: 'score_90',
    name: 'High Achiever',
    description: 'Scored 90% or higher on an exam bundle',
    conditionType: 'score',
    conditionValue: 90,
    icon: 'Target',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200',
    enabled: true,
  },
  {
    id: 'century_100',
    name: 'Century Club',
    description: 'Answered 100 total NCLEX questions',
    conditionType: 'questionsCount',
    conditionValue: 100,
    icon: 'Medal',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 border-indigo-200',
    enabled: true,
  },
  {
    id: 'half_century_50',
    name: 'Half Centurion',
    description: 'Answered 50 total NCLEX practice questions',
    conditionType: 'questionsCount',
    conditionValue: 50,
    icon: 'CheckCircle',
    color: 'text-teal-600',
    bg: 'bg-teal-50 border-teal-200',
    enabled: true,
  },
  {
    id: 'mastery_80',
    name: 'NCLEX Master Scholar',
    description: 'Achieved 80% or higher overall NCLEX domain mastery',
    conditionType: 'mastery',
    conditionValue: 80,
    icon: 'Star',
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    enabled: true,
  },
];

const LOCAL_STORAGE_KEY = 'nurseprep_badge_configs';

/**
 * Fetch badge configurations from Firestore (with localStorage fallback).
 */
export async function fetchBadgeConfigs(): Promise<BadgeConfig[]> {
  try {
    const snap = await getDocs(collection(db, 'badgeConfigs'));
    if (!snap.empty) {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BadgeConfig));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
      return items;
    }
  } catch (err) {
    console.warn('Unable to load badge configs from Firestore, falling back to local storage', err);
  }

  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing stored badge configs', e);
    }
  }

  // Fallback to default badges
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_BADGES));
  return DEFAULT_BADGES;
}

/**
 * Save badge configuration to Firestore (and sync localStorage).
 */
export async function saveBadgeConfig(badge: BadgeConfig): Promise<void> {
  const allBadges = await fetchBadgeConfigs();
  const index = allBadges.findIndex(b => b.id === badge.id);
  if (index >= 0) {
    allBadges[index] = badge;
  } else {
    allBadges.push(badge);
  }

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allBadges));

  try {
    await setDoc(doc(db, 'badgeConfigs', badge.id), badge, { merge: true });
  } catch (err) {
    console.warn('Saved badge config locally, Firestore sync pending:', err);
  }
}

/**
 * Delete a badge config.
 */
export async function deleteBadgeConfig(badgeId: string): Promise<void> {
  const allBadges = await fetchBadgeConfigs();
  const filtered = allBadges.filter(b => b.id !== badgeId);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));

  try {
    await deleteDoc(doc(db, 'badgeConfigs', badgeId));
  } catch (err) {
    console.warn('Deleted badge locally, Firestore sync pending:', err);
  }
}

/**
 * Reset badge configurations to system defaults.
 */
export async function resetBadgeConfigsToDefault(): Promise<BadgeConfig[]> {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_BADGES));
  try {
    for (const b of DEFAULT_BADGES) {
      await setDoc(doc(db, 'badgeConfigs', b.id), b, { merge: true });
    }
  } catch (e) {
    console.warn('Reset local badge configs, Firestore sync warning:', e);
  }
  return DEFAULT_BADGES;
}

/**
 * Calculate user study streak from exam history timestamps.
 */
export function calculateUserStreak(history: any[]): { streak: number; totalQuestions: number; maxScore: number } {
  let totalQuestions = 0;
  let maxScore = 0;

  if (!history || history.length === 0) {
    return { streak: 0, totalQuestions: 0, maxScore: 0 };
  }

  const uniqueDays = new Set<string>();

  history.forEach(item => {
    totalQuestions += item.totalQuestions || 0;
    if (item.score > maxScore) {
      maxScore = item.score;
    }

    let dateObj: Date | null = null;
    if (item.timestamp) {
      dateObj = new Date(item.timestamp);
    } else if (item.createdAt) {
      dateObj = new Date(item.createdAt);
    } else if (item.date) {
      dateObj = new Date(item.date);
    }

    if (dateObj && !isNaN(dateObj.getTime())) {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      uniqueDays.add(`${year}-${month}-${day}`);
    }
  });

  if (uniqueDays.size === 0) {
    // If user has exam history items but dates were missing, count as at least 1 day active
    return { streak: 1, totalQuestions, maxScore };
  }

  const sortedDates = Array.from(uniqueDays).sort().reverse();
  const now = new Date();

  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = formatDate(now);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  // Check if today or yesterday is present
  const hasToday = uniqueDays.has(todayStr);
  const hasYesterday = uniqueDays.has(yesterdayStr);

  if (!hasToday && !hasYesterday) {
    // Break in streak, but if history exists, set 0 or 1 for last activity
    return { streak: 0, totalQuestions, maxScore };
  }

  let streak = 0;
  let checkDate = new Date(hasToday ? now : yesterday);

  while (true) {
    const dStr = formatDate(checkDate);
    if (uniqueDays.has(dStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return { streak: Math.max(streak, 1), totalQuestions, maxScore };
}

/**
 * Evaluate user's current badges against badge configurations.
 */
export function evaluateUserBadges(
  badgeConfigs: BadgeConfig[],
  stats: { questionsAnswered: number; averageScore: number; streak: number; xp: number; overallMastery?: number },
  history: any[]
): UserBadgeState[] {
  const maxScore = history.reduce((max, item) => Math.max(max, item.score || 0), stats.averageScore || 0);
  const hasHistory = history.length > 0 || stats.questionsAnswered > 0;
  const currentMastery = stats.overallMastery ?? stats.averageScore ?? 0;

  return badgeConfigs
    .filter(b => b.enabled)
    .map(badge => {
      let unlocked = false;
      let progress = 0;
      const progressMax = badge.conditionValue || 1;

      switch (badge.conditionType) {
        case 'beginner':
          unlocked = hasHistory || stats.questionsAnswered >= 1;
          progress = unlocked ? 1 : 0;
          break;

        case 'streak':
          progress = Math.min(stats.streak, progressMax);
          unlocked = stats.streak >= progressMax;
          break;

        case 'questionsCount':
          progress = Math.min(stats.questionsAnswered, progressMax);
          unlocked = stats.questionsAnswered >= progressMax;
          break;

        case 'score':
          progress = Math.min(maxScore, progressMax);
          unlocked = maxScore >= progressMax;
          break;

        case 'mastery':
          progress = Math.min(currentMastery, progressMax);
          unlocked = currentMastery >= progressMax;
          break;

        case 'unitMastery':
          progress = Math.min(currentMastery, progressMax);
          unlocked = currentMastery >= progressMax;
          break;
      }

      return {
        ...badge,
        unlocked,
        progress,
        progressMax,
      };
    });
}
