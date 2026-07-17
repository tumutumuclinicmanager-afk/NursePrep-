import React from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { BookOpen, Target, Brain, Award, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="px-6 py-16 md:py-24 lg:py-32 bg-gradient-to-br from-primary-900 to-primary-700 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160550-2173ff9e5ee5?q=80&w=2069&auto=format&fit=crop')] mix-blend-overlay opacity-10 bg-cover bg-center"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Master Your Nursing Exams with Expert Preparation
          </h1>
          <p className="text-lg md:text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
            Comprehensive study materials, intelligent quiz generation, and realistic mock exams for NCLEX, TEAS, HESI, and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto bg-accent-orange-500 hover:bg-accent-orange-600 text-white border-none">
                Start Learning for Free
              </Button>
            </Link>
            <Link to="/exams">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-white border-white/30 hover:bg-white/10">
                Explore Exam Bank
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Exams Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Popular Exams</h2>
              <p className="text-slate-500">Trusted by thousands of nursing students globally.</p>
            </div>
            <Link to="/exams" className="hidden sm:flex items-center text-primary-600 font-medium hover:text-primary-700">
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
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
              <Card key={exam.name} className="hover:shadow-md transition-shadow cursor-pointer group border-slate-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${exam.color}`}>
                      Featured
                    </div>
                    <BookOpen className="w-5 h-5 text-slate-400 group-hover:text-primary-500 transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{exam.name}</h3>
                  <p className="text-slate-500 text-sm mb-4">{exam.count}</p>
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 w-1/3"></div>
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
