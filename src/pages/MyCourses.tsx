import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  BookOpen, Brain, Activity, Clock, CheckCircle, Clock3, AlertCircle, 
  Search, Play, ArrowRight, ShieldCheck, Layers, Sparkles, RefreshCw, 
  HelpCircle, ChevronRight, ChevronLeft, Award, Plus, FolderCheck, Lock, Unlock, FileText
} from 'lucide-react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';
import { ALL_QUIZ_QUESTIONS, NURSING_UNITS } from '@/data/quizQuestions';
import { normalizeQuestion } from '@/lib/utils';

interface CourseItem {
  id: string;
  title: string;
  category: string;
  domain: string;
  questionCount: number;
  durationMinutes: number;
  paymentStatus: 'Approved' | 'Completed' | 'Pending' | 'Free Practice';
  purchasedDate: string;
  amountPaid: string;
  refCode?: string;
  questions?: any[];
  description?: string;
  isStarter?: boolean;
}

// Starter / Free Enrolled Courses for every student
const STARTER_COURSES: CourseItem[] = [
  {
    id: 'starter-nclex-1',
    title: 'NCLEX-RN NextGen Clinical Judgment Set',
    category: 'NCLEX',
    domain: 'Pharmacology & Parenteral Therapies',
    questionCount: 50,
    durationMinutes: 60,
    paymentStatus: 'Free Practice',
    purchasedDate: 'Default Starter Access',
    amountPaid: 'Free',
    isStarter: true,
    description: 'Master NGN Next Generation bowtie, matrix, and clinical case study scenarios with Saunders-aligned rationales.',
    questions: ALL_QUIZ_QUESTIONS.slice(0, 15)
  },
  {
    id: 'starter-hesi-1',
    title: 'HESI Pediatric Nursing Specialty Practice',
    category: 'HESI',
    domain: 'Pediatric Nursing',
    questionCount: 30,
    durationMinutes: 45,
    paymentStatus: 'Free Practice',
    purchasedDate: 'Default Starter Access',
    amountPaid: 'Free',
    isStarter: true,
    description: 'Growth and development benchmarks, pediatric dosage calculations, and critical pediatric nursing interventions.',
    questions: ALL_QUIZ_QUESTIONS.filter(q => q.unitDomain === 'Pediatric Nursing' || q.unitDomain === 'Maternal & Child Health').slice(0, 10)
  }
];

