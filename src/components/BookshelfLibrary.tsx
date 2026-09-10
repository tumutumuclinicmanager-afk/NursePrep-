import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  BookOpen, 
  ExternalLink, 
  GraduationCap, 
  Sparkles, 
  Bookmark, 
  Star, 
  X, 
  ChevronRight, 
  Globe, 
  FileText, 
  HelpCircle,
  Library,
  BookMarked,
  Presentation,
  Download,
  FolderPlus,
  ArrowUpRight,
  CheckCircle,
  Tag
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { StoredLibraryResource } from '@/types/library';
import { LIBRARY_BOOKS, POPULAR_GOOGLE_SEARCHES, LibraryBook, ChapterSummary } from '@/data/libraryBooks';

export function BookshelfLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'google' | 'nclex' | 'scholar' | 'books'>('google');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);
  const [bookmarkedBookIds, setBookmarkedBookIds] = useState<string[]>(['saunders-nclex-9th']);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);

  // New State for Dynamic Admin-Added Resources & Active View
  const [activeView, setActiveView] = useState<'bookshelf' | 'pdfs' | 'powerpoints'>('bookshelf');
  const [customResources, setCustomResources] = useState<StoredLibraryResource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState<boolean>(true);
  const [downloadSuccessNotice, setDownloadSuccessNotice] = useState<string | null>(null);

  // Load custom resources from Firestore
  useEffect(() => {
    async function loadResources() {
      try {
        const snap = await getDocs(collection(db, 'library_resources'));
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() })) as StoredLibraryResource[];
        setCustomResources(items);
      } catch (err) {
        console.warn('Could not load library_resources:', err);
      } finally {
        setIsLoadingResources(false);
      }
    }
    loadResources();
  }, []);

  // Merge static LIBRARY_BOOKS with any admin-added resources of type 'book'
  const allBooks = useMemo<LibraryBook[]>(() => {
    const customBooks: LibraryBook[] = customResources
      .filter(r => r.resourceType === 'book')
      .map(r => ({
        id: r.id || `custom-${r.title.toLowerCase().replace(/\s+/g, '-')}`,
        title: r.title,
        subtitle: r.subtitle || 'Clinical Nursing Textbook',
        author: r.author || 'Clinical Faculty',
        edition: r.edition || 'Current Edition',
        category: (r.category as any) || 'Exam Prep',
        spineColor: r.spineColor || 'from-indigo-950 via-slate-900 to-blue-950',
        textColor: 'text-amber-300',
        accentColor: '#3b82f6',
        pages: r.pageCount || 450,
        nclexYieldRating: 5,
        isbn: 'NursePrep-CLINICAL',
        summary: r.summary || 'Nursing clinical reference guide.',
        highYieldTopics: r.highYieldTopics || ['Clinical Priorities', 'Patient Safety'],
        chapters: [
          {
            chapterNumber: 1,
            title: r.subtitle || 'Core Review & High-Yield Principles',
            highYieldPoints: r.highYieldTopics?.length ? r.highYieldTopics : ['Priority Assessment & Intervention', 'Clinical Judgment Protocols'],
            keyMnemonic: 'NCLEX Priority: Assess before intervening.',
            googleSearchQuery: `${r.title} ${r.category} NCLEX review`
          }
        ],
        googleBooksQuery: r.title
      }));

    return [...LIBRARY_BOOKS, ...customBooks];
  }, [customResources]);

  // Filter books on the shelf
  const filteredBooks = useMemo(() => {
    return allBooks.filter(book => {
      const matchesCategory = selectedCategory === 'All' || book.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesSearch = 
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.summary.toLowerCase().includes(q) ||
        book.highYieldTopics.some(t => t.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [allBooks, selectedCategory, searchQuery]);

  // Filtered PDFs
  const filteredPdfs = useMemo(() => {
    return customResources.filter(res => {
      if (res.resourceType !== 'pdf') return false;
      const matchesCategory = selectedCategory === 'All' || res.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      return matchesCategory && (
        res.title.toLowerCase().includes(q) ||
        (res.subtitle && res.subtitle.toLowerCase().includes(q)) ||
        (res.summary && res.summary.toLowerCase().includes(q)) ||
        res.highYieldTopics?.some(t => t.toLowerCase().includes(q))
      );
    });
  }, [customResources, selectedCategory, searchQuery]);

  // Filtered PowerPoints
  const filteredPowerpoints = useMemo(() => {
    return customResources.filter(res => {
      if (res.resourceType !== 'powerpoint') return false;
      const matchesCategory = selectedCategory === 'All' || res.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      return matchesCategory && (
        res.title.toLowerCase().includes(q) ||
        (res.subtitle && res.subtitle.toLowerCase().includes(q)) ||
        (res.summary && res.summary.toLowerCase().includes(q)) ||
        res.highYieldTopics?.some(t => t.toLowerCase().includes(q))
      );
    });
  }, [customResources, selectedCategory, searchQuery]);

  // Handle Download Action
  const handleDownloadResource = async (res: StoredLibraryResource) => {
    if (res.id) {
      try {
        await updateDoc(doc(db, 'library_resources', res.id), {
          downloadCount: (res.downloadCount || 0) + 1
        });
        setCustomResources(prev => prev.map(r => r.id === res.id ? { ...r, downloadCount: (r.downloadCount || 0) + 1 } : r));
      } catch (e) {
        console.warn('Failed to increment download counter:', e);
      }
    }

    setDownloadSuccessNotice(`Downloaded "${res.title}" successfully!`);
    setTimeout(() => setDownloadSuccessNotice(null), 4000);

    if (res.fileUrl && res.fileUrl.startsWith('http')) {
      window.open(res.fileUrl, '_blank', 'noopener,noreferrer');
    } else if (res.fileUrl && res.fileUrl.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = res.fileUrl;
      link.download = res.fileName || `${res.title}.${res.resourceType === 'powerpoint' ? 'pptx' : 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Dynamic fallback file download
      const content = `NursePrep Clinical Resource\nTitle: ${res.title}\nCategory: ${res.category}\nAuthor: ${res.author || 'Clinical Faculty'}\n\nHigh-Yield Topics:\n${res.highYieldTopics?.join('\n') || 'Priority Nursing Care'}\n\nOverview:\n${res.summary || 'NCLEX Study Material'}`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = (res.fileName || res.title).replace(/\.(pdf|pptx|ppt)$/i, '') + (res.resourceType === 'powerpoint' ? '.pptx' : '.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Execute Google Search in new tab
  const handleGoogleSearch = (customQuery?: string) => {
    const q = customQuery || searchQuery;
    if (!q.trim()) return;

    let targetUrl = '';
    const encoded = encodeURIComponent(q.trim());

    if (searchMode === 'scholar') {
      targetUrl = `https://scholar.google.com/scholar?q=${encoded}`;
    } else if (searchMode === 'books') {
      targetUrl = `https://www.google.com/search?tbm=bks&q=${encoded}`;
    } else if (searchMode === 'nclex') {
      const nclexQuery = encodeURIComponent(`${q.trim()} NCLEX nursing rationale NCLEX-RN`);
      targetUrl = `https://www.google.com/search?q=${nclexQuery}`;
    } else {
      targetUrl = `https://www.google.com/search?q=${encoded}`;
    }

    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleGoogleSearch();
    }
  };

  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookmarkedBookIds(prev => 
      prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]
    );
  };

  // Group books into shelves (up to 4 books per shelf for realistic spacious arrangement)
  const shelves = useMemo(() => {
    const result: LibraryBook[][] = [];
    const chunkSize = 4;
    for (let i = 0; i < filteredBooks.length; i += chunkSize) {
      result.push(filteredBooks.slice(i, i + chunkSize));
    }
    return result;
  }, [filteredBooks]);

  const categories = ['All', 'Exam Prep', 'Pharmacology', 'Med-Surg', 'Pediatrics', 'Maternity', 'Psychiatric', 'Fundamentals'];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Search Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-amber-950/40 to-slate-900 border border-amber-900/40 p-6 md:p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-widest mb-1.5">
                <Library className="w-4 h-4" />
                <span>Clinical Library & High-Yield Reference Desk</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3 font-serif">
                NursePrep Clinical Bookshelf
              </h1>
              <p className="text-slate-300 text-xs md:text-sm max-w-2xl mt-1 leading-relaxed">
                Explore premier Saunders, Davis, and Brunner nursing textbooks on our interactive wooden bookshelf, or search Google instantly for live NCLEX rationales, disease guidelines, and pharmacology.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link to="/admin/resources">
                <button
                  type="button"
                  className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 hover:text-white px-3.5 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <FolderPlus className="w-4 h-4 text-amber-400" />
                  <span>Admin: Add Books & PPTs</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
                </button>
              </Link>

              <div className="bg-amber-950/60 border border-amber-500/30 px-3.5 py-2 rounded-2xl flex items-center gap-3">
                <BookMarked className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-[11px] text-amber-200/80 font-medium">Saved Books</p>
                  <p className="text-sm font-bold text-amber-300">{bookmarkedBookIds.length} on Study Desk</p>
                </div>
              </div>
            </div>
          </div>

          {/* Unified Google Search Bar */}
          <div className="space-y-3 pt-2">
            <div className="relative flex flex-col sm:flex-row items-stretch gap-2 bg-slate-950/80 p-2 rounded-2xl border border-amber-500/30 shadow-inner">
              <div className="relative flex-1 flex items-center">
                <Search className="w-5 h-5 text-amber-400/70 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search any nursing question, drug, lab value, or book title..."
                  className="w-full bg-transparent pl-11 pr-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-0"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-slate-400 hover:text-white mr-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Mode Selectors */}
              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900/90 rounded-xl border border-slate-800 text-xs shrink-0">
                <button
                  onClick={() => setSearchMode('google')}
                  className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                    searchMode === 'google' 
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' 
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="Search standard Google"
                >
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" />
                    Google
                  </span>
                </button>
                <button
                  onClick={() => setSearchMode('nclex')}
                  className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                    searchMode === 'nclex' 
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' 
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="Appends NCLEX clinical rationale to search"
                >
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    NCLEX Rationale
                  </span>
                </button>
                <button
                  onClick={() => setSearchMode('scholar')}
                  className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                    searchMode === 'scholar' 
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' 
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="Search Google Scholar for peer-reviewed studies"
                >
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" />
                    Scholar
                  </span>
                </button>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleGoogleSearch()}
                className="bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2 text-xs md:text-sm shadow-lg transition-all shrink-0 cursor-pointer"
              >
                <span>Search Google</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            {/* Quick High-Yield Google Search Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 text-xs text-slate-400 no-scrollbar">
              <span className="text-[11px] text-amber-300/80 font-semibold uppercase tracking-wider shrink-0">
                High-Yield Searches:
              </span>
              {POPULAR_GOOGLE_SEARCHES.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleGoogleSearch(item.query)}
                  className="px-3 py-1 rounded-full bg-slate-800/70 hover:bg-amber-500/20 hover:text-amber-200 border border-slate-700/60 hover:border-amber-500/40 text-slate-300 text-[11px] transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <span>{item.label}</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Download Alert Notice */}
      {downloadSuccessNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{downloadSuccessNotice}</span>
          </div>
          <button onClick={() => setDownloadSuccessNotice(null)} className="text-xs text-emerald-600 underline font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Resource View Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="inline-flex rounded-2xl bg-slate-100 p-1.5 border border-slate-200 text-xs font-bold self-start">
          <button
            type="button"
            onClick={() => setActiveView('bookshelf')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeView === 'bookshelf'
                ? 'bg-amber-900 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Interactive Bookshelf ({filteredBooks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('pdfs')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeView === 'pdfs'
                ? 'bg-rose-700 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-rose-300" />
            <span>Downloadable PDFs ({filteredPdfs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('powerpoints')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeView === 'powerpoints'
                ? 'bg-amber-700 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Presentation className="w-4 h-4 text-amber-300" />
            <span>PowerPoint Decks ({filteredPowerpoints.length})</span>
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0 mr-1">Filter:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* THE BOOKSHELF CONTAINER */}
      {activeView === 'bookshelf' && (
        <div className="relative rounded-3xl p-6 md:p-10 shadow-2xl overflow-hidden bg-gradient-to-b from-[#2b1810] via-[#1f100a] to-[#140a06] border-8 border-[#3d2314]">
        {/* Bookshelf Top Decorative Moulding */}
        <div className="h-6 -mt-6 -mx-6 md:-mx-10 bg-gradient-to-b from-[#4e2c1a] to-[#361e12] border-b border-[#5c3420] shadow-md flex items-center justify-center">
          <div className="w-48 h-1.5 bg-[#5c3420] rounded-full opacity-60" />
        </div>

        {/* Library Ambient Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.08),transparent_70%)] pointer-events-none" />

        {shelves.length === 0 ? (
          <div className="py-20 text-center text-amber-200/60 space-y-3">
            <BookOpen className="w-12 h-12 mx-auto text-amber-400/40" />
            <p className="font-serif text-lg text-amber-200">No volumes matched your search query.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="text-xs text-amber-400 underline underline-offset-4 hover:text-amber-300"
            >
              Clear filters and display all books
            </button>
          </div>
        ) : (
          <div className="space-y-16 py-4">
            {shelves.map((shelfBooks, shelfIndex) => (
              <div key={shelfIndex} className="relative pt-8">
                {/* Backboard shadow */}
                <div className="absolute inset-x-0 bottom-6 h-36 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                {/* Books Row */}
                <div className="relative z-10 flex items-end justify-center md:justify-start gap-4 md:gap-8 px-4 md:px-12 min-h-[280px]">
                  {shelfBooks.map((book) => {
                    const isBookmarked = bookmarkedBookIds.includes(book.id);
                    return (
                      <motion.div
                        key={book.id}
                        whileHover={{ 
                          y: -18, 
                          scale: 1.03,
                          rotateX: 4,
                          transition: { type: 'spring', stiffness: 400, damping: 25 }
                        }}
                        onClick={() => {
                          setSelectedBook(book);
                          setActiveChapterIndex(0);
                        }}
                        className="group relative cursor-pointer flex flex-col items-center select-none"
                      >
                        {/* Bookmark indicator ribbon dangling over top */}
                        {isBookmarked && (
                          <div className="absolute -top-3 right-3 z-30 drop-shadow">
                            <div className="w-3.5 h-6 bg-red-600 rounded-b-sm border-t-2 border-red-400 flex items-center justify-center">
                              <div className="w-1 h-1 bg-white rounded-full" />
                            </div>
                          </div>
                        )}

                        {/* 3D BOOK SPINE */}
                        <div 
                          className={`relative w-16 md:w-20 h-64 md:h-72 rounded-t-sm shadow-2xl bg-gradient-to-r ${book.spineColor} border-l border-white/20 border-r border-black/40 flex flex-col justify-between p-2.5 transition-all overflow-hidden group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)]`}
                          style={{
                            boxShadow: 'inset 2px 0 5px rgba(255,255,255,0.15), inset -3px 0 8px rgba(0,0,0,0.6), 5px 10px 20px rgba(0,0,0,0.7)'
                          }}
                        >
                          {/* Embossed gold spine lines (top) */}
                          <div className="space-y-1 pt-1 opacity-70">
                            <div className="h-[1px] bg-amber-400 shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                            <div className="h-[1px] bg-amber-300" />
                          </div>

                          {/* Spine Title (Vertical) */}
                          <div className="flex-1 my-3 flex items-center justify-center overflow-hidden">
                            <span 
                              className={`text-[11px] md:text-xs font-serif font-bold uppercase tracking-wider ${book.textColor} line-clamp-2 text-center drop-shadow-md select-none`}
                              style={{
                                writingMode: 'vertical-rl',
                                textOrientation: 'mixed',
                                transform: 'rotate(180deg)'
                              }}
                            >
                              {book.title}
                            </span>
                          </div>

                          {/* Spine Bottom: Edition & Stars */}
                          <div className="space-y-1.5 pb-1 text-center">
                            <div className="text-[9px] font-sans font-semibold text-amber-400/90 tracking-tighter">
                              {book.edition}
                            </div>
                            <div className="flex items-center justify-center gap-0.5 text-amber-400 text-[8px]">
                              {[...Array(book.nclexYieldRating)].map((_, i) => (
                                <Star key={i} className="w-2 h-2 fill-amber-400" />
                              ))}
                            </div>
                            {/* Embossed gold spine lines (bottom) */}
                            <div className="h-[1px] bg-amber-400 opacity-70 mt-1" />
                          </div>
                        </div>

                        {/* Shelf shadow under the book */}
                        <div className="w-16 md:w-20 h-2 bg-black/80 rounded-full blur-[2px] mt-0.5 group-hover:opacity-40 transition-opacity" />

                        {/* Hover Quick Card Tooltip */}
                        <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-56 p-3 bg-slate-900/95 backdrop-blur-md rounded-xl border border-amber-500/40 text-white shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-40 text-left">
                          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">{book.category}</p>
                          <p className="font-serif font-bold text-xs text-white line-clamp-2 mt-0.5">{book.title}</p>
                          <p className="text-[10px] text-slate-300 mt-1">{book.author}</p>
                          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-amber-300">
                            <span>Click to open study desk</span>
                            <ChevronRight className="w-3 h-3" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* THE WOODEN SHELF PLANK (3D Bevel, Lip, Brass Bracket) */}
                <div className="relative mt-1">
                  {/* Top shelf surface */}
                  <div className="h-3 bg-gradient-to-b from-[#5c3420] via-[#482818] to-[#361e12] border-t border-[#78442b] shadow-inner" />
                  
                  {/* Shelf Front Bevel Plank */}
                  <div className="h-6 bg-gradient-to-r from-[#3d2314] via-[#522f1b] to-[#3d2314] border-t border-b border-[#633923] shadow-[0_10px_20px_rgba(0,0,0,0.8)] flex items-center justify-between px-6">
                    {/* Brass corner bracket (left) */}
                    <div className="w-8 h-2 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-700 rounded-sm shadow opacity-70" />

                    {/* Brass Category Nameplate in Center */}
                    <div className="px-4 py-0.5 bg-gradient-to-b from-amber-700 via-amber-500 to-amber-800 rounded shadow-md border border-amber-300/40 flex items-center gap-1.5 text-[9px] font-serif font-bold tracking-widest text-slate-950 uppercase">
                      <span>Section {shelfIndex + 1}: High-Yield NCLEX Volumes</span>
                    </div>

                    {/* Brass corner bracket (right) */}
                    <div className="w-8 h-2 bg-gradient-to-r from-amber-700 via-amber-400 to-amber-600 rounded-sm shadow opacity-70" />
                  </div>

                  {/* Deep shadow cast onto the back wall by this shelf */}
                  <div className="h-5 bg-gradient-to-b from-black/70 to-transparent" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bookshelf Bottom Baseboard */}
        <div className="h-8 -mb-6 -mx-6 md:-mx-10 bg-gradient-to-t from-[#1b0d07] to-[#361e12] border-t border-[#4e2c1a] mt-8 flex items-center justify-center">
          <div className="text-[10px] text-amber-500/40 font-serif tracking-widest uppercase">
            NursePrep Saunders Clinical Reference Repository
          </div>
        </div>
      </div>
      )}

      {/* VIEW 2: DOWNLOADABLE PDFS & CHEAT SHEETS */}
      {activeView === 'pdfs' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-600" />
                Downloadable NCLEX & Clinical Nursing PDFs
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Download printable cheat sheets, drug dosage calculation guides, and high-yield summary PDFs directly to your device.
              </p>
            </div>
            <Link to="/admin/resources">
              <button
                type="button"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                + Add PDF Guide
              </button>
            </Link>
          </div>

          {filteredPdfs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800">No PDF cheat sheets found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No downloadable PDFs have been uploaded for this category. Administrators can add PDFs via the resource manager.
              </p>
              <Link to="/admin/resources">
                <button className="text-xs bg-slate-900 text-white font-semibold px-4 py-2 rounded-xl mt-2 cursor-pointer">
                  Open Admin Resource Manager
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPdfs.map((pdf) => (
                <div
                  key={pdf.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md">
                        {pdf.category}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                        {pdf.title}
                      </h3>
                      {pdf.subtitle && (
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{pdf.subtitle}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      {pdf.fileSize && <span>Size: {pdf.fileSize}</span>}
                      {pdf.pageCount && <span>{pdf.pageCount} Pages</span>}
                      <span>{pdf.downloadCount || 0} Downloads</span>
                    </div>

                    {pdf.summary && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-3 leading-relaxed">
                        {pdf.summary}
                      </p>
                    )}

                    {pdf.highYieldTopics && pdf.highYieldTopics.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {pdf.highYieldTopics.slice(0, 3).map((topic, i) => (
                          <span key={i} className="text-[10px] font-medium bg-rose-50 text-rose-800 px-2 py-0.5 rounded-md border border-rose-100">
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono truncate max-w-[150px]">
                      {pdf.fileName || 'guide.pdf'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDownloadResource(pdf)}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: POWERPOINT PRESENTATIONS (.PPTX) */}
      {activeView === 'powerpoints' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Presentation className="w-5 h-5 text-amber-600" />
                Clinical Lecture PowerPoint Presentations (.pptx)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Download interactive faculty slide decks for pharmacology, medical-surgical nursing, pediatrics, and emergency care.
              </p>
            </div>
            <Link to="/admin/resources">
              <button
                type="button"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                + Add PowerPoint Deck
              </button>
            </Link>
          </div>

          {filteredPowerpoints.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <Presentation className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800">No PowerPoint presentations found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No slide decks have been uploaded for this category yet. Administrators can add presentations anytime via the management panel.
              </p>
              <Link to="/admin/resources">
                <button className="text-xs bg-slate-900 text-white font-semibold px-4 py-2 rounded-xl mt-2 cursor-pointer">
                  Open Admin Resource Manager
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPowerpoints.map((ppt) => (
                <div
                  key={ppt.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                        <Presentation className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-md border border-amber-200">
                        {ppt.category}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                        {ppt.title}
                      </h3>
                      {ppt.subtitle && (
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{ppt.subtitle}</p>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 space-y-0.5">
                      <p><strong className="text-slate-800">Lecturer:</strong> {ppt.author || 'Clinical Faculty'}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                        {ppt.slideCount && <span>{ppt.slideCount} Slides</span>}
                        {ppt.fileSize && <span>{ppt.fileSize}</span>}
                        <span>{ppt.downloadCount || 0} Downloads</span>
                      </div>
                    </div>

                    {ppt.summary && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-3 leading-relaxed">
                        {ppt.summary}
                      </p>
                    )}

                    {ppt.highYieldTopics && ppt.highYieldTopics.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {ppt.highYieldTopics.slice(0, 3).map((topic, i) => (
                          <span key={i} className="text-[10px] font-medium bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200">
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono truncate max-w-[150px]">
                      {ppt.fileName || 'presentation.pptx'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDownloadResource(ppt)}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Slides (.pptx)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* READING DESK MODAL (When a book is clicked) */}
      <AnimatePresence>
        {selectedBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-amber-600/30 rounded-3xl max-w-4xl w-full shadow-2xl text-white overflow-hidden my-auto"
            >
              {/* Modal Top Banner */}
              <div className={`p-6 bg-gradient-to-r ${selectedBook.spineColor} border-b border-white/10 relative`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold uppercase tracking-wider">
                      <span>{selectedBook.category}</span>
                      <span>•</span>
                      <span>{selectedBook.edition}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-amber-300">
                        <Star className="w-3.5 h-3.5 fill-amber-300" />
                        {selectedBook.nclexYieldRating}.0 High-Yield Rating
                      </span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-serif font-black text-white leading-snug">
                      {selectedBook.title}
                    </h2>
                    <p className="text-slate-200 text-xs md:text-sm">{selectedBook.author}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleBookmark(selectedBook.id)}
                      className={`p-2.5 rounded-xl border transition-colors ${
                        bookmarkedBookIds.includes(selectedBook.id)
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700'
                      }`}
                      title="Bookmark to Study Desk"
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedBook(null)}
                      className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Content Body */}
              <div className="p-6 md:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
                {/* Book Summary & Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                  <div className="md:col-span-2 space-y-3">
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      About this Reference Volume
                    </h3>
                    <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                      {selectedBook.summary}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedBook.highYieldTopics.map((topic, i) => (
                        <span key={i} className="px-2.5 py-1 bg-slate-800/80 text-amber-200 text-[11px] rounded-lg border border-slate-700">
                          ✓ {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 flex flex-col justify-center">
                    <p className="text-xs text-slate-400">Search External Catalogs:</p>
                    <button
                      onClick={() => handleGoogleSearch(selectedBook.googleBooksQuery)}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <span>Search on Google</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        const scholarQuery = encodeURIComponent(`${selectedBook.title} nursing research clinical trials`);
                        window.open(`https://scholar.google.com/scholar?q=${scholarQuery}`, '_blank');
                      }}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Google Scholar Citations</span>
                    </button>
                  </div>
                </div>

                {/* Chapter Deep Dive Tabs */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Core High-Yield NCLEX Chapters & Clinical Pearls
                    </h3>
                    <span className="text-xs text-slate-400">Select chapter to review</span>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {selectedBook.chapters.map((ch, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveChapterIndex(idx)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                          activeChapterIndex === idx
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                        }`}
                      >
                        <span>Ch. {ch.chapterNumber}: {ch.title.substring(0, 26)}...</span>
                      </button>
                    ))}
                  </div>

                  {/* Active Chapter Details Card */}
                  {selectedBook.chapters[activeChapterIndex] && (
                    <div className="bg-slate-950/80 p-5 md:p-6 rounded-2xl border border-amber-600/30 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div>
                          <p className="text-[11px] font-bold text-amber-400 uppercase">
                            Chapter {selectedBook.chapters[activeChapterIndex].chapterNumber}
                          </p>
                          <h4 className="text-base font-serif font-bold text-white">
                            {selectedBook.chapters[activeChapterIndex].title}
                          </h4>
                        </div>

                        <button
                          onClick={() => handleGoogleSearch(selectedBook.chapters[activeChapterIndex].googleSearchQuery)}
                          className="bg-slate-800 hover:bg-amber-500/20 hover:text-amber-200 border border-slate-700 hover:border-amber-500/40 text-slate-200 text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
                        >
                          <Globe className="w-3.5 h-3.5 text-amber-400" />
                          <span>Search Google for this Chapter</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Key High-Yield Bullet Points */}
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Essential Clinical Principles:
                        </p>
                        <ul className="space-y-2 text-xs md:text-sm text-slate-300">
                          {selectedBook.chapters[activeChapterIndex].highYieldPoints.map((pt, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-2 shrink-0" />
                              <span className="leading-relaxed">{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Mnemonic Banner */}
                      {selectedBook.chapters[activeChapterIndex].keyMnemonic && (
                        <div className="p-4 bg-amber-950/40 border border-amber-500/30 rounded-xl flex items-start gap-3">
                          <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                              Saunders Memory Mnemonic
                            </p>
                            <p className="text-xs md:text-sm text-amber-100 mt-0.5 font-medium">
                              {selectedBook.chapters[activeChapterIndex].keyMnemonic}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>ISBN: {selectedBook.isbn} • {selectedBook.pages} pages</span>
                <button
                  onClick={() => setSelectedBook(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors"
                >
                  Return to Bookshelf
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
