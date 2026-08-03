import React from 'react';
import { StudyAssistant } from '@/components/StudyAssistant';
import { BrainCircuit, Sparkles, BookOpen, Target, Lightbulb, ShieldCheck } from 'lucide-react';

export default function StudyAssistantPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 rounded-2xl border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>NCLEX-RN Next-Gen AI Tutor</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Smart AI Study Assistant
            </h1>
            <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
              Powered by Gemini 3.6 Flash. Ask complex clinical nursing questions, generate custom NCLEX study flashcards, request memory mnemonics, or review Saunders-aligned rationale breakdowns.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 border border-slate-700/80 px-3 py-2 rounded-xl flex items-center gap-2 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-white text-[11px]">Saunders & NGN Aligned</p>
                <p className="text-[10px] text-slate-400">Clinical Judgment Model</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Study Assistant Studio Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <StudyAssistant mode="full" />
        </div>

        {/* Side Tips & Quick Guide */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              How to Prompt Your AI Tutor
            </h3>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                <p className="font-bold text-slate-800">1. Priority Nursing Interventions</p>
                <p className="text-slate-500 text-[11px]">
                  "A client with severe asthma exacerbation has oxygen saturation 88%. What is the priority nursing action?"
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                <p className="font-bold text-slate-800">2. Pharmacology Mnemonics</p>
                <p className="text-slate-500 text-[11px]">
                  "Give me a easy mnemonic to memorize ACE Inhibitor side effects and nursing precautions."
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                <p className="font-bold text-slate-800">3. Lab Value Rationale</p>
                <p className="text-slate-500 text-[11px]">
                  "Why does hypokalemia increase the risk of Digoxin toxicity in heart failure patients?"
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100 text-slate-800 space-y-2">
            <h4 className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-blue-600" />
              NCLEX Test-Taking Tip
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Always look for "assess first before calling the provider" unless the scenario indicates immediate life-threatening compromise (ABCs).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
