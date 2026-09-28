import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  X,
  Server,
  Cloud,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [serviceKey, setServiceKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [status, setStatus] = useState<{
    configured: boolean;
    connected: boolean;
    url?: string;
    message?: string;
    tableCounts?: Record<string, number>;
  }>({ configured: false, connected: false });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/supabase/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.url) setUrl(data.url);
      }
    } catch (err) {
      console.error('Failed to get Supabase status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/supabase/test', { method: 'POST' });
      const data = await res.json();
      if (data.connected) {
        setFeedback({ type: 'success', message: data.message || 'Connected to Supabase PostgreSQL database!' });
        fetchStatus();
      } else {
        setFeedback({ type: 'error', message: data.message || 'Connection failed' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Network error while testing connection.' });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      setFeedback({ type: 'error', message: 'Project URL and Anon Public Key are required.' });
      return;
    }

    setTesting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/supabase/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          anonKey: anonKey.trim(),
          serviceKey: serviceKey.trim() || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.testResult?.connected) {
        setFeedback({ type: 'success', message: 'Supabase configuration saved & verified successfully!' });
        fetchStatus();
      } else {
        setFeedback({
          type: 'error',
          message: data.testResult?.message || data.error || 'Saved, but could not connect to tables. Please ensure you ran the SQL schema.'
        });
        fetchStatus();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save configuration.' });
    } finally {
      setTesting(false);
    }
  };

  const handleCopySchema = async () => {
    try {
      const res = await fetch('/api/supabase/schema');
      if (res.ok) {
        const sql = await res.text();
        await navigator.clipboard.writeText(sql);
        setCopiedSql(true);
        setTimeout(() => setCopiedSql(false), 3000);
      }
    } catch (err) {
      console.error('Failed to copy schema:', err);
    }
  };

  const handleSyncData = async () => {
    setSyncing(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/supabase/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const counts = Object.entries(data.syncedCounts)
          .map(([tbl, c]) => `${c} ${tbl}`)
          .join(', ');
        setFeedback({
          type: 'success',
          message: `Successfully synced local records to Supabase: ${counts}!`
        });
        fetchStatus();
      } else {
        setFeedback({
          type: 'error',
          message: `Sync partially failed: ${data.errors?.join('; ') || 'Check table schema.'}`
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Sync failed.' });
    } finally {
      setSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-emerald-100 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/30 flex items-center justify-center border border-emerald-400/40 text-xl shadow-inner">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">Connect Supabase Cloud Database</h3>
                <span className="text-[10px] font-black bg-emerald-400 text-emerald-950 px-2 py-0.5 rounded-full uppercase">
                  PostgreSQL
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                Production-grade cloud database hosting for AgriDex farmers & markets
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

        {/* Live Status Header Strip */}
        <div className="bg-stone-50 px-6 py-3.5 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className={`w-3 h-3 rounded-full ${status.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="font-bold text-gray-800">
              Connection Status:
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
              status.connected
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-amber-100 text-amber-900 border-amber-300'
            }`}>
              {status.connected ? '✓ Connected to Supabase Cloud' : status.configured ? '⚠️ Credentials Saved (Tables Not Ready)' : '🔴 Not Connected'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {status.configured && (
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="px-3 py-1 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-1 transition"
              >
                {testing && <RefreshCw className="w-3 h-3 animate-spin" />}
                {testing ? 'Testing...' : 'Test Ping'}
              </button>
            )}
            <button
              type="button"
              onClick={handleSyncData}
              disabled={syncing || !status.connected}
              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition disabled:opacity-40 flex items-center gap-1"
            >
              {syncing && <RefreshCw className="w-3 h-3 animate-spin" />}
              {syncing ? 'Syncing...' : 'Sync Local Data'}
            </button>
          </div>
        </div>

        {/* Step Guide Tabs */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Quick Guide Steps */}
          <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-4">
            <button
              onClick={() => setActiveStep(1)}
              className={`p-2.5 rounded-xl text-left border transition ${
                activeStep === 1 ? 'border-emerald-600 bg-emerald-50/50 shadow-xs' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span className="text-[10px] font-extrabold text-emerald-800 block">STEP 1</span>
              <span className="text-xs font-bold text-gray-900 block truncate">1. Create Project</span>
            </button>
            <button
              onClick={() => setActiveStep(2)}
              className={`p-2.5 rounded-xl text-left border transition ${
                activeStep === 2 ? 'border-emerald-600 bg-emerald-50/50 shadow-xs' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span className="text-[10px] font-extrabold text-emerald-800 block">STEP 2</span>
              <span className="text-xs font-bold text-gray-900 block truncate">2. Run SQL Schema</span>
            </button>
            <button
              onClick={() => setActiveStep(3)}
              className={`p-2.5 rounded-xl text-left border transition ${
                activeStep === 3 ? 'border-emerald-600 bg-emerald-50/50 shadow-xs' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span className="text-[10px] font-extrabold text-emerald-800 block">STEP 3</span>
              <span className="text-xs font-bold text-gray-900 block truncate">3. Paste Keys</span>
            </button>
          </div>

          {/* Step 1 Content */}
          {activeStep === 1 && (
            <div className="space-y-4 p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-gray-700">
              <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                <span>1️⃣ Create your free Supabase Project</span>
              </h4>
              <p>
                Supabase offers a free cloud PostgreSQL database with generous free limits, real-time sync, and instant REST APIs.
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-800 font-medium">
                <li>Go to <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-700 font-bold underline inline-flex items-center gap-1">supabase.com <ExternalLink className="w-3 h-3" /></a> and sign in with GitHub or email.</li>
                <li>Click <strong>"New Project"</strong>.</li>
                <li>Choose a name (e.g. <code>agridex-db</code>), set a secure database password, and choose your nearest region (e.g. <strong>Mumbai / India</strong>).</li>
                <li>Wait 60 seconds for the project to provision.</li>
              </ol>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center gap-1.5 transition active:scale-95"
                >
                  Continue to Step 2: Run SQL Schema <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2 Content */}
          {activeStep === 2 && (
            <div className="space-y-4 p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-gray-700">
              <h4 className="font-extrabold text-sm text-gray-900 flex items-center justify-between">
                <span>2️⃣ Run the AgriDex Database Schema</span>
                <button
                  type="button"
                  onClick={handleCopySchema}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSql ? 'Copied to Clipboard!' : 'Copy Schema SQL'}
                </button>
              </h4>
              <p>
                AgriDex includes an automated migration script that creates all 17 tables (users, farms, crops, products, orders, produce listings, market prices, and notifications) with proper indexes.
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-800 font-medium">
                <li>In your Supabase project dashboard, click <strong>"SQL Editor"</strong> in the left sidebar.</li>
                <li>Click <strong>"New query"</strong>.</li>
                <li>Click the green <strong>"Copy Schema SQL"</strong> button above, paste into the editor, and click <strong>"Run"</strong> (or press Cmd/Ctrl + Enter).</li>
                <li>You will see <code>Success. No rows returned</code> — your cloud database tables are now ready!</li>
              </ol>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center gap-1.5 transition active:scale-95"
                >
                  Continue to Step 3: Enter Credentials <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Configuration Form */}
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
              <span>3️⃣ Enter Your Supabase API Keys</span>
            </h4>
            <p className="text-xs text-gray-500">
              In Supabase dashboard, go to <strong>Project Settings → API</strong> to find your URL and Anon Key.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">
                Project URL <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://xyzabcdefghijklm.supabase.co"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">
                Project API Anon Public Key <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={e => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                <span>Service Role Secret (Optional for full backend admin sync)</span>
                <span className="text-[10px] text-gray-400">service_role</span>
              </label>
              <input
                type="password"
                value={serviceKey}
                onChange={e => setServiceKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            {feedback && (
              <div className={`p-3.5 rounded-xl text-xs flex items-start gap-2 border ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border-rose-200'
              }`}>
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={testing}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold shadow-md transition active:scale-95 flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                {testing ? 'Testing & Saving...' : 'Save & Connect to Supabase'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
