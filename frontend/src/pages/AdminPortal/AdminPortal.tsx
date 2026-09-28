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
  FileText
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [aiLogs, setAiLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'METRICS' | 'VENDORS' | 'AI_LOGS'>('METRICS');
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    try {
      const [oRes, uRes, aRes] = await Promise.all([
        fetch('/api/admin/overview', { headers: { Authorization: `Bearer ${localStorage.getItem('agri_token')}` } }),
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${localStorage.getItem('agri_token')}` } }),
        fetch('/api/admin/ai-logs', { headers: { Authorization: `Bearer ${localStorage.getItem('agri_token')}` } })
      ]);
      if (oRes.ok) setOverview(await oRes.json());
      if (uRes.ok) setUsers(await uRes.json());
      if (aRes.ok) setAiLogs(await aRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleVerifyVendor = async (vendorId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('agri_token')}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-gray-900 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold mb-2">
            <span>🛡️ Platform Governance & Supervision</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            AgriDex Administration Hub
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
            Supervise vendor licensing, moderate regulated agrochemicals, and monitor AI telemetry
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
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="py-3 font-bold text-gray-900">{u.name}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 text-emerald-800">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">{u.email}</td>
                    <td className="py-3 text-gray-600">{u.district}, {u.state}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Diagnostic Logs Tab */}
      {activeTab === 'AI_LOGS' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-extrabold text-sm text-gray-900">
            AI Crop Disease Inference Audit Logs ({aiLogs.length})
          </h3>

          <div className="space-y-3">
            {aiLogs.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No AI scans logged yet.</p>
            ) : (
              aiLogs.map(log => (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-extrabold text-gray-900 block">{log.suspectedIssue}</span>
                    <p className="text-[11px] text-gray-500 mt-0.5">Crop: {log.cropName} • Severity: {log.severity}</p>
                    <span className="text-[10px] text-gray-400">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-700">{log.confidenceScore}%</span>
                    <span className="text-[10px] text-gray-400 block font-semibold">Confidence</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
