import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BookOpen, CheckCircle, Clock, TrendingUp, BrainCircuit, Activity, Target, Flame, Medal, Award, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function StudentDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Top Stats Row */}
      {[
        { title: 'Questions Answered', value: '1,248', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
        { title: 'Average Score', value: '84.2%', icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { title: 'Study Streak', value: '14 Days', icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50' },
        { title: 'Total XP', value: '2,450', icon: Star, color: 'text-purple-600', bg: 'bg-purple-50' }
      ].map((stat, i) => (
        <div key={i} className="col-span-1 md:col-span-6 lg:col-span-3 bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
          <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
            <stat.icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-tight">{stat.title}</p>
          </div>
        </div>
      ))}

      {/* Main Body Left */}
      <div className="col-span-1 md:col-span-8 flex flex-col gap-6">
        {/* Progress Visualization */}
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Weekly Progress Overview</h3>
            <select className="text-xs bg-slate-50 border-slate-200 border rounded px-2 py-1 outline-none">
              <option>Last 7 Days</option>
            </select>
          </div>
          <div className="flex items-end justify-between h-40 gap-4">
            {[
              { day: 'MON', height: 'h-24', color: 'bg-blue-100' },
              { day: 'TUE', height: 'h-32', color: 'bg-blue-100' },
              { day: 'WED', height: 'h-36', color: 'bg-blue-600', text: 'text-blue-600' },
              { day: 'THU', height: 'h-28', color: 'bg-blue-100' },
              { day: 'FRI', height: 'h-20', color: 'bg-blue-100' },
              { day: 'SAT', height: 'h-12', color: 'bg-blue-100' },
              { day: 'SUN', height: 'h-16', color: 'bg-blue-100' },
            ].map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className={`w-full ${item.color} rounded-t ${item.height} hover:bg-blue-600 transition-colors relative group`}>
                   {i === 0 && <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100">65%</div>}
                </div>
                <span className={`text-[10px] font-bold ${item.text || 'text-slate-400'}`}>{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gamification: Badges & Leaderboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Recent Badges
              </h3>
              <span className="text-xs font-bold text-blue-600 cursor-pointer hover:underline">View All</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { name: 'Pharmacology Master', icon: Medal, color: 'text-purple-500', bg: 'bg-purple-50' },
                { name: '7-Day Streak', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
                { name: 'Top 10%', icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50' }
              ].map((badge, i) => (
                <div key={i} className="flex flex-col items-center p-2 bg-slate-50 rounded-lg border border-slate-100 hover:shadow-sm transition-shadow">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${badge.bg} ${badge.color} mb-2`}>
                    <badge.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 leading-tight">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-500" />
              Leaderboard (NCLEX-RN)
            </h3>
            <div className="flex-1 space-y-3">
              {[
                { rank: 1, name: 'Sarah J.', score: '2,840 XP', me: false },
                { rank: 2, name: 'Mike R.', score: '2,650 XP', me: false },
                { rank: 3, name: 'Jane D.', score: '2,450 XP', me: true },
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

        {/* Recent Exams */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Recent Practice Exams</h3>
            <a href="#" className="text-xs text-blue-600 font-bold uppercase tracking-tight">View All</a>
          </div>
          <div className="p-0 overflow-x-auto">
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
                <tr className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium text-slate-700">Pharmacology Mock #4</td>
                  <td className="px-6 py-4 text-slate-500">NCLEX-RN</td>
                  <td className="px-6 py-4 font-bold text-emerald-600">88%</td>
                  <td className="px-6 py-4"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">Passed</span></td>
                </tr>
                <tr className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium text-slate-700">Pediatrics Comprehensive</td>
                  <td className="px-6 py-4 text-slate-500">HESI A2</td>
                  <td className="px-6 py-4 font-bold text-blue-600">76%</td>
                  <td className="px-6 py-4"><span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">Review</span></td>
                </tr>
                <tr className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium text-slate-700">Medical-Surgical Quiz</td>
                  <td className="px-6 py-4 text-slate-500">TEAS 7</td>
                  <td className="px-6 py-4 font-bold text-orange-600">68%</td>
                  <td className="px-6 py-4"><span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-bold">Failed</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Sidebar Widgets */}
      <div className="col-span-1 md:col-span-4 flex flex-col gap-6">
        {/* Streak & Daily Goal */}
        <div className="bg-gradient-to-br from-orange-500 to-rose-500 p-5 rounded-xl text-white shadow-lg shadow-orange-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Flame className="w-5 h-5" />
              Daily Goal
            </h3>
            <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded">14 Day Streak!</span>
          </div>
          <div className="mb-2 flex justify-between text-sm font-medium">
            <span>Progress (XP)</span>
            <span>150 / 200 XP</span>
          </div>
          <div className="w-full bg-black/20 rounded-full h-2.5 overflow-hidden">
            <div className="bg-white h-2.5 rounded-full" style={{ width: '75%' }}></div>
          </div>
          <p className="text-xs mt-3 opacity-90 text-center">Complete one more quiz to hit your daily goal!</p>
        </div>

        {/* Custom Quiz Generator */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded text-blue-600 flex items-center justify-center font-bold">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800">Quick Quiz Generator</h3>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Category</label>
                <select className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-500">
                  <option>Medical Surgical</option>
                  <option>Pediatrics</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Questions</label>
                <select className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-500">
                  <option>20 Questions</option>
                  <option>50 Questions</option>
                </select>
              </div>
            </div>
            <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 transition-colors text-white rounded-lg font-bold text-sm shadow-md shadow-blue-200">
              Launch Smart Quiz
            </button>
          </div>
        </div>

        {/* Smart Study Assistant */}
        <div className="bg-slate-900 text-white p-5 rounded-xl flex-1 flex flex-col min-h-[250px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2 text-sm">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              Study Assistant Active
            </h3>
            <BrainCircuit className="w-5 h-5 text-slate-400" />
          </div>
          <div className="bg-slate-800 p-3 rounded-lg mb-4 flex-1 border border-slate-700">
            <p className="text-xs text-slate-300 italic leading-relaxed">
              "Based on your recent Pediatrics quiz, you should focus on developmental milestones for toddlers. Would you like me to generate a summary or flashcards?"
            </p>
          </div>
          <div className="relative mt-auto">
            <input 
              type="text" 
              placeholder="Ask a question..." 
              className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none rounded-lg p-3 pr-10 text-xs text-white placeholder:text-slate-500"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300">
              <CheckCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
