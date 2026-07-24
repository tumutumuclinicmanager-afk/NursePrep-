import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  BrainCircuit, Play, Clock, CheckCircle, HelpCircle, 
  Award, ArrowRight, RotateCcw, Sparkles, Filter, ChevronUp, 
  ChevronDown, Layers, AlertCircle, Check, X, BookOpen
} from 'lucide-react';
import { QuestionData } from '@/types';
import { ALL_QUIZ_QUESTIONS, NURSING_UNITS, NursingUnit } from '@/data/quizQuestions';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';

interface QuizGeneratorProps {
  embeddedModal?: boolean;
  onCloseModal?: () => void;
  initialUnit?: string;
  initialQuestionCount?: number;
}

export default function QuizGeneratorPage({
  embeddedModal = false,
  onCloseModal,
  initialUnit,
  initialQuestionCount
}: QuizGeneratorProps) {
  const navigate = useNavigate();

  // Configuration State
  const [selectedUnit, setSelectedUnit] = useState<string>(initialUnit || 'All');
  const [questionCount, setQuestionCount] = useState<number>(initialQuestionCount || 5);
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [quizMode, setQuizMode] = useState<'study' | 'exam'>('study');

  // Active Quiz State
  const [isQuizActive, setIsQuizActive] = useState<boolean>(false);
  const [activeQuestions, setActiveQuestions] = useState<QuestionData[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // User Responses
  // Single Choice / True False: string
  // Multiple Select (SATA): string[] (array of selected option IDs)
  // Numeric: string (number string input)
  // Ordered: string[] (array of step strings in user's chosen order)
  const [userAnswers, setUserAnswers] = useState<Record<number, any>>({});
  const [showRationale, setShowRationale] = useState<Record<number, boolean>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isSavingScore, setIsSavingScore] = useState<boolean>(false);

  // Start Quiz Function
  const handleStartQuiz = () => {
    let filtered = [...ALL_QUIZ_QUESTIONS];

    if (selectedUnit !== 'All') {
      filtered = filtered.filter(q => q.unitDomain === selectedUnit);
    }

    if (selectedType !== 'All') {
      filtered = filtered.filter(q => q.questionTypeId === selectedType);
    }

    if (selectedDifficulty !== 'All') {
      filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
    }

    // Shuffle questions
    const shuffled = filtered.sort(() => 0.5 - Math.random());
    const finalQuestions = shuffled.slice(0, Math.min(questionCount, shuffled.length));

    if (finalQuestions.length === 0) {
      alert('No questions found matching your specific filter criteria. Please broaden your selection.');
      return;
    }

    // Initialize ordering questions steps
    const initialAnswers: Record<number, any> = {};
    finalQuestions.forEach((q, idx) => {
      if (q.questionTypeId === 'order_drag' && q.orderedSteps) {
        // Shuffle steps for ordering question initially
        initialAnswers[idx] = [...q.orderedSteps].sort(() => 0.5 - Math.random());
      }
    });

    setActiveQuestions(finalQuestions);
    setUserAnswers(initialAnswers);
    setCurrentIndex(0);
    setShowRationale({});
    setIsCompleted(false);
    setIsQuizActive(true);
  };

  // Helper to check correctness of an answer
  const isQuestionCorrect = (q: QuestionData, index: number): boolean => {
    const ans = userAnswers[index];
    if (ans === undefined || ans === null) return false;

    if (q.questionTypeId === 'single_choice') {
      const correctOpt = q.options?.find(o => o.isCorrect);
      return ans === correctOpt?.id;
    }

    if (q.questionTypeId === 'multiple_select') {
      if (!Array.isArray(ans)) return false;
      const correctOptIds = q.options?.filter(o => o.isCorrect).map(o => o.id) || [];
      if (ans.length !== correctOptIds.length) return false;
      return correctOptIds.every(id => ans.includes(id));
    }

    if (q.questionTypeId === 'numeric') {
      const val = parseFloat(ans);
      if (isNaN(val) || q.numericValue === undefined) return false;
      const tol = q.tolerance || 0;
      return Math.abs(val - q.numericValue) <= tol;
    }

    if (q.questionTypeId === 'true_false') {
      return ans === q.trueFalseAnswer;
    }

    if (q.questionTypeId === 'order_drag') {
      if (!Array.isArray(ans) || !q.orderedSteps) return false;
      return JSON.stringify(ans) === JSON.stringify(q.orderedSteps);
    }

    return false;
  };

  // Move ordering step up/down
  const moveStep = (questionIdx: number, stepIdx: number, direction: 'up' | 'down') => {
    const currentList: string[] = [...(userAnswers[questionIdx] || [])];
    const targetIdx = direction === 'up' ? stepIdx - 1 : stepIdx + 1;
    if (targetIdx < 0 || targetIdx >= currentList.length) return;

    const temp = currentList[stepIdx];
    currentList[stepIdx] = currentList[targetIdx];
    currentList[targetIdx] = temp;

    setUserAnswers(prev => ({ ...prev, [questionIdx]: currentList }));
  };

  // Calculate overall quiz score
  const calculateScore = () => {
    let correct = 0;
    activeQuestions.forEach((q, idx) => {
      if (isQuestionCorrect(q, idx)) {
        correct++;
      }
    });
    const total = activeQuestions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { correct, total, percentage };
  };

  // Complete Quiz & Save to Firestore
  const handleFinishQuiz = async () => {
    setIsCompleted(true);
    const scoreData = calculateScore();

    if (auth.currentUser?.email) {
      try {
        setIsSavingScore(true);
        await addDoc(collection(db, 'examHistory'), {
          user: auth.currentUser.email,
          title: `Quick Quiz: ${selectedUnit === 'All' ? 'All Units' : selectedUnit}`,
          category: selectedUnit,
          score: scoreData.percentage,
          correctQuestions: scoreData.correct,
          totalQuestions: scoreData.total,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error saving score:', err);
      } finally {
        setIsSavingScore(false);
      }
    }
  };

  // Renderer for Question Controls
  const renderQuestionInput = (q: QuestionData, index: number) => {
    const isRevealed = showRationale[index] || (isCompleted && quizMode === 'exam');

    if (q.questionTypeId === 'single_choice') {
      return (
        <div className="space-y-3">
          {q.options?.map((opt, i) => {
            const isSelected = userAnswers[index] === opt.id;
            const isCorrect = opt.isCorrect;

            return (
              <button
                key={opt.id}
                onClick={() => {
                  if (isCompleted) return;
                  setUserAnswers(prev => ({ ...prev, [index]: opt.id }));
                  if (quizMode === 'study') {
                    setShowRationale(prev => ({ ...prev, [index]: true }));
                  }
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
                <span className="flex-grow">{opt.text}</span>
                {isRevealed && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
              </button>
            );
          })}
        </div>
      );
    }

    if (q.questionTypeId === 'multiple_select') {
      const selectedOpts: string[] = userAnswers[index] || [];

      const toggleSATA = (optId: string) => {
        if (isCompleted) return;
        const current = [...selectedOpts];
        const existIdx = current.indexOf(optId);
        if (existIdx > -1) {
          current.splice(existIdx, 1);
        } else {
          current.push(optId);
        }
        setUserAnswers(prev => ({ ...prev, [index]: current }));
      };

      return (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            Select All Options That Apply to this Clinical Scenario
          </div>
          {q.options?.map((opt, i) => {
            const isChecked = selectedOpts.includes(opt.id);
            const isCorrect = opt.isCorrect;

            return (
              <button
                key={opt.id}
                onClick={() => toggleSATA(opt.id)}
                className={`w-full p-4 rounded-xl border text-left font-medium text-sm transition-all flex items-start gap-3 ${
                  isRevealed && isCorrect
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold ring-1 ring-emerald-400'
                    : isRevealed && isChecked && !isCorrect
                    ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                    : isChecked
                    ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                  isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                }`}>
                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <span className="flex-grow">{opt.text}</span>
              </button>
            );
          })}
          {quizMode === 'study' && !isRevealed && (
            <Button
              size="sm"
              onClick={() => setShowRationale(prev => ({ ...prev, [index]: true }))}
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
            >
              Check My SATA Answer
            </Button>
          )}
        </div>
      );
    }

    if (q.questionTypeId === 'numeric') {
      const currentVal = userAnswers[index] || '';

      return (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
              Enter Calculated Numerical Value ({q.unitOfMeasure || 'units'})
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="any"
                value={currentVal}
                onChange={(e) => setUserAnswers(prev => ({ ...prev, [index]: e.target.value }))}
                placeholder="Type your number..."
                disabled={isCompleted}
                className="w-full md:w-64 px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-lg font-extrabold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-bold text-slate-600">{q.unitOfMeasure}</span>
            </div>
          </div>
          {quizMode === 'study' && !isRevealed && (
            <Button
              size="sm"
              onClick={() => setShowRationale(prev => ({ ...prev, [index]: true }))}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
            >
              Check Calculation Answer
            </Button>
          )}
        </div>
      );
    }

    if (q.questionTypeId === 'true_false') {
      const currentAns = userAnswers[index];

      return (
        <div className="grid grid-cols-2 gap-4">
          {[true, false].map((val) => {
            const isSelected = currentAns === val;
            const isCorrect = val === q.trueFalseAnswer;

            return (
              <button
                key={val ? 'true' : 'false'}
                onClick={() => {
                  if (isCompleted) return;
                  setUserAnswers(prev => ({ ...prev, [index]: val }));
                  if (quizMode === 'study') {
                    setShowRationale(prev => ({ ...prev, [index]: true }));
                  }
                }}
                className={`p-6 rounded-2xl border text-center font-extrabold text-lg transition-all ${
                  isRevealed && isCorrect
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-400'
                    : isRevealed && isSelected && !isCorrect
                    ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                    : isSelected
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {val ? 'TRUE' : 'FALSE'}
              </button>
            );
          })}
        </div>
      );
    }

    if (q.questionTypeId === 'order_drag') {
      const orderedList: string[] = userAnswers[index] || q.orderedSteps || [];

      return (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 text-blue-900 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600 shrink-0" />
            Arrange the actions in correct priority order using the Up / Down controls (1 = Highest Priority)
          </div>
          <div className="space-y-2">
            {orderedList.map((stepText, i) => (
              <div
                key={i}
                className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center shrink-0">
                    #{i + 1}
                  </span>
                  <p className="text-xs md:text-sm font-semibold text-slate-800">{stepText}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    disabled={i === 0 || isCompleted}
                    onClick={() => moveStep(index, i, 'up')}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded-md text-slate-700"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    disabled={i === orderedList.length - 1 || isCompleted}
                    onClick={() => moveStep(index, i, 'down')}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded-md text-slate-700"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {quizMode === 'study' && !isRevealed && (
            <Button
              size="sm"
              onClick={() => setShowRationale(prev => ({ ...prev, [index]: true }))}
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
            >
              Check Ordered Priorities
            </Button>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`max-w-5xl mx-auto ${embeddedModal ? 'p-0' : 'p-4 md:p-8 space-y-8'}`}>
      {!isQuizActive ? (
        /* Configuration Screen */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-10 space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-200">
                <BrainCircuit className="w-4 h-4 text-blue-600" />
                Adaptive AI Quick Quiz Generator
              </div>
              <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                Configure Smart Nursing Practice
              </h1>
              <p className="text-slate-500 text-sm md:text-base max-w-2xl">
                Select your target nursing curriculum unit, question types, difficulty level, and mode to launch an instant practice test.
              </p>
            </div>
            {embeddedModal && onCloseModal && (
              <button 
                onClick={onCloseModal} 
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Form Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Unit Specialty Selection */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                1. Select Nursing Unit / Specialty ({NURSING_UNITS.length} Units Available)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedUnit('All')}
                  className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                    selectedUnit === 'All'
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>All Curriculum Units</span>
                  <BookOpen className="w-4 h-4 opacity-80" />
                </button>
                {NURSING_UNITS.map((unit) => {
                  const unitCount = ALL_QUIZ_QUESTIONS.filter(q => q.unitDomain === unit).length || 5;
                  return (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => setSelectedUnit(unit)}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                        selectedUnit === unit
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate pr-2">{unit}</span>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                        selectedUnit === unit ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {unitCount} Qs
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question Count */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                2. Number of Questions
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuestionCount(num)}
                    className={`p-3 rounded-xl border font-bold text-xs text-center transition-all ${
                      questionCount === num
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {num} Qs
                  </button>
                ))}
              </div>
            </div>

            {/* Question Type Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                3. Question Format Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Formats (MCQ, SATA, Math, Ordering, T/F)</option>
                <option value="single_choice">Multiple Choice (Single Answer)</option>
                <option value="multiple_select">Select All That Apply (SATA)</option>
                <option value="numeric">Dosage Math & Numerical Calculations</option>
                <option value="order_drag">Prioritization & Sequencing</option>
                <option value="true_false">True or False</option>
              </select>
            </div>

            {/* Difficulty Level */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                4. Difficulty Level
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Difficulty Levels</option>
                <option value="Easy">Beginner / Easy</option>
                <option value="Medium">Medium / Standard Board</option>
                <option value="Hard">Advanced / Critical Judgment</option>
              </select>
            </div>

            {/* Practice Mode */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                5. Feedback Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setQuizMode('study')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                    quizMode === 'study'
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-extrabold">Study Mode</div>
                  <div className="text-[10px] opacity-80">Instant Rationales</div>
                </button>
                <button
                  type="button"
                  onClick={() => setQuizMode('exam')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                    quizMode === 'exam'
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-extrabold">Exam Mode</div>
                  <div className="text-[10px] opacity-80">Score at the End</div>
                </button>
              </div>
            </div>
          </div>

          {/* Launch Button */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Includes board questions with rationales and dosage math.</span>
            </div>
            <Button
              onClick={handleStartQuiz}
              className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl gap-2 shadow-lg shadow-blue-500/20"
            >
              <Play className="w-4 h-4 fill-white" /> Launch Smart Practice Quiz
            </Button>
          </div>
        </div>
      ) : (
        /* Active Quiz Runner */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Top Bar */}
          <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-blue-400 font-bold uppercase tracking-wider block">
                  {activeQuestions[currentIndex]?.unitDomain}
                </span>
                <h3 className="font-bold text-sm md:text-base">Quick Quiz Practice</h3>
              </div>
            </div>

            <button
              onClick={() => setIsQuizActive(false)}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Exit Quiz
            </button>
          </div>

          {!isCompleted ? (
            <div className="p-6 md:p-8 space-y-6">
              {/* Progress Header */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-2">
                    <span>Question <strong>{currentIndex + 1}</strong> of <strong>{activeQuestions.length}</strong></span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-bold">
                      {activeQuestions[currentIndex]?.questionTypeLabel}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      activeQuestions[currentIndex]?.difficulty === 'Hard' ? 'bg-rose-100 text-rose-800' :
                      activeQuestions[currentIndex]?.difficulty === 'Medium' ? 'bg-amber-100 text-amber-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {activeQuestions[currentIndex]?.difficulty}
                    </span>
                  </span>
                  <span>{Math.round(((currentIndex + 1) / activeQuestions.length) * 100)}% Complete</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / activeQuestions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question Stem */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900 text-base md:text-lg leading-relaxed">
                  {activeQuestions[currentIndex]?.questionStem}
                </p>
              </div>

              {/* Interactive Input Renderer */}
              {renderQuestionInput(activeQuestions[currentIndex], currentIndex)}

              {/* Rationale Display */}
              {(showRationale[currentIndex] || (isCompleted && quizMode === 'exam')) && (
                <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl space-y-2 text-xs md:text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-blue-900 uppercase tracking-wider block">
                      Clinical Rationale & Explanation
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${
                      isQuestionCorrect(activeQuestions[currentIndex], currentIndex)
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {isQuestionCorrect(activeQuestions[currentIndex], currentIndex) ? 'Correct Answer!' : 'Incorrect Answer'}
                    </span>
                  </div>
                  {activeQuestions[currentIndex]?.calculationSteps && (
                    <div className="p-3 bg-white/80 border border-blue-200 rounded-lg text-blue-950 font-mono text-xs">
                      <strong>Calculation Steps:</strong> {activeQuestions[currentIndex].calculationSteps}
                    </div>
                  )}
                  <p className="text-blue-950 leading-relaxed">
                    {activeQuestions[currentIndex]?.rationale}
                  </p>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(prev => prev - 1)}
                >
                  Previous
                </Button>

                {currentIndex < activeQuestions.length - 1 ? (
                  <Button 
                    onClick={() => setCurrentIndex(prev => prev + 1)}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  >
                    Next Question <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleFinishQuiz}
                    disabled={isSavingScore}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-extrabold"
                  >
                    {isSavingScore ? 'Saving Score...' : 'Submit & Complete Quiz'} <Award className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* Results Summary */
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Award className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold text-slate-900">Practice Quiz Completed!</h2>
                <p className="text-sm text-slate-500">
                  Performance results for <strong>{selectedUnit === 'All' ? 'All Nursing Units' : selectedUnit}</strong>
                </p>
              </div>

              {(() => {
                const score = calculateScore();
                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 max-w-sm mx-auto space-y-3 shadow-2xs">
                    <div className="text-5xl font-black text-slate-900">
                      {score.percentage}%
                    </div>
                    <p className="text-xs font-semibold text-slate-600">
                      Answered <strong className="text-emerald-600">{score.correct}</strong> out of <strong>{score.total}</strong> questions correctly.
                    </p>
                  </div>
                );
              })()}

              <div className="flex justify-center gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsCompleted(false);
                    setIsQuizActive(false);
                  }}
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Configure New Quiz
                </Button>
                <Button 
                  onClick={() => navigate('/dashboard')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Return to Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
