import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search, Filter, BookOpen, Activity, HeartPulse, Brain, Baby, ArrowRight, DollarSign, ShoppingCart } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';

const categories = ['All', 'NCK', 'NCLEX', 'HESI', 'GED'];

const examBundles = [
  { id: 1, title: 'NCK Complete Bundle', category: 'NCK', price: 'Ksh 5,000', numericPrice: 5000, features: ['10+ Mock Exams', 'Detailed Analytics', 'Study Guides'], icon: Activity, color: 'text-purple-600', bg: 'bg-purple-100' },
  { id: 2, title: 'NCLEX Comprehensive', category: 'NCLEX', price: 'Ksh 25,000', numericPrice: 25000, features: ['Unlimited Mock Exams', 'Priority Support', 'Live Sessions'], icon: Brain, color: 'text-blue-600', bg: 'bg-blue-100' },
  { id: 3, title: 'HESI Assessment Prep', category: 'HESI', price: 'Ksh 15,000', numericPrice: 15000, features: ['5 Mock Exams', 'Targeted Practice', 'Performance Tracking'], icon: HeartPulse, color: 'text-rose-600', bg: 'bg-rose-100' },
  { id: 4, title: 'GED Prep Mastery', category: 'GED', price: 'Ksh 25,000', numericPrice: 25000, features: ['Full Curriculum', 'Practice Quizzes', '1-on-1 Support'], icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-100' },
];

export default function ExamBank() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBundle, setSelectedBundle] = useState<any>(null);
  const [mpesaRef, setMpesaRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const filteredBundles = examBundles.filter(bundle => {
    const matchesCategory = selectedCategory === 'All' || bundle.category === selectedCategory;
    const matchesSearch = bundle.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          bundle.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleBuyNow = (bundle: any) => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }
    setSelectedBundle(bundle);
    setShowPaymentModal(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !mpesaRef || !selectedBundle) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'payments'), {
        user: auth.currentUser.email,
        name: auth.currentUser.displayName || auth.currentUser.email,
        amount: selectedBundle.price,
        plan: selectedBundle.title,
        mpesaRef: mpesaRef,
        status: 'Pending',
        date: new Date().toLocaleString()
      });
      alert('Payment details submitted successfully. Access will be granted once verified.');
      setShowPaymentModal(false);
      setMpesaRef('');
      setSelectedBundle(null);
    } catch (error) {
      console.error(error);
      alert('Error submitting payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-8">
      <div className="text-center space-y-4 max-w-3xl mx-auto mb-12">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900">Exam Store</h1>
        <p className="text-lg text-slate-500">Purchase access to premium nursing exam bundles and propel your career forward.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search bundles..." 
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredBundles.map((bundle) => (
          <Card key={bundle.id} className="hover:shadow-md transition-shadow group overflow-hidden border-slate-200 flex flex-col">
            <CardContent className="p-0 flex flex-col h-full">
              <div className="p-6 border-b border-slate-100 flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bundle.bg} ${bundle.color}`}>
                    <bundle.icon className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-bold rounded-full">
                    {bundle.category}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{bundle.title}</h3>
                <div className="space-y-2 mt-4">
                  {bundle.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-100">
                <div className="text-xl font-bold text-slate-900">
                  {bundle.price}
                </div>
                <Button onClick={() => handleBuyNow(bundle)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  <ShoppingCart className="w-4 h-4" /> Buy Now
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredBundles.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <p className="text-slate-500 text-lg">No bundles found matching your criteria.</p>
            <Button variant="outline" className="mt-4" onClick={() => {setSearchQuery(''); setSelectedCategory('All');}}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {showPaymentModal && selectedBundle && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-start gap-4">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">M-Pesa Payment Details</h3>
                <p className="text-xs text-slate-500 mt-1">Pay for {selectedBundle.title}</p>
              </div>
            </div>
            
            <form onSubmit={handleSubmitPayment} className="p-6 space-y-4">
              <div className="p-4 bg-slate-100 border border-slate-200 rounded-lg text-sm mb-4">
                <p className="mb-2">1. Go to M-Pesa Menu</p>
                <p className="mb-2">2. Select Lipa na M-Pesa -&gt; Buy Goods and Services</p>
                <p className="mb-2">3. Enter Till Number: <strong>123456</strong></p>
                <p className="mb-2">4. Enter Amount: <strong>{selectedBundle.price}</strong></p>
                <p>5. Enter M-Pesa Pin and confirm.</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enter M-Pesa Reference Code</label>
                <input 
                  type="text" 
                  value={mpesaRef}
                  onChange={(e) => setMpesaRef(e.target.value.toUpperCase())}
                  placeholder="e.g. SAX8921JHK"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-mono uppercase"
                  required
                />
              </div>

              <div className="flex gap-2 mt-6">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting || !mpesaRef} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50">
                  {isSubmitting ? 'Submitting...' : 'Verify Payment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
