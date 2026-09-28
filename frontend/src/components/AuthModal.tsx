import React, { useState, useRef, useEffect } from 'react';
import { useAuth, UserRole } from '../context/AuthContext';
import {
  X,
  Lock,
  Phone,
  User,
  Sprout,
  Store,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
  Building2,
  Clock,
  RefreshCw,
  KeyRound,
  Check,
  Loader2
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'LOGIN' | 'REGISTER';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialTab = 'LOGIN' }) => {
  const { loginWithPassword, loginWithOtp, sendOtp, verifyOtp, register } = useAuth();

  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>(initialTab);
  const [signInMethod, setSignInMethod] = useState<'PASSWORD' | 'OTP'>('PASSWORD');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtpToast, setDevOtpToast] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sign In State
  const [loginPhone, setLoginPhone] = useState('9848012345');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginOtpDigits, setLoginOtpDigits] = useState(['', '', '', '', '', '']);

  // Progressive Registration State
  const [regStep, setRegStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedRole, setSelectedRole] = useState<UserRole>('FARMER');
  const [regPhone, setRegPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Profile fields
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regVillage, setRegVillage] = useState('Kadiri Rural');
  const [regDistrict, setRegDistrict] = useState('Sri Sathya Sai');
  const [regState, setRegState] = useState('Andhra Pradesh');
  const [regPincode, setRegPincode] = useState('515591');
  const [regAcreage, setRegAcreage] = useState('5.0');
  const [selectedCrops, setSelectedCrops] = useState<string[]>(['Groundnut', 'Tomato']);
  const [buyerCompany, setBuyerCompany] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopLicense, setShopLicense] = useState('');
  const [shopAddress, setShopAddress] = useState('Main Bazaar, Kadiri');

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const loginOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: any;
    if (isTimerRunning && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    } else if (countdown === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, countdown]);

  if (!isOpen) return null;

  const handlePhoneInputChange = (
    val: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const raw = val.replace(/[^0-9]/g, '');
    setter(raw.slice(0, 10));
  };

  const handleOtpBoxChange = (
    index: number,
    value: string,
    digitsArr: string[],
    setDigits: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    const char = value.slice(-1).replace(/[^0-9]/g, '');
    const nextArr = [...digitsArr];
    nextArr[index] = char;
    setDigits(nextArr);

    if (char && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
    digitsArr: string[],
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    if (e.key === 'Backspace' && !digitsArr[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  // Sign In with Password
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginPhone || loginPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setIsSubmitting(true);
    const res = await loginWithPassword(loginPhone, loginPassword);
    setIsSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Incorrect mobile number or password.');
    }
  };

  // Request Sign-In OTP
  const handleRequestLoginOtp = async () => {
    setError(null);
    if (!loginPhone || loginPhone.length < 10) {
      setError('Please enter a 10-digit mobile number.');
      return;
    }
    setIsSubmitting(true);
    const res = await sendOtp(loginPhone);
    setIsSubmitting(false);
    if (res.success) {
      setLoginOtpSent(true);
      setDevOtpToast(`OTP Sent! Code: ${res.devOtp || '123456'} (Master: 123456)`);
      setCountdown(60);
      setIsTimerRunning(true);
      setTimeout(() => loginOtpRefs.current[0]?.focus(), 100);
    } else {
      setError(res.error || 'Failed to send OTP.');
    }
  };

  // Verify Sign-In OTP
  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const code = loginOtpDigits.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }
    setIsSubmitting(true);
    const res = await loginWithOtp(loginPhone, code);
    setIsSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Invalid OTP code.');
    }
  };

  // Registration: Send OTP
  const handleRegSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!regPhone || regPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setIsSubmitting(true);
    const res = await sendOtp(regPhone);
    setIsSubmitting(false);
    if (res.success) {
      setDevOtpToast(`OTP sent to +91 ${regPhone}! Code: ${res.devOtp || '123456'} (Master: 123456)`);
      setRegStep(2);
      setCountdown(60);
      setIsTimerRunning(true);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } else {
      setError(res.error || 'Failed to send OTP.');
    }
  };

  // Registration: Verify OTP
  const handleRegVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const code = otpDigits.join('');
    if (code.length < 6) {
      setError('Please enter 6 digits.');
      return;
    }
    setIsSubmitting(true);
    const res = await verifyOtp(regPhone, code);
    setIsSubmitting(false);
    if (res.success) {
      setRegStep(3);
    } else {
      setError(res.error || 'Invalid OTP.');
    }
  };

  // Registration: Final Submission
  const handleRegFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!regName.trim() || !regPassword) {
      setError('Please provide your name and password/PIN.');
      return;
    }

    setIsSubmitting(true);
    const payload: any = {
      name: regName.trim(),
      phone: regPhone,
      password: regPassword,
      role: selectedRole,
      village: regVillage,
      district: regDistrict,
      state: regState,
      pincode: regPincode
    };

    if (selectedRole === 'FARMER') {
      payload.totalAcreage = parseFloat(regAcreage) || 3.0;
      payload.primaryCrops = selectedCrops;
    } else if (selectedRole === 'BUYER') {
      payload.companyName = buyerCompany || `${regName} Wholesale Mandi`;
      payload.preferredCrops = selectedCrops;
    } else if (selectedRole === 'VENDOR') {
      payload.shopName = shopName || `${regName}'s Agro Hub`;
      payload.licenseNumber = shopLicense || `AP/AGRI/${Math.floor(10000 + Math.random() * 90000)}`;
      payload.address = shopAddress;
    }

    const res = await register(payload);
    setIsSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Registration failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-emerald-100 relative space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center pt-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 text-2xl mb-2">
            📱
          </div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">
            {tab === 'LOGIN' ? 'Sign In with Mobile' : 'Register with Mobile Number'}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            100% Mobile Phone & SMS OTP progressive authentication
          </p>
        </div>

        {/* Testing Master OTP Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 flex items-center justify-between">
          <span>Master Testing OTP: <strong className="font-mono bg-amber-100 px-1 py-0.5 rounded">123456</strong></span>
          <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-200 px-2 py-0.5 rounded">Dev Mode</span>
        </div>

        {devOtpToast && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center justify-between">
            <span>{devOtpToast}</span>
            <button onClick={() => setDevOtpToast(null)} className="text-emerald-700 hover:underline">Dismiss</button>
          </div>
        )}

        {/* Tab switch */}
        <div className="flex bg-gray-100 p-1 rounded-2xl text-xs font-bold">
          <button
            onClick={() => { setTab('LOGIN'); setError(null); }}
            className={`flex-1 py-2 rounded-xl transition ${tab === 'LOGIN' ? 'bg-white text-emerald-800 shadow-sm font-black' : 'text-gray-500'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('REGISTER'); setRegStep(1); setError(null); }}
            className={`flex-1 py-2 rounded-xl transition ${tab === 'REGISTER' ? 'bg-white text-emerald-800 shadow-sm font-black' : 'text-gray-500'}`}
          >
            New Registration
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2 text-xs text-red-900 font-bold">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* RETURNING USER SIGN-IN                                   */}
        {/* ======================================================== */}
        {tab === 'LOGIN' && (
          <div className="space-y-3.5 text-xs">
            {/* Password vs OTP Switcher */}
            <div className="flex bg-stone-100 p-1 rounded-xl text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setSignInMethod('PASSWORD')}
                className={`flex-1 py-1.5 rounded-lg text-center transition ${signInMethod === 'PASSWORD' ? 'bg-white text-gray-900 shadow-sm' : 'text-stone-500'}`}
              >
                Mobile + Password
              </button>
              <button
                type="button"
                onClick={() => setSignInMethod('OTP')}
                className={`flex-1 py-1.5 rounded-lg text-center transition flex items-center justify-center gap-1 ${signInMethod === 'OTP' ? 'bg-white text-emerald-900 font-black shadow-sm' : 'text-stone-500'}`}
              >
                <KeyRound className="w-3 h-3 text-emerald-700" />
                <span>Login via SMS OTP</span>
              </button>
            </div>

            {signInMethod === 'PASSWORD' ? (
              <form onSubmit={handlePasswordLogin} className="space-y-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">10-Digit Mobile Number</label>
                  <div className="relative flex rounded-xl border border-gray-200 overflow-hidden focus-within:border-emerald-600">
                    <span className="bg-stone-100 px-3 py-2 text-xs font-bold text-gray-700 border-r border-gray-200">🇮🇳 +91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={loginPhone}
                      onChange={e => handlePhoneInputChange(e.target.value, setLoginPhone)}
                      placeholder="98480 12345"
                      className="w-full px-3 py-2 font-bold text-gray-900 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Password / PIN</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none pr-9 font-bold"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black rounded-2xl shadow transition text-xs flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign In to Agri Account</span>}
                </button>
              </form>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">10-Digit Mobile Number</label>
                  <div className="relative flex rounded-xl border border-gray-200 overflow-hidden focus-within:border-emerald-600">
                    <span className="bg-stone-100 px-3 py-2 text-xs font-bold text-gray-700 border-r border-gray-200">🇮🇳 +91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={loginPhone}
                      onChange={e => handlePhoneInputChange(e.target.value, setLoginPhone)}
                      disabled={loginOtpSent}
                      placeholder="98480 12345"
                      className="w-full px-3 py-2 font-bold text-gray-900 outline-none disabled:bg-stone-50"
                    />
                  </div>
                </div>

                {!loginOtpSent ? (
                  <button
                    type="button"
                    onClick={handleRequestLoginOtp}
                    disabled={isSubmitting || loginPhone.length < 10}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black rounded-2xl shadow text-xs flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send 6-Digit OTP via SMS</span>}
                  </button>
                ) : (
                  <form onSubmit={handleVerifyLoginOtp} className="space-y-3 animate-in fade-in">
                    <div className="grid grid-cols-6 gap-1.5">
                      {loginOtpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={el => (loginOtpRefs.current[idx] = el)}
                          type="text"
                          maxLength={1}
                          inputMode="numeric"
                          value={digit}
                          onChange={e => handleOtpBoxChange(idx, e.target.value, loginOtpDigits, setLoginOtpDigits, loginOtpRefs)}
                          onKeyDown={e => handleOtpKeyDown(idx, e, loginOtpDigits, loginOtpRefs)}
                          className="w-full h-11 text-center font-black text-base rounded-xl border border-gray-300 focus:border-emerald-600 outline-none"
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold">
                      {isTimerRunning ? (
                        <span>Resend in {countdown}s</span>
                      ) : (
                        <button type="button" onClick={handleRequestLoginOtp} className="text-emerald-700 hover:underline">
                          Resend OTP
                        </button>
                      )}
                      <span className="text-amber-700">Master: 123456</span>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || loginOtpDigits.join('').length < 6}
                      className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black rounded-2xl shadow text-xs flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify & Sign In</span>}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* PROGRESSIVE MULTI-STEP REGISTRATION                      */}
        {/* ======================================================== */}
        {tab === 'REGISTER' && (
          <div className="space-y-3.5 text-xs">
            {/* Step 1: Role & Phone */}
            {regStep === 1 && (
              <form onSubmit={handleRegSendOtp} className="space-y-3 animate-in fade-in">
                <div>
                  <label className="font-black text-gray-800 block mb-1.5 uppercase tracking-wider text-[11px]">
                    1. Choose Role:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('FARMER')}
                      className={`p-2.5 rounded-xl border text-center transition ${selectedRole === 'FARMER' ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-black' : 'border-gray-200 text-gray-600'}`}
                    >
                      <Sprout className="w-5 h-5 mx-auto mb-1 text-emerald-700" />
                      <span className="block text-[11px]">Farmer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('BUYER')}
                      className={`p-2.5 rounded-xl border text-center transition ${selectedRole === 'BUYER' ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-black' : 'border-gray-200 text-gray-600'}`}
                    >
                      <Building2 className="w-5 h-5 mx-auto mb-1 text-blue-700" />
                      <span className="block text-[11px]">Buyer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('VENDOR')}
                      className={`p-2.5 rounded-xl border text-center transition ${selectedRole === 'VENDOR' ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-black' : 'border-gray-200 text-gray-600'}`}
                    >
                      <Store className="w-5 h-5 mx-auto mb-1 text-amber-700" />
                      <span className="block text-[11px]">Agro Shop</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">2. 10-Digit Mobile Number</label>
                  <div className="relative flex rounded-xl border border-gray-200 overflow-hidden focus-within:border-emerald-600">
                    <span className="bg-stone-100 px-3 py-2 text-xs font-bold text-gray-700 border-r border-gray-200">🇮🇳 +91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={regPhone}
                      onChange={e => handlePhoneInputChange(e.target.value, setRegPhone)}
                      placeholder="98480 12345"
                      className="w-full px-3 py-2 font-bold text-gray-900 outline-none"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || regPhone.length < 10}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black rounded-2xl shadow text-xs flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Get OTP to Verify Mobile →</span>}
                </button>
              </form>
            )}

            {/* Step 2: OTP Verification */}
            {regStep === 2 && (
              <form onSubmit={handleRegVerifyOtp} className="space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span>Enter OTP sent to +91 {regPhone}</span>
                  <button type="button" onClick={() => setRegStep(1)} className="text-emerald-700 font-bold hover:underline">
                    Edit Number
                  </button>
                </div>

                <div className="grid grid-cols-6 gap-1.5">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => (otpInputRefs.current[idx] = el)}
                      type="text"
                      maxLength={1}
                      inputMode="numeric"
                      value={digit}
                      onChange={e => handleOtpBoxChange(idx, e.target.value, otpDigits, setOtpDigits, otpInputRefs)}
                      onKeyDown={e => handleOtpKeyDown(idx, e, otpDigits, otpInputRefs)}
                      className="w-full h-11 text-center font-black text-base rounded-xl border border-gray-300 focus:border-emerald-600 outline-none"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold">
                  {isTimerRunning ? <span>Resend in {countdown}s</span> : <span>Master OTP: 123456</span>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || otpDigits.join('').length < 6}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black rounded-2xl shadow text-xs flex items-center justify-center gap-2"
                >
                  <span>Verify & Set Up Profile →</span>
                </button>
              </form>
            )}

            {/* Step 3: Security & Basic Profile */}
            {regStep === 3 && (
              <form onSubmit={handleRegFinalSubmit} className="space-y-3 animate-in fade-in">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Patel"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Create PIN / Password *</label>
                  <input
                    type="password"
                    placeholder="Minimum 4 digits"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none font-bold"
                    required
                  />
                </div>

                {selectedRole === 'FARMER' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Village / Town</label>
                      <input
                        type="text"
                        value={regVillage}
                        onChange={e => setRegVillage(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">Land (Acres)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={regAcreage}
                        onChange={e => setRegAcreage(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 outline-none"
                      />
                    </div>
                  </div>
                )}

                {selectedRole === 'VENDOR' && (
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Agro Shop Name *</label>
                    <input
                      type="text"
                      placeholder="Sri Lakshmi Agri Inputs"
                      value={shopName}
                      onChange={e => setShopName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 outline-none"
                      required
                    />
                  </div>
                )}

                {selectedRole === 'BUYER' && (
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Wholesale Firm Name *</label>
                    <input
                      type="text"
                      placeholder="Kisan Mandi Traders"
                      value={buyerCompany}
                      onChange={e => setBuyerCompany(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 outline-none"
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black rounded-2xl shadow text-xs flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Complete Registration & Launch</span>}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
