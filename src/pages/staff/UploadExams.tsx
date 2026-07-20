import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function UploadExams() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [extractedQuestions, setExtractedQuestions] = useState<any[]>([]);
  const [examTitle, setExamTitle] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setExamTitle(e.target.files[0].name.replace('.pdf', ''));
      setUploadStatus('idle');
      setExtractedQuestions([]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('idle');

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await fetch('/api/upload-exam', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setExtractedQuestions(data.questions || []);
      setUploadStatus('success');
    } catch (error) {
      console.error('Error uploading exam:', error);
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveExam = async () => {
    if (extractedQuestions.length === 0) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'exams'), {
        title: examTitle || 'Untitled Exam',
        questions: extractedQuestions,
        createdAt: new Date().toISOString(),
        category: 'Custom Upload',
      });
      alert('Exam saved to bank successfully!');
      setFile(null);
      setExtractedQuestions([]);
      setUploadStatus('idle');
      setExamTitle('');
    } catch (error) {
      console.error('Error saving exam:', error);
      alert('Failed to save exam to database.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Upload Exam & Answer Key</h2>
        <p className="text-slate-500 text-sm">Upload a PDF containing exam questions (and optionally answers). The system will automatically extract and format them.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-10 text-center">
        {!file ? (
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 hover:bg-slate-50 transition-colors cursor-pointer relative">
            <input 
              type="file" 
              accept="application/pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center gap-4 pointer-events-none">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-700">Click or drag PDF to upload</p>
                <p className="text-sm text-slate-500 mt-1">Supports standard PDF formats up to 10MB</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
              <FileText className="w-10 h-10" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{file.name}</p>
              <p className="text-sm text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>

            {uploadStatus === 'idle' && (
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setFile(null)}>Cancel</Button>
                <Button onClick={handleUpload} disabled={isUploading} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Processing Extraction...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Process Exam
                    </>
                  )}
                </Button>
              </div>
            )}

            {uploadStatus === 'success' && (
              <div className="flex flex-col items-center gap-2 text-emerald-600 bg-emerald-50 px-6 py-3 rounded-lg">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle className="w-5 h-5" />
                  Successfully processed {extractedQuestions.length} questions
                </div>
                <Button variant="link" onClick={() => setFile(null)} className="text-emerald-700 text-xs">
                  Upload another file
                </Button>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="flex flex-col items-center gap-2 text-rose-600 bg-rose-50 px-6 py-3 rounded-lg">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-5 h-5" />
                  Failed to process PDF
                </div>
                <Button variant="link" onClick={() => setUploadStatus('idle')} className="text-rose-700 text-xs">
                  Try Again
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {extractedQuestions.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center gap-4">
            <h3 className="font-bold text-slate-800 whitespace-nowrap">Extracted Questions Preview</h3>
            <input 
              type="text" 
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              placeholder="Exam Title" 
              className="px-3 py-1.5 border border-slate-200 rounded text-sm w-full max-w-xs outline-none focus:border-blue-500"
            />
          </div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {extractedQuestions.map((q, index) => (
              <div key={index} className="p-6">
                <div className="flex gap-4 items-start">
                  <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 shrink-0">
                    {index + 1}
                  </span>
                  <div className="space-y-4 w-full">
                    <p className="font-bold text-slate-800">{q.question}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options?.map((opt: string, i: number) => (
                        <div 
                          key={i} 
                          className={`p-3 rounded-lg text-sm border ${opt === q.correctAnswer ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm">
                        <span className="font-bold">Explanation: </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
             <Button onClick={handleSaveExam} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
               {isSaving ? (
                 <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
               ) : (
                 'Save Exam to Bank'
               )}
             </Button>
          </div>
        </div>
      )}
    </div>
  );
}
