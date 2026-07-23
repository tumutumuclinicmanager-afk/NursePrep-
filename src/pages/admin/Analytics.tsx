import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, Activity, Download, ShieldCheck, Users, Crown, Zap, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function Analytics() {
  const [payments, setPayments] = useState<any[]>([]);
  const [usersCount, setUsersCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        // Fetch real payments
        try {
          const pSnap = await getDocs(query(collection(db, 'payments')));
          const pList = pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setPayments(pList);
        } catch (e) {
          console.warn("Error fetching payments for analytics:", e);
        }

        // Fetch real users
        try {
          const uSnap = await getDocs(query(collection(db, 'users')));
          const localUsers = JSON.parse(localStorage.getItem('nurseprep_custom_users') || '[]');
          setUsersCount(uSnap.size + localUsers.length);
        } catch (e) {
          console.warn("Error fetching users for analytics:", e);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const approvedPayments = payments.filter(p => p.status === 'Approved');
  
  // Calculate real revenue
  const totalRevenue = approvedPayments.reduce((acc, p) => {
    const num = parseFloat((p.amount || '0').toString().replace(/[^0-9.]/g, ''));
    return acc + (isNaN(num) ? 0 : num);
  }, 0);

  const goldCount = approvedPayments.filter(p => (p.plan || '').toLowerCase().includes('gold')).length;
  const premierCount = approvedPayments.filter(p => (p.plan || '').toLowerCase().includes('premier')).length;
  const freeCount = Math.max(0, usersCount - goldCount - premierCount);

  const planStats = [
    { name: 'Free Plan', users: freeCount.toString(), revenue: 'KSh 0', icon: Users, color: 'text-slate-600', bg: 'bg-slate-100' },
    { name: 'Gold Plan', users: goldCount.toString(), revenue: `KSh ${(goldCount * 2500).toLocaleString()}`, icon: Crown, color: 'text-amber-600', bg: 'bg-amber-100' },
    { name: 'Premier Plan', users: premierCount.toString(), revenue: `KSh ${(premierCount * 5000).toLocaleString()}`, icon: Zap, color: 'text-purple-600', bg: 'bg-purple-100' }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Analytics</h2>
          <p className="text-slate-500 text-sm">Real-time subscription metrics, verified revenue, and transaction logs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {planStats.map((plan, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full ${plan.bg} opacity-50 -mr-4 -mt-4`}></div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 ${plan.bg} ${plan.color} rounded-lg flex items-center justify-center`}>
                  <plan.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Subscription Tier</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1 font-medium">Subscribers</p>
                  <p className="text-xl font-bold text-slate-800">{loading ? '...' : plan.users}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1 font-medium">Verified Revenue</p>
                  <p className="text-xl font-bold text-emerald-600">{loading ? '...' : plan.revenue}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Real Activity & Payment Log
            </h3>
          </div>
          
          <div className="space-y-4">
            {payments.map((p) => (
              <div key={p.id} className="flex items-start gap-4 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                  p.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                  p.status === 'Pending' ? 'bg-amber-100 text-amber-600' :
                  'bg-rose-100 text-rose-600'
                }`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {p.name || 'Student'} &bull; <span className="text-blue-600">{p.plan || 'Plan'}</span>
                    </p>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">{p.date || 'Recent'}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 truncate">M-Pesa Ref: {p.mpesaRef || 'N/A'} | Status: <span className="font-bold">{p.status}</span></p>
                </div>
              </div>
            ))}

            {payments.length === 0 && (
              <p className="text-xs text-slate-500 italic py-6 text-center">No payment transactions recorded yet in database.</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
              <PieChart className="w-5 h-5 text-indigo-600" />
              Total Revenue Summary
            </h3>
            <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Verified Revenue</span>
              <span className="text-3xl font-extrabold text-emerald-600">KSh {totalRevenue.toLocaleString()}</span>
              <p className="text-xs text-slate-500 mt-2">{approvedPayments.length} approved M-Pesa transactions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
