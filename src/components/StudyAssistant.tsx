import React, { useState, useEffect, useRef } from 'react';
import { BrainCircuit, Send, Sparkles, RefreshCw, Copy, Check, BookOpen, Lightbulb, HelpCircle, Layers, Maximize2, Minimize2, AlertCircle } from 'lucide-react';
import { NURSING_UNITS } from '@/data/quizQuestions';
import { sanitizeInput } from '@/lib/security';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface StudyAssistantProps {
  mode?: 'compact' | 'full';
  initialUnit?: string;
  onExpand?: () => void;
}

const PRESET_TOPICS = [
  { label: '👶 Toddler Milestones', query: 'What are key developmental milestones for toddlers in NCLEX Pediatrics?' },
  { label: '💊 High-Alert Meds (ISMP)', query: 'What are the top high-alert medications in nursing and priority safety checks?' },
  { label: '🫀 ABCs vs Maslow', query: 'Explain how to prioritize NCLEX questions using ABCs and Maslow Hierarchy.' },
  { label: '🧪 Essential Lab Values', query: 'Give me a quick cheat sheet for Potassium, Sodium, Calcium, and Digoxin therapeutic levels.' },
  { label: '🩸 Blood Transfusion Protocol', query: 'What are the essential priority nursing actions during a suspected blood transfusion reaction?' },
];

export function StudyAssistant({ mode = 'compact', initialUnit = 'All', onExpand }: StudyAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      role: 'assistant',
      text: "Hello! I am **NursePrep AI**, your personal NCLEX-RN study assistant and clinical mentor. Ask me any nursing question, prompt me for a memory mnemonic, or ask for flashcards on any topic!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedUnit, setSelectedUnit] = useState(initialUnit);
  const [assistantMode, setAssistantMode] = useState<'general' | 'mnemonic' | 'flashcards' | 'rationale'>('general');
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const rawText = textToSend || inputMessage;
    const cleanPrompt = sanitizeInput(rawText);

    if (!cleanPrompt) return;

    setErrorText(null);
    const userMsgId = `usr-${Date.now()}`;
    const userMessage: Message = {
      id: userMsgId,
      role: 'user',
      text: cleanPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      // Build history payload for server
      const historyPayload = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        text: m.text
      }));

      const res = await fetch('/api/study-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cleanPrompt,
          history: historyPayload,
          unit: selectedUnit,
          mode: assistantMode
        })
      });

      let data: any = {};
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}. ${text.slice(0, 80) ? 'Check API server configuration.' : ''}`);
        }
      }

      if (!res.ok) {
        throw new Error(data.error || `Server error (${res.status}): Failed to reach AI Study Assistant.`);
      }

      const assistantMsg: Message = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        text: data.reply || "I couldn't process your question right now.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Study assistant send error:', err);
      setErrorText(err.message || 'Error communicating with Study Assistant');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReset = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        role: 'assistant',
        text: "Session reset! What topic or NCLEX clinical concept would you like to explore next?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setErrorText(null);
  };

  // Simple Markdown text formatter helper
  const renderFormattedText = (content: string) => {
    // Split into paragraphs or line blocks
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Bold syntax **text**
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li 
            key={idx} 
            className="ml-4 list-disc my-1 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^[-*]\s+/, '') }}
          />
        );
      }
      if (line.trim().startsWith('**Q:**') || line.trim().startsWith('Q:')) {
        return (
          <div key={idx} className="bg-slate-800/80 p-2.5 rounded-md my-2 border-l-4 border-amber-400 font-medium">
            <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
          </div>
        );
      }
      if (line.trim().startsWith('**A:**') || line.trim().startsWith('A:')) {
        return (
          <div key={idx} className="bg-slate-800/50 p-2.5 rounded-md mb-3 border-l-4 border-emerald-400 text-slate-200">
            <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
          </div>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="my-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedLine }} />
      );
    });
  };

  return (
    <div className={`bg-slate-900 text-white rounded-xl flex flex-col border border-slate-800 shadow-xl overflow-hidden ${
      mode === 'full' ? 'h-[750px] w-full' : 'min-h-[380px] h-full'
    }`}>
      {/* Header */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">NursePrep AI Assistant</h3>
              <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400">NCLEX Clinical Judgment Tutor</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleReset} 
            title="Reset Chat Session"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {mode === 'compact' && onExpand && (
            <button 
              onClick={onExpand}
              title="Expand Study Assistant"
              className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mode & Domain Controls Bar */}
      <div className="bg-slate-900/90 px-3 py-2 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
        {/* Mode Selectors */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'general', label: 'Clinical QA', icon: Sparkles },
            { id: 'mnemonic', label: 'Mnemonics', icon: Lightbulb },
            { id: 'flashcards', label: 'Flashcards', icon: BookOpen },
            { id: 'rationale', label: 'Rationale', icon: HelpCircle },
          ].map((m) => {
            const Icon = m.icon;
            const isActive = assistantMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setAssistantMode(m.id as any)}
                className={`px-2.5 py-1 rounded-md font-medium text-[11px] flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3 h-3" />
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Unit Selector */}
        <div className="flex items-center gap-1 text-[11px]">
          <span className="text-slate-500 font-medium hidden sm:inline">Focus:</span>
          <select 
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-[11px] outline-none focus:border-blue-500"
          >
            <option value="All">All Domains</option>
            {NURSING_UNITS.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className={`max-w-[88%] rounded-xl p-3.5 ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-xs shadow-md' 
                : 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-bl-xs shadow-sm'
            }`}>
              {msg.role === 'assistant' && (
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-700/60 text-[10px] text-slate-400">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <BrainCircuit className="w-3 h-3" /> NursePrep AI
                  </span>
                  <button 
                    onClick={() => handleCopyText(msg.id, msg.text)}
                    className="hover:text-white transition-colors flex items-center gap-0.5"
                    title="Copy response"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}
              
              <div className="space-y-1">
                {renderFormattedText(msg.text)}
              </div>

              <div className={`text-[9px] mt-2 text-right ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-500'}`}>
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2">
            <div className="bg-slate-800/90 border border-slate-700/80 text-slate-300 p-3 rounded-xl rounded-bl-xs text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
              <span className="italic text-slate-400">NursePrep AI is generating nursing insights...</span>
            </div>
          </div>
        )}

        {errorText && (
          <div className="bg-rose-950/40 border border-rose-800/60 text-rose-300 p-3 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorText}</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Topics Presets (compact row above input) */}
      {messages.length < 4 && !isLoading && (
        <div className="px-3 py-1.5 bg-slate-950/60 border-t border-slate-800/80 overflow-x-auto flex gap-1.5 scrollbar-none">
          <span className="text-[10px] font-semibold text-slate-500 self-center shrink-0">Quick Ask:</span>
          {PRESET_TOPICS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(preset.query)}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-full whitespace-nowrap transition-colors border border-slate-700"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 shrink-0">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              assistantMode === 'mnemonic' ? "Topic for mnemonic (e.g. Digoxin toxicity symptoms)..." :
              assistantMode === 'flashcards' ? "Flashcard subject (e.g. Pediatric vital signs)..." :
              assistantMode === 'rationale' ? "Paste question stem or topic for rationale..." :
              "Ask NursePrep AI a nursing question..."
            }
            disabled={isLoading}
            className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none rounded-lg p-3 pr-10 text-xs text-white placeholder:text-slate-500 disabled:opacity-50"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputMessage.trim()}
            className="absolute right-2 p-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-md transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
