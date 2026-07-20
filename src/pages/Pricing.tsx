import React, { useState } from 'react';
import { DollarSign, CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';

export default function Pricing() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState('');
  const [mpesaRef, setMpesaRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const plans = [
    { name: 'Basic Plan', amount: 'Ksh 1,000', price: 1000, features: ['Access to 10 mock exams', 'Basic progress tracking', 'Standard support'] },
    { name: 'Pro Plan', amount: 'Ksh 2,500', price: 2500, features: ['Unlimited mock exams', 'Detailed analytics', 'Priority support', 'Live sessions'] },
    { name: 'Gold Plan', amount: 'Ksh 5,000', price: 5000, features: ['Everything in Pro', '1-on-1 tutoring sessions', 'Custom study plans'] },
  ];

  const handleSelectPlan = (plan: string) => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !mpesaRef) return;
    
    setIsSubmitting(true);
    try {
      const planDetails = plans.find(p => p.name === selectedPlan);
      await addDoc(collection(db, 'payments'), {
        user: auth.currentUser.email,
        name: auth.currentUser.displayName || auth.currentUser.email,
        amount: planDetails?.amount,
        plan: selectedPlan,
        mpesaRef: mpesaRef,
        status: 'Pending',
        date: new Date().toLocaleString()
      });
      alert('Payment details submitted successfully. Access will be granted once verified.');
      setShowPaymentModal(false);
      setMpesaRef('');
    } catch (error) {
      console.error(error);
      alert('Error submitting payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-20 px-6 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">Choose the plan that best fits your study needs and schedule.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div key={index} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-8 border-b border-slate-100 flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-3xl font-bold tracking-tight text-slate-900">{plan.amount}</span>
                  <span className="text-sm font-medium text-slate-500">/ month</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span className="text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6 bg-slate-50">
                <Button onClick={() => handleSelectPlan(plan.name)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 gap-2 shadow-md shadow-blue-200">
                  Select {plan.name}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-start gap-4">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">M-Pesa Payment Details</h3>
                <p className="text-xs text-slate-500 mt-1">Pay for {selectedPlan}</p>
              </div>
            </div>
            
            <form onSubmit={handleSubmitPayment} className="p-6 space-y-4">
              <div className="p-4 bg-slate-100 border border-slate-200 rounded-lg text-sm mb-4">
                <p className="mb-2">1. Go to M-Pesa Menu</p>
                <p className="mb-2">2. Select Lipa na M-Pesa -&gt; Buy Goods and Services</p>
                <p className="mb-2">3. Enter Till Number: <strong>123456</strong></p>
                <p className="mb-2">4. Enter Amount: <strong>{plans.find(p => p.name === selectedPlan)?.amount}</strong></p>
                <p>5. Enter M-Pesa Pin and confirm.</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enter M-Pesa Reference Code</label>
                <input 
                  type="text" 
                  value={mpesaRef}
                  onChange={(e) => setMpesaRef(e.target.value.toUpperCase())}
                  placeholder="e.g. SAX8921JHK"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-mono uppercase"
                  required
                />
              </div>

              <div className="flex gap-2 mt-6">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting || !mpesaRef} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50">
                  {isSubmitting ? 'Submitting...' : 'Verify Payment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
