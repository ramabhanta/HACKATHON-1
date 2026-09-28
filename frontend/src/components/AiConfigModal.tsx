import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Key,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  RefreshCw,
  Cpu,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface AiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: (key: string) => void;
}

export const AiConfigModal: React.FC<AiConfigModalProps> = ({ isOpen, onClose, onKeySaved }) => {
  const [apiKey, setApiKey] = useState('');
  const [serverHasKey, setServerHasKey] = useState(false);
  const [activeModel, setActiveModel] = useState('AgriDex Live Knowledge Engine');
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [statusMessage, setStatusMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const storedKey = localStorage.getItem('agri_gemini_api_key') || '';
      setApiKey(storedKey);
      fetchStatus();
    }
  }, [isOpen]);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/ai/config');
      if (res.ok) {
        const data = await res.json();
        setServerHasKey(data.hasServerKey);
        setActiveModel(data.activeModel);
      }
    } catch (err) {
      console.error('Failed to fetch AI config:', err);
    }
  };

  const handleTestKey = async () => {
    const keyToTest = apiKey.trim();
    if (!keyToTest) {
      setTestStatus('ERROR');
      setStatusMessage('Please enter an API key to test.');
      return;
    }

    setTesting(true);
    setTestStatus('IDLE');
    setStatusMessage('');

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gemini-Key': keyToTest
        },
        body: JSON.stringify({
          message: 'Hello, confirm you are connected and state your agronomy model name in 1 sentence.',
          language: 'en'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.source === 'GEMINI_AI') {
          setTestStatus('SUCCESS');
          setStatusMessage('Verified! Connected directly to Google Gemini 1.5 Flash.');
        } else {
          setTestStatus('ERROR');
          setStatusMessage('Key accepted by gateway, but Gemini did not return a valid candidate.');
        }
      } else {
        const errData = await res.json();
        setTestStatus('ERROR');
        setStatusMessage(errData.error || 'Failed to authenticate with Gemini API.');
      }
    } catch (err: any) {
      setTestStatus('ERROR');
      setStatusMessage(err.message || 'Network error while testing API key.');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    const trimmed = apiKey.trim();
    setSaving(true);
    try {
      // 1. Save in localStorage for immediate client requests
      if (trimmed) {
        localStorage.setItem('agri_gemini_api_key', trimmed);
      } else {
        localStorage.removeItem('agri_gemini_api_key');
      }

      // 2. Save in backend config
      if (trimmed) {
        await fetch('/api/ai/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ geminiApiKey: trimmed })
        });
      }

      setTestStatus('SUCCESS');
      setStatusMessage('API Key saved successfully!');
      if (onKeySaved) onKeySaved(trimmed);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setTestStatus('ERROR');
      setStatusMessage('Saved locally, but server config update failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveKey = async () => {
    localStorage.removeItem('agri_gemini_api_key');
    setApiKey('');
    setTestStatus('IDLE');
    setStatusMessage('Key removed. Reverted to Live Agricultural Knowledge Engine.');
    if (onKeySaved) onKeySaved('');
  };

  if (!isOpen) return null;

  const hasAnyKey = Boolean(apiKey.trim() || serverHasKey);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-emerald-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-xl shadow-md">
              ⚡
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">AI Engine & API Key Settings</h3>
              <p className="text-xs text-emerald-200">
                Configure Google Gemini 1.5 Flash for Real AI Answers & Vision
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Active Model Indicator */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                hasAnyKey ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {hasAnyKey ? <Zap className="w-4 h-4 text-amber-600" /> : <Cpu className="w-4 h-4 text-emerald-600" />}
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                  Active Intelligence Mode
                </span>
                <span className="font-extrabold text-xs text-gray-900">
                  {hasAnyKey ? 'Google Gemini 1.5 Flash (Deep Neural AI)' : 'AgriDex Live Knowledge Engine (Live Wikipedia & Mandi Data)'}
                </span>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
              hasAnyKey
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}>
              {hasAnyKey ? '● Real AI Active' : '● Free Live Data'}
            </span>
          </div>

          {/* Key Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-700" />
                Google Gemini API Key
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-extrabold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 underline"
              >
                Get Free Key in 10s <ExternalLink className="w-3 h-3" />
              </a>
            </label>

            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <p className="text-[11px] text-gray-500 leading-tight">
              Paste your key from Google AI Studio. It powers natural conversational agriculture Q&A in any Indian language and deep visual leaf diagnosis.
            </p>
          </div>

          {/* Status Message */}
          {testStatus !== 'IDLE' && (
            <div className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
              testStatus === 'SUCCESS'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}>
              {testStatus === 'SUCCESS' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="font-medium">{statusMessage}</span>
            </div>
          )}

          {/* Features Enabled */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs space-y-1.5">
            <p className="font-extrabold text-emerald-950 text-[11px] uppercase tracking-wider">
              ✨ Capabilities Unlocked with Gemini Key:
            </p>
            <ul className="text-[11px] text-emerald-800 space-y-1 list-disc list-inside">
              <li>Exact agronomic answers for any Indian crop, pest, or fertilizer</li>
              <li>Real multimodal vision analysis of leaf photos uploaded via camera</li>
              <li>Multi-lingual support across all 11 Indian languages</li>
              <li>Automatic dosages, safety warnings, and certified product matching</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div>
              {apiKey && (
                <button
                  type="button"
                  onClick={handleRemoveKey}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 px-2 py-1"
                >
                  Clear Key
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestKey}
                disabled={testing || !apiKey.trim()}
                className="px-3.5 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {testing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {testing ? 'Testing...' : 'Test Key'}
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold shadow-md transition active:scale-95 flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save & Activate'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
