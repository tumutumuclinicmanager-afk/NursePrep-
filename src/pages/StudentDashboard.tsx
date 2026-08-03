import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  BrainCircuit, 
  Activity, 
  Target, 
  Flame, 
  Award, 
  Star, 
  X,
  Zap,
  CheckCircle2, 
  ChevronRight, 
  ShieldCheck,
  BarChart2,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { NURSING_UNITS } from '@/data/quizQuestions';
import QuizGeneratorPage from './QuizGeneratorPage';
import { StudyAssistant } from '@/components/StudyAssistant';
import { 
  fetchBadgeConfigs, 
  calculateUserStreak, 
  evaluateUserBadges, 
  BadgeConfig, 
  UserBadgeState, 
  ICON_MAP 
} from '@/lib/badges';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    questionsAnswered: 0,
    averageScore: 0,
    streak: 0,
    xp: 0,
    overallMastery: 0
  });
  const [history, setHistory] = useState<any[]>([]);
  const [evaluatedBadges, setEvaluatedBadges] = useState<UserBadgeState[]>([]);

  // Quick Quiz Generator Widget State
  const [selectedUnit, setSelectedUnit] = useState<string>('All');
  const [showQuizModal, setShowQuizModal] = useState<boolean>(false);

  const fetchUserData = async () => {
    try {
      const configs = await fetchBadgeConfigs();

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

      // Compute overall mastery
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

      const evaluated = evaluateUserBadges(configs, updatedStats, data);
      setEvaluatedBadges(evaluated);

    } catch (error) {
      console.error("Error fetching user data", error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Compute Weekly Progress bar chart data (7 Days ending Today)
  const now = new Date();
  const daysOfWeekShort = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  
  const weeklyBarData = Array.from({ length: 7 }, (_, index) => {
    const dayOffset = 6 - index;
    const d = new Date(now);
    d.setDate(now.getDate() - dayOffset);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${dayNum}`;
    const dayLabel = daysOfWeekShort[d.getDay()];
    const isToday = dayOffset === 0;

    const matchingExams = history.filter((item) => {
      let dateObj: Date | null = null;
      if (item.timestamp) dateObj = new Date(item.timestamp);
      else if (item.createdAt) dateObj = new Date(item.createdAt);
      else if (item.date) dateObj = new Date(item.date);

      if (dateObj && !isNaN(dateObj.getTime())) {
        const itemKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        return itemKey === dateKey;
      }
      return false;
    });

    const totalQuestions = matchingExams.reduce((acc, curr) => acc + (curr.totalQuestions || 0), 0);

    return {
      dateKey,
      dayLabel,
      isToday,
      totalQuestions,
      count: matchingExams.length,
    };
  });

  const maxQuestionsInWeek = Math.max(...weeklyBarData.map(d => d.totalQuestions), 10);
  const unlockedBadgesCount = evaluatedBadges.filter(b => b.unlocked).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-300 text-xs font-bold px-3 py-1 rounded-full border border-blue-400/20">
                NCLEX-RN Exam Prep Portal
              </span>
              <span className="text-xs text-slate-300 flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-400 fill-orange-400" /> {stats.streak} Day Study Streak
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back to your NCLEX Command Center
            </h1>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Complete practice questions, generate custom study quizzes, and review your dedicated unit-by-unit performance metrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => { setSelectedUnit('All'); setShowQuizModal(true); }}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2"
            >
              <Zap className="w-4 h-4 fill-white" />
              Quick Quiz
            </Button>
            <Button
              onClick={() => navigate('/dashboard/performance')}
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/20 flex items-center gap-2"
            >
              <BarChart2 className="w-4 h-4 text-blue-300" />
              View Performance
            </Button>
          </div>
        </div>
      </div>

      {/* Top Summary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Questions Attempted', value: stats.questionsAnswered.toString(), subtitle: 'Across All Exams', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: 'Average Score', value: `${stats.averageScore}%`, subtitle: 'Overall Accuracy', icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { title: 'Badges Attained', value: `${unlockedBadgesCount} / ${evaluatedBadges.length}`, subtitle: 'Achievements Earned', icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
          { title: 'Study Streak', value: `${stats.streak} Days`, subtitle: `${stats.xp} XP Accumulated`, icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4.5 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-xs hover:border-blue-200 transition-colors">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
              <p className="text-[11px] font-bold text-slate-800 uppercase tracking-tight">{stat.title}</p>
              <p className="text-[10px] text-slate-500 font-medium">{stat.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Dedicated Performance Teaser Banner (Points to Performance Page) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:border-blue-300 transition-all">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-slate-900 text-base">Unit Performance & Mastery Metrics</h2>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Detailed View Available
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
              Track your exact questions attempted per unit, domain mastery percentages across all 8 NCLEX categories, and unlocked study badges on your dedicated Performance Page.
            </p>
          </div>
        </div>

        <Button
          onClick={() => navigate('/dashboard/performance')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shrink-0 shadow-xs flex items-center gap-2"
        >
          <span>Open Performance Page</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Main Grid: Weekly Activity Chart & Recent Quiz Log */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Weekly Activity Progress */}
        <div className="col-span-1 md:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                7-Day Practice Velocity
              </h3>
              <p className="text-xs text-slate-500">Questions attempted daily over the past week.</p>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
              {weeklyBarData.reduce((a, b) => a + b.totalQuestions, 0)} Total This Week
            </span>
          </div>

          <div className="h-44 flex items-end justify-between gap-2 pt-4">
            {weeklyBarData.map((d, idx) => {
              const heightPercent = d.totalQuestions > 0 
                ? Math.max(15, Math.round((d.totalQuestions / maxQuestionsInWeek) * 100)) 
                : 6;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[10px] font-bold text-slate-600">
                    {d.totalQuestions > 0 ? d.totalQuestions : ''}
                  </span>
                  <div className="w-full bg-slate-100 rounded-t-lg h-32 flex items-end overflow-hidden p-1">
                    <div 
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        d.isToday 
                          ? 'bg-blue-600 shadow-xs' 
                          : d.totalQuestions > 0 ? 'bg-indigo-400' : 'bg-slate-200'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-bold ${d.isToday ? 'text-blue-700' : 'text-slate-500'}`}>
                    {d.dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Recent Quiz Activity */}
        <div className="col-span-1 md:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Recent Practice Quizzes
            </h3>
            <button 
              onClick={() => navigate('/dashboard/exams')}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              All Exams &rarr;
            </button>
          </div>

          {history.length === 0 ? (
            <div className="py-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-xs font-medium">No quiz attempts recorded yet.</p>
              <Button
                onClick={() => { setSelectedUnit('All'); setShowQuizModal(true); }}
                className="mt-3 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg"
              >
                Start First Quiz
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {history.slice(0, 4).map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs line-clamp-1">{item.title || 'NCLEX Practice Quiz'}</h4>
                      <p className="text-[10px] text-slate-500">{item.totalQuestions || 0} Questions</p>
                    </div>
                  </div>

                  <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full shrink-0 ${
                    (item.score || 0) >= 80 ? 'bg-emerald-100 text-emerald-800' :
                    (item.score || 0) >= 70 ? 'bg-blue-100 text-blue-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {item.score || 0}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Clinical Study Assistant Quick Launcher Banner */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white shadow-md">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Need Clinical Rationale & Saunders Study Mentoring?</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Access clinical study assistant for memory mnemonics, NCLEX pharmacology breakdowns, and Saunders flashcards.
            </p>
          </div>
        </div>

        <Button
          onClick={() => navigate('/dashboard/assistant')}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shrink-0 shadow-xs"
        >
          Launch Study Assistant
        </Button>
      </div>

      {/* Quick Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setShowQuizModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase">
                Quick Quiz Launcher
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                NCLEX Practice Session
              </h2>
            </div>

            <QuizGeneratorPage initialUnit={selectedUnit} />
          </div>
        </div>
      )}
    </div>
  );
}
