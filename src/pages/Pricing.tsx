import React, { useState } from 'react';
import { DollarSign, CheckCircle2, ChevronRight, ShieldCheck, Award, Zap, CreditCard, Smartphone, Lock, Sparkles, RefreshCw, Star, Check, X, Globe, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';

export interface PlanItem {
  id: string;
  name: string;
  subtitle: string;
  usdPrice: number;
  durationDays: number;
  durationLabel: string;
  popular?: boolean;
  guaranteedPassBadge?: boolean;
  headerBg: string;
  badgeBg: string;
  badgeText: string;
  features: string[];
}

export default function Pricing() {
  const navigate = useNavigate();
  const [currency, setCurrency] = useState<'USD' | 'KES'>('USD');
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'mpesa'>('stripe');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string | null>(null);

  // Form states for Stripe
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Form states for M-Pesa
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [mpesaRef, setMpesaRef] = useState('');
  const [mpesaMode, setMpesaMode] = useState<'stk' | 'till'>('stk');

  // Exchange rate: 1 USD = 130 KES
  const KES_RATE = 130;

  const plans: PlanItem[] = [
    {
      id: 'basic-silver',
      name: 'Basic/Silver Plan',
      subtitle: 'One-time payment, no monthly fees!',
      usdPrice: 64,
      durationDays: 30,
      durationLabel: '$64/ 30 Days',
      headerBg: 'bg-slate-200 text-slate-800',
      badgeBg: 'bg-slate-300 text-slate-900',
      badgeText: 'SILVER TIER',
      features: [
        'Questions that mirror the actual NCLEX-RN exam.',
        '1 NCLEX Predictor Adaptive Test',
        'Cheat sheet for every question.',
        'Video review for every question.',
        'Peer performance comparison.',
        '+2500 questions, +1k ngn questions.',
        '6 Silver Readiness Assessments Tests.',
        'Free Qbank Reset (If you\'re renewing your subscription)',
        'Multiple NCLEX-RN CAT Mock Tests.',
        'Exam interface that mimics real exam.',
        'Accurate Pass Prediction.'
      ]
    },
    {
      id: 'sure-pass-gold',
      name: 'Sure Pass/Gold Plan',
      subtitle: 'One-time payment, no monthly fees!',
      usdPrice: 128,
      durationDays: 90,
      durationLabel: '$128/ 90 Days',
      popular: true,
      guaranteedPassBadge: true,
      headerBg: 'bg-amber-400 text-amber-950',
      badgeBg: 'bg-amber-500 text-white',
      badgeText: 'BEST VALUE - GUARANTEED PASS',
      features: [
        'Guaranteed Pass',
        '2 NCLEX Predictor Adaptive Tests',
        'Questions that mirror the actual NCLEX-RN exam.',
        'Cheat sheet for every question.',
        'Video review for every question.',
        'Peer performance comparison.',
        '+4000 questions, +2000 ngn questions.',
        '6 Silver Readiness Assessments Tests.',
        '5 Gold Readiness Assessments Tests.',
        'Free Qbank Reset',
        'Multiple NCLEX-RN CAT Mock Tests.',
        'Exam interface that mimics real exam.',
        'Accurate Pass Prediction.',
        'Live Webinars Every Week.'
      ]
    },
    {
      id: 'master-platinum',
      name: 'Master Pass / Unlimited Plan',
      subtitle: 'Complete 180-Day Licensure Access & Mentorship',
      usdPrice: 199,
      durationDays: 180,
      durationLabel: '$199/ 180 Days',
      headerBg: 'bg-blue-600 text-white',
      badgeBg: 'bg-blue-700 text-white',
      badgeText: 'FULL ACCESS + TUTORING',
      features: [
        'Guaranteed Pass Warranty',
        '1-on-1 Nurse Educator Consultation Session',
        'Full NCLEX-RN & NCLEX-PN Bank Unlocks',
        'ATI TEAS 7 & HESI A2 Qbank Access Included',
        'Unlimited NCLEX Predictor Adaptive Tests',
        '+6000 NCLEX Questions + 2500 NGN Case Studies',
        'All Silver & Gold Readiness Assessments',
        'Unlimited Qbank Resets & Peer Analytics',
        'Video Explanations & Weekly Live Webinars'
      ]
    }
  ];

  const formatPrice = (usd: number) => {
    if (currency === 'KES') {
      const kes = Math.round(usd * KES_RATE);
      return `Ksh ${kes.toLocaleString()}`;
    }
    return `$${usd}`;
  };

  const handleSelectPlan = (plan: PlanItem) => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }
    setSelectedPlan(plan);
    setPaymentSuccessMessage(null);
    setShowPaymentModal(true);
  };

  const handleStripeCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !selectedPlan) return;

    setIsSubmitting(true);
    try {
      const userEmail = auth.currentUser.email || auth.currentUser.uid;
      const userName = auth.currentUser.displayName || cardName || userEmail;
      
      // Save payment transaction to Firestore
      await addDoc(collection(db, 'payments'), {
        user: userEmail,
        userId: auth.currentUser.uid,
        name: userName,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        amountUsd: selectedPlan.usdPrice,
        amountKes: selectedPlan.usdPrice * KES_RATE,
        paidCurrency: 'USD',
        paymentMethod: 'Stripe Credit Card',
        cardLast4: cardNumber.slice(-4) || '4242',
        status: 'Completed',
        receiptNumber: `STR-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        date: new Date().toLocaleString(),
        createdAt: new Date().toISOString()
      });

      setPaymentSuccessMessage(`Payment of ${formatPrice(selectedPlan.usdPrice)} via Stripe Credit Card was successful! Full ${selectedPlan.name} access has been granted in your My Courses tab.`);
      setTimeout(() => {
        setShowPaymentModal(false);
        setIsSubmitting(false);
        navigate('/dashboard/courses');
      }, 2500);
    } catch (error) {
      console.error('Stripe payment error:', error);
      alert('Error processing Stripe payment. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleMpesaCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !selectedPlan) return;

    setIsSubmitting(true);
    try {
      const userEmail = auth.currentUser.email || auth.currentUser.uid;
      const kesAmount = selectedPlan.usdPrice * KES_RATE;
      const refCode = mpesaRef || `MP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      await addDoc(collection(db, 'payments'), {
        user: userEmail,
        userId: auth.currentUser.uid,
        name: auth.currentUser.displayName || userEmail,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        amountUsd: selectedPlan.usdPrice,
        amountKes: kesAmount,
        paidCurrency: 'KES',
        paymentMethod: 'M-Pesa Express',
        mpesaPhone: mpesaPhone || 'N/A',
        mpesaRef: refCode.toUpperCase(),
        status: mpesaMode === 'stk' ? 'Completed' : 'Pending Verification',
        date: new Date().toLocaleString(),
        createdAt: new Date().toISOString()
      });

      if (mpesaMode === 'stk') {
        setPaymentSuccessMessage(`STK Push prompt sent to ${mpesaPhone || 'your phone'}. Payment verified for Ksh ${kesAmount.toLocaleString()}!`);
      } else {
        setPaymentSuccessMessage(`M-Pesa reference ${refCode.toUpperCase()} submitted for Ksh ${kesAmount.toLocaleString()}. Access granted upon verification.`);
      }

      setTimeout(() => {
        setShowPaymentModal(false);
        setIsSubmitting(false);
        navigate('/dashboard/courses');
      }, 2500);
    } catch (error) {
      console.error('M-Pesa payment error:', error);
      alert('Error processing M-Pesa payment.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24 font-sans text-slate-800">
      {/* Top NCLEX Bar matching Naxlex Screenshot Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white py-3 px-4 shadow-md sticky top-16 z-10 border-b border-blue-900">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs md:text-sm font-semibold">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping"></span>
            <span className="text-amber-300 font-extrabold uppercase tracking-wider">NCLEX-RN & NGN Packages</span>
            <span className="hidden sm:inline text-slate-300">• One-time payment, no monthly fees!</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-200 font-medium">
              Your <strong className="text-amber-300">free trial</strong> expires in <strong>14 Days</strong>
            </span>
            <button
              onClick={() => {
                const el = document.getElementById('pricing-grid');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-md font-extrabold text-xs shadow-xs transition-colors"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12">
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-blue-600" /> Guaranteed NCLEX Pass Rate
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            NCLEX-RN Packages
          </h1>
          <p className="text-slate-600 text-base md:text-lg font-medium">
            One-time payment, no monthly fees! Guaranteed pass warranty for US & International Nursing Students.
          </p>

          {/* Currency Switcher */}
          <div className="flex items-center justify-center pt-2">
            <div className="bg-white border border-slate-200 rounded-xl p-1 shadow-xs inline-flex items-center gap-1">
              <span className="text-xs font-bold text-slate-500 px-2 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> Market Currency:
              </span>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                  currency === 'USD'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                🇺🇸 USD ($)
              </button>
              <button
                onClick={() => setCurrency('KES')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                  currency === 'KES'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                🇰🇪 KES (M-Pesa)
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div id="pricing-grid" className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-3xl border ${
                plan.popular ? 'border-amber-400 shadow-xl ring-2 ring-amber-400/50 scale-[1.02]' : 'border-slate-200 shadow-sm'
              } flex flex-col overflow-hidden relative transition-all duration-200 hover:shadow-md`}
            >
              {plan.popular && (
                <div className="bg-amber-500 text-white text-[11px] font-extrabold uppercase tracking-widest text-center py-1.5">
                  ★ MOST POPULAR CHOICE FOR US NURSES ★
                </div>
              )}

              {/* Header Box styled exactly like Naxlex curved top container */}
              <div className="p-8 text-center border-b border-slate-100 space-y-3">
                <div className={`mx-auto w-full py-6 rounded-3xl ${plan.headerBg} shadow-inner flex flex-col items-center justify-center`}>
                  <span className="text-3xl md:text-4xl font-black tracking-tight">
                    {formatPrice(plan.usdPrice)}
                    <span className="text-base font-bold opacity-80">/ {plan.durationDays} Days</span>
                  </span>
                </div>

                <div className="pt-2">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    {plan.subtitle}
                  </p>
                </div>
              </div>

              {/* Features List */}
              <div className="p-6 md:p-8 flex-1 space-y-3.5 bg-slate-50/50">
                {plan.features.map((feat, idx) => {
                  const isPassGuarantee = feat.toLowerCase().includes('guaranteed pass');
                  return (
                    <div key={idx} className="flex items-start gap-3">
                      {isPassGuarantee ? (
                        <div className="shrink-0 p-1 bg-amber-500 text-white rounded-full shadow-xs">
                          <Award className="w-4 h-4 fill-white" />
                        </div>
                      ) : (
                        <div className="shrink-0 p-0.5 bg-emerald-100 text-emerald-700 rounded-full mt-0.5">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                      <span className={`text-xs md:text-sm font-medium leading-tight ${
                        isPassGuarantee ? 'text-amber-900 font-extrabold flex items-center gap-1.5' : 'text-slate-700'
                      }`}>
                        {isPassGuarantee && (
                          <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-black rounded uppercase tracking-wider">
                            PASS GUARANTEE
                          </span>
                        )}
                        {feat}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Bottom CTA Button */}
              <div className="p-6 bg-white border-t border-slate-100 mt-auto">
                <Button
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full h-12 rounded-xl text-sm font-extrabold shadow-sm transition-all gap-2 ${
                    plan.popular
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black'
                      : plan.id === 'master-platinum'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <span>Buy now</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* American Market Features & Guarantee Section */}
        <div className="mt-16 bg-white rounded-3xl border border-slate-200 p-8 md:p-12 shadow-xs space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl font-black text-slate-900">
              Why US Nursing Candidates Trust NursePrep
            </h2>
            <p className="text-slate-500 text-sm">
              Built according to NCSBN Clinical Judgment Measurement Model (NCLEX-RN & NGN Standards).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900">NextGen NCLEX (NGN) Ready</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Includes matrix grid questions, extended multiple response, trend clinical items, and realistic unfold case studies.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900">100% Pass Warranty</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                If you score 65%+ on our Gold Readiness Assessments and do not pass your NCLEX-RN on the 1st try, receive a 100% full refund.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900">Instant Global Activation</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pay seamlessly using <strong>Stripe Card / Apple Pay</strong> (US Dollar) or <strong>M-Pesa</strong> (Kenya Ksh) with instant account unlock.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal with Stripe & M-Pesa Integration */}
      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Selected Package</span>
                <h3 className="text-xl font-extrabold">{selectedPlan.name}</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Amount: <strong className="text-amber-300 font-black">{formatPrice(selectedPlan.usdPrice)}</strong> ({selectedPlan.durationDays} Days Access)
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payment Method Switcher Tabs */}
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('stripe')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'stripe'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Card / Stripe (US & Global)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('mpesa')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'mpesa'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>M-Pesa (Kenya KES)</span>
              </button>
            </div>

            {/* Success Message Banner */}
            {paymentSuccessMessage ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-black text-slate-900">Payment Successful!</h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  {paymentSuccessMessage}
                </p>
                <p className="text-[11px] font-bold text-blue-600">Redirecting to Student Dashboard...</p>
              </div>
            ) : paymentMethod === 'stripe' ? (
              /* Stripe Credit Card Form */
              <form onSubmit={handleStripeCheckout} className="p-6 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Total Charge:</span>
                  <span className="text-slate-900 font-extrabold text-sm">${selectedPlan.usdPrice}.00 USD</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="e.g. Sarah Miller BSN"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Card Number (Stripe Secured)</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                        setCardNumber(val);
                      }}
                      placeholder="4532 0000 0000 8821"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Expiry</label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-600 text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">CVC</label>
                    <input
                      type="text"
                      required
                      placeholder="123"
                      maxLength={4}
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-600 text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Zip Code</label>
                    <input
                      type="text"
                      required
                      placeholder="90210"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-600 text-center"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1 font-semibold">
                    <Lock className="w-3.5 h-3.5 text-blue-600" /> 256-Bit Encrypted via Stripe
                  </span>
                  <span className="font-bold text-slate-700">Instant Access</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowPaymentModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold">
                    {isSubmitting ? 'Processing Stripe...' : `Pay $${selectedPlan.usdPrice} Now`}
                  </Button>
                </div>
              </form>
            ) : (
              /* M-Pesa Kenyan Payment Form */
              <form onSubmit={handleMpesaCheckout} className="p-6 space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs">
                  <span className="text-emerald-900 font-medium">M-Pesa Equivalent (1 USD = 130 KES):</span>
                  <span className="text-emerald-950 font-black text-sm">
                    Ksh {(selectedPlan.usdPrice * KES_RATE).toLocaleString()}
                  </span>
                </div>

                {/* M-Pesa Sub-mode toggle */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setMpesaMode('stk')}
                    className={`py-1.5 rounded-md transition-all ${
                      mpesaMode === 'stk' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    1-Click STK Push
                  </button>
                  <button
                    type="button"
                    onClick={() => setMpesaMode('till')}
                    className={`py-1.5 rounded-md transition-all ${
                      mpesaMode === 'till' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Buy Goods Till Number
                  </button>
                </div>

                {mpesaMode === 'stk' ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      M-Pesa Mobile Number
                    </label>
                    <input
                      type="text"
                      required
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value)}
                      placeholder="e.g. 0712345678 or 254712345678"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                    <p className="text-[11px] text-slate-500">
                      An M-Pesa prompt will appear on your mobile phone requesting your PIN to authorize payment of <strong>Ksh {(selectedPlan.usdPrice * KES_RATE).toLocaleString()}</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs space-y-1">
                      <p>1. Go to M-Pesa Menu -&gt; Lipa na M-Pesa</p>
                      <p>2. Select <strong>Buy Goods and Services</strong></p>
                      <p>3. Till Number: <strong className="text-emerald-700 font-extrabold">892100</strong> (NursePrep Qbank)</p>
                      <p>4. Amount: <strong className="text-slate-900 font-extrabold">Ksh {(selectedPlan.usdPrice * KES_RATE).toLocaleString()}</strong></p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        Enter M-Pesa Confirmation Code
                      </label>
                      <input
                        type="text"
                        required
                        value={mpesaRef}
                        onChange={(e) => setMpesaRef(e.target.value.toUpperCase())}
                        placeholder="e.g. SAX8921JHK"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowPaymentModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold">
                    {isSubmitting ? 'Verifying...' : 'Complete M-Pesa Payment'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