export default function MyCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseItem[]>(STARTER_COURSES);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Practice Exam State
  const [practiceCourse, setPracticeCourse] = useState<CourseItem | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showRationale, setShowRationale] = useState<Record<number, boolean>>({});
  const [examCompleted, setExamCompleted] = useState(false);

  // Syllabus Modal State
  const [syllabusCourse, setSyllabusCourse] = useState<CourseItem | null>(null);

  // Keyboard Arrow Shortcut Navigation
  useEffect(() => {
    if (!practiceCourse || examCompleted) return;
    const questionsLength = practiceCourse.questions?.length || 0;
    if (questionsLength === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowLeft') {
        setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentQuestionIndex(prev => Math.min(questionsLength - 1, prev + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [practiceCourse, examCompleted]);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    // Subscribe to Firestore payments for current user
    const userEmail = auth.currentUser.email || '';
    const userId = auth.currentUser.uid;

    const q = query(collection(db, 'payments'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userPurchases: CourseItem[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Check if payment belongs to this user
        if (data.userId === userId || data.user === userEmail) {
          const status = (data.status === 'Approved' || data.status === 'Completed') 
            ? 'Completed' 
            : 'Pending';

          const title = data.planName || data.plan || data.title || 'Nursing Exam Package';
          const category = data.category || (title.includes('NCK') ? 'NCK' : title.includes('HESI') ? 'HESI' : title.includes('GED') ? 'GED' : 'NCLEX');
          const domain = data.domain || 'Medical-Surgical Nursing';

          // Match matching questions from database or preset repository
          const categoryQuestions = ALL_QUIZ_QUESTIONS.filter(q => 
            q.examMode === category || q.unitDomain === domain
          );

          userPurchases.push({
            id: docSnap.id,
            title,
            category,
            domain,
            questionCount: data.questionCount || (categoryQuestions.length > 0 ? categoryQuestions.length : 50),
            durationMinutes: data.durationMinutes || 90,
            paymentStatus: status as any,
            purchasedDate: data.date || data.createdAt ? new Date(data.createdAt || Date.now()).toLocaleDateString() : 'Recently Enrolled',
            amountPaid: data.amountKes ? `Ksh ${data.amountKes.toLocaleString()}` : data.amountUsd ? `$${data.amountUsd}` : data.amount || 'Paid',
            refCode: data.mpesaRef || data.receiptNumber || `REF-${docSnap.id.substring(0, 6).toUpperCase()}`,
            description: `Full access to ${title} curriculum bank including past paper questions and answer rationales.`,
            questions: categoryQuestions.length > 0 ? categoryQuestions : ALL_QUIZ_QUESTIONS.slice(0, 20)
          });
        }
      });

      // Combine starter courses with user purchased courses
      const allCombined = [...STARTER_COURSES, ...userPurchases];
      // Deduplicate by title/id
      const uniqueCourses = allCombined.reduce((acc: CourseItem[], item) => {
        if (!acc.some(c => c.id === item.id || (c.title === item.title && c.isStarter === item.isStarter))) {
          acc.push(item);
        }
        return acc;
      }, []);

      setCourses(uniqueCourses);
      setLoading(false);
    }, (err) => {
      console.error('Error listening to user purchases:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredCourses = courses.filter(course => {
    const matchesTab = 
      activeTab === 'all' ? true :
      activeTab === 'active' ? (course.paymentStatus === 'Approved' || course.paymentStatus === 'Completed' || course.paymentStatus === 'Free Practice') :
      (course.paymentStatus === 'Pending');

    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    const matchesSearch = 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesCategory && matchesSearch;
  });

  const handleStartExam = (course: CourseItem) => {
    if (course.paymentStatus === 'Pending') {
      alert('This exam bundle is currently pending payment verification by administrators. It will unlock immediately once approved.');
      return;
    }
    setPracticeCourse(course);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowRationale({});
    setExamCompleted(false);
  };

  const calculateScore = () => {
    if (!practiceCourse || !practiceCourse.questions) return { correct: 0, total: 0, percentage: 0 };
    let correct = 0;
    practiceCourse.questions.forEach((q, idx) => {
      const normalized = normalizeQuestion(q);
      if (selectedAnswers[idx] === normalized.correctAnswer) {
        correct++;
      }
    });
    const total = practiceCourse.questions.length;
    return { correct, total, percentage: total > 0 ? Math.round((correct / total) * 100) : 0 };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <FolderCheck className="w-3.5 h-3.5" /> Enrolled Learning Hub
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">
              My Courses & Unlocked Exam Bundles
            </h1>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
              Access your active nursing exam subscriptions, purchased board mock bundles (NCK, NCLEX-RN, HESI, GED), and starter practice sets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button 
              onClick={() => navigate('/dashboard/exams')}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold gap-2 text-xs shadow-md shadow-blue-900/30"
            >
              <Plus className="w-4 h-4" />
              Explore Exam Bank
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Enrolled</p>
            <p className="text-xl font-black text-slate-900">{courses.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Unlock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Active & Unlocked</p>
            <p className="text-xl font-black text-emerald-600">
              {courses.filter(c => c.paymentStatus !== 'Pending').length}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Clock3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Pending Verification</p>
            <p className="text-xl font-black text-amber-600">
              {courses.filter(c => c.paymentStatus === 'Pending').length}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Qbank Questions</p>
            <p className="text-xl font-black text-slate-900">
              {courses.reduce((sum, c) => sum + (c.questionCount || 0), 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'All Courses' },
            { id: 'active', label: 'Active / Unlocked' },
            { id: 'pending', label: 'Pending Approval' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Board Category & Search Input */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="All">All Boards</option>
            <option value="NCK">NCK (Kenya)</option>
            <option value="NCLEX">NCLEX-RN</option>
            <option value="HESI">HESI Assessment</option>
            <option value="GED">GED Prep</option>
          </select>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search my courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Courses List */}
      {loading ? (
        <div className="text-center py-16 space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading your purchased exam courses...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="font-bold text-slate-800 text-base">No Enrolled Courses Found</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {searchQuery || selectedCategory !== 'All' || activeTab !== 'all' 
                ? 'No purchased courses match your current search parameters.'
                : 'You have not enrolled in any paid exam bundles yet. Browse our comprehensive exam bank to unlock full licensing mock sets!'}
            </p>
          </div>
          <Button 
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setActiveTab('all');
              navigate('/dashboard/exams');
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs gap-2"
          >
            <Plus className="w-4 h-4" />
            Explore Exam Bank & Unlock Bundles
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const isUnlocked = course.paymentStatus === 'Approved' || course.paymentStatus === 'Completed' || course.paymentStatus === 'Free Practice';

            return (
              <div 
                key={course.id} 
                className={`bg-white rounded-xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  isUnlocked ? 'border-slate-200 hover:border-blue-300' : 'border-amber-200 bg-amber-50/20'
                }`}
              >
                <div>
                  {/* Top Bar Badges */}
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wide ${
                        course.category === 'NCK' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                        course.category === 'NCLEX' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                        course.category === 'HESI' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}>
                        {course.category}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 truncate max-w-[140px]">
                        {course.domain}
                      </span>
                    </div>

                    {isUnlocked ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        {course.paymentStatus === 'Free Practice' ? 'Starter Access' : 'Active'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded-full animate-pulse">
                        <Clock3 className="w-3 h-3" />
                        Pending Approval
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-slate-900 text-base leading-snug">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>

                    {/* Metadata Pill Grid */}
                    <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-md border border-slate-100">
                        <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span><strong>{course.questionCount}</strong> Questions</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-md border border-slate-100">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span><strong>{course.durationMinutes}</strong> Mins</span>
                      </div>
                    </div>

                    {/* Order Reference Footnote */}
                    <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between border-t border-slate-100 mt-2">
                      <span>Ref: <strong className="font-mono text-slate-600">{course.refCode || 'DEFAULT'}</strong></span>
                      <span>Paid: <strong className="text-slate-700">{course.amountPaid}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 space-y-2">
                  {isUnlocked ? (
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleStartExam(course)}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs gap-1.5 shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Start Exam
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setSyllabusCourse(course)}
                        title="View Syllabus & Questions"
                        className="text-slate-700 hover:text-slate-900 border-slate-200 text-xs px-2.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => navigate('/dashboard/assistant')}
                        title="Ask AI Tutor"
                        className="text-purple-600 border-purple-200 hover:bg-purple-50 text-xs px-2.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 p-2 bg-amber-100/60 border border-amber-200 rounded-lg text-amber-800 text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Verification in progress</span>
                      </div>
                      <Button 
                        size="sm"
                        variant="ghost" 
                        onClick={() => alert(`Payment reference ${course.refCode} is being verified by admin staff. You will receive immediate access once confirmed.`)}
                        className="text-[11px] text-amber-800 underline p-0 hover:bg-transparent"
                      >
                        Status Info
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Practice Exam Modal */}
      {practiceCourse && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  {practiceCourse.category} • {practiceCourse.domain}
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  {practiceCourse.title}
                </h3>
              </div>
              <button 
                onClick={() => setPracticeCourse(null)} 
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-2 hover:bg-slate-100 rounded-lg"
              >
                ✕ Close
              </button>
            </div>

            {/* Questions Player */}
            {!examCompleted ? (
              practiceCourse.questions && practiceCourse.questions.length > 0 ? (() => {
                const currentQ = normalizeQuestion(practiceCourse.questions[currentQuestionIndex]);
                return (
                  <div className="space-y-6 pb-20">
                    {/* Progress Indicator & Top Quick Nav Header */}
                    <div className="space-y-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
                      <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-slate-500 font-semibold">
                        <span className="font-semibold text-slate-700">
                          Question {currentQuestionIndex + 1} of {practiceCourse.questions.length} ({Math.round(((currentQuestionIndex + 1) / practiceCourse.questions.length) * 100)}%)
                        </span>

                        {/* Top Header Quick Nav Buttons */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentQuestionIndex === 0}
                            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                            className="h-8 text-xs px-3 gap-1 shadow-2xs bg-white"
                            title="Previous Question (Left Arrow)"
                          >
                            <ChevronLeft className="w-4 h-4" /> Previous
                          </Button>

                          {currentQuestionIndex < practiceCourse.questions.length - 1 ? (
                            <Button
                              size="sm"
                              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                              className="h-8 text-xs px-3 bg-blue-600 hover:bg-blue-700 text-white gap-1 shadow-xs font-bold"
                              title="Next Question (Right Arrow)"
                            >
                              Next <ChevronRight className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => setExamCompleted(true)}
                              className="h-8 text-xs px-3 bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-extrabold shadow-xs"
                            >
                              Submit <Award className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-600 h-full transition-all duration-300" 
                          style={{ width: `${((currentQuestionIndex + 1) / practiceCourse.questions.length) * 100}%` }}
                        />
                      </div>

                      {/* Question Jump Pills */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                          Jump:
                        </span>
                        {practiceCourse.questions.map((_, idx) => (
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
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900 text-sm md:text-base leading-relaxed">
                        {currentQ.question}
                      </h4>
                    </div>

                    {/* Options List */}
                    <div className="space-y-2">
                      {currentQ.options.map((opt: string, oIdx: number) => {
                        const isSelected = selectedAnswers[currentQuestionIndex] === opt;
                        const isCorrect = opt === currentQ.correctAnswer;
                        const revealed = showRationale[currentQuestionIndex];

                        let btnStyle = "bg-white border-slate-200 text-slate-800 hover:border-blue-400 hover:bg-blue-50/50";
                        if (isSelected) {
                          btnStyle = "bg-blue-50 border-blue-600 text-blue-900 font-semibold";
                        }
                        if (revealed) {
                          if (isCorrect) {
                            btnStyle = "bg-emerald-50 border-emerald-600 text-emerald-900 font-bold";
                          } else if (isSelected && !isCorrect) {
                            btnStyle = "bg-rose-50 border-rose-500 text-rose-900";
                          }
                        }

                        return (
                          <button
                            key={oIdx}
                            onClick={() => {
                              setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: opt }));
                            }}
                            className={`w-full text-left p-3.5 rounded-xl border text-xs md:text-sm transition-all flex items-center justify-between gap-3 ${btnStyle}`}
                          >
                            <span>{opt}</span>
                            {revealed && isCorrect && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Rationale Drawer */}
                    {showRationale[currentQuestionIndex] && (
                      <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-xl space-y-1 text-xs text-emerald-950">
                        <p className="font-bold text-emerald-800 flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4 text-emerald-600" />
                          Saunders Clinical Rationale:
                        </p>
                        <p className="leading-relaxed text-slate-700">
                          {currentQ.explanation}
                        </p>
                      </div>
                    )}

                    {/* Sticky Bottom Question Action Bar - Always visible */}
                    <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md pt-3 pb-3 px-4 sm:px-6 border-t border-slate-200/90 shadow-lg z-30 rounded-b-2xl flex items-center justify-between gap-2 -mx-6 -mb-6">
                      <Button
                        variant="outline"
                        onClick={() => setShowRationale(prev => ({ ...prev, [currentQuestionIndex]: !prev[currentQuestionIndex] }))}
                        className="text-xs text-purple-700 border-purple-200 hover:bg-purple-50 shrink-0"
                      >
                        {showRationale[currentQuestionIndex] ? 'Hide Rationale' : 'Check Rationale'}
                      </Button>

                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          disabled={currentQuestionIndex === 0}
                          onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                          className="text-xs font-semibold gap-1"
                        >
                          <ChevronLeft className="w-4 h-4" /> Prev
                        </Button>

                        {currentQuestionIndex < practiceCourse.questions.length - 1 ? (
                          <Button 
                            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-1 shadow-sm"
                          >
                            Next <ChevronRight className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => setExamCompleted(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm gap-1"
                          >
                            Submit <Award className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-500">No questions available in this bundle player.</p>
                </div>
              )
            ) : (
              /* Exam Completed Summary */
              <div className="text-center space-y-6 py-6">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Award className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-2xl font-black text-slate-900">Exam Attempt Completed!</h4>
                  <p className="text-xs text-slate-500">Here is your performance summary for {practiceCourse.title}</p>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 inline-block max-w-sm w-full space-y-2">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Overall Score</p>
                  <p className="text-4xl font-black text-emerald-600">
                    {calculateScore().percentage}%
                  </p>
                  <p className="text-xs text-slate-600">
                    Correct Answers: <strong>{calculateScore().correct}</strong> / {calculateScore().total}
                  </p>
                </div>

                <div className="flex justify-center gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setCurrentQuestionIndex(0);
                      setSelectedAnswers({});
                      setShowRationale({});
                      setExamCompleted(false);
                    }}
                    className="text-xs"
                  >
                    Retake Exam
                  </Button>
                  <Button 
                    onClick={() => setPracticeCourse(null)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                  >
                    Back to My Courses
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Syllabus View Modal */}
      {syllabusCourse && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Course Syllabus & Curriculum</h3>
              </div>
              <button 
                onClick={() => setSyllabusCourse(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="font-bold text-slate-900 text-sm">{syllabusCourse.title}</p>
                <p className="text-slate-500 text-xs mt-0.5">{syllabusCourse.description}</p>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-800 text-xs">Included Content & Modules:</p>
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2 bg-slate-50 p-2 rounded-md">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span><strong>{syllabusCourse.questionCount}</strong> Saunders & Board-Standard Board Practice Questions</span>
                  </li>
                  <li className="flex items-center gap-2 bg-slate-50 p-2 rounded-md">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Domain Specialization: <strong>{syllabusCourse.domain}</strong></span>
                  </li>
                  <li className="flex items-center gap-2 bg-slate-50 p-2 rounded-md">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Integrated Clinical Judgment & Rationale Explanations</span>
                  </li>
                  <li className="flex items-center gap-2 bg-slate-50 p-2 rounded-md">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>NursePrep AI Tutor Integration for Instant Clarifications</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button 
                onClick={() => {
                  const target = syllabusCourse;
                  setSyllabusCourse(null);
                  handleStartExam(target);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Launch Course Practice
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
