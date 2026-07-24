import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Search, Filter, BookOpen, Activity, HeartPulse, Brain, Baby, 
  ArrowRight, DollarSign, ShoppingCart, Folder, FolderOpen, 
  ChevronRight, ChevronDown, Clock, HelpCircle, CheckCircle, 
  Award, Grid, List, Play, Tag, Layers, RefreshCw, X, AlertCircle, Database, Sparkles
} from 'lucide-react';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';
import { ALL_QUIZ_QUESTIONS, normalizeExamCategory } from '@/data/quizQuestions';

const examBoards = [
  { id: 'All', label: 'All Exam Boards', description: 'Complete library across all licensing authorities' },
  { id: 'NCK', label: 'NCK (Kenya)', description: 'Nursing Council of Kenya Licensure Exams' },
  { id: 'NCLEX', label: 'NCLEX-RN', description: 'National Council Licensure Examination' },
  { id: 'HESI', label: 'HESI Assessment', description: 'Health Education Systems Specialty Practice' },
  { id: 'GED', label: 'GED Prep', description: 'General Educational Development Foundations' },
];

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
  category: string; // NCK, NCLEX, HESI, GED
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
}

const defaultExamBundles: ExamItem[] = [
  { 
    id: 'nck-medsurg-1', 
    title: 'NCK Medical-Surgical Mastery Mock', 
    category: 'NCK', 
    domain: 'Medical-Surgical Nursing', 
    price: 'Ksh 3,500', 
    numericPrice: 3500, 
    questionCount: 100, 
    durationMinutes: 120, 
    difficulty: 'Medium', 
    isPremium: true, 
    features: ['NCK Blueprint Aligned', 'Comprehensive Rationales', 'Performance Breakdown'], 
    icon: Activity, 
    color: 'text-purple-600', 
    bg: 'bg-purple-100' 
  },
  { 
    id: 'nck-complete-bundle', 
    title: 'NCK Council Licensure Complete Bundle', 
    category: 'NCK', 
    domain: 'Community & Public Health', 
    price: 'Ksh 5,000', 
    numericPrice: 5000, 
    questionCount: 250, 
    durationMinutes: 300, 
    difficulty: 'Advanced', 
    isPremium: true, 
    features: ['10+ Full Mock Exams', 'Past Board Papers', 'Priority Tutor Review'], 
    icon: Activity, 
    color: 'text-purple-700', 
    bg: 'bg-purple-50' 
  },
  { 
    id: 'nclex-rn-nextgen-1', 
    title: 'NCLEX-RN NextGen Clinical Judgment Set', 
    category: 'NCLEX', 
    domain: 'Pharmacology & Parenteral Therapies', 
    price: 'Free Practice', 
    numericPrice: 0, 
    questionCount: 50, 
    durationMinutes: 60, 
    difficulty: 'Advanced', 
    isPremium: false, 
    features: ['Bowtie Matrix Questions', 'Case Study Exhibits', 'Instant Rationale Feedback'], 
    icon: Brain, 
    color: 'text-blue-600', 
    bg: 'bg-blue-100',
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
    id: 'nclex-comprehensive', 
    title: 'NCLEX Comprehensive CAT Simulation', 
    category: 'NCLEX', 
    domain: 'Medical-Surgical Nursing', 
    price: 'Ksh 25,000', 
    numericPrice: 25000, 
    questionCount: 500, 
    durationMinutes: 300, 
    difficulty: 'Advanced', 
    isPremium: true, 
    features: ['Computer Adaptive Test Engine', '1500+ Question Pool', 'Unlimited Re-attempts'], 
    icon: Brain, 
    color: 'text-indigo-600', 
    bg: 'bg-indigo-100' 
  },
  { 
    id: 'hesi-pediatrics-1', 
    title: 'HESI Pediatric Nursing Specialty Practice', 
    category: 'HESI', 
    domain: 'Pediatric Nursing', 
    price: 'Free Practice', 
    numericPrice: 0, 
    questionCount: 30, 
    durationMinutes: 45, 
    difficulty: 'Medium', 
    isPremium: false, 
    features: ['Growth & Development Benchmarks', 'Pediatric Dosage Math', 'Detailed Score Reports'], 
    icon: Baby, 
    color: 'text-rose-600', 
    bg: 'bg-rose-100',
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
    id: 'hesi-assessment-prep', 
    title: 'HESI Exit Exam Assessment Package', 
    category: 'HESI', 
    domain: 'Maternal & Newborn Health', 
    price: 'Ksh 15,000', 
    numericPrice: 15000, 
    questionCount: 200, 
    durationMinutes: 180, 
    difficulty: 'Advanced', 
    isPremium: true, 
    features: ['Predictive Exit Score', 'Targeted Remediation', 'Performance Diagnostics'], 
    icon: HeartPulse, 
    color: 'text-rose-700', 
    bg: 'bg-rose-50' 
  },
  { 
    id: 'ged-prep-1', 
    title: 'GED Science & Pre-Nursing Foundations', 
    category: 'GED', 
    domain: 'Nursing Fundamentals', 
    price: 'Free Practice', 
    numericPrice: 0, 
    questionCount: 40, 
    durationMinutes: 50, 
    difficulty: 'Beginner', 
    isPremium: false, 
    features: ['Human Biology Concepts', 'Scientific Reasoning', 'Interactive Quizzes'], 
    icon: BookOpen, 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-100',
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
    id: 'ged-prep-mastery', 
    title: 'GED Complete Academic Mastery Curriculum', 
    category: 'GED', 
    domain: 'Nursing Fundamentals', 
    price: 'Ksh 25,000', 
    numericPrice: 25000, 
    questionCount: 350, 
    durationMinutes: 240, 
    difficulty: 'Medium', 
    isPremium: true, 
    features: ['Full Subject Modules', '1-on-1 Lecturer Tutoring', 'Certificates of Completion'], 
    icon: BookOpen, 
    color: 'text-emerald-700', 
    bg: 'bg-emerald-50' 
  },
];

