import React from 'react';
import { Users, GraduationCap, Brain, Stethoscope, FileText, Activity } from 'lucide-react';

export default function AdminOverview() {
  const stats = [
    { title: 'Total Users', value: '12,450', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Active (30d)', value: '8,210', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'New (This Week)', value: '342', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' }
  ];

  const examCategories = [
    { name: 'NCLEX-RN', users: '6,240', percentage: '50%', color: 'bg-blue-500' },
    { name: 'NCLEX-PN', users: '3,105', percentage: '25%', color: 'bg-emerald-500' },
    { name: 'HESI A2', users: '1,860', percentage: '15%', color: 'bg-orange-500' },
    { name: 'TEAS', users: '1,245', percentage: '10%', color: 'bg-purple-500' }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Overview</h2>
        <p className="text-slate-500 text-sm">System statistics and user registration metrics.</p>
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
          Registered Users by Exam Category
        </h3>
        
        <div className="space-y-6">
          {examCategories.map((category, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-700 font-bold">{category.name}</span>
                <span className="text-slate-500">{category.users} users</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                <div 
                  className={`h-full ${category.color} transition-all duration-500`} 
                  style={{ width: category.percentage }}
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
              Recent Practice Tests
            </h3>
            <div className="space-y-4">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex justify-between items-center border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-bold text-slate-700">Pharmacology Quiz</p>
                    <p className="text-xs text-slate-500 mt-1">By Jane Doe &bull; 2 mins ago</p>
                  </div>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded">Success</span>
                </div>
              ))}
            </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Stethoscope className="w-5 h-5 text-orange-600" />
              System Health
            </h3>
            <div className="space-y-4">
               <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-bold text-slate-700">Database Load</span>
                  <span className="text-sm text-emerald-600 font-bold">24%</span>
               </div>
               <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-bold text-slate-700">API Response Time</span>
                  <span className="text-sm text-emerald-600 font-bold">142ms</span>
               </div>
               <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-bold text-slate-700">Storage Usage</span>
                  <span className="text-sm text-amber-600 font-bold">78%</span>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
}
