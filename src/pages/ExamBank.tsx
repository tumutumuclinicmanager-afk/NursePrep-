import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search, Filter, BookOpen, Activity, HeartPulse, Brain, Baby, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const categories = ['All', 'Medical-Surgical', 'Pediatrics', 'Maternal & Child', 'Mental Health', 'Pharmacology', 'Fundamentals'];

const exams = [
  { id: 1, title: 'Pharmacology Mock Exam #4', category: 'Pharmacology', questions: 50, duration: '60 mins', difficulty: 'Hard', icon: Activity, color: 'text-purple-600', bg: 'bg-purple-100' },
  { id: 2, title: 'Pediatrics Comprehensive', category: 'Pediatrics', questions: 75, duration: '90 mins', difficulty: 'Medium', icon: Baby, color: 'text-pink-600', bg: 'bg-pink-100' },
  { id: 3, title: 'Medical-Surgical Quiz', category: 'Medical-Surgical', questions: 30, duration: '45 mins', difficulty: 'Medium', icon: HeartPulse, color: 'text-rose-600', bg: 'bg-rose-100' },
  { id: 4, title: 'Psychiatric Nursing Basics', category: 'Mental Health', questions: 40, duration: '50 mins', difficulty: 'Hard', icon: Brain, color: 'text-blue-600', bg: 'bg-blue-100' },
  { id: 5, title: 'Fundamentals Checkpoint', category: 'Fundamentals', questions: 25, duration: '30 mins', difficulty: 'Easy', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { id: 6, title: 'Maternal Newborn Mastery', category: 'Maternal & Child', questions: 60, duration: '75 mins', difficulty: 'Hard', icon: Baby, color: 'text-orange-600', bg: 'bg-orange-100' },
];

export default function ExamBank() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExams = exams.filter(exam => {
    const matchesCategory = selectedCategory === 'All' || exam.category === selectedCategory;
    const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          exam.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-8">
      <div className="text-center space-y-4 max-w-3xl mx-auto mb-12">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900">Exam Bank</h1>
        <p className="text-lg text-slate-500">Practice with hundreds of specialized nursing exams tailored to your learning needs.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search exams, subjects..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <Filter className="w-5 h-5 text-slate-400 mr-2 flex-shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExams.map((exam) => (
          <Card key={exam.id} className="hover:shadow-md transition-shadow group overflow-hidden border-slate-200">
            <CardContent className="p-0">
              <div className="p-6 border-b border-slate-100">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${exam.bg} ${exam.color}`}>
                    <exam.icon className="w-6 h-6" />
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded ${
                    exam.difficulty === 'Hard' ? 'bg-red-100 text-red-700' :
                    exam.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {exam.difficulty}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{exam.title}</h3>
                <p className="text-sm font-medium text-slate-500">{exam.category}</p>
              </div>
              <div className="bg-slate-50 px-6 py-4 flex items-center justify-between">
                <div className="flex gap-4 text-xs font-bold text-slate-500 uppercase tracking-tight">
                  <span>{exam.questions} Qs</span>
                  <span>•</span>
                  <span>{exam.duration}</span>
                </div>
                <Link to="/dashboard">
                  <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-2 p-0 h-auto">
                    Start Exam <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredExams.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <p className="text-slate-500 text-lg">No exams found matching your criteria.</p>
            <Button variant="outline" className="mt-4" onClick={() => {setSearchQuery(''); setSelectedCategory('All');}}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
