import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Search, Filter, BookOpen, Activity, HeartPulse, Brain, Baby, 
  ArrowRight, DollarSign, ShoppingCart, Folder, FolderOpen, 
  ChevronRight, ChevronDown, ChevronLeft, ChevronUp, Clock, HelpCircle, CheckCircle, 
  Award, Grid, List, Play, Tag, Layers, RefreshCw, X, AlertCircle, Database,
  Bookmark, BookmarkCheck, Trash2, Star, Lock, Crown, ShieldCheck, Calculator, GripVertical,
  Maximize2, Minimize2, ShieldAlert, RotateCcw, Plus, Edit
} from 'lucide-react';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, where, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ALL_QUIZ_QUESTIONS, normalizeExamCategory, ALL_EXAM_TYPES, ENTRANCE_EXAMS, NURSING_EXAMS, EXIT_EXAMS, sortExamCategories, POPULAR_EXAM_ORDER } from '@/data/quizQuestions';
import { normalizeQuestion } from '@/lib/utils';
import { useTrialCountdown, setSimulatedTrialExpired } from '@/lib/trialManager';
import { TrialExpiredExamLock } from '@/components/TrialExpiredExamLock';
import { setExamFocusMode } from '@/lib/examFocusMode';
import { ExamEditorModal } from '@/components/admin/ExamEditorModal';

const clinicalDomains = [
  'All Specialties',
  'Medical-Surgical Nursing',
  'Maternal & Newborn Health',
  'Pediatric Nursing',
  'Pharmacology & Parenteral Therapies',
  'Psychiatric & Mental Health',
  'Community & Public Health',
  'Nursing Fundamentals'
];

interface ExamItem {
  id: string;
  title: string;
  category: string; // NCK, NCLEX, HESI, GED, or custom categories
  domain: string; // Medical-Surgical, Pediatrics, etc.
  price: string;
  numericPrice: number;
  questionCount: number;
  durationMinutes: number;
  difficulty: 'Beginner' | 'Medium' | 'Advanced';
  isPremium: boolean;
  features: string[];
  icon: any;
  color: string;
  bg: string;
  questions?: any[];
  requiredPlan?: 'free' | 'basic' | 'gold' | 'platinum';
  questionLimits?: {
    free: number;
    basic: number;
    gold: number;
    platinum: number;
  };
  isPublished?: boolean;
}

export interface ProminentExamMeta {
  isProminent: boolean;
  brand: 'ati' | 'hesi' | 'nclex' | 'examplify' | 'other';
  titleColor: string;
  pillStyle: string;
  badgeBg: string;
  cardBg: string;
  cardBorder: string;
  accentBadge: string;
}

export function getProminentExamMeta(text?: string): ProminentExamMeta {
  if (!text) {
    return {
      isProminent: false,
      brand: 'other',
      titleColor: 'text-slate-800',
      pillStyle: 'bg-slate-100 text-slate-700 border-slate-200 font-bold',
      badgeBg: 'bg-slate-100 text-slate-600 border-slate-200',
      cardBg: 'bg-white hover:bg-slate-50/80',
      cardBorder: 'border-slate-200 hover:border-blue-300',
      accentBadge: 'Curriculum'
    };
  }
  const t = text.toUpperCase();
  // 1. ATI TEAS and ATI suite - Prominent Honey Amber / Orange
  if (t.includes('ATI') || t.includes('TEAS')) {
    return {
      isProminent: true,
      brand: 'ati',
      titleColor: 'text-amber-700',
      pillStyle: 'bg-amber-100 text-amber-900 border-amber-300 font-black shadow-2xs',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
      cardBg: 'bg-amber-50/50 hover:bg-amber-50/90',
      cardBorder: 'border-amber-300/90 hover:border-amber-400',
      accentBadge: 'ATI Prep'
    };
  }
  // 2. HESI A2 and HESI suite - Prominent Crimson / Rose
  if (t.includes('HESI')) {
    return {
      isProminent: true,
      brand: 'hesi',
      titleColor: 'text-rose-700',
      pillStyle: 'bg-rose-100 text-rose-900 border-rose-300 font-black shadow-2xs',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
      cardBg: 'bg-rose-50/50 hover:bg-rose-50/90',
      cardBorder: 'border-rose-300/90 hover:border-rose-400',
      accentBadge: 'HESI Suite'
    };
  }
  // 3. NCLEX-RN and NCLEX-PN - Prominent Electric Royal Blue
  if (t.includes('NCLEX')) {
    return {
      isProminent: true,
      brand: 'nclex',
      titleColor: 'text-blue-700',
      pillStyle: 'bg-blue-100 text-blue-900 border-blue-300 font-black shadow-2xs',
      badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
      cardBg: 'bg-blue-50/50 hover:bg-blue-50/90',
      cardBorder: 'border-blue-300/90 hover:border-blue-400',
      accentBadge: 'NCLEX Board'
    };
  }
  // 4. Examplify (ExamSoft) suite - Prominent Deep Purple / Violet
  if (t.includes('EXAMPLIFY') || t.includes('EXAMSOFT')) {
    return {
      isProminent: true,
      brand: 'examplify',
      titleColor: 'text-purple-700',
      pillStyle: 'bg-purple-100 text-purple-900 border-purple-300 font-black shadow-2xs',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
      cardBg: 'bg-purple-50/50 hover:bg-purple-50/90',
      cardBorder: 'border-purple-300/90 hover:border-purple-400',
      accentBadge: 'Examplify'
    };
  }
  return {
    isProminent: false,
    brand: 'other',
    titleColor: 'text-slate-800',
    pillStyle: 'bg-slate-100 text-slate-700 border-slate-200 font-bold',
    badgeBg: 'bg-slate-100 text-slate-600 border-slate-200',
    cardBg: 'bg-white hover:bg-slate-50/80',
    cardBorder: 'border-slate-200 hover:border-blue-300',
    accentBadge: 'General'
  };
}

