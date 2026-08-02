import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Medal, 
  Award, 
  Star, 
  X,
  Lock,
  Shield,
  Zap,
  Check,
  Info
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
    xp: 0
  });
  const [history, setHistory] = useState<any[]>([]);
  const [badgeConfigs, setBadgeConfigs] = useState<BadgeConfig[]>([]);
  const [evaluatedBadges, setEvaluatedBadges] = useState<UserBadgeState[]>([]);
  const [showAllBadgesModal, setShowAllBadgesModal] = useState<boolean>(false);
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  // Quick Quiz Generator Widget State
  const [selectedUnit, setSelectedUnit] = useState<string>('All');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [showQuizModal, setShowQuizModal] = useState<boolean>(false);

  const fetchUserData = async () => {
    try {
      // 1. Load Badge configurations from Firestore / local storage
      const configs = await fetchBadgeConfigs();
      setBadgeConfigs(configs);

      if (!auth.currentUser) return;

      const historyRef = collection(db, 'examHistory');
      const q = query(historyRef, where('user', '==', auth.currentUser.email));
      const querySnapshot = await getDocs(q);
      
      const data = querySnapshot.docs.map(doc => doc.data());
      setHistory(data);
      
      // Calculate real streak from user history
      const { streak: realStreak, totalQuestions, maxScore } = calculateUserStreak(data);
      
      const questionsCount = data.reduce((acc, curr) => acc + (curr.totalQuestions || 0), 0);
      const avgScore = data.length > 0 ? Math.round(data.reduce((acc, curr) => acc + (curr.score || 0), 0) / data.length) : 0;
      const userXp = questionsCount * 10 + data.length * 50;

      const updatedStats = {
        questionsAnswered: questionsCount,
        averageScore: avgScore,
        streak: realStreak,
        xp: userXp
      };

      setStats(updatedStats);

      // Evaluate badges dynamically
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
    const avgScore = matchingExams.length > 0
      ? Math.round(matchingExams.reduce((acc, curr) => acc + (curr.score || 0), 0) / matchingExams.length)
      : 0;

    return {
      dateKey,
      dayLabel,
      isToday,
      totalQuestions,
      avgScore,
      count: matchingExams.length,
    };
  });

  const maxQuestionsInWeek = Math.max(...weeklyBarData.map(d => d.totalQuestions), 10);

  const filteredBadgesModalList = evaluatedBadges.filter(b => {
    if (badgeFilter === 'unlocked') return b.unlocked;
    if (badgeFilter === 'locked') return !b.unlocked;
    return true;
  });

  const unlockedCount = evaluatedBadges.filter(b => b.unlocked).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Top Stats Row */}
      {[
        { title: 'Questions Answered', value: stats.questionsAnswered.toString(), icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
        { title: 'Average Score', value: `${stats.averageScore}%`, icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { title: 'Study Streak', value: `${stats.streak} Days`, icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50' },
        { title: 'Total XP', value: stats.xp.toString(), icon: Star, color: 'text-purple-600', bg: 'bg-purple-50' }
      ].map((stat, i) => (
        <div key={i} className="col-span-1 md:col-span-6 lg:col-span-3 bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 shadow-xs">
          <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
            <stat.icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-tight">{stat.title}</p>
          </div>
        </div>
      ))}

      {/* Main Body Left */}
      <div className="col-span-1 md:col-span-8 flex flex-col gap-6">
        {/* Progress Visualization Graph */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Weekly Progress Overview
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Practice activity & accuracy score over the past 7 days.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                Current Day: <strong className="font-bold">{daysOfWeekShort[now.getDay()]}</strong>
              </span>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="pt-4 flex items-end justify-between h-48 gap-3 sm:gap-4 px-2">
            {weeklyBarData.map((item, i) => {
              const heightPercent = item.totalQuestions > 0
                ? Math.max(25, Math.min(100, Math.round((item.totalQuestions / maxQuestionsInWeek) * 100)))
                : 15;

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
                  {/* Hover Tooltip */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none whitespace-nowrap shadow-md">
                    <p className="font-bold">{item.dayLabel} ({item.dateKey})</p>
                    <p className="text-blue-300">{item.totalQuestions} Questions &bull; {item.avgScore}% Acc</p>
                  </div>

                  {/* Today Pill Flag */}
                  {item.isToday && (
                    <span className="text-[9px] font-extrabold bg-blue-600 text-white px-1.5 py-0.5 rounded-full shadow-xs uppercase tracking-tighter shrink-0 animate-pulse">
                      TODAY
                    </span>
                  )}

                  {/* Visual Bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-lg transition-all duration-300 relative ${
                      item.isToday
                        ? 'bg-gradient-to-t from-blue-600 via-blue-500 to-indigo-600 border-2 border-blue-400 shadow-md shadow-blue-200'
                        : item.totalQuestions > 0
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : 'bg-slate-100 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {item.totalQuestions > 0 && (
                      <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white drop-shadow-xs">
                        {item.totalQuestions}
                      </span>
                    )}
                  </div>

                  {/* Day Label */}
                  <div className="text-center">
                    <span
                      className={`text-[11px] font-bold block ${
                        item.isToday ? 'text-blue-700 font-extrabold scale-105' : 'text-slate-500'
                      }`}
                    >
                      {item.dayLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gamification: Dynamic Badges & Leaderboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Recent Badges ({unlockedCount} Unlocked)
                </h3>
                <button
                  onClick={() => setShowAllBadgesModal(true)}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  View All
                </button>
              </div>

              {/* Display Unlocked & Streak Badges */}
              <div className="grid grid-cols-3 gap-3 text-center">
                {evaluatedBadges.slice(0, 3).map((badgeItem, i) => {
                  const IconComponent = ICON_MAP[badgeItem.icon] || Award;
                  return (
                    <div
                      key={i}
                      onClick={() => setShowAllBadgesModal(true)}
                      className={`flex flex-col items-center p-2.5 rounded-xl border cursor-pointer transition-all relative ${
                        badgeItem.unlocked
                          ? `${badgeItem.bg} border-slate-200 hover:shadow-sm`
                          : 'bg-slate-50 border-slate-200 opacity-60 grayscale hover:grayscale-0'
                      }`}
                    >
                      {badgeItem.unlocked ? (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      ) : (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center">
                          <Lock className="w-2.5 h-2.5" />
                        </div>
                      )}

                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${badgeItem.bg} ${badgeItem.color} mb-1.5`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      
                      <span className="text-[10px] font-bold text-slate-800 leading-tight line-clamp-1">
                        {badgeItem.name}
                      </span>
                      
                      <span className="text-[9px] text-slate-500 font-semibold mt-0.5">
                        {badgeItem.unlocked ? (
                          <span className="text-emerald-700 font-bold">Unlocked</span>
                        ) : (
                          `${badgeItem.progress}/${badgeItem.progressMax}`
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <Flame className="w-4 h-4 text-orange-500" />
                Current Streak: <strong className="text-slate-900 font-bold">{stats.streak} Days</strong>
              </span>
              <button
                onClick={() => setShowAllBadgesModal(true)}
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                Streak Badges &rarr;
              </button>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-500" />
              Leaderboard (NCLEX-RN)
            </h3>
            <div className="flex-1 space-y-3">
              {[
                { rank: 1, name: 'Sarah J.', score: '2,840 XP', me: false },
                { rank: 2, name: 'Mike R.', score: '2,650 XP', me: false },
                { rank: 3, name: auth.currentUser?.displayName || (auth.currentUser?.email ? auth.currentUser.email.split('@')[0] : 'You'), score: `${stats.xp > 0 ? stats.xp : 2450} XP`, me: true },
                { rank: 4, name: 'Emily C.', score: '2,100 XP', me: false },
              ].map((user, i) => (
                <div key={i} className={`flex items-center justify-between p-2 rounded-lg ${user.me ? 'bg-blue-50 border border-blue-100' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                      user.rank === 1 ? 'bg-amber-100 text-amber-700' :
                      user.rank === 2 ? 'bg-slate-200 text-slate-700' :
                      user.rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {user.rank}
                    </span>
                    <span className={`text-sm font-medium ${user.me ? 'text-blue-900 font-bold' : 'text-slate-700'}`}>
                      {user.name} {user.me && '(You)'}
                    </span>
                  </div>
                  <span className={`text-xs font-bold ${user.me ? 'text-blue-700' : 'text-slate-500'}`}>{user.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Exams Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Recent Practice Exams</h3>
            <a href="#" className="text-xs text-blue-600 font-bold uppercase tracking-tight">View All</a>
          </div>
          <div className="p-0 overflow-x-auto">
            {history.length > 0 ? (
              <table className="w-full text-left min-w-[500px]">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-3">Exam Title</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Score</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {history.map((exam, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-medium text-slate-700">{exam.title || 'Practice Quiz Session'}</td>
                      <td className="px-6 py-4 text-slate-500">{exam.category || 'General'}</td>
                      <td className="px-6 py-4 font-bold text-emerald-600">{exam.score || 0}%</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          (exam.score || 0) >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {(exam.score || 0) >= 80 ? 'Passed' : 'Needs Review'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p>No exams taken yet. Start practicing to see your history here.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar Widgets */}
      <div className="col-span-1 md:col-span-4 flex flex-col gap-6">
        {/* Streak & Daily Goal */}
        <div className="bg-gradient-to-br from-orange-500 to-rose-500 p-5 rounded-xl text-white shadow-lg shadow-orange-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Flame className="w-5 h-5 text-yellow-300" />
              Daily Goal & Streak
            </h3>
            <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded">{stats.streak} Day Streak!</span>
          </div>
          <div className="mb-2 flex justify-between text-sm font-medium">
            <span>Progress (XP)</span>
            <span>{stats.xp} / {(Math.floor(stats.xp / 200) + 1) * 200} XP</span>
          </div>
          <div className="w-full bg-black/20 rounded-full h-2.5 overflow-hidden">
            <div className="bg-white h-2.5 rounded-full" style={{ width: `${(stats.xp % 200) / 200 * 100}%` }}></div>
          </div>
          <p className="text-xs mt-3 opacity-90 text-center">
            Complete a practice quiz today to preserve your <strong>{stats.streak}-day streak</strong>!
          </p>
        </div>

        {/* Custom Quiz Generator */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded text-blue-600 flex items-center justify-center font-bold">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800">Quick Quiz Generator</h3>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Unit / Specialty</label>
                <select 
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                >
                  <option value="All">All Units ({NURSING_UNITS.length})</option>
                  {NURSING_UNITS.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Questions</label>
                <select 
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                >
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions</option>
                  <option value={20}>20 Questions</option>
                </select>
              </div>
            </div>
            <button 
              onClick={() => setShowQuizModal(true)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 transition-colors text-white rounded-lg font-bold text-sm shadow-md shadow-blue-200 flex items-center justify-center gap-2"
            >
              Launch Smart Quiz
            </button>
          </div>
        </div>

        {/* Modal Overlay for Quick Quiz Generator */}
        {showQuizModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-2 relative shadow-2xl">
              <QuizGeneratorPage 
                embeddedModal={true}
                initialUnit={selectedUnit}
                initialQuestionCount={questionCount}
                onCloseModal={() => {
                  setShowQuizModal(false);
                  fetchUserData();
                }}
              />
            </div>
          </div>
        )}

        {/* Modal Overlay for All Badges View */}
        {showAllBadgesModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    Student Achievement Badges Catalog
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Unlocked: {unlockedCount} of {evaluatedBadges.length} Total Badges
                  </p>
                </div>
                <button
                  onClick={() => setShowAllBadgesModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 bg-white">
                {(['all', 'unlocked', 'locked'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setBadgeFilter(filter)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                      badgeFilter === filter
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {filter === 'all' && `All Badges (${evaluatedBadges.length})`}
                    {filter === 'unlocked' && `Unlocked (${unlockedCount})`}
                    {filter === 'locked' && `Locked (${evaluatedBadges.length - unlockedCount})`}
                  </button>
                ))}
              </div>

              {/* Badges List */}
              <div className="p-5 overflow-y-auto space-y-3 flex-1">
                {filteredBadgesModalList.map((badge, idx) => {
                  const IconComp = ICON_MAP[badge.icon] || Award;
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-all ${
                        badge.unlocked
                          ? `${badge.bg} border-slate-200 shadow-xs`
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${badge.bg} ${badge.color}`}>
                          <IconComp className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">{badge.name}</h4>
                            {badge.unlocked && (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Check className="w-3 h-3" /> Unlocked
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">{badge.description}</p>
                          
                          {/* Progress bar for locked badges */}
                          {!badge.unlocked && (
                            <div className="mt-2 space-y-1 max-w-xs">
                              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                <span>Progress</span>
                                <span>{badge.progress} / {badge.progressMax}</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-blue-600 h-1.5 rounded-full"
                                  style={{ width: `${Math.round((badge.progress / badge.progressMax) * 100)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Smart Study Assistant Component */}
        <StudyAssistant 
          mode="compact" 
          initialUnit={selectedUnit} 
          onExpand={() => navigate('/dashboard/assistant')} 
        />
      </div>
    </div>
  );
}
