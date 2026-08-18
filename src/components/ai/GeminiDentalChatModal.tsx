import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { db, collection, addDoc, doc, setDoc, serverTimestamp } from '../../lib/firebase';
import ReactMarkdown from 'react-markdown';
import {
  Bot,
  User as UserIcon,
  Send,
  Sparkles,
  Search,
  Globe,
  Zap,
  Brain,
  ShieldCheck,
  RotateCcw,
  X,
  ChevronDown,
  Layers,
  FileCheck,
  ExternalLink,
  MessageSquare,
  Copy,
  Check
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  groundingMetadata?: {
    webSearchQueries?: string[];
    searchChunks?: Array<{ web?: { uri?: string; title?: string } }>;
    groundingSupports?: any[];
  } | null;
  modelUsed?: string;
}

interface GeminiDentalChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCaseContext?: any;
}

const CROWNDESK_BOT_SYSTEM_PROMPT = `[STRICT IDENTITY & PERSONA MANDATE]
You are "crowndesk bot", the specialized Dental CAD Intelligence and Clinical Prosthodontics Assistant for the CrownDesk digital dental platform.

CRITICAL IDENTITY RULES:
1. Identity: You MUST strictly identify yourself as "crowndesk bot". Never say or suggest that you are Google Gemini, ChatGPT, Claude, or a generic AI model. When asked who you are, state that you are "crowndesk bot", the dedicated CrownDesk Dental CAD Technical Assistant.
2. Technical Persona: You are an expert prosthodontic and dental CAD/CAM specialist. Maintain an authoritative, professional, and precise technical demeanor at all times.
3. Domain Knowledge: Provide comprehensive, clinically validated guidance on:
   - Exocad, 3Shape, and Dental Wings design strategies
   - Margin finish lines (feather-edge, deep chamfer, rounded shoulder)
   - Minimal thickness requirements (Monolithic Zirconia 0.6–0.8mm, E.max 1.0–1.2mm, Titanium/CoCr 0.5mm, PMMA 1.0mm)
   - Multi-unit bridge connector cross-sectional areas (≥9 mm² anterior, ≥12–16 mm² posterior)
   - Emergence profiles, cement gaps, drill compensation, and dynamic occlusion clearance
   - Dental materials, sintering schedules, and 3D printing resin indications
4. Output Style: Use structured Markdown with crisp bullet points, bold key specifications, and clinically actionable takeaways.`;

