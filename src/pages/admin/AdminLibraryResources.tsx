import React, { useState, useEffect, useMemo } from 'react';
import { 
  Library, 
  BookOpen, 
  FileText, 
  Presentation, 
  Plus, 
  Search, 
  Download, 
  Trash2, 
  Edit3, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Upload, 
  ExternalLink, 
  FileCheck,
  RefreshCw,
  FolderPlus,
  Eye,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { StoredLibraryResource, LibraryResourceType } from '@/types/library';
import { Link } from 'react-router-dom';

const CATEGORIES = [
  'All',
  'Exam Prep',
  'Pharmacology',
  'Med-Surg',
  'Pediatrics',
  'Maternity',
  'Psychiatric',
  'Fundamentals',
  'Critical Care'
];

const STARTER_SEEDS: Omit<StoredLibraryResource, 'id'>[] = [
  {
    title: 'Saunders Comprehensive Review for the NCLEX-RN',
    subtitle: 'The Gold Standard Examination Manual',
    author: 'Linda Anne Silvestri, PhD, RN, FAAN',
    edition: '9th Edition',
    category: 'Exam Prep',
    resourceType: 'book',
    fileUrl: 'https://www.google.com/search?tbm=bks&q=Saunders+Comprehensive+Review+NCLEX-RN+9th+Edition',
    fileName: 'Saunders_NCLEX_RN_Comprehensive_Review_9th.pdf',
    fileSize: '24.5 MB',
    pageCount: 1152,
    spineColor: 'from-blue-900 via-indigo-950 to-blue-950',
    summary: 'Essential manual for NCLEX-RN candidates featuring Next-Gen Clinical Judgment Measurement Models (NCJMM), client needs framework, and high-yield rationales.',
    highYieldTopics: ['Prioritization & Delegation', 'Management of Care', 'Safe and Effective Care', 'Clinical Judgment'],
    downloadCount: 342,
    createdAt: new Date().toISOString()
  },
  {
    title: 'Fluid, Electrolytes & Acid-Base Balance Masterclass',
    subtitle: 'Clinical Nursing Lecture & Case Scenarios',
    author: 'Prof. Godfrey Wangechi, MSN, RN, CCRN',
    edition: '2026 Academic Edition',
    category: 'Med-Surg',
    resourceType: 'powerpoint',
    fileUrl: 'https://docs.google.com/presentation/d/1example_fluid_electrolytes/preview',
    fileName: 'Fluid_Electrolytes_AcidBase_Mastery.pptx',
    fileSize: '8.4 MB',
    slideCount: 64,
    summary: 'Comprehensive slide presentation breaking down ROME mnemonic, potassium shifts, hypernatremia vs hyponatremia, ABG interpretation steps, and priority IV fluid resuscitation.',
    highYieldTopics: ['ABG Interpretation (ROME)', 'Hypokalemia vs Hyperkalemia', 'Cerebral Edema Risks', 'Colloids vs Crystalloids'],
    downloadCount: 189,
    createdAt: new Date().toISOString()
  },
  {
    title: 'Davis Drug Guide for Nurses - Rapid NCLEX Pharmacology',
    subtitle: 'High-Alert Medications & Black Box Warnings',
    author: 'April Hazard Vallerand, PhD, RN, FAAN',
    edition: '18th Edition',
    category: 'Pharmacology',
    resourceType: 'book',
    fileUrl: 'https://www.google.com/search?tbm=bks&q=Davis+Drug+Guide+for+Nurses',
    fileName: 'Davis_Drug_Guide_HighAlert_Summary.pdf',
    fileSize: '16.2 MB',
    pageCount: 1472,
    spineColor: 'from-emerald-950 via-teal-900 to-emerald-900',
    summary: 'Indispensable clinical guide focused on safe medication administration, therapeutic serum drug ranges, antidotes, and patient safety checks.',
    highYieldTopics: ['Digoxin Toxicity', 'Insulin Regimens', 'Heparin vs Warfarin', 'Opioid Antidotes'],
    downloadCount: 278,
    createdAt: new Date().toISOString()
  },
  {
    title: 'NCLEX-RN High-Yield Pharmacology Cheat Sheet',
    subtitle: 'Drug Suffixes, Antidotes, and Lab Values At-a-Glance',
    author: 'NursePrep Clinical Faculty',
    edition: 'Version 4.2',
    category: 'Pharmacology',
    resourceType: 'pdf',
    fileUrl: 'https://example.com/downloads/nclex_pharma_cheat_sheet.pdf',
    fileName: 'NCLEX_Pharma_Rapid_Review_CheatSheet.pdf',
    fileSize: '3.1 MB',
    pageCount: 18,
    summary: 'Ultra-concentrated PDF reference chart designed for rapid revision. Includes top 100 tested medications, toxicities, nursing considerations, and vital parameters before administration.',
    highYieldTopics: ['ACE Inhibitors & ARBs', 'Beta Blockers & Calcium Channel Blockers', 'Lithium & Antipsychotics', 'Emergency Pressors'],
    downloadCount: 512,
    createdAt: new Date().toISOString()
  },
  {
    title: 'Pediatric Developmental Milestones & Pediatric Emergencies',
    subtitle: 'Comprehensive NCLEX Pediatric Slide Deck',
    author: 'Dr. Sarah Jenkins, DNP, CPNP',
    edition: '2026 Edition',
    category: 'Pediatrics',
    resourceType: 'powerpoint',
    fileUrl: 'https://docs.google.com/presentation/d/1example_pediatrics/preview',
    fileName: 'Pediatric_Milestones_Emergencies.pptx',
    fileSize: '11.8 MB',
    slideCount: 52,
    summary: 'Lecture slides covering developmental milestones (Erikson, Piaget), congenital cardiac defects (tetralogy of Fallot, VSD), croup vs epiglottitis, and pediatric resuscitation.',
    highYieldTopics: ['Erikson Psychosocial Stages', 'Epiglottitis vs Croup', 'Tetralogy of Fallot (Tet Spells)', 'Kawasaki Disease'],
    downloadCount: 145,
    createdAt: new Date().toISOString()
  },
  {
    title: 'Brunner & Suddarth’s Medical-Surgical Nursing Review',
    subtitle: 'Pathophysiology and Clinical Interventions',
    author: 'Janice L. Hinkle, PhD, RN, CNRN',
    edition: '15th Edition',
    category: 'Med-Surg',
    resourceType: 'book',
    fileUrl: 'https://www.google.com/search?tbm=bks&q=Brunner+and+Suddarth+Medical+Surgical+Nursing',
    fileName: 'Brunner_Suddarth_MedSurg_Overview.pdf',
    fileSize: '38.0 MB',
    pageCount: 2280,
    spineColor: 'from-amber-950 via-rose-950 to-amber-900',
    summary: 'The cornerstone textbook for clinical nursing, pathophysiology, post-operative assessments, acute respiratory distress, and cardiac telemetry.',
    highYieldTopics: ['Shock Syndromes (Septic, Hypovolemic, Cardiogenic)', 'Acute Kidney Injury', 'Stroke (Ischemic vs Hemorrhagic)', 'COPD & Asthma'],
    downloadCount: 421,
    createdAt: new Date().toISOString()
  }
];

export default function AdminLibraryResources() {
  const [resources, setResources] = useState<StoredLibraryResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'book' | 'pdf' | 'powerpoint'>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<StoredLibraryResource | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<StoredLibraryResource>>({
    title: '',
    subtitle: '',
    author: '',
    edition: '',
    category: 'Exam Prep',
    resourceType: 'book',
    fileUrl: '',
    fileName: '',
    fileSize: '',
    pageCount: 200,
    slideCount: 35,
    spineColor: 'from-blue-900 via-indigo-950 to-blue-950',
    summary: '',
    highYieldTopics: []
  });
  const [topicInput, setTopicInput] = useState('');

  // Fetch library resources from Firestore
  const fetchResources = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'library_resources'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const items: StoredLibraryResource[] = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StoredLibraryResource[];
      setResources(items);
    } catch (err: any) {
      console.warn('Error fetching library_resources, checking non-ordered:', err);
      try {
        const fallbackSnap = await getDocs(collection(db, 'library_resources'));
        const fallbackItems = fallbackSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as StoredLibraryResource[];
        setResources(fallbackItems);
      } catch (e) {
        console.error('Failed to load library resources:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  // Quick seed starter books/PDFs/PPTs if collection is empty
  const handleSeedResources = async () => {
    if (!confirm('This will load 6 premier nursing reference books, downloadable study guide PDFs, and PowerPoint slide decks into the library. Continue?')) {
      return;
    }
    setLoading(true);
    try {
      for (const item of STARTER_SEEDS) {
        await addDoc(collection(db, 'library_resources'), {
          ...item,
          createdAt: new Date().toISOString()
        });
      }
      setNotice({ type: 'success', text: 'Successfully seeded starter library with books, PDFs, and presentations!' });
      await fetchResources();
    } catch (err: any) {
      console.error('Seeding error:', err);
      setNotice({ type: 'error', text: `Failed to seed resources: ${err?.message || 'Check firestore permissions'}` });
    } finally {
      setLoading(false);
    }
  };

  // Open modal for Create
  const handleOpenCreateModal = (type: LibraryResourceType = 'book') => {
    setEditingResource(null);
    setFormData({
      title: '',
      subtitle: '',
      author: '',
      edition: '',
      category: 'Exam Prep',
      resourceType: type,
      fileUrl: '',
      fileName: type === 'book' ? 'Textbook_Reference.pdf' : type === 'pdf' ? 'Study_Guide.pdf' : 'Lecture_Slides.pptx',
      fileSize: '5.0 MB',
      pageCount: type === 'powerpoint' ? undefined : 150,
      slideCount: type === 'powerpoint' ? 40 : undefined,
      spineColor: 'from-blue-900 via-indigo-950 to-blue-950',
      summary: '',
      highYieldTopics: []
    });
    setTopicInput('');
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (res: StoredLibraryResource) => {
    setEditingResource(res);
    setFormData({
      ...res,
      highYieldTopics: res.highYieldTopics || []
    });
    setTopicInput('');
    setIsModalOpen(true);
  };

  // Handle local file selection to populate file info or data URI
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    const reader = new FileReader();

    reader.onload = (event) => {
      const dataUri = event.target?.result as string;
      setFormData(prev => ({
        ...prev,
        fileName: file.name,
        fileSize: sizeInMb,
        fileUrl: dataUri.length < 900000 ? dataUri : prev.fileUrl || `local://${file.name}`,
        title: prev.title || file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ")
      }));
    };

    reader.readAsDataURL(file);
  };

  // Add tag
  const handleAddTopic = () => {
    if (!topicInput.trim()) return;
    const current = formData.highYieldTopics || [];
    if (!current.includes(topicInput.trim())) {
      setFormData(prev => ({
        ...prev,
        highYieldTopics: [...current, topicInput.trim()]
      }));
    }
    setTopicInput('');
  };

  const handleRemoveTopic = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      highYieldTopics: (prev.highYieldTopics || []).filter((_, i) => i !== indexToRemove)
    }));
  };

  // Save resource to Firestore
  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      alert('Please enter a title for the resource.');
      return;
    }

    setIsSaving(true);
    try {
      const resourcePayload = {
        title: formData.title.trim(),
        subtitle: formData.subtitle?.trim() || '',
        author: formData.author?.trim() || 'Clinical Faculty',
        edition: formData.edition?.trim() || 'Current Edition',
        category: formData.category || 'Exam Prep',
        resourceType: formData.resourceType || 'book',
        fileUrl: formData.fileUrl?.trim() || '',
        fileName: formData.fileName?.trim() || `${formData.title.trim().replace(/\s+/g, '_')}.${formData.resourceType === 'powerpoint' ? 'pptx' : 'pdf'}`,
        fileSize: formData.fileSize?.trim() || (formData.resourceType === 'powerpoint' ? '8.5 MB' : '4.2 MB'),
        pageCount: Number(formData.pageCount) || (formData.resourceType === 'powerpoint' ? undefined : 120),
        slideCount: Number(formData.slideCount) || (formData.resourceType === 'powerpoint' ? 45 : undefined),
        spineColor: formData.spineColor || 'from-blue-900 via-indigo-950 to-blue-950',
        summary: formData.summary?.trim() || 'Clinical study resource for nursing examinations.',
        highYieldTopics: formData.highYieldTopics || [],
        downloadCount: editingResource ? (editingResource.downloadCount || 0) : 0,
        createdAt: editingResource ? editingResource.createdAt : new Date().toISOString()
      };

      if (editingResource?.id) {
        await updateDoc(doc(db, 'library_resources', editingResource.id), resourcePayload);
        setNotice({ type: 'success', text: `Updated "${resourcePayload.title}" successfully!` });
      } else {
        await addDoc(collection(db, 'library_resources'), resourcePayload);
        setNotice({ type: 'success', text: `Added new ${resourcePayload.resourceType} "${resourcePayload.title}" to library!` });
      }

      setIsModalOpen(false);
      await fetchResources();
    } catch (err: any) {
      console.error('Error saving resource:', err);
      setNotice({ type: 'error', text: `Failed to save: ${err?.message || 'Database error'}` });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete resource
  const handleDeleteResource = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}" from the library?`)) return;
    try {
      await deleteDoc(doc(db, 'library_resources', id));
      setNotice({ type: 'success', text: `Deleted "${title}".` });
      setResources(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      console.error('Error deleting resource:', err);
      alert(`Could not delete: ${err?.message || 'Permission issue'}`);
    }
  };

  // Trigger test download / increment count
  const handleTriggerDownload = async (resource: StoredLibraryResource) => {
    if (resource.id) {
      try {
        await updateDoc(doc(db, 'library_resources', resource.id), {
          downloadCount: (resource.downloadCount || 0) + 1
        });
        setResources(prev => prev.map(r => r.id === resource.id ? { ...r, downloadCount: (r.downloadCount || 0) + 1 } : r));
      } catch (e) {
        console.warn('Could not increment download count:', e);
      }
    }

    if (resource.fileUrl && resource.fileUrl.startsWith('http')) {
      window.open(resource.fileUrl, '_blank', 'noopener,noreferrer');
    } else if (resource.fileUrl && resource.fileUrl.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = resource.fileUrl;
      link.download = resource.fileName || `${resource.title}.${resource.resourceType === 'powerpoint' ? 'pptx' : 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Create a dummy mock download text file to demonstrate real download behavior
      const sampleContent = `NursePrep Clinical Study Guide\nTitle: ${resource.title}\nCategory: ${resource.category}\nAuthor: ${resource.author}\n\nHigh-Yield Topics:\n${resource.highYieldTopics?.join('\n') || 'General Nursing'}\n\nSummary:\n${resource.summary}`;
      const blob = new Blob([sampleContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = (resource.fileName || resource.title).replace(/\.(pdf|pptx|ppt)$/i, '') + '.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Filtered resources
  const filteredResources = useMemo(() => {
    return resources.filter(item => {
      const matchesType = selectedTypeFilter === 'all' || item.resourceType === selectedTypeFilter;
      const matchesCategory = selectedCategoryFilter === 'All' || item.category === selectedCategoryFilter;
      
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesType && matchesCategory;

      const matchesSearch = 
        item.title?.toLowerCase().includes(q) ||
        item.author?.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q) ||
        item.summary?.toLowerCase().includes(q) ||
        item.highYieldTopics?.some(t => t.toLowerCase().includes(q));

      return matchesType && matchesCategory && matchesSearch;
    });
  }, [resources, selectedTypeFilter, selectedCategoryFilter, searchQuery]);

  // Counts
  const stats = useMemo(() => {
    return {
      total: resources.length,
      books: resources.filter(r => r.resourceType === 'book').length,
      pdfs: resources.filter(r => r.resourceType === 'pdf').length,
      presentations: resources.filter(r => r.resourceType === 'powerpoint').length,
      downloads: resources.reduce((acc, curr) => acc + (curr.downloadCount || 0), 0)
    };
  }, [resources]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-widest">
              <Library className="w-4 h-4" />
              <span>Admin Management Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Clinical Books, PDFs & PowerPoint Presentations
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              Add and manage textbooks for the student bookshelf, downloadable nursing cheat sheet PDFs, and clinical lecture PowerPoint presentations (.pptx).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/dashboard/library" target="_blank">
              <Button variant="outline" className="gap-2 text-xs sm:text-sm">
                <Eye className="w-4 h-4 text-slate-500" />
                View Student Library
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </Button>
            </Link>

            {resources.length === 0 && (
              <Button 
                variant="outline" 
                onClick={handleSeedResources}
                disabled={loading}
                className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 text-xs sm:text-sm"
              >
                <Sparkles className="w-4 h-4 text-blue-600" />
                Seed High-Yield Library
              </Button>
            )}

            <div className="inline-flex rounded-xl bg-blue-600 p-1 shadow-sm">
              <button
                type="button"
                onClick={() => handleOpenCreateModal('book')}
                className="px-3 py-2 text-white hover:bg-blue-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" /> + Book
              </button>
              <button
                type="button"
                onClick={() => handleOpenCreateModal('pdf')}
                className="px-3 py-2 text-white hover:bg-blue-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" /> + PDF
              </button>
              <button
                type="button"
                onClick={() => handleOpenCreateModal('powerpoint')}
                className="px-3 py-2 text-white hover:bg-blue-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Presentation className="w-3.5 h-3.5" /> + PPT
              </button>
            </div>
          </div>
        </div>

        {/* Stats Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Resources</span>
              <Library className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Textbooks</span>
              <BookOpen className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.books}</p>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Downloadable PDFs</span>
              <FileText className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.pdfs}</p>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">PowerPoint Decks</span>
              <Presentation className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.presentations}</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notice && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm animate-in fade-in ${
          notice.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
            <span className="font-medium">{notice.text}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-xs font-bold underline opacity-80 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books, lecture decks, PDFs, authors, topics..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Type tabs */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold shrink-0">
            <button
              onClick={() => setSelectedTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedTypeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setSelectedTypeFilter('book')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
                selectedTypeFilter === 'book' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Books ({stats.books})
            </button>
            <button
              onClick={() => setSelectedTypeFilter('pdf')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
                selectedTypeFilter === 'pdf' ? 'bg-white text-rose-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> PDFs ({stats.pdfs})
            </button>
            <button
              onClick={() => setSelectedTypeFilter('powerpoint')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
                selectedTypeFilter === 'powerpoint' ? 'bg-white text-amber-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Presentation className="w-3.5 h-3.5" /> PPTs ({stats.presentations})
            </button>
          </div>
        </div>

        {/* Category filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold text-[11px] shrink-0 mr-1">Category:</span>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-all ${
                selectedCategoryFilter === cat 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Table / Card Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Loading library resources...</p>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Library className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No resources found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {resources.length === 0 
                ? 'No textbooks, PDFs, or PowerPoint presentations added yet. Click "Seed High-Yield Library" or add a new resource above.' 
                : 'No items match the current search filters.'}
            </p>
          </div>
          {resources.length === 0 && (
            <Button onClick={handleSeedResources} className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-2">
              <Sparkles className="w-4 h-4" /> Seed Starter Library Now
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredResources.map(resource => {
            const isBook = resource.resourceType === 'book';
            const isPdf = resource.resourceType === 'pdf';
            const isPpt = resource.resourceType === 'powerpoint';

            return (
              <div 
                key={resource.id} 
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Top Bar with Type Badge & Actions */}
                  <div className="p-4 pb-3 flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/60">
                    <div className="flex items-center gap-2">
                      {isBook && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">
                          <BookOpen className="w-3 h-3" /> Textbook
                        </span>
                      )}
                      {isPdf && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md">
                          <FileText className="w-3 h-3" /> PDF Guide
                        </span>
                      )}
                      {isPpt && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                          <Presentation className="w-3 h-3" /> PowerPoint
                        </span>
                      )}

                      <span className="text-[11px] font-semibold bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-md">
                        {resource.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(resource)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Edit Resource"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => resource.id && handleDeleteResource(resource.id, resource.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Delete Resource"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Resource Details Body */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                        {resource.title}
                      </h3>
                      {resource.subtitle && (
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{resource.subtitle}</p>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <p><strong className="text-slate-800">Author:</strong> {resource.author || 'Clinical Faculty'}</p>
                      {resource.edition && (
                        <p><strong className="text-slate-800">Edition:</strong> {resource.edition}</p>
                      )}
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                        {resource.fileSize && <span>Size: {resource.fileSize}</span>}
                        {resource.pageCount && <span>Pages: {resource.pageCount}</span>}
                        {resource.slideCount && <span>Slides: {resource.slideCount}</span>}
                      </div>
                    </div>

                    {resource.summary && (
                      <p className="text-xs text-slate-600 line-clamp-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {resource.summary}
                      </p>
                    )}

                    {/* Topics Tags */}
                    {resource.highYieldTopics && resource.highYieldTopics.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {resource.highYieldTopics.slice(0, 3).map((topic, i) => (
                          <span key={i} className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                            {topic}
                          </span>
                        ))}
                        {resource.highYieldTopics.length > 3 && (
                          <span className="text-[10px] text-slate-400 self-center">
                            +{resource.highYieldTopics.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Download Action */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Download className="w-3 h-3 text-slate-400" />
                    <span>{resource.downloadCount || 0} downloads</span>
                  </div>

                  <Button 
                    size="sm" 
                    onClick={() => handleTriggerDownload(resource)}
                    className="gap-1.5 text-xs h-8 bg-slate-900 hover:bg-blue-600 text-white transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download File
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add or Edit Resource */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingResource ? 'Edit Library Resource' : 'Add New Library Resource'}
                  </h3>
                  <p className="text-xs text-slate-500">Provide details for textbooks, downloadable PDFs, or PowerPoint presentations</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveResource} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Resource Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      resourceType: 'book',
                      fileName: prev.fileName?.replace(/\.(pptx|ppt)$/i, '.pdf') || 'Textbook_Reference.pdf' 
                    }))}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      formData.resourceType === 'book'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <div>
                      <p className="text-xs font-bold">Textbook</p>
                      <p className="text-[10px] text-slate-500 font-normal">For bookshelf</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      resourceType: 'pdf',
                      fileName: prev.fileName?.replace(/\.(pptx|ppt)$/i, '.pdf') || 'Study_Guide.pdf' 
                    }))}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      formData.resourceType === 'pdf'
                        ? 'border-rose-600 bg-rose-50/50 text-rose-950 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-rose-600" />
                    <div>
                      <p className="text-xs font-bold">Downloadable PDF</p>
                      <p className="text-[10px] text-slate-500 font-normal">Cheat sheets & notes</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      resourceType: 'powerpoint',
                      fileName: prev.fileName?.replace(/\.pdf$/i, '.pptx') || 'Lecture_Presentation.pptx' 
                    }))}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      formData.resourceType === 'powerpoint'
                        ? 'border-amber-600 bg-amber-50/50 text-amber-950 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Presentation className="w-4 h-4 text-amber-600" />
                    <div>
                      <p className="text-xs font-bold">PowerPoint (.pptx)</p>
                      <p className="text-[10px] text-slate-500 font-normal">Slide presentations</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Resource Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Saunders NCLEX Comprehensive Review"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs text-slate-900 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subtitle / Key Theme</label>
                  <input
                    type="text"
                    value={formData.subtitle || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="e.g. High-Yield Examination Manual"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs text-slate-900 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Author, Edition & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Author / Faculty</label>
                  <input
                    type="text"
                    value={formData.author || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                    placeholder="e.g. Linda Anne Silvestri, RN"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs text-slate-900 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Edition / Year</label>
                  <input
                    type="text"
                    value={formData.edition || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, edition: e.target.value }))}
                    placeholder="e.g. 9th Edition or 2026"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs text-slate-900 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Category</label>
                  <select
                    value={formData.category || 'Exam Prep'}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:border-blue-500 outline-none"
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* File Attachment & Direct Download Link */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    Downloadable File Configuration
                  </span>
                  <span className="text-[11px] text-slate-500">Supports .pdf, .pptx, .ppt</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Attach File from Device</label>
                    <input
                      type="file"
                      accept=".pdf,.pptx,.ppt,.doc,.docx"
                      onChange={handleFileUpload}
                      className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Or Paste Direct Download URL</label>
                    <input
                      type="url"
                      value={formData.fileUrl || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, fileUrl: e.target.value }))}
                      placeholder="https://example.com/lecture.pptx or Drive link"
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs text-slate-900 bg-white focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Display File Name</label>
                    <input
                      type="text"
                      value={formData.fileName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, fileName: e.target.value }))}
                      placeholder="e.g. Acid_Base_Disorders.pptx"
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs text-slate-900 bg-white focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">File Size</label>
                    <input
                      type="text"
                      value={formData.fileSize || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, fileSize: e.target.value }))}
                      placeholder="e.g. 5.4 MB"
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs text-slate-900 bg-white focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {formData.resourceType === 'powerpoint' ? 'Slide Count' : 'Page Count'}
                    </label>
                    <input
                      type="number"
                      value={formData.resourceType === 'powerpoint' ? (formData.slideCount || '') : (formData.pageCount || '')}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (formData.resourceType === 'powerpoint') {
                          setFormData(prev => ({ ...prev, slideCount: val }));
                        } else {
                          setFormData(prev => ({ ...prev, pageCount: val }));
                        }
                      }}
                      placeholder="e.g. 45"
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs text-slate-900 bg-white focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Summary Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Summary / Syllabus Description</label>
                <textarea
                  rows={3}
                  value={formData.summary || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                  placeholder="Outline key learning objectives, clinical cases, and exam relevance..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs text-slate-900 focus:border-blue-500 outline-none"
                />
              </div>

              {/* High-Yield Topics Tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">High-Yield Study Topics</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTopic();
                      }
                    }}
                    placeholder="e.g. ABG Interpretation, Potassium Shifts"
                    className="flex-1 p-2 border border-slate-200 rounded-lg text-xs text-slate-900 focus:border-blue-500 outline-none"
                  />
                  <Button type="button" variant="outline" onClick={handleAddTopic} className="text-xs shrink-0">
                    Add Tag
                  </Button>
                </div>

                {formData.highYieldTopics && formData.highYieldTopics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formData.highYieldTopics.map((topic, i) => (
                      <span 
                        key={i} 
                        className="inline-flex items-center gap-1 text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full"
                      >
                        {topic}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveTopic(i)}
                          className="hover:text-rose-600 text-blue-400 ml-1 font-bold"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  {isSaving ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Saving Resource...</>
                  ) : (
                    <>{editingResource ? 'Update Resource' : 'Publish to Library'}</>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
