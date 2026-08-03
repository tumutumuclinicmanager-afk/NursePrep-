import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { NURSING_UNITS } from '@/data/quizQuestions';
import QuizGeneratorPage from './QuizGeneratorPage';
import { 
  fetchBadgeConfigs, 
  calculateUserStreak, 
  evaluateUserBadges, 
  BadgeConfig, 
  UserBadgeState 
} from '@/lib/badges';

// Unit themes mapping for visual styling
const UNIT_THEMES: Record<string, { color: string; bg: string; border: string; bar: string }> = {
  'Medical-Surgical Nursing': { color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', bar: 'bg-rose-500' },
  'Maternal & Newborn Health': { color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200', bar: 'bg-pink-500' },
  'Pediatric Nursing': { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-500' },
  'Pharmacology & Parenteral Therapies': { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-500' },
  'Psychiatric & Mental Health': { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', bar: 'bg-purple-500' },
  'Community & Public Health': { color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200', bar: 'bg-teal-500' },
  'Nursing Fundamentals & Leadership': { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', bar: 'bg-blue-500' },
  'Critical Care & Emergency Nursing': { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', bar: 'bg-orange-500' },
};

export default function PerformancePage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    questionsAnswered: 0,
    averageScore: 0,
    streak: 0,
    xp: 0,
    overallMastery: 0
  });
  const [history, setHistory] = useState<any[]>([]);
  const [badgeConfigs, setBadgeConfigs] = useState<BadgeConfig[]>([]);
  const [evaluatedBadges, setEvaluatedBadges] = useState<UserBadgeState[]>([]);
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  // Quick Quiz Generator Widget State
  const [selectedUnit, setSelectedUnit] = useState<string>('All');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [showQuizModal, setShowQuizModal] = useState<boolean>(false);

  const fetchUserData = async () => {
    try {
      const configs = await fetchBadgeConfigs();
      setBadgeConfigs(configs);

      if (!auth.currentUser) return;

      const historyRef = collection(db, 'examHistory');
      const q = query(historyRef, where('user', '==', auth.currentUser.email));
      const querySnapshot = await getDocs(q);
      
      const data = querySnapshot.docs.map(doc => doc.data());
      setHistory(data);
      
      const { streak: realStreak } = calculateUserStreak(data);
      
      const questionsCount = data.reduce((acc, curr) => acc + (curr.totalQuestions || 0), 0);
      const avgScore = data.length > 0 ? Math.round(data.reduce((acc, curr) => acc + (curr.score || 0), 0) / data.length) : 0;
      const userXp = questionsCount * 10 + data.length * 50;

      // Compute overall mastery from breakdowns or score history
      let totalAttempted = 0;
      let totalCorrect = 0;
      data.forEach(item => {
        if (item.unitBreakdown) {
          Object.values(item.unitBreakdown).forEach((u: any) => {
            totalAttempted += u.total || 0;
            totalCorrect += u.correct || 0;
          });
        } else {
          const tot = item.totalQuestions || 0;
          const corr = item.correctQuestions ?? Math.round(((item.score || 0) / 100) * tot);
          totalAttempted += tot;
          totalCorrect += corr;
        }
      });
      const overallMastery = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : avgScore;

      const updatedStats = {
        questionsAnswered: questionsCount,
        averageScore: avgScore,
        streak: realStreak,
        xp: userXp,
        overallMastery
      };

      setStats(updatedStats);

      // Evaluate Badges
      const badgeStates = evaluateUserBadges(configs, updatedStats, data);
      setEvaluatedBadges(badgeStates);
    } catch (err) {
      console.warn("Failed to fetch performance data from Firestore:", err);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Compute Per-Unit Performance Metrics
  const unitMetrics = NURSING_UNITS.map(unitName => {
    let attempted = 0;
    let correct = 0;

    history.forEach(item => {
      if (item.unitBreakdown && item.unitBreakdown[unitName]) {
        attempted += item.unitBreakdown[unitName].total || 0;
        correct += item.unitBreakdown[unitName].correct || 0;
      } else if (item.category === unitName) {
        const tot = item.totalQuestions || 0;
        const corr = item.correctQuestions ?? Math.round(((item.score || 0) / 100) * tot);
        attempted += tot;
        correct += corr;
      } else if (!item.category || item.category === 'All' || item.category === 'All Units') {
        const tot = Math.round((item.totalQuestions || 0) / NURSING_UNITS.length);
        const corr = Math.round((item.correctQuestions ?? Math.round(((item.score || 0) / 100) * (item.totalQuestions || 0))) / NURSING_UNITS.length);
        attempted += tot;
        correct += corr;
      }
    });

    const mastery = attempted > 0 ? Math.min(100, Math.round((correct / attempted) * 100)) : 0;

    let status: 'Mastered' | 'Proficient' | 'Developing' | 'Needs Review' | 'Not Started' = 'Not Started';
    if (attempted > 0) {
      if (mastery >= 80) status = 'Mastered';
      else if (mastery >= 70) status = 'Proficient';
      else if (mastery >= 50) status = 'Developing';
      else status = 'Needs Review';
    }

    const theme = UNIT_THEMES[unitName] || { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', bar: 'bg-blue-500' };

    return {
      unitName,
      attempted,
      correct,
      mastery,
      status,
      theme
    };
  });

  const totalAttemptedAll = unitMetrics.reduce((acc, u) => acc + u.attempted, 0);
  const totalCorrectAll = unitMetrics.reduce((acc, u) => acc + u.correct, 0);
  const overallMastery = totalAttemptedAll > 0
    ? Math.round((totalCorrectAll / totalAttemptedAll) * 100)
    : (stats.averageScore || 0);

  const masteredUnitsCount = unitMetrics.filter(u => u.status === 'Mastered').length;

  let readinessBadge = { label: 'Beginner Readiness', color: 'bg-slate-100 text-slate-700 border-slate-300' };
  if (overallMastery >= 85 && totalAttemptedAll >= 20) {
    readinessBadge = { label: 'NCLEX Board Ready', color: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' };
  } else if (overallMastery >= 75) {
    readinessBadge = { label: 'High Competency (On Track)', color: 'bg-blue-100 text-blue-800 border-blue-300 font-bold' };
  } else if (overallMastery >= 60) {
    readinessBadge = { label: 'Moderate Proficiency', color: 'bg-amber-100 text-amber-800 border-amber-300 font-bold' };
  } else if (totalAttemptedAll > 0) {
    readinessBadge = { label: 'Developing Competency', color: 'bg-orange-100 text-orange-800 border-orange-300 font-bold' };
  }

  const unlockedBadgesCount = evaluatedBadges.filter(b => b.unlocked).length;

  const filteredBadges = evaluatedBadges.filter(b => {
    if (badgeFilter === 'unlocked') return b.unlocked;
    if (badgeFilter === 'locked') return !b.unlocked;
    return true;
  });

  const handleLaunchUnitQuiz = (unitName: string) => {
    setSelectedUnit(unitName);
    setShowQuizModal(true);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Performance & Mastery Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Detailed breakdown of questions attempted per unit, overall NCLEX domain mastery percentage, and earned achievement badges.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => { setSelectedUnit('All'); setShowQuizModal(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 shadow-sm rounded-xl"
          >
            Generate Practice Test
          </Button>
        </div>
      </div>

      {/* Overall NCLEX Mastery & Readiness Hero Gauge Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`text-xs px-3.5 py-1 rounded-full border shadow-2xs ${readinessBadge.color}`}>
                {readinessBadge.label}
              </span>
              <span className="text-xs font-semibold text-slate-300 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                Saunders NCLEX-RN Standard
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Overall Domain Mastery: <span className="text-blue-400">{overallMastery}%</span>
              </h2>
              <p className="text-xs text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
                Evaluated in real-time across all 8 core NCLEX specialty domains. Practice targeted questions in lower-performing units to maximize your passing probability.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Attempted</span>
                <strong className="text-white text-lg font-bold">{totalAttemptedAll} Questions</strong>
              </div>
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Correct</span>
                <strong className="text-emerald-400 text-lg font-bold">{totalCorrectAll} Correct</strong>
              </div>
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Mastered Units</span>
                <strong className="text-amber-400 text-lg font-bold">{masteredUnitsCount} / {NURSING_UNITS.length}</strong>
              </div>
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Badges Earned</span>
                <strong className="text-purple-300 text-lg font-bold">{unlockedBadgesCount} Badges</strong>
              </div>
            </div>
          </div>

          {/* Overall Gauge Visual */}
          <div className="flex flex-col items-center justify-center shrink-0 bg-white/5 border border-white/10 rounded-2xl p-6 sm:w-52 text-center w-full md:w-auto">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-700 stroke-current"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-blue-400 stroke-current transition-all duration-1000 ease-out"
                  strokeDasharray={`${overallMastery}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-white">{overallMastery}%</span>
                <span className="text-[9px] uppercase font-bold text-slate-300">Accuracy</span>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300 mt-3">NCLEX Readiness</span>
          </div>
        </div>
      </div>

      {/* Per-Unit Performance Metrics Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-bold text-slate-900 text-lg">
              Questions Attempted & Mastery Per Unit
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Individual domain statistics for all 8 NCLEX nursing specialty categories.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full">
              Units Evaluated: <strong className="text-slate-900 font-bold">{NURSING_UNITS.length}</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
          {unitMetrics.map((unit, idx) => {
            let statusStyle = 'bg-slate-100 text-slate-600 border-slate-200';
            if (unit.status === 'Mastered') statusStyle = 'bg-emerald-100 text-emerald-800 border-emerald-300';
            else if (unit.status === 'Proficient') statusStyle = 'bg-blue-100 text-blue-800 border-blue-300';
            else if (unit.status === 'Developing') statusStyle = 'bg-amber-100 text-amber-800 border-amber-300';
            else if (unit.status === 'Needs Review') statusStyle = 'bg-rose-100 text-rose-800 border-rose-300';

            return (
              <div 
                key={idx}
                className="p-5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all bg-white flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{unit.unitName}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusStyle}`}>
                        {unit.status}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {unit.attempted} Attempted
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xl font-extrabold text-slate-900">{unit.mastery}%</span>
                    <span className="text-[10px] block font-medium text-slate-400">Mastery Rate</span>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        unit.mastery >= 80 ? 'bg-emerald-500' :
                        unit.mastery >= 70 ? 'bg-blue-500' :
                        unit.mastery >= 50 ? 'bg-amber-500' :
                        unit.attempted > 0 ? 'bg-rose-500' : 'bg-slate-300'
                      }`}
                      style={{ width: `${unit.attempted > 0 ? unit.mastery : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                    <span>{unit.correct} Correct out of {unit.attempted} Questions</span>
                    <span className="font-bold text-slate-700">{unit.attempted > 0 ? `${unit.mastery}% Accuracy` : 'Not Attempted'}</span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleLaunchUnitQuiz(unit.unitName)}
                  className="w-full py-2 px-4 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-xl text-xs font-bold transition-colors text-center"
                >
                  Practice {unit.unitName.split(' ')[0]} Questions
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges & Attainments Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-bold text-slate-900 text-lg">
              Badges & Achievements ({unlockedBadgesCount} / {evaluatedBadges.length} Attained)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Unlock milestone badges by completing practice questions, maintaining study streaks, and achieving unit mastery.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setBadgeFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                badgeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({evaluatedBadges.length})
            </button>
            <button
              onClick={() => setBadgeFilter('unlocked')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                badgeFilter === 'unlocked' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unlocked ({unlockedBadgesCount})
            </button>
            <button
              onClick={() => setBadgeFilter('locked')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                badgeFilter === 'locked' ? 'bg-white text-slate-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Locked ({evaluatedBadges.length - unlockedBadgesCount})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBadges.map((badge) => {
            return (
              <div 
                key={badge.id} 
                className={`p-4 rounded-xl border transition-all relative overflow-hidden ${
                  badge.unlocked 
                    ? `${badge.bg} border-slate-200 shadow-2xs` 
                    : 'bg-slate-50/80 border-slate-200 opacity-60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-bold text-xs text-slate-900 truncate">{badge.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      badge.unlocked 
                        ? 'text-emerald-700 bg-emerald-100' 
                        : 'text-slate-500 bg-slate-200'
                    }`}>
                      {badge.unlocked ? 'Unlocked' : 'Locked'}
                    </span>
                  </div>
                  
                  <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                    {badge.description}
                  </p>

                  <div className="pt-1.5 space-y-1">
                    <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-300 ${badge.unlocked ? 'bg-emerald-500' : 'bg-slate-400'}`} 
                        style={{ width: `${badge.unlocked ? 100 : Math.min(100, (badge.progress / badge.progressMax) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                      <span>Progress</span>
                      <span>{badge.unlocked ? '100%' : `${badge.progress} / ${badge.progressMax}`}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Quiz Logs */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="font-bold text-slate-900 text-base">
            Recent Quiz Performance History
          </h2>
          <span className="text-xs text-slate-500">Total Attempts: {history.length}</span>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            <p className="text-sm font-medium">No practice quizzes completed yet.</p>
            <p className="text-xs text-slate-400 mt-1">Take a quick quiz to start logging domain accuracy metrics!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            {history.slice(0, 10).map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">{item.title || 'NCLEX Practice Quiz'}</h3>
                  <p className="text-[11px] text-slate-500">
                    {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Recent'} &bull; {item.totalQuestions || 0} Questions
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                    (item.score || 0) >= 80 ? 'bg-emerald-100 text-emerald-800' :
                    (item.score || 0) >= 70 ? 'bg-blue-100 text-blue-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {item.score || 0}% Score
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setShowQuizModal(false)}
              className="absolute top-4 right-4 text-xs font-bold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg hover:bg-slate-100"
            >
              Close ✕
            </button>

            <div className="mb-4">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase">
                Practice Unit Test
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                NCLEX Practice Session: {selectedUnit}
              </h2>
            </div>

            <QuizGeneratorPage initialUnit={selectedUnit} />
          </div>
        </div>
      )}
    </div>
  );
}
