import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Send,
  User,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Paperclip,
  Image as ImageIcon
} from 'lucide-react';

interface ChatProps {
  initialRecipientId?: string;
}

export const Chat: React.FC<ChatProps> = ({ initialRecipientId }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string>(initialRecipientId || 'usr-vendor-1');
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const partners = [
    {
      id: 'usr-vendor-1',
      name: 'Sri Lakshmi Agri Inputs',
      role: 'VENDOR',
      qualification: 'Shop #14, Main Bazaar, Kadiri',
      avatar: '🏪',
      badge: 'Verified Dealer'
    },
    {
      id: 'usr-buyer-1',
      name: 'Kisan Mandi Traders',
      role: 'BUYER',
      qualification: 'Registered Mandi Wholesaler & Aggregator',
      avatar: '📦',
      badge: 'Certified Buyer'
    }
  ];

  const activePartner = partners.find(p => p.id === activePartnerId) || partners[0];

  const loadMessages = async () => {
    try {
      const res = await fetch(`/api/messages?recipientId=${activePartnerId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('agri_token')}` }
      });
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 4000);
    return () => clearInterval(interval);
  }, [activePartnerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const tempText = inputText;
    setInputText('');

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('agri_token')}`
        },
        body: JSON.stringify({
          recipientId: activePartnerId,
          content: tempText
        })
      });

      if (res.ok) {
        loadMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden h-[calc(100vh-140px)] md:h-[calc(100vh-120px)]">
      {/* Left Contacts Sidebar */}
      <div className="border-r border-gray-100 p-4 space-y-3 bg-gray-50/50">
        <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider">
          Direct Agricultural Consultations
        </h3>

        <div className="space-y-2">
          {partners.map(p => (
            <button
              key={p.id}
              onClick={() => setActivePartnerId(p.id)}
              className={`w-full p-3 rounded-2xl text-left transition flex items-start gap-3 border ${
                activePartnerId === p.id
                  ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm'
                  : 'bg-white text-gray-800 border-gray-100 hover:border-emerald-200'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl shrink-0">
                {p.avatar}
              </div>
              <div className="flex-1 overflow-hidden">
                <span className={`text-[10px] font-bold uppercase block ${activePartnerId === p.id ? 'text-amber-300' : 'text-emerald-700'}`}>
                  {p.badge}
                </span>
                <h4 className="font-extrabold text-xs truncate mt-0.5">{p.name}</h4>
                <p className={`text-[10px] truncate mt-0.5 ${activePartnerId === p.id ? 'text-emerald-100' : 'text-gray-400'}`}>
                  {p.qualification}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Chat Flow Viewport */}
      <div className="md:col-span-2 flex flex-col h-full bg-white">
        {/* Header */}
        <div className="p-3.5 border-b border-gray-100 flex items-center justify-between bg-emerald-50/40">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{activePartner.avatar}</span>
            <div>
              <h4 className="font-extrabold text-sm text-gray-900">{activePartner.name}</h4>
              <p className="text-[10px] text-emerald-800 font-semibold">{activePartner.qualification}</p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
            Online
          </span>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-xs">
              No previous messages with {activePartner.name}. Start a conversation below!
            </div>
          ) : (
            messages.map(m => {
              const isMine = m.senderId === user?.id;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isMine
                        ? 'bg-emerald-700 text-white rounded-tr-xs'
                        : 'bg-gray-100 text-gray-800 rounded-tl-xs'
                    }`}
                  >
                    <p>{m.content}</p>
                    <span className={`text-[9px] block mt-1 ${isMine ? 'text-emerald-200 text-right' : 'text-gray-400'}`}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Send Box */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 bg-gray-50 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={`Message ${activePartner.name}...`}
            className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-2xl shadow transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
