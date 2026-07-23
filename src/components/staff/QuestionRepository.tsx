import React, { useState, useEffect } from 'react';
import { Search, Filter, Trash2, Tag, BookOpen, Layers, RefreshCw, FileText, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { QuestionData } from '@/types';

export default function QuestionRepository({ refreshTrigger }: { refreshTrigger?: number }) {
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterExamMode, setFilterExamMode] = useState<string>('All');
  const [filterUnit, setFilterUnit] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'questions'));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as QuestionData[];
      setQuestions(list);
    } catch (err) {
      console.error('Error fetching question repository:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [refreshTrigger]);

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await deleteDoc(doc(db, 'questions', id));
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (err) {
      console.error('Failed to delete question:', err);
      alert('Failed to delete question from database.');
    }
  };

  // Unique list of options for filters
  const examModes = ['All', ...Array.from(new Set(questions.map(q => q.examMode).filter(Boolean)))];
  const units = ['All', ...Array.from(new Set(questions.map(q => q.unitDomain).filter(Boolean)))];
  const questionTypes = ['All', ...Array.from(new Set(questions.map(q => q.questionTypeLabel).filter(Boolean)))];

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = searchTerm === '' || 
      q.questionStem?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.rationale?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMode = filterExamMode === 'All' || q.examMode === filterExamMode;
    const matchesUnit = filterUnit === 'All' || q.unitDomain === filterUnit;
    const matchesType = filterType === 'All' || q.questionTypeLabel === filterType;

    return matchesSearch && matchesMode && matchesUnit && matchesType;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header & Controls */}
      <div className="p-6 border-b border-slate-200 space-y-4 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Lecturer Question Bank ({filteredQuestions.length})</h3>
            <p className="text-slate-500 text-xs">Search, filter, and inspect published questions across exam modes</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchQuestions} 
            disabled={loading}
            className="text-xs gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Bank
          </Button>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input 
              type="text" 
              placeholder="Search stem or rationale..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <select 
              value={filterExamMode} 
              onChange={(e) => setFilterExamMode(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700"
            >
              <option value="All">All Exam Modes</option>
              {examModes.filter(m => m !== 'All').map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <select 
              value={filterUnit} 
              onChange={(e) => setFilterUnit(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700"
            >
              <option value="All">All Units / Domains</option>
              {units.filter(u => u !== 'All').map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700"
            >
              <option value="All">All Question Types</option>
              {questionTypes.filter(t => t !== 'All').map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" /> Loading questions...
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="p-12 text-center text-slate-500 space-y-2">
          <FileText className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-700">No questions found</p>
          <p className="text-xs">Try adjusting your filter parameters or create a new question above.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-[700px] overflow-y-auto">
          {filteredQuestions.map((q, idx) => {
            const isExpanded = expandedId === q.id;
            return (
              <div key={q.id || idx} className="p-5 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      {q.examMode || 'NCLEX'}
                    </span>
                    <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      {q.unitDomain || 'General'}
                    </span>
                    <span className="bg-indigo-50 text-indigo-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-100">
                      {q.questionTypeLabel || 'Question'}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      q.difficulty === 'Hard' ? 'bg-rose-100 text-rose-800' :
                      q.difficulty === 'Medium' ? 'bg-amber-100 text-amber-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {q.difficulty || 'Medium'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setExpandedId(isExpanded ? null : (q.id || null))}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50"
                    >
                      {isExpanded ? <>Hide Details <ChevronUp className="w-3.5 h-3.5" /></> : <>Inspect Details <ChevronDown className="w-3.5 h-3.5" /></>}
                    </button>
                    {q.id && (
                      <button 
                        onClick={() => handleDeleteQuestion(q.id!)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="font-semibold text-slate-900 text-sm leading-relaxed">
                  <span className="text-slate-400 font-bold mr-2">Q{idx + 1}.</span>
                  {q.questionStem}
                </p>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 text-xs bg-slate-50/80 p-4 rounded-xl">
                    {/* Display Options if present */}
                    {q.options && q.options.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="font-bold text-slate-700">Answer Choices & Option Explanations:</span>
                        <div className="grid grid-cols-1 gap-2 mt-1">
                          {q.options.map((opt, i) => (
                            <div 
                              key={i}
                              className={`p-2.5 rounded-lg border space-y-1 ${
                                opt.isCorrect ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold' : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="mr-1.5">{String.fromCharCode(65 + i)}.</span>
                                  {opt.text}
                                  {opt.isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline ml-2" />}
                                </div>
                                {opt.isCorrect && <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold">CORRECT</span>}
                              </div>
                              {opt.explanation && (
                                <p className="text-[11px] font-normal text-slate-600 italic pl-5 border-l-2 border-slate-300">
                                  {opt.explanation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matrix Grid Preview */}
                    {q.matrixColumns && q.matrixRows && (
                      <div className="space-y-1.5 bg-white p-3 rounded-lg border border-slate-200">
                        <span className="font-bold text-slate-800">Tabular Matrix Grid Answer Key:</span>
                        <div className="overflow-x-auto mt-1">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-200 font-bold">
                                <th className="p-2">Clinical Action / Finding</th>
                                {q.matrixColumns.map((col, cIdx) => (
                                  <th key={cIdx} className="p-2 text-center border-l border-slate-200">{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {q.matrixRows.map((row) => (
                                <tr key={row.id}>
                                  <td className="p-2 font-medium">{row.statement}</td>
                                  {q.matrixColumns!.map((_, cIdx) => (
                                    <td key={cIdx} className={`p-2 text-center border-l border-slate-200 ${row.correctColumnIndex === cIdx ? 'bg-emerald-100 font-bold text-emerald-900' : ''}`}>
                                      {row.correctColumnIndex === cIdx ? '✓ Correct' : '-'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Case Exhibit Preview */}
                    {q.exhibitTabs && q.exhibitTabs.length > 0 && (
                      <div className="space-y-1.5 bg-white p-3 rounded-lg border border-slate-200">
                        <span className="font-bold text-slate-800">Case Exhibit Chart Tabs:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                          {q.exhibitTabs.map((tab) => (
                            <div key={tab.id} className="p-2 bg-slate-50 border border-slate-200 rounded">
                              <span className="font-bold text-slate-800 text-[11px] block border-b border-slate-200 pb-1 mb-1">{tab.title}</span>
                              <p className="text-[10px] text-slate-600 whitespace-pre-wrap">{tab.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bowtie Preview */}
                    {q.bowtieConfig && (
                      <div className="space-y-1.5 bg-white p-3 rounded-lg border border-slate-200">
                        <span className="font-bold text-slate-800">NextGen Bowtie Matrix:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1 text-[11px]">
                          <div className="p-2 bg-blue-50/50 border border-blue-200 rounded">
                            <span className="font-bold text-blue-900 block mb-1">Actions to Take:</span>
                            {q.bowtieConfig.actionsToTake.map((a, i) => (
                              <div key={i} className={a.isCorrect ? 'font-bold text-emerald-800' : 'text-slate-500'}>
                                {a.isCorrect ? '✓ ' : '• '}{a.text}
                              </div>
                            ))}
                          </div>
                          <div className="p-2 bg-indigo-50/50 border border-indigo-200 rounded">
                            <span className="font-bold text-indigo-900 block mb-1">Potential Condition:</span>
                            {q.bowtieConfig.potentialConditions.map((c, i) => (
                              <div key={i} className={c.isCorrect ? 'font-bold text-emerald-800' : 'text-slate-500'}>
                                {c.isCorrect ? '✓ ' : '• '}{c.text}
                              </div>
                            ))}
                          </div>
                          <div className="p-2 bg-emerald-50/50 border border-emerald-200 rounded">
                            <span className="font-bold text-emerald-900 block mb-1">Parameters to Monitor:</span>
                            {q.bowtieConfig.parametersToMonitor.map((p, i) => (
                              <div key={i} className={p.isCorrect ? 'font-bold text-emerald-800' : 'text-slate-500'}>
                                {p.isCorrect ? '✓ ' : '• '}{p.text}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Numeric info */}
                    {q.numericValue !== undefined && (
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono">
                        <span className="font-bold text-slate-700">Numeric Answer: </span>
                        {q.numericValue} {q.unitOfMeasure} (Tolerance: ±{q.tolerance})
                      </div>
                    )}

                    {/* True/False */}
                    {q.trueFalseAnswer !== undefined && (
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-bold">
                        Correct Answer: {q.trueFalseAnswer ? 'TRUE' : 'FALSE'}
                      </div>
                    )}

                    {/* Rationale & Feedback */}
                    {q.rationale && (
                      <div className="bg-blue-50/80 border border-blue-200 p-3 rounded-lg text-blue-950">
                        <span className="font-bold text-blue-900">Clinical Rationale: </span>
                        {q.rationale}
                      </div>
                    )}

                    {q.correctExplanation && (
                      <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-emerald-950 text-[11px]">
                        <span className="font-bold text-emerald-900">Correct Answer Message: </span>
                        {q.correctExplanation}
                      </div>
                    )}

                    {q.wrongExplanation && (
                      <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-lg text-rose-950 text-[11px]">
                        <span className="font-bold text-rose-900">Wrong Answer Message: </span>
                        {q.wrongExplanation}
                      </div>
                    )}

                    {/* Citation */}
                    {q.citation && (
                      <div className="text-slate-500 italic">
                        <BookOpen className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                        Reference: {q.citation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
