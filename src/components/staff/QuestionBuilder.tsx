import React, { useState } from 'react';
import { 
  Plus, Trash2, CheckCircle2, Image, FileText, Layers, Settings, 
  HelpCircle, ListChecks, ArrowUpDown, Hash, MoveVertical, Grid, 
  Tag, BookOpen, Sparkles, Save, Check, X, Info, PlusCircle, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  QuestionData, QuestionTypeId, QuestionTypeDefinition, 
  QuestionOption, MatchingPair, BowtieMatrixConfig 
} from '@/types';

const DEFAULT_EXAM_MODES = [
  'NCLEX-RN',
  'NCLEX-PN',
  'ATI TEAS',
  'HESI A2',
  'Prometric Nursing',
  'NCLEX Next Generation (NGN)',
  'Certified Nurse Educator (CNE)'
];

const DEFAULT_UNITS = [
  'Medical-Surgical Nursing (MedSurg)',
  'Pharmacology & Parenteral Therapies',
  'Pediatrics & Child Health',
  'Maternal & Newborn Health (Obstetrics)',
  'Psychiatric & Mental Health',
  'Fundamentals of Nursing',
  'Critical Care & Emergency Nursing',
  'Leadership & Community Health',
  'Anatomy & Physiology'
];

const INITIAL_QUESTION_TYPES: QuestionTypeDefinition[] = [
  { id: 'single_choice', label: 'Single Choice', description: 'Standard 4-option multiple choice with 1 correct answer', category: 'Standard' },
  { id: 'multiple_select', label: 'Multiple Select', description: 'Select All That Apply (SATA) with multiple correct answers', category: 'Standard' },
  { id: 'true_false', label: 'True / False', description: 'Binary true or false evaluation statement', category: 'Standard' },
  { id: 'matrix_grid', label: 'Matrix / Tabular Grid', description: 'NextGen NCLEX row-by-column matrix (e.g. Indicated vs Not Indicated)', category: 'NGN Next-Gen' },
  { id: 'case_exhibit', label: 'Case Study Exhibit', description: 'Multi-tab clinical case exhibit (Nurses Notes, Vitals, Labs, H&P)', category: 'NGN Next-Gen' },
  { id: 'sieve_bowtie', label: 'Sieve Template / Bowtie', description: 'NextGen NCLEX 3-column matrix (Actions, Conditions, Parameters)', category: 'NGN Next-Gen' },
  { id: 'numeric', label: 'Numeric Response', description: 'Math / dosage calculations requiring exact or bounded numbers and units', category: 'Standard' },
  { id: 'image_based', label: 'Image Based', description: 'Question stem includes a diagram, anatomical map, or ECG strip', category: 'Image & Media' },
  { id: 'multiple_image', label: 'Multiple Image', description: 'Answer choices themselves are images or visual diagrams', category: 'Image & Media' },
  { id: 'matching', label: 'Matching', description: 'Match terms in Column A with corresponding concepts in Column B', category: 'Interactive & Ordering' },
  { id: 'essay', label: 'Essay', description: 'Open-ended comprehensive response evaluated against a grading rubric', category: 'Standard' },
  { id: 'short_answer', label: 'Short Answer', description: 'Brief text entry evaluated against exact or keyword answers', category: 'Standard' },
  { id: 'fill_blank', label: 'Fill in the Blank', description: 'Text entry with one or more inline [blank] slots', category: 'Standard' },
  { id: 'hotspot', label: 'Hotspot', description: 'Identify or click target region/coordinates on an image or chart', category: 'Image & Media' },
  { id: 'order_numbers', label: 'Ordering : Numbers', description: 'Sequence clinical steps or priorities using numbers (1, 2, 3...)', category: 'Interactive & Ordering' },
  { id: 'order_drag', label: 'Ordering : Drag and Drop', description: 'Drag procedural steps into correct chronological sequence', category: 'Interactive & Ordering' },
];