export const GeminiDentalChatModal: React.FC<GeminiDentalChatModalProps> = ({
  isOpen,
  onClose,
  initialCaseContext
}) => {
  const { user } = useAuth();

  // Model selection state
  // Default to gemini-3.5-flash for general tasks, switchable to gemini-3.1-pro-preview or gemini-3.1-flash-lite
  const [model, setModel] = useState<'gemini-3.1-pro-preview' | 'gemini-3.5-flash' | 'gemini-3.1-flash-lite'>('gemini-3.5-flash');
  const [role, setRole] = useState<'cad_specialist' | 'clinical_analyst' | 'instant_assistant' | 'research_analyst'>('cad_specialist');
  const [enableSearch, setEnableSearch] = useState<boolean>(true);

  // Chat message history
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `👋 **Welcome to crowndesk bot!**

I am your CrownDesk intelligent assistant powered by Google Gemini models with **Search Grounding** & clinical prosthodontic knowledge.

**How can I assist you today?**
- 🦷 **Margin & Occlusion Analysis**: Check minimum wall thickness, prep taper, or connector dimensions for bridges.
- 🌐 **Live Dental Search**: Search current FDA-cleared milling pucks, 3D printing resins, or lab price benchmarks.
- ⚡ **Fast Turnaround Queries**: Ask about delivery timelines, rush CAD fees, or Exocad design parameters.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.5-flash'
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // When initialCaseContext changes, prepend or inject
  useEffect(() => {
    if (initialCaseContext && isOpen) {
      setRole('cad_specialist');
    }
  }, [initialCaseContext, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || loading) return;

    const userText = inputPrompt.trim();
    setInputPrompt('');

    const userMessage: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setLoading(true);

    try {
      // Map messages for Gemini API
      const formattedMessages = newHistory.map(m => ({
        role: m.role,
        text: m.text
      }));

      const response = await api.geminiChat({
        messages: formattedMessages,
        model,
        role,
        enableSearch,
        caseContext: initialCaseContext || null,
        customSystemPrompt: CROWNDESK_BOT_SYSTEM_PROMPT
      });

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        groundingMetadata: response.groundingMetadata || null,
        modelUsed: response.model || model
      };

      const updatedChat = [...newHistory, botMessage];
      setMessages(updatedChat);

      // Persist conversation session to Firestore
      if (user) {
        try {
          const chatDocRef = doc(collection(db, 'ai_chats'));
          await setDoc(chatDocRef, {
            id: chatDocRef.id,
            userId: user.id,
            model,
            role,
            searchGroundingEnabled: enableSearch,
            caseId: initialCaseContext?.caseId || null,
            lastMessage: userText,
            messagesCount: updatedChat.length,
            updatedAt: new Date().toISOString()
          });
        } catch (fbErr) {
          console.warn('Firestore chat persistence note:', fbErr);
        }
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: `⚠️ **Unable to complete request.** ${err.message || 'Please check your connection and retry.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuickPrompt = (prompt: string, targetModel?: 'gemini-3.1-pro-preview' | 'gemini-3.5-flash' | 'gemini-3.1-flash-lite') => {
    if (targetModel) setModel(targetModel);
    setInputPrompt(prompt);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl h-[90vh] max-h-[850px] flex flex-col shadow-2xl overflow-hidden relative text-slate-100">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-slate-100">crowndesk bot</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Live
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-Turn Reasoning • Search Grounding • Clinical CAD Diagnostics
              </p>
            </div>
          </div>

          {/* Controls: Model & Search Grounding Toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Model Selector */}
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => setModel('gemini-3.1-pro-preview')}
                title="Use for complex multi-unit bridge mechanics, occlusion analysis & implant designs"
                className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                  model === 'gemini-3.1-pro-preview'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Brain className="w-3.5 h-3.5 text-blue-300" />
                <span className="hidden sm:inline">Complex</span> 3.1 Pro
              </button>

              <button
                type="button"
                onClick={() => setModel('gemini-3.5-flash')}
                title="Use for general case triage, pricing, and live search grounded queries"
                className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                  model === 'gemini-3.5-flash'
                    ? 'bg-cyan-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span className="hidden sm:inline">General</span> 3.5 Flash
              </button>

              <button
                type="button"
                onClick={() => setModel('gemini-3.1-flash-lite')}
                title="Use for super-fast turnaround times, short definitions & quick triage"
                className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                  model === 'gemini-3.1-flash-lite'
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden sm:inline">Fast</span> Flash-Lite
              </button>
            </div>

            {/* Google Search Grounding Toggle */}
            <button
              type="button"
              onClick={() => setEnableSearch(!enableSearch)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                enableSearch
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-sm'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Ground answers with live Google Search data (current materials, FDA clearances, price benchmarks)"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Google Search</span>
              <span className={`w-2 h-2 rounded-full ${enableSearch ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Role & Case Banner */}
        <div className="px-5 py-2 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Assistant Role:</span>
            <select
              value={role}
              onChange={e => setRole(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 font-medium focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="cad_specialist">Senior Dental CAD Specialist (Exocad/3Shape)</option>
              <option value="clinical_analyst">Clinical Prosthodontist (Scan/Margin Quality)</option>
              <option value="instant_assistant">Instant Lab Support Assistant (Turnaround/Pricing)</option>
              <option value="research_analyst">Dental Industry Researcher (FDA/Materials)</option>
            </select>
          </div>

          {initialCaseContext && (
            <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-lg text-cyan-300 text-[11px]">
              <Layers className="w-3.5 h-3.5" />
              <span>Grounded to Case <strong>{initialCaseContext.caseId || 'Active Case'}</strong> ({initialCaseContext.restorationType || 'CAD Unit'})</span>
            </div>
          )}
        </div>

        {/* Messages Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[88%] sm:max-w-[80%] ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  msg.role === 'user'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gradient-to-tr from-slate-800 to-slate-700 text-cyan-400 border border-slate-600'
                }`}
              >
                {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-2xl p-4 text-xs sm:text-sm relative group ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none shadow-md'
                    : 'bg-slate-950/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                }`}
              >
                {/* Content */}
                <div className="prose prose-invert prose-xs sm:prose-sm max-w-none break-words leading-relaxed">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>

                {/* Google Search Grounding Sources & Citations */}
                {msg.groundingMetadata?.searchChunks && msg.groundingMetadata.searchChunks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-400 mb-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      <span>Google Search Grounded Sources:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {msg.groundingMetadata.searchChunks.map((chunk, idx) => {
                        const uri = chunk.web?.uri;
                        const title = chunk.web?.title || 'Web Reference';
                        if (!uri) return null;
                        return (
                          <a
                            key={idx}
                            href={uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-700 rounded-lg text-[10px] text-cyan-300 transition hover:border-cyan-500"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[200px]">{title}</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Footer Info: Timestamp, Model, Copy Button */}
                <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-slate-400/80">
                  <div className="flex items-center gap-2">
                    <span>{msg.timestamp}</span>
                    {msg.modelUsed && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono text-[9px]">
                        {msg.modelUsed}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(msg.id, msg.text)}
                    className="opacity-0 group-hover:opacity-100 transition p-1 hover:text-slate-200"
                    title="Copy text"
                  >
                    {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 max-w-[80%] mr-auto">
              <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 text-cyan-400 border border-slate-700 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none p-4 text-xs text-slate-400 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>
                  {enableSearch
                    ? `Searching Google and reasoning with ${model}...`
                    : `Analyzing dental CAD requirements with ${model}...`}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px] scrollbar-none">
          <span className="text-slate-500 font-semibold flex items-center gap-1 flex-shrink-0">
            <Sparkles className="w-3 h-3 text-cyan-400" /> Quick Ask:
          </span>
          <button
            type="button"
            onClick={() => handleQuickPrompt('What is the minimum connector cross-section for a 3-unit posterior zirconia bridge?', 'gemini-3.1-pro-preview')}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-full text-slate-300 whitespace-nowrap transition"
          >
            🧠 3-Unit Bridge Connector Specs
          </button>
          <button
            type="button"
            onClick={() => handleQuickPrompt('Compare Katana STML vs 3M Lava Esthetic zirconia properties and indications in 2026', 'gemini-3.5-flash')}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-full text-slate-300 whitespace-nowrap transition"
          >
            🌐 2026 Zirconia Specs (Search)
          </button>
          <button
            type="button"
            onClick={() => handleQuickPrompt('What is CrownDesk standard turnaround time for single unit crowns vs full arch bridges?', 'gemini-3.1-flash-lite')}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-full text-slate-300 whitespace-nowrap transition"
          >
            ⚡ Turnaround Times
          </button>
          <button
            type="button"
            onClick={() => handleQuickPrompt('How do I handle tight interproximal contacts in Exocad without causing open contacts?', 'gemini-3.1-pro-preview')}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-full text-slate-300 whitespace-nowrap transition"
          >
            🦷 Exocad Contact Relief
          </button>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputPrompt}
              onChange={e => setInputPrompt(e.target.value)}
              placeholder="Ask crowndesk bot... (e.g. margin taper, bridge connector specs, Exocad parameters)"
              disabled={loading}
              className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-2xl pl-4 pr-10 py-3 text-xs sm:text-sm text-slate-100 focus:outline-none transition"
            />
            {enableSearch && (
              <div className="absolute right-3 top-3.5" title="Google Search Grounding Active">
                <Globe className="w-4 h-4 text-cyan-400 animate-pulse" />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!inputPrompt.trim() || loading}
            className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-cyan-500/25 transition disabled:opacity-50 flex items-center gap-2"
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
