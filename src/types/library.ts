export type LibraryResourceType = 'book' | 'pdf' | 'powerpoint';

export interface StoredLibraryResource {
  id?: string;
  title: string;
  subtitle?: string;
  author?: string;
  edition?: string;
  category: string;
  resourceType: LibraryResourceType;
  fileUrl?: string; // Download URL or data URI or local blob
  fileName?: string; // e.g. "Pharmacology_HighYield_Flashcards.pdf", "Fluid_Electrolytes.pptx"
  fileSize?: string; // e.g. "4.8 MB"
  pageCount?: number;
  slideCount?: number;
  spineColor?: string;
  summary?: string;
  highYieldTopics?: string[];
  downloadCount?: number;
  createdAt: string;
  createdBy?: string;
}
