import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Search, Filter, BookOpen, Activity, HeartPulse, Brain, Baby, 
  ArrowRight, DollarSign, ShoppingCart, Folder, FolderOpen, 
  ChevronRight, ChevronDown, ChevronLeft, Clock, HelpCircle, CheckCircle, 
  Award, Grid, List, Play, Tag, Layers, RefreshCw, X, AlertCircle, Database, Sparkles,
  Bookmark, BookmarkCheck, Trash2, Star, Lock, Crown, ShieldCheck
} from 'lucide-react';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, where, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';
import { ALL_QUIZ_QUESTIONS, normalizeExamCategory } from '@/data/quizQuestions';
import { normalizeQuestion } from '@/lib/utils';

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

const defaultExamBundles: ExamItem[] = [
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
    id: 'nck-complete-bundle', 
    title: 'NCK Council Licensure Complete Bundle', 
    category: 'NCK', 
    domain: 'Community & Public Health', 
    price: 'Gold Plan Required', 
    numericPrice: 5000, 
    questionCount: 250, 
    durationMinutes: 300, 
    difficulty: 'Advanced', 
    isPremium: true, 
    features: ['10+ Full Mock Exams', 'Past Board Papers', 'Priority Tutor Review'], 
    icon: Activity, 
    color: 'text-purple-700', 
    bg: 'bg-purple-50',
    requiredPlan: 'gold',
    questionLimits: { free: 5, basic: 25, gold: 0, platinum: 0 }
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
    id: 'nclex-comprehensive', 
    title: 'NCLEX Comprehensive CAT Simulation', 
    category: 'NCLEX-RN', 
    domain: 'Medical-Surgical Nursing', 
    price: 'Basic Plan Required', 
    numericPrice: 25000, 
    questionCount: 500, 
    durationMinutes: 300, 
    difficulty: 'Advanced', 
    isPremium: true, 
    features: ['Computer Adaptive Test Engine', '1500+ Question Pool', 'Unlimited Re-attempts'], 
    icon: Brain, 
    color: 'text-indigo-600', 
    bg: 'bg-indigo-100',
    requiredPlan: 'basic',
    questionLimits: { free: 5, basic: 50, gold: 0, platinum: 0 }
  },
  { 
    id: 'hesi-pediatrics-1', 
    title: 'HESI Pediatric Nursing Specialty Practice', 
    category: 'HESI', 
    domain: 'Pediatric Nursing', 
    price: 'Free Access', 
    numericPrice: 0, 
    questionCount: 30, 
    durationMinutes: 45, 
    difficulty: 'Medium', 
    isPremium: false, 
    features: ['Growth & Development Benchmarks', 'Pediatric Dosage Math', 'Detailed Score Reports'], 
    icon: Baby, 
    color: 'text-rose-600', 
    bg: 'bg-rose-100',
    requiredPlan: 'free',
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
    id: 'hesi-assessment-prep', 
    title: 'HESI Exit Exam Assessment Package', 
    category: 'HESI', 
    domain: 'Maternal & Newborn Health', 
    price: 'Gold Plan Required', 
    numericPrice: 15000, 
    questionCount: 200, 
    durationMinutes: 180, 
    difficulty: 'Advanced', 
    isPremium: true, 
    features: ['Predictive Exit Score', 'Targeted Remediation', 'Performance Diagnostics'], 
    icon: HeartPulse, 
    color: 'text-rose-700', 
    bg: 'bg-rose-50',
    requiredPlan: 'gold',
    questionLimits: { free: 5, basic: 25, gold: 0, platinum: 0 }
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

export default function ExamBank() {
  const navigate = useNavigate();
  const [selectedBoard, setSelectedBoard] = useState('All');
  const [selectedDomain, setSelectedDomain] = useState('All Specialties');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'classified' | 'grid' | 'favorites'>('classified');
  
  // State for student subscription
  const [userSubscriptionPlan, setUserSubscriptionPlan] = useState<'free' | 'basic' | 'gold' | 'platinum'>('free');
  const [requiredPlanModalExam, setRequiredPlanModalExam] = useState<ExamItem | null>(null);
  const [practiceLimitInfo, setPracticeLimitInfo] = useState<{ limit: number; total: number } | null>(null);

  // State for dynamic board categories
  const [dynamicBoardCategories, setDynamicBoardCategories] = useState<string[]>(['NCK', 'NCLEX', 'NCLEX-RN', 'NCLEX-PN', 'HESI', 'GED']);

  // State for Firestore loaded exams
  const [examsList, setExamsList] = useState<ExamItem[]>(defaultExamBundles);
  const [loadingDb, setLoadingDb] = useState(false);
  const [dbQuestionsCount, setDbQuestionsCount] = useState(0);

  // Favorites / Bookmarks state
  const [favoritesList, setFavoritesList] = useState<FavoriteItem[]>([]);
  const [favoriteToast, setFavoriteToast] = useState<string | null>(null);

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
        
        // Fetch User Plan
        try {
          const userSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userSnap.exists()) {
            const uData = userSnap.data();
            const plan = (uData.subscriptionPlan || uData.plan || 'free').toLowerCase();
            if (plan.includes('plat') || plan.includes('master')) setUserSubscriptionPlan('platinum');
            else if (plan.includes('gold') || plan.includes('sure')) setUserSubscriptionPlan('gold');
            else if (plan.includes('basic') || plan.includes('silver')) setUserSubscriptionPlan('basic');
            else setUserSubscriptionPlan('free');
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

      // Merge all exam items
      const combinedExams = [...dbExams, ...dynamicBoardExams, ...defaultExamBundles];
      setExamsList(combinedExams);

      // Collect all unique categories dynamically
      const categorySet = new Set<string>(['NCK', 'NCLEX-RN', 'HESI', 'GED']);
      combinedExams.forEach(e => {
        if (e.category) categorySet.add(e.category);
      });
      const allCategories = Array.from(categorySet);
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
    const matchesBoard = selectedBoard === 'All' || exam.category === selectedBoard;
    const matchesDomain = selectedDomain === 'All Specialties' || exam.domain === selectedDomain;
    const matchesDifficulty = selectedDifficulty === 'All' || exam.difficulty === selectedDifficulty;
    const matchesQuery = searchQuery === '' || 
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      exam.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesBoard && matchesDomain && matchesDifficulty && matchesQuery;
  });

  // Group filtered exams dynamically by Board Category
  const groupedExams = dynamicBoardCategories.reduce((acc, cat) => {
    const categoryExams = filteredExams.filter(e => e.category === cat);
    if (categoryExams.length > 0) {
      acc[cat] = categoryExams;
    }
    return acc;
  }, {} as Record<string, ExamItem[]>);

  const handleAction = (exam: ExamItem) => {
    // Check if user has purchased item explicitly
    if (purchasedTitles.has(exam.title) || purchasedTitles.has(exam.id)) {
      navigate('/dashboard/courses');
      return;
    }

    const reqPlan = exam.requiredPlan || 'free';
    const reqLevel = PLAN_LEVELS[reqPlan] || 1;
    const userLevel = PLAN_LEVELS[userSubscriptionPlan] || 1;

    // 1. Subscription Tier Gate Check
    if (userLevel < reqLevel) {
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
    if (maxAllowed > 0 && maxAllowed < qList.length) {
      displayQuestions = qList.slice(0, maxAllowed);
      setPracticeLimitInfo({ limit: maxAllowed, total: qList.length });
    } else {
      setPracticeLimitInfo(null);
    }

    const launchExam: ExamItem = {
      ...exam,
      questions: displayQuestions,
      questionCount: displayQuestions.length
    };

    setPracticeExam(launchExam);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowRationale({});
    setExamCompleted(false);
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
    practiceExam.questions.forEach((q, idx) => {
      const normalized = normalizeQuestion(q);
      if (selectedAnswers[idx] === normalized.correctAnswer) {
        correct++;
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
            Practice board-standard nursing exams classified by Exam Authority (NCK, NCLEX-RN, HESI, GED, and custom uploaded categories) and Clinical Specialties.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-slate-300">Your Active Plan:</span>
            <span className="px-3 py-1 rounded-full font-extrabold bg-blue-500 text-white uppercase tracking-wider">
              {userSubscriptionPlan.toUpperCase()} PLAN
            </span>
          </div>
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
              <strong>{boardQuestionCounts['All'] || 0}</strong> items across all exam categories in real-time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
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
            <h3 className="font-bold text-sm md:text-base">All Exam Boards</h3>
          </div>
          <p className={`text-[11px] mt-2 line-clamp-2 ${
            selectedBoard === 'All' ? 'text-blue-100' : 'text-slate-500'
          }`}>
            Complete library across all licensing authorities
          </p>
        </button>

        {dynamicBoardCategories.map((catKey) => {
          const count = boardQuestionCounts[catKey] || 0;
          return (
            <button
              key={catKey}
              onClick={() => setSelectedBoard(catKey)}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                selectedBoard === catKey
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md ring-2 ring-blue-500/20'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                    selectedBoard === catKey ? 'text-blue-200' : 'text-slate-400'
                  }`}>
                    Authority
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                    selectedBoard === catKey 
                      ? 'bg-white/20 text-white' 
                      : 'bg-blue-50 text-blue-700 border border-blue-100'
                  }`}>
                    {count} {count === 1 ? 'Question' : 'Questions'}
                  </span>
                </div>
                <h3 className="font-bold text-sm md:text-base">{catKey}</h3>
              </div>
              <p className={`text-[11px] mt-2 line-clamp-2 ${
                selectedBoard === catKey ? 'text-blue-100' : 'text-slate-500'
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
                  setSearchQuery('');
                }}
              >
                Reset All Filters
              </Button>
            </div>
          ) : (
            (Object.entries(groupedExams) as [string, ExamItem[]][]).map(([catKey, exams]) => {
              const isExpanded = expandedCategories[catKey] !== false;

              return (
                <div key={catKey} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  {/* Classification Category Header */}
                  <div 
                    onClick={() => toggleCategory(catKey)}
                    className="p-4 md:p-5 bg-slate-50/80 hover:bg-slate-100/80 transition-colors border-b border-slate-200 flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg font-bold bg-blue-100 text-blue-700">
                        {isExpanded ? <FolderOpen className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-extrabold text-slate-900">{catKey}</h2>
                          <span className="bg-blue-100 text-blue-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">
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
                      {exams.map((exam) => (
                        <div key={exam.id} className="p-4 md:p-6 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
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

      {/* Practice Exam Attempt Modal */}
      {practiceExam && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col border border-slate-100">
            {/* Modal Header */}
            <div className="p-4 md:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0 sticky top-0 z-20">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 block">
                  {practiceExam.category} • {practiceExam.domain}
                </span>
                <h2 className="text-base md:text-xl font-extrabold tracking-tight">{practiceExam.title}</h2>
              </div>
              <button 
                onClick={() => setPracticeExam(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subscription Question Display Limit Banner */}
            {practiceLimitInfo && !examCompleted && (
              <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0">
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

            {/* Modal Body */}
            {!examCompleted ? (() => {
              const currentQ = normalizeQuestion(practiceExam.questions[currentQuestionIndex]);
              const rawCurrentQ = practiceExam.questions[currentQuestionIndex];
              const bookmarked = isQuestionBookmarked(currentQ.question);

              return (
                <div className="p-6 md:p-8 space-y-6 pb-24">
                  {/* Progress bar & Header Nav */}
                  <div className="space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
                    <div className="flex flex-wrap justify-between items-center gap-2 text-xs font-bold text-slate-500">
                      <span>Question {currentQuestionIndex + 1} of {practiceExam.questions.length} ({Math.round(((currentQuestionIndex + 1) / practiceExam.questions.length) * 100)}%)</span>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentQuestionIndex === 0}
                          onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                          className="h-8 text-xs px-3 gap-1 shadow-2xs bg-white"
                        >
                          <ChevronLeft className="w-4 h-4" /> Previous
                        </Button>

                        {currentQuestionIndex < practiceExam.questions.length - 1 ? (
                          <Button
                            size="sm"
                            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                            className="h-8 text-xs px-3 bg-blue-600 hover:bg-blue-700 text-white gap-1 shadow-xs"
                          >
                            Next <ChevronRight className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setExamCompleted(true)}
                            className="h-8 text-xs px-3 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-extrabold shadow-xs"
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

                    {/* Question Jump Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                        Jump:
                      </span>
                      {practiceExam.questions.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentQuestionIndex(idx)}
                          className={`w-7 h-7 text-xs font-bold rounded-lg shrink-0 transition-all ${
                            currentQuestionIndex === idx
                              ? 'bg-blue-600 text-white shadow-xs scale-105'
                              : selectedAnswers[idx] !== undefined
                              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Question Stem */}
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <p className="font-bold text-slate-900 text-base leading-relaxed flex-grow">
                      {currentQ.question}
                    </p>
                    <button
                      type="button"
                      onClick={() => toggleBookmark(rawCurrentQ, practiceExam.category, practiceExam.domain)}
                      title={bookmarked ? "Remove from Favorites" : "Save to Favorites"}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                        bookmarked 
                          ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-xs' 
                          : 'bg-white border-slate-200 text-slate-600 hover:text-amber-700 hover:bg-amber-50 hover:border-amber-200'
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

                  {/* Answer Options */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Select the single best answer:
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
                  </div>

                  {/* Clinical Explanation Rationale */}
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
              /* Exam Completion Score Screen */
              <div className="p-8 text-center space-y-6 my-auto">
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
    </div>
  );
}
