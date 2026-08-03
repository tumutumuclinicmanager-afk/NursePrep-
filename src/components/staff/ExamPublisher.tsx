import React, { useState, useEffect } from 'react';
import { 
  Plus, Layers, ShieldCheck, Lock, Eye, EyeOff, Edit, Trash2, 
  CheckCircle2, AlertCircle, RefreshCw, BookOpen, Filter, 
  Save, X, HelpCircle, ArrowRight, Zap, Award 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { QuestionData } from '@/types';

export interface ExamDoc {
  id?: string;
  title: string;
  category: string;
  domain: string;
  description?: string;
  requiredPlan: 'free' | 'basic' | 'gold' | 'platinum';
  questionLimits: {
    free: number;
    basic: number;
    gold: number;
    platinum: number;
  };
  isPublished: boolean;
  questions?: any[];
  createdAt?: string;
  createdBy?: string;
}

const DEFAULT_EXAM_TYPES = [
  // Entrance Exams
  'ATI TEAS',
  'HESI A2',
  'ACCUPLACER',
  'GED',
  'HISET',

  // Nursing Exams
  'NCK',
  'NCLEX-RN',
  'NCLEX-PN',
  'ATI RN',
  'ATI LPN',
  'HESI RN',
  'HESI LPN',
  'Examplify RN',
  'Examplify LPN',

  // Exit Exams
  'ATI Exit Exam',
  'HESI Exit Exam',
  'Examplify Exit Exam'
];

const DEFAULT_DOMAINS = [
  'Medical-Surgical Nursing',
  'Pharmacology & Parenteral Therapies',
  'Pediatrics & Child Health',
  'Maternal & Newborn Health',
  'Psychiatric & Mental Health',
  'Community & Public Health',
  'Nursing Fundamentals & Leadership',
  'Critical Care & Emergency Nursing'
];

export default function ExamPublisher({ onExamUpdated }: { onExamUpdated?: () => void }) {
  const [exams, setExams] = useState<ExamDoc[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<QuestionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(DEFAULT_EXAM_TYPES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [domain, setDomain] = useState(DEFAULT_DOMAINS[0]);
  const [description, setDescription] = useState('');
  const [requiredPlan, setRequiredPlan] = useState<'free' | 'basic' | 'gold' | 'platinum'>('free');
  
  // Question Limits per Plan
  const [freeLimit, setFreeLimit] = useState<number>(5);
  const [basicLimit, setBasicLimit] = useState<number>(25);
  const [goldLimit, setGoldLimit] = useState<number>(0); // 0 = Unlimited
  const [platinumLimit, setPlatinumLimit] = useState<number>(0);

  const [isPublished, setIsPublished] = useState(true);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [autoLinkCategoryQuestions, setAutoLinkCategoryQuestions] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchExamsAndQuestions = async () => {
    try {
      setLoading(true);

      // 1. Fetch Exams
      const examsSnap = await getDocs(query(collection(db, 'exams')));
      const examList: ExamDoc[] = examsSnap.docs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<ExamDoc, 'id'>)
      }));
      setExams(examList);

      // 2. Fetch Questions
      const questionsSnap = await getDocs(query(collection(db, 'questions')));
      const qList: QuestionData[] = questionsSnap.docs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<QuestionData, 'id'>)
      }));
      setAvailableQuestions(qList);

    } catch (err) {
      console.error("Error fetching exams in publisher:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamsAndQuestions();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingExamId(null);
    setTitle('');
    setCategory(DEFAULT_EXAM_TYPES[0]);
    setCustomCategory('');
    setDomain(DEFAULT_DOMAINS[0]);
    setDescription('');
    setRequiredPlan('free');
    setFreeLimit(5);
    setBasicLimit(25);
    setGoldLimit(0);
    setPlatinumLimit(0);
    setIsPublished(true);
    setSelectedQuestionIds([]);
    setAutoLinkCategoryQuestions(true);
    setShowFormModal(true);
  };

  const handleOpenEditModal = (exam: ExamDoc) => {
    setEditingExamId(exam.id || null);
    setTitle(exam.title || '');
    
    if (DEFAULT_EXAM_TYPES.includes(exam.category)) {
      setCategory(exam.category);
      setCustomCategory('');
    } else {
      setCategory('CUSTOM');
      setCustomCategory(exam.category);
    }

    setDomain(exam.domain || DEFAULT_DOMAINS[0]);
    setDescription(exam.description || '');
    setRequiredPlan(exam.requiredPlan || 'free');
    setFreeLimit(exam.questionLimits?.free ?? 5);
    setBasicLimit(exam.questionLimits?.basic ?? 25);
    setGoldLimit(exam.questionLimits?.gold ?? 0);
    setPlatinumLimit(exam.questionLimits?.platinum ?? 0);
    setIsPublished(exam.isPublished !== false);
    
    if (exam.questions && Array.isArray(exam.questions)) {
      setSelectedQuestionIds(exam.questions.map((q: any) => q.id || q.questionStem).filter(Boolean));
    } else {
      setSelectedQuestionIds([]);
    }
    setAutoLinkCategoryQuestions(false);
    setShowFormModal(true);
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Please enter an Exam Title.");
      return;
    }

    const finalCategory = category === 'CUSTOM' ? (customCategory.trim() || 'Custom Exam') : category;

    // Filter questions to attach
    let attachedQuestions: any[] = [];

    if (autoLinkCategoryQuestions) {
      // Auto link all questions matching this category
      attachedQuestions = availableQuestions.filter(q => {
        const mode = (q.examMode || '').toUpperCase();
        const catUpper = finalCategory.toUpperCase();
        return mode.includes(catUpper) || catUpper.includes(mode) || q.unitDomain === domain;
      }).map(q => ({
        id: q.id,
        question: q.questionStem || (q as any).question || 'Question Stem',
        options: q.options ? q.options.map((o: any) => typeof o === 'string' ? o : o.text) : ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: q.options ? (q.options.find((o: any) => o.isCorrect)?.text || q.options[0]?.text) : 'Option A',
        explanation: q.rationale || (q as any).explanation || ''
      }));
    } else if (selectedQuestionIds.length > 0) {
      attachedQuestions = availableQuestions.filter(q => q.id && selectedQuestionIds.includes(q.id)).map(q => ({
        id: q.id,
        question: q.questionStem || (q as any).question || 'Question Stem',
        options: q.options ? q.options.map((o: any) => typeof o === 'string' ? o : o.text) : ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: q.options ? (q.options.find((o: any) => o.isCorrect)?.text || q.options[0]?.text) : 'Option A',
        explanation: q.rationale || (q as any).explanation || ''
      }));
    }

    const payload: Omit<ExamDoc, 'id'> = {
      title: title.trim(),
      category: finalCategory,
      domain,
      description: description.trim(),
      requiredPlan,
      questionLimits: {
        free: Number(freeLimit),
        basic: Number(basicLimit),
        gold: Number(goldLimit),
        platinum: Number(platinumLimit),
      },
      isPublished,
      questions: attachedQuestions,
      createdAt: new Date().toISOString(),
      createdBy: 'Lecturer / Admin'
    };

    setIsSaving(true);
    try {
      const sanitizedPayload = JSON.parse(JSON.stringify(payload));
      if (editingExamId) {
        await updateDoc(doc(db, 'exams', editingExamId), sanitizedPayload);
        alert("Exam configuration successfully updated!");
      } else {
        await addDoc(collection(db, 'exams'), sanitizedPayload);
        alert(`New Exam "${title.trim()}" published under Category "${finalCategory}"!`);
      }

      setShowFormModal(false);
      fetchExamsAndQuestions();
      if (onExamUpdated) onExamUpdated();
    } catch (err: any) {
      console.error("Error saving exam doc:", err);
      alert(`Failed to save exam to database: ${err?.message || 'Unknown database error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (exam: ExamDoc) => {
    if (!exam.id) return;
    try {
      const nextState = !exam.isPublished;
      await updateDoc(doc(db, 'exams', exam.id), { isPublished: nextState });
      setExams(prev => prev.map(e => e.id === exam.id ? { ...e, isPublished: nextState } : e));
    } catch (err) {
      console.error("Error toggling publish status:", err);
      alert("Failed to update status.");
    }
  };

  const handleDeleteExam = async (id?: string) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this exam document?")) return;
    try {
      await deleteDoc(doc(db, 'exams', id));
      setExams(prev => prev.filter(e => e.id !== id));
      if (onExamUpdated) onExamUpdated();
    } catch (err) {
      console.error("Failed to delete exam:", err);
      alert("Failed to delete exam from Firestore.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-800/60 px-3 py-1 rounded-full text-xs font-semibold text-blue-200 mb-2 border border-blue-700/50">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Exam Visibility & Subscription Management
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Exam Publisher & Plan Access Control</h2>
          <p className="text-blue-200 text-sm mt-1 max-w-2xl">
            Create custom exam types, publish exam bundles, and specify required subscription tiers and question display limits for students.
          </p>
        </div>

        <Button 
          onClick={handleOpenCreateModal}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create New Exam / Exam Type
        </Button>
      </div>

      {/* Main List of Exams */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Published & Custom Exams ({exams.length})</h3>
            <p className="text-slate-500 text-xs">Exams listed here reflect immediately on student dashboards and exam banks according to assigned plan rules.</p>
          </div>

          <Button variant="outline" size="sm" onClick={fetchExamsAndQuestions} disabled={loading} className="text-xs gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Exams
          </Button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="text-xs font-bold mt-2">Loading exam documents from database...</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl space-y-3">
            <p className="text-sm font-bold text-slate-700">No custom exams published yet.</p>
            <p className="text-xs text-slate-500">Click "Create New Exam" above to add custom exam types (e.g., ATI TEAS, NCK Paper 1, Prometric Nursing) and configure student plan limits.</p>
            <Button onClick={handleOpenCreateModal} className="bg-blue-600 text-white text-xs">Create First Exam</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((exam) => {
              const qCount = exam.questions ? exam.questions.length : 0;
              
              let planBadge = { label: 'Free Access', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
              if (exam.requiredPlan === 'basic') {
                planBadge = { label: 'Silver / Basic Plan Required', color: 'bg-slate-200 text-slate-800 border-slate-300' };
              } else if (exam.requiredPlan === 'gold') {
                planBadge = { label: 'Gold / Sure Pass Required', color: 'bg-amber-100 text-amber-900 border-amber-300 font-bold' };
              } else if (exam.requiredPlan === 'platinum') {
                planBadge = { label: 'Platinum / Master Plan Required', color: 'bg-blue-100 text-blue-900 border-blue-300 font-bold' };
              }

              return (
                <div 
                  key={exam.id} 
                  className={`p-5 rounded-2xl border transition-all space-y-4 ${
                    exam.isPublished ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-50 border-slate-300 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                          {exam.category}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${planBadge.color}`}>
                          {planBadge.label}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-base mt-1.5">{exam.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{exam.domain}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleTogglePublish(exam)}
                        title={exam.isPublished ? 'Published (Click to hide)' : 'Draft (Click to publish)'}
                        className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 ${
                          exam.isPublished ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-200 text-slate-600 border-slate-300'
                        }`}
                      >
                        {exam.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{exam.isPublished ? 'Live' : 'Hidden'}</span>
                      </button>
                    </div>
                  </div>

                  {exam.description && (
                    <p className="text-xs text-slate-600 leading-snug line-clamp-2">{exam.description}</p>
                  )}

                  {/* Question Limits Breakdown Box */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center font-bold text-slate-700">
                      <span>Total Questions Attached:</span>
                      <span className="text-blue-700">{qCount} Questions</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-medium pt-1 text-slate-600 border-t border-slate-200/60">
                      <div>Free Limit: <strong className="text-slate-900">{exam.questionLimits?.free ?? 5} Qs</strong></div>
                      <div>Basic Limit: <strong className="text-slate-900">{exam.questionLimits?.basic ?? 25} Qs</strong></div>
                      <div>Gold/Plat Limit: <strong className="text-emerald-700">{exam.questionLimits?.gold === 0 ? 'All' : `${exam.questionLimits?.gold} Qs`}</strong></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleOpenEditModal(exam)}
                      className="text-xs font-bold gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit Config
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteExam(exam.id)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Exam Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative border border-slate-200 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Exam Configuration</span>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {editingExamId ? 'Edit Exam & Subscription Rules' : 'Publish New Exam & Set Access Rules'}
                </h3>
              </div>
              <button onClick={() => setShowFormModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-4">
              {/* Exam Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Exam Title *</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. ATI TEAS 7 Science Mastery Mock Exam 2026"
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Category & Custom Category Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Exam Board / Exam Type Category *</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                  >
                    {DEFAULT_EXAM_TYPES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="CUSTOM">+ Add New Custom Exam Type...</option>
                  </select>
                </div>

                {category === 'CUSTOM' ? (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-blue-700">New Custom Exam Type Name *</label>
                    <input 
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="e.g. MIDWIFERY 101, PROMETRIC"
                      required
                      className="w-full px-3.5 py-2 border border-blue-300 rounded-xl text-sm font-bold text-blue-900 bg-blue-50/50 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Specialty Domain *</label>
                    <select 
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                    >
                      {DEFAULT_DOMAINS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Description / Instructions</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Brief summary of what this exam covers, target audience, and clinical topics."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Required Subscription Tier Section */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <h4 className="font-bold text-slate-900 text-sm">Minimum Subscription Plan to Access Exam</h4>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'free', label: 'Free Access', sub: 'All Students' },
                    { id: 'basic', label: 'Silver / Basic', sub: 'Basic Tier+' },
                    { id: 'gold', label: 'Gold / Pass', sub: 'Gold Tier+' },
                    { id: 'platinum', label: 'Master / Plat', sub: 'Full Access' }
                  ].map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setRequiredPlan(plan.id as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        requiredPlan === plan.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <strong className="block text-xs font-bold">{plan.label}</strong>
                      <span className={`text-[10px] ${requiredPlan === plan.id ? 'text-blue-100' : 'text-slate-400'}`}>
                        {plan.sub}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Display Limits Per Subscription */}
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Max Question Display Limits Per Subscription</h4>
                    <p className="text-[11px] text-slate-500">Specify how many questions students on each plan can view per attempt (0 = Unlimited / All questions).</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Free Plan Limit</label>
                    <input 
                      type="number"
                      value={freeLimit}
                      onChange={(e) => setFreeLimit(parseInt(e.target.value) || 0)}
                      min={0}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Silver/Basic Limit</label>
                    <input 
                      type="number"
                      value={basicLimit}
                      onChange={(e) => setBasicLimit(parseInt(e.target.value) || 0)}
                      min={0}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Gold/Sure Pass</label>
                    <input 
                      type="number"
                      value={goldLimit}
                      onChange={(e) => setGoldLimit(parseInt(e.target.value) || 0)}
                      min={0}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-emerald-800 bg-white"
                    />
                    <span className="text-[9px] text-slate-400 block">0 = All Qs</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Platinum/Master</label>
                    <input 
                      type="number"
                      value={platinumLimit}
                      onChange={(e) => setPlatinumLimit(parseInt(e.target.value) || 0)}
                      min={0}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-purple-800 bg-white"
                    />
                    <span className="text-[9px] text-slate-400 block">0 = All Qs</span>
                  </div>
                </div>
              </div>

              {/* Publish Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">Publish Immediately on Student Dashboards</span>
                </div>
                <input 
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setShowFormModal(false)}>Cancel</Button>
                <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2">
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingExamId ? 'Save Changes' : 'Publish Exam'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