export default function QuestionBuilder({ onQuestionSaved }: { onQuestionSaved?: () => void }) {
  // Exam modes & Units
  const [examModes, setExamModes] = useState<string[]>(DEFAULT_EXAM_MODES);
  const [selectedExamMode, setSelectedExamMode] = useState<string>(DEFAULT_EXAM_MODES[0]);
  const [newExamModeInput, setNewExamModeInput] = useState('');
  const [showAddExamModeModal, setShowAddExamModeModal] = useState(false);

  const [units, setUnits] = useState<string[]>(DEFAULT_UNITS);
  const [selectedUnit, setSelectedUnit] = useState<string>(DEFAULT_UNITS[0]);
  const [newUnitInput, setNewUnitInput] = useState('');
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);

  // Question Types
  const [questionTypes, setQuestionTypes] = useState<QuestionTypeDefinition[]>(INITIAL_QUESTION_TYPES);
  const [selectedType, setSelectedType] = useState<QuestionTypeDefinition>(INITIAL_QUESTION_TYPES[0]);
  const [newTypeLabel, setNewTypeLabel] = useState('');
  const [newTypeDesc, setNewTypeDesc] = useState('');
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);

  // Shared Core Question Fields
  const [questionStem, setQuestionStem] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [rationale, setRationale] = useState('');
  const [correctExplanation, setCorrectExplanation] = useState('');
  const [wrongExplanation, setWrongExplanation] = useState('');
  const [citation, setCitation] = useState('');
  const [tagInput, setTagInput] = useState('');

  // Type-Specific Parameter States
  // Single Choice / Multiple Select
  const [options, setOptions] = useState<QuestionOption[]>([
    { id: '1', text: 'Administer prescribed IV bolus of 0.9% Normal Saline', isCorrect: true, explanation: 'Fluid resuscitation is the primary intervention for hypovolemic hypotension.' },
    { id: '2', text: 'Place patient in Trendelenburg position', isCorrect: false, explanation: 'Trendelenburg position is no longer recommended due to decreased respiratory compliance.' },
    { id: '3', text: 'Administer oral hypotonic fluids immediately', isCorrect: false, explanation: 'Oral fluids are contraindicated in acute decompensated hypotension.' },
    { id: '4', text: 'Withhold all vasopressors and monitor for 2 hours', isCorrect: false, explanation: 'Delaying intervention risks organ ischemia.' },
  ]);
  const [partialCreditRule, setPartialCreditRule] = useState('NGN +/- Partial Credit');

  // Matrix Grid NGN State
  const [matrixColumns, setMatrixColumns] = useState<string[]>(['Indicated', 'Not Indicated', 'Nonessential']);
  const [matrixRows, setMatrixRows] = useState<{ id: string; statement: string; correctColumnIndex: number }[]>([
    { id: '1', statement: 'Obtain stat 12-lead electrocardiogram (ECG)', correctColumnIndex: 0 },
    { id: '2', statement: 'Administer oral metoprolol tartrate 50 mg', correctColumnIndex: 1 },
    { id: '3', statement: 'Draw serum troponin I and CK-MB levels', correctColumnIndex: 0 },
    { id: '4', statement: 'Schedule routine physical therapy consultation', correctColumnIndex: 2 },
  ]);

  // Case Exhibit NGN State
  const [exhibitTabs, setExhibitTabs] = useState<{ id: string; title: string; content: string }[]>([
    { id: '1', title: "Nurses' Notes", content: "08:00 - Client admitted with severe shortness of breath and chest tightness radiating to left jaw. Bilateral crackles auscultated at lung bases. Diaphoretic and anxious." },
    { id: '2', title: "Vital Signs", content: "BP 168/94 mmHg, HR 112 bpm (sinus tachycardia), RR 26/min, Temp 37.1°C (98.8°F), SpO2 89% on room air." },
    { id: '3', title: "Lab Results", content: "Troponin I: 3.8 ng/mL (Elevated)\nBNP: 850 pg/mL (Elevated)\nPotassium: 3.4 mEq/L (Low)" }
  ]);

  // True/False
  const [trueFalseValue, setTrueFalseValue] = useState<boolean>(true);

  // Numeric
  const [numericVal, setNumericVal] = useState<string>('');
  const [numericTolerance, setNumericTolerance] = useState<string>('0');
  const [numericUnit, setNumericUnit] = useState<string>('mL/hr');
  const [calculationSteps, setCalculationSteps] = useState<string>('');

  // Image Based
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageCaption, setImageCaption] = useState<string>('');

  // Multiple Image Options
  const [imageOptions, setImageOptions] = useState<QuestionOption[]>([
    { id: '1', text: 'Diagram A', imageUrl: '', isCorrect: true },
    { id: '2', text: 'Diagram B', imageUrl: '', isCorrect: false },
  ]);

  // Matching
  const [matchingPairs, setMatchingPairs] = useState<MatchingPair[]>([
    { id: '1', term: 'Metoprolol', match: 'Beta-1 Selective Blocker' },
    { id: '2', term: 'Lisinopril', match: 'ACE Inhibitor' },
  ]);

  // Essay & Short Answer
  const [idealAnswer, setIdealAnswer] = useState('');
  const [gradingRubric, setGradingRubric] = useState('');
  const [maxWords, setMaxWords] = useState(250);
  const [acceptedKeywords, setAcceptedKeywords] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);

  // Fill in the Blank
  const [blankKeys, setBlankKeys] = useState<{ blankIndex: number; acceptedValues: string }[]>([
    { blankIndex: 1, acceptedValues: 'troponin, troponin I, troponin T' }
  ]);

  // Hotspot
  const [hotspotImg, setHotspotImg] = useState('');
  const [hotspotTarget, setHotspotTarget] = useState('');

  // Ordering
  const [orderedSteps, setOrderedSteps] = useState<string[]>([
    'Verify healthcare provider order',
    'Perform hand hygiene and identify patient using 2 identifiers',
    'Don sterile gloves and set up sterile field',
    'Infiltrate site with antiseptic solution'
  ]);

  // Sieve / Bowtie NGN Matrix
  const [caseScenario, setCaseScenario] = useState('');
  const [bowtieConfig, setBowtieConfig] = useState<BowtieMatrixConfig>({
    actionsToTake: [
      { text: 'Administer 100% O2 via non-rebreather mask', isCorrect: true },
      { text: 'Elevate head of bed to High-Fowler position', isCorrect: true },
      { text: 'Administer oral fluids immediately', isCorrect: false }
    ],
    potentialConditions: [
      { text: 'Acute Pulmonary Edema', isCorrect: true },
      { text: 'Spontaneous Pneumothorax', isCorrect: false },
      { text: 'Anaphylactic Reaction', isCorrect: false }
    ],
    parametersToMonitor: [
      { text: 'Oxygen saturation levels (SpO2)', isCorrect: true },
      { text: 'Lung sound auscultation', isCorrect: true },
      { text: 'Pupillary light reaction', isCorrect: false }
    ]
  });

  // Custom question parameters
  const [customParamsText, setCustomParamsText] = useState('');

  // Status & submission
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Handler functions for dynamic lists
  const handleAddOption = () => {
    setOptions(prev => [
      ...prev,
      { id: Date.now().toString(), text: `Option ${String.fromCharCode(65 + prev.length)}`, isCorrect: false }
    ]);
  };

  const handleRemoveOption = (id: string) => {
    if (options.length <= 2) {
      alert('A question must have at least 2 options.');
      return;
    }
    setOptions(prev => prev.filter(o => o.id !== id));
  };

  const handleAddImageOption = () => {
    setImageOptions(prev => [
      ...prev,
      { id: Date.now().toString(), text: `Diagram ${String.fromCharCode(65 + prev.length)}`, imageUrl: '', isCorrect: false }
    ]);
  };

  const handleAddMatchingPair = () => {
    setMatchingPairs(prev => [
      ...prev,
      { id: Date.now().toString(), term: '', match: '' }
    ]);
  };

  const handleAddOrderedStep = () => {
    setOrderedSteps(prev => [...prev, 'New step description']);
  };

  // Add custom Exam Mode
  const handleCreateExamMode = () => {
    if (!newExamModeInput.trim()) return;
    const mode = newExamModeInput.trim();
    if (!examModes.includes(mode)) {
      setExamModes(prev => [...prev, mode]);
    }
    setSelectedExamMode(mode);
    setNewExamModeInput('');
    setShowAddExamModeModal(false);
  };

  // Add custom Unit / Domain
  const handleCreateUnit = () => {
    if (!newUnitInput.trim()) return;
    const unit = newUnitInput.trim();
    if (!units.includes(unit)) {
      setUnits(prev => [...prev, unit]);
    }
    setSelectedUnit(unit);
    setNewUnitInput('');
    setShowAddUnitModal(false);
  };

  // Add custom Question Type
  const handleCreateType = () => {
    if (!newTypeLabel.trim()) return;
    const customId = `custom_${Date.now()}`;
    const newDef: QuestionTypeDefinition = {
      id: customId,
      label: newTypeLabel.trim(),
      description: newTypeDesc.trim() || 'Custom Lecturer Defined Question Format',
      category: 'Custom',
      isCustom: true
    };
    setQuestionTypes(prev => [...prev, newDef]);
    setSelectedType(newDef);
    setNewTypeLabel('');
    setNewTypeDesc('');
    setShowAddTypeModal(false);
  };

  // Main Submit Handler
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionStem.trim()) {
      setErrorMsg('Please provide a question stem/prompt.');
      return;
    }

    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const newQuestion: QuestionData = {
        examMode: selectedExamMode,
        unitDomain: selectedUnit,
        questionTypeId: selectedType.id,
        questionTypeLabel: selectedType.label,
        questionStem: questionStem.trim(),
        difficulty,
        rationale: rationale.trim(),
        citation: citation.trim(),
        tags: tagInput ? tagInput.split(',').map(t => t.trim()).filter(Boolean) : [],
        createdAt: new Date().toISOString(),
        createdBy: 'Lecturer',

        // Specific feedback
        correctExplanation: correctExplanation.trim() || undefined,
        wrongExplanation: wrongExplanation.trim() || undefined,

        // Dynamic question type parameters
        options: (selectedType.id === 'single_choice' || selectedType.id === 'multiple_select' || selectedType.id === 'image_based') ? options : undefined,
        partialCreditRule: (selectedType.id === 'multiple_select' || selectedType.id === 'matrix_grid') ? partialCreditRule : undefined,
        trueFalseAnswer: selectedType.id === 'true_false' ? trueFalseValue : undefined,

        numericValue: selectedType.id === 'numeric' ? parseFloat(numericVal) || 0 : undefined,
        tolerance: selectedType.id === 'numeric' ? parseFloat(numericTolerance) || 0 : undefined,
        unitOfMeasure: selectedType.id === 'numeric' ? numericUnit : undefined,
        calculationSteps: selectedType.id === 'numeric' ? calculationSteps : undefined,

        imageUrl: selectedType.id === 'image_based' || selectedType.id === 'hotspot' ? (imageUrl || hotspotImg) : undefined,
        imageCaption: selectedType.id === 'image_based' ? imageCaption : undefined,

        matchingPairs: selectedType.id === 'matching' ? matchingPairs : undefined,

        idealAnswer: (selectedType.id === 'essay' || selectedType.id === 'short_answer') ? idealAnswer : undefined,
        gradingRubric: selectedType.id === 'essay' ? gradingRubric : undefined,
        maxWordCount: selectedType.id === 'essay' ? maxWords : undefined,
        acceptedKeywords: (selectedType.id === 'short_answer' || selectedType.id === 'essay') ? acceptedKeywords.split(',').map(k => k.trim()).filter(Boolean) : undefined,
        caseSensitive: selectedType.id === 'short_answer' ? caseSensitive : undefined,

        blankAnswers: selectedType.id === 'fill_blank' ? blankKeys.map(b => ({
          blankIndex: b.blankIndex,
          acceptedValues: b.acceptedValues.split(',').map(v => v.trim()).filter(Boolean)
        })) : undefined,

        hotspotImageUrl: selectedType.id === 'hotspot' ? hotspotImg : undefined,
        hotspotTargetDescription: selectedType.id === 'hotspot' ? hotspotTarget : undefined,

        orderedSteps: (selectedType.id === 'order_numbers' || selectedType.id === 'order_drag') ? orderedSteps : undefined,

        caseStudyScenario: selectedType.id === 'sieve_bowtie' ? caseScenario : undefined,
        bowtieConfig: selectedType.id === 'sieve_bowtie' ? bowtieConfig : undefined,

        // Matrix Grid & Case Exhibit
        matrixColumns: selectedType.id === 'matrix_grid' ? matrixColumns : undefined,
        matrixRows: selectedType.id === 'matrix_grid' ? matrixRows : undefined,
        exhibitTabs: selectedType.id === 'case_exhibit' ? exhibitTabs : undefined,

        customParameters: selectedType.isCustom ? { customDetails: customParamsText } : undefined,
      };

      await addDoc(collection(db, 'questions'), newQuestion);

      setSuccessMsg(`Question successfully created and published under ${selectedExamMode} (${selectedUnit})!`);
      
      // Reset stem and rationale for next question
      setQuestionStem('');
      setRationale('');
      if (onQuestionSaved) onQuestionSaved();
    } catch (err: any) {
      console.error('Error saving question:', err);
      setErrorMsg('Failed to save question to Firestore database.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-800/60 px-3 py-1 rounded-full text-xs font-semibold text-blue-200 mb-2 border border-blue-700/50">
              <Sparkles className="w-3.5 h-3.5" /> Lecturer Exam Studio
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Interactive Question & Parameter Builder</h2>
            <p className="text-blue-200 text-sm mt-1 max-w-2xl">
              Configure exam modes, units/domains, and custom question parameters with full answer keys, rationales, and NGN clinical judgment formats.
            </p>
          </div>
        </div>
      </div>

      {/* Step 1 & 2: Exam Mode and Unit / Domain Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: Select Exam Mode */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">1</span>
              <h3 className="font-bold text-slate-800 text-sm">Select Exam Mode</h3>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAddExamModeModal(true)}
              className="text-xs h-8 text-blue-600 border-blue-200 hover:bg-blue-50 gap-1 font-semibold"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Add Mode
            </Button>
          </div>

          <select 
            value={selectedExamMode} 
            onChange={(e) => setSelectedExamMode(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {examModes.map((mode) => (
              <option key={mode} value={mode}>{mode}</option>
            ))}
          </select>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Target test framework for this item
          </p>
        </div>

        {/* Step 2: Select Unit / Domain */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">2</span>
              <h3 className="font-bold text-slate-800 text-sm">Select Unit / Domain</h3>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAddUnitModal(true)}
              className="text-xs h-8 text-blue-600 border-blue-200 hover:bg-blue-50 gap-1 font-semibold"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Add Unit
            </Button>
          </div>

          <select 
            value={selectedUnit} 
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {units.map((unit) => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Categorizes the item in the student learning analytics
          </p>
        </div>
      </div>

      {/* Step 3: Select Question Type */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">3</span>
            <div>
              <h3 className="font-bold text-slate-800">Select Question Type</h3>
              <p className="text-xs text-slate-500">Chooses interaction pattern & parameter layout for student evaluation</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowAddTypeModal(true)}
            className="text-xs h-8 text-blue-600 border-blue-200 hover:bg-blue-50 gap-1 font-semibold self-start sm:self-auto"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Add Custom Question Type
          </Button>
        </div>

        {/* Dropdown / Grid selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {questionTypes.map((qType) => {
            const isSelected = selectedType.id === qType.id;
            return (
              <button
                key={qType.id}
                type="button"
                onClick={() => setSelectedType(qType)}
                className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-2 ${
                  isSelected 
                    ? 'bg-blue-50/80 border-blue-600 shadow-sm ring-2 ring-blue-500/20' 
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-blue-700' : 'text-slate-500'}`}>
                      {qType.category}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                  <h4 className={`font-bold text-sm mt-1 ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                    {qType.label}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {qType.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 4: Configure Question Parameters, Stem, Answers, and Rationales */}
      <form onSubmit={handleSaveQuestion} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">4</span>
          <div>
            <h3 className="font-bold text-slate-800">
              Set Question Parameters & Content ({selectedType.label})
            </h3>
            <p className="text-xs text-slate-500">Provide the question text, options, answer parameters, and detailed rationale</p>
          </div>
        </div>

        {/* Global Stem Input */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-700">
            Question Stem / Prompt <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={questionStem}
            onChange={(e) => setQuestionStem(e.target.value)}
            placeholder="Type clinical scenario or question stem here... (e.g. A nurse is assessing a patient with suspected Cushing's syndrome. Which laboratory finding should the nurse anticipate?)"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* DYNAMIC PARAMETERS AREA BASED ON SELECTED QUESTION TYPE */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
            <Settings className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {selectedType.label} Answer Parameters
            </h4>
          </div>

          {/* 1. SINGLE CHOICE / 2. MULTIPLE SELECT */}
          {(selectedType.id === 'single_choice' || selectedType.id === 'multiple_select') && (
            <div className="space-y-4">
              {selectedType.id === 'multiple_select' && (
                <div className="flex items-center gap-4 bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs">
                  <span className="font-bold text-blue-900">Scoring Method:</span>
                  <select 
                    value={partialCreditRule} 
                    onChange={(e) => setPartialCreditRule(e.target.value)}
                    className="bg-white border border-blue-200 rounded px-2 py-1 text-xs font-medium text-slate-800"
                  >
                    <option value="NGN +/- Partial Credit">NGN +/- Partial Credit Rule</option>
                    <option value="0/1 All or Nothing">0/1 All or Nothing</option>
                    <option value="Rationale Credit Only">Rationale Credit Only</option>
                  </select>
                </div>
              )}

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Options & Answer Explanations <span className="text-xs text-slate-400 font-normal">(Mark correct choices & add option-level rationales)</span>
                </label>
                {options.map((opt, index) => (
                  <div key={opt.id} className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-3">
                      {selectedType.id === 'single_choice' ? (
                        <input 
                          type="radio" 
                          name="correctSingleChoice" 
                          checked={opt.isCorrect}
                          onChange={() => {
                            setOptions(prev => prev.map(o => ({ ...o, isCorrect: o.id === opt.id })));
                          }}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      ) : (
                        <input 
                          type="checkbox" 
                          checked={opt.isCorrect}
                          onChange={(e) => {
                            setOptions(prev => prev.map(o => o.id === opt.id ? { ...o, isCorrect: e.target.checked } : o));
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                        />
                      )}
                      <span className="w-6 text-xs font-bold text-slate-500 shrink-0">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <input 
                        type="text" 
                        value={opt.text}
                        onChange={(e) => {
                          const val = e.target.value;
                          setOptions(prev => prev.map(o => o.id === opt.id ? { ...o, text: val } : o));
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + index)} Text`}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                      />
                      <button 
                        type="button" 
                        onClick={() => handleRemoveOption(opt.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Option Level Rationale Explanation */}
                    <div className="pl-9 pr-2">
                      <input 
                        type="text" 
                        value={opt.explanation || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setOptions(prev => prev.map(o => o.id === opt.id ? { ...o, explanation: val } : o));
                        }}
                        placeholder={`Rationale / why Option ${String.fromCharCode(65 + index)} is ${opt.isCorrect ? 'correct' : 'incorrect'}...`}
                        className="w-full bg-slate-50/60 border border-slate-200/80 rounded-md px-2.5 py-1.5 text-xs text-slate-600 focus:ring-1 focus:ring-blue-400 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                ))}

                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddOption}
                  className="text-xs gap-1 border-dashed text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Choice Option
                </Button>
              </div>
            </div>
          )}

          {/* 3. TRUE / FALSE */}
          {selectedType.id === 'true_false' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Select Correct Evaluation</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setTrueFalseValue(true)}
                  className={`flex-1 py-3 rounded-lg font-bold border text-center transition-colors ${
                    trueFalseValue ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  TRUE
                </button>
                <button
                  type="button"
                  onClick={() => setTrueFalseValue(false)}
                  className={`flex-1 py-3 rounded-lg font-bold border text-center transition-colors ${
                    !trueFalseValue ? 'bg-rose-50 border-rose-500 text-rose-800' : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  FALSE
                </button>
              </div>
            </div>
          )}

          {/* 4. NUMERIC RESPONSE */}
          {selectedType.id === 'numeric' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Numeric Value *</label>
                <input 
                  type="number" 
                  step="any"
                  required
                  placeholder="e.g. 25.5"
                  value={numericVal}
                  onChange={(e) => setNumericVal(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tolerance Margin (±)</label>
                <input 
                  type="number" 
                  step="any"
                  placeholder="e.g. 0.1 (Leave 0 for exact)"
                  value={numericTolerance}
                  onChange={(e) => setNumericTolerance(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Unit of Measure</label>
                <input 
                  type="text" 
                  placeholder="e.g. mL/hr, mg/kg, gtts/min"
                  value={numericUnit}
                  onChange={(e) => setNumericUnit(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Step-by-Step Calculation Formula</label>
                <textarea 
                  rows={2}
                  placeholder="e.g. (Desired / Available) x Volume = (500mg / 250mg) x 5mL = 10 mL"
                  value={calculationSteps}
                  onChange={(e) => setCalculationSteps(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* 5. IMAGE BASED */}
          {selectedType.id === 'image_based' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Diagram / Chart Image URL</label>
                  <input 
                    type="url" 
                    placeholder="https://example.com/ecg-strip.png"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Image Caption / Alt Text</label>
                  <input 
                    type="text" 
                    placeholder="Lead II ECG Strip showing Ventricular Fibrillation"
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {imageUrl && (
                <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center gap-4">
                  <img src={imageUrl} alt="Preview" className="h-20 object-contain rounded border border-slate-100" />
                  <p className="text-xs text-slate-500 italic">Image Preview</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Question Choices (Radio for correct)</label>
                {options.map((opt, i) => (
                  <div key={opt.id} className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="imgOptRadio" 
                      checked={opt.isCorrect} 
                      onChange={() => setOptions(prev => prev.map(o => ({ ...o, isCorrect: o.id === opt.id })))} 
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={opt.text}
                      onChange={(e) => {
                        const val = e.target.value;
                        setOptions(prev => prev.map(o => o.id === opt.id ? { ...o, text: val } : o));
                      }}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. MULTIPLE IMAGE */}
          {selectedType.id === 'multiple_image' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Image Answer Options (Select correct card)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {imageOptions.map((opt, idx) => (
                  <div key={opt.id} className={`p-4 rounded-xl border space-y-3 bg-white ${opt.isCorrect ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-slate-500">Choice {String.fromCharCode(65 + idx)}</span>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 cursor-pointer">
                        <input 
                          type="radio" 
                          name="correctMultiImg" 
                          checked={opt.isCorrect}
                          onChange={() => setImageOptions(prev => prev.map(o => ({ ...o, isCorrect: o.id === opt.id })))}
                        /> Correct Option
                      </label>
                    </div>
                    <input 
                      type="url" 
                      placeholder="Image URL" 
                      value={opt.imageUrl || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setImageOptions(prev => prev.map(o => o.id === opt.id ? { ...o, imageUrl: val } : o));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs"
                    />
                    <input 
                      type="text" 
                      placeholder="Caption / Description" 
                      value={opt.text}
                      onChange={(e) => {
                        const val = e.target.value;
                        setImageOptions(prev => prev.map(o => o.id === opt.id ? { ...o, text: val } : o));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs"
                    />
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddImageOption} className="text-xs border-dashed text-blue-600">
                + Add Image Choice Card
              </Button>
            </div>
          )}

          {/* 7. MATCHING */}
          {selectedType.id === 'matching' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Configure Term - Answer Pairs</label>
              {matchingPairs.map((pair, idx) => (
                <div key={pair.id} className="flex gap-3 items-center">
                  <input 
                    type="text" 
                    placeholder={`Term ${idx + 1}`} 
                    value={pair.term}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMatchingPairs(prev => prev.map(p => p.id === pair.id ? { ...p, term: val } : p));
                    }}
                    className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-sm"
                  />
                  <span className="text-slate-400 font-bold">➔</span>
                  <input 
                    type="text" 
                    placeholder={`Matching Answer ${idx + 1}`} 
                    value={pair.match}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMatchingPairs(prev => prev.map(p => p.id === pair.id ? { ...p, match: val } : p));
                    }}
                    className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-sm"
                  />
                  <button 
                    type="button" 
                    onClick={() => setMatchingPairs(prev => prev.filter(p => p.id !== pair.id))}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={handleAddMatchingPair} className="text-xs text-blue-600 border-dashed">
                + Add Matching Pair
              </Button>
            </div>
          )}

          {/* 8. ESSAY / 9. SHORT ANSWER */}
          {(selectedType.id === 'essay' || selectedType.id === 'short_answer') && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ideal Reference Solution / Answer</label>
                <textarea 
                  rows={3} 
                  value={idealAnswer}
                  onChange={(e) => setIdealAnswer(e.target.value)}
                  placeholder="Provide model text response for student comparison or grading..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm"
                />
              </div>

              {selectedType.id === 'essay' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Grading Rubric Key Points</label>
                  <textarea 
                    rows={2} 
                    value={gradingRubric}
                    onChange={(e) => setGradingRubric(e.target.value)}
                    placeholder="List required clinical assertions (e.g. 1 point for identifying hypokalemia, 1 point for holding Digoxin)..."
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="caseSens" 
                    checked={caseSensitive} 
                    onChange={(e) => setCaseSensitive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="caseSens" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Exact Case-Sensitive Match
                  </label>
                </div>
              )}
            </div>
          )}

          {/* 10. FILL IN THE BLANK */}
          {selectedType.id === 'fill_blank' && (
            <div className="space-y-3">
              <p className="text-xs text-blue-800 bg-blue-50 p-2.5 rounded border border-blue-100">
                Tip: Insert <code className="font-bold bg-white px-1 rounded">[blank1]</code>, <code className="font-bold bg-white px-1 rounded">[blank2]</code> in your question stem above to denote where blanks occur.
              </p>
              {blankKeys.map((bk, i) => (
                <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-xs text-slate-600">Slot [blank{bk.blankIndex}]:</span>
                  <input 
                    type="text" 
                    value={bk.acceptedValues}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBlankKeys(prev => prev.map(b => b.blankIndex === bk.blankIndex ? { ...b, acceptedValues: val } : b));
                    }}
                    placeholder="Accepted comma-separated answers (e.g. Troponin, Troponin I)"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded p-2 text-xs"
                  />
                </div>
              ))}
            </div>
          )}

          {/* 11. HOTSPOT */}
          {selectedType.id === 'hotspot' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Diagram Image URL</label>
                <input 
                  type="url" 
                  value={hotspotImg}
                  onChange={(e) => setHotspotImg(e.target.value)}
                  placeholder="https://example.com/chest-anatomy.png"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Hotspot Description</label>
                <input 
                  type="text" 
                  value={hotspotTarget}
                  onChange={(e) => setHotspotTarget(e.target.value)}
                  placeholder="e.g. Apex of the heart / 5th intercostal space"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm"
                />
              </div>
            </div>
          )}

          {/* 12. ORDERING (NUMBERS / DRAG AND DROP) */}
          {(selectedType.id === 'order_numbers' || selectedType.id === 'order_drag') && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Enter Procedural Steps in Correct Chronological Order
              </label>
              {orderedSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <input 
                    type="text" 
                    value={step}
                    onChange={(e) => {
                      const val = e.target.value;
                      setOrderedSteps(prev => prev.map((s, i) => i === idx ? val : s));
                    }}
                    className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-sm"
                  />
                  <button 
                    type="button" 
                    onClick={() => setOrderedSteps(prev => prev.filter((_, i) => i !== idx))}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={handleAddOrderedStep} className="text-xs text-blue-600 border-dashed">
                + Add Procedure Step
              </Button>
            </div>
          )}

          {/* 14. SIEVE / BOWTIE NGN MATRIX */}
          {selectedType.id === 'sieve_bowtie' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Case Study Narrative</label>
                <textarea 
                  rows={3}
                  value={caseScenario}
                  onChange={(e) => setCaseScenario(e.target.value)}
                  placeholder="Enter patient chart notes, lab values, and vitals history..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Actions to Take */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <h5 className="font-bold text-xs text-blue-900 border-b border-slate-100 pb-1">1. Actions to Take</h5>
                  {bowtieConfig.actionsToTake.map((act, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <input 
                        type="checkbox" 
                        checked={act.isCorrect}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setBowtieConfig(prev => ({
                            ...prev,
                            actionsToTake: prev.actionsToTake.map((a, idx) => idx === i ? { ...a, isCorrect: checked } : a)
                          }));
                        }}
                      />
                      <input 
                        type="text" 
                        value={act.text}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBowtieConfig(prev => ({
                            ...prev,
                            actionsToTake: prev.actionsToTake.map((a, idx) => idx === i ? { ...a, text: val } : a)
                          }));
                        }}
                        className="w-full border border-slate-200 rounded p-1 text-xs"
                      />
                    </div>
                  ))}
                </div>

                {/* Potential Conditions */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <h5 className="font-bold text-xs text-indigo-900 border-b border-slate-100 pb-1">2. Potential Condition</h5>
                  {bowtieConfig.potentialConditions.map((cond, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <input 
                        type="radio" 
                        name="primaryCondRadio"
                        checked={cond.isCorrect}
                        onChange={() => {
                          setBowtieConfig(prev => ({
                            ...prev,
                            potentialConditions: prev.potentialConditions.map((c, idx) => ({ ...c, isCorrect: idx === i }))
                          }));
                        }}
                      />
                      <input 
                        type="text" 
                        value={cond.text}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBowtieConfig(prev => ({
                            ...prev,
                            potentialConditions: prev.potentialConditions.map((c, idx) => idx === i ? { ...c, text: val } : c)
                          }));
                        }}
                        className="w-full border border-slate-200 rounded p-1 text-xs"
                      />
                    </div>
                  ))}
                </div>

                {/* Parameters to Monitor */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <h5 className="font-bold text-xs text-emerald-900 border-b border-slate-100 pb-1">3. Parameters to Monitor</h5>
                  {bowtieConfig.parametersToMonitor.map((param, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <input 
                        type="checkbox" 
                        checked={param.isCorrect}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setBowtieConfig(prev => ({
                            ...prev,
                            parametersToMonitor: prev.parametersToMonitor.map((p, idx) => idx === i ? { ...p, isCorrect: checked } : p)
                          }));
                        }}
                      />
                      <input 
                        type="text" 
                        value={param.text}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBowtieConfig(prev => ({
                            ...prev,
                            parametersToMonitor: prev.parametersToMonitor.map((p, idx) => idx === i ? { ...p, text: val } : p)
                          }));
                        }}
                        className="w-full border border-slate-200 rounded p-1 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 15. MATRIX / TABULAR GRID NGN */}
          {selectedType.id === 'matrix_grid' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
                <div className="text-xs">
                  <span className="font-bold text-blue-900">Scoring Method:</span>
                  <select 
                    value={partialCreditRule} 
                    onChange={(e) => setPartialCreditRule(e.target.value)}
                    className="ml-2 bg-white border border-blue-200 rounded px-2 py-1 text-xs font-medium text-slate-800"
                  >
                    <option value="NGN +/- Partial Credit">NGN +/- Partial Credit Rule</option>
                    <option value="0/1 All or Nothing">0/1 All or Nothing</option>
                  </select>
                </div>
              </div>

              {/* Matrix Columns */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Matrix Column Headers
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setMatrixColumns(prev => [...prev, `Column ${prev.length + 1}`])}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    + Add Column Header
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {matrixColumns.map((col, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
                      <input 
                        type="text" 
                        value={col}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMatrixColumns(prev => prev.map((c, i) => i === idx ? val : c));
                        }}
                        className="bg-transparent font-bold text-slate-800 outline-none w-28"
                      />
                      {matrixColumns.length > 2 && (
                        <button 
                          type="button" 
                          onClick={() => setMatrixColumns(prev => prev.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Matrix Rows & Correct Answers Grid */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Clinical Statements & Correct Column Answer
                </label>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                        <th className="p-3">Clinical Action / Finding Statement</th>
                        {matrixColumns.map((col, cIdx) => (
                          <th key={cIdx} className="p-3 text-center border-l border-slate-200">{col}</th>
                        ))}
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {matrixRows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/50">
                          <td className="p-3">
                            <input 
                              type="text" 
                              value={row.statement}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMatrixRows(prev => prev.map(r => r.id === row.id ? { ...r, statement: val } : r));
                              }}
                              placeholder="Clinical statement or assessment item..."
                              className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs outline-none focus:border-blue-500"
                            />
                          </td>
                          {matrixColumns.map((_, cIdx) => (
                            <td key={cIdx} className="p-3 text-center border-l border-slate-200">
                              <input 
                                type="radio" 
                                name={`matrix_row_${row.id}`} 
                                checked={row.correctColumnIndex === cIdx}
                                onChange={() => {
                                  setMatrixRows(prev => prev.map(r => r.id === row.id ? { ...r, correctColumnIndex: cIdx } : r));
                                }}
                                className="w-4 h-4 text-blue-600 cursor-pointer"
                              />
                            </td>
                          ))}
                          <td className="p-3 text-right">
                            <button 
                              type="button" 
                              onClick={() => setMatrixRows(prev => prev.filter(r => r.id !== row.id))}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setMatrixRows(prev => [...prev, { id: Date.now().toString(), statement: '', correctColumnIndex: 0 }])}
                  className="text-xs text-blue-600 border-dashed"
                >
                  + Add Matrix Statement Row
                </Button>
              </div>
            </div>
          )}

          {/* 16. CASE STUDY EXHIBIT NGN */}
          {selectedType.id === 'case_exhibit' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <div>
                  <h5 className="font-bold text-xs uppercase tracking-wider text-slate-700">Clinical Case Exhibit Tabs</h5>
                  <p className="text-xs text-slate-500">Provide medical chart tabs for student reference during scenario analysis</p>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setExhibitTabs(prev => [...prev, { id: Date.now().toString(), title: 'New Chart Tab', content: '' }])}
                  className="text-xs text-blue-600 border-dashed"
                >
                  + Add Chart Tab
                </Button>
              </div>

              <div className="space-y-3">
                {exhibitTabs.map((tab, idx) => (
                  <div key={tab.id} className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs font-bold text-slate-400 shrink-0">Tab {idx + 1}:</span>
                        <input 
                          type="text" 
                          value={tab.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setExhibitTabs(prev => prev.map(t => t.id === tab.id ? { ...t, title: val } : t));
                          }}
                          className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 flex-1 max-w-xs"
                        />
                      </div>
                      {exhibitTabs.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => setExhibitTabs(prev => prev.filter(t => t.id !== tab.id))}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <textarea 
                      rows={3} 
                      value={tab.content}
                      onChange={(e) => {
                        const val = e.target.value;
                        setExhibitTabs(prev => prev.map(t => t.id === tab.id ? { ...t, content: val } : t));
                      }}
                      placeholder={`Enter chart details for ${tab.title}...`}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CUSTOM QUESTION TYPE PARAMETERS */}
          {selectedType.isCustom && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Custom Answer Format Instructions / Details</label>
              <textarea 
                rows={3} 
                value={customParamsText}
                onChange={(e) => setCustomParamsText(e.target.value)}
                placeholder="Describe parameter expectations, answer rules, or scoring guidelines for this custom question type..."
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm"
              />
            </div>
          )}
        </div>

        {/* Global Metadata: Rationale, Difficulty, Citation & Tags */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Detailed Clinical Rationale / Answer Explanation <span className="text-xs font-normal text-slate-400">(Required for student remediation)</span>
            </label>
            <textarea
              rows={3}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Explain why the correct answer is right, and why distractors are incorrect..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Specific Correct & Wrong Explanations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-emerald-800 mb-1">
                Correct Answer Feedback Message <span className="text-xs font-normal text-slate-400">(Shown when answered correctly)</span>
              </label>
              <textarea
                rows={2}
                value={correctExplanation}
                onChange={(e) => setCorrectExplanation(e.target.value)}
                placeholder="e.g. Excellent clinical reasoning! Intravenous fluid resuscitation restores effective circulating volume..."
                className="w-full bg-emerald-50/40 border border-emerald-200 rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-rose-800 mb-1">
                Wrong Answer Feedback Message <span className="text-xs font-normal text-slate-400">(Shown when answered incorrectly)</span>
              </label>
              <textarea
                rows={2}
                value={wrongExplanation}
                onChange={(e) => setWrongExplanation(e.target.value)}
                placeholder="e.g. Review hypovolemic shock protocols. Placing the patient in Trendelenburg does not improve hemodynamics..."
                className="w-full bg-rose-50/40 border border-rose-200 rounded-lg p-2.5 text-xs outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Difficulty Level</label>
              <select 
                value={difficulty} 
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-medium text-slate-800"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Textbook Citation / Reference</label>
              <input 
                type="text" 
                placeholder="e.g. Saunders NCLEX-RN 9th Ed, p. 412"
                value={citation}
                onChange={(e) => setCitation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tags (Comma-separated)</label>
              <input 
                type="text" 
                placeholder="cardiology, med-math, safety"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Feedback Banners */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2 text-sm font-semibold">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <Button 
            type="submit" 
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-lg gap-2 shadow-sm"
          >
            {isSaving ? (
              <>Saving Question to Firestore...</>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Question to Bank
              </>
            )}
          </Button>
        </div>
      </form>

      {/* MODALS FOR ADDING CUSTOM MODE, UNIT, QUESTION TYPE */}
      {/* 1. Modal Add Exam Mode */}
      {showAddExamModeModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900">Add New Exam Mode</h3>
              <button onClick={() => setShowAddExamModeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">Enter the name of the new exam mode or licensing board test (e.g. KNA Midwifery Exam, DHA Nursing Exam).</p>
            <input 
              type="text" 
              placeholder="Exam Mode Title" 
              value={newExamModeInput}
              onChange={(e) => setNewExamModeInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAddExamModeModal(false)}>Cancel</Button>
              <Button onClick={handleCreateExamMode} className="bg-blue-600 text-white">Add Exam Mode</Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Add Unit / Domain */}
      {showAddUnitModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900">Add New Unit / Domain</h3>
              <button onClick={() => setShowAddUnitModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">Enter the title of the unit, clinical domain, or subject module.</p>
            <input 
              type="text" 
              placeholder="e.g. Critical Care Hemodynamics, Oncology Nursing" 
              value={newUnitInput}
              onChange={(e) => setNewUnitInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAddUnitModal(false)}>Cancel</Button>
              <Button onClick={handleCreateUnit} className="bg-blue-600 text-white">Add Unit</Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Add Custom Question Type */}
      {showAddTypeModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900">Add Custom Question Type</h3>
              <button onClick={() => setShowAddTypeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">Define a unique question interaction or answer evaluation mode.</p>
            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="Question Type Name (e.g. Video Simulation, Sound Auscultation)" 
                value={newTypeLabel}
                onChange={(e) => setNewTypeLabel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
              />
              <textarea 
                rows={2} 
                placeholder="Brief description of how students respond to this question type..." 
                value={newTypeDesc}
                onChange={(e) => setNewTypeDesc(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAddTypeModal(false)}>Cancel</Button>
              <Button onClick={handleCreateType} className="bg-blue-600 text-white">Create Question Type</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