const defaultExamBundles: ExamItem[] = [
  // ================= ENTRANCE EXAMS =================
  { 
    id: 'ati-teas-mastery', 
    title: 'ATI TEAS 7 Entrance Mastery Prep', 
    category: 'ATI TEAS', 
    domain: 'Nursing Fundamentals', 
    price: 'Free Access', 
    numericPrice: 0, 
    questionCount: 80, 
    durationMinutes: 90, 
    difficulty: 'Medium', 
    isPremium: false, 
    features: ['Reading & Science Breakdown', 'Math & Chemistry Practice', 'Full Diagnostic Analysis'], 
    icon: BookOpen, 
    color: 'text-amber-600', 
    bg: 'bg-amber-100',
    requiredPlan: 'free',
    questionLimits: { free: 10, basic: 40, gold: 0, platinum: 0 }
  },
  { 
    id: 'hesi-a2-entrance', 
    title: 'HESI A2 Admission Assessment Package', 
    category: 'HESI A2', 
    domain: 'Nursing Fundamentals', 
    price: 'Basic Plan Required', 
    numericPrice: 15000, 
    questionCount: 120, 
    durationMinutes: 120, 
    difficulty: 'Medium', 
    isPremium: true, 
    features: ['Anatomy & Physiology Modules', 'Vocabulary & Grammar', 'Math Conversions'], 
    icon: HeartPulse, 
    color: 'text-rose-600', 
    bg: 'bg-rose-100',
    requiredPlan: 'basic',
    questionLimits: { free: 5, basic: 30, gold: 0, platinum: 0 }
  },
  { 
    id: 'accuplacer-prep', 
    title: 'ACCUPLACER Pre-Nursing Diagnostics', 
    category: 'ACCUPLACER', 
    domain: 'Nursing Fundamentals', 
    price: 'Free Access', 
    numericPrice: 0, 
    questionCount: 50, 
    durationMinutes: 60, 
    difficulty: 'Beginner', 
    isPremium: false, 
    features: ['Quantitative Reasoning', 'Reading Comprehension', 'Sentence Skills'], 
    icon: Brain, 
    color: 'text-teal-600', 
    bg: 'bg-teal-100',
    requiredPlan: 'free',
    questionLimits: { free: 10, basic: 25, gold: 0, platinum: 0 }
  },
  { 
    id: 'ged-prep-1', 
    title: 'GED Science & Pre-Nursing Foundations', 
    category: 'GED', 
    domain: 'Nursing Fundamentals', 
    price: 'Free Access', 
    numericPrice: 0, 
    questionCount: 40, 
    durationMinutes: 50, 
    difficulty: 'Beginner', 
    isPremium: false, 
    features: ['Human Biology Concepts', 'Scientific Reasoning', 'Interactive Quizzes'], 
    icon: BookOpen, 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-100',
    requiredPlan: 'free',
    questionLimits: { free: 5, basic: 25, gold: 0, platinum: 0 },
    questions: [
      {
        question: 'Which cellular organelle is primarily responsible for ATP energy production during aerobic respiration?',
        options: ['Ribosome', 'Mitochondria', 'Golgi apparatus', 'Endoplasmic reticulum'],
        correctAnswer: 'Mitochondria',
        explanation: 'Mitochondria generate cellular energy (ATP) through electron transport and the Krebs cycle.'
      }
    ]
  },
  { 
    id: 'hiset-prep', 
    title: 'HISET Academic Competency Mock Exam', 
    category: 'HISET', 
    domain: 'Nursing Fundamentals', 
    price: 'Free Access', 
    numericPrice: 0, 
    questionCount: 45, 
    durationMinutes: 60, 
    difficulty: 'Beginner', 
    isPremium: false, 
    features: ['High School Equivalency', 'Science & Logic', 'College Preparedness'], 
    icon: Activity, 
    color: 'text-cyan-600', 
    bg: 'bg-cyan-100',
    requiredPlan: 'free',
    questionLimits: { free: 5, basic: 25, gold: 0, platinum: 0 }
  },

  // ================= NURSING SCHOOL & BOARD EXAMS =================
  { 
    id: 'nck-medsurg-1', 
    title: 'NCK Medical-Surgical Mastery Mock', 
    category: 'NCK', 
    domain: 'Medical-Surgical Nursing', 
    price: 'Free Access', 
    numericPrice: 0, 
    questionCount: 100, 
    durationMinutes: 120, 
    difficulty: 'Medium', 
    isPremium: false, 
    features: ['NCK Blueprint Aligned', 'Comprehensive Rationales', 'Performance Breakdown'], 
    icon: Activity, 
    color: 'text-purple-600', 
    bg: 'bg-purple-100',
    requiredPlan: 'free',
    questionLimits: { free: 10, basic: 50, gold: 0, platinum: 0 }
  },
  { 
    id: 'nclex-rn-nextgen-1', 
    title: 'NCLEX-RN NextGen Clinical Judgment Set', 
    category: 'NCLEX-RN', 
    domain: 'Pharmacology & Parenteral Therapies', 
    price: 'Free Access', 
    numericPrice: 0, 
    questionCount: 50, 
    durationMinutes: 60, 
    difficulty: 'Advanced', 
    isPremium: false, 
    features: ['Bowtie Matrix Questions', 'Case Study Exhibits', 'Instant Rationale Feedback'], 
    icon: Brain, 
    color: 'text-blue-600', 
    bg: 'bg-blue-100',
    requiredPlan: 'free',
    questionLimits: { free: 5, basic: 25, gold: 0, platinum: 0 },
    questions: [
      {
        question: 'A nurse is caring for a patient experiencing acute anaphylaxis following intravenous antibiotic administration. Which medication should the nurse prepare to administer immediately?',
        options: ['Diphenhydramine 50 mg IV', 'Epinephrine 0.3 mg IM', 'Methylprednisolone 125 mg IV', 'Albuterol nebulizer 2.5 mg'],
        correctAnswer: 'Epinephrine 0.3 mg IM',
        explanation: 'Epinephrine intramuscularly (IM) into the anterolateral thigh is the first-line treatment for anaphylaxis to counteract broncho-constriction and systemic vasodilation.'
      },
      {
        question: 'Which assessment finding requires immediate intervention in a patient 2 hours post-thyroidectomy?',
        options: ['Mild incisional pain (3/10)', 'Stridor and noisy breathing', 'Serosanguinous dressing drainage', 'Hoarseness when speaking'],
        correctAnswer: 'Stridor and noisy breathing',
        explanation: 'Stridor indicates upper airway obstruction secondary to laryngeal edema or recurrent laryngeal nerve damage, requiring immediate emergency airway protection.'
      },
      {
        question: 'A client with heart failure is prescribed furosemide 40 mg PO daily. Which serum laboratory value should the nurse monitor most closely?',
        options: ['Serum Sodium', 'Serum Potassium', 'Blood Urea Nitrogen', 'Serum Calcium'],
        correctAnswer: 'Serum Potassium',
        explanation: 'Furosemide is a loop diuretic that causes potassium wasting, increasing the risk for severe hypokalemia and cardiac dysrhythmias.'
      }
    ]
  },
  { 
    id: 'nclex-pn-mastery', 
    title: 'NCLEX-PN Practical Nursing Licensure Set', 
    category: 'NCLEX-PN', 
    domain: 'Medical-Surgical Nursing', 
    price: 'Free Access', 
    numericPrice: 0, 
    questionCount: 60, 
    durationMinutes: 75, 
    difficulty: 'Medium', 
    isPremium: false, 
    features: ['LPN Scope of Practice', 'Basic Care & Comfort', 'Safe Medication Administration'], 
    icon: ShieldCheck, 
    color: 'text-indigo-600', 
    bg: 'bg-indigo-100',
    requiredPlan: 'free',
    questionLimits: { free: 10, basic: 30, gold: 0, platinum: 0 }
  },
  { 
    id: 'ati-rn-modular', 
    title: 'ATI RN Pharmacology & MedSurg Modular Test', 
    category: 'ATI RN', 
    domain: 'Pharmacology & Parenteral Therapies', 
    price: 'Basic Plan Required', 
    numericPrice: 12000, 
    questionCount: 90, 
    durationMinutes: 100, 
    difficulty: 'Advanced', 
    isPremium: true, 
    features: ['ATI Nursing Aligned', 'Focused Remediation', 'Detailed Score Reports'], 
    icon: BookOpen, 
    color: 'text-orange-600', 
    bg: 'bg-orange-100',
    requiredPlan: 'basic',
    questionLimits: { free: 5, basic: 30, gold: 0, platinum: 0 }
  },
  { 
    id: 'ati-lpn-modular', 
    title: 'ATI LPN Fundamentals & Practical Nursing', 
    category: 'ATI LPN', 
    domain: 'Nursing Fundamentals', 
    price: 'Free Access', 
    numericPrice: 0, 
    questionCount: 65, 
    durationMinutes: 75, 
    difficulty: 'Medium', 
    isPremium: false, 
    features: ['ATI Practical Nursing', 'Essential Skills', 'Instant Explanations'], 
    icon: BookOpen, 
    color: 'text-amber-700', 
    bg: 'bg-amber-50',
    requiredPlan: 'free',
    questionLimits: { free: 10, basic: 30, gold: 0, platinum: 0 }
  },
  { 
    id: 'hesi-rn-specialty', 
    title: 'HESI RN Specialty Practice Pack', 
    category: 'HESI RN', 
    domain: 'Pediatric Nursing', 
    price: 'Basic Plan Required', 
    numericPrice: 18000, 
    questionCount: 75, 
    durationMinutes: 90, 
    difficulty: 'Medium', 
    isPremium: true, 
    features: ['HESI Curriculum Aligned', 'Growth & Development', 'Dosage Calculation'], 
    icon: Baby, 
    color: 'text-rose-600', 
    bg: 'bg-rose-100',
    requiredPlan: 'basic',
    questionLimits: { free: 5, basic: 25, gold: 0, platinum: 0 },
    questions: [
      {
        question: 'An infant with tetralogy of Fallot experiences a hypercyanotic "tet" spell while crying. What is the nurse\'s primary immediate action?',
        options: ['Administer high-flow oxygen via mask', 'Place the infant in a knee-to-chest position', 'Notify the pediatric cardiologist', 'Start an IV access line'],
        correctAnswer: 'Place the infant in a knee-to-chest position',
        explanation: 'Knee-to-chest positioning increases systemic vascular resistance, reducing right-to-left shunting and promoting pulmonary blood flow.'
      }
    ]
  },
  { 
    id: 'hesi-lpn-specialty', 
    title: 'HESI LPN Practical Nursing Mastery', 
    category: 'HESI LPN', 
    domain: 'Medical-Surgical Nursing', 
    price: 'Free Access', 
    numericPrice: 0, 
    questionCount: 55, 
    durationMinutes: 70, 
    difficulty: 'Medium', 
    isPremium: false, 
    features: ['Practical Nursing Specialty', 'Clinical Vignettes', 'Step-by-Step Rationales'], 
    icon: HeartPulse, 
    color: 'text-pink-600', 
    bg: 'bg-pink-100',
    requiredPlan: 'free',
    questionLimits: { free: 5, basic: 25, gold: 0, platinum: 0 }
  },
  { 
    id: 'examplify-rn-coursework', 
    title: 'Examplify RN Coursework & In-School Exam', 
    category: 'Examplify RN', 
    domain: 'Maternal & Newborn Health', 
    price: 'Gold Plan Required', 
    numericPrice: 20000, 
    questionCount: 85, 
    durationMinutes: 100, 
    difficulty: 'Advanced', 
    isPremium: true, 
    features: ['ExamSoft / Examplify Style', 'Timer Simulation', 'Faculty Authored'], 
    icon: Layers, 
    color: 'text-violet-600', 
    bg: 'bg-violet-100',
    requiredPlan: 'gold',
    questionLimits: { free: 5, basic: 25, gold: 0, platinum: 0 }
  },
  { 
    id: 'examplify-lpn-coursework', 
    title: 'Examplify LPN Clinical Practice Exam', 
    category: 'Examplify LPN', 
    domain: 'Community & Public Health', 
    price: 'Free Access', 
    numericPrice: 0, 
    questionCount: 50, 
    durationMinutes: 60, 
    difficulty: 'Medium', 
    isPremium: false, 
    features: ['ExamSoft Practical Format', 'Community Health', 'Clear Diagnostics'], 
    icon: Layers, 
    color: 'text-purple-600', 
    bg: 'bg-purple-100',
    requiredPlan: 'free',
    questionLimits: { free: 5, basic: 25, gold: 0, platinum: 0 }
  },

  // ================= EXIT EXAMS =================
  { 
    id: 'ati-exit-comprehensive', 
    title: 'ATI Comprehensive Predictor Exit Exam Mock', 
    category: 'ATI Exit Exam', 
    domain: 'Medical-Surgical Nursing', 
    price: 'Gold Plan Required', 
    numericPrice: 25000, 
    questionCount: 180, 
    durationMinutes: 210, 
    difficulty: 'Advanced', 
    isPremium: true, 
    features: ['99% NCLEX Predictor Score', 'All ATI Modular Topics', 'Comprehensive Focused Review'], 
    icon: Crown, 
    color: 'text-amber-600', 
    bg: 'bg-amber-100',
    requiredPlan: 'gold',
    questionLimits: { free: 5, basic: 20, gold: 0, platinum: 0 }
  },
  { 
    id: 'hesi-exit-rn-lpn', 
    title: 'HESI Exit RN/LPN Graduation Assessment', 
    category: 'HESI Exit Exam', 
    domain: 'Critical Care & Emergency Nursing', 
    price: 'Gold Plan Required', 
    numericPrice: 25000, 
    questionCount: 160, 
    durationMinutes: 180, 
    difficulty: 'Advanced', 
    isPremium: true, 
    features: ['HESI Conversion Score', 'Exit Threshold Benchmarking', 'Remediation Pack'], 
    icon: HeartPulse, 
    color: 'text-rose-700', 
    bg: 'bg-rose-100',
    requiredPlan: 'gold',
    questionLimits: { free: 5, basic: 20, gold: 0, platinum: 0 }
  },
  { 
    id: 'examplify-exit-simulation', 
    title: 'Examplify Nursing Program Exit Simulation', 
    category: 'Examplify Exit Exam', 
    domain: 'Nursing Fundamentals & Leadership', 
    price: 'Gold Plan Required', 
    numericPrice: 22000, 
    questionCount: 150, 
    durationMinutes: 180, 
    difficulty: 'Advanced', 
    isPremium: true, 
    features: ['Final Graduation Barrier Exam', 'ExamSoft Environment Simulation', 'Comprehensive Blueprint'], 
    icon: ShieldCheck, 
    color: 'text-indigo-700', 
    bg: 'bg-indigo-100',
    requiredPlan: 'gold',
    questionLimits: { free: 5, basic: 20, gold: 0, platinum: 0 }
  }
];

interface FavoriteItem {
  docId: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  category?: string;
  domain?: string;
  savedAt?: string;
}

const PLAN_LEVELS: Record<string, number> = {
  free: 1,
  basic: 2,
  gold: 3,
  platinum: 4
};

const EXAM_TYPE_CATEGORIES: Record<string, string[]> = {
  'ATI TEAS': ['Reading & Comprehension', 'Mathematics & Algebra', 'Science (A&P, Biology, Chemistry)', 'English & Language Usage'],
  'HESI A2': ['Anatomy & Physiology', 'Reading Comprehension', 'Vocabulary & General Knowledge', 'Mathematics', 'Grammar'],
  'NCLEX-RN': ['Medical-Surgical Nursing', 'Pharmacology & Parenteral Therapies', 'Maternal & Newborn Health', 'Pediatric Nursing', 'Psychiatric & Mental Health', 'Community & Public Health', 'Nursing Fundamentals'],
  'NCLEX-PN': ['Basic Care & Comfort', 'Management of Care', 'Pharmacological & Parenteral Therapies', 'Reduction of Risk Potential', 'Psychosocial Integrity'],
  'NCK': ['Nursing Fundamentals', 'Medical-Surgical Nursing', 'Community & Public Health', 'Pharmacology'],
  'ATI RN': ['Custom', 'Fundamentals', 'Paediatric Nursing', 'Maternal Newborn', 'Pharmacology', 'Medsurg', 'Management', 'Leadership', 'Health Assessment', 'Dosage Calculation'],
  'ATI LPN': ['Custom', 'Fundamentals', 'Paediatric Nursing', 'Maternal Newborn', 'Pharmacology', 'Medsurg', 'Management', 'Leadership', 'Health Assessment', 'Dosage Calculation'],
  'HESI RN': ['Pediatrics', 'Maternal-Newborn', 'Med-Surg', 'Critical Care', 'Pharmacology'],
  'HESI LPN': ['Practical Nursing Fundamentals', 'Med-Surg', 'Pharmacology', 'Mental Health'],
  'Examplify RN': ['Coursework & In-School Exam', 'Advanced Clinicals', 'Pharmacology', 'Leadership'],
  'Examplify LPN': ['Clinical Practice', 'Fundamentals', 'Med-Surg'],
  'ATI Exit Exam': ['Comprehensive Predictor', 'Critical Care', 'Leadership', 'Pharmacology'],
  'HESI Exit Exam': ['Graduation Assessment', 'Conversion Score', 'Remediation'],
  'Examplify Exit Exam': ['Final Graduation Barrier Exam', 'Simulation & Blueprint'],
  'ACCUPLACER': ['Quantitative Reasoning', 'Reading Comprehension', 'Sentence Skills'],
  'GED': ['Human Biology & Science', 'Scientific Reasoning', 'Quantitative Skills'],
  'HISET': ['Science & Logic', 'Academic Competency', 'College Preparedness']
};

