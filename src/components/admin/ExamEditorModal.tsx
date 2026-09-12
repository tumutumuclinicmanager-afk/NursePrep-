import React, { useState, useEffect } from 'react';
import { 
  X, Save, Plus, Trash2, Edit3, Check, CheckCircle2, Copy, 
  ArrowUp, ArrowDown, Search, Layers, Clock, AlertCircle, 
  HelpCircle, FileText, Sparkles, BookOpen, Crown, Shield, 
  Eye, EyeOff, ChevronRight, CheckSquare, ListPlus, Database
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { doc, setDoc, getDocs, collection, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { normalizeQuestion } from '@/lib/utils';

export interface EditableQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string | string[];
  explanation: string;
  questionType?: string; // 'single_choice' | 'multiple_select' | 'true_false' | 'numeric'
  domain?: string;
}

export interface ExamEditorData {
  id: string;
  title: string;
  category: string;
  domain: string;
  description?: string;
  difficulty?: 'Beginner' | 'Medium' | 'Advanced';
  durationMinutes?: number;
  price?: string;
  numericPrice?: number;
  questionCount?: number;
  isPremium?: boolean;
  requiredPlan?: 'free' | 'basic' | 'gold' | 'platinum';
  questionLimits?: {
    free: number;
    basic: number;
    gold: number;
    platinum: number;
  };
  isPublished?: boolean;
  features?: string[];
  questions?: any[];
  color?: string;
  bg?: string;
  icon?: any;
}

interface ExamEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: ExamEditorData | null;
  onSave: (savedExam: ExamEditorData) => void;
}

const POPULAR_EXAM_MODES = [
  'ATI TEAS',
  'HESI A2',
  'NCLEX-RN',
  'NCLEX-PN',
  'Examplify RN',
  'Examplify LPN',
  'ATI RN',
  'ATI LPN',
  'HESI RN',
  'HESI LPN',
  'ATI Exit Exam',
  'HESI Exit Exam',
  'Examplify Exit Exam',
  'NCK',
  'ACCUPLACER',
  'GED',
  'HISET'
];

const POPULAR_DOMAINS = [
  'Medical-Surgical Nursing',
  'Pharmacology & Parenteral Therapies',
  'Pediatrics & Child Health',
  'Maternal & Newborn Health',
  'Psychiatric & Mental Health',
  'Community & Public Health',
  'Nursing Fundamentals & Leadership',
  'Critical Care & Emergency Nursing',
  'Reading & Comprehension',
  'Mathematics & Algebra',
  'Science (A&P, Biology, Chemistry)',
  'English & Language Usage',
  'General Nursing Knowledge'
];

