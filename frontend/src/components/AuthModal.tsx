import React, { useState } from 'react';
import { useAuth, UserRole } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  X,
  Lock,
  Mail,
  Phone,
  User,
  MapPin,
  Sprout,
  Store,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'LOGIN' | 'REGISTER';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialTab = 'LOGIN' }) => {
  const { login, register, switchRole } = useAuth();
  const { language } = useLanguage();

  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>(initialTab);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [role, setRole] = useState<UserRole>('FARMER');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('Sri Sathya Sai');
  const [state, setState] = useState('Andhra Pradesh');
  const [pincode, setPincode] = useState('515591');

  // Farmer specific
  const [acreage, setAcreage] = useState('4.0');
  const [primaryCrop, setPrimaryCrop] = useState('Groundnut');
  const [farmingType, setFarmingType] = useState<'ORGANIC' | 'INTEGRATED' | 'CONVENTIONAL'>('INTEGRATED');

  // Vendor specific
  const [shopName, setShopName] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const res = await login(loginIdentifier, loginPassword);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Invalid credentials. Please verify email/phone and password.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password || !phone) {
      setError('Please provide all mandatory fields (Name, Phone, Email, Password)');
      return;
    }

    setIsSubmitting(true);
    const res = await register({
      name,
      phone,
      email,
      password,
      role,
      village,
      district,
      state,
      pincode,
      totalAcreage: parseFloat(acreage) || 3.0,
      primaryCrops: [primaryCrop],
      farmingType,
      shopName
    });
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Registration failed. Please check inputs.');
    }
  };

  const handleQuickDemo = async (demoRole: UserRole) => {
    await switchRole(demoRole);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-emerald-100 relative space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center pt-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 text-2xl mb-2">
            🌾
          </div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">
            {tab === 'LOGIN' ? 'Welcome Back to AgroDex' : 'Create Your Agriculture Account'}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {tab === 'LOGIN' ? 'Sign in to access your farm, marketplace & AI assistant' : 'Connect with farmers, shops, and agricultural experts'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-gray-100 p-1 rounded-2xl text-xs font-bold">
          <button
            onClick={() => { setTab('LOGIN'); setError(null); }}
            className={`flex-1 py-2 rounded-xl transition ${tab === 'LOGIN' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('REGISTER'); setError(null); }}
            className={`flex-1 py-2 rounded-xl transition ${tab === 'REGISTER' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500'}`}
          >
            Register / Onboard
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2 text-xs text-red-900">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {tab === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Email Address or Mobile Phone</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={e => setLoginIdentifier(e.target.value)}
                  placeholder="farmer@agrodex.com or 9848012345"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow transition active:scale-95 text-xs flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In to My Farm'}
            </button>

            {/* Quick 1-Click Demo Accounts */}
            <div className="pt-2 border-t border-gray-100">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block text-center mb-2">
                — Or 1-Click Instant Demo Login —
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('FARMER')}
                  className="p-2 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 text-left transition flex items-center gap-2"
                >
                  <span className="text-base">🌾</span>
                  <div>
                    <p className="font-bold text-[11px] text-gray-900 leading-tight">Farmer</p>
                    <p className="text-[9px] text-gray-500">Ramesh Patel</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('VENDOR')}
                  className="p-2 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 text-left transition flex items-center gap-2"
                >
                  <span className="text-base">🏪</span>
                  <div>
                    <p className="font-bold text-[11px] text-gray-900 leading-tight">Agri Vendor</p>
                    <p className="text-[9px] text-gray-500">Kadiri Depot</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('BUYER')}
                  className="p-2 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 text-left transition flex items-center gap-2"
                >
                  <span className="text-base">📦</span>
                  <div>
                    <p className="font-bold text-[11px] text-gray-900 leading-tight">Mandi Buyer</p>
                    <p className="text-[9px] text-gray-500">Wholesaler</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('ADMIN')}
                  className="p-2 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 text-left transition flex items-center gap-2"
                >
                  <span className="text-base">⚙️</span>
                  <div>
                    <p className="font-bold text-[11px] text-gray-900 leading-tight">Administrator</p>
                    <p className="text-[9px] text-gray-500">Platform Admin</p>
                  </div>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* REGISTER / ONBOARDING FORM */}
        {tab === 'REGISTER' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
            {/* Role Picker */}
            <div>
              <label className="font-bold text-gray-700 block mb-1">Select Your Primary Role:</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'FARMER', label: 'Farmer (రైతు)', icon: '🌾' },
                  { id: 'VENDOR', label: 'Vendor (Shop)', icon: '🏪' },
                  { id: 'BUYER', label: 'Produce Buyer', icon: '📦' }
                ].map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id as UserRole)}
                    className={`p-2 rounded-xl text-center border transition ${
                      role === r.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-extrabold shadow-2xs'
                        : 'border-gray-200 bg-gray-50/50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-base block">{r.icon}</span>
                    <span className="text-[10px] mt-0.5 block">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Personal Details */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Phone Number (+91)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98480 12345"
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ramesh@example.com"
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Create Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Village / Mandal</label>
                <input
                  type="text"
                  value={village}
                  onChange={e => setVillage(e.target.value)}
                  placeholder="Kadiri Rural"
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">District</label>
                <input
                  type="text"
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  placeholder="Sri Sathya Sai"
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Role Conditional Fields */}
            {role === 'FARMER' && (
              <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2">
                <span className="font-bold text-[11px] text-emerald-950 block">Farm Details:</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500 font-semibold block">Total Acres</label>
                    <input
                      type="number"
                      step="0.5"
                      value={acreage}
                      onChange={e => setAcreage(e.target.value)}
                      className="w-full p-2 rounded-lg bg-white border border-gray-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-semibold block">Primary Crop</label>
                    <input
                      type="text"
                      value={primaryCrop}
                      onChange={e => setPrimaryCrop(e.target.value)}
                      className="w-full p-2 rounded-lg bg-white border border-gray-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-semibold block">Farming Type</label>
                    <select
                      value={farmingType}
                      onChange={e => setFarmingType(e.target.value as any)}
                      className="w-full p-2 rounded-lg bg-white border border-gray-200 text-xs"
                    >
                      <option value="INTEGRATED">Integrated</option>
                      <option value="ORGANIC">Organic</option>
                      <option value="CONVENTIONAL">Conventional</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {role === 'VENDOR' && (
              <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-2">
                <span className="font-bold text-[11px] text-amber-950 block">Shop / Business Profile:</span>
                <div>
                  <label className="text-[10px] text-gray-500 font-semibold block">Shop / Business Name</label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={e => setShopName(e.target.value)}
                    placeholder="e.g. Sri Lakshmi Agri Inputs Depot"
                    className="w-full p-2 rounded-lg bg-white border border-gray-200"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow transition active:scale-95 text-xs"
            >
              {isSubmitting ? 'Registering...' : 'Create Account & Start Farming'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
