import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import {
  Send,
  Bot,
  User,
  Paperclip,
  Mic,
  Sparkles,
  ShieldAlert,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';

interface AiAssistantProps {
  onOpenVoice: () => void;
  setActiveTab: (tab: string) => void;
  setSelectedProduct?: (product: any) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  suggestedActions?: string[];
  matchedProducts?: any[];
  safetyAdvisory?: string;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ onOpenVoice, setActiveTab }) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { addToCart } = useCart();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: language === 'te'
        ? 'నమస్కారం రమేష్ గారు! నేను మీ అగ్రిడెక్స్ AI వ్యవసాయ సహాయకుడిని. మీ కదిరి పొలంలోని వేరుశనగ మరియు టమాటా పంటల రక్షణ, ఎరువుల నిర్వహణ, నీటి తడులు లేదా విత్తనాల గురించి మీకు ఎలాంటి సందేహం ఉన్నా అడగండి.'
        : language === 'hi'
        ? 'नमस्ते रमेश जी! मैं आपका एग्रीडेक्स एआई कृषि सहायक हूँ। आपके खेत में लगी मूंगफली और टमाटर की फसल, खाद, दवाओं या सिंचाई से संबंधित कोई भी सवाल पूछें।'
        : 'Hello Ramesh Patel! I am your AgriDex AI farming copilot. I am tuned to your farm in Kadiri, your standing Groundnut (K-6) and Tomato crops, and local Red Loamy soil fertility. How can I assist you today?',
      timestamp: 'Just now',
      suggestedActions: [
        'What fertilizer should I use for groundnut?',
        'My leaves are turning yellow.',
        'When should I irrigate?',
        'Where can I buy urea near me?'
      ]
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!overrideText) setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('agri_token')}`
        },
        body: JSON.stringify({
          message: textToSend,
          language
        })
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedActions: data.suggestedActions,
          matchedProducts: data.matchedProducts
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error('AI service error');
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: 'Unable to connect to the AI Gateway right now. Please check your network connection.',
          timestamp: 'Just now'
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-120px)] bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden">
      {/* Header bar */}
      <div className="bg-emerald-800 text-white p-4 flex items-center justify-between border-b border-emerald-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-2xl border border-white/20">
            🤖
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base tracking-tight">AI Farming Assistant</h2>
              <span className="text-[10px] font-bold bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full">
                Active Context
              </span>
            </div>
            <p className="text-xs text-emerald-200">
              Sri Venkateswara Farm • Kadiri (Groundnut & Tomato)
            </p>
          </div>
        </div>

        <button
          onClick={onOpenVoice}
          className="p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-amber-300 border border-emerald-500/50 shadow-sm transition active:scale-95 flex items-center gap-1.5 text-xs font-semibold"
        >
          <Mic className="w-4 h-4" />
          <span className="hidden sm:inline">Ask by Voice</span>
        </button>
      </div>

      {/* Safety Banner */}
      <div className="bg-amber-50/80 px-4 py-2 border-b border-amber-200/60 flex items-center gap-2 text-xs text-amber-900">
        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
        <span className="text-[11px] leading-tight">
          <strong>AI Safety Notice:</strong> AI advice is for agronomic guidance. Follow printed pesticide labels and consult agricultural experts for high-risk or uncertain cases.
        </span>
      </div>

      {/* Message Chat Flow */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-amber-500 text-white'
                  : 'bg-emerald-700 text-white'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[85%] rounded-3xl p-4 text-sm leading-relaxed shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-xs'
                  : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-xs'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {/* Matched Products Card inside AI Response */}
              {msg.matchedProducts && msg.matchedProducts.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200/60">
                  <p className="text-[11px] font-extrabold text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5" /> Certified Inputs Available in Kadiri:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {msg.matchedProducts.map(p => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-xl bg-white border border-gray-200 shadow-xs flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <img
                            src={p.images?.[0] || 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=100'}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0"
                          />
                          <div className="truncate">
                            <p className="font-bold text-xs text-gray-900 truncate">{p.name}</p>
                            <p className="text-[10px] text-gray-500">₹{p.price} • {p.packSize}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            addToCart(p);
                            setActiveTab('cart');
                          }}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shrink-0 transition"
                        >
                          Buy
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick follow-up action chips */}
              {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-gray-200/40">
                  {msg.suggestedActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (action === 'Scan Leaf Photo' || action === 'Scan My Crop') {
                          setActiveTab('scan');
                        } else if (action === 'Check Soil Health') {
                          setActiveTab('soil');
                        } else if (action === 'Agri Input Store' || action === 'Buy Urea / DAP') {
                          setActiveTab('store');
                        } else if (action === 'Sell Produce') {
                          setActiveTab('produce');
                        } else {
                          handleSend(action);
                        }
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 text-[11px] font-semibold rounded-lg border border-emerald-200 shadow-2xs transition active:scale-95"
                    >
                      💡 {action}
                    </button>
                  ))}
                </div>
              )}

              <span
                className={`text-[10px] block mt-1.5 ${
                  msg.sender === 'user' ? 'text-emerald-100 text-right' : 'text-gray-400'
                }`}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs">
              🤖
            </div>
            <div className="bg-gray-100 px-4 py-2.5 rounded-2xl flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <div className="p-3 bg-gray-50 border-t border-gray-100">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={() => setActiveTab('scan')}
            className="p-2.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition"
            title="Scan Crop Image"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onOpenVoice}
            className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-xl transition"
            title="Voice input"
          >
            <Mic className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={
              language === 'te'
                ? 'మీ ప్రశ్నను ఇక్కడ అడగండి (ఉదా: వేరుశనగ ఎరువులు)...'
                : language === 'hi'
                ? 'अपना कृषि प्रश्न यहाँ लिखें...'
                : 'Ask a farming question (e.g., groundnut fertilizer dosage)...'
            }
            className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />

          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-2xl shadow-md transition active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
