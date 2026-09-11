import React, { useState } from 'react';
import { MessageCircle, Phone, Copy, Check, ExternalLink, X } from 'lucide-react';

export function FloatingWhatsApp() {
  const [copied, setCopied] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const rawNumber = '18438437212';
  const displayPhone = '+1(843)843-7212';
  const whatsappUrl = `https://wa.me/${rawNumber}?text=${encodeURIComponent(
    'Hello NursePrep, I have an inquiry regarding the nursing prep exams and courses.'
  )}`;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(displayPhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  if (isMinimized) {
    return (
      <aside
        id="floating-whatsapp-minimized"
        aria-label="WhatsApp Contact"
        className="fixed left-2 sm:left-4 bottom-5 sm:bottom-6 z-40 transition-transform duration-200"
      >
        <button
          onClick={() => setIsMinimized(false)}
          className="group flex items-center gap-2 p-2.5 sm:p-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-lg hover:shadow-xl border-2 border-white/90 transition-all hover:scale-105 cursor-pointer"
          title="Open WhatsApp contact banner (+1 843 843 7212)"
          aria-label="Open WhatsApp contact banner"
        >
          <span className="relative flex items-center justify-center">
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-200 rounded-full" />
          </span>
          <span className="hidden sm:inline text-xs font-black tracking-wide pr-1">
            WhatsApp
          </span>
        </button>
      </aside>
    );
  }

  return (
    <aside
      id="floating-whatsapp-banner"
      aria-label="WhatsApp Contact Banner"
      className="fixed left-2 sm:left-4 bottom-5 sm:bottom-6 z-40 max-w-[calc(100vw-1rem)] transition-all duration-300 animate-in fade-in slide-in-from-left-4"
    >
      <div className="relative group bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-xl border border-emerald-500/40 p-2 sm:p-2.5 flex items-center gap-2.5 sm:gap-3 hover:border-emerald-400 transition-all">
        {/* Clickable WhatsApp link trigger */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 sm:gap-2.5 min-w-0 group/link"
          title="Chat with NursePrep on WhatsApp (+1 843 843 7212)"
        >
          {/* WhatsApp green icon bubble with pulse status */}
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shrink-0 shadow-md transition-transform group-hover/link:scale-105">
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 border border-slate-900" />
            </span>
          </div>

          {/* Text and phone number */}
          <div className="min-w-0 pr-0.5">
            <div className="flex items-center gap-1.5 leading-none mb-0.5 relative group/tooltip">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 cursor-help" title="Available 24/7">
                WhatsApp
              </span>
              <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover/tooltip:block bg-slate-900 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-md shadow-xl border border-emerald-500/40 whitespace-nowrap z-50 animate-in fade-in">
                Available 24/7
              </div>
              <span className="inline-block w-1 h-1 rounded-full bg-emerald-400" />
              <span className="text-[9px] text-slate-300 font-medium">
                Live Support
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="text-xs sm:text-sm font-extrabold text-white tracking-tight group-hover/link:text-emerald-300 transition-colors whitespace-nowrap font-mono">
                {displayPhone}
              </span>
              <ExternalLink className="w-3 h-3 text-slate-400 group-hover/link:text-emerald-300 shrink-0 ml-0.5" />
            </div>
          </div>
        </a>

        {/* Copy button & minimize control */}
        <div className="flex items-center gap-0.5 border-l border-slate-700/80 pl-1.5 shrink-0">
          <button
            onClick={handleCopy}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={copied ? "Copied!" : "Copy phone number"}
            aria-label="Copy phone number"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Minimize WhatsApp banner"
            aria-label="Minimize WhatsApp banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
