import React, { useState } from 'react';
import { DollarSign, Search, CheckCircle, Send, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function Payments() {
  const [payments, setPayments] = useState([
    { id: 'PAY-1002', user: 'jane.student@example.com', name: 'Jane Doe', amount: 'Ksh 2,500', plan: 'Gold Plan', mpesaRef: 'SAX8921JHK', status: 'Pending', date: '2023-11-10 14:20' },
    { id: 'PAY-1001', user: 'mark.t@example.com', name: 'Mark Taylor', amount: 'Ksh 1,500', plan: 'Pro Plan', mpesaRef: 'SAW7812KLM', status: 'Approved', date: '2023-11-09 09:15' }
  ]);

  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const handleApprove = (payment: any) => {
    setPayments(payments.map(p => p.id === payment.id ? { ...p, status: 'Approved' } : p));
    setSelectedPayment(null);
    alert(`Access code sent to ${payment.user}`);
  };

  const handleReject = (payment: any) => {
    setPayments(payments.map(p => p.id === payment.id ? { ...p, status: 'Rejected' } : p));
    setSelectedPayment(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Verification</h2>
        <p className="text-slate-500 text-sm">Verify M-Pesa payments and send access codes.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center gap-4 flex-wrap">
          <div className="relative max-w-md w-full sm:w-auto flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search M-Pesa Ref or User..." 
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
          <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            <option>All Statuses</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-6 py-4 border-b border-slate-200">User / Plan</th>
                <th className="px-6 py-4 border-b border-slate-200">M-Pesa Ref</th>
                <th className="px-6 py-4 border-b border-slate-200">Amount</th>
                <th className="px-6 py-4 border-b border-slate-200">Date</th>
                <th className="px-6 py-4 border-b border-slate-200">Status</th>
                <th className="px-6 py-4 border-b border-slate-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{payment.name}</div>
                    <div className="text-xs text-slate-500">{payment.plan}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">{payment.mpesaRef}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-emerald-600">{payment.amount}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs">{payment.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                      payment.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                      payment.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {payment.status === 'Pending' ? (
                      <Button size="sm" onClick={() => setSelectedPayment(payment)} className="bg-blue-600 text-white hover:bg-blue-700 text-xs gap-1">
                        Review
                      </Button>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">Processed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPayment && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Verify Payment</h3>
                <p className="text-xs text-slate-500 mt-1">Review M-Pesa details and issue access code.</p>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Student Name</span>
                  <span className="font-bold text-slate-900">{selectedPayment.name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Plan Requested</span>
                  <span className="font-bold text-blue-600">{selectedPayment.plan}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">M-Pesa Reference</span>
                  <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">{selectedPayment.mpesaRef}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Amount Paid</span>
                  <span className="font-bold text-emerald-600">{selectedPayment.amount}</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 text-amber-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Verify this reference code in your M-Pesa statements before approving. Approving will automatically send an access code via email and in-app notification.</p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50">
              <Button variant="ghost" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => handleReject(selectedPayment)}>
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelectedPayment(null)}>Cancel</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={() => handleApprove(selectedPayment)}>
                  <Send className="w-4 h-4" />
                  Approve & Send Code
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