export function ExamEditorModal({ isOpen, onClose, exam, onSave }: ExamEditorModalProps) {
  const [activeTab, setActiveTab] = useState<'blueprint' | 'questions' | 'bulk'>('blueprint');
  
  // Blueprint Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(POPULAR_EXAM_MODES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [domain, setDomain] = useState(POPULAR_DOMAINS[0]);
  const [customDomain, setCustomDomain] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Medium' | 'Advanced'>('Medium');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [requiredPlan, setRequiredPlan] = useState<'free' | 'basic' | 'gold' | 'platinum'>('free');
  const [isPublished, setIsPublished] = useState(true);
  const [features, setFeatures] = useState<string[]>(['Lecturer Authored', 'Verified Rationales', 'Timed Simulation']);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [freeLimit, setFreeLimit] = useState(5);
  const [basicLimit, setBasicLimit] = useState(25);
  const [goldLimit, setGoldLimit] = useState(0); // 0 = unlimited
  const [platinumLimit, setPlatinumLimit] = useState(0);

  // Questions List
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [questionSearchQuery, setQuestionSearchQuery] = useState('');

  // Bulk Import State
  const [bulkInput, setBulkInput] = useState('');
  const [bulkParsedQuestions, setBulkParsedQuestions] = useState<EditableQuestion[]>([]);
  const [bulkParseError, setBulkParseError] = useState<string | null>(null);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Repository question picker state
  const [repoQuestions, setRepoQuestions] = useState<any[]>([]);
  const [showRepoPicker, setShowRepoPicker] = useState(false);
  const [loadingRepo, setLoadingRepo] = useState(false);

  // Populate data when modal opens or exam changes
  useEffect(() => {
    if (!isOpen || !exam) return;

    setTitle(exam.title || '');
    
    // Category check
    if (POPULAR_EXAM_MODES.includes(exam.category)) {
      setCategory(exam.category);
      setCustomCategory('');
    } else {
      setCategory('CUSTOM');
      setCustomCategory(exam.category || '');
    }

    // Domain check
    if (POPULAR_DOMAINS.includes(exam.domain)) {
      setDomain(exam.domain);
      setCustomDomain('');
    } else {
      setDomain('CUSTOM');
      setCustomDomain(exam.domain || '');
    }

    setDescription(exam.description || '');
    setDifficulty(exam.difficulty || 'Medium');
    setDurationMinutes(exam.durationMinutes || (exam.questions ? Math.max(15, exam.questions.length * 2) : 60));
    setRequiredPlan(exam.requiredPlan || 'free');
    setIsPublished(exam.isPublished !== false);
    setFeatures(exam.features && exam.features.length > 0 ? [...exam.features] : ['Lecturer Authored', 'Verified Rationales', 'Timed Simulation']);
    
    setFreeLimit(exam.questionLimits?.free ?? 5);
    setBasicLimit(exam.questionLimits?.basic ?? 25);
    setGoldLimit(exam.questionLimits?.gold ?? 0);
    setPlatinumLimit(exam.questionLimits?.platinum ?? 0);

    // Normalize raw questions
    if (exam.questions && Array.isArray(exam.questions)) {
      const parsed: EditableQuestion[] = exam.questions.map((q: any, idx: number) => {
        const norm = normalizeQuestion(q);
        return {
          id: q.id || `q-${idx + 1}-${Date.now()}`,
          question: norm.question,
          options: norm.options && norm.options.length > 0 ? norm.options : ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: norm.correctAnswer || (norm.options ? norm.options[0] : 'Option A'),
          explanation: norm.explanation || 'No clinical rationale specified.',
          questionType: q.questionType || q.questionTypeId || (Array.isArray(norm.correctAnswer) ? 'multiple_select' : 'single_choice'),
          domain: q.domain || q.unitDomain || exam.domain || 'Medical-Surgical Nursing'
        };
      });
      setQuestions(parsed);
    } else {
      setQuestions([]);
    }

    setSelectedQuestionIndex(0);
    setActiveTab('blueprint');
    setBulkInput('');
    setBulkParsedQuestions([]);
    setBulkParseError(null);
    setSaveSuccessMsg(null);
  }, [isOpen, exam]);

  if (!isOpen || !exam) return null;

  // Question manipulation handlers
  const handleAddQuestion = () => {
    const newQ: EditableQuestion = {
      id: `q-new-${Date.now()}`,
      question: 'New nursing practice question stem...',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      explanation: 'Detailed clinical rationale explaining why this option is correct.',
      questionType: 'single_choice',
      domain: domain === 'CUSTOM' ? (customDomain || 'General') : domain
    };
    const updated = [...questions, newQ];
    setQuestions(updated);
    setSelectedQuestionIndex(updated.length - 1);
    setActiveTab('questions');
  };

  const handleDuplicateQuestion = (idx: number) => {
    const target = questions[idx];
    if (!target) return;
    const duplicated: EditableQuestion = {
      ...target,
      id: `q-dup-${Date.now()}`,
      question: `${target.question} (Copy)`
    };
    const updated = [...questions.slice(0, idx + 1), duplicated, ...questions.slice(idx + 1)];
    setQuestions(updated);
    setSelectedQuestionIndex(idx + 1);
  };

  const handleDeleteQuestion = (idx: number) => {
    if (questions.length <= 1) {
      if (!window.confirm("This will remove the last question. Are you sure?")) return;
    }
    const updated = questions.filter((_, i) => i !== idx);
    setQuestions(updated);
    setSelectedQuestionIndex(Math.max(0, Math.min(idx, updated.length - 1)));
  };

  const handleMoveQuestion = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === questions.length - 1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...questions];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setQuestions(updated);
    setSelectedQuestionIndex(targetIdx);
  };

  const handleUpdateCurrentQuestion = (field: keyof EditableQuestion, value: any) => {
    if (selectedQuestionIndex < 0 || selectedQuestionIndex >= questions.length) return;
    setQuestions(prev => {
      const copy = [...prev];
      copy[selectedQuestionIndex] = {
        ...copy[selectedQuestionIndex],
        [field]: value
      };
      return copy;
    });
  };

  const handleUpdateOption = (optionIndex: number, text: string) => {
    if (selectedQuestionIndex < 0 || selectedQuestionIndex >= questions.length) return;
    const currentQ = questions[selectedQuestionIndex];
    const oldOptionText = currentQ.options[optionIndex];
    const newOptions = [...currentQ.options];
    newOptions[optionIndex] = text;

    let newCorrect = currentQ.correctAnswer;
    if (typeof currentQ.correctAnswer === 'string') {
      if (currentQ.correctAnswer === oldOptionText) {
        newCorrect = text;
      }
    } else if (Array.isArray(currentQ.correctAnswer)) {
      newCorrect = currentQ.correctAnswer.map(c => c === oldOptionText ? text : c);
    }

    handleUpdateCurrentQuestion('options', newOptions);
    handleUpdateCurrentQuestion('correctAnswer', newCorrect);
  };

  const handleAddOption = () => {
    if (selectedQuestionIndex < 0 || selectedQuestionIndex >= questions.length) return;
    const currentQ = questions[selectedQuestionIndex];
    const letter = String.fromCharCode(65 + currentQ.options.length);
    const newOptions = [...currentQ.options, `Option ${letter}`];
    handleUpdateCurrentQuestion('options', newOptions);
  };

  const handleRemoveOption = (optionIndex: number) => {
    if (selectedQuestionIndex < 0 || selectedQuestionIndex >= questions.length) return;
    const currentQ = questions[selectedQuestionIndex];
    if (currentQ.options.length <= 2) {
      alert("A question must have at least 2 options.");
      return;
    }
    const removedOption = currentQ.options[optionIndex];
    const newOptions = currentQ.options.filter((_, i) => i !== optionIndex);
    
    let newCorrect = currentQ.correctAnswer;
    if (typeof currentQ.correctAnswer === 'string') {
      if (currentQ.correctAnswer === removedOption) {
        newCorrect = newOptions[0] || '';
      }
    } else if (Array.isArray(currentQ.correctAnswer)) {
      newCorrect = currentQ.correctAnswer.filter(c => c !== removedOption);
      if (newCorrect.length === 0 && newOptions.length > 0) {
        newCorrect = [newOptions[0]];
      }
    }

    handleUpdateCurrentQuestion('options', newOptions);
    handleUpdateCurrentQuestion('correctAnswer', newCorrect);
  };

  const handleToggleCorrectOption = (optText: string) => {
    if (selectedQuestionIndex < 0 || selectedQuestionIndex >= questions.length) return;
    const currentQ = questions[selectedQuestionIndex];
    const isMulti = currentQ.questionType === 'multiple_select';

    if (isMulti) {
      const currentList = Array.isArray(currentQ.correctAnswer) 
        ? [...currentQ.correctAnswer] 
        : [currentQ.correctAnswer].filter(Boolean);
      
      if (currentList.includes(optText)) {
        if (currentList.length <= 1) {
          alert("SATA questions must have at least one correct option.");
          return;
        }
        handleUpdateCurrentQuestion('correctAnswer', currentList.filter(c => c !== optText));
      } else {
        handleUpdateCurrentQuestion('correctAnswer', [...currentList, optText]);
      }
    } else {
      handleUpdateCurrentQuestion('correctAnswer', optText);
    }
  };

  // Bulk import parser
  const handleParseBulkText = () => {
    setBulkParseError(null);
    setBulkParsedQuestions([]);

    if (!bulkInput.trim()) {
      setBulkParseError("Please paste questions text or a JSON array.");
      return;
    }

    // Try parsing as JSON first
    try {
      const parsedJson = JSON.parse(bulkInput.trim());
      if (Array.isArray(parsedJson)) {
        const validated: EditableQuestion[] = parsedJson.map((item, i) => {
          const norm = normalizeQuestion(item);
          return {
            id: `q-bulk-${Date.now()}-${i}`,
            question: norm.question,
            options: norm.options && norm.options.length > 0 ? norm.options : ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: norm.correctAnswer || (norm.options ? norm.options[0] : 'Option A'),
            explanation: norm.explanation || 'Rationale provided during bulk import.',
            questionType: item.questionType || (Array.isArray(norm.correctAnswer) ? 'multiple_select' : 'single_choice'),
            domain: item.domain || domain
          };
        });
        setBulkParsedQuestions(validated);
        return;
      }
    } catch {
      // Not JSON, continue to text block parser
    }

    // Parse text format (questions separated by blank lines or numbers)
    const blocks = bulkInput.split(/\n\s*\n+/);
    const parsedList: EditableQuestion[] = [];

    blocks.forEach((block, blockIdx) => {
      const lines = block.trim().split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) return;

      let qStem = '';
      const opts: string[] = [];
      let correct = '';
      let rationale = '';

      lines.forEach(line => {
        if (/^(?:Answer|Correct Answer|Ans)\s*[:\-]\s*(.*)$/i.test(line)) {
          const match = line.match(/^(?:Answer|Correct Answer|Ans)\s*[:\-]\s*(.*)$/i);
          if (match && match[1]) {
            correct = match[1].trim();
          }
        } else if (/^(?:Rationale|Explanation|Exp)\s*[:\-]\s*(.*)$/i.test(line)) {
          const match = line.match(/^(?:Rationale|Explanation|Exp)\s*[:\-]\s*(.*)$/i);
          if (match && match[1]) {
            rationale = match[1].trim();
          }
        } else if (/^[A-Ea-e][\)\.\:]\s*(.*)$/.test(line)) {
          const match = line.match(/^[A-Ea-e][\)\.\:]\s*(.*)$/);
          if (match && match[1]) {
            opts.push(match[1].trim());
          }
        } else if (!qStem) {
          qStem = line.replace(/^\d+[\.\)\:]\s*/, '');
        } else {
          // If we haven't hit options, append to question stem
          if (opts.length === 0) {
            qStem += ' ' + line;
          } else if (rationale) {
            rationale += ' ' + line;
          }
        }
      });

      if (qStem) {
        // If correct answer was given as letter "A", map to option text
        if (correct.length === 1 && /^[A-E]$/i.test(correct)) {
          const charCode = correct.toUpperCase().charCodeAt(0) - 65;
          if (opts[charCode]) {
            correct = opts[charCode];
          }
        }

        parsedList.push({
          id: `q-text-${Date.now()}-${blockIdx}`,
          question: qStem,
          options: opts.length > 0 ? opts : ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: correct || (opts[0] || 'Option A'),
          explanation: rationale || 'Detailed clinical rationale for this question.',
          questionType: 'single_choice',
          domain: domain === 'CUSTOM' ? (customDomain || 'General') : domain
        });
      }
    });

    if (parsedList.length === 0) {
      setBulkParseError("Could not detect any valid questions in the provided text. Make sure questions are separated by empty lines, and options start with A), B), C), etc.");
    } else {
      setBulkParsedQuestions(parsedList);
    }
  };

  const handleAppendBulkQuestions = () => {
    if (bulkParsedQuestions.length === 0) return;
    const updated = [...questions, ...bulkParsedQuestions];
    setQuestions(updated);
    setBulkParsedQuestions([]);
    setBulkInput('');
    setActiveTab('questions');
    setSelectedQuestionIndex(questions.length);
  };

  const handleReplaceWithBulkQuestions = () => {
    if (bulkParsedQuestions.length === 0) return;
    if (!window.confirm(`Replace all existing ${questions.length} questions with ${bulkParsedQuestions.length} new questions?`)) return;
    setQuestions(bulkParsedQuestions);
    setBulkParsedQuestions([]);
    setBulkInput('');
    setActiveTab('questions');
    setSelectedQuestionIndex(0);
  };

  // Fetch repository questions to add
  const handleOpenRepoPicker = async () => {
    setShowRepoPicker(true);
    if (repoQuestions.length > 0) return;
    try {
      setLoadingRepo(true);
      const snap = await getDocs(query(collection(db, 'questions')));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRepoQuestions(list);
    } catch (err) {
      console.warn("Error fetching repo questions:", err);
    } finally {
      setLoadingRepo(false);
    }
  };

  const handleAddRepoQuestion = (repoQ: any) => {
    const norm = normalizeQuestion(repoQ);
    const newQ: EditableQuestion = {
      id: `q-repo-${repoQ.id || Date.now()}`,
      question: norm.question,
      options: norm.options && norm.options.length > 0 ? norm.options : ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: norm.correctAnswer || (norm.options ? norm.options[0] : 'Option A'),
      explanation: norm.explanation || repoQ.rationale || 'Repository verified rationale.',
      questionType: repoQ.questionTypeId || 'single_choice',
      domain: repoQ.unitDomain || domain
    };
    setQuestions(prev => [...prev, newQ]);
  };

  // Features tag handlers
  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    if (!features.includes(newFeatureText.trim())) {
      setFeatures(prev => [...prev, newFeatureText.trim()]);
    }
    setNewFeatureText('');
  };

  const handleRemoveFeature = (feat: string) => {
    setFeatures(prev => prev.filter(f => f !== feat));
  };

  // Main Save Exam Handler
  const handleSaveExam = async () => {
    if (!title.trim()) {
      alert("Please provide an Exam Title.");
      setActiveTab('blueprint');
      return;
    }

    if (questions.length === 0) {
      alert("This exam must have at least 1 question. Add questions in the Questions tab or use Bulk Import.");
      setActiveTab('questions');
      return;
    }

    const finalCategory = category === 'CUSTOM' ? (customCategory.trim() || 'Custom Exam') : category;
    const finalDomain = domain === 'CUSTOM' ? (customDomain.trim() || 'General Specialty') : domain;

    setIsSaving(true);
    setSaveSuccessMsg(null);

    // Prepare questions payload
    const formattedQuestions = questions.map((q, idx) => ({
      id: q.id || `q-${idx + 1}`,
      question: q.question,
      questionStem: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      rationale: q.explanation,
      questionType: q.questionType || 'single_choice',
      domain: q.domain || finalDomain,
      category: finalCategory
    }));

    const planPrice = requiredPlan === 'free' ? 'Free Access' : `${requiredPlan.toUpperCase()} PLAN`;

    const updatedExamPayload: ExamEditorData = {
      ...exam,
      id: exam.id,
      title: title.trim(),
      category: finalCategory,
      domain: finalDomain,
      description: description.trim(),
      difficulty,
      durationMinutes: Number(durationMinutes) || 60,
      price: planPrice,
      numericPrice: 0,
      questionCount: formattedQuestions.length,
      isPremium: requiredPlan !== 'free',
      requiredPlan,
      questionLimits: {
        free: Number(freeLimit) || 5,
        basic: Number(basicLimit) || 25,
        gold: Number(goldLimit) || 0,
        platinum: Number(platinumLimit) || 0,
      },
      isPublished,
      features: features.length > 0 ? features : ['Lecturer Authored', 'Verified Rationales', 'Timed Simulation'],
      questions: formattedQuestions
    };

    try {
      // 1. Save directly to Firestore 'exams' collection
      await setDoc(doc(db, 'exams', exam.id), {
        title: updatedExamPayload.title,
        category: updatedExamPayload.category,
        domain: updatedExamPayload.domain,
        description: updatedExamPayload.description,
        difficulty: updatedExamPayload.difficulty,
        durationMinutes: updatedExamPayload.durationMinutes,
        requiredPlan: updatedExamPayload.requiredPlan,
        questionLimits: updatedExamPayload.questionLimits,
        isPublished: updatedExamPayload.isPublished,
        features: updatedExamPayload.features,
        questions: formattedQuestions,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 2. Persist in local storage custom edited exams cache
      try {
        const stored = JSON.parse(localStorage.getItem('nurseprep_custom_edited_exams') || '{}');
        stored[exam.id] = updatedExamPayload;
        localStorage.setItem('nurseprep_custom_edited_exams', JSON.stringify(stored));
      } catch (e) {
        console.warn('Local storage save warning:', e);
      }

      setSaveSuccessMsg(`Exam "${updatedExamPayload.title}" updated successfully with ${formattedQuestions.length} questions.`);
      
      // 3. Notify parent to update in-memory state
      onSave(updatedExamPayload);

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error("Failed to save exam to Firestore:", err);
      // Fallback: save locally
      try {
        const stored = JSON.parse(localStorage.getItem('nurseprep_custom_edited_exams') || '{}');
        stored[exam.id] = updatedExamPayload;
        localStorage.setItem('nurseprep_custom_edited_exams', JSON.stringify(stored));
        onSave(updatedExamPayload);
        setSaveSuccessMsg(`Exam updated in offline mode with ${formattedQuestions.length} questions.`);
        setTimeout(() => onClose(), 1000);
      } catch (e) {
        alert("Failed to save exam: " + (err?.message || "Unknown error"));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const filteredQuestions = questions.filter(q => {
    if (!questionSearchQuery.trim()) return true;
    const query = questionSearchQuery.toLowerCase();
    return q.question.toLowerCase().includes(query) || 
           q.explanation.toLowerCase().includes(query) ||
           q.options.some(o => o.toLowerCase().includes(query));
  });

  const currentQ = questions[selectedQuestionIndex];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[92vh] max-h-[900px] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-4 sm:p-5 flex items-center justify-between gap-4 shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center shrink-0">
              <Edit3 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-md">
                  Admin Exam Editor
                </span>
                <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md">
                  {questions.length} Questions
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${isPublished ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                  {isPublished ? 'Live' : 'Draft'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white truncate mt-0.5">
                {title || 'Untitled Exam'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
              className="text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveExam}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1.5 shadow-md"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Exam & Publish
                </>
              )}
            </Button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success toast inside modal */}
        {saveSuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-900 px-4 py-2.5 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 flex items-center gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('blueprint')}
            className={`py-3 px-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'blueprint' 
                ? 'border-blue-600 text-blue-700 bg-white' 
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            Exam Blueprint & Plan Rules
          </button>

          <button
            onClick={() => setActiveTab('questions')}
            className={`py-3 px-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'questions' 
                ? 'border-blue-600 text-blue-700 bg-white' 
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            Questions Manager ({questions.length})
          </button>

          <button
            onClick={() => setActiveTab('bulk')}
            className={`py-3 px-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'bulk' 
                ? 'border-blue-600 text-blue-700 bg-white' 
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListPlus className="w-3.5 h-3.5 text-blue-600" />
            Bulk Question Import / Paste
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50">

          {/* TAB 1: BLUEPRINT & EXAM RULES */}
          {activeTab === 'blueprint' && (
            <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
              
              {/* Title and Category */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" /> Exam Identification
                </h3>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Exam Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., NCLEX-RN Comprehensive Clinical Mastery 2026"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Exam Board / Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {POPULAR_EXAM_MODES.map(mode => (
                        <option key={mode} value={mode}>{mode}</option>
                      ))}
                      <option value="CUSTOM">+ Custom Category</option>
                    </select>

                    {category === 'CUSTOM' && (
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Enter custom category name..."
                        className="w-full px-3 py-2 mt-2 bg-white border border-blue-300 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Clinical Specialty / Domain *</label>
                    <select
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {POPULAR_DOMAINS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                      <option value="CUSTOM">+ Custom Specialty</option>
                    </select>

                    {domain === 'CUSTOM' && (
                      <input
                        type="text"
                        value={customDomain}
                        onChange={(e) => setCustomDomain(e.target.value)}
                        placeholder="Enter custom domain..."
                        className="w-full px-3 py-2 mt-2 bg-white border border-blue-300 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Description / Student Instructions</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter comprehensive instructions, topic blueprint coverage, and exam objectives..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                  />
                </div>
              </div>

              {/* Exam Rules & Time Limits */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" /> Exam Parameters & Difficulty
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Difficulty Level</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['Beginner', 'Medium', 'Advanced'] as const).map(lvl => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setDifficulty(lvl)}
                          className={`py-2 text-[11px] font-bold rounded-xl border transition-all cursor-pointer ${
                            difficulty === lvl 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Duration (Minutes)</label>
                    <input
                      type="number"
                      min={5}
                      max={360}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Publication Status</label>
                    <button
                      type="button"
                      onClick={() => setIsPublished(!isPublished)}
                      className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                        isPublished 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      {isPublished ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Live for Students</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                          <span>Draft / Hidden</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Access Control & Subscription Tiers */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-600" /> Plan Access & Question Limits
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500">Tier gating for paywall lock</span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Minimum Required Plan to Unlock</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'free', label: 'Free Access', sub: 'All users' },
                      { id: 'basic', label: 'Silver / Basic', sub: 'Subscribers' },
                      { id: 'gold', label: 'Gold / Sure Pass', sub: 'Premium' },
                      { id: 'platinum', label: 'Platinum / Master', sub: 'Elite' },
                    ].map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setRequiredPlan(p.id as any)}
                        className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                          requiredPlan === p.id 
                            ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400 text-amber-950' 
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold">{p.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{p.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="text-xs font-bold text-slate-700">Question Limits per Plan (0 = Unlimited)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Free Plan Limit</span>
                      <input
                        type="number"
                        min={0}
                        value={freeLimit}
                        onChange={(e) => setFreeLimit(parseInt(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Basic Plan Limit</span>
                      <input
                        type="number"
                        min={0}
                        value={basicLimit}
                        onChange={(e) => setBasicLimit(parseInt(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Gold Plan Limit</span>
                      <input
                        type="number"
                        min={0}
                        value={goldLimit}
                        onChange={(e) => setGoldLimit(parseInt(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Platinum Limit</span>
                      <input
                        type="number"
                        min={0}
                        value={platinumLimit}
                        onChange={(e) => setPlatinumLimit(parseInt(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Highlights & Features */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" /> Exam Highlights & Curriculum Badges
                </h3>
                <div className="flex flex-wrap gap-2">
                  {features.map((feat) => (
                    <span
                      key={feat}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200"
                    >
                      {feat}
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(feat)}
                        className="hover:text-rose-600 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newFeatureText}
                    onChange={(e) => setNewFeatureText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(); } }}
                    placeholder="Add highlight (e.g., NGN Case Studies, Audio Clinicals)..."
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddFeature}
                    className="bg-slate-800 text-white text-xs font-bold"
                  >
                    Add Tag
                  </Button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: QUESTIONS MANAGER */}
          {activeTab === 'questions' && (
            <div className="h-full flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200">
              
              {/* Question List Column */}
              <div className="w-full md:w-80 bg-white p-4 flex flex-col h-full shrink-0">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                    <span>Questions ({questions.length})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      onClick={handleAddQuestion}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-extrabold px-2.5 py-1 gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Question
                    </Button>
                  </div>
                </div>

                {/* Question Search */}
                <div className="relative my-2.5">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={questionSearchQuery}
                    onChange={(e) => setQuestionSearchQuery(e.target.value)}
                    placeholder="Search questions..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:bg-white"
                  />
                </div>

                {/* Questions Scrollable List */}
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                  {filteredQuestions.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      No questions found. Click "Add Question" above or import from bulk tab.
                    </div>
                  ) : (
                    filteredQuestions.map((q) => {
                      const actualIdx = questions.findIndex(orig => orig.id === q.id);
                      const isSelected = actualIdx === selectedQuestionIndex;

                      return (
                        <div
                          key={q.id}
                          onClick={() => setSelectedQuestionIndex(actualIdx)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer group ${
                            isSelected 
                              ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-400' 
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-100/60 px-1.5 py-0.2 rounded">
                              Q{actualIdx + 1}
                            </span>
                            <span className="text-[9px] font-bold text-slate-500 capitalize">
                              {q.questionType === 'multiple_select' ? 'SATA' : q.questionType === 'true_false' ? 'T/F' : 'Single'}
                            </span>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleMoveQuestion(actualIdx, 'up'); }}
                                disabled={actualIdx === 0}
                                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                                title="Move up"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleMoveQuestion(actualIdx, 'down'); }}
                                disabled={actualIdx === questions.length - 1}
                                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                                title="Move down"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDuplicateQuestion(actualIdx); }}
                                className="p-1 text-slate-400 hover:text-blue-600"
                                title="Duplicate question"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(actualIdx); }}
                                className="p-1 text-slate-400 hover:text-rose-600"
                                title="Delete question"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs font-semibold text-slate-800 line-clamp-2 mt-1">
                            {q.question}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleOpenRepoPicker}
                    className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Database className="w-3.5 h-3.5 text-blue-600" />
                    Import from Questions Repository
                  </button>
                </div>
              </div>

              {/* Active Question Editor Panel */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-white">
                {currentQ ? (
                  <div className="max-w-3xl space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-blue-600">
                          Question #{selectedQuestionIndex + 1} of {questions.length}
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900">
                          Edit Question Stem & Clinical Rationale
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDuplicateQuestion(selectedQuestionIndex)}
                          className="text-xs font-bold text-slate-600 gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" /> Clone
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteQuestion(selectedQuestionIndex)}
                          className="text-xs font-bold text-rose-600 hover:bg-rose-50 border-rose-200 gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </Button>
                      </div>
                    </div>

                    {/* Question Stem */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Question Stem / Prompt *</label>
                      <textarea
                        rows={4}
                        value={currentQ.question}
                        onChange={(e) => handleUpdateCurrentQuestion('question', e.target.value)}
                        placeholder="Enter clinical assessment scenario, patient presentation, or question stem..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                      />
                    </div>

                    {/* Question Type & Specialty */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Question Type</label>
                        <select
                          value={currentQ.questionType || 'single_choice'}
                          onChange={(e) => handleUpdateCurrentQuestion('questionType', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="single_choice">Single Choice (Standard 1 Correct)</option>
                          <option value="multiple_select">Multiple Select / SATA (Select All That Apply)</option>
                          <option value="true_false">True / False</option>
                          <option value="numeric">Numeric / Dosage Calculation</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Subject / Specialty Tag</label>
                        <input
                          type="text"
                          value={currentQ.domain || domain}
                          onChange={(e) => handleUpdateCurrentQuestion('domain', e.target.value)}
                          placeholder="e.g. Cardiovascular, Pharmacology..."
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Options Editor */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">
                          Answer Options & Correct Answer Designation
                        </label>
                        <span className="text-[11px] text-slate-500">
                          {currentQ.questionType === 'multiple_select' 
                            ? 'Check all options that are correct' 
                            : 'Click radio to designate the single correct answer'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {currentQ.options.map((opt, optIdx) => {
                          const letter = String.fromCharCode(65 + optIdx);
                          const isCorrect = Array.isArray(currentQ.correctAnswer)
                            ? currentQ.correctAnswer.includes(opt)
                            : currentQ.correctAnswer === opt;

                          return (
                            <div 
                              key={optIdx} 
                              className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                                isCorrect ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400' : 'bg-slate-50 border-slate-200'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleToggleCorrectOption(opt)}
                                className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                                  isCorrect 
                                    ? 'bg-emerald-600 text-white shadow-xs' 
                                    : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                                }`}
                                title={isCorrect ? "Correct answer" : "Click to mark as correct answer"}
                              >
                                {isCorrect ? <Check className="w-4 h-4 stroke-[3]" /> : letter}
                              </button>

                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => handleUpdateOption(optIdx, e.target.value)}
                                className="flex-1 bg-transparent px-2 py-1 text-xs font-medium text-slate-900 outline-none"
                                placeholder={`Option ${letter} text...`}
                              />

                              {isCorrect && (
                                <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded shrink-0">
                                  Correct Answer
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => handleRemoveOption(optIdx)}
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors shrink-0"
                                title="Remove option"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddOption}
                        className="text-xs font-bold text-blue-600 border-blue-200 hover:bg-blue-50 gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Another Option
                      </Button>
                    </div>

                    {/* Clinical Rationale */}
                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-bold text-slate-700">Clinical Rationale & Detailed Explanation *</label>
                      <textarea
                        rows={4}
                        value={currentQ.explanation}
                        onChange={(e) => handleUpdateCurrentQuestion('explanation', e.target.value)}
                        placeholder="Provide detailed clinical breakdown: why the correct answer is right, nursing interventions, and pathophysiology..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-400">
                    <p className="text-sm font-bold">No question selected.</p>
                    <p className="text-xs mt-1">Select a question from the left sidebar or click "+ Add Question".</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: BULK IMPORT */}
          {activeTab === 'bulk' && (
            <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <ListPlus className="w-4 h-4 text-blue-600" /> Fast Bulk Question Import
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Quickly paste entire sets of questions in either formatted plain text or standard JSON. The parser will extract question stems, answer choices, correct answers, and clinical rationales.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1 font-mono">
                  <div className="font-bold text-slate-700">Supported Plain Text Format Example:</div>
                  <div>1. A client is admitted with heart failure...</div>
                  <div>A) Administer furosemide</div>
                  <div>B) Encourage vigorous aerobic exercise</div>
                  <div>C) Restrict sodium intake</div>
                  <div>D) Place client in supine position</div>
                  <div>Correct Answer: A</div>
                  <div>Rationale: Loop diuretics decrease fluid overload...</div>
                </div>

                <textarea
                  rows={8}
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder="Paste question blocks or JSON array here..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />

                {bulkParseError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{bulkParseError}</span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    onClick={handleParseBulkText}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Parse Questions
                  </Button>
                </div>

                {/* Parsed Preview */}
                {bulkParsedQuestions.length > 0 && (
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Successfully parsed {bulkParsedQuestions.length} questions!
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAppendBulkQuestions}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                        >
                          Append to Current Exam
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleReplaceWithBulkQuestions}
                          className="text-xs font-bold text-rose-600 hover:bg-rose-50 border-rose-200"
                        >
                          Replace All Existing Questions
                        </Button>
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                      {bulkParsedQuestions.map((pq, pIdx) => (
                        <div key={pIdx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                          <div className="font-bold text-slate-900">
                            #{pIdx + 1}: {pq.question}
                          </div>
                          <div className="text-slate-600 mt-1">
                            {pq.options.length} Options · Correct: <strong className="text-emerald-700">{pq.correctAnswer}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-slate-200 p-4 sm:px-6 flex items-center justify-between gap-4 shrink-0">
          <div className="text-xs text-slate-500 hidden sm:block">
            <span className="font-bold text-slate-800">{questions.length} questions</span> attached ·{' '}
            <span className="font-bold text-slate-800">{durationMinutes} mins</span> ·{' '}
            <span className="font-bold text-slate-800 uppercase">{requiredPlan} Tier</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
              className="text-xs font-bold text-slate-600"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveExam}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1.5 shadow-md px-5"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving Exam...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Exam Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Question Repository Picker Drawer / Modal */}
        {showRepoPicker && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm">Select Questions from Repository</h4>
                  <p className="text-[11px] text-slate-300">Click to add any verified question into this exam</p>
                </div>
                <button onClick={() => setShowRepoPicker(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto space-y-2">
                {loadingRepo ? (
                  <div className="p-8 text-center text-xs text-slate-500">Loading questions from database...</div>
                ) : repoQuestions.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">No questions available in the repository.</div>
                ) : (
                  repoQuestions.map((rq) => (
                    <div key={rq.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          {rq.examMode || 'General'}
                        </span>
                        <p className="text-xs font-semibold text-slate-900 mt-1 line-clamp-2">
                          {rq.questionStem || rq.question}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => { handleAddRepoQuestion(rq); }}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shrink-0 gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                <Button size="sm" onClick={() => setShowRepoPicker(false)} className="text-xs font-bold">
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