export default function ExamBank() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedExamGroup, setSelectedExamGroup] = useState<'All' | 'Entrance Exams' | 'Nursing Exams' | 'Exit Exams'>('All');
  const [selectedBoard, setSelectedBoard] = useState('All');
  const [selectedExamTypePage, setSelectedExamTypePage] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState('All Specialties');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'classified' | 'grid' | 'favorites'>('classified');
  
  // State for student subscription
  const [userSubscriptionPlan, setUserSubscriptionPlan] = useState<'free' | 'basic' | 'gold' | 'platinum'>('free');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<'All' | 'My Plan Access' | 'free' | 'basic' | 'gold' | 'platinum'>('All');
  const [requiredPlanModalExam, setRequiredPlanModalExam] = useState<ExamItem | null>(null);
  const [practiceLimitInfo, setPracticeLimitInfo] = useState<{ limit: number; total: number } | null>(null);

  // Sync with searchParams from URL (e.g., from Dashboard categories snapshot)
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const boardParam = searchParams.get('board');
    const searchParam = searchParams.get('search');

    if (boardParam) {
      setSelectedBoard(boardParam);
      setSelectedExamGroup('All');
      setSelectedExamTypePage(null);
    } else if (categoryParam) {
      const catLower = categoryParam.toLowerCase().trim();
      setSelectedExamGroup('All');
      setSelectedDomain('All Specialties');
      setSelectedDifficulty('All');
      setSearchQuery('');

      if (catLower.includes('hesi')) {
        setSelectedExamTypePage('HESI A2');
        setSelectedBoard('HESI A2');
      } else if (catLower.includes('teas') || catLower.includes('ati')) {
        setSelectedExamTypePage('ATI TEAS');
        setSelectedBoard('ATI TEAS');
      } else if (catLower.includes('nclex')) {
        setSelectedExamTypePage('NCLEX-RN');
        setSelectedBoard('NCLEX-RN');
      } else if (catLower.includes('examplify')) {
        setSelectedExamTypePage('Examplify RN');
        setSelectedBoard('Examplify RN');
      } else {
        setSelectedExamTypePage(categoryParam);
        setSelectedBoard(categoryParam);
      }
    } else if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [searchParams]);

  // 14-Day Free Trial hook
  const { trial, loading: trialLoading, refreshTrial } = useTrialCountdown(auth.currentUser);

  useEffect(() => {
    if (trial.isPaid && trial.plan) {
      setUserSubscriptionPlan(trial.plan as any);
    }
  }, [trial.isPaid, trial.plan]);

  // State for dynamic board categories
  const [dynamicBoardCategories, setDynamicBoardCategories] = useState<string[]>(sortExamCategories([...ALL_EXAM_TYPES]));

  // Calculator state
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcInput, setCalcInput] = useState('0');
  const [calcPrevInput, setCalcPrevInput] = useState<string | null>(null);
  const [calcOperation, setCalcOperation] = useState<string | null>(null);

  const handleCalcNum = (num: string) => {
    if (calcInput === '0' || calcInput.startsWith('Drip:') || calcInput.startsWith('BMI:')) {
      setCalcInput(num);
    } else {
      setCalcInput(prev => prev + num);
    }
  };

  const handleCalcClear = () => {
    setCalcInput('0');
    setCalcPrevInput(null);
    setCalcOperation(null);
  };

  const handleCalcDel = () => {
    if (calcInput.length <= 1 || calcInput.startsWith('Drip:') || calcInput.startsWith('BMI:')) {
      setCalcInput('0');
    } else {
      setCalcInput(prev => prev.slice(0, -1));
    }
  };

  const handleCalcPercent = () => {
    try {
      const val = parseFloat(calcInput);
      setCalcInput((val / 100).toString());
    } catch {
      setCalcInput('Error');
    }
  };

  const handleCalcOp = (op: string) => {
    setCalcPrevInput(calcInput);
    setCalcOperation(op);
    setCalcInput('0');
  };

  const handleCalcEquals = () => {
    if (calcPrevInput === null || calcOperation === null) return;
    try {
      const prev = parseFloat(calcPrevInput);
      const current = parseFloat(calcInput);
      let res = 0;
      switch (calcOperation) {
        case '+': res = prev + current; break;
        case '-': res = prev - current; break;
        case '*': res = prev * current; break;
        case '/': res = current !== 0 ? prev / current : 0; break;
        default: return;
      }
      setCalcInput(res.toString());
      setCalcPrevInput(null);
      setCalcOperation(null);
    } catch {
      setCalcInput('Error');
    }
  };

  // Helper for tracking admin deleted exams across sample data and Firestore
  const getDeletedExamIds = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem('nurseprep_deleted_exams') || '[]');
    } catch {
      return [];
    }
  };

  // State for Firestore loaded exams
  const [examsList, setExamsList] = useState<ExamItem[]>(() => {
    try {
      const deletedIds = JSON.parse(localStorage.getItem('nurseprep_deleted_exams') || '[]');
      const editedMap = JSON.parse(localStorage.getItem('nurseprep_custom_edited_exams') || '{}');
      return defaultExamBundles
        .filter(b => !deletedIds.includes(b.id))
        .map(b => editedMap[b.id] ? { ...b, ...editedMap[b.id] } : b);
    } catch {
      return defaultExamBundles;
    }
  });
  const [loadingDb, setLoadingDb] = useState(false);
  const [dbQuestionsCount, setDbQuestionsCount] = useState(0);

  // Admin testing mode detection
  const [isAdminUser, setIsAdminUser] = useState<boolean>(() => {
    const role = localStorage.getItem('userRole');
    const email = auth.currentUser?.email || '';
    return role === 'admin' || role === 'staff' || email === 'wangechigodfrey77@gmail.com' || window.location.search.includes('admin') || localStorage.getItem('nurseprep_test_admin_mode') === 'true';
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        const role = localStorage.getItem('userRole');
        if (role === 'admin' || role === 'staff' || user.email === 'wangechigodfrey77@gmail.com') {
          setIsAdminUser(true);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Admin edit entire exam state
  const [editingExamItem, setEditingExamItem] = useState<ExamItem | null>(null);

  const handleAdminEditExam = (exam: ExamItem, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setEditingExamItem(exam);
  };

  const handleSaveEditedExam = (updatedExamData: any) => {
    setExamsList(prev => {
      const exists = prev.some(e => e.id === updatedExamData.id);
      if (exists) {
        return prev.map(e => e.id === updatedExamData.id ? { ...e, ...updatedExamData } : e);
      } else {
        return [updatedExamData, ...prev];
      }
    });
    setFavoriteToast(`Exam "${updatedExamData.title}" updated successfully.`);
    setTimeout(() => setFavoriteToast(null), 4000);
  };

  // Admin delete exam handler
  const handleAdminDeleteExam = async (exam: ExamItem, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    const confirmed = window.confirm(
      `ADMIN TESTING MODE:\n\nAre you sure you want to delete "${exam.title}" (${exam.category})?\n\nThis will remove it from the live site.`
    );
    if (!confirmed) return;

    // 1. Immediately remove from local state
    setExamsList(prev => prev.filter(ex => ex.id !== exam.id));

    // 2. Persist deleted ID so standard bundles and cached exams stay deleted
    try {
      const deleted = getDeletedExamIds();
      if (!deleted.includes(exam.id)) {
        deleted.push(exam.id);
        localStorage.setItem('nurseprep_deleted_exams', JSON.stringify(deleted));
      }
    } catch (err) {
      console.warn('Error updating deleted exams list:', err);
    }

    // 3. Delete from Firestore collection if present
    try {
      await deleteDoc(doc(db, 'exams', exam.id));
    } catch (err) {
      console.warn('Firestore doc delete note:', err);
    }

    setFavoriteToast(`Exam "${exam.title}" has been deleted.`);
    setTimeout(() => setFavoriteToast(null), 4000);
  };

  const handleResetSampleExamsAdmin = () => {
    if (!window.confirm("Restore all sample exams? This clears the test deletion history.")) return;
    localStorage.removeItem('nurseprep_deleted_exams');
    fetchAllExamsAndQuestions();
    setFavoriteToast("All default exams restored.");
    setTimeout(() => setFavoriteToast(null), 3000);
  };

  // Favorites / Bookmarks state
  const [favoritesList, setFavoritesList] = useState<FavoriteItem[]>([]);
  const [favoriteToast, setFavoriteToast] = useState<string | null>(null);
  const [noExamsModalMessage, setNoExamsModalMessage] = useState<string | null>(null);

  // Live Actual Question Counts tracking across all sources
  const [boardQuestionCounts, setBoardQuestionCounts] = useState<Record<string, number>>({
    'All': ALL_QUIZ_QUESTIONS.length
  });

  // Accordion state for classified view
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Modal states
  const [selectedBundle, setSelectedBundle] = useState<ExamItem | null>(null);
  const [mpesaRef, setMpesaRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Practice Exam Modal state
  const [practiceExam, setPracticeExam] = useState<ExamItem | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showRationale, setShowRationale] = useState<Record<number, boolean>>({});
  const [examCompleted, setExamCompleted] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());

  // Sync focus mode: pull back navigation bar when student is in practice exam
  useEffect(() => {
    if (practiceExam) {
      setExamFocusMode(true);
    } else {
      setExamFocusMode(false);
    }
    return () => {
      setExamFocusMode(false);
    };
  }, [practiceExam]);

  const toggleFlagQuestion = (idx: number) => {
    setFlaggedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  // Keyboard Arrow Shortcut Navigation
  useEffect(() => {
    if (!practiceExam || examCompleted) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowLeft') {
        setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentQuestionIndex(prev => Math.min(practiceExam.questions.length - 1, prev + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [practiceExam, examCompleted]);

  // Purchased Exams tracking for current user
  const [purchasedTitles, setPurchasedTitles] = useState<Set<string>>(new Set());

  const fetchUserPurchases = async () => {
    try {
      if (auth.currentUser) {
        const userEmail = auth.currentUser.email || auth.currentUser.uid;
        const normalizedEmail = (auth.currentUser.email || '').toLowerCase();
        
        // 1. Check localStorage cache first for immediate upgraded plan rights
        let cachedPlan = '';
        if (normalizedEmail) {
          cachedPlan = localStorage.getItem(`nurseprep_plan_${normalizedEmail}`) || '';
        }
        if (!cachedPlan) {
          cachedPlan = localStorage.getItem('nurseprep_current_user_plan') || '';
        }
        
        if (cachedPlan) {
          const plan = cachedPlan.toLowerCase();
          if (plan.includes('plat') || plan.includes('master')) setUserSubscriptionPlan('platinum');
          else if (plan.includes('gold') || plan.includes('sure')) setUserSubscriptionPlan('gold');
          else if (plan.includes('basic') || plan.includes('silver')) setUserSubscriptionPlan('basic');
          else setUserSubscriptionPlan('free');
        }

        // 2. Fetch User Plan from Firestore (by UID or email)
        try {
          let userPlanFound = '';
          const userSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userSnap.exists()) {
            const uData = userSnap.data();
            userPlanFound = (uData.subscriptionPlan || uData.plan || '').toLowerCase();
          } else if (normalizedEmail) {
            const qUser = query(collection(db, 'users'), where('email', '==', normalizedEmail));
            const uSnap = await getDocs(qUser);
            if (!uSnap.empty) {
              const uData = uSnap.docs[0].data();
              userPlanFound = (uData.subscriptionPlan || uData.plan || '').toLowerCase();
            }
          }

          if (userPlanFound) {
            const plan = userPlanFound;
            if (plan.includes('plat') || plan.includes('master')) setUserSubscriptionPlan('platinum');
            else if (plan.includes('gold') || plan.includes('sure')) setUserSubscriptionPlan('gold');
            else if (plan.includes('basic') || plan.includes('silver')) setUserSubscriptionPlan('basic');
            else setUserSubscriptionPlan('free');
            
            // Sync cache
            localStorage.setItem('nurseprep_current_user_plan', userSubscriptionPlan);
            if (normalizedEmail) {
              localStorage.setItem(`nurseprep_plan_${normalizedEmail}`, userSubscriptionPlan);
            }
          }
        } catch (uErr) {
          console.warn("Could not fetch user subscription plan:", uErr);
        }

        const q = query(collection(db, 'payments'), where('user', '==', userEmail));
        const snap = await getDocs(q);
        const titles = new Set<string>();
        snap.docs.forEach(docSnap => {
          const data = docSnap.data();
          if (data.status === 'Approved' || data.status === 'Completed') {
            if (data.plan) titles.add(data.plan);
            if (data.planName) titles.add(data.planName);
            if (data.examId) titles.add(data.examId);
          }
        });
        setPurchasedTitles(titles);
      }
    } catch (err) {
      console.error('Error fetching purchases:', err);
    }
  };

  const fetchUserFavorites = async () => {
    try {
      if (auth.currentUser) {
        const q = query(collection(db, `users/${auth.currentUser.uid}/favorites`));
        const snap = await getDocs(q);
        const favs: FavoriteItem[] = snap.docs.map(docSnap => ({
          docId: docSnap.id,
          ...docSnap.data()
        } as FavoriteItem));
        setFavoritesList(favs);
      } else {
        const localFavs = JSON.parse(localStorage.getItem('nurseprep_guest_favorites') || '[]');
        setFavoritesList(localFavs);
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
    }
  };

  const isQuestionBookmarked = (questionStem: string): boolean => {
    return favoritesList.some(f => f.question === questionStem);
  };

  const toggleBookmark = async (questionObj: any, category?: string, domain?: string) => {
    const norm = normalizeQuestion(questionObj);
    const stem = norm.question;
    const exists = isQuestionBookmarked(stem);

    if (exists) {
      const favToRemove = favoritesList.find(f => f.question === stem);
      if (auth.currentUser && favToRemove?.docId) {
        try {
          await deleteDoc(doc(db, `users/${auth.currentUser.uid}/favorites`, favToRemove.docId));
        } catch (e) {
          console.error("Error removing favorite from Firestore:", e);
        }
      }
      const updated = favoritesList.filter(f => f.question !== stem);
      setFavoritesList(updated);
      if (!auth.currentUser) {
        localStorage.setItem('nurseprep_guest_favorites', JSON.stringify(updated));
      }
      showToastNotification("Question removed from Favorites");
    } else {
      const newFav: FavoriteItem = {
        docId: `fav-${Date.now()}`,
        question: stem,
        options: norm.options,
        correctAnswer: norm.correctAnswer,
        explanation: norm.explanation,
        category: category || 'General',
        domain: domain || 'General Practice',
        savedAt: new Date().toISOString()
      };

      if (auth.currentUser) {
        try {
          const docRef = await addDoc(collection(db, `users/${auth.currentUser.uid}/favorites`), {
            question: norm.question,
            options: norm.options,
            correctAnswer: norm.correctAnswer,
            explanation: norm.explanation,
            category: category || 'General',
            domain: domain || 'General Practice',
            savedAt: new Date().toISOString()
          });
          newFav.docId = docRef.id;
        } catch (e) {
          console.error("Error saving favorite to Firestore:", e);
        }
      }

      const updated = [...favoritesList, newFav];
      setFavoritesList(updated);
      if (!auth.currentUser) {
        localStorage.setItem('nurseprep_guest_favorites', JSON.stringify(updated));
      }
      showToastNotification("Question saved to Favorites Collection!");
    }
  };

  const showToastNotification = (msg: string) => {
    setFavoriteToast(msg);
    setTimeout(() => setFavoriteToast(null), 3000);
  };

  const startFavoritesPractice = () => {
    if (favoritesList.length === 0) return;
    const favExamItem: ExamItem = {
      id: 'favorites-practice-session',
      title: 'My Saved Favorites Practice Bank',
      category: 'NCK',
      domain: 'Custom Revision',
      price: 'Free Access',
      numericPrice: 0,
      questionCount: favoritesList.length,
      durationMinutes: Math.max(15, favoritesList.length * 2),
      difficulty: 'Medium',
      isPremium: false,
      features: ['Personalized Review', 'High Priority Items', 'Self Paced'],
      icon: Bookmark,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
      questions: favoritesList.map(f => ({
        question: f.question,
        options: f.options,
        correctAnswer: f.correctAnswer,
        explanation: f.explanation
      }))
    };

    setPracticeExam(favExamItem);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowRationale({});
    setFlaggedQuestions(new Set());
    setExamCompleted(false);
  };

  // Fetch Firestore Exams AND Questions
  const fetchAllExamsAndQuestions = async () => {
    try {
      setLoadingDb(true);
      
      // 1. Fetch Firestore exams collection
      const examsSnap = await getDocs(query(collection(db, 'exams')));
      const dbExams: ExamItem[] = [];
      const examDocsQuestions: any[] = [];
      
      if (!examsSnap.empty) {
        examsSnap.docs.forEach(docSnap => {
          const data = docSnap.data();
          
          // Hide unpublished/draft exams for students
          if (data.isPublished === false) return;

          const cat = normalizeExamCategory(data.category);
          const qList = data.questions || [];
          qList.forEach((q: any) => examDocsQuestions.push({ ...q, examMode: cat }));

          const reqP = (data.requiredPlan || 'free').toLowerCase() as any;

          dbExams.push({
            id: docSnap.id,
            title: data.title || 'Custom Uploaded Exam',
            category: cat,
            domain: data.domain || 'Medical-Surgical Nursing',
            price: data.price || (reqP !== 'free' ? `${reqP.toUpperCase()} PLAN` : 'Free Access'),
            numericPrice: 0,
            questionCount: qList.length,
            durationMinutes: Math.max(15, qList.length * 2),
            difficulty: 'Medium',
            isPremium: reqP !== 'free',
            features: ['Lecturer Authored', 'Verified Questions', 'Instant Feedback'],
            icon: cat === 'NCLEX' || cat === 'NCLEX-RN' ? Brain : cat === 'HESI' ? HeartPulse : cat === 'GED' ? BookOpen : Activity,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            questions: qList,
            requiredPlan: reqP,
            questionLimits: data.questionLimits || { free: 5, basic: 25, gold: 0, platinum: 0 },
            isPublished: true
          });
        });
      }

      // 2. Fetch Firestore individual questions collection
      const questionsSnap = await getDocs(query(collection(db, 'questions')));
      const dbQuestionsList: any[] = [];
      if (!questionsSnap.empty) {
        questionsSnap.docs.forEach(docSnap => {
          const data = docSnap.data();
          dbQuestionsList.push({
            id: docSnap.id,
            ...data
          });
        });
      }

      setDbQuestionsCount(dbQuestionsList.length + examDocsQuestions.length);

      // Create dynamic practice bundles for individual Firestore questions grouped by Exam Board
      const questionsByBoard: Record<string, any[]> = {};
      dbQuestionsList.forEach(q => {
        const cat = normalizeExamCategory(q.examMode || q.category);
        if (!questionsByBoard[cat]) questionsByBoard[cat] = [];
        questionsByBoard[cat].push({
          question: q.questionStem || q.question || 'Question Stem',
          options: q.options ? q.options.map((o: any) => typeof o === 'string' ? o : o.text) : ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: q.options ? (q.options.find((o: any) => o.isCorrect)?.text || q.options[0]?.text) : 'Option A',
          explanation: q.rationale || q.explanation || ''
        });
      });

      const dynamicBoardExams: ExamItem[] = Object.entries(questionsByBoard).map(([cat, qList]) => ({
        id: `db-questions-${cat.toLowerCase().replace(/\s+/g, '-')}`,
        title: `${cat} Lecturer Published Question Bank (${qList.length} Questions)`,
        category: cat,
        domain: 'Medical-Surgical Nursing',
        price: 'Free Access',
        numericPrice: 0,
        questionCount: qList.length,
        durationMinutes: Math.max(15, qList.length * 2),
        difficulty: 'Medium',
        isPremium: false,
        features: ['Lecturer Authored', 'Live Bank Item', 'Continuous Updates'],
        icon: cat === 'NCLEX' || cat === 'NCLEX-RN' ? Brain : cat === 'HESI' ? HeartPulse : cat === 'GED' ? BookOpen : Activity,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        questions: qList,
        requiredPlan: 'free',
        questionLimits: { free: 5, basic: 25, gold: 0, platinum: 0 }
      }));

      // Merge all exam items excluding admin-deleted ones
      const deletedIds = getDeletedExamIds();
      const combinedExams = [...dbExams, ...dynamicBoardExams, ...defaultExamBundles].filter(
        ex => !deletedIds.includes(ex.id)
      );

      // Sort exams so commonly used exams (ATI TEAS, HESI A2, NCLEX, Examplify) come first
      combinedExams.sort((a, b) => {
        const catA = a.category || '';
        const catB = b.category || '';
        const idxA = POPULAR_EXAM_ORDER.indexOf(catA);
        const idxB = POPULAR_EXAM_ORDER.indexOf(catB);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.title.localeCompare(b.title);
      });

      setExamsList(combinedExams);

      // Collect all unique categories dynamically and sort with commonly used exams first
      const categorySet = new Set<string>([...ALL_EXAM_TYPES]);
      combinedExams.forEach(e => {
        if (e.category) categorySet.add(e.category);
      });
      const allCategories = sortExamCategories(Array.from(categorySet));
      setDynamicBoardCategories(allCategories);

      // Expand all categories by default
      const initialExpanded: Record<string, boolean> = {};
      allCategories.forEach(c => initialExpanded[c] = true);
      setExpandedCategories(initialExpanded);

      // Compute Exact Total Question Counts per Board Category
      const counts: Record<string, number> = { 'All': 0 };
      allCategories.forEach(c => counts[c] = 0);

      const allAggregatedQuestions = [
        ...ALL_QUIZ_QUESTIONS.map(q => ({ mode: q.examMode })),
        ...dbQuestionsList.map(q => ({ mode: q.examMode || q.category })),
        ...examDocsQuestions.map(q => ({ mode: q.examMode }))
      ];

      counts['All'] = allAggregatedQuestions.length;

      allAggregatedQuestions.forEach(item => {
        const cat = normalizeExamCategory(item.mode);
        if (counts[cat] !== undefined) {
          counts[cat]++;
        } else {
          counts[cat] = 1;
        }
      });

      setBoardQuestionCounts(counts);

    } catch (err) {
      console.error('Error fetching exams and questions:', err);
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    fetchAllExamsAndQuestions();
    fetchUserFavorites();
    fetchUserPurchases();
  }, []);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const filteredExams = examsList.filter(exam => {
    const matchesGroup = selectedExamGroup === 'All' ||
      (selectedExamGroup === 'Entrance Exams' && (ENTRANCE_EXAMS as readonly string[]).includes(exam.category)) ||
      (selectedExamGroup === 'Nursing Exams' && (NURSING_EXAMS as readonly string[]).includes(exam.category)) ||
      (selectedExamGroup === 'Exit Exams' && (EXIT_EXAMS as readonly string[]).includes(exam.category));
    const matchesBoard = selectedBoard === 'All' || exam.category === selectedBoard;
    const matchesDomain = selectedDomain === 'All Specialties' || exam.domain === selectedDomain;
    const matchesDifficulty = selectedDifficulty === 'All' || exam.difficulty === selectedDifficulty;
    
    // Subscription Plan Filter
    const reqPlan = (exam.requiredPlan || 'free').toLowerCase();
    const reqLevel = PLAN_LEVELS[reqPlan] || 1;
    const userLevel = PLAN_LEVELS[userSubscriptionPlan] || 1;

    let matchesPlanFilter = true;
    if (selectedPlanFilter === 'My Plan Access') {
      matchesPlanFilter = reqLevel <= userLevel;
    } else if (selectedPlanFilter !== 'All') {
      matchesPlanFilter = reqPlan === selectedPlanFilter;
    }

    const matchesQuery = searchQuery === '' || 
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      exam.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesGroup && matchesBoard && matchesDomain && matchesDifficulty && matchesPlanFilter && matchesQuery;
  });

  // Group filtered exams dynamically by Board Category
  const groupedExams = dynamicBoardCategories.reduce((acc, cat) => {
    const categoryExams = filteredExams.filter(e => e.category === cat);
    if (categoryExams.length > 0) {
      acc[cat] = categoryExams;
    }
    return acc;
  }, {} as Record<string, ExamItem[]>);

  const handleCategoryClick = (categoryName: string) => {
    const allExamQuestions = [...ALL_QUIZ_QUESTIONS, ...examsList.flatMap(ex => ex.questions || [])];
    
    const categoryExamBundles = examsList.filter(ex => 
      (!selectedExamTypePage || normalizeExamCategory(ex.category) === normalizeExamCategory(selectedExamTypePage)) &&
      (ex.domain?.toLowerCase().includes(categoryName.toLowerCase()) || ex.title?.toLowerCase().includes(categoryName.toLowerCase()) || ex.category?.toLowerCase().includes(categoryName.toLowerCase()))
    );

    const specificQs = allExamQuestions.filter(q => {
      const matchesBoard = !selectedExamTypePage || normalizeExamCategory(q.examMode || q.category) === normalizeExamCategory(selectedExamTypePage);
      const matchesCat = q.unitDomain?.toLowerCase().includes(categoryName.toLowerCase()) || 
                         q.category?.toLowerCase().includes(categoryName.toLowerCase()) ||
                         q.domain?.toLowerCase().includes(categoryName.toLowerCase());
      return matchesBoard && matchesCat;
    });

    const hasExams = categoryExamBundles.length > 0 || specificQs.length > 0;

    if (!hasExams) {
      setNoExamsModalMessage(`No exams or practice questions are available yet for "${categoryName}" under ${selectedExamTypePage || 'this board'}. Please check back soon or try another category.`);
      return;
    }

    const finalQs = specificQs.length > 0 ? specificQs.slice(0, 25) : categoryExamBundles.flatMap(e => e.questions || []).slice(0, 25);

    if (finalQs.length === 0) {
      setNoExamsModalMessage(`No exams or practice questions are available yet for "${categoryName}" under ${selectedExamTypePage || 'this board'}. Please check back soon or try another category.`);
      return;
    }

    const examItem: ExamItem = {
      id: `cat-${selectedExamTypePage}-${categoryName}`.toLowerCase().replace(/\s+/g, '-'),
      title: `${selectedExamTypePage || 'Exam'} - ${categoryName} Practice Module`,
      category: selectedExamTypePage || 'ATI RN',
      domain: categoryName,
      price: '$0',
      numericPrice: 0,
      questionCount: finalQs.length,
      durationMinutes: Math.max(15, finalQs.length * 2),
      difficulty: 'Medium',
      isPremium: false,
      features: ['High-yield practice', 'Detailed rationales'],
      icon: BookOpen,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      requiredPlan: 'free',
      questions: finalQs
    };

    handleAction(examItem);
  };

  const handleAction = (exam: ExamItem) => {
    const reqPlan = exam.requiredPlan || 'free';
    const reqLevel = PLAN_LEVELS[reqPlan] || 1;
    const userLevel = PLAN_LEVELS[userSubscriptionPlan] || 1;
    const hasPurchased = purchasedTitles.has(exam.title) || purchasedTitles.has(exam.id);

    // 1. Subscription Tier Gate Check (bypass if purchased)
    if (userLevel < reqLevel && !hasPurchased) {
      setRequiredPlanModalExam(exam);
      return;
    }

    // 2. Launch Practice with Question Display Limits
    const qList = exam.questions || [];
    if (qList.length === 0) {
      alert("This exam does not have questions attached yet.");
      return;
    }

    const limits = exam.questionLimits || { free: 5, basic: 25, gold: 0, platinum: 0 };
    const maxAllowed = limits[userSubscriptionPlan] ?? 0;

    let displayQuestions = [...qList];
    if (hasPurchased || userLevel >= reqLevel) {
      displayQuestions = [...qList];
      setPracticeLimitInfo(null);
    } else if (maxAllowed > 0 && maxAllowed < qList.length) {
      displayQuestions = qList.slice(0, maxAllowed);
      setPracticeLimitInfo({ limit: maxAllowed, total: qList.length });
    } else {
      setPracticeLimitInfo(null);
    }

    const initialAnswers: Record<number, any> = {};
    displayQuestions.forEach((q: any, idx: number) => {
      const isOrdering = q.questionTypeId === 'order_drag' || q.questionTypeId === 'order_numbers' || q.orderedSteps;
      if (isOrdering && q.orderedSteps) {
        initialAnswers[idx] = [...q.orderedSteps].sort(() => 0.5 - Math.random());
      }
    });

    const launchExam: ExamItem = {
      ...exam,
      questions: displayQuestions,
      questionCount: displayQuestions.length
    };

    setPracticeExam(launchExam);
    setSelectedExamTypePage(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswers(initialAnswers);
    setShowRationale({});
    setFlaggedQuestions(new Set());
    setExamCompleted(false);
  };

  // Drag and Drop state for ordering questions in ExamBank
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, stepIdx: number) => {
    setDraggedIndex(stepIdx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, questionIdx: number, targetIdx: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIdx) return;
    const q = practiceExam?.questions[questionIdx];
    const orderedList: string[] = [...(selectedAnswers[questionIdx] || q?.orderedSteps || [])];
    const [moved] = orderedList.splice(draggedIndex, 1);
    orderedList.splice(targetIdx, 0, moved);
    setSelectedAnswers(prev => ({ ...prev, [questionIdx]: orderedList }));
    setDraggedIndex(null);
  };

  const moveStep = (questionIdx: number, stepIdx: number, direction: 'up' | 'down') => {
    const q = practiceExam?.questions[questionIdx];
    const orderedList: string[] = [...(selectedAnswers[questionIdx] || q?.orderedSteps || [])];
    const targetIdx = direction === 'up' ? stepIdx - 1 : stepIdx + 1;
    if (targetIdx < 0 || targetIdx >= orderedList.length) return;
    const temp = orderedList[stepIdx];
    orderedList[stepIdx] = orderedList[targetIdx];
    orderedList[targetIdx] = temp;
    setSelectedAnswers(prev => ({ ...prev, [questionIdx]: orderedList }));
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !selectedBundle) return;
    
    setIsSubmitting(true);
    try {
      const userEmail = auth.currentUser.email || auth.currentUser.uid;
      const userId = auth.currentUser.uid;

      await addDoc(collection(db, 'payments'), {
        user: userEmail,
        userId: userId,
        name: auth.currentUser.displayName || userEmail,
        amount: selectedBundle.price,
        plan: selectedBundle.title,
        planName: selectedBundle.title,
        examId: selectedBundle.id,
        category: selectedBundle.category,
        domain: selectedBundle.domain,
        questionCount: selectedBundle.questionCount,
        mpesaRef: mpesaRef || `MP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: 'Completed',
        date: new Date().toLocaleString(),
        createdAt: new Date().toISOString()
      });

      setShowPaymentModal(false);
      setMpesaRef('');
      setSelectedBundle(null);
      await fetchUserPurchases();
      alert(`Success! ${selectedBundle.title} has been unlocked and added to your "My Courses" tab.`);
      navigate('/dashboard/courses');
    } catch (error) {
      console.error('Error submitting payment:', error);
      alert('Error submitting payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateScore = () => {
    if (!practiceExam || !practiceExam.questions) return { correct: 0, total: 0, percentage: 0 };
    let correct = 0;
    practiceExam.questions.forEach((q: any, idx: number) => {
      const isOrdering = q.questionTypeId === 'order_drag' || q.questionTypeId === 'order_numbers' || q.orderedSteps;
      if (isOrdering && q.orderedSteps) {
        const ans = selectedAnswers[idx];
        if (Array.isArray(ans) && JSON.stringify(ans) === JSON.stringify(q.orderedSteps)) {
          correct++;
        }
      } else {
        const normalized = normalizeQuestion(q);
        if (selectedAnswers[idx] === normalized.correctAnswer) {
          correct++;
        }
      }
    });
    const total = practiceExam.questions.length;
    return { correct, total, percentage: total > 0 ? Math.round((correct / total) * 100) : 0 };
  };

  const getPlanBadge = (plan?: string) => {
    switch (plan) {
      case 'platinum':
        return <span className="px-2.5 py-0.5 bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-extrabold rounded-full flex items-center gap-1"><Crown className="w-3 h-3 text-purple-600" /> Platinum / Master Tier</span>;
      case 'gold':
        return <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold rounded-full flex items-center gap-1"><Crown className="w-3 h-3 text-amber-600" /> Gold / Sure Pass Tier</span>;
      case 'basic':
        return <span className="px-2.5 py-0.5 bg-slate-200 text-slate-900 border border-slate-300 text-[10px] font-extrabold rounded-full flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-slate-600" /> Silver / Basic Tier</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-extrabold rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-600" /> Free Public Access</span>;
    }
  };

  const getQuestionLimitPill = (exam: ExamItem) => {
    const limits = exam.questionLimits || { free: 5, basic: 25, gold: 0, platinum: 0 };
    const maxForUser = limits[userSubscriptionPlan] ?? 0;
    const totalQs = exam.questionCount || (exam.questions ? exam.questions.length : 0);

    if (maxForUser === 0 || maxForUser >= totalQs) {
      return <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Full Access ({totalQs} Qs)</span>;
    } else {
      return <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{maxForUser} Qs on {userSubscriptionPlan.toUpperCase()} Plan</span>;
    }
  };

  const modalsContent = (
    <>
      {/* Admin Full Exam Editor Modal */}
      {editingExamItem && (
        <ExamEditorModal
          isOpen={!!editingExamItem}
          onClose={() => setEditingExamItem(null)}
          exam={editingExamItem}
          onSave={handleSaveEditedExam}
        />
      )}

      {/* Subscription Required Lock Modal */}
      {requiredPlanModalExam && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="p-6 bg-gradient-to-br from-slate-900 to-blue-950 text-white relative">
              <button 
                onClick={() => setRequiredPlanModalExam(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 bg-amber-500/20 border border-amber-400/40 text-amber-400 rounded-xl flex items-center justify-center mb-3">
                <Crown className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold tracking-tight">Subscription Upgrade Required</h3>
              <p className="text-xs text-slate-300 mt-1">
                Access to <strong>{requiredPlanModalExam.title}</strong> is restricted.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs space-y-2 text-amber-950">
                <div className="flex justify-between items-center font-bold">
                  <span>Required Subscription:</span>
                  <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded font-extrabold uppercase">
                    {requiredPlanModalExam.requiredPlan} Plan
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Your Current Plan:</span>
                  <span className="font-bold uppercase">{userSubscriptionPlan} Plan</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Upgrade your subscription plan to unlock full access to this exam, complete question banks, and detailed clinical explanations.
              </p>

              <div className="pt-2 flex flex-col gap-2">
                <Button 
                  onClick={() => {
                    setRequiredPlanModalExam(null);
                    navigate('/dashboard/pricing');
                  }}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold gap-2 py-3 shadow-md"
                >
                  <Crown className="w-4 h-4 fill-white" /> Upgrade Subscription Plan
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setRequiredPlanModalExam(null)}
                  className="w-full text-slate-600"
                >
                  Maybe Later
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* M-Pesa Payment Details Modal */}
      {showPaymentModal && selectedBundle && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-start gap-4">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">M-Pesa Payment Details</h3>
                <p className="text-xs text-slate-500 mt-1">Pay for {selectedBundle.title}</p>
              </div>
            </div>
            
            <form onSubmit={handleSubmitPayment} className="p-6 space-y-4">
              <div className="p-4 bg-slate-100 border border-slate-200 rounded-lg text-sm mb-4">
                <p className="mb-2">1. Go to M-Pesa Menu</p>
                <p className="mb-2">2. Select Lipa na M-Pesa -&gt; Buy Goods and Services</p>
                <p className="mb-2">3. Enter Till Number: <strong>123456</strong></p>
                <p className="mb-2">4. Enter Amount: <strong>{selectedBundle.price}</strong></p>
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

      {/* Favorite Toast Notification */}
      {favoriteToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <BookmarkCheck className="w-5 h-5 text-amber-400 fill-amber-400" />
          <span className="text-xs font-bold">{favoriteToast}</span>
        </div>
      )}

      {/* No Exams Modal */}
      {noExamsModalMessage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl mx-auto flex items-center justify-center text-2xl font-bold">
              📚
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900">No Exams Available Yet</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {noExamsModalMessage}
              </p>
            </div>
            <Button
              onClick={() => setNoExamsModalMessage(null)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md"
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </>
  );

  // Check 14-day trial status: if countdown ends, people get a page saying please upgrade your account to access the exams repository
  const userRole = localStorage.getItem('userRole') || 'student';
  const isPrivileged = userRole === 'admin' || userRole === 'staff';

  if (!trialLoading && trial.isExpired && !trial.isPaid && !isPrivileged) {
    return (
      <div className="min-h-screen bg-slate-50/50 pb-20">
        <TrialExpiredExamLock 
          trial={trial} 
          onRefresh={async () => {
            await refreshTrial();
            await fetchUserPurchases();
          }} 
        />
        {modalsContent}
      </div>
    );
  }

  if (selectedExamTypePage) {
    const typeExams = examsList.filter(ex => ex.category === selectedExamTypePage || normalizeExamCategory(ex.category) === normalizeExamCategory(selectedExamTypePage));
    const categoriesList = EXAM_TYPE_CATEGORIES[selectedExamTypePage] || ['Core Concepts', 'Clinical Specialties', 'Diagnostic Assessment', 'Practice Mock Bank'];
    const totalQs = boardQuestionCounts[selectedExamTypePage] || typeExams.reduce((acc, curr) => acc + curr.questionCount, 0);

    return (
      <div className="min-h-screen bg-slate-50/50 pb-20">
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in">
        {/* Header Banner - Sleek Compact Ribbon */}
        <div className="bg-slate-900 text-white rounded-xl px-4 py-2.5 sm:px-5 sm:py-3 shadow-2xs border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="space-y-1 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-[11px] font-bold">
              <FolderOpen className="w-3.5 h-3.5" /> Exam Category Hub
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
              <span className={getProminentExamMeta(selectedExamTypePage).titleColor.replace('text-', 'text-')}>
                {selectedExamTypePage}
              </span> 
              <span className="text-white">Study Center</span>
            </h1>
            <p className="text-slate-300 text-xs leading-relaxed hidden sm:block">
              Explore specialized modules, high-yield practice exams, and structured sub-categories for {selectedExamTypePage}.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-slate-300 font-semibold">
              <span className="px-2.5 py-0.5 bg-white/10 rounded-full border border-white/10 text-[11px]">
                📊 {totalQs} Total Questions
              </span>
              <span className="px-2.5 py-0.5 bg-white/10 rounded-full border border-white/10 text-[11px]">
                📚 {typeExams.length} Modules
              </span>
            </div>
          </div>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setSelectedExamTypePage(null)}
            className="text-white border-slate-700 hover:bg-slate-800 gap-1.5 shrink-0 bg-slate-800/80 text-xs font-bold"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back to Exam Bank
          </Button>
        </div>

        {/* Categories Section ("Put categories later" support) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Folder className="w-5 h-5 text-blue-600" /> Categories & Sub-Topics
            </h2>
            <span className="text-xs font-semibold text-slate-500">Structured Curriculum Breakdown</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categoriesList.map((cat, idx) => (
              <div 
                key={idx}
                onClick={() => handleCategoryClick(cat)}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group cursor-pointer"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {idx + 1}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Module
                    </span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm md:text-base leading-snug">
                    {cat}
                  </h3>
                  <p className="text-xs text-slate-500">
                    High-yield board questions and rationales focused on {cat}.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                  <span>Explore Topic</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Practice Exams & Quizzes List for this Exam Type */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" /> Practice Exams & Mock Sets ({typeExams.length})
            </h2>
          </div>

          {typeExams.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700 text-base">No specific exam bundles listed yet for {selectedExamTypePage}</p>
              <p className="text-xs text-slate-500">Check back soon or sync question bank items from lecturer repository.</p>
              <Button 
                variant="outline"
                onClick={() => setSelectedExamTypePage(null)}
                className="mt-2 text-xs"
              >
                Return to Exam Bank
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {typeExams.map((exam) => (
                <div key={exam.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      {getPlanBadge(exam.requiredPlan)}
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold rounded-full">
                        {exam.domain}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        exam.difficulty === 'Advanced' ? 'bg-rose-100 text-rose-800' :
                        exam.difficulty === 'Medium' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {exam.difficulty}
                      </span>
                      {getQuestionLimitPill(exam)}
                    </div>

                    <h3 className="text-base md:text-lg font-bold text-slate-900">{exam.title}</h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <div className="flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span><strong>{exam.questionCount}</strong> Total Questions</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span><strong>{exam.durationMinutes}</strong> Minutes</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <span className="text-xs text-slate-400 block font-medium">Access Plan</span>
                      <span className="text-sm font-extrabold text-slate-900 uppercase">
                        {(exam.requiredPlan || 'FREE').toUpperCase()}
                      </span>
                    </div>

                    <Button 
                      onClick={() => handleAction(exam)}
                      className={`gap-2 ${
                        PLAN_LEVELS[userSubscriptionPlan] < PLAN_LEVELS[exam.requiredPlan || 'free']
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {PLAN_LEVELS[userSubscriptionPlan] < PLAN_LEVELS[exam.requiredPlan || 'free'] ? (
                        <><Lock className="w-4 h-4" /> Locked ({exam.requiredPlan?.toUpperCase()})</>
                      ) : (
                        <><Play className="w-4 h-4 fill-white" /> Start Practice</>
                      )}
                    </Button>

                    {isAdminUser && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleAdminEditExam(exam, e)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 gap-1.5"
                          title="Admin: Edit entire exam blueprint, questions, choices, and rationales"
                        >
                          <Edit className="w-3.5 h-3.5 text-blue-500" /> Edit Exam
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleAdminDeleteExam(exam, e)}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 gap-1.5"
                          title="Admin Testing Mode: Delete Exam"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {modalsContent}
    </div>
    );
  }

  if (practiceExam) {
    return (
      <div className="min-h-screen bg-slate-50/50 pb-20 w-full">
        <div className="w-full max-w-6xl mx-auto p-3 sm:p-6 md:p-8 space-y-6 animate-in fade-in">
        <div className="bg-slate-900 text-white rounded-2xl p-5 md:p-6 shadow-lg flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 block">
                {practiceExam.category} • {practiceExam.domain}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                <Maximize2 className="w-2.5 h-2.5" /> Full-Screen Exam Active (Nav Bar Pulled Back)
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight mt-1">{practiceExam.title}</h2>
          </div>
          <Button 
            variant="outline"
            onClick={() => {
              setExamFocusMode(false);
              setPracticeExam(null);
            }}
            className="text-white border-slate-700 hover:bg-slate-800 gap-2 shrink-0"
          >
            <ChevronLeft className="w-4 h-4" /> Exit Exam
          </Button>
        </div>

        {practiceLimitInfo && !examCompleted && (
          <div className="bg-amber-50 border border-amber-200 px-6 py-3 rounded-xl text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{userSubscriptionPlan.toUpperCase()} PLAN PREVIEW: Displaying {practiceLimitInfo.limit} of {practiceLimitInfo.total} total questions.</span>
            </div>
            <button 
              onClick={() => {
                setPracticeExam(null);
                navigate('/dashboard/pricing');
              }}
              className="text-amber-800 underline font-extrabold hover:text-amber-950 shrink-0"
            >
              Upgrade Plan for All {practiceLimitInfo.total} Qs →
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6 relative">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCalculator(prev => !prev)}
              className="gap-1.5 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-extrabold text-xs shadow-xs"
            >
              <Calculator className="w-4 h-4 text-blue-600" />
              {showCalculator ? 'Close Calculator' : 'Exam Calculator'}
            </Button>
          </div>

          {showCalculator && (
            <div className="absolute right-6 top-16 z-50 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 p-4 w-72 space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-400">
                  <Calculator className="w-3.5 h-3.5" /> Medical & Board Calculator
                </div>
                <button 
                  onClick={() => setShowCalculator(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-right font-mono text-xl tracking-wider text-emerald-400 overflow-x-auto">
                {calcInput}
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
                <button onClick={() => handleCalcClear()} className="p-2 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg">C</button>
                <button onClick={() => handleCalcDel()} className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg">⌫</button>
                <button onClick={() => handleCalcPercent()} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg">%</button>
                <button onClick={() => handleCalcOp('/')} className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg">÷</button>

                <button onClick={() => handleCalcNum('7')} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg">7</button>
                <button onClick={() => handleCalcNum('8')} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg">8</button>
                <button onClick={() => handleCalcNum('9')} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg">9</button>
                <button onClick={() => handleCalcOp('*')} className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg">×</button>

                <button onClick={() => handleCalcNum('4')} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg">4</button>
                <button onClick={() => handleCalcNum('5')} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg">5</button>
                <button onClick={() => handleCalcNum('6')} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg">6</button>
                <button onClick={() => handleCalcOp('-')} className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg">-</button>

                <button onClick={() => handleCalcNum('1')} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg">1</button>
                <button onClick={() => handleCalcNum('2')} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg">2</button>
                <button onClick={() => handleCalcNum('3')} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg">3</button>
                <button onClick={() => handleCalcOp('+')} className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg">+</button>

                <button onClick={() => handleCalcNum('0')} className="col-span-2 p-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg">0</button>
                <button onClick={() => handleCalcNum('.')} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg">.</button>
                <button onClick={() => handleCalcEquals()} className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg">=</button>
              </div>
            </div>
          )}

          {!examCompleted ? (() => {
            const currentQ = normalizeQuestion(practiceExam.questions[currentQuestionIndex]);
            const rawCurrentQ = practiceExam.questions[currentQuestionIndex];
            const bookmarked = isQuestionBookmarked(currentQ.question);

            return (
              <div className="space-y-6 pb-12">
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex flex-wrap justify-between items-center gap-2 text-xs font-bold text-slate-500">
                    <span>Question {currentQuestionIndex + 1} of {practiceExam.questions.length} ({Math.round(((currentQuestionIndex + 1) / practiceExam.questions.length) * 100)}%)</span>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleFlagQuestion(currentQuestionIndex)}
                        className={`h-8 text-xs px-3 gap-1.5 font-bold transition-all ${
                          flaggedQuestions.has(currentQuestionIndex)
                            ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${flaggedQuestions.has(currentQuestionIndex) ? 'fill-amber-600 text-amber-600' : 'text-slate-500'}`} />
                        {flaggedQuestions.has(currentQuestionIndex) ? 'Flagged' : 'Flag for Review'}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentQuestionIndex === 0}
                        onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                        className="h-8 text-xs px-3 gap-1 bg-white"
                      >
                        <ChevronLeft className="w-4 h-4" /> Previous
                      </Button>

                      {currentQuestionIndex < practiceExam.questions.length - 1 ? (
                        <Button
                          size="sm"
                          onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                          className="h-8 text-xs px-3 bg-blue-600 hover:bg-blue-700 text-white gap-1"
                        >
                          Next <ChevronRight className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => setExamCompleted(true)}
                          className="h-8 text-xs px-3 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-extrabold"
                        >
                          Finish <Award className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full transition-all duration-300"
                      style={{ width: `${((currentQuestionIndex + 1) / practiceExam.questions.length) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                      Jump:
                    </span>
                    {practiceExam.questions.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`w-7 h-7 text-xs font-bold rounded-lg shrink-0 transition-all relative ${
                          currentQuestionIndex === idx
                            ? 'bg-blue-600 text-white shadow-xs scale-105'
                            : selectedAnswers[idx] !== undefined
                            ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        } ${flaggedQuestions.has(idx) ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}
                      >
                        {idx + 1}
                        {flaggedQuestions.has(idx) && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      {currentQ.questionTypeLabel || 'Single Choice'}
                    </span>
                    <p className="font-bold text-slate-900 text-base leading-relaxed">
                      {currentQ.question}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleBookmark(rawCurrentQ, practiceExam.category, practiceExam.domain)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                      bookmarked 
                        ? 'bg-amber-100 border-amber-300 text-amber-900' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-amber-50'
                    }`}
                  >
                    {bookmarked ? (
                      <>
                        <BookmarkCheck className="w-4 h-4 text-amber-600 fill-amber-500" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4 text-slate-400" />
                        <span>Bookmark</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-3">
                  {(() => {
                    const isOrdering = rawCurrentQ.questionTypeId === 'order_drag' || rawCurrentQ.questionTypeId === 'order_numbers' || rawCurrentQ.orderedSteps;
                    if (isOrdering && rawCurrentQ.orderedSteps) {
                      const orderedList: string[] = selectedAnswers[currentQuestionIndex] || rawCurrentQ.orderedSteps;
                      const isRevealed = showRationale[currentQuestionIndex];

                      return (
                        <div className="space-y-3">
                          <div className="bg-blue-50 border border-blue-200 text-blue-900 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                            <Layers className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>Click and drag choices using the grip handle <GripVertical className="w-3.5 h-3.5 inline text-blue-600" /> or use the up/down controls to arrange them in correct priority order (1 = Highest Priority).</span>
                          </div>
                          <div className="space-y-2">
                            {orderedList.map((stepText, i) => (
                              <div
                                key={i}
                                draggable={!examCompleted}
                                onDragStart={(e) => handleDragStart(e, i)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, currentQuestionIndex, i)}
                                className={`p-3.5 bg-white border rounded-xl flex items-center justify-between gap-3 shadow-2xs transition-all cursor-grab active:cursor-grabbing ${
                                  draggedIndex === i ? 'opacity-40 border-blue-400 border-dashed' : 'border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="text-slate-400 hover:text-slate-600 p-0.5">
                                    <GripVertical className="w-5 h-5" />
                                  </div>
                                  <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center shrink-0">
                                    #{i + 1}
                                  </span>
                                  <p className="text-xs md:text-sm font-semibold text-slate-800">{stepText}</p>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    disabled={i === 0 || examCompleted}
                                    onClick={() => moveStep(currentQuestionIndex, i, 'up')}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded-md text-slate-700"
                                    title="Move Up"
                                  >
                                    <ChevronUp className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={i === orderedList.length - 1 || examCompleted}
                                    onClick={() => moveStep(currentQuestionIndex, i, 'down')}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded-md text-slate-700"
                                    title="Move Down"
                                  >
                                    <ChevronDown className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {!isRevealed && (
                            <Button
                              size="sm"
                              onClick={() => setShowRationale(prev => ({ ...prev, [currentQuestionIndex]: true }))}
                              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                            >
                              Check Ordered Priorities
                            </Button>
                          )}
                        </div>
                      );
                    }

                    return (
                      <>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                          Select the correct answer:
                        </label>
                        {currentQ.options.map((opt: string, i: number) => {
                          const isSelected = selectedAnswers[currentQuestionIndex] === opt;
                          const isCorrect = opt === currentQ.correctAnswer;
                          const isRevealed = showRationale[currentQuestionIndex];

                          return (
                            <button
                              key={i}
                              onClick={() => {
                                setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: opt }));
                                setShowRationale(prev => ({ ...prev, [currentQuestionIndex]: true }));
                              }}
                              className={`w-full p-4 rounded-xl border text-left font-medium text-sm transition-all flex items-start gap-3 ${
                                isRevealed && isCorrect
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold ring-1 ring-emerald-400'
                                  : isRevealed && isSelected && !isCorrect
                                  ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                                  : isSelected
                                  ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {String.fromCharCode(65 + i)}
                              </span>
                              <span className="flex-grow">{opt}</span>
                              {isRevealed && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
                            </button>
                          );
                        })}
                      </>
                    );
                  })()}
                </div>

                {showRationale[currentQuestionIndex] && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                    <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wider block">
                      Clinical Rationale & Explanation
                    </span>
                    <p className="text-xs text-blue-950 leading-relaxed">
                      {currentQ.explanation || 'Rationales provide clinical reasoning behind the correct therapeutic action.'}
                    </p>
                  </div>
                )}
              </div>
            );
          })() : (
            <div className="p-12 text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">Exam Session Completed!</h3>
                <p className="text-sm text-slate-500">Here is your performance summary on {practiceExam.title}</p>
              </div>

              {(() => {
                const score = calculateScore();
                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 max-w-sm mx-auto space-y-3">
                    <div className="text-4xl font-extrabold text-slate-900">
                      {score.percentage}%
                    </div>
                    <p className="text-xs font-semibold text-slate-600">
                      You scored <strong className="text-emerald-600">{score.correct}</strong> out of <strong>{score.total}</strong> questions correctly.
                    </p>
                  </div>
                );
              })()}

              <div className="flex justify-center gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setCurrentQuestionIndex(0);
                    setSelectedAnswers({});
                    setShowRationale({});
                    setExamCompleted(false);
                  }}
                >
                  Retake Practice Exam
                </Button>
                <Button 
                  onClick={() => setPracticeExam(null)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Return to Exam Bank
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      {modalsContent}
    </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Admin Testing Mode Banner */}
      {isAdminUser && (
        <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-rose-800/80 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/80 flex items-center justify-center font-bold text-white shrink-0 shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-rose-400">Admin Mode Active</span>
                <span className="text-[10px] bg-rose-500/30 text-rose-200 px-2 py-0.5 rounded-full font-bold border border-rose-500/40">Full Exam Control</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                You can edit entire exams (title, categories, questions, answer options, rationales, time limits, and plan tiers), create new exams, or delete exams.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <Button
              size="sm"
              onClick={() => {
                setEditingExamItem({
                  id: `exam-custom-${Date.now()}`,
                  title: 'New Clinical Exam',
                  category: 'NCLEX-RN',
                  domain: 'Medical-Surgical Nursing',
                  difficulty: 'Medium',
                  durationMinutes: 60,
                  requiredPlan: 'free',
                  isPublished: true,
                  features: ['Lecturer Authored', 'Verified Rationales', 'Timed Simulation'],
                  questions: [],
                  price: 'Free Access',
                  numericPrice: 0,
                  questionCount: 0,
                  isPremium: false,
                  icon: Brain,
                  color: 'text-blue-600',
                  bg: 'bg-blue-50'
                });
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Create New Exam
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetSampleExamsAdmin}
              className="text-xs text-slate-200 border-slate-700 hover:bg-slate-800 gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" /> Reset Default Exams
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/staff/upload')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Upload / Extract Exam
            </Button>
          </div>
        </div>
      )}

      {/* Header Banner - Sleek Compact Ribbon */}
      <div className="bg-slate-900 text-white rounded-xl px-4 py-2.5 sm:px-5 sm:py-3 shadow-2xs border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-400 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate">Exam Bank & Repository</h1>
              <span className="text-[10px] font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-400/30 hidden sm:inline">
                Curriculum Hub
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate hidden md:block">
              Priority testing repositories: ATI TEAS, HESI A2, NCLEX, Examplify & clinical specialties.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs shrink-0">
          {trial.isPaid ? (
            <span className="px-2.5 py-1 rounded-lg font-extrabold text-[11px] bg-emerald-600 text-white uppercase tracking-wider flex items-center gap-1 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5" /> {userSubscriptionPlan.toUpperCase()} (UNLIMITED)
            </span>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-amber-400 text-slate-950 uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                <Clock className="w-3.5 h-3.5" /> {trial.daysRemaining}d {trial.hoursRemaining}h LEFT
              </span>
              <button
                onClick={async () => {
                  await setSimulatedTrialExpired(true, auth.currentUser);
                  await refreshTrial();
                }}
                className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[10px] font-medium transition-colors"
                title="Simulate what happens when the 14 days finish"
              >
                Expire
              </button>
            </div>
          )}

          <div className="inline-flex items-center gap-1 p-0.5 bg-slate-800/90 rounded-lg border border-slate-700 text-[11px]">
            {[
              { label: 'All Plans', val: 'All' },
              { label: 'My Plan', val: 'My Plan Access' },
              { label: 'Free Tier', val: 'free' },
              { label: 'Basic', val: 'basic' },
              { label: 'Gold', val: 'gold' },
              { label: 'Platinum', val: 'platinum' }
            ].map(item => (
              <button
                key={item.val}
                onClick={() => setSelectedPlanFilter(item.val as any)}
                className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                  selectedPlanFilter === item.val
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Subtle Upgrade CTA Banner for Free Tier Students */}
      {userSubscriptionPlan === 'free' && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-amber-50 border border-blue-200/70 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 transition-all">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Crown className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm md:text-base font-extrabold text-slate-900">Unlock Pro & Sure Pass Question Banks</h3>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-extrabold rounded-full border border-amber-300">
                  Free Tier Notice
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                You are currently viewing limited free questions. Upgrade to Pro/Gold to access <strong>+4,000 questions</strong>, exclusive exam types (HESI, ATI Exit Exams, Examplify), and full mock tests.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              size="sm"
              onClick={() => navigate('/pricing')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-4 py-2 shadow-xs gap-1.5"
            >
              <span>Explore Pro Plans</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Live Question Bank Inventory Bar - Compact */}
      <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
            <Database className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-900">Live Inventory:</h2>
            <span className="text-xs text-slate-600">
              <strong className="text-slate-900 font-black">{boardQuestionCounts['All'] || 0}</strong> verified questions in repository
            </span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200 inline-flex items-center gap-1">
              <Activity className="w-2.5 h-2.5" /> Live
            </span>
          </div>
        </div>

        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchAllExamsAndQuestions}
          disabled={loadingDb}
          className="text-xs font-bold gap-1.5 h-7 px-2.5 text-slate-700 hover:text-blue-600 shrink-0 self-end sm:self-auto"
        >
          <RefreshCw className={`w-3 h-3 ${loadingDb ? 'animate-spin' : ''}`} /> Sync Bank ({dbQuestionsCount} Live)
        </Button>
      </div>

      {/* High-Level Exam Group Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
        {(['All', 'Entrance Exams', 'Nursing Exams', 'Exit Exams'] as const).map(group => {
          const isActive = selectedExamGroup === group;
          let countText = '';
          if (group === 'Entrance Exams') countText = `(${ENTRANCE_EXAMS.length})`;
          if (group === 'Nursing Exams') countText = `(${NURSING_EXAMS.length})`;
          if (group === 'Exit Exams') countText = `(${EXIT_EXAMS.length})`;

          return (
            <button
              key={group}
              onClick={() => {
                setSelectedExamGroup(group);
                setSelectedBoard('All');
              }}
              className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>{group === 'All' ? 'All Exam Categories' : group}</span>
              {countText && <span className={`text-[10px] font-semibold ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>{countText}</span>}
            </button>
          );
        })}
      </div>

      {/* Dynamic Board Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          onClick={() => setSelectedBoard('All')}
          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
            selectedBoard === 'All'
              ? 'bg-blue-600 border-blue-600 text-white shadow-md ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50/80'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                selectedBoard === 'All' ? 'text-blue-200' : 'text-slate-400'
              }`}>
                Complete
              </span>
              <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                selectedBoard === 'All' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700 border border-blue-100'
              }`}>
                {boardQuestionCounts['All'] || 0} Questions
              </span>
            </div>
            <h3 className="font-bold text-sm md:text-base">All Boards ({selectedExamGroup})</h3>
          </div>
          <p className={`text-[11px] mt-2 line-clamp-2 ${
            selectedBoard === 'All' ? 'text-blue-100' : 'text-slate-500'
          }`}>
            Complete library across all licensing authorities
          </p>
        </button>

        {dynamicBoardCategories
          .filter(catKey => {
            if (selectedExamGroup === 'Entrance Exams') return (ENTRANCE_EXAMS as readonly string[]).includes(catKey);
            if (selectedExamGroup === 'Nursing Exams') return (NURSING_EXAMS as readonly string[]).includes(catKey);
            if (selectedExamGroup === 'Exit Exams') return (EXIT_EXAMS as readonly string[]).includes(catKey);
            return true;
          })
          .map((catKey) => {
          const count = boardQuestionCounts[catKey] || 0;
          const isSelected = selectedBoard === catKey;
          const prominent = getProminentExamMeta(catKey);

          return (
            <button
              key={catKey}
              onClick={() => {
                setSelectedBoard(catKey);
                setSelectedExamTypePage(catKey);
              }}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md ring-2 ring-blue-500/20'
                  : `${prominent.cardBg} ${prominent.cardBorder} text-slate-700 hover:shadow-xs`
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${
                    isSelected ? 'text-blue-200' : prominent.isProminent ? prominent.titleColor : 'text-slate-400'
                  }`}>
                    {prominent.isProminent ? prominent.accentBadge : 'Authority'}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                    isSelected 
                      ? 'bg-white/20 text-white' 
                      : prominent.isProminent
                        ? prominent.pillStyle
                        : 'bg-blue-50 text-blue-700 border border-blue-100'
                  }`}>
                    {count} {count === 1 ? 'Q' : 'Qs'}
                  </span>
                </div>
                <h3 className={`text-sm md:text-base font-black ${
                  isSelected ? 'text-white' : prominent.titleColor
                }`}>
                  {catKey}
                </h3>
              </div>
              <p className={`text-[11px] mt-1.5 line-clamp-2 ${
                isSelected ? 'text-blue-100' : 'text-slate-500'
              }`}>
                {catKey} Specialty & Licensure Bank
              </p>
            </button>
          );
        })}
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
          {/* Search Bar */}
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search exam title, specialty, or board..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Difficulty & View Switcher */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Plan Tier:</span>
              <select
                value={selectedPlanFilter}
                onChange={(e) => setSelectedPlanFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Plan Tiers</option>
                <option value="My Plan Access">Accessible with My Plan ({userSubscriptionPlan.toUpperCase()})</option>
                <option value="free">Free Access Tier</option>
                <option value="basic">Basic / Silver Tier</option>
                <option value="gold">Gold / Pass Tier</option>
                <option value="platinum">Platinum / Master Tier</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Difficulty:</span>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Medium">Medium</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div className="flex items-center border border-slate-200 rounded-lg p-1 bg-slate-50 gap-1">
              <button
                onClick={() => setViewMode('classified')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  viewMode === 'classified'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <List className="w-3.5 h-3.5" /> Classified
              </button>
              <button
                onClick={() => setViewMode('favorites')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  viewMode === 'favorites'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" /> Favorites ({favoritesList.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'classified' ? (
        <div className="space-y-6">
          {Object.keys(groupedExams).length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
              <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-lg font-bold text-slate-700">No exams match your current filters</p>
              <p className="text-xs text-slate-500">Try resetting search keywords or selecting "All Exam Boards".</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSelectedBoard('All');
                  setSelectedDomain('All Specialties');
                  setSelectedDifficulty('All');
                  setSelectedPlanFilter('All');
                  setSearchQuery('');
                }}
              >
                Reset All Filters
              </Button>
            </div>
          ) : (
            (Object.entries(groupedExams) as [string, ExamItem[]][]).map(([catKey, exams]) => {
              const isExpanded = expandedCategories[catKey] !== false;
              const prominent = getProminentExamMeta(catKey);

              return (
                <div key={catKey} className={`bg-white rounded-xl border shadow-xs overflow-hidden ${
                  prominent.isProminent ? prominent.cardBorder : 'border-slate-200'
                }`}>
                  {/* Classification Category Header */}
                  <div 
                    onClick={() => toggleCategory(catKey)}
                    className={`p-3.5 md:p-4 transition-colors border-b flex items-center justify-between cursor-pointer select-none ${
                      prominent.isProminent 
                        ? `${prominent.badgeBg.split(' ')[0]} hover:brightness-95 border-slate-200` 
                        : 'bg-slate-50/80 hover:bg-slate-100/80 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg font-bold ${
                        prominent.isProminent ? prominent.badgeBg : 'bg-blue-100 text-blue-700'
                      }`}>
                        {isExpanded ? <FolderOpen className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className={`text-base md:text-lg font-black ${prominent.titleColor}`}>
                            {catKey}
                          </h2>
                          <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                            prominent.isProminent ? prominent.pillStyle : 'bg-blue-100 text-blue-800 border-blue-200'
                          }`}>
                            {boardQuestionCounts[catKey] || 0} Questions Available
                          </span>
                          <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                            {exams.length} {exams.length === 1 ? 'Exam Item' : 'Exam Items'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{catKey} Licensure & Specialty Practice Collection</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 hidden sm:inline">
                        {isExpanded ? 'Collapse' : 'Expand'}
                      </span>
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                    </div>
                  </div>

                  {/* Category Items List */}
                  {isExpanded && (
                    <div className="divide-y divide-slate-100">
                      {exams.map((exam) => {
                        const examProminent = getProminentExamMeta(exam.category || exam.title);
                        return (
                        <div key={exam.id} className="p-4 md:p-6 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-2 max-w-3xl">
                            <div className="flex flex-wrap items-center gap-2">
                              {getPlanBadge(exam.requiredPlan)}
                              <span className={`px-2.5 py-0.5 border text-[11px] font-extrabold rounded-full ${
                                examProminent.isProminent ? examProminent.pillStyle : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                                {exam.category}
                              </span>
                              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold rounded-full">
                                {exam.domain}
                              </span>
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                exam.difficulty === 'Advanced' ? 'bg-rose-100 text-rose-800' :
                                exam.difficulty === 'Medium' ? 'bg-amber-100 text-amber-800' :
                                'bg-emerald-100 text-emerald-800'
                              }`}>
                                {exam.difficulty}
                              </span>
                              {getQuestionLimitPill(exam)}
                            </div>

                            <h3 className="text-base md:text-lg font-bold text-slate-900">{exam.title}</h3>

                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                              <div className="flex items-center gap-1">
                                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                                <span><strong>{exam.questionCount}</strong> Total Questions</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span><strong>{exam.durationMinutes}</strong> Minutes</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                            <div className="text-left md:text-right">
                              <span className="text-xs text-slate-400 block font-medium">Access Plan</span>
                              <span className="text-sm font-extrabold text-slate-900 uppercase">
                                {(exam.requiredPlan || 'FREE').toUpperCase()}
                              </span>
                            </div>

                            <Button 
                              onClick={() => handleAction(exam)}
                              className={`gap-2 ${
                                PLAN_LEVELS[userSubscriptionPlan] < PLAN_LEVELS[exam.requiredPlan || 'free']
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              {PLAN_LEVELS[userSubscriptionPlan] < PLAN_LEVELS[exam.requiredPlan || 'free'] ? (
                                <><Lock className="w-4 h-4" /> Locked ({exam.requiredPlan?.toUpperCase()})</>
                              ) : (
                                <><Play className="w-4 h-4 fill-white" /> Start Practice</>
                              )}
                            </Button>

                            {isAdminUser && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => handleAdminEditExam(exam, e)}
                                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 gap-1.5"
                                  title="Admin: Edit entire exam blueprint, questions, choices, and rationales"
                                >
                                  <Edit className="w-3.5 h-3.5 text-blue-500" /> Edit Exam
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => handleAdminDeleteExam(exam, e)}
                                  className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 gap-1.5"
                                  title="Admin Testing Mode: Delete Exam"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Delete
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Saved Favorites Collection View */
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500 text-white rounded-xl shadow-xs">
                <Bookmark className="w-6 h-6 fill-white" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  My Saved Favorites Collection
                  <span className="px-2.5 py-0.5 bg-amber-200 text-amber-900 text-xs font-bold rounded-full border border-amber-300">
                    {favoritesList.length} {favoritesList.length === 1 ? 'Question' : 'Questions'}
                  </span>
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Review and practice questions saved to your personal Favorites library.
                </p>
              </div>
            </div>

            {favoritesList.length > 0 && (
              <Button 
                onClick={startFavoritesPractice}
                className="bg-amber-600 hover:bg-amber-700 text-white gap-2 shadow-xs shrink-0"
              >
                <Play className="w-4 h-4 fill-white" /> Practice Favorites ({favoritesList.length} Qs)
              </Button>
            )}
          </div>

          {favoritesList.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                <Bookmark className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">No Bookmarked Questions Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click the bookmark icon during practice to save challenging questions for later review.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {favoritesList.map((fav, index) => (
                <div key={fav.docId || index} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-full border border-amber-200">
                      {fav.category} • {fav.domain}
                    </span>
                    <button 
                      onClick={() => toggleBookmark({ question: fav.question, options: fav.options, correctAnswer: fav.correctAnswer, explanation: fav.explanation })}
                      className="text-slate-400 hover:text-rose-600 text-xs font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                  <p className="font-bold text-slate-900 text-sm">{fav.question}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {modalsContent}
    </div>
  );
}
