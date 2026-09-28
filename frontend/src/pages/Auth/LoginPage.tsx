import React, { useState } from 'react';
import { useAuth, UserRole } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
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
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  Loader2
} from 'lucide-react';

interface LoginPageProps {
  setActiveTab: (tab: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ setActiveTab }) => {
  const { login, register, switchRole, user, isAuthenticated, logout } = useAuth();
  const { t, language } = useLanguage();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('yugandharreddy350@gmail.com');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [role, setRole] = useState<UserRole>('FARMER');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('+91 ');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regVillage, setRegVillage] = useState('');
  const [regDistrict, setRegDistrict] = useState('Sri Sathya Sai');
  const [regState, setRegState] = useState('Andhra Pradesh');
  const [regPincode, setRegPincode] = useState('515591');

  // Role specifics
  const [regAcreage, setRegAcreage] = useState('5.0');
  const [regPrimaryCrop, setRegPrimaryCrop] = useState('Groundnut');
  const [regFarmingType, setRegFarmingType] = useState<'ORGANIC' | 'INTEGRATED' | 'CONVENTIONAL'>('INTEGRATED');
  const [regShopName, setRegShopName] = useState('');
  const [regLicense, setRegLicense] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setError('Please enter your email/phone and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(loginIdentifier.trim(), loginPassword);
      if (res.success) {
        setSuccessMsg('Successfully signed in! Redirecting to dashboard...');
        setTimeout(() => {
          setActiveTab('home');
        }, 800);
      } else {
        setError(res.error || 'Invalid credentials. Please verify and try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error during login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim() || !regPhone.trim()) {
      setError('Name, phone, email, and password are required.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register({
        name: regName.trim(),
        phone: regPhone.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role,
        village: regVillage.trim() || 'Kadiri Mandal',
        district: regDistrict.trim(),
        state: regState.trim(),
        pincode: regPincode.trim(),
        totalAcreage: parseFloat(regAcreage) || 3.0,
        primaryCrops: [regPrimaryCrop],
        farmingType: regFarmingType,
        shopName: regShopName.trim(),
        licenseNumber: regLicense.trim()
      });

      if (res.success) {
        setSuccessMsg('Account registered successfully! Redirecting to your agricultural dashboard...');
        setTimeout(() => {
          if (role === 'VENDOR') setActiveTab('vendor-portal');
          else if (role === 'ADMIN') setActiveTab('admin-portal');
          else setActiveTab('home');
        }, 1000);
      } else {
        setError(res.error || 'Registration failed. Please check your details.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error during registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async (demoRole: UserRole) => {
    setError(null);
    setIsSubmitting(true);
    try {
      if (demoRole === 'FARMER') {
        const res = await login('yugandharreddy350@gmail.com', 'password123');
        if (res.success) {
          setSuccessMsg('Logged in as nani! Redirecting...');
          setTimeout(() => setActiveTab('home'), 700);
          return;
        }
      }
      await switchRole(demoRole);
      setSuccessMsg(`Switched to demo ${demoRole.toLowerCase()} account! Redirecting...`);
      setTimeout(() => {
        if (demoRole === 'VENDOR') setActiveTab('vendor-portal');
        else if (demoRole === 'ADMIN') setActiveTab('admin-portal');
        else if (demoRole === 'BUYER') setActiveTab('produce');
        else setActiveTab('home');
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Demo switch failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20 md:pb-8 pt-4">
      {/* Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100 text-center relative overflow-hidden">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 text-3xl mb-3 shadow-inner">
          🌾
        </div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          {mode === 'LOGIN' ? 'Sign In to AgroDex' : 'Join AgroDex Platform'}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-sm mx-auto">
          {mode === 'LOGIN'
            ? 'Access your farm management tools, AI crop diagnostics, input marketplace, and mandi buyers.'
            : 'Register your farm, agro-dealer depot, or mandi wholesale trading account.'}
        </p>

        {/* Tab switch */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl text-xs font-bold mt-5 max-w-xs mx-auto">
          <button
            type="button"
            onClick={() => { setMode('LOGIN'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 rounded-xl transition ${
              mode === 'LOGIN' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('REGISTER'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 rounded-xl transition ${
              mode === 'REGISTER' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500'
            }`}
          >
            Register / Onboard
          </button>
        </div>
      </div>

      {/* Error / Success Feedback Banners */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-900 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-900 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Currently logged in status banner */}
      {isAuthenticated && user && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-xs">
          <div>
            <span className="text-gray-500">Currently signed in as:</span>
            <p className="font-extrabold text-emerald-900">{user.name} ({user.role})</p>
            <span className="text-[11px] text-gray-400">{user.email}</span>
          </div>
          <button
            onClick={() => logout()}
            className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-700 text-gray-700 font-bold rounded-xl text-xs transition"
          >
            Sign Out
          </button>
        </div>
      )}

      {/* 1. SIGN IN FORM */}
      {mode === 'LOGIN' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100 space-y-5">
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">
                Email Address or 10-Digit Mobile Phone *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={e => setLoginIdentifier(e.target.value)}
                  placeholder="farmer@agrodex.com or 9848012345"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded text-emerald-600 accent-emerald-600"
                />
                <span>Remember this device</span>
              </label>
              <span className="text-[11px] text-emerald-700 font-bold hover:underline cursor-pointer">
                Forgot Password?
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow-lg transition active:scale-95 text-xs flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to AgroDex</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Demo Accounts */}
          <div className="pt-4 border-t border-gray-100">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block text-center mb-2.5">
              — Quick 1-Click Instant Demo Login —
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('FARMER')}
                className="p-2.5 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 text-left transition flex items-center gap-2"
              >
                <span className="text-xl">🌾</span>
                <div className="min-w-0">
                  <p className="font-bold text-[11px] text-gray-900 truncate">Farmer</p>
                  <p className="text-[10px] text-gray-500 truncate">nani</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('VENDOR')}
                className="p-2.5 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 text-left transition flex items-center gap-2"
              >
                <span className="text-xl">🏪</span>
                <div className="min-w-0">
                  <p className="font-bold text-[11px] text-gray-900 truncate">Agri Vendor</p>
                  <p className="text-[10px] text-gray-500 truncate">Kadiri Depot</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('BUYER')}
                className="p-2.5 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 text-left transition flex items-center gap-2"
              >
                <span className="text-xl">📦</span>
                <div className="min-w-0">
                  <p className="font-bold text-[11px] text-gray-900 truncate">Mandi Buyer</p>
                  <p className="text-[10px] text-gray-500 truncate">Wholesaler</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('ADMIN')}
                className="p-2.5 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 text-left transition flex items-center gap-2"
              >
                <span className="text-xl">⚙️</span>
                <div className="min-w-0">
                  <p className="font-bold text-[11px] text-gray-900 truncate">Admin</p>
                  <p className="text-[10px] text-gray-500 truncate">Platform Admin</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. REGISTRATION FORM */}
      {mode === 'REGISTER' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100 space-y-5">
          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
            {/* Role Picker */}
            <div>
              <label className="font-bold text-gray-700 block mb-1.5">
                Select Your Agricultural Role:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'FARMER', label: 'Farmer (రైతు)', icon: '🌾' },
                  { id: 'VENDOR', label: 'Vendor (Shop)', icon: '🏪' },
                  { id: 'BUYER', label: 'Produce Buyer', icon: '📦' }
                ].map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id as UserRole)}
                    className={`p-2.5 rounded-xl text-center border transition ${
                      role === r.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-extrabold shadow-2xs'
                        : 'border-gray-200 bg-gray-50/50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-lg block">{r.icon}</span>
                    <span className="text-[10px] mt-0.5 block">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Personal credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="e.g. nani"
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Mobile Phone Number *</label>
                <input
                  type="text"
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value)}
                  placeholder="+91 99515 18699"
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Email Address *</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="name@agrodex.com"
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Create Password *</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>
            </div>

            {/* Location fields */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="col-span-2">
                <label className="font-bold text-gray-700 block mb-1">Village / Mandal</label>
                <input
                  type="text"
                  value={regVillage}
                  onChange={e => setRegVillage(e.target.value)}
                  placeholder="e.g. Kadiri Rural"
                  className="w-full p-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">District</label>
                <input
                  type="text"
                  value={regDistrict}
                  onChange={e => setRegDistrict(e.target.value)}
                  className="w-full p-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Pincode</label>
                <input
                  type="text"
                  value={regPincode}
                  onChange={e => setRegPincode(e.target.value)}
                  className="w-full p-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Role specific profile fields */}
            {role === 'FARMER' && (
              <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-3">
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                  Farmer Specific Setup
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Total Acreage</label>
                    <input
                      type="number"
                      step="0.5"
                      value={regAcreage}
                      onChange={e => setRegAcreage(e.target.value)}
                      className="w-full p-2 rounded-xl border border-gray-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Primary Crop</label>
                    <input
                      type="text"
                      value={regPrimaryCrop}
                      onChange={e => setRegPrimaryCrop(e.target.value)}
                      className="w-full p-2 rounded-xl border border-gray-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Method</label>
                    <select
                      value={regFarmingType}
                      onChange={e => setRegFarmingType(e.target.value as any)}
                      className="w-full p-2 rounded-xl border border-gray-200 bg-white"
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
              <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-100 space-y-3">
                <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block">
                  Shop & Depot Credentials
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Agro Shop Name *</label>
                    <input
                      type="text"
                      value={regShopName}
                      onChange={e => setRegShopName(e.target.value)}
                      placeholder="e.g. Sri Lakshmi Agri Inputs"
                      className="w-full p-2 rounded-xl border border-gray-200 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Seed / Fertilizer License</label>
                    <input
                      type="text"
                      value={regLicense}
                      onChange={e => setRegLicense(e.target.value)}
                      placeholder="e.g. AP/SSS/FERT/2023/910"
                      className="w-full p-2 rounded-xl border border-gray-200 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow-lg transition active:scale-95 text-xs flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering Account...</span>
                </>
              ) : (
                <>
                  <span>Create Agriculture Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
