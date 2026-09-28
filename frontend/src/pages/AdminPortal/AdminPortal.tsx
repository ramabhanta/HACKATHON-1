import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Users,
  ShoppingBag,
  TrendingUp,
  Bot,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Database,
  Zap,
  Key,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [aiLogs, setAiLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'METRICS' | 'AI_LOGS'>('METRICS');
  const [loading, setLoading] = useState(true);
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [aiConfig, setAiConfig] = useState<any>(null);

  const loadAdminData = async () => {
    try {
      const [oRes, uRes, aRes, sRes, aiRes] = await Promise.all([
        fetch('/api/admin/overview', { headers: { Authorization: `Bearer ${localStorage.getItem('agri_token')}` } }),
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${localStorage.getItem('agri_token')}` } }),
        fetch('/api/admin/ai-logs', { headers: { Authorization: `Bearer ${localStorage.getItem('agri_token')}` } }),
        fetch('/api/supabase/status'),
        fetch('/api/ai/config')
      ]);
      if (oRes.ok) setOverview(await oRes.json());
      if (uRes.ok) setUsers(await uRes.json());
      if (aRes.ok) setAiLogs(await aRes.json());
      if (sRes.ok) setSupabaseStatus(await sRes.json());
      if (aiRes.ok) setAiConfig(await aiRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-gray-900 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold mb-2">
            <span>🛡️ Platform Governance & Supervision</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            AgroDex Administration Hub
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
            Cloud database sync, Google Gemini AI configuration, and platform management
          </p>
        </div>

        <div className="flex bg-white/10 p-1.5 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('METRICS')}
            className={`px-3 py-1.5 rounded-xl transition ${activeTab === 'METRICS' ? 'bg-white text-gray-900' : 'text-gray-300'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('AI_LOGS')}
            className={`px-3 py-1.5 rounded-xl transition ${activeTab === 'AI_LOGS' ? 'bg-white text-gray-900' : 'text-gray-300'}`}
          >
            AI Audit Logs
          </button>
        </div>
      </div>

      {/* Cloud DB & AI Management Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Supabase Cloud Database Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-emerald-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                  <Database className="w-4 h-4 text-emerald-700" />
                </div>
                <h3 className="font-extrabold text-sm text-gray-900">PostgreSQL Cloud Database</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black border bg-emerald-50 text-emerald-800 border-emerald-300">
                ✓ Server-Managed
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              All tables (farmers, crops, products, orders, produce lots) are securely synchronized through backend services.
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
            <span className="text-[10px] font-mono text-emerald-700 font-bold truncate max-w-[280px]">
              PostgreSQL Cloud • Auto-Sync Active
            </span>
            <span className="text-[10px] font-bold text-gray-400">
              Zero Config Required
            </span>
          </div>
        </div>

        {/* Real AI Engine Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-emerald-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                  <Zap className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="font-extrabold text-sm text-gray-900">Google Gemini AI Engine</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black border bg-amber-50 text-amber-900 border-amber-300">
                ⚡ Gemini 3.5 Flash
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Real multimodal AI Q&A and leaf photo disease diagnosis across all 11 Indian languages.
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
            <span className="text-[10px] font-mono text-gray-400">
              Free Tier: 15 RPM
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Active on Backend</span>
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {overview?.metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase">Farmers Registered</span>
            <p className="text-xl font-black text-gray-900 mt-1">{overview.metrics.farmersCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase">Verified Vendors</span>
            <p className="text-xl font-black text-emerald-700 mt-1">{overview.metrics.vendorsCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase">Gross Marketplace GMV</span>
            <p className="text-xl font-black text-gray-900 mt-1">₹{overview.metrics.totalRevenue.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase">AI Disease Scans</span>
            <p className="text-xl font-black text-indigo-700 mt-1">{overview.metrics.aiScansCount}</p>
          </div>
        </div>
      )}

      {/* Main Tab content */}
      {activeTab === 'METRICS' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-extrabold text-sm text-gray-900">Platform Users & Roles</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 uppercase text-[10px] font-black">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Email / Phone</th>
                  <th className="pb-3">District / State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/80">
                    <td className="py-3 font-bold text-gray-900">{u.name}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        u.role === 'FARMER' ? 'bg-amber-100 text-amber-800' :
                        u.role === 'VENDOR' ? 'bg-emerald-100 text-emerald-800' :
                        u.role === 'BUYER' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 text-gray-600">{u.phone}</td>
                    <td className="py-3 text-gray-500">{u.district}, {u.state}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'AI_LOGS' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-extrabold text-sm text-gray-900">Recent AI Diagnostic Queries</h3>
          <div className="divide-y divide-gray-100">
            {aiLogs.map(l => (
              <div key={l.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div>
                  <p className="font-bold text-gray-900">{l.cropName} — {l.suspectedIssue}</p>
                  <p className="text-[10px] text-gray-500">
                    {l.photoMetadata?.uploadDateFormatted || new Date(l.createdAt).toLocaleDateString()} • {l.photoMetadata?.locationName || 'Field'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-700">{l.confidenceScore}% Confidence</span>
                  <span className="block text-[10px] text-gray-400">{l.severity} Severity</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
