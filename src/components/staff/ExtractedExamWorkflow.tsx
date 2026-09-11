import React, { useState, useEffect } from 'react';
import { 
  Upload, FileText, CheckCircle, AlertCircle, RefreshCw, Edit3, Database, 
  Layers, ShieldCheck, Clock, Clipboard, Trash2, Check, Sparkles, Cpu, 
  ArrowRight, ArrowLeft, Eye, EyeOff, Plus, Copy, GripVertical, HelpCircle, 
  CheckSquare, Square, ChevronRight, ChevronLeft, Award, BookOpen, Calculator, 
  CheckCircle2, X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { collection, addDoc, getDocs, query, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { extractExamQuestionsUniversal, parseExamQuestionsFromText, isRawPdfBytecode, ExtractedExamQuestion } from '@/lib/pdfExtractor';
import { useNavigate } from 'react-router-dom';

const DEFAULT_EXAM_TYPES = [
  'ATI TEAS',
  'HESI A2',
  'ACCUPLACER',
  'GED',
  'HISET',
  'NCK',
  'NCLEX-RN',
  'NCLEX-PN',
  'ATI RN',
  'ATI LPN',
  'HESI RN',
  'HESI LPN',
  'Examplify RN',
  'Examplify LPN',
  'ATI Exit Exam',
  'HESI Exit Exam',
  'Examplify Exit Exam'
];

const DEFAULT_DOMAINS = [
  'General Nursing',
  'Medical-Surgical Nursing',
  'Pharmacology & Parenteral Therapies',
  'Maternal & Newborn Health',
  'Pediatric Nursing',
  'Psychiatric & Mental Health',
  'Community & Public Health',
  'Nursing Fundamentals'
];

export const QUESTION_TYPES = [
  { id: 'single_choice', label: 'Single Choice', desc: 'One correct answer among choices' },
  { id: 'multiple_select', label: 'Multiple Select (SATA)', desc: 'Select All That Apply (2+ correct answers)' },
  { id: 'true_false', label: 'True / False', desc: 'Binary true or false evaluation' },
  { id: 'numeric', label: 'Numeric Calculation', desc: 'Exact medical dosage or math value' },
  { id: 'sieve_bowtie', label: 'Bowtie (NextGen NCLEX)', desc: 'Condition + 2 Actions + 2 Monitoring parameters' },
  { id: 'order_numbers', label: 'Ordering / Sequence', desc: 'Prioritize clinical steps in order' },
  { id: 'short_answer', label: 'Short Answer / Blank', desc: 'Exact clinical terminology match' },
  { id: 'case_based', label: 'Case Based Scenario', desc: 'Multi-part client chart scenario' },
  { id: 'hotspot', label: 'Hotspot / Diagram', desc: 'Anatomical or monitor location target' }
];

export interface EditableQuestion {
  id: string;
  questionStem: string;
  questionTypeId: string;
  questionTypeLabel: string;
  options: string[];
  correctAnswer: string | string[];
  explanation: string;
  difficulty: 'Beginner' | 'Medium' | 'Advanced';
  domain?: string;
  unitDomain?: string;
  numericAnswer?: string;
  numericTolerance?: string;
  bowtieCondition?: string;
  bowtieActions?: string[];
  bowtieParameters?: string[];
}

interface ExtractedExamWorkflowProps {
  onExamPublished?: () => void;
  initialQuestions?: ExtractedExamQuestion[];
  initialTitle?: string;
  initialExamMode?: string;
}

export default function ExtractedExamWorkflow({
  onExamPublished,
  initialQuestions,
  initialTitle,
  initialExamMode
}: ExtractedExamWorkflowProps) {
  const navigate = useNavigate();

  // Phase State: 'extract' | 'edit' | 'preview' | 'published'
  const [phase, setPhase] = useState<'extract' | 'edit' | 'preview' | 'published'>(
    initialQuestions && initialQuestions.length > 0 ? 'edit' : 'extract'
  );

  // Phase 1 Upload States
  const [pdfMode, setPdfMode] = useState<'file' | 'paste'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionSource, setExtractionSource] = useState<'server' | 'client_pdf' | 'client_fallback' | 'manual_paste' | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  // Global Exam Metadata
  const [examTitle, setExamTitle] = useState(initialTitle || '');
  const [selectedExamMode, setSelectedExamMode] = useState(initialExamMode || 'NCLEX-RN');
  const [selectedDomain, setSelectedDomain] = useState('Medical-Surgical Nursing');
  const [examDifficulty, setExamDifficulty] = useState<'Beginner' | 'Medium' | 'Advanced'>('Medium');
  const [requiredPlan, setRequiredPlan] = useState<'free' | 'basic' | 'gold' | 'platinum'>('free');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [freeLimit, setFreeLimit] = useState(5);
  const [basicLimit, setBasicLimit] = useState(25);
  const [customExamModes, setCustomExamModes] = useState<any[]>([]);

  // Phase 2 Questions State
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);

  // Phase 3 Preview State
  const [previewTab, setPreviewTab] = useState<'interactive' | 'specsheet'>('specsheet');
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewUserAnswers, setPreviewUserAnswers] = useState<Record<number, any>>({});
  const [previewShowRationale, setPreviewShowRationale] = useState<Record<number, boolean>>({});

  // Publishing State
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishedExamId, setPublishedExamId] = useState<string | null>(null);

  // Fetch custom exam modes
  useEffect(() => {
    const fetchModes = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'exam_modes')));
        setCustomExamModes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.warn('Error fetching exam modes in workflow:', e);
      }
    };
    fetchModes();
  }, []);

  const ALL_EXAM_MODES = [
    ...DEFAULT_EXAM_TYPES,
    ...customExamModes.map(m => m.name).filter(n => !DEFAULT_EXAM_TYPES.includes(n))
  ];

  // Initialize from props if given
  useEffect(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      loadExtractedIntoEditable(initialQuestions);
    }
  }, [initialQuestions]);

  const loadExtractedIntoEditable = (extractedList: ExtractedExamQuestion[]) => {
    const converted: EditableQuestion[] = extractedList.map((q, idx) => {
      const qTypeId = q.questionTypeId || (Array.isArray(q.correctAnswer) ? 'multiple_select' : 'single_choice');
      const qTypeObj = QUESTION_TYPES.find(t => t.id === qTypeId);
      return {
        id: `q-${Date.now()}-${idx}`,
        questionStem: q.question || `Question ${idx + 1}`,
        questionTypeId: qTypeId,
        questionTypeLabel: qTypeObj ? qTypeObj.label : 'Single Choice',
        options: q.options && q.options.length > 0 ? [...q.options] : ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: q.correctAnswer || (q.options ? q.options[0] : 'Option A'),
        explanation: q.explanation || '',
        difficulty: (q.difficulty as any) || 'Medium',
        domain: selectedDomain,
        unitDomain: selectedDomain
      };
    });
    setQuestions(converted);
    setDurationMinutes(Math.max(15, Math.ceil(converted.length * 1.5)));
  };

  // Phase 1 Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!examTitle) {
        setExamTitle(selected.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '));
      }
      setStatusMessage('');
    }
  };

  const handleRunExtraction = async () => {
    if (!file) return;
    setIsExtracting(true);
    setStatusMessage('');

    try {
      const result = await extractExamQuestionsUniversal(file);
      const cleanQuestions = result.questions.filter(q => !isRawPdfBytecode(q.question));
      const finalQs = cleanQuestions.length > 0 ? cleanQuestions : result.questions;
      
      setExtractionSource(result.source);
      loadExtractedIntoEditable(finalQs);
      if (!examTitle) {
        setExamTitle(file.name.replace(/\.pdf$/i, ''));
      }
      setStatusMessage(`Extracted ${finalQs.length} questions successfully! Moving to Phase 2: Edit & Review.`);
      setPhase('edit');
    } catch (err: any) {
      console.warn('Extraction fallback triggered:', err);
      const fallbackQuestions = parseExamQuestionsFromText('', file.name);
      loadExtractedIntoEditable(fallbackQuestions);
      setExtractionSource('client_fallback');
      setStatusMessage(`Extracted ${fallbackQuestions.length} review questions. Moving to Phase 2: Edit.`);
      setPhase('edit');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleParsePastedText = () => {
    if (!rawText.trim()) return;
    setIsExtracting(true);
    try {
      const titleToUse = examTitle || 'Clinical Study Guide';
      const parsed = parseExamQuestionsFromText(rawText, titleToUse);
      loadExtractedIntoEditable(parsed);
      setExtractionSource('manual_paste');
      if (!examTitle) {
        setExamTitle(`Extracted Exam ${new Date().toLocaleDateString()}`);
      }
      setStatusMessage(`Successfully parsed ${parsed.length} questions from text!`);
      setPhase('edit');
    } catch (err: any) {
      alert(`Could not parse text: ${err?.message || 'Unknown syntax'}`);
    } finally {
      setIsExtracting(false);
    }
  };

  // Phase 2 Handlers: Question Editing
  const handleUpdateQuestion = (index: number, updates: Partial<EditableQuestion>) => {
    setQuestions(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  // Change Question Type
  const handleChangeQuestionType = (index: number, newTypeId: string) => {
    const q = questions[index];
    const typeObj = QUESTION_TYPES.find(t => t.id === newTypeId);
    const label = typeObj ? typeObj.label : 'Single Choice';

    let newCorrectAnswer = q.correctAnswer;
    let newOptions = [...q.options];

    if (newTypeId === 'multiple_select') {
      // Ensure correctAnswer is an array
      if (!Array.isArray(newCorrectAnswer)) {
        newCorrectAnswer = [newCorrectAnswer || newOptions[0] || ''];
      }
    } else if (newTypeId === 'single_choice') {
      // Ensure correctAnswer is a single string
      if (Array.isArray(newCorrectAnswer)) {
        newCorrectAnswer = newCorrectAnswer[0] || newOptions[0] || '';
      }
    } else if (newTypeId === 'true_false') {
      newOptions = ['True', 'False'];
      newCorrectAnswer = 'True';
    } else if (newTypeId === 'numeric') {
      newCorrectAnswer = q.numericAnswer || '25';
    }

    handleUpdateQuestion(index, {
      questionTypeId: newTypeId,
      questionTypeLabel: label,
      options: newOptions,
      correctAnswer: newCorrectAnswer
    });
  };

  // Change Correct Answer for Single Choice
  const handleSelectSingleCorrect = (index: number, optionText: string) => {
    handleUpdateQuestion(index, { correctAnswer: optionText });
  };

  // Change Correct Answers for Multiple Select (SATA)
  const handleToggleMultipleCorrect = (index: number, optionText: string) => {
    const q = questions[index];
    const currentCorrect: string[] = Array.isArray(q.correctAnswer) ? [...q.correctAnswer] : [q.correctAnswer];
    const exists = currentCorrect.includes(optionText);
    let updated: string[];
    if (exists) {
      updated = currentCorrect.filter(item => item !== optionText);
      // Keep at least one answer if possible
      if (updated.length === 0) updated = [optionText];
    } else {
      updated = [...currentCorrect, optionText];
    }
    handleUpdateQuestion(index, { correctAnswer: updated });
  };

  // Option text editing
  const handleOptionTextChange = (qIndex: number, optIndex: number, newText: string) => {
    const q = questions[qIndex];
    const oldText = q.options[optIndex];
    const updatedOptions = [...q.options];
    updatedOptions[optIndex] = newText;

    // If this option was part of the correct answer, update the correct answer reference too
    let updatedCorrectAnswer = q.correctAnswer;
    if (Array.isArray(updatedCorrectAnswer)) {
      updatedCorrectAnswer = updatedCorrectAnswer.map(c => c === oldText ? newText : c);
    } else if (updatedCorrectAnswer === oldText) {
      updatedCorrectAnswer = newText;
    }

    handleUpdateQuestion(qIndex, {
      options: updatedOptions,
      correctAnswer: updatedCorrectAnswer
    });
  };

  const handleAddOption = (qIndex: number) => {
    const q = questions[qIndex];
    const nextLetter = String.fromCharCode(65 + q.options.length);
    const newOptions = [...q.options, `Option ${nextLetter}`];
    handleUpdateQuestion(qIndex, { options: newOptions });
  };

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    const q = questions[qIndex];
    if (q.options.length <= 2) {
      alert("A question must have at least 2 options.");
      return;
    }
    const removedText = q.options[optIndex];
    const newOptions = q.options.filter((_, idx) => idx !== optIndex);
    
    let updatedCorrect = q.correctAnswer;
    if (Array.isArray(updatedCorrect)) {
      updatedCorrect = updatedCorrect.filter(c => c !== removedText);
      if (updatedCorrect.length === 0) updatedCorrect = [newOptions[0]];
    } else if (updatedCorrect === removedText) {
      updatedCorrect = newOptions[0];
    }

    handleUpdateQuestion(qIndex, {
      options: newOptions,
      correctAnswer: updatedCorrect
    });
  };

  const handleDeleteQuestion = (index: number) => {
    if (questions.length <= 1) {
      alert("An exam must have at least 1 question.");
      return;
    }
    setQuestions(prev => prev.filter((_, idx) => idx !== index));
    if (selectedQuestionIndex >= questions.length - 1) {
      setSelectedQuestionIndex(Math.max(0, questions.length - 2));
    }
  };

  const handleDuplicateQuestion = (index: number) => {
    const q = questions[index];
    const copy: EditableQuestion = {
      ...q,
      id: `q-${Date.now()}-dup`,
      questionStem: `${q.questionStem} (Copy)`,
    };
    setQuestions(prev => {
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
  };

  const handleAddNewQuestion = () => {
    const newQ: EditableQuestion = {
      id: `q-${Date.now()}-new`,
      questionStem: 'New clinical scenario or NCLEX exam question stem...',
      questionTypeId: 'single_choice',
      questionTypeLabel: 'Single Choice',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      explanation: 'Detailed rationale explaining the pathophysiology and clinical intervention...',
      difficulty: 'Medium',
      domain: selectedDomain,
      unitDomain: selectedDomain
    };
    setQuestions(prev => [...prev, newQ]);
    setSelectedQuestionIndex(questions.length);
  };

  // Phase 4: Publish to Site
  const handlePublishExamToSite = async () => {
    if (questions.length === 0) {
      alert("Cannot publish an empty exam.");
      return;
    }
    if (!examTitle.trim()) {
      alert("Please provide an Exam Title before publishing.");
      return;
    }

    setIsPublishing(true);
    setPublishError(null);

    try {
      // 1. Prepare questions array
      const sanitizedQuestions = questions.map((q, idx) => ({
        id: q.id || `q-${idx + 1}`,
        question: q.questionStem,
        questionStem: q.questionStem,
        questionTypeId: q.questionTypeId,
        questionTypeLabel: q.questionTypeLabel,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        domain: selectedDomain,
        examMode: selectedExamMode,
        numericAnswer: q.numericAnswer || null,
        numericTolerance: q.numericTolerance || null,
        bowtieCondition: q.bowtieCondition || null,
        bowtieActions: q.bowtieActions || null,
        bowtieParameters: q.bowtieParameters || null
      }));

      // 2. Prepare and save Exam document in Firestore
      const examDocPayload = JSON.parse(JSON.stringify({
        title: examTitle.trim(),
        category: selectedExamMode,
        domain: selectedDomain,
        difficulty: examDifficulty,
        questionCount: sanitizedQuestions.length,
        durationMinutes: Number(durationMinutes) || 60,
        requiredPlan: requiredPlan,
        isPremium: requiredPlan !== 'free',
        price: requiredPlan === 'free' ? 'Free Access' : `${requiredPlan.toUpperCase()} PLAN`,
        numericPrice: requiredPlan === 'free' ? 0 : 15000,
        questionLimits: {
          free: Number(freeLimit) || 5,
          basic: Number(basicLimit) || 25,
          gold: 0,
          platinum: 0
        },
        isPublished: true,
        questions: sanitizedQuestions,
        createdAt: new Date().toISOString(),
        createdBy: 'Admin / Educator Extractor',
        features: [
          'Interactive NCLEX & Board Simulation',
          'Instant Clinical Rationales',
          'Updated Answer Keys & Question Types'
        ]
      }));

      const docRef = await addDoc(collection(db, 'exams'), examDocPayload);
      setPublishedExamId(docRef.id);

      // 3. Also batch-add individual questions to 'questions' collection for repository & practice generator
      for (const q of sanitizedQuestions) {
        const questionDoc = JSON.parse(JSON.stringify({
          examMode: selectedExamMode,
          unitDomain: selectedDomain,
          questionTypeId: q.questionTypeId,
          questionTypeLabel: q.questionTypeLabel,
          questionStem: q.question,
          options: q.options.map(opt => ({
            id: Math.random().toString(),
            text: opt,
            isCorrect: Array.isArray(q.correctAnswer)
              ? q.correctAnswer.includes(opt)
              : opt === q.correctAnswer
          })),
          correctAnswer: q.correctAnswer,
          difficulty: q.difficulty,
          rationale: q.explanation,
          examId: docRef.id,
          createdAt: new Date().toISOString(),
          createdBy: 'PDF Extractor'
        }));
        await addDoc(collection(db, 'questions'), questionDoc);
      }

      setPhase('published');
      if (onExamPublished) onExamPublished();
    } catch (err: any) {
      console.error('Error publishing exam:', err);
      setPublishError(err?.message || 'Database error while publishing exam.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Phase Navigation Step indicator
  const steps = [
    { id: 'extract', label: '1. Upload & Extract', desc: 'PDF or text question intake' },
    { id: 'edit', label: '2. Edit Exam & Answers', desc: 'Change types, answers & content' },
    { id: 'preview', label: '3. Preview Entire Exam', desc: 'Student simulation & spec sheet' },
    { id: 'published', label: '4. Published to Site', desc: 'Available in live exam bank' }
  ];

  return (
    <div className="space-y-6">
      {/* Workflow Phase Stepper */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[620px] gap-2">
          {steps.map((s, idx) => {
            const isCurrent = phase === s.id;
            const isCompleted = 
              (s.id === 'extract' && (phase === 'edit' || phase === 'preview' || phase === 'published')) ||
              (s.id === 'edit' && (phase === 'preview' || phase === 'published')) ||
              (s.id === 'preview' && phase === 'published');

            return (
              <React.Fragment key={s.id}>
                <div 
                  onClick={() => {
                    // Allow navigating backwards or between edit and preview if questions exist
                    if (questions.length > 0 && s.id !== 'published') {
                      setPhase(s.id as any);
                    }
                  }}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer ${
                    isCurrent 
                      ? 'bg-blue-50 border border-blue-200 text-blue-900 shadow-xs' 
                      : isCompleted 
                        ? 'text-emerald-700 hover:bg-slate-50' 
                        : 'text-slate-400'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    isCurrent 
                      ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-200' 
                      : isCompleted 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-100 text-slate-500'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-none">{s.label}</div>
                    <div className="text-[10px] text-slate-500 mt-1">{s.desc}</div>
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 min-w-[24px] ${isCompleted ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PHASE 1: EXTRACTION & INTAKE                                              */}
      {/* ========================================================================= */}
      {phase === 'extract' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-800/60 px-3 py-1 rounded-full text-xs font-semibold text-blue-200 mb-2 border border-blue-700/50">
                <Cpu className="w-3.5 h-3.5 text-amber-300" /> Multi-Phase Exam Extraction Engine
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Phase 1: Upload & Question Extraction</h2>
              <p className="text-blue-200 text-sm mt-1 max-w-2xl">
                Upload raw PDF exams, ATI/HESI study guides, or paste question text. In Phase 2, you'll be able to change correct answers and customize question types.
              </p>
            </div>
            {/* Mode switch */}
            <div className="inline-flex rounded-xl bg-slate-800/80 p-1 border border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => setPdfMode('file')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  pdfMode === 'file' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" /> PDF File Upload
              </button>
              <button
                type="button"
                onClick={() => setPdfMode('paste')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  pdfMode === 'paste' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Clipboard className="w-3.5 h-3.5" /> Paste Question Text
              </button>
            </div>
          </div>

          {pdfMode === 'file' ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 p-8 text-center transition-colors shadow-xs space-y-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Select or Drag Exam PDF Document</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Supports NCLEX, ATI TEAS, HESI A2, NCK and Nursing exam question packages with full option keys and rationales.
                </p>
              </div>

              <input 
                type="file" 
                id="exam-workflow-file-input" 
                accept=".pdf,.txt" 
                onChange={handleFileChange} 
                className="hidden" 
              />
              <label 
                htmlFor="exam-workflow-file-input" 
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm transition-all"
              >
                <FileText className="w-4 h-4" /> Browse PDF File
              </label>

              {file && (
                <div className="mt-4 p-4 bg-blue-50/80 border border-blue-200 rounded-xl text-left max-w-lg mx-auto flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText className="w-6 h-6 text-blue-600 shrink-0" />
                    <div className="truncate">
                      <p className="font-bold text-slate-900 text-xs truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB • Ready for extraction</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleRunExtraction} 
                    disabled={isExtracting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shrink-0"
                  >
                    {isExtracting ? (
                      <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Extracting...</>
                    ) : (
                      <><Sparkles className="w-3.5 h-3.5" /> Extract Questions →</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">Paste Question Sheet or Study Guide Text</label>
                <p className="text-xs text-slate-500 mb-2">Paste questions with options (A, B, C, D), correct answers, and rationales.</p>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`1. A client with chronic heart failure presents with orthopnea and crackles. Which action should the nurse take first?\nA. Administer prescribed furosemide\nB. Place the client in high Fowler position\nC. Auscultate heart sounds\nD. Obtain a 12-lead ECG\nAnswer: B\nRationale: Elevating head of bed immediately reduces venous return and improves respiratory expansion.`}
                  rows={9}
                  className="w-full p-4 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">
                  Detected ~{rawText.split(/(?:Question|Q\.?)\s*\d+|\b\d+\.\s+/i).length - 1 || 0} questions
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setRawText('')} disabled={!rawText}>
                    Clear Text
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleParsePastedText} 
                    disabled={!rawText.trim() || isExtracting}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  >
                    <Cpu className="w-4 h-4" /> Parse & Proceed to Phase 2 →
                  </Button>
                </div>
              </div>
            </div>
          )}

          {questions.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-emerald-950 text-sm">{questions.length} Questions Extracted & Ready for Editing</h4>
                  <p className="text-xs text-emerald-700">Open in Phase 2 to edit correct answers, change question types, or modify content.</p>
                </div>
              </div>
              <Button 
                onClick={() => setPhase('edit')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 px-5 py-2.5 rounded-xl shadow-xs"
              >
                Proceed to Phase 2: Edit Questions <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHASE 2: EDIT EXAM & CHANGE ANSWERS / QUESTION TYPES                      */}
      {/* ========================================================================= */}
      {phase === 'edit' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Phase 2 Header & Metadata Configuration Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 mb-1">
                  <Edit3 className="w-3.5 h-3.5" /> Phase 2: Exam & Question Editor
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Configure Exam & Verify Answers</h3>
                <p className="text-xs text-slate-500">Change correct answers, question types (SATA, Single Choice, Numeric), stem texts and rationales.</p>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPhase('extract')}
                  className="gap-1.5 text-xs text-slate-600"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Upload
                </Button>
                <Button 
                  size="sm"
                  onClick={() => setPhase('preview')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-xs"
                >
                  Proceed to Phase 3: Preview Entire Exam ({questions.length} Qs) <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Exam Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Exam Title</label>
                <input 
                  type="text" 
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="e.g. NCLEX-RN Pharmacology Comprehensive Mock"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-medium outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Target Exam Board</label>
                <select
                  value={selectedExamMode}
                  onChange={(e) => setSelectedExamMode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-medium bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ALL_EXAM_MODES.map(mode => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Clinical Specialty / Domain</label>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-medium bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {DEFAULT_DOMAINS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Access Plan Tier</label>
                <select
                  value={requiredPlan}
                  onChange={(e) => setRequiredPlan(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-medium bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="free">Free Access (Preview Mode)</option>
                  <option value="basic">Basic Plan (Silver)</option>
                  <option value="gold">Gold Plan (SurePass)</option>
                  <option value="platinum">Platinum Plan (Mastery)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Questions Editor Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Question Navigator */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Questions List ({questions.length})
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleAddNewQuestion}
                    className="h-7 text-xs px-2.5 gap-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Question
                  </Button>
                </div>

                <div className="max-h-[640px] overflow-y-auto space-y-2 pr-1">
                  {questions.map((q, idx) => {
                    const isSelected = selectedQuestionIndex === idx;
                    const hasCorrect = Array.isArray(q.correctAnswer) ? q.correctAnswer.length > 0 : Boolean(q.correctAnswer);

                    return (
                      <div
                        key={q.id || idx}
                        onClick={() => setSelectedQuestionIndex(idx)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all space-y-1.5 ${
                          isSelected 
                            ? 'bg-blue-50/80 border-blue-400 shadow-xs' 
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-bold ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                            Q{idx + 1}. {q.questionTypeLabel || 'Single Choice'}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            hasCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {hasCorrect ? 'Answer Set' : 'No Answer'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-snug">
                          {q.questionStem}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Active Question Detailed Form */}
            <div className="lg:col-span-8">
              {questions[selectedQuestionIndex] && (() => {
                const q = questions[selectedQuestionIndex];
                const idx = selectedQuestionIndex;

                return (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                    {/* Top Row: Q Number, Type Selector, Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-base">Editing Question #{idx + 1}</h4>
                          <span className="text-xs text-slate-400">Total {q.options.length} options configured</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDuplicateQuestion(idx)}
                          className="h-8 text-xs text-slate-600 gap-1"
                          title="Duplicate question"
                        >
                          <Copy className="w-3.5 h-3.5" /> Duplicate
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteQuestion(idx)}
                          className="h-8 text-xs text-rose-600 hover:bg-rose-50 border-rose-200 gap-1"
                          title="Delete question"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </Button>
                      </div>
                    </div>

                    {/* Question Type Selector & Difficulty */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <label className="block text-xs font-extrabold text-slate-800 mb-1 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-blue-600" /> Question Type (Click to change)
                        </label>
                        <select
                          value={q.questionTypeId || 'single_choice'}
                          onChange={(e) => handleChangeQuestionType(idx, e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-blue-900 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {QUESTION_TYPES.map(t => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                          ))}
                        </select>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {QUESTION_TYPES.find(t => t.id === q.questionTypeId)?.desc}
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-slate-800 mb-1">Question Difficulty</label>
                        <select
                          value={q.difficulty || 'Medium'}
                          onChange={(e) => handleUpdateQuestion(idx, { difficulty: e.target.value as any })}
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Beginner">Beginner (Foundational)</option>
                          <option value="Medium">Medium (Application / NCLEX Standard)</option>
                          <option value="Advanced">Advanced (Critical Thinking / NextGen)</option>
                        </select>
                      </div>
                    </div>

                    {/* Question Stem Textarea */}
                    <div>
                      <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                        Clinical Question Stem
                      </label>
                      <textarea
                        value={q.questionStem}
                        onChange={(e) => handleUpdateQuestion(idx, { questionStem: e.target.value })}
                        rows={3}
                        className="w-full p-3 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none leading-relaxed"
                        placeholder="Enter the question stem or clinical scenario here..."
                      />
                    </div>

                    {/* Options & Correct Answer Selection Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-xs font-extrabold text-slate-900">
                            Answer Choices & Correct Answer Key
                          </label>
                          <p className="text-[11px] text-slate-500">
                            {q.questionTypeId === 'multiple_select' 
                              ? 'Click the checkbox on each option that is a CORRECT answer (Multiple Select / SATA).'
                              : 'Click the radio button on the option that is the CORRECT answer.'}
                          </p>
                        </div>
                        {q.questionTypeId !== 'true_false' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddOption(idx)}
                            className="text-xs h-7 gap-1 font-bold text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Plus className="w-3 h-3" /> Add Choice
                          </Button>
                        )}
                      </div>

                      {/* Options List */}
                      <div className="space-y-2.5">
                        {q.options.map((opt, optIdx) => {
                          const isMultiple = q.questionTypeId === 'multiple_select';
                          const isCorrect = isMultiple
                            ? Array.isArray(q.correctAnswer) && q.correctAnswer.includes(opt)
                            : q.correctAnswer === opt;

                          return (
                            <div 
                              key={optIdx}
                              className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                                isCorrect 
                                  ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-300' 
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {/* Selection Control: Radio or Checkbox */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (isMultiple) {
                                    handleToggleMultipleCorrect(idx, opt);
                                  } else {
                                    handleSelectSingleCorrect(idx, opt);
                                  }
                                }}
                                className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                                  isCorrect 
                                    ? 'bg-emerald-600 text-white shadow-xs' 
                                    : 'border-2 border-slate-300 text-slate-400 hover:border-blue-400'
                                }`}
                                title={isCorrect ? 'Marked as Correct' : 'Click to set as Correct Answer'}
                              >
                                {isCorrect ? <Check className="w-4 h-4" /> : String.fromCharCode(65 + optIdx)}
                              </button>

                              {/* Editable Option Text */}
                              <input 
                                type="text"
                                value={opt}
                                onChange={(e) => handleOptionTextChange(idx, optIdx, e.target.value)}
                                className={`flex-1 text-xs font-semibold px-3 py-1.5 rounded-lg border outline-none ${
                                  isCorrect 
                                    ? 'border-emerald-300 bg-white text-emerald-950 font-bold' 
                                    : 'border-slate-200 bg-slate-50 text-slate-800'
                                }`}
                              />

                              {/* Correct Badge */}
                              {isCorrect ? (
                                <span className="text-[10px] bg-emerald-600 text-white font-extrabold uppercase tracking-wider px-2 py-1 rounded-md shrink-0">
                                  Correct Answer
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isMultiple) {
                                      handleToggleMultipleCorrect(idx, opt);
                                    } else {
                                      handleSelectSingleCorrect(idx, opt);
                                    }
                                  }}
                                  className="text-[11px] text-slate-400 hover:text-emerald-700 font-bold px-2 py-1 rounded hover:bg-emerald-50 shrink-0"
                                >
                                  Mark Correct
                                </button>
                              )}

                              {/* Remove option button */}
                              {q.questionTypeId !== 'true_false' && q.options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOption(idx, optIdx)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 shrink-0"
                                  title="Delete this option"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Numeric Calculation Extra Inputs */}
                      {q.questionTypeId === 'numeric' && (
                        <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl space-y-2 mt-3">
                          <span className="text-xs font-extrabold text-blue-900 block">Numeric Target & Tolerance</span>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 block">Expected Exact Value</label>
                              <input 
                                type="text"
                                value={q.numericAnswer || (typeof q.correctAnswer === 'string' ? q.correctAnswer : '25')}
                                onChange={(e) => {
                                  handleUpdateQuestion(idx, { 
                                    numericAnswer: e.target.value,
                                    correctAnswer: e.target.value 
                                  });
                                }}
                                placeholder="e.g. 25"
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 block">Acceptable Tolerance (±)</label>
                              <input 
                                type="text"
                                value={q.numericTolerance || '0.5'}
                                onChange={(e) => handleUpdateQuestion(idx, { numericTolerance: e.target.value })}
                                placeholder="e.g. 0.5"
                                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Explanation / Clinical Rationale Textarea */}
                    <div>
                      <label className="block text-xs font-extrabold text-slate-800 mb-1.5 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-blue-600" /> Clinical Rationale & Explanation
                      </label>
                      <textarea
                        value={q.explanation}
                        onChange={(e) => handleUpdateQuestion(idx, { explanation: e.target.value })}
                        rows={3}
                        className="w-full p-3 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none leading-relaxed"
                        placeholder="Provide detailed clinical explanation of why the correct option is right and why the distractors are incorrect..."
                      />
                    </div>

                    {/* Navigation between questions in Phase 2 */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={idx === 0}
                        onClick={() => setSelectedQuestionIndex(Math.max(0, idx - 1))}
                        className="gap-1 text-xs"
                      >
                        <ChevronLeft className="w-4 h-4" /> Previous Question
                      </Button>
                      <span className="text-xs text-slate-500 font-bold">
                        Question {idx + 1} of {questions.length}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={idx === questions.length - 1}
                        onClick={() => setSelectedQuestionIndex(Math.min(questions.length - 1, idx + 1))}
                        className="gap-1 text-xs"
                      >
                        Next Question <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Bottom Phase 2 Bar */}
          <div className="p-4 bg-slate-900 rounded-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div>
              <span className="text-xs text-blue-300 font-bold uppercase tracking-wider block">Phase 2 Verification Complete</span>
              <p className="font-extrabold text-sm text-slate-100">
                {questions.length} Questions ready for complete exam preview.
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setPhase('extract')}
                className="text-white border-slate-700 hover:bg-slate-800 text-xs"
              >
                Back to Extract
              </Button>
              <Button 
                onClick={() => setPhase('preview')}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs gap-2 px-5 shadow-xs"
              >
                Proceed to Phase 3: Preview Entire Exam <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHASE 3: PREVIEW ENTIRE EXAM BEFORE PUBLISHING                            */}
      {/* ========================================================================= */}
      {phase === 'preview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30 mb-2">
                <Eye className="w-3.5 h-3.5 text-amber-300" /> Phase 3: Full Exam Preview & Quality Check
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight">{examTitle || 'Untitled Exam'}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-300">
                <span className="bg-blue-800/60 px-2.5 py-0.5 rounded-full font-semibold">{selectedExamMode}</span>
                <span>•</span>
                <span>{selectedDomain}</span>
                <span>•</span>
                <span className="font-bold text-emerald-300">{questions.length} Questions</span>
                <span>•</span>
                <span>Est. {durationMinutes} mins</span>
                <span>•</span>
                <span className="uppercase text-amber-300 font-extrabold">Plan: {requiredPlan}</span>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-xl bg-slate-800 p-1 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setPreviewTab('specsheet')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    previewTab === 'specsheet' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> Full Answer Key
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('interactive')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    previewTab === 'interactive' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" /> Interactive Student Sim
                </button>
              </div>
            </div>
          </div>

          {publishError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{publishError}</span>
            </div>
          )}

          {/* Preview Tab 1: Full Answer Key & Question Spec Sheet */}
          {previewTab === 'specsheet' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-sm">
                  Complete Exam Questions & Verified Answers ({questions.length})
                </h4>
                <span className="text-xs text-slate-500">
                  Ready to be published to {selectedExamMode} question bank.
                </span>
              </div>

              <div className="space-y-4">
                {questions.map((q, qIndex) => (
                  <div key={q.id || qIndex} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-extrabold text-xs flex items-center justify-center">
                          {qIndex + 1}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {q.questionTypeLabel || 'Single Choice'}
                        </span>
                        <span className="text-xs text-slate-400">
                          Difficulty: <strong className="text-slate-700">{q.difficulty}</strong>
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedQuestionIndex(qIndex);
                          setPhase('edit');
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-bold gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit Question #{qIndex + 1}
                      </Button>
                    </div>

                    <p className="font-bold text-slate-900 text-sm leading-relaxed">{q.questionStem}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = Array.isArray(q.correctAnswer)
                          ? q.correctAnswer.includes(opt)
                          : q.correctAnswer === opt;

                        return (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                              isCorrect 
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold' 
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                                isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span>{opt}</span>
                            </div>
                            {isCorrect && (
                              <span className="text-[10px] uppercase font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                Correct Answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="bg-slate-50 border border-slate-200 text-slate-700 p-3 rounded-xl text-xs">
                        <span className="font-bold text-slate-900">Clinical Rationale: </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview Tab 2: Interactive Student Simulation */}
          {previewTab === 'interactive' && questions[previewIndex] && (() => {
            const currentQ = questions[previewIndex];
            const isMultiple = currentQ.questionTypeId === 'multiple_select';
            const userResp = previewUserAnswers[previewIndex];
            const isAnswered = isMultiple 
              ? Array.isArray(userResp) && userResp.length > 0 
              : Boolean(userResp);

            return (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                      Student Simulation View
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-bold text-slate-600">
                      Question {previewIndex + 1} of {questions.length}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {currentQ.questionTypeLabel || 'Single Choice'}
                  </span>
                </div>

                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900 leading-relaxed">
                    {currentQ.questionStem}
                  </h3>

                  <div className="space-y-2.5">
                    {currentQ.options.map((opt, optIdx) => {
                      const isSelected = isMultiple
                        ? Array.isArray(userResp) && userResp.includes(opt)
                        : userResp === opt;

                      return (
                        <div
                          key={optIdx}
                          onClick={() => {
                            if (isMultiple) {
                              const currList = Array.isArray(userResp) ? [...userResp] : [];
                              const nextList = currList.includes(opt)
                                ? currList.filter(x => x !== opt)
                                : [...currList, opt];
                              setPreviewUserAnswers(prev => ({ ...prev, [previewIndex]: nextList }));
                            } else {
                              setPreviewUserAnswers(prev => ({ ...prev, [previewIndex]: opt }));
                            }
                          }}
                          className={`p-4 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-between ${
                            isSelected 
                              ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs' 
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300 text-slate-500'
                            }`}>
                              {String.fromCharCode(65 + optIdx)}
                            </div>
                            <span>{opt}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {previewShowRationale[previewIndex] && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-xs">
                      <p className="font-extrabold text-emerald-950">
                        Official Answer Key: {Array.isArray(currentQ.correctAnswer) ? currentQ.correctAnswer.join(', ') : currentQ.correctAnswer}
                      </p>
                      <p className="text-emerald-800">{currentQ.explanation || 'No rationale provided.'}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewShowRationale(prev => ({ ...prev, [previewIndex]: !prev[previewIndex] }))}
                      className="text-xs"
                    >
                      {previewShowRationale[previewIndex] ? 'Hide Answer Key' : 'Reveal Answer Key & Rationale'}
                    </Button>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={previewIndex === 0}
                        onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
                        className="text-xs"
                      >
                        <ChevronLeft className="w-4 h-4" /> Previous
                      </Button>
                      <Button
                        size="sm"
                        disabled={previewIndex === questions.length - 1}
                        onClick={() => setPreviewIndex(Math.min(questions.length - 1, previewIndex + 1))}
                        className="bg-blue-600 text-white text-xs"
                      >
                        Next <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Bottom Phase 3 Final Action Bar */}
          <div className="p-5 bg-slate-900 rounded-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Ready for Live Site</span>
              <p className="text-sm font-extrabold text-slate-100">
                Publish "{examTitle || 'Exam'}" to Exam Bank ({questions.length} questions, {selectedExamMode})
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setPhase('edit')}
                className="text-white border-slate-700 hover:bg-slate-800 text-xs"
              >
                ← Back to Edit
              </Button>
              <Button 
                onClick={handlePublishExamToSite}
                disabled={isPublishing}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-6 py-2.5 gap-2 shadow-md"
              >
                {isPublishing ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Publishing to Site...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Publish Exam to Site Now 🚀</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHASE 4: PUBLISHED SUCCESS CONFIRMATION                                   */}
      {/* ========================================================================= */}
      {phase === 'published' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-8 text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Exam Successfully Published!
            </h3>
            <p className="text-xs text-slate-600">
              "{examTitle}" has been saved to the database under <strong className="text-slate-900">{selectedExamMode}</strong> and is now live on the site for students!
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-lg mx-auto text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Exam Title:</span>
              <span className="font-bold text-slate-800">{examTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Category & Domain:</span>
              <span className="font-bold text-slate-800">{selectedExamMode} • {selectedDomain}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Questions Published:</span>
              <span className="font-bold text-emerald-600">{questions.length} Items</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Access Tier:</span>
              <span className="font-bold text-slate-800 uppercase">{requiredPlan}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              onClick={() => navigate('/dashboard/exams')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 px-5 py-2.5 rounded-xl shadow-xs"
            >
              <BookOpen className="w-4 h-4" /> Open in Exam Bank
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setRawText('');
                setQuestions([]);
                setExamTitle('');
                setPhase('extract');
              }}
              className="text-xs font-bold gap-2"
            >
              <Plus className="w-4 h-4" /> Extract Another Exam
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
