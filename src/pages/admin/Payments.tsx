import React, { useState, useEffect } from 'react';
import { DollarSign, Search, CheckCircle, Send, XCircle, AlertCircle, CreditCard, Smartphone, ShieldCheck, Key, Settings, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { collection, query, onSnapshot, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function Payments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'transactions' | 'settings'>('transactions');

  // Merchant Account Configuration State
  const [stripeAccountEmail, setStripeAccountEmail] = useState('');
  const [stripeLiveKey, setStripeLiveKey] = useState('');
  const [mpesaTillNumber, setMpesaTillNumber] = useState('892100');
  const [mpesaBusinessName, setMpesaBusinessName] = useState('NursePrep Qbank');
  const [payoutBank, setPayoutBank] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'payments'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: any[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setPayments(data);
    });

    // Load saved payment settings
    const loadSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'paymentGateway'));
        if (snap.exists()) {
          const s = snap.data();
          setStripeAccountEmail(s.stripeAccountEmail || '');
          setStripeLiveKey(s.stripeLiveKey || '');
          setMpesaTillNumber(s.mpesaTillNumber || '892100');
          setMpesaBusinessName(s.mpesaBusinessName || 'NursePrep Qbank');
          setPayoutBank(s.payoutBank || '');
        }
      } catch (err) {
        console.error('Error loading payment settings:', err);
      }
    };
    loadSettings();

    return () => unsubscribe();
  }, []);

  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const handleApprove = async (payment: any) => {
    try {
      await updateDoc(doc(db, 'payments', payment.id), { status: 'Approved' });
      setSelectedPayment(null);
      alert(`Access code sent to ${payment.user}`);
    } catch (error) {
      console.error("Error approving payment:", error);
      alert("Failed to update payment status");
    }
  };

  const handleReject = async (payment: any) => {
    try {
      await updateDoc(doc(db, 'payments', payment.id), { status: 'Rejected' });
      setSelectedPayment(null);
    } catch (error) {
      console.error("Error rejecting payment:", error);
      alert("Failed to update payment status");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'paymentGateway'), {
        stripeAccountEmail,
        stripeLiveKey,
        mpesaTillNumber,
        mpesaBusinessName,
        payoutBank,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Failed to save payment settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Payment & Revenue Hub</h2>
          <p className="text-slate-500 text-sm">Verify student payments and configure your Stripe & M-Pesa payout accounts.</p>
        </div>

        <div className="bg-slate-200 p-1 rounded-xl flex items-center text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'transactions' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Transactions ({payments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'settings' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4 text-blue-600" />
            <span>Payout & Gateway Setup</span>
          </button>
        </div>
      </div>

      {activeTab === 'transactions' ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center gap-4 flex-wrap">
            <div className="relative max-w-md w-full sm:w-auto flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search Ref or User..." 
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
            <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
              <option>All Statuses</option>
              <option>Completed</option>
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
                  <th className="px-6 py-4 border-b border-slate-200">Payment Gateway</th>
                  <th className="px-6 py-4 border-b border-slate-200">Ref Code</th>
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
                      <div className="text-xs text-slate-500">{payment.planName || payment.plan}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        {payment.paymentMethod?.includes('Stripe') ? (
                          <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        {payment.paymentMethod || 'M-Pesa'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded text-xs">
                        {payment.receiptNumber || payment.mpesaRef || 'STR-98231'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600">
                      {payment.amountUsd ? `$${payment.amountUsd}` : payment.amount}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{payment.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                        payment.status === 'Completed' || payment.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                        payment.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
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
      ) : (
        /* Payout & Merchant Setup Tab */
        <div className="space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                Merchant Account Credentials & Bank Payout Setup
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure where student subscription funds are deposited.
              </p>
            </div>

            {settingsSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Payment gateway settings saved successfully!
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Stripe Configuration */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm border-b border-slate-200 pb-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>Stripe Merchant Account (US Dollars)</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stripe Owner Email</label>
                  <input
                    type="email"
                    value={stripeAccountEmail}
                    onChange={(e) => setStripeAccountEmail(e.target.value)}
                    placeholder="e.g. payouts@nurseprep.com"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stripe Publishable Key (pk_live_...)</label>
                  <input
                    type="text"
                    value={stripeLiveKey}
                    onChange={(e) => setStripeLiveKey(e.target.value)}
                    placeholder="pk_live_51Nx..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* M-Pesa Configuration */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm border-b border-slate-200 pb-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Safaricom M-Pesa (Kenyan Shillings)</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Buy Goods Till Number / Paybill</label>
                  <input
                    type="text"
                    value={mpesaTillNumber}
                    onChange={(e) => setMpesaTillNumber(e.target.value)}
                    placeholder="e.g. 892100"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Registered Business Name</label>
                  <input
                    type="text"
                    value={mpesaBusinessName}
                    onChange={(e) => setMpesaBusinessName(e.target.value)}
                    placeholder="e.g. NursePrep Qbank"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Direct Bank Payout Account Details (Optional Notes)</label>
              <textarea
                value={payoutBank}
                onChange={(e) => setPayoutBank(e.target.value)}
                placeholder="e.g. Chase Bank US (Account: **** 4892, Routing: 021000021) or Equity Bank Kenya"
                rows={2}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSavingSettings} className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold gap-2">
                <Save className="w-4 h-4" />
                {isSavingSettings ? 'Saving...' : 'Save Merchant Settings'}
              </Button>
            </div>
          </form>

          {/* Setup Instructions Card */}
          <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl space-y-4 shadow-md">
            <h4 className="font-extrabold text-base flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-400" />
              How Payments Work in NursePrep
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 space-y-1">
                <span className="font-bold text-amber-300 block text-sm mb-1">1. US & Global Credit Card Payouts</span>
                <p>
                  Connect your <strong>Stripe Dashboard</strong> (https://dashboard.stripe.com) to receive credit/debit card payments in USD ($). Stripe automatically deposits funds directly into your linked US or international bank account daily or weekly.
                </p>
              </div>

              <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 space-y-1">
                <span className="font-bold text-emerald-400 block text-sm mb-1">2. Kenyan M-Pesa Mobile Money</span>
                <p>
                  Connect your <strong>Safaricom Daraja API / M-Pesa Business Till</strong> to receive payments in KES (Ksh). Payments land in your M-Pesa Business Till or Paybill and can be transferred directly to your bank or mobile phone.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedPayment && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Verify Payment</h3>
                <p className="text-xs text-slate-500 mt-1">Review payment details and issue access code.</p>
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
                  <span className="font-bold text-blue-600">{selectedPayment.planName || selectedPayment.plan}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Reference Code</span>
                  <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded">{selectedPayment.receiptNumber || selectedPayment.mpesaRef}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Amount Paid</span>
                  <span className="font-bold text-emerald-600">{selectedPayment.amountUsd ? `$${selectedPayment.amountUsd}` : selectedPayment.amount}</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 text-amber-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Verify this transaction in your Stripe or M-Pesa merchant dashboard before approving. Approving will confirm student subscription access.</p>
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
                  Approve & Grant Access
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

