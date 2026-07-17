import React, { useState } from 'react';
import { MessageSquare, Search, Reply, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function StudentQueries() {
  const [queries, setQueries] = useState([
    { id: 1, student: 'Sarah Jenkins', course: 'Pharmacology 101', question: 'Could you explain the difference in mechanism of action between ACE inhibitors and ARBs?', time: '2 hours ago', status: 'Unanswered' },
    { id: 2, student: 'Michael Chang', course: 'Anatomy Basics', question: 'I am confused about the blood flow through the heart. Which valve comes after the right ventricle?', time: '5 hours ago', status: 'Unanswered' },
  ]);

  const [replyText, setReplyText] = useState('');
  const [activeQuery, setActiveQuery] = useState<number | null>(null);

  const handleReply = (id: number) => {
    setQueries(queries.filter(q => q.id !== id));
    setActiveQuery(null);
    setReplyText('');
    alert('Reply sent successfully!');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Student Queries</h2>
        <p className="text-slate-500 text-sm">Review and answer questions submitted by your students.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search queries..." 
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
          <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-blue-500">
            <option>All Courses</option>
            <option>Pharmacology</option>
            <option>Anatomy</option>
          </select>
        </div>

        <div className="divide-y divide-slate-100">
          {queries.map((query) => (
            <div key={query.id} className="p-6 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{query.student}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{query.course}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {query.time}</span>
                    </div>
                  </div>
                </div>
                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest rounded">
                  {query.status}
                </span>
              </div>
              
              <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm mb-4">
                <p className="text-slate-700 font-medium">{query.question}</p>
              </div>

              {activeQuery === query.id ? (
                <div className="space-y-3 mt-4 border-t border-slate-100 pt-4">
                  <textarea 
                    className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                    rows={4} 
                    placeholder="Type your answer here..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  ></textarea>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setActiveQuery(null)}>Cancel</Button>
                    <Button className="bg-blue-600 text-white gap-2" onClick={() => handleReply(query.id)} disabled={!replyText.trim()}>
                      <Reply className="w-4 h-4" />
                      Send Reply
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 gap-2" onClick={() => setActiveQuery(query.id)}>
                  <Reply className="w-4 h-4" />
                  Answer Question
                </Button>
              )}
            </div>
          ))}
          
          {queries.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p>You've answered all student queries. Great job!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