export default function ExamBank() {
  const navigate = useNavigate();
  const [selectedBoard, setSelectedBoard] = useState('All');
  const [selectedDomain, setSelectedDomain] = useState('All Specialties');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'classified' | 'grid'>('classified');
  
  // State for Firestore loaded exams
  const [examsList, setExamsList] = useState<ExamItem[]>(defaultExamBundles);
  const [loadingDb, setLoadingDb] = useState(false);
  const [dbQuestionsCount, setDbQuestionsCount] = useState(0);

  // Live Actual Question Counts tracking across all sources
  const [boardQuestionCounts, setBoardQuestionCounts] = useState<Record<string, number>>({
    'All': ALL_QUIZ_QUESTIONS.length,
    'NCK': ALL_QUIZ_QUESTIONS.filter(q => normalizeExamCategory(q.examMode) === 'NCK').length,
    'NCLEX': ALL_QUIZ_QUESTIONS.filter(q => normalizeExamCategory(q.examMode) === 'NCLEX').length,
    'HESI': ALL_QUIZ_QUESTIONS.filter(q => normalizeExamCategory(q.examMode) === 'HESI').length,
    'GED': ALL_QUIZ_QUESTIONS.filter(q => normalizeExamCategory(q.examMode) === 'GED').length,
  });

  // Accordion state for classified view
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'NCK': true,
    'NCLEX': true,
    'HESI': true,
    'GED': true,
  });

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

  // Fetch Firestore Exams AND Questions to aggregate exact live counts
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
          const cat = normalizeExamCategory(data.category);
          const qList = data.questions || [];
          qList.forEach((q: any) => examDocsQuestions.push({ ...q, examMode: cat }));

          dbExams.push({
            id: docSnap.id,
            title: data.title || 'Custom Uploaded Exam',
            category: cat === 'Custom' ? 'NCK' : cat,
            domain: data.domain || 'Medical-Surgical Nursing',
            price: 'Free Practice',
            numericPrice: 0,
            questionCount: qList.length,
            durationMinutes: Math.max(15, qList.length * 2),
            difficulty: 'Medium',
            isPremium: false,
            features: ['Lecturer Uploaded', 'Instant Feedback', 'Verified Questions'],
            icon: cat === 'NCLEX' ? Brain : cat === 'HESI' ? HeartPulse : cat === 'GED' ? BookOpen : Activity,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            questions: qList
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
        id: `db-questions-${cat.toLowerCase()}`,
        title: `${cat} Lecturer Published Question Bank (${qList.length} Questions)`,
        category: cat === 'Custom' ? 'NCK' : cat,
        domain: 'Medical-Surgical Nursing',
        price: 'Free Practice',
        numericPrice: 0,
        questionCount: qList.length,
        durationMinutes: Math.max(15, qList.length * 2),
        difficulty: 'Medium',
        isPremium: false,
        features: ['Lecturer Authored', 'Live Bank Item', 'Continuous Updates'],
        icon: cat === 'NCLEX' ? Brain : cat === 'HESI' ? HeartPulse : cat === 'GED' ? BookOpen : Activity,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        questions: qList
      }));

      // Merge all exam items
      const combinedExams = [...dbExams, ...dynamicBoardExams, ...defaultExamBundles];
      setExamsList(combinedExams);

      // 3. Compute Exact Total Question Counts per Board
      const allAggregatedQuestions = [
        ...ALL_QUIZ_QUESTIONS.map(q => ({ mode: q.examMode })),
        ...dbQuestionsList.map(q => ({ mode: q.examMode || q.category })),
        ...examDocsQuestions.map(q => ({ mode: q.examMode }))
      ];

      const counts: Record<string, number> = {
        'All': allAggregatedQuestions.length,
        'NCK': 0,
        'NCLEX': 0,
        'HESI': 0,
        'GED': 0,
      };

      allAggregatedQuestions.forEach(item => {
        const cat = normalizeExamCategory(item.mode);
        if (counts[cat] !== undefined) {
          counts[cat]++;
        } else {
          counts['NCK']++;
        }
      });

      setBoardQuestionCounts(counts);

    } catch (err) {
      console.error('Error fetching exams and questions for question counts:', err);
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    fetchAllExamsAndQuestions();
  }, []);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const filteredExams = examsList.filter(exam => {
    const matchesBoard = selectedBoard === 'All' || exam.category === selectedBoard;
    const matchesDomain = selectedDomain === 'All Specialties' || exam.domain === selectedDomain;
    const matchesDifficulty = selectedDifficulty === 'All' || exam.difficulty === selectedDifficulty;
    const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          exam.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          exam.domain.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBoard && matchesDomain && matchesDifficulty && matchesSearch;
  });

  // Group filtered exams by Board Category
  const groupedExams = ['NCK', 'NCLEX', 'HESI', 'GED'].reduce((acc, cat) => {
    const categoryExams = filteredExams.filter(e => e.category === cat);
    if (categoryExams.length > 0) {
      acc[cat] = categoryExams;
    }
    return acc;
  }, {} as Record<string, ExamItem[]>);

  const handleAction = (exam: ExamItem) => {
    if (!exam.isPremium && exam.questions && exam.questions.length > 0) {
      // Launch practice mode
      setPracticeExam(exam);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setShowRationale({});
      setExamCompleted(false);
    } else {
      // Payment requirement
      if (!auth.currentUser) {
        navigate('/login');
        return;
      }
      setSelectedBundle(exam);
      setShowPaymentModal(true);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !mpesaRef || !selectedBundle) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'payments'), {
        user: auth.currentUser.email,
        name: auth.currentUser.displayName || auth.currentUser.email,
        amount: selectedBundle.price,
        plan: selectedBundle.title,
        mpesaRef: mpesaRef,
        status: 'Pending',
        date: new Date().toLocaleString()
      });
      alert('Payment details submitted successfully. Access will be granted once verified.');
      setShowPaymentModal(false);
      setMpesaRef('');
      setSelectedBundle(null);
    } catch (error) {
      console.error(error);
      alert('Error submitting payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateScore = () => {
    if (!practiceExam || !practiceExam.questions) return { correct: 0, total: 0, percentage: 0 };
    let correct = 0;
    practiceExam.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        correct++;
      }
    });
    const total = practiceExam.questions.length;
    return { correct, total, percentage: Math.round((correct / total) * 100) };
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 md:p-10 shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5" /> Structured Nursing Curriculum Bank
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Exam Bank & Repository</h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Practice and master board-standard nursing exams classified by Exam Authority (NCK, NCLEX-RN, HESI, GED) and Clinical Specialties.
          </p>
        </div>
      </div>

      {/* Live Question Bank Inventory Bar */}
      <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-xs">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900">Actual Question Bank Inventory</h2>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Live Tracking
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Track the exact number of questions available across NCK, NCLEX-RN, HESI, and GED exam modes in real-time.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-500">Total System Questions:</span>
            <span className="text-sm font-extrabold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-lg border border-blue-200">
              {boardQuestionCounts['All'] || 0}
            </span>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAllExamsAndQuestions}
            disabled={loadingDb}
            className="text-xs font-bold gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingDb ? 'animate-spin' : ''}`} /> Sync Bank ({dbQuestionsCount} Live Additions)
          </Button>
        </div>
      </div>

      {/* Board Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {examBoards.map((board) => {
          const count = boardQuestionCounts[board.id] || 0;
          return (
            <button
              key={board.id}
              onClick={() => setSelectedBoard(board.id)}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                selectedBoard === board.id
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md ring-2 ring-blue-500/20'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                    selectedBoard === board.id ? 'text-blue-200' : 'text-slate-400'
                  }`}>
                    {board.id === 'All' ? 'Complete' : 'Authority'}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                    selectedBoard === board.id 
                      ? 'bg-white/20 text-white' 
                      : 'bg-blue-50 text-blue-700 border border-blue-100'
                  }`}>
                    {count} {count === 1 ? 'Question' : 'Questions'}
                  </span>
                </div>
                <h3 className="font-bold text-sm md:text-base">{board.label}</h3>
              </div>
              <p className={`text-[11px] mt-2 line-clamp-2 ${
                selectedBoard === board.id ? 'text-blue-100' : 'text-slate-500'
              }`}>
                {board.description}
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

            <div className="flex items-center border border-slate-200 rounded-lg p-1 bg-slate-50">
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
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Grid className="w-3.5 h-3.5" /> Grid View
              </button>
            </div>
          </div>
        </div>

        {/* Clinical Domain Specialty Filter Pills */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
          <Tag className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-bold text-slate-500 shrink-0 mr-1">Specialties:</span>
          {clinicalDomains.map((domain) => (
            <button
              key={domain}
              onClick={() => setSelectedDomain(domain)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedDomain === domain
                  ? 'bg-blue-100 text-blue-800 border border-blue-300 font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent'
              }`}
            >
              {domain}
            </button>
          ))}
        </div>
      </div>

      {/* Main Exam Content View */}
      {viewMode === 'classified' ? (
        /* Classified Folder View */
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
                  setSearchQuery('');
                }}
              >
                Reset All Filters
              </Button>
            </div>
          ) : (
            Object.entries(groupedExams).map(([catKey, exams]) => {
              const isExpanded = expandedCategories[catKey] !== false;
              const boardInfo = examBoards.find(b => b.id === catKey);

              return (
                <div key={catKey} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  {/* Classification Category Header */}
                  <div 
                    onClick={() => toggleCategory(catKey)}
                    className="p-4 md:p-5 bg-slate-50/80 hover:bg-slate-100/80 transition-colors border-b border-slate-200 flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg font-bold ${
                        catKey === 'NCK' ? 'bg-purple-100 text-purple-700' :
                        catKey === 'NCLEX' ? 'bg-blue-100 text-blue-700' :
                        catKey === 'HESI' ? 'bg-rose-100 text-rose-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {isExpanded ? <FolderOpen className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-extrabold text-slate-900">{boardInfo?.label || catKey}</h2>
                          <span className="bg-blue-100 text-blue-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">
                            {boardQuestionCounts[catKey] || 0} Questions Available
                          </span>
                          <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                            {exams.length} {exams.length === 1 ? 'Exam Item' : 'Exam Items'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{boardInfo?.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 hidden sm:inline">
                        {isExpanded ? 'Collapse Category' : 'Expand Category'}
                      </span>
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                    </div>
                  </div>

                  {/* Category Items List */}
                  {isExpanded && (
                    <div className="divide-y divide-slate-100">
                      {exams.map((exam) => (
                        <div key={exam.id} className="p-4 md:p-6 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-2 max-w-3xl">
                            <div className="flex flex-wrap items-center gap-2">
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
                              {!exam.isPremium && (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                                  Free Practice Mode
                                </span>
                              )}
                            </div>

                            <h3 className="text-base md:text-lg font-bold text-slate-900">{exam.title}</h3>

                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                              <div className="flex items-center gap-1">
                                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                                <span><strong>{exam.questionCount}</strong> Questions</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span><strong>{exam.durationMinutes}</strong> Minutes</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                            <div className="text-left md:text-right">
                              <span className="text-xs text-slate-400 block font-medium">Access Fee</span>
                              <span className="text-base font-extrabold text-slate-900">
                                {exam.price}
                              </span>
                            </div>

                            <Button 
                              onClick={() => handleAction(exam)}
                              className={`gap-2 ${
                                !exam.isPremium 
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                            >
                              {!exam.isPremium ? (
                                <><Play className="w-4 h-4 fill-white" /> Start Practice</>
                              ) : (
                                <><ShoppingCart className="w-4 h-4" /> Enroll / Buy</>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam) => (
            <Card key={exam.id} className="hover:shadow-md transition-shadow group overflow-hidden border-slate-200 flex flex-col">
              <CardContent className="p-0 flex flex-col h-full">
                <div className="p-6 border-b border-slate-100 flex-grow space-y-4">
                  <div className="flex justify-between items-start">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${exam.bg} ${exam.color}`}>
                      <exam.icon className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                      {exam.category}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
                      {exam.domain}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                      {exam.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exam.questionCount} Questions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exam.durationMinutes} Mins</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-100">
                  <div className="text-lg font-bold text-slate-900">
                    {exam.price}
                  </div>
                  <Button 
                    onClick={() => handleAction(exam)} 
                    size="sm"
                    className={!exam.isPremium ? 'bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5' : 'bg-blue-600 hover:bg-blue-700 text-white gap-1.5'}
                  >
                    {!exam.isPremium ? <><Play className="w-3.5 h-3.5 fill-white" /> Practice</> : <><ShoppingCart className="w-3.5 h-3.5" /> Buy Now</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Practice Exam Interactive Runner Modal */}
      {practiceExam && practiceExam.questions && practiceExam.questions.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <span className="text-xs text-blue-400 font-bold uppercase tracking-widest block">
                  {practiceExam.category} Practice Mode
                </span>
                <h3 className="font-bold text-lg">{practiceExam.title}</h3>
              </div>
              <button 
                onClick={() => setPracticeExam(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {!examCompleted ? (
              <div className="p-6 md:p-8 space-y-6">
                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Question {currentQuestionIndex + 1} of {practiceExam.questions.length}</span>
                    <span>{Math.round(((currentQuestionIndex + 1) / practiceExam.questions.length) * 100)}% Completed</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full transition-all duration-300"
                      style={{ width: `${((currentQuestionIndex + 1) / practiceExam.questions.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Question Stem */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-900 text-base leading-relaxed">
                    {practiceExam.questions[currentQuestionIndex].question}
                  </p>
                </div>

                {/* Answer Options */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Select the single best answer:
                  </label>
                  {practiceExam.questions[currentQuestionIndex].options?.map((opt: string, i: number) => {
                    const isSelected = selectedAnswers[currentQuestionIndex] === opt;
                    const isCorrect = opt === practiceExam.questions![currentQuestionIndex].correctAnswer;
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
                </div>

                {/* Clinical Explanation Rationale */}
                {showRationale[currentQuestionIndex] && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                    <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wider block">
                      Clinical Rationale & Explanation
                    </span>
                    <p className="text-xs text-blue-950 leading-relaxed">
                      {practiceExam.questions[currentQuestionIndex].explanation || 'Proper clinical judgment requires continuous monitoring and adherence to established protocols.'}
                    </p>
                  </div>
                )}

                {/* Navigation Footer */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <Button
                    variant="outline"
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                  >
                    Previous
                  </Button>

                  {currentQuestionIndex < practiceExam.questions.length - 1 ? (
                    <Button 
                      onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                      className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    >
                      Next Question <ChevronRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => setExamCompleted(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    >
                      Complete & View Score <Award className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              /* Score Summary View */
              <div className="p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <Award className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900">Practice Exam Finished!</h3>
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
    </div>
  );
}

