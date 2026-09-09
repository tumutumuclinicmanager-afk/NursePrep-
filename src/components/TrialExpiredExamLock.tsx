import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Lock, Clock, ShieldAlert, CheckCircle2, Sparkles, 
  ArrowRight, CreditCard, Phone, RefreshCw, Award, 
  Zap, BookOpen, Brain, ShieldCheck, Check, RotateCcw
} from 'lucide-react';
import { TrialState, setSimulatedTrialExpired } from '@/lib/trialManager';
import { auth } from '@/lib/firebase';

interface TrialExpiredExamLockProps {
  trial: TrialState;
  onRefresh?: () => void;
}

export function TrialExpiredExamLock({ trial, onRefresh }: TrialExpiredExamLockProps) {
  const navigate = useNavigate();
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

  const handleCheckPayment = async () => {
    setCheckingPayment(true);
    setCheckMessage(null);
    try {
      if (onRefresh) {
        await onRefresh();
      }
      setTimeout(() => {
        setCheckingPayment(false);
        setCheckMessage('Payment records verified. If you completed a payment recently, access is activated automatically.');
      }, 1200);
    } catch (e) {
      setCheckingPayment(false);
    }
  };

  const handleResetTrial = async () => {
    setSimulating(true);
    try {
      await setSimulatedTrialExpired(false, auth.currentUser);
      if (onRefresh) await onRefresh();
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 animate-fadeIn">
      {/* Top Banner Alert */}
      <div className="bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-purple-500/15 border border-amber-300/60 rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden mb-8 shadow-xs">
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 transform -translate-x-8 translate-y-8 w-40 h-40 bg-rose-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-amber-100 border-2 border-amber-300 text-amber-700 flex items-center justify-center mx-auto mb-4 shadow-xs">
          <Lock className="w-8 h-8 text-amber-600" />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider mb-3">
          <Clock className="w-3.5 h-3.5 text-rose-600" /> 14-Day Free Trial Expired
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight max-w-2xl mx-auto">
          Please Upgrade Your Account to Access the Exams Repository
        </h1>

        <p className="text-slate-600 text-sm sm:text-base mt-3 max-w-2xl mx-auto leading-relaxed">
          Your 14-day free preview period has completed. To unlock unlimited access to the verified NCLEX-RN, NCK, HESI question bank, Next-Gen clinical case studies, and faculty rationales, please select an upgrade plan below.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => navigate('/pricing')}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md shadow-blue-200 transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            Upgrade Account Now
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleCheckPayment}
            disabled={checkingPayment}
            className="px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-sm shadow-2xs transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${checkingPayment ? 'animate-spin' : ''}`} />
            {checkingPayment ? 'Checking Status...' : 'Verify Existing Payment'}
          </button>
        </div>

        {checkMessage && (
          <p className="text-xs text-slate-600 mt-3 font-medium bg-white/80 py-1.5 px-3 rounded-lg inline-block border border-slate-200">
            {checkMessage}
          </p>
        )}
      </div>

      {/* Value Proposition Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">10,000+ Board Questions</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Full access to authentic NCK, NCLEX-RN, HESI, and exit exams authored by senior clinical educators.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Next-Gen (NGN) Case Studies</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Practice 6-question clinical judgment case studies, matrix grids, bowtie items, and drag-and-drop questions.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">100% Pass Guarantee</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Comprehensive rationales, mistake pattern diagnosis, and 24/7 AI tutor guidance to ensure first-time pass.
          </p>
        </div>
      </div>

      {/* Plan Selection Cards */}
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-xl font-black text-slate-900">Choose Your Upgrade Plan</h2>
          <p className="text-xs text-slate-500 mt-1">One-time payment with instant access. Accepts M-Pesa & Card payments.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Plan 1: Silver / Basic */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Silver Plan</span>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">30 Days</span>
              </div>
              <div className="mt-4 mb-5">
                <div className="text-3xl font-black text-slate-900">$29</div>
                <div className="text-xs font-semibold text-slate-400">or Ksh 3,770 (one-time)</div>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Full Exam Repository Access</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>NCK & NCLEX-RN Standard Tests</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Detailed Clinical Rationales</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Basic Performance Analytics</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/pricing')}
              className="mt-6 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Choose Silver Plan
            </button>
          </div>

          {/* Plan 2: Gold / SurePass (Most Popular) */}
          <div className="bg-white rounded-2xl border-2 border-blue-600 p-6 shadow-lg shadow-blue-100 transition-all flex flex-col justify-between relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-black uppercase tracking-wider py-0.5 px-3 rounded-full shadow-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" /> Most Popular Choice
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">Gold SurePass</span>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">90 Days</span>
              </div>
              <div className="mt-4 mb-5">
                <div className="text-3xl font-black text-slate-900">$59</div>
                <div className="text-xs font-semibold text-slate-400">or Ksh 7,670 (one-time)</div>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>All Silver Features Included</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span><strong>Next-Gen NGN Case Studies</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span><strong>24/7 AI Clinical Study Mentor</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Unlimited Timed Exam Mode</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>CAT Adaptive Readiness Test</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/pricing')}
              className="mt-6 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-blue-200 transition-colors"
            >
              Choose Gold Plan
            </button>
          </div>

          {/* Plan 3: Platinum / Mastery */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-purple-600">Platinum Mastery</span>
                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold">180 Days</span>
              </div>
              <div className="mt-4 mb-5">
                <div className="text-3xl font-black text-slate-900">$99</div>
                <div className="text-xs font-semibold text-slate-400">or Ksh 12,870 (one-time)</div>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>All Gold Features Included</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>180 Days Unlimited Exam Bank</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Live Lecturer Video Q&A Sessions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>100% Pass Guarantee Guarantee</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/pricing')}
              className="mt-6 w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Choose Platinum Plan
            </button>
          </div>
        </div>
      </div>

      {/* Development & Verification Helper Bar */}
      <div className="mt-12 p-4 bg-slate-100 rounded-2xl border border-slate-200 text-center flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <span>Testing & Demo Controls:</span>
          <span className="font-semibold text-slate-700">Currently in 14-Day Free Trial Expired State</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetTrial}
            disabled={simulating}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-blue-700 border border-slate-200 font-bold shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
            Reset to 14-Day Active Trial
          </button>
        </div>
      </div>
    </div>
  );
}
