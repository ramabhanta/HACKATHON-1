import React, { useState, useEffect, useRef } from 'react';
import { useAuth, UserRole } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Lock,
  Phone,
  User,
  MapPin,
  Sprout,
  Store,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  Loader2,
  Clock,
  Sparkles,
  Wheat,
  Building2,
  RefreshCw,
  KeyRound
} from 'lucide-react';

interface LoginPageProps {
  setActiveTab: (tab: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ setActiveTab }) => {
  const {
    loginWithPassword,
    loginWithOtp,
    sendOtp,
    verifyOtp,
    register,
    user,
    isAuthenticated,
    logout
  } = useAuth();
  const { t, language } = useLanguage();

  // Primary mode: SIGN_IN or REGISTER
  const [authMode, setAuthMode] = useState<'SIGN_IN' | 'REGISTER'>('SIGN_IN');

  // Sign-in sub-mode: PASSWORD or OTP
  const [signInMethod, setSignInMethod] = useState<'PASSWORD' | 'OTP'>('PASSWORD');
  const [showPassword, setShowPassword] = useState(false);

  // Status & Feedback
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [devOtpToast, setDevOtpToast] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -------------------------------------------------------------
  // Returning User Sign-In State
  // -------------------------------------------------------------
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginOtpDigits, setLoginOtpDigits] = useState(['', '', '', '', '', '']);

  // -------------------------------------------------------------
  // Progressive Multi-Step Registration State
  // Step 1: Role & Mobile -> Step 2: OTP -> Step 3: Security & Name -> Step 4: Role Profile -> Step 5: Complete
  // -------------------------------------------------------------
  const [regStep, setRegStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedRole, setSelectedRole] = useState<UserRole>('FARMER');
  const [regPhone, setRegPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Step 3: Profile & Security
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Step 4: Role specifics
  // Farmer fields
  const [regVillage, setRegVillage] = useState('Kadiri Rural');
  const [regDistrict, setRegDistrict] = useState('Sri Sathya Sai');
  const [regState, setRegState] = useState('Andhra Pradesh');
  const [regPincode, setRegPincode] = useState('515591');
  const [regAcreage, setRegAcreage] = useState('5.0');
  const [selectedCrops, setSelectedCrops] = useState<string[]>(['Groundnut', 'Tomato']);

  // Vendor / Buyer fields (Produce Wholesaler)
  const [buyerCompany, setBuyerCompany] = useState('');
  const [buyerPanGst, setBuyerPanGst] = useState('');
  const [buyerRegion, setBuyerRegion] = useState('Rayalaseema / Kadiri AP');

  // Agro Shop fields (Inputs dealer)
  const [shopName, setShopName] = useState('');
  const [shopLicense, setShopLicense] = useState('');
  const [shopAddress, setShopAddress] = useState('Shop #14, Main Bazaar, Kadiri');

  // OTP inputs refs
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const loginOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 60-second countdown effect
  useEffect(() => {
    let timer: any;
    if (isTimerRunning && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    } else if (countdown === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, countdown]);

  // Clean 10-digit input handler
  const handlePhoneInputChange = (
    val: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const raw = val.replace(/[^0-9]/g, '');
    const clean10 = raw.slice(0, 10);
    setter(clean10);
  };

  // OTP Digit Handler
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

  const handleOtpPaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    setDigits: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!paste) return;
    const nextArr = ['', '', '', '', '', ''];
    for (let i = 0; i < paste.length; i++) {
      nextArr[i] = paste[i];
    }
    setDigits(nextArr);
    const nextFocus = Math.min(paste.length, 5);
    refs.current[nextFocus]?.focus();
  };

  // -------------------------------------------------------------
  // Returning User Login Actions
  // -------------------------------------------------------------
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!loginPhone || loginPhone.length < 10) {
      setError('Please enter a valid 10-digit registered mobile number.');
      return;
    }
    if (!loginPassword) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginWithPassword(loginPhone, loginPassword);
      if (res.success) {
        setSuccessMsg('Signed in successfully! Redirecting...');
        setTimeout(() => setActiveTab('home'), 600);
      } else {
        setError(res.error || 'Incorrect mobile number or password.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestLoginOtp = async () => {
    setError(null);
    if (!loginPhone || loginPhone.length < 10) {
      setError('Please enter your 10-digit mobile number first.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendOtp(loginPhone);
      if (res.success) {
        setLoginOtpSent(true);
        if (res.devOtp) {
          setDevOtpToast(`AgroDex Verification Code: ${res.devOtp} (Valid for 5 mins)`);
        }
        setCountdown(60);
        setIsTimerRunning(true);
        setTimeout(() => loginOtpRefs.current[0]?.focus(), 100);
      } else {
        setError(res.error || 'Failed to send OTP.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const otpCode = loginOtpDigits.join('');

    if (otpCode.length < 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginWithOtp(loginPhone, otpCode);
      if (res.success) {
        setSuccessMsg('Signed in successfully via OTP! Redirecting...');
        setTimeout(() => setActiveTab('home'), 600);
      } else {
        setError(res.error || 'Invalid OTP code.');
      }
    } catch (err: any) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Progressive Multi-Step Registration Actions
  // -------------------------------------------------------------
  const handleRegSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regPhone || regPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendOtp(regPhone);
      if (res.success) {
        if (res.devOtp) {
          setDevOtpToast(`AgroDex Verification Code: ${res.devOtp} (Valid for 5 mins)`);
        }
        setRegStep(2);
        setCountdown(60);
        setIsTimerRunning(true);
        setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
      } else {
        setError(res.error || 'Could not send SMS OTP.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to request OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const code = otpDigits.join('');

    if (code.length < 6) {
      setError('Please enter all 6 digits of the OTP.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifyOtp(regPhone, code);
      if (res.success) {
        setRegStep(3);
      } else {
        setError(res.error || 'Invalid OTP entered.');
      }
    } catch (err: any) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegStep3Security = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      setError('Please create a PIN or password of at least 4 digits/characters.');
      return;
    }

    setRegStep(4);
  };

  const handleRegFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
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
        payload.farmingType = 'INTEGRATED';
      } else if (selectedRole === 'BUYER') {
        payload.companyName = buyerCompany || `${regName} Wholesale Mandi`;
        payload.panGst = buyerPanGst;
        payload.preferredCrops = selectedCrops;
        payload.operatingRegion = buyerRegion;
      } else if (selectedRole === 'VENDOR') {
        payload.shopName = shopName || `${regName}'s Agro Seva Kendra`;
        payload.licenseNumber = shopLicense || `AP/AGRI/${Math.floor(10000 + Math.random() * 90000)}`;
        payload.address = shopAddress;
      }

      const res = await register(payload);
      if (res.success) {
        setRegStep(5);
        setTimeout(() => {
          setActiveTab('home');
        }, 1200);
      } else {
        setError(res.error || 'Registration failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCrop = (crop: string) => {
    if (selectedCrops.includes(crop)) {
      if (selectedCrops.length > 1) {
        setSelectedCrops(selectedCrops.filter(c => c !== crop));
      }
    } else {
      setSelectedCrops([...selectedCrops, crop]);
    }
  };

  // -------------------------------------------------------------
  // Render Active Logged-in State Card (if already authenticated)
  // -------------------------------------------------------------
  if (isAuthenticated && user) {
    return (
      <div className="max-w-md mx-auto p-4 sm:p-6 space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-emerald-100 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center font-black text-2xl border-4 border-emerald-50">
            {user.name?.charAt(0) || 'K'}
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900">{user.name}</h2>
            <p className="text-xs font-mono font-bold text-emerald-800 mt-1">{user.phone}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-full uppercase tracking-wider">
              {user.role}
            </span>
          </div>

          <div className="pt-2 border-t border-gray-100 space-y-2">
            <button
              onClick={() => setActiveTab('home')}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm rounded-2xl shadow transition"
            >
              Go to Dashboard →
            </button>
            <button
              onClick={() => logout()}
              className="w-full py-2.5 bg-stone-100 hover:bg-rose-50 hover:text-rose-600 text-stone-700 font-bold text-xs rounded-xl transition"
            >
              Sign Out of Mobile Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Main Authentication Interface (Mobile-First)
  // -------------------------------------------------------------
  return (
    <div className="min-h-[85vh] flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-lg">
        {/* Dynamic Dev OTP Toast Notice */}
        {devOtpToast && (
          <div className="mb-4 bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-emerald-500/10 border-2 border-emerald-500/50 rounded-2xl p-3.5 text-xs text-emerald-950 flex items-center justify-between shadow-md shadow-emerald-500/5 backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5 font-bold">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <KeyRound className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-[13px] tracking-wide text-emerald-900">{devOtpToast}</span>
            </div>
            <button
              onClick={() => setDevOtpToast(null)}
              className="text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg font-black text-xs transition"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Card Container */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200/90 overflow-hidden">
          {/* Header Switcher */}
          <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white relative">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
                <Phone className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black tracking-tight leading-tight">
                  AgroDex Mobile Connect
                </h1>
                <p className="text-[11px] text-emerald-200 font-medium">
                  100% Mobile Phone & SMS OTP Authentication
                </p>
              </div>
            </div>

            {/* Toggle: Sign In vs Progressive Register */}
            <div className="grid grid-cols-2 p-1 bg-black/25 backdrop-blur-md rounded-2xl mt-4 border border-white/10 text-xs font-black">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('SIGN_IN');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 rounded-xl transition ${
                  authMode === 'SIGN_IN'
                    ? 'bg-white text-emerald-950 shadow-md'
                    : 'text-emerald-100 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('REGISTER');
                  setRegStep(1);
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 rounded-xl transition ${
                  authMode === 'REGISTER'
                    ? 'bg-white text-emerald-950 shadow-md'
                    : 'text-emerald-100 hover:text-white'
                }`}
              >
                New Registration
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            {/* Global Error Banner */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-800 font-bold animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Global Success Banner */}
            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* ======================================================= */}
            {/* SECTION 1: RETURNING USER SIGN-IN                        */}
            {/* ======================================================= */}
            {authMode === 'SIGN_IN' && (
              <div className="space-y-4">
                {/* Method Switcher: Password vs SMS OTP */}
                <div className="flex items-center justify-between p-1 bg-stone-100 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setSignInMethod('PASSWORD');
                      setError(null);
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-center transition ${
                      signInMethod === 'PASSWORD'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    Mobile + Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSignInMethod('OTP');
                      setError(null);
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-center transition flex items-center justify-center gap-1.5 ${
                      signInMethod === 'OTP'
                        ? 'bg-white text-emerald-900 shadow-sm font-black'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Login via SMS OTP</span>
                  </button>
                </div>

                {signInMethod === 'PASSWORD' ? (
                  /* Password-Based Login Form */
                  <form onSubmit={handlePasswordLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Registered 10-Digit Mobile Number
                      </label>
                      <div className="relative flex rounded-2xl border border-gray-300 overflow-hidden focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100">
                        <span className="bg-stone-100 border-r border-gray-300 px-3 py-2.5 text-xs font-black text-gray-700 flex items-center gap-1">
                          🇮🇳 +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="Enter 10-digit mobile number"
                          value={loginPhone}
                          onChange={e => handlePhoneInputChange(e.target.value, setLoginPhone)}
                          className="w-full px-3 py-2.5 text-sm font-bold text-gray-900 outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-gray-700">
                          Password / PIN
                        </label>
                        <button
                          type="button"
                          onClick={() => setSignInMethod('OTP')}
                          className="text-[11px] font-bold text-emerald-700 hover:underline"
                        >
                          Forgot? Use OTP Login
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password or PIN"
                          value={loginPassword}
                          onChange={e => setLoginPassword(e.target.value)}
                          className="w-full rounded-2xl border border-gray-300 px-3.5 py-2.5 text-sm font-bold text-gray-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-900/20 transition active:scale-98 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign In to Agri Account</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Passwordless SMS OTP Login Form */
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        10-Digit Mobile Number
                      </label>
                      <div className="relative flex rounded-2xl border border-gray-300 overflow-hidden focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100">
                        <span className="bg-stone-100 border-r border-gray-300 px-3 py-2.5 text-xs font-black text-gray-700 flex items-center gap-1">
                          🇮🇳 +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="Enter 10-digit mobile number"
                          value={loginPhone}
                          onChange={e => handlePhoneInputChange(e.target.value, setLoginPhone)}
                          disabled={loginOtpSent}
                          className="w-full px-3 py-2.5 text-sm font-bold text-gray-900 outline-none disabled:bg-stone-50"
                        />
                      </div>
                    </div>

                    {!loginOtpSent ? (
                      <button
                        type="button"
                        onClick={handleRequestLoginOtp}
                        disabled={isSubmitting || loginPhone.length < 10}
                        className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Phone className="w-4 h-4" />
                            <span>Send 6-Digit OTP via SMS</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <form onSubmit={handleVerifyLoginOtp} className="space-y-4 animate-in fade-in">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-600 font-bold">
                              Enter OTP sent to +91 {loginPhone}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setLoginOtpSent(false);
                                setLoginOtpDigits(['', '', '', '', '', '']);
                              }}
                              className="text-[11px] text-emerald-700 font-bold hover:underline"
                            >
                              Edit Number
                            </button>
                          </div>

                          {/* 6 Box Inputs */}
                          <div className="grid grid-cols-6 gap-2">
                            {loginOtpDigits.map((digit, idx) => (
                              <input
                                key={idx}
                                ref={el => (loginOtpRefs.current[idx] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={e =>
                                  handleOtpBoxChange(
                                    idx,
                                    e.target.value,
                                    loginOtpDigits,
                                    setLoginOtpDigits,
                                    loginOtpRefs
                                  )
                                }
                                onKeyDown={e =>
                                  handleOtpKeyDown(idx, e, loginOtpDigits, loginOtpRefs)
                                }
                                onPaste={e =>
                                  handleOtpPaste(e, setLoginOtpDigits, loginOtpRefs)
                                }
                                className="w-full h-12 text-center text-lg font-black rounded-xl border border-gray-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none"
                              />
                            ))}
                          </div>
                        </div>

                        {/* Countdown & Resend */}
                        <div className="flex items-center justify-between text-xs text-gray-500 font-bold">
                          {isTimerRunning ? (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> Resend code in {countdown}s
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleRequestLoginOtp}
                              className="text-emerald-700 hover:underline flex items-center gap-1 font-bold"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Resend OTP
                            </button>
                          )}
                          <span className="text-[11px] text-gray-400 font-medium">
                            Valid for 5 mins
                          </span>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting || loginOtpDigits.join('').length < 6}
                          className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <span>Verify & Sign In</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* Bottom Toggle */}
                <div className="pt-3 border-t border-gray-100 text-center">
                  <p className="text-xs text-gray-500 font-medium">
                    New to AgroDex?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('REGISTER');
                        setRegStep(1);
                      }}
                      className="font-black text-emerald-800 hover:underline"
                    >
                      Register with Mobile Number →
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* ======================================================= */}
            {/* SECTION 2: PROGRESSIVE MULTI-STEP REGISTRATION           */}
            {/* ======================================================= */}
            {authMode === 'REGISTER' && (
              <div className="space-y-4">
                {/* Step Indicator Progress Bar */}
                <div className="space-y-1.5 pb-2">
                  <div className="flex items-center justify-between text-[11px] font-black text-gray-500 uppercase tracking-wider">
                    <span>
                      Step {regStep} of 4:{' '}
                      {regStep === 1
                        ? 'Role & Phone'
                        : regStep === 2
                        ? 'SMS OTP'
                        : regStep === 3
                        ? 'Security'
                        : regStep === 4
                        ? 'Role Profile'
                        : 'Completed'}
                    </span>
                    <span className="text-emerald-700 font-extrabold">{regStep * 25}%</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-300"
                      style={{ width: `${regStep * 25}%` }}
                    />
                  </div>
                </div>

                {/* STEP 1: ROLE SELECTION & MOBILE NUMBER */}
                {regStep === 1 && (
                  <form onSubmit={handleRegSendOtp} className="space-y-4 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-black text-gray-800 uppercase tracking-wider mb-2">
                        1. Select Your Role on AgroDex:
                      </label>
                      <div className="grid grid-cols-1 gap-2.5">
                        {/* Option 1: Farmer */}
                        <div
                          onClick={() => setSelectedRole('FARMER')}
                          className={`p-3 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                            selectedRole === 'FARMER'
                              ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                              : 'border-gray-200 hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black">
                              <Sprout className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="text-sm font-black text-gray-900">Farmer</h3>
                                <span className="text-xs text-emerald-800 font-bold">(ಕಿಸಾನ್ / రైతు)</span>
                              </div>
                              <p className="text-[11px] text-gray-500">
                                AI Crop Doctor, Kadiri Mandi Prices, Seed & Fertilizer Store
                              </p>
                            </div>
                          </div>
                          {selectedRole === 'FARMER' && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                          )}
                        </div>

                        {/* Option 2: Vendor / Buyer (Produce Procurement & Wholesaler) */}
                        <div
                          onClick={() => setSelectedRole('BUYER')}
                          className={`p-3 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                            selectedRole === 'BUYER'
                              ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                              : 'border-gray-200 hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center font-black">
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="text-sm font-black text-gray-900">Vendor / Buyer</h3>
                                <span className="text-xs text-blue-800 font-bold">(Procurement & Wholesaler)</span>
                              </div>
                              <p className="text-[11px] text-gray-500">
                                Direct farmer produce procurement, bulk mandi bidding
                              </p>
                            </div>
                          </div>
                          {selectedRole === 'BUYER' && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                          )}
                        </div>

                        {/* Option 3: Agro Shop (Inputs Dealer) */}
                        <div
                          onClick={() => setSelectedRole('VENDOR')}
                          className={`p-3 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                            selectedRole === 'VENDOR'
                              ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                              : 'border-gray-200 hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-700 text-white flex items-center justify-center font-black">
                              <Store className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="text-sm font-black text-gray-900">Agro Shop</h3>
                                <span className="text-xs text-amber-800 font-bold">(Dealer & Inputs Hub)</span>
                              </div>
                              <p className="text-[11px] text-gray-500">
                                Fertilizer, Pesticide, Seed inventory & store order fulfillment
                              </p>
                            </div>
                          </div>
                          {selectedRole === 'VENDOR' && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-gray-800 uppercase tracking-wider mb-1.5">
                        2. Enter Your 10-Digit Mobile Number:
                      </label>
                      <div className="relative flex rounded-2xl border border-gray-300 overflow-hidden focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100">
                        <span className="bg-stone-100 border-r border-gray-300 px-3 py-2.5 text-xs font-black text-gray-700 flex items-center gap-1">
                          🇮🇳 +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="Enter 10-digit mobile number"
                          value={regPhone}
                          onChange={e => handlePhoneInputChange(e.target.value, setRegPhone)}
                          className="w-full px-3 py-2.5 text-sm font-bold text-gray-900 outline-none"
                          required
                        />
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                        We will send a 6-digit OTP to verify your mobile number.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || regPhone.length < 10}
                      className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Get OTP to Verify Mobile</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* STEP 2: SMS OTP VERIFICATION SCREEN */}
                {regStep === 2 && (
                  <form onSubmit={handleRegVerifyOtp} className="space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-black text-gray-900">
                          Verify Mobile Number
                        </h3>
                        <p className="text-xs text-gray-500 font-medium">
                          Enter 6-digit OTP sent to <strong>+91 {regPhone}</strong>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRegStep(1)}
                        className="text-xs font-bold text-emerald-800 hover:underline"
                      >
                        Edit Number
                      </button>
                    </div>

                    {/* 6 Auto-Focusing Box Inputs */}
                    <div className="grid grid-cols-6 gap-2 pt-2">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={el => (otpInputRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={e =>
                            handleOtpBoxChange(
                              idx,
                              e.target.value,
                              otpDigits,
                              setOtpDigits,
                              otpInputRefs
                            )
                          }
                          onKeyDown={e =>
                            handleOtpKeyDown(idx, e, otpDigits, otpInputRefs)
                          }
                          onPaste={e =>
                            handleOtpPaste(e, setOtpDigits, otpInputRefs)
                          }
                          className="w-full h-12 text-center text-lg font-black rounded-xl border border-gray-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none"
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 font-bold pt-1">
                      {isTimerRunning ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Resend OTP in {countdown}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            sendOtp(regPhone).then(r => {
                              if (r.success) {
                                if (r.devOtp) {
                                  setDevOtpToast(`AgroDex Verification Code: ${r.devOtp} (Valid for 5 mins)`);
                                }
                                setCountdown(60);
                                setIsTimerRunning(true);
                              }
                            });
                          }}
                          className="text-emerald-700 hover:underline flex items-center gap-1 font-bold"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Resend OTP
                        </button>
                      )}
                      <span className="text-[11px] text-gray-400 font-medium">
                        Valid for 5 mins
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || otpDigits.join('').length < 6}
                      className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Verify & Proceed to Profile</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* STEP 3: SECURITY & BASIC PROFILE */}
                {regStep === 3 && (
                  <form onSubmit={handleRegStep3Security} className="space-y-4 animate-in fade-in">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                        Phone Verified: +91 {regPhone} ✓
                      </span>
                      <h3 className="text-base font-black text-gray-900 mt-2">
                        Create Your Identity & Security
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">
                        Set your display name and login password / PIN.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          placeholder="e.g. Ramesh Patel"
                          value={regName}
                          onChange={e => setRegName(e.target.value)}
                          className="w-full rounded-2xl border border-gray-300 pl-10 pr-3.5 py-2.5 text-sm font-bold text-gray-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Create PIN or Password (min 4 chars) *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          placeholder="Enter 4-6 digit PIN or password"
                          value={regPassword}
                          onChange={e => setRegPassword(e.target.value)}
                          className="w-full rounded-2xl border border-gray-300 pl-10 pr-10 py-2.5 text-sm font-bold text-gray-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setRegStep(2)}
                        className="py-3 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
                      >
                        <span>Continue to Role Setup</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 4: ROLE-SPECIFIC DETAILS (PROGRESSIVE FIELDS) */}
                {regStep === 4 && (
                  <form onSubmit={handleRegFinalSubmit} className="space-y-4 animate-in fade-in">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                        Role: {selectedRole}
                      </span>
                      <h3 className="text-base font-black text-gray-900 mt-2">
                        {selectedRole === 'FARMER'
                          ? 'Farm Location & Crop Information'
                          : selectedRole === 'BUYER'
                          ? 'Wholesale Procurement Details'
                          : 'Agro Input Dealership Details'}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">
                        {selectedRole === 'FARMER'
                          ? 'Helps tailor disease alerts, soil health, and weather forecast.'
                          : selectedRole === 'BUYER'
                          ? 'Connects you directly to local farmers harvesting your preferred crops.'
                          : 'Enables farmers in your radius to book fertilizer and pesticide stock.'}
                      </p>
                    </div>

                    {/* FARMER FIELDS */}
                    {selectedRole === 'FARMER' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              Village / Town
                            </label>
                            <input
                              type="text"
                              value={regVillage}
                              onChange={e => setRegVillage(e.target.value)}
                              placeholder="Kadiri Rural"
                              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold outline-none focus:border-emerald-600"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              District
                            </label>
                            <input
                              type="text"
                              value={regDistrict}
                              onChange={e => setRegDistrict(e.target.value)}
                              placeholder="Sri Sathya Sai"
                              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold outline-none focus:border-emerald-600"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              State & PIN Code
                            </label>
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                value={regState}
                                onChange={e => setRegState(e.target.value)}
                                className="w-2/3 rounded-xl border border-gray-300 px-2.5 py-2 text-xs font-bold outline-none"
                              />
                              <input
                                type="text"
                                value={regPincode}
                                onChange={e => setRegPincode(e.target.value)}
                                className="w-1/3 rounded-xl border border-gray-300 px-2 py-2 text-xs font-bold outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              Total Land Area (Acres)
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              value={regAcreage}
                              onChange={e => setRegAcreage(e.target.value)}
                              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold outline-none focus:border-emerald-600"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1.5">
                            Primary Crops Grown:
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {['Groundnut', 'Tomato', 'Paddy', 'Chilli', 'Cotton', 'Maize', 'Sunflower', 'Mango'].map(crop => (
                              <button
                                key={crop}
                                type="button"
                                onClick={() => toggleCrop(crop)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition ${
                                  selectedCrops.includes(crop)
                                    ? 'bg-emerald-700 text-white shadow-sm'
                                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                }`}
                              >
                                {selectedCrops.includes(crop) ? `✓ ${crop}` : crop}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* VENDOR / BUYER FIELDS */}
                    {selectedRole === 'BUYER' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            Company / Mandi Trading Firm Name *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Kisan Mandi Wholesalers"
                            value={buyerCompany}
                            onChange={e => setBuyerCompany(e.target.value)}
                            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold outline-none focus:border-emerald-600"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              Business PAN / GST (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="GSTIN / PAN"
                              value={buyerPanGst}
                              onChange={e => setBuyerPanGst(e.target.value)}
                              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold outline-none uppercase"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              Operating Region / Mandi
                            </label>
                            <input
                              type="text"
                              value={buyerRegion}
                              onChange={e => setBuyerRegion(e.target.value)}
                              placeholder="Kadiri Market Yard"
                              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1.5">
                            Preferred Buying Commodities:
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {['Groundnut', 'Tomato', 'Paddy', 'Chilli', 'Cotton', 'Maize', 'Mango'].map(crop => (
                              <button
                                key={crop}
                                type="button"
                                onClick={() => toggleCrop(crop)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition ${
                                  selectedCrops.includes(crop)
                                    ? 'bg-blue-700 text-white shadow-sm'
                                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                }`}
                              >
                                {selectedCrops.includes(crop) ? `✓ ${crop}` : crop}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AGRO SHOP FIELDS */}
                    {selectedRole === 'VENDOR' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            Agro Shop / Seva Kendra Name *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Sri Lakshmi Agri Inputs Hub"
                            value={shopName}
                            onChange={e => setShopName(e.target.value)}
                            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold outline-none focus:border-emerald-600"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              Seed & Fertilizer License No. *
                            </label>
                            <input
                              type="text"
                              placeholder="AP/LIC/2026/9812"
                              value={shopLicense}
                              onChange={e => setShopLicense(e.target.value)}
                              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold outline-none uppercase font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              Shop PIN Code
                            </label>
                            <input
                              type="text"
                              value={regPincode}
                              onChange={e => setRegPincode(e.target.value)}
                              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            Physical Shop Address *
                          </label>
                          <input
                            type="text"
                            placeholder="Shop #14, Main Bazaar, Kadiri"
                            value={shopAddress}
                            onChange={e => setShopAddress(e.target.value)}
                            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold outline-none"
                            required
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setRegStep(3)}
                        className="py-3 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <span>Complete Onboarding & Launch</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 5: SUCCESS & ONBOARDING CONFIRMATION */}
                {regStep === 5 && (
                  <div className="py-8 text-center space-y-3 animate-in zoom-in-95">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                      <Check className="w-8 h-8 stroke-[3]" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900">
                      Registration Complete!
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      Mobile session verified. Redirecting to your {selectedRole.toLowerCase()} dashboard...
                    </p>
                  </div>
                )}

                {/* Bottom Toggle back to Sign In */}
                <div className="pt-3 border-t border-gray-100 text-center">
                  <p className="text-xs text-gray-500 font-medium">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('SIGN_IN')}
                      className="font-black text-emerald-800 hover:underline"
                    >
                      Sign In with Mobile Number →
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
