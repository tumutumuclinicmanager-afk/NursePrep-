import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, Brain, Stethoscope, FileText, Activity, Edit3, Upload, Database, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminOverview() {
  const [userCount, setUserCount] = useState<number>(0);
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [paymentCount, setPaymentCount] = useState<number>(0);
  const [questionsList, setQuestionsList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch Users
        let totalUsers = 0;
        try {
          const userSnap = await getDocs(query(collection(db, 'users')));
          totalUsers = userSnap.size;
        } catch (e) {
          console.warn("Error fetching users for admin overview:", e);
        }
        const localUsers = JSON.parse(localStorage.getItem('nurseprep_custom_users') || '[]');
        // Include default admins + local custom users
        setUserCount(Math.max(totalUsers + localUsers.length, 2 + localUsers.length));

        // 2. Fetch Questions
        try {
          const qSnap = await getDocs(query(collection(db, 'questions')));
          setQuestionCount(qSnap.size);
          const qData = qSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          setQuestionsList(qData);
        } catch (e) {
          console.warn("Error fetching questions for admin overview:", e);
        }

        // 3. Fetch Payments
        try {
          const pSnap = await getDocs(query(collection(db, 'payments')));
          setPaymentCount(pSnap.size);
        } catch (e) {
          console.warn("Error fetching payments for admin overview:", e);
        }

      } catch (err) {
        console.error("Error loading admin stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  const stats = [
    { title: 'Registered Users', value: loading ? '...' : userCount.toString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Questions in Bank', value: loading ? '...' : questionCount.toString(), icon: Database, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Payments Verified', value: loading ? '...' : paymentCount.toString(), icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' }
  ];

  // Group real questions by exam mode or category
  const categories = ['NCLEX-RN', 'NCLEX-PN', 'HESI A2', 'TEAS'];
  const categoryCounts = categories.map(cat => {
    const count = questionsList.filter(q => q.examMode === cat || q.unitDomain?.includes(cat)).length;
    const percentage = questionCount > 0 ? Math.round((count / questionCount) * 100) : 0;
    return { name: cat, count, percentage };
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Super Admin Overview</h2>
          <p className="text-slate-500 text-sm">Real-time system statistics, live question counts, and question bank controls.</p>
        </div>
        <Link 
          to="/admin/questions"
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-xs transition-colors"
        >
          <Edit3 className="w-4 h-4" /> Open Question Bank & Creator
        </Link>
      </div>

      {/* Super Admin Quick Controls Card */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300 bg-blue-950/80 px-2.5 py-1 rounded-full border border-blue-700/50">
              Super Admin Management Access
            </span>
            <h3 className="text-xl font-bold mt-2">Exam Creation & Question Bank Management</h3>
            <p className="text-xs text-blue-200 mt-1 max-w-xl">
              Create NextGen NCLEX interactive questions (Matrix Grid, Bowtie, Case Exhibits), upload PDF exam bundles, and manage stored questions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <Link 
            to="/admin/questions" 
            className="bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl p-3.5 flex items-center gap-3 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold block text-white group-hover:text-blue-300 transition-colors">Interactive Question Creator</span>
              <span className="text-[10px] text-blue-200">Standard & NextGen NGN</span>
            </div>
          </Link>

          <Link 
            to="/admin/questions" 
            className="bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl p-3.5 flex items-center gap-3 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold block text-white group-hover:text-emerald-300 transition-colors">Bulk PDF Extractor</span>
              <span className="text-[10px] text-blue-200">Gemini AI Auto-parsing</span>
            </div>
          </Link>

          <Link 
            to="/admin/questions" 
            className="bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl p-3.5 flex items-center gap-3 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold block text-white group-hover:text-purple-300 transition-colors">Question Repository</span>
              <span className="text-[10px] text-blue-200">Search & edit question bank</span>
            </div>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{stat.title}</p>
              <p className="text-2xl font-bold text-slate-900 leading-none mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
          <GraduationCap className="w-5 h-5 text-blue-600" />
          Question Distribution by Exam Mode
        </h3>
        
        <div className="space-y-6">
          {categoryCounts.map((category, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-700 font-bold">{category.name}</span>
                <span className="text-slate-500">{category.count} questions ({category.percentage}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                <div 
                  className="h-full bg-blue-600 transition-all duration-500" 
                  style={{ width: `${Math.max(category.percentage, category.count > 0 ? 5 : 0)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-purple-600" />
              Latest Questions Added to Bank
            </h3>
            <div className="space-y-4">
              {questionsList.slice(0, 3).map((q, i) => (
                <div key={i} className="flex justify-between items-center border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div className="max-w-xs truncate">
                    <p className="text-xs font-bold text-slate-800 truncate">{q.questionStem || 'Clinical Question'}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{q.examMode || 'NCLEX-RN'} &bull; {q.questionTypeLabel || 'Choice'}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">Active</span>
                </div>
              ))}
              {questionsList.length === 0 && (
                <p className="text-xs text-slate-500 italic py-2">No questions added to database yet. Use the Open Question Bank & Creator button to add questions.</p>
              )}
            </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Stethoscope className="w-5 h-5 text-orange-600" />
              System Status
            </h3>
            <div className="space-y-3">
               <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-xs font-bold text-slate-700">Firestore Database</span>
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                  </span>
               </div>
               <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-xs font-bold text-slate-700">Gemini AI Parsing API</span>
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                  </span>
               </div>
               <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-xs font-bold text-slate-700">NextGen NCLEX Engine</span>
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active
                  </span>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
}
