import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { BookOpen, Target, Brain, Award, ArrowRight, CheckCircle2, ShieldCheck, LogIn, UserPlus, Lock, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import DarkVeil from '@/components/DarkVeil';
import TestimonialCarousel from '@/components/TestimonialCarousel';

export default function Home() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(!!auth.currentUser || !!localStorage.getItem('userRole'));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const role = localStorage.getItem('userRole');
      setIsLoggedIn(!!user || !!role);
    });
    return () => unsubscribe();
  }, []);

  const handleExamClick = (examName: string) => {
    if (isLoggedIn) {
      navigate(`/dashboard/exams?search=${encodeURIComponent(examName)}`);
    } else {
      navigate('/login?redirect=/dashboard/exams', {
        state: { from: '/dashboard/exams', message: `Please sign in to access ${examName} practice questions and mock exams.` }
      });
    }
  };

  const handleViewAllClick = () => {
    if (isLoggedIn) {
      navigate('/dashboard/exams');
    } else {
      navigate('/login?redirect=/dashboard/exams', {
        state: { from: '/dashboard/exams', message: 'Please sign in to access the full nursing exam question bank.' }
      });
    }
  };
  return (
    <div className="flex flex-col min-h-screen">
      {/* Full-Screen Atmospheric Hero Section with DarkVeil Background */}
      <section className="relative w-full h-[calc(100vh-64px)] min-h-[640px] max-h-[960px] bg-slate-950 text-white overflow-hidden flex items-center justify-center">
        {/* Full-screen DarkVeil canvas background */}
        <div className="absolute inset-0 w-full h-full z-0">
          <DarkVeil 
            speed={0.45} 
            hueShift={215} 
            noiseIntensity={0.025} 
            warpAmount={0.22} 
            resolutionScale={1} 
          />
        </div>

        {/* Ambient Dark Gradients & Vignette for maximum text readability */}
        <div className="absolute inset-0 bg-radial from-transparent via-slate-950/40 to-slate-950/80 pointer-events-none z-10"></div>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none z-10"></div>

        {/* Layered Content centered in front with absolute positioning and high z-index */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center pointer-events-auto">
          <div className="max-w-4xl mx-auto space-y-6 flex flex-col items-center">
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-white drop-shadow-xl">
              Master Your Nursing Future
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg md:text-xl text-slate-200 max-w-2xl mx-auto font-normal leading-relaxed drop-shadow">
              Comprehensive study materials, intelligent quiz generation, and realistic mock exams for <strong>NCLEX-RN/PN</strong>, <strong>ATI TEAS</strong>, <strong>HESI A2</strong>, and more.
            </p>

            {/* Centered Call-to-Action Buttons with Framer-Motion Pulse Animation */}
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center pt-3 w-full max-w-md">
              <motion.div
                className="w-full sm:w-1/2"
                animate={{
                  scale: [1, 1.025, 1],
                  boxShadow: [
                    '0 10px 25px -5px rgba(37, 99, 235, 0.3)',
                    '0 15px 35px -5px rgba(37, 99, 235, 0.55)',
                    '0 10px 25px -5px rgba(37, 99, 235, 0.3)'
                  ]
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link to="/register" className="w-full block">
                  <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-xl shadow-blue-600/30 border-none transition-all flex items-center justify-center gap-2 h-12 text-base">
                    <UserPlus className="w-4 h-4" /> Register
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                className="w-full sm:w-1/2"
                animate={{
                  scale: [1, 1.015, 1],
                  boxShadow: [
                    '0 4px 12px rgba(255, 255, 255, 0.05)',
                    '0 6px 18px rgba(255, 255, 255, 0.12)',
                    '0 4px 12px rgba(255, 255, 255, 0.05)'
                  ]
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.4
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link to="/login" className="w-full block">
                  <Button size="lg" variant="outline" className="w-full text-white border-white/30 hover:bg-white/15 bg-slate-900/60 backdrop-blur-md font-semibold flex items-center justify-center gap-2 h-12 text-base">
                    <LogIn className="w-4 h-4" /> Login
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* Feature Trust Badges */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-300">
              <span className="flex items-center gap-1.5 backdrop-blur-xs px-3 py-1 rounded-md bg-slate-900/40 border border-white/10">
                <ShieldCheck className="w-4 h-4 text-blue-400" /> Verified Rationales
              </span>
              <span className="flex items-center gap-1.5 backdrop-blur-xs px-3 py-1 rounded-md bg-slate-900/40 border border-white/10">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> NGN Bowtie & Case Studies
              </span>
              <span className="flex items-center gap-1.5 backdrop-blur-xs px-3 py-1 rounded-md bg-slate-900/40 border border-white/10">
                <ShieldCheck className="w-4 h-4 text-amber-400" /> AI Adaptive Feedback
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Exams Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Popular Exams</h2>
                {!isLoggedIn && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <Lock className="w-3 h-3" /> Login Required
                  </span>
                )}
              </div>
              <p className="text-slate-500">
                {isLoggedIn 
                  ? 'Select an exam category to start practicing immediately.' 
                  : 'Sign in to access over 40,000+ verified NCLEX and nursing questions.'}
              </p>
            </div>
            <button 
              onClick={handleViewAllClick} 
              className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700 cursor-pointer transition-colors self-start sm:self-auto group"
            >
              {isLoggedIn ? (
                <>
                  View all exams <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-1 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  Sign in to view all <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'NCLEX-RN', count: '12,500+ Questions', color: 'bg-blue-100 text-blue-700' },
              { name: 'NCLEX-PN', count: '8,200+ Questions', color: 'bg-indigo-100 text-indigo-700' },
              { name: 'TEAS 7', count: '5,400+ Questions', color: 'bg-purple-100 text-purple-700' },
              { name: 'HESI A2', count: '6,100+ Questions', color: 'bg-emerald-100 text-emerald-700' },
              { name: 'NCK', count: '3,000+ Questions', color: 'bg-rose-100 text-rose-700' },
              { name: 'ATI TEAS', count: '4,500+ Questions', color: 'bg-amber-100 text-amber-700' }
            ].map((exam) => (
              <Card 
                key={exam.name} 
                onClick={() => handleExamClick(exam.name)}
                className="hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group border-slate-200 relative overflow-hidden"
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${exam.color}`}>
                      Featured
                    </div>
                    {isLoggedIn ? (
                      <BookOpen className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    ) : (
                      <div className="flex items-center gap-1 text-slate-400 group-hover:text-blue-600 transition-colors">
                        <Lock className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{exam.name}</h3>
                  <p className="text-slate-500 text-sm mb-4">{exam.count}</p>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-semibold">
                    {isLoggedIn ? (
                      <span className="text-blue-600 flex items-center gap-1 group-hover:underline">
                        Start Practice <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-1 group-hover:text-blue-600">
                        <Lock className="w-3.5 h-3.5" /> Sign in to Practice
                      </span>
                    )}
                    <span className="text-slate-400 font-normal">NextGen Ready</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto text-center">
           <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-12">Why Choose Nurse Prep?</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-medical-green-100 text-medical-green-600 flex items-center justify-center mb-6">
                  <Brain className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Custom Exam Generator</h3>
                <p className="text-slate-600 text-center leading-relaxed">
                  Create customized, randomized practice tests instantly. Our system ensures you never see the exact same exam twice.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center mb-6">
                  <Target className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Targeted Analytics</h3>
                <p className="text-slate-600 text-center leading-relaxed">
                  Identify your weak areas instantly. Our dashboard tracks your performance across all nursing domains to focus your study.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-accent-orange-100 text-accent-orange-600 flex items-center justify-center mb-6">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Expert Explanations</h3>
                <p className="text-slate-600 text-center leading-relaxed">
                  Detailed rationales for both correct and incorrect options, helping you understand the "why" behind every answer.
                </p>
              </div>
           </div>
        </div>
      </section>

      {/* Testimonial Carousel Section */}
      <TestimonialCarousel />

      {/* Pricing CTA */}
      <section className="py-20 px-6 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto bg-slate-900 rounded-3xl p-8 md:p-12 text-center text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600 rounded-full blur-3xl opacity-20 translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-medical-green-500 rounded-full blur-3xl opacity-20 -translate-x-1/2 translate-y-1/2"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">Ready to pass on your first try?</h2>
            <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of students who have successfully passed their licensure exams using Nurse Prep.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto bg-medical-green-500 hover:bg-medical-green-600 text-white border-none shadow-lg shadow-medical-green-500/25">
                  Create Free Account
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-white border-slate-700 hover:bg-slate-800">
                  View Pricing Plans
                </Button>
              </Link>
            </div>
            
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-medical-green-500" /> No credit card required for free tier</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-medical-green-500" /> Cancel anytime</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
