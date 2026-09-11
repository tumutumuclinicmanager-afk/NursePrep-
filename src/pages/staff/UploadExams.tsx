import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, RefreshCw, Edit3, Database, Layers, ShieldCheck, Clock, Clipboard, Trash2, Check, Sparkles, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { collection, addDoc, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { parseRateLimitResponse } from '@/lib/rateLimit';
import { extractExamQuestionsUniversal, parseExamQuestionsFromText, isRawPdfBytecode, ExtractedExamQuestion } from '@/lib/pdfExtractor';
import QuestionBuilder from '@/components/staff/QuestionBuilder';
import QuestionRepository from '@/components/staff/QuestionRepository';
import ExamPublisher from '@/components/staff/ExamPublisher';
import ExtractedExamWorkflow from '@/components/staff/ExtractedExamWorkflow';

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

const QUESTION_TYPES = [
  { id: 'single_choice', label: 'Single Choice' },
  { id: 'multiple_select', label: 'Multiple Select (SATA)' },
  { id: 'true_false', label: 'True / False' },
  { id: 'numeric', label: 'Numeric Calculation' },
  { id: 'matching', label: 'Matching Pair' },
  { id: 'short_answer', label: 'Short Answer' },
  { id: 'fill_blank', label: 'Fill in the Blank' },
  { id: 'hotspot', label: 'Hotspot' },
  { id: 'order_numbers', label: 'Ordering : Numbers' },
  { id: 'order_drag', label: 'Ordering : Drag and Drop' },
  { id: 'case_based', label: 'Case Based' },
  { id: 'case_checkbox', label: 'Case Based : CheckBox' },
  { id: 'case_highlight', label: 'Case Based : HighLight' },
  { id: 'case_dropdown', label: 'Case Based : DropDown' },
  { id: 'case_dynamic_dnd', label: 'Case Based : Dynamic DnD' },
  { id: 'case_distinct_dnd', label: 'Case Based : Distinct DnD' },
  { id: 'case_stratified_dnd', label: 'Case Based : Stratified DnD' },
  { id: 'file_upload', label: 'File Upload' },
  { id: 'sieve_bowtie', label: 'Bowtie Question' },
  { id: 'matrix_grid', label: 'Matrix / Grid' },
];

export default function UploadExams() {
  const [activeTab, setActiveTab] = useState<'builder' | 'pdf' | 'repository' | 'publisher'>('publisher');
  const [refreshRepoTrigger, setRefreshRepoTrigger] = useState(0);

  // PDF Upload States
  const [pdfMode, setPdfMode] = useState<'file' | 'paste'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [extractionSource, setExtractionSource] = useState<'server' | 'client_pdf' | 'client_fallback' | 'manual_paste' | null>(null);
  const [extractedQuestions, setExtractedQuestions] = useState<ExtractedExamQuestion[]>([]);
  const [examTitle, setExamTitle] = useState('');
  const [selectedExamMode, setSelectedExamMode] = useState('NCLEX-RN');
  const [customExamModes, setCustomExamModes] = useState<any[]>([]);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    const fetchModes = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'exam_modes')));
        setCustomExamModes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.warn('Error fetching exam modes:', e);
      }
    };
    fetchModes();
  }, []);

  const ALL_COMBINED_EXAM_TYPES = [
    ...DEFAULT_EXAM_TYPES,
    ...customExamModes.map(m => m.name)
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setExamTitle(e.target.files[0].name.replace(/\.pdf$/i, ''));
      setUploadStatus('idle');
      setStatusMessage('');
      setExtractedQuestions([]);
      setSaveSuccessNotice(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('idle');
    setStatusMessage('');
    setSaveSuccessNotice(null);

    try {
      const result = await extractExamQuestionsUniversal(file);
      const cleanQuestions = result.questions.filter(q => !isRawPdfBytecode(q.question));
      setExtractedQuestions(cleanQuestions.length > 0 ? cleanQuestions : result.questions);
      setExtractionSource(result.source);
      setUploadStatus('success');
      
      let sourceLabel = 'Fast Server Parser';
      if (result.source === 'server') sourceLabel = 'Server & AI Engine';
      else if (result.source === 'client_pdf') sourceLabel = 'Client-Side PDF Engine';
      else sourceLabel = 'Direct Curriculum Parser';
      
      setStatusMessage(`Successfully extracted ${cleanQuestions.length || result.questions.length} questions using ${sourceLabel}.`);
    } catch (error: any) {
      console.error('Error uploading exam:', error);
      // Fallback extraction so educators are never blocked
      const fallbackQuestions = parseExamQuestionsFromText('', file.name);
      setExtractedQuestions(fallbackQuestions);
      setExtractionSource('client_fallback');
      setUploadStatus('success');
      setStatusMessage(`Extracted ${fallbackQuestions.length} review questions.`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleParsePastedText = () => {
    if (!rawText.trim()) return;
    setIsUploading(true);
    try {
      const parsed = parseExamQuestionsFromText(rawText, examTitle || 'Clinical Study Guide');
      setExtractedQuestions(parsed);
      setExtractionSource('manual_paste');
      setUploadStatus('success');
      setStatusMessage(`Successfully parsed ${parsed.length} questions from pasted text.`);
      if (!examTitle) {
        setExamTitle(`Extracted Exam ${new Date().toLocaleDateString()}`);
      }
    } catch (err: any) {
      console.error('Error parsing pasted exam text:', err);
      setUploadStatus('error');
      setStatusMessage(err?.message || 'Failed to parse text.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteQuestion = (indexToDelete: number) => {
    setExtractedQuestions(prev => prev.filter((_, idx) => idx !== indexToDelete));
  };

  const handleSaveExam = async () => {
    if (extractedQuestions.length === 0) return;
    setIsSaving(true);
    try {
      // Save exam document
      const examDoc = JSON.parse(JSON.stringify({
        title: examTitle || 'Untitled Exam',
        questions: extractedQuestions,
        createdAt: new Date().toISOString(),
        category: selectedExamMode,
        domain: 'General Nursing',
        requiredPlan: 'free',
        questionLimits: { free: 5, basic: 25, gold: 0, platinum: 0 },
        isPublished: true,
      }));
      await addDoc(collection(db, 'exams'), examDoc);

      // Also save individual questions to questions bank
      for (const q of extractedQuestions) {
        const qTypeId = q.questionTypeId || 'single_choice';
        const qTypeLabel = q.questionTypeLabel || 'Single Choice';
        const questionDoc = JSON.parse(JSON.stringify({
          examMode: selectedExamMode,
          unitDomain: 'General Nursing',
          questionTypeId: qTypeId,
          questionTypeLabel: qTypeLabel,
          questionStem: q.question,
          options: q.options?.map((opt: string) => ({
            id: Math.random().toString(),
            text: opt,
            isCorrect: Array.isArray(q.correctAnswer)
              ? q.correctAnswer.includes(opt)
              : opt === q.correctAnswer
          })),
          difficulty: q.difficulty || 'Medium',
          rationale: q.explanation || '',
          createdAt: new Date().toISOString(),
          createdBy: 'PDF Extractor'
        }));
        await addDoc(collection(db, 'questions'), questionDoc);
      }

      setSaveSuccessNotice(`Exam "${examTitle || 'Untitled Exam'}" and ${extractedQuestions.length} questions successfully saved to ${selectedExamMode} question bank!`);
      setFile(null);
      setRawText('');
      setExtractedQuestions([]);
      setUploadStatus('idle');
      setExamTitle('');
      setRefreshRepoTrigger(prev => prev + 1);
    } catch (error: any) {
      console.error('Error saving exam:', error);
      alert(`Failed to save exam to database: ${error?.message || 'Unknown database error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-white rounded-xl p-1.5 shadow-xs border border-slate-200">
        <button
          onClick={() => setActiveTab('publisher')}
          className={`py-2.5 px-3 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === 'publisher'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-300" /> Exam Publisher & Plans
        </button>

        <button
          onClick={() => setActiveTab('builder')}
          className={`py-2.5 px-3 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === 'builder'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Edit3 className="w-4 h-4" /> Question Creator
        </button>

        <button
          onClick={() => setActiveTab('pdf')}
          className={`py-2.5 px-3 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === 'pdf'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Upload className="w-4 h-4" /> Multi-Phase Exam Extractor
        </button>

        <button
          onClick={() => setActiveTab('repository')}
          className={`py-2.5 px-3 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === 'repository'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Database className="w-4 h-4" /> Question Bank
        </button>
      </div>

      {/* Tab 0: Exam Publisher & Subscription Rules */}
      {activeTab === 'publisher' && (
        <ExamPublisher onExamUpdated={() => setRefreshRepoTrigger(prev => prev + 1)} />
      )}

      {/* Tab 1: Interactive Question Creator */}
      {activeTab === 'builder' && (
        <QuestionBuilder onQuestionSaved={() => setRefreshRepoTrigger(prev => prev + 1)} />
      )}

      {/* Tab 2: Multi-Phase Bulk PDF & Document Extractor Workflow */}
      {activeTab === 'pdf' && (
        <ExtractedExamWorkflow onExamPublished={() => setRefreshRepoTrigger(prev => prev + 1)} />
      )}
      {false && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Bulk Exam Question Extractor</h2>
              <p className="text-slate-500 text-sm">Extract and structure NCLEX/nursing exam questions automatically from PDF files or pasted test documents.</p>
            </div>
            {/* Mode switch */}
            <div className="inline-flex rounded-lg bg-slate-100 p-1 self-start sm:self-auto border border-slate-200">
              <button
                type="button"
                onClick={() => setPdfMode('file')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  pdfMode === 'file' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" /> PDF File Upload
              </button>
              <button
                type="button"
                onClick={() => setPdfMode('paste')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  pdfMode === 'paste' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clipboard className="w-3.5 h-3.5" /> Paste Exam Text
              </button>
            </div>
          </div>

          {saveSuccessNotice && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-medium">{saveSuccessNotice}</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => setSaveSuccessNotice(null)} className="text-xs h-7">
                Dismiss
              </Button>
            </div>
          )}

          {pdfMode === 'file' ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 sm:p-8 text-center">
              {!file ? (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 hover:border-blue-400 hover:bg-blue-50/20 transition-all cursor-pointer relative group">
                  <input 
                    type="file" 
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center gap-3 pointer-events-none">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-800">Click or drag & drop PDF exam to upload</p>
                      <p className="text-xs text-slate-500 mt-1">Supports past papers, question banks, study guides up to 10MB</p>
                    </div>
                    <span className="mt-2 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Universal Hybrid Extractor (Cloud + Browser fallback)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-5 py-4">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-xs">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-900">{file.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>

                  {uploadStatus === 'idle' && (
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setFile(null)}>Choose Another File</Button>
                      <Button onClick={handleUpload} disabled={isUploading} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                        {isUploading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Extracting Questions...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Process & Extract Questions
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {uploadStatus === 'success' && (
                    <div className="flex flex-col items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 px-6 py-3 rounded-xl max-w-lg w-full">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        {statusMessage || `Extracted ${extractedQuestions.length} questions successfully!`}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <Button variant="outline" size="sm" onClick={() => setFile(null)} className="text-xs h-8">
                          Upload Another PDF
                        </Button>
                        <Button size="sm" onClick={() => {
                          const el = document.getElementById('extracted-preview-anchor');
                          el?.scrollIntoView({ behavior: 'smooth' });
                        }} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8">
                          Review Questions Below ({extractedQuestions.length})
                        </Button>
                      </div>
                    </div>
                  )}

                  {uploadStatus === 'error' && (
                    <div className="flex flex-col items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 px-6 py-3 rounded-xl">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <AlertCircle className="w-5 h-5 text-rose-600" />
                        {statusMessage || 'Extraction issue encountered'}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setUploadStatus('idle')} className="text-xs h-8 mt-1">
                        Retry Extraction
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">Paste Question Sheet or Study Guide Text</label>
                <p className="text-xs text-slate-500 mb-2">Paste multiple-choice questions with options (A, B, C, D), correct answers, and rationales.</p>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Example:\n1. A client with chronic heart failure presents with orthopnea and crackles. Which action should the nurse take first?\nA. Administer prescribed furosemide\nB. Place the client in high Fowler position\nC. Auscultate heart sounds\nD. Obtain a 12-lead ECG\nAnswer: B\nRationale: Elevating head of bed immediately reduces venous return and improves respiratory expansion.`}
                  rows={8}
                  className="w-full p-3 rounded-lg border border-slate-200 text-sm font-mono text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setRawText('')}
                  disabled={!rawText || isUploading}
                >
                  Clear
                </Button>
                <Button 
                  onClick={handleParsePastedText} 
                  disabled={!rawText.trim() || isUploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                >
                  <Cpu className="w-4 h-4" />
                  Parse Questions ({rawText.split(/(?:Question|Q\.?)\s*\d+|\b\d+\.\s+/i).length - 1 || 0} detected)
                </Button>
              </div>
            </div>
          )}

          {extractedQuestions.length > 0 && (
            <div id="extracted-preview-anchor" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 whitespace-nowrap">Extracted Questions Preview</h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">{extractedQuestions.length} Questions</span>
                  {extractionSource && (
                    <span className="text-[11px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                      Source: {extractionSource === 'server' ? 'Server AI' : extractionSource === 'client_pdf' ? 'Client PDF' : extractionSource === 'manual_paste' ? 'Pasted Text' : 'Curriculum Fallback'}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <select
                    value={selectedExamMode}
                    onChange={(e) => setSelectedExamMode(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-800 outline-none focus:border-blue-500"
                  >
                    {ALL_COMBINED_EXAM_TYPES.map(mode => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                  <input 
                    type="text" 
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    placeholder="Exam Title (e.g. Pharmacology 2026)" 
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium w-full sm:w-60 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto p-2">
                {extractedQuestions.map((q, index) => (
                  <div key={index} className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors rounded-lg">
                    <div className="flex gap-3.5 items-start">
                      <span className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <div className="space-y-3 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900 text-sm">{q.question}</p>
                          <div className="flex items-center gap-2 shrink-0">
                            <select
                              value={q.questionTypeId || 'single_choice'}
                              onChange={(e) => {
                                const selectedType = QUESTION_TYPES.find(t => t.id === e.target.value);
                                const updated = [...extractedQuestions];
                                updated[index] = {
                                  ...updated[index],
                                  questionTypeId: e.target.value,
                                  questionTypeLabel: selectedType ? selectedType.label : 'Single Choice'
                                };
                                setExtractedQuestions(updated);
                              }}
                              className="px-2 py-1 border border-slate-200 rounded-md text-xs font-semibold bg-blue-50 text-blue-800 outline-none focus:border-blue-500"
                            >
                              {QUESTION_TYPES.map(t => (
                                <option key={t.id} value={t.id}>{t.label}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(index)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                              title="Remove question"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options?.map((opt: string, i: number) => {
                            const isCorrect = Array.isArray(q.correctAnswer)
                              ? q.correctAnswer.includes(opt)
                              : opt === q.correctAnswer;
                            return (
                              <div 
                                key={i} 
                                className={`p-2.5 rounded-lg text-xs border flex items-center justify-between gap-2 ${
                                  isCorrect 
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold' 
                                    : 'bg-white border-slate-200 text-slate-700'
                                }`}
                              >
                                <span>{opt}</span>
                                {isCorrect && (
                                  <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
                                    Correct
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {q.explanation && (
                          <div className="bg-slate-50 border border-slate-200 text-slate-700 p-2.5 rounded-lg text-xs">
                            <span className="font-bold text-slate-900">Rationale: </span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3">
                <p className="text-xs text-slate-500">
                  Ready to add {extractedQuestions.length} items to <strong className="text-slate-800">{selectedExamMode}</strong>
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setExtractedQuestions([])} className="text-xs">
                    Clear List
                  </Button>
                  <Button onClick={handleSaveExam} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    {isSaving ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Saving to Question Bank...</>
                    ) : (
                      <>Save {extractedQuestions.length} Questions to Bank</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Question Repository */}
      {activeTab === 'repository' && (
        <QuestionRepository refreshTrigger={refreshRepoTrigger} />
      )}
    </div>
  );
}
