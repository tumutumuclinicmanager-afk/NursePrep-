import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Brain, FileText, Upload, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ExamMixer() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'success'>('idle');
  const [extractedQuestions, setExtractedQuestions] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setStatus('uploading');
    
    const formData = new FormData();
    formData.append('pdf', file);
    
    try {
      const response = await fetch('/api/upload-exam', {
        method: 'POST',
        body: formData
      });
      
      setStatus('processing');
      const data = await response.json();
      
      if (data.questions) {
        setExtractedQuestions(data.questions);
        setStatus('success');
      }
    } catch (error) {
      console.error(error);
      setStatus('idle');
      alert("Failed to extract questions");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Exam Mixer</h1>
          <p className="text-slate-500 mt-1">Upload PDF exams and let the system extract and remix questions.</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Create Mixed Exam
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Upload PDF Exam</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700 mb-1">Click to upload or drag & drop</p>
              <p className="text-xs text-slate-500 mb-4">PDF, DOCX up to 10MB</p>
              <Input type="file" accept=".pdf" className="hidden" id="file-upload" onChange={handleFileChange} />
              <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none h-8 px-3 text-xs bg-slate-100 hover:bg-slate-200 text-slate-900">
                Select File
              </label>
            </div>
            {file && (
              <div className="flex items-center gap-3 p-3 bg-primary-50 text-primary-900 rounded-lg text-sm">
                <FileText className="w-4 h-4 text-primary-500" />
                <span className="flex-1 truncate">{file.name}</span>
              </div>
            )}
            
            <Button 
              className="w-full gap-2" 
              onClick={handleUpload} 
              disabled={!file || status === 'uploading' || status === 'processing'}
            >
              {status === 'processing' ? 'Extracting...' : 'Extract Questions'}
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Extracted Questions Bank</CardTitle>
            <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-xs font-semibold">
              {extractedQuestions.length} Questions
            </span>
          </CardHeader>
          <CardContent>
            {extractedQuestions.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p>Upload a document to extract questions automatically.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {extractedQuestions.map((q, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-primary-600 bg-primary-100 px-2 py-0.5 rounded">Q{idx + 1}</span>
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{q.difficulty || 'Medium'}</span>
                    </div>
                    <p className="font-medium text-slate-900 mb-3 text-sm">{q.question}</p>
                    <div className="space-y-1.5 mb-3">
                      {q.options?.map((opt: string, oIdx: number) => (
                        <div key={oIdx} className={`text-sm px-3 py-2 rounded-lg border ${opt === q.correctAnswer ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-medium' : 'bg-white border-slate-200 text-slate-600'}`}>
                          {opt}
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-slate-500 bg-white p-3 rounded-lg border border-slate-100">
                      <span className="font-semibold block mb-1">Explanation:</span>
                      {q.explanation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
