import React from 'react';
import { BarChart3, PieChart, Activity, Download, ShieldCheck, Users, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function Analytics() {
  const planStats = [
    { name: 'Free Plan', users: '5,420', revenue: '$0', icon: Users, color: 'text-slate-600', bg: 'bg-slate-100' },
    { name: 'Gold Plan', users: '3,845', revenue: '$96,125', icon: Crown, color: 'text-amber-600', bg: 'bg-amber-100' },
    { name: 'Premier Plan', users: '1,280', revenue: '$64,000', icon: Zap, color: 'text-purple-600', bg: 'bg-purple-100' }
  ];

  const auditLogs = [
    { id: 'LOG-001', user: 'wangechigodfrey77@gmail.com', action: 'Approved Payment', target: 'PAY-1001', time: '10 mins ago', type: 'success' },
    { id: 'LOG-002', user: 'System', action: 'Automated Backup', target: 'Database', time: '1 hour ago', type: 'info' },
    { id: 'LOG-003', user: 'admin@nurseprep.ai', action: 'Reset Password', target: 'jane.student@example.com', time: '3 hours ago', type: 'warning' },
    { id: 'LOG-004', user: 'echen@nurseprep.ai', action: 'Created Exam', target: 'Pharmacology Midterm', time: '5 hours ago', type: 'success' },
    { id: 'LOG-005', user: 'System', action: 'Failed Login Attempt', target: 'admin@nurseprep.ai', time: '12 hours ago', type: 'error' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Analytics</h2>
          <p className="text-slate-500 text-sm">Subscription metrics and system audit logs.</p>
        </div>
        <Button variant="outline" className="gap-2 font-bold text-slate-600">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
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
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Plan Stats</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1 font-medium">Active Users</p>
                  <p className="text-xl font-bold text-slate-800">{plan.users}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1 font-medium">Est. Revenue</p>
                  <p className="text-xl font-bold text-emerald-600">{plan.revenue}</p>
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
              Audit Logs
            </h3>
            <span className="text-xs font-bold text-blue-600 cursor-pointer hover:underline">View All Logs</span>
          </div>
          
          <div className="space-y-4">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                  log.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                  log.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                  log.type === 'error' ? 'bg-rose-100 text-rose-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {log.action} <span className="font-normal text-slate-600">on</span> {log.target}
                    </p>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">{log.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 truncate">User: {log.user}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
              <PieChart className="w-5 h-5 text-indigo-600" />
              User Distribution
            </h3>
            <div className="flex justify-center mb-6">
              {/* Fake Pie Chart UI */}
              <div className="relative w-40 h-40 rounded-full border-[16px] border-slate-100">
                <div className="absolute inset-0 rounded-full border-[16px] border-amber-400" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 100%, 0 100%, 0 50%)' }}></div>
                <div className="absolute inset-0 rounded-full border-[16px] border-purple-500" style={{ clipPath: 'polygon(50% 50%, 0 50%, 0 0, 50% 0)' }}></div>
                <div className="absolute inset-0 rounded-full border-[16px] border-slate-300" style={{ clipPath: 'polygon(50% 50%, 50% 0, 100% 0)' }}></div>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl font-bold text-slate-800">10k+</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Users</span>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-300"></div><span className="text-slate-600">Free</span></div>
                <span className="font-bold">51%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-400"></div><span className="text-slate-600">Gold</span></div>
                <span className="font-bold">36%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500"></div><span className="text-slate-600">Premier</span></div>
                <span className="font-bold">13%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
