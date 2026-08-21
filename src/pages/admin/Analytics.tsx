import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, PieChart as PieChartIcon, Activity, Download, ShieldCheck, 
  Users, Crown, Zap, CheckCircle2, TrendingUp, DollarSign, 
  BookOpen, Brain, RefreshCw, Search, ArrowUpRight,
  Sparkles, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, 
  Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';

type DateRange = '7d' | '30d' | '90d' | 'ytd' | 'all';
type TabType = 'overview' | 'revenue' | 'learning' | 'questions';

export default function Analytics() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [payments, setPayments] = useState<any[]>([]);
  const [usersCount, setUsersCount] = useState<number>(0);
  const [questionsCount, setQuestionsCount] = useState<number>(0);
  const [questionsList, setQuestionsList] = useState<any[]>([]);
  const [examHistoryList, setExamHistoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [searchTxQuery, setSearchTxQuery] = useState<string>('');
  const [txStatusFilter, setTxStatusFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const fetchAllAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Real Payments
      try {
        const pSnap = await getDocs(query(collection(db, 'payments')));
        const pList = pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPayments(pList);
      } catch (e) {
        console.warn("Error fetching payments for analytics:", e);
      }

      // 2. Fetch Users
      try {
        const uSnap = await getDocs(query(collection(db, 'users')));
        const localUsers = JSON.parse(localStorage.getItem('nurseprep_custom_users') || '[]');
        setUsersCount(uSnap.size + localUsers.length);
      } catch (e) {
        console.warn("Error fetching users for analytics:", e);
        setUsersCount(0);
      }

      // 3. Fetch Stored Questions
      try {
        const qSnap = await getDocs(query(collection(db, 'questions')));
        setQuestionsCount(qSnap.size);
        setQuestionsList(qSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.warn("Error fetching questions for analytics:", e);
      }

      // 4. Fetch Exam History / Submissions
      try {
        const hSnap = await getDocs(query(collection(db, 'examHistory')));
        setExamHistoryList(hSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.warn("Error fetching exam history for analytics:", e);
      }

      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAnalyticsData();
  }, []);

  // Helper to extract numeric amount from a payment
  const getPaymentAmount = (p: any): number => {
    if (p.amountKes !== undefined && p.amountKes !== null) {
      const num = Number(p.amountKes);
      if (!isNaN(num)) return num;
    }
    if (p.amount !== undefined && p.amount !== null) {
      const num = typeof p.amount === 'number' ? p.amount : parseFloat(String(p.amount).replace(/[^0-9.]/g, ''));
      if (!isNaN(num)) return num;
    }
    if (p.amountUsd !== undefined && p.amountUsd !== null) {
      const num = Number(p.amountUsd);
      if (!isNaN(num)) return num * 130;
    }
    return 0;
  };

  // Helper to extract timestamp date from a payment
  const getPaymentDate = (p: any): Date => {
    if (p.createdAt) {
      const d = new Date(p.createdAt);
      if (!isNaN(d.getTime())) return d;
    }
    if (p.date) {
      const d = new Date(p.date);
      if (!isNaN(d.getTime())) return d;
    }
    if (p.timestamp) {
      const d = new Date(p.timestamp);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  };

  // Filtered payments by status
  const approvedPayments = useMemo(() => {
    return payments.filter(p => {
      const s = (p.status || '').toLowerCase();
      return s === 'approved' || s === 'completed';
    });
  }, [payments]);

  // Total Verified Revenue calculation (100% real Firestore payments)
  const totalVerifiedRevenue = useMemo(() => {
    return approvedPayments.reduce((acc, p) => {
      return acc + getPaymentAmount(p);
    }, 0);
  }, [approvedPayments]);

  const goldCount = useMemo(() => {
    return approvedPayments.filter(p => {
      const planStr = (p.plan || p.planName || p.planId || '').toLowerCase();
      return planStr.includes('gold') || planStr.includes('standard');
    }).length;
  }, [approvedPayments]);

  const premierCount = useMemo(() => {
    return approvedPayments.filter(p => {
      const planStr = (p.plan || p.planName || p.planId || '').toLowerCase();
      return planStr.includes('premier') || planStr.includes('pro') || planStr.includes('institution');
    }).length;
  }, [approvedPayments]);

  const freeCount = useMemo(() => {
    return Math.max(0, usersCount - goldCount - premierCount);
  }, [usersCount, goldCount, premierCount]);

  // Dynamic Chart Data computed strictly from real approved payments
  const revenueTrendData = useMemo(() => {
    const now = new Date();

    if (dateRange === '7d') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        const dayName = days[d.getDay()];
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const dayEnd = dayStart + 86400000;

        const dayPayments = approvedPayments.filter(p => {
          const pTime = getPaymentDate(p).getTime();
          return pTime >= dayStart && pTime < dayEnd;
        });

        const rev = dayPayments.reduce((sum, p) => sum + getPaymentAmount(p), 0);
        return {
          date: dayName,
          revenue: rev,
          subscribers: dayPayments.length,
          target: rev > 0 ? Math.round(rev * 1.1) : 0
        };
      });
    }

    if (dateRange === '90d') {
      return Array.from({ length: 6 }, (_, i) => {
        const chunkDays = 15;
        const endDayOffset = (5 - i) * chunkDays;
        const startDayOffset = (6 - i) * chunkDays;
        const tStart = now.getTime() - startDayOffset * 86400000;
        const tEnd = now.getTime() - endDayOffset * 86400000;

        const chunkPayments = approvedPayments.filter(p => {
          const pTime = getPaymentDate(p).getTime();
          return pTime >= tStart && pTime <= tEnd;
        });

        const rev = chunkPayments.reduce((sum, p) => sum + getPaymentAmount(p), 0);
        return {
          date: `Wk ${i * 2 + 1}-${i * 2 + 2}`,
          revenue: rev,
          subscribers: chunkPayments.length,
          target: rev > 0 ? Math.round(rev * 1.1) : 0
        };
      });
    }

    // Default 30d: 6 buckets of 5-day spans
    return Array.from({ length: 6 }, (_, i) => {
      const chunkDays = 5;
      const endDayOffset = (5 - i) * chunkDays;
      const startDayOffset = (6 - i) * chunkDays;
      const tStart = now.getTime() - startDayOffset * 86400000;
      const tEnd = now.getTime() - endDayOffset * 86400000;

      const chunkPayments = approvedPayments.filter(p => {
        const pTime = getPaymentDate(p).getTime();
        return pTime >= tStart && pTime <= tEnd;
      });

      const rev = chunkPayments.reduce((sum, p) => sum + getPaymentAmount(p), 0);
      return {
        date: `Day ${i * 5 + 1}-${(i + 1) * 5}`,
        revenue: rev,
        subscribers: chunkPayments.length,
        target: rev > 0 ? Math.round(rev * 1.1) : 0
      };
    });
  }, [dateRange, approvedPayments]);

  const examCategoryPerformance = useMemo(() => {
    const categories = ['NCLEX-RN', 'NCLEX-PN', 'ATI TEAS', 'HESI A2', 'NCK Kenya'];
    return categories.map(catName => {
      const attempts = examHistoryList.filter(h => 
        h.examMode === catName || 
        h.category === catName || 
        (catName === 'NCLEX-RN' && (!h.examMode && !h.category))
      );
      const count = attempts.length;
      const avgScore = count > 0 ? Math.round(attempts.reduce((acc, h) => acc + (h.score || 0), 0) / count) : 0;
      const passed = attempts.filter(h => (h.score || 0) >= 75).length;
      const passRate = count > 0 ? Math.round((passed / count) * 100) : 0;
      return { name: catName, attempts: count, passRate, avgScore };
    });
  }, [examHistoryList]);

  const clinicalUnitMastery = useMemo(() => {
    const units = [
      'Pharmacology & Parenteral Therapies',
      'Medical-Surgical Nursing',
      'Pediatric Nursing',
      'Maternal & Newborn Health',
      'Psychiatric & Mental Health',
      'Nursing Fundamentals & Leadership',
      'Critical Care & Emergency Nursing',
    ];

    return units.map(unit => {
      let totalQuestions = 0;
      let totalCorrect = 0;

      examHistoryList.forEach(h => {
        if (h.unitBreakdown && h.unitBreakdown[unit]) {
          totalQuestions += h.unitBreakdown[unit].total || 0;
          totalCorrect += h.unitBreakdown[unit].correct || 0;
        } else if (h.category === unit) {
          const tot = h.totalQuestions || 0;
          const corr = h.correctQuestions ?? Math.round(((h.score || 0) / 100) * tot);
          totalQuestions += tot;
          totalCorrect += corr;
        }
      });

      const score = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
      const errorRate = totalQuestions > 0 ? 100 - score : 0;
      return { unit, score, questions: totalQuestions, errorRate };
    });
  }, [examHistoryList]);

  const planShareData = [
    { name: 'Free Tier', value: freeCount, color: '#94a3b8' },
    { name: 'Gold Plan', value: goldCount, color: '#f59e0b' },
    { name: 'Premier Plan', value: premierCount, color: '#8b5cf6' },
  ];

  // Dynamic distribution of questions by exam mode
  const questionModeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    questionsList.forEach(q => {
      const mode = q.examMode || 'NCLEX-RN';
      counts[mode] = (counts[mode] || 0) + 1;
    });
    if (Object.keys(counts).length === 0) {
      return [
        { mode: 'NCLEX-RN', count: 0 },
        { mode: 'NCLEX-PN', count: 0 },
        { mode: 'ATI TEAS & HESI A2', count: 0 },
        { mode: 'NCK Nursing Council', count: 0 },
      ];
    }
    return Object.entries(counts).map(([mode, count]) => ({ mode, count }));
  }, [questionsList]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return payments.filter(p => {
      const matchesSearch = 
        (p.name || '').toLowerCase().includes(searchTxQuery.toLowerCase()) ||
        (p.mpesaRef || p.receiptNumber || '').toLowerCase().includes(searchTxQuery.toLowerCase()) ||
        (p.phone || p.mpesaPhone || '').includes(searchTxQuery) ||
        (p.plan || p.planName || '').toLowerCase().includes(searchTxQuery.toLowerCase()) ||
        (p.user || '').toLowerCase().includes(searchTxQuery.toLowerCase());
      
      const matchesStatus = 
        txStatusFilter === 'all' || 
        (p.status || '').toLowerCase() === txStatusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [payments, searchTxQuery, txStatusFilter]);

  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const headers = ['Transaction ID', 'Student Name', 'Email', 'Phone', 'Plan', 'Amount (KSh)', 'M-Pesa Reference', 'Status', 'Timestamp'];
      const rows = payments.map(p => [
        p.id || '',
        `"${(p.name || 'Student').replace(/"/g, '""')}"`,
        p.user || p.email || 'N/A',
        p.phone || p.mpesaPhone || 'N/A',
        p.plan || p.planName || 'Standard Plan',
        getPaymentAmount(p).toString(),
        p.mpesaRef || p.receiptNumber || 'N/A',
        p.status || 'Approved',
        p.createdAt || p.date || new Date().toISOString()
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `NursePrep_SuperAdmin_Financial_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setTimeout(() => setIsExporting(false), 600);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Range Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-600" /> Super Admin Intelligence
            </span>
            <span className="text-xs text-slate-400">&bull; Live Sync: {lastRefreshed || 'Just now'}</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">System & Financial Analytics</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Verified revenue cashflow, exam completion volume, and M-Pesa transaction auditing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(['7d', '30d', '90d', 'ytd', 'all'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  dateRange === range
                    ? 'bg-white text-blue-700 shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range === '7d' ? '7D' : range === '30d' ? '30D' : range === '90d' ? '90D' : range === 'ytd' ? 'YTD' : 'All'}
              </button>
            ))}
          </div>

          <Button
            onClick={fetchAllAnalyticsData}
            disabled={loading}
            variant="outline"
            className="text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 border-slate-200 hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-600'}`} />
            <span>Refresh</span>
          </Button>

          <Button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Export Audit CSV'}</span>
          </Button>
        </div>
      </div>

      {/* Analytics Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'overview', label: 'Executive Overview', icon: Activity },
          { id: 'revenue', label: 'Revenue & M-Pesa Subscriptions', icon: DollarSign },
          { id: 'learning', label: 'Clinical Domain Mastery', icon: Brain },
          { id: 'questions', label: 'Question Bank Matrix', icon: BookOpen },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Top Level Dynamic Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              <ArrowUpRight className="w-3.5 h-3.5" /> Verified
            </span>
          </div>
          <div className="mt-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gross Verified Revenue</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">
              KSh {totalVerifiedRevenue.toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              <span className="font-semibold text-emerald-700">{approvedPayments.length}</span> approved payments
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              <Users className="w-3.5 h-3.5" /> Registered
            </span>
          </div>
          <div className="mt-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Nursing Students</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">
              {usersCount.toLocaleString()} Learners
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              <span className="font-semibold text-amber-600">{goldCount + premierCount}</span> on Premium Plans
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
              <Sparkles className="w-3.5 h-3.5" /> Live
            </span>
          </div>
          <div className="mt-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Question Bank Repository</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">
              {questionsCount.toLocaleString()} Qs
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Across clinical units & NextGen exam modes
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5" /> Active
            </span>
          </div>
          <div className="mt-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Exam Practice Runs</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">
              {examHistoryList.length.toLocaleString()} Attempts
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Logged student session examinations
            </p>
          </div>
        </div>
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Revenue Growth Chart & Tier Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Area Chart */}
            <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Revenue & Subscription Trajectory ({dateRange.toUpperCase()})
                  </h3>
                  <p className="text-xs text-slate-500">M-Pesa verified incoming cashflow against target forecasts.</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                    <span className="font-semibold text-slate-700">Verified Revenue (KSh)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="font-semibold text-slate-700">Target Benchmark</span>
                  </div>
                </div>
              </div>

              <div className="h-[280px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `KSh ${val / 1000}k`} />
                    <Tooltip 
                      formatter={(val: any) => [`KSh ${Number(val).toLocaleString()}`, '']}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Gross Revenue" />
                    <Area type="monotone" dataKey="target" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorTarget)" name="Target Goal" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Plan Distribution Donut Chart */}
            <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 pb-2">
                  <PieChartIcon className="w-4 h-4 text-purple-600" />
                  Subscription Tier Distribution
                </h3>
                <p className="text-xs text-slate-500 mb-4">Breakdown of student accounts by active tier.</p>
                
                <div className="h-[180px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={planShareData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {planShareData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val: any) => [`${val} Students`, 'Total']}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                {planShareData.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className="text-slate-700 font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900">{item.value} users</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Exam Mode Performance */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  Exam Mode Volume & Benchmark Pass Rates
                </h3>
                <p className="text-xs text-slate-500">Student attempts across high-stakes nursing exams.</p>
              </div>
            </div>

            <div className="h-[260px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={examCategoryPerformance} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="attempts" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Attempts" />
                  <Bar dataKey="passRate" fill="#10b981" radius={[6, 6, 0, 0]} name="Pass Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REVENUE & M-PESA SUBSCRIPTIONS */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {/* Real-time M-Pesa Transaction Auditing Ledger */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  M-Pesa Verification & Audit Ledger
                </h3>
                <p className="text-xs text-slate-500">Live incoming student payment confirmation records from Firestore database.</p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTxQuery}
                    onChange={(e) => setSearchTxQuery(e.target.value)}
                    placeholder="Search by student, ref, phone..."
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 w-52"
                  />
                </div>

                <select
                  value={txStatusFilter}
                  onChange={(e) => setTxStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="Approved">Approved Only</option>
                  <option value="Pending">Pending Only</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Plan</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">M-Pesa Ref</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {tx.name || tx.user || 'Enrolled Student'}
                        <span className="block text-[10px] font-normal text-slate-400">{tx.phone || tx.mpesaPhone || 'N/A'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-semibold text-[11px]">
                          {tx.plan || tx.planName || 'Standard Plan'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600">
                        KSh {getPaymentAmount(tx).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 font-semibold">
                        {tx.mpesaRef || tx.receiptNumber || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : (tx.date || 'N/A')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          (tx.status || '').toLowerCase() === 'approved' || (tx.status || '').toLowerCase() === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          (tx.status || '').toLowerCase() === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {tx.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                        No transactions matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LEARNING & NCLEX CLINICAL MASTERY */}
      {activeTab === 'learning' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Brain className="w-4 h-4 text-purple-600" />
            Clinical Domain Mastery Performance (%)
          </h3>
          
          <div className="space-y-4 pt-2">
            {clinicalUnitMastery.map((unit, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-800">{unit.unit}</span>
                  <span className="font-mono text-slate-600">{unit.score}% Score Benchmark</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      unit.score < 70 ? 'bg-rose-500' :
                      unit.score < 80 ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`} 
                    style={{ width: `${unit.score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: QUESTION BANK MATRIX */}
      {activeTab === 'questions' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                NextGen Exam Bank Coverage
              </h3>
              <p className="text-xs text-slate-500">Live question distribution across stored exam taxonomy.</p>
            </div>
            <div className="px-3 py-1.5 bg-blue-50 text-blue-800 text-xs font-bold rounded-xl border border-blue-100">
              Total Questions in Repository: {questionsCount}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {questionModeDistribution.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">{item.mode}</span>
                <h4 className="text-2xl font-black text-slate-900 mt-1">{item.count} Questions</h4>
              </div>
            ))}
          </div>

          {/* List of repository questions */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Exam Questions</h4>
            <div className="space-y-2">
              {questionsList.slice(0, 8).map((q, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs">
                  <div className="truncate max-w-lg">
                    <span className="font-bold text-slate-900 block truncate">{q.questionStem || 'Clinical Nursing Question'}</span>
                    <span className="text-[11px] text-slate-500">{q.examMode || 'NCLEX-RN'} &bull; {q.unitDomain || 'Pharmacology'}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md shrink-0">
                    Active in Repository
                  </span>
                </div>
              ))}
              {questionsList.length === 0 && (
                <p className="text-xs text-slate-400 italic py-4 text-center">Questions loaded directly from the database repository.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
