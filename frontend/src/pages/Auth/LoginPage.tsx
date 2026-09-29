import React, { useState, useEffect, useRef } from 'react';
import { useAuth, UserRole } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Lock,
  Mail,
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
  KeyRound,
  Crosshair,
  X
} from 'lucide-react';
import { detectLocation } from '../../services/geolocationService';

interface LoginPageProps {
  setActiveTab: (tab: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ setActiveTab }) => {
  const {
    loginWithPassword,
    register,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
    user,
    isAuthenticated,
    logout
  } = useAuth();
  const { t, language } = useLanguage();

  // Primary mode: SIGN_IN | REGISTER | FORGOT_PASSWORD
  const [authMode, setAuthMode] = useState<'SIGN_IN' | 'REGISTER' | 'FORGOT_PASSWORD'>('SIGN_IN');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [devOtpToast, setDevOtpToast] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -------------------------------------------------------------
  // Returning User Sign-In State
  // -------------------------------------------------------------
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // -------------------------------------------------------------
  // Registration State
  // -------------------------------------------------------------
  const [regStep, setRegStep] = useState<1 | 2 | 3>(1);
  const [selectedRole, setSelectedRole] = useState<UserRole>('FARMER');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Farmer specifics
  const [regVillage, setRegVillage] = useState('Kadiri Rural');
  const [regDistrict, setRegDistrict] = useState('Sri Sathya Sai');
  const [regState, setRegState] = useState('Andhra Pradesh');
  const [regPincode, setRegPincode] = useState('515591');
  const [regAcreage, setRegAcreage] = useState('5.0');
  const [selectedCrops, setSelectedCrops] = useState<string[]>(['Groundnut', 'Tomato']);

  // Buyer specifics
  const [buyerCompany, setBuyerCompany] = useState('');
  const [buyerPanGst, setBuyerPanGst] = useState('');
  const [buyerRegion, setBuyerRegion] = useState('Rayalaseema / Kadiri AP');

  // Agro Shop specifics
  const [shopName, setShopName] = useState('');
  const [shopLicense, setShopLicense] = useState('');
  const [shopAddress, setShopAddress] = useState('Shop #14, Main Bazaar, Kadiri');

  // GPS Geolocation & Reverse Geocoding states
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [detectedBadge, setDetectedBadge] = useState<string | null>(null);
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [regCoords, setRegCoords] = useState<{ lat?: number; lon?: number }>({});
  const [locationToast, setLocationToast] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Forgot Password State
  // -------------------------------------------------------------
  const [resetEmail, setResetEmail] = useState('');
  const [resetStep, setResetStep] = useState<1 | 2 | 3>(1);
  const [resetOtpDigits, setResetOtpDigits] = useState(['', '', '', '', '', '']);
  const [verifiedOtp, setVerifiedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const resetOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Universal Escape Key listener to close / navigate back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveTab('home');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab]);

  // Countdown timer for OTP
  useEffect(() => {
    let timer: any;
    if (isTimerRunning && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    } else if (countdown === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, countdown]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    setLocationToast(null);
    setError(null);
    try {
      const loc = await detectLocation();
      setRegVillage(loc.village);
      setRegDistrict(loc.district);
      setRegState(loc.state);
      setRegPincode(loc.pincode);
      setRegCoords({ lat: loc.latitude, lon: loc.longitude });
      setDetectedBadge(`📍 Detected: ${loc.village}, ${loc.district}`);
      setShowManualLocation(false);
    } catch (err: any) {
      const msg = err?.message || 'Location access denied. Please select or type your district/village manually.';
      setLocationToast(msg);
      setShowManualLocation(true);
    } finally {
      setIsDetectingLocation(false);
    }
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

  // -------------------------------------------------------------
  // Returning User Login Action
  // -------------------------------------------------------------
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = loginEmail.trim().toLowerCase();
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!loginPassword) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginWithPassword(cleanEmail, loginPassword);
      if (res.success) {
        setSuccessMsg('Signed in successfully! Redirecting to dashboard...');
        setTimeout(() => setActiveTab('home'), 600);
      } else {
        setError(res.error || 'Incorrect password. Please verify and try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Registration Actions
  // -------------------------------------------------------------
  const handleRegStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = regName.trim();
    const cleanEmail = regEmail.trim().toLowerCase();

    if (!cleanName) {
      setError('Please enter your full name.');
      return;
    }
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setRegStep(2);
  };

  const handleRegFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const cleanEmail = regEmail.trim().toLowerCase();
      const payload: any = {
        name: regName.trim(),
        email: cleanEmail,
        password: regPassword,
        role: selectedRole,
        village: regVillage,
        district: regDistrict,
        state: regState,
        pincode: regPincode,
        latitude: regCoords.lat,
        longitude: regCoords.lon
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
        setRegStep(3);
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

  // -------------------------------------------------------------
  // Forgot Password Actions
  // -------------------------------------------------------------
  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanEmail = resetEmail.trim().toLowerCase();
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setError('Please enter a valid registered email address.');
      return;
    }

    setIsSubmitting(true);
    const res = await forgotPassword(cleanEmail);
    setIsSubmitting(false);

    if (res.success) {
      if (res.devOtp) {
        setDevOtpToast(`AgroDex Verification Code: ${res.devOtp} (Valid for 5 mins)`);
      }
      setResetStep(2);
      setCountdown(60);
      setIsTimerRunning(true);
      setTimeout(() => resetOtpRefs.current[0]?.focus(), 150);
    } else {
      setError(res.error || 'Failed to send reset code.');
    }
  };

  const handleVerifyResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const code = resetOtpDigits.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    setIsSubmitting(true);
    const res = await verifyResetOtp(resetEmail.trim().toLowerCase(), code);
    setIsSubmitting(false);

    if (res.success) {
      setVerifiedOtp(code);
      setResetStep(3);
    } else {
      setError(res.error || 'Invalid or expired OTP code.');
    }
  };

  const handleCompletePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setIsSubmitting(true);
    const res = await resetPassword(resetEmail.trim().toLowerCase(), verifiedOtp, newPassword);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg('Password updated successfully! You can now sign in.');
      setAuthMode('SIGN_IN');
      setLoginEmail(resetEmail.trim().toLowerCase());
      setLoginPassword('');
      setResetStep(1);
      setResetOtpDigits(['', '', '', '', '', '']);
    } else {
      setError(res.error || 'Failed to update password.');
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
            <p className="text-xs font-mono font-bold text-emerald-800 mt-1">{user.email || user.phone}</p>
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
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Main Authentication Interface
  // -------------------------------------------------------------
  return (
    <div className="min-h-[85vh] flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-lg relative">
        {/* Dynamic Dev OTP Toast Notice */}
        {devOtpToast && (
          <div className="mb-4 bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-emerald-500/10 border-2 border-emerald-500/50 rounded-2xl p-3.5 text-xs text-emerald-950 flex items-center justify-between shadow-md backdrop-blur-sm animate-in fade-in">
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
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200/90 overflow-hidden relative">
          {/* Header */}
          <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white relative">
            {/* Universal Top-Right Close Button (Min 40x40px touch area) */}
            <button
              onClick={() => setActiveTab('home')}
              aria-label="Close authentication page and return home"
              className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95 border border-white/20 z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-2 pr-12">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black tracking-tight leading-tight">
                  AgroDex Agri Connect
                </h1>
                <p className="text-[11px] text-emerald-200 font-medium">
                  100% Email & Password Authentication Architecture
                </p>
              </div>
            </div>

            {/* Mode Switcher: Sign In vs Register */}
            {authMode !== 'FORGOT_PASSWORD' && (
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
            )}
          </div>

          <div className="p-4 sm:p-6 space-y-4">
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
            {/* 1. SIGN IN (EMAIL + PASSWORD)                           */}
            {/* ======================================================= */}
            {authMode === 'SIGN_IN' && (
              <form onSubmit={handlePasswordLogin} className="space-y-4 animate-in fade-in">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Registered Email Address
                  </label>
                  <div className="relative flex rounded-2xl border border-gray-300 overflow-hidden focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100">
                    <span className="bg-stone-100 border-r border-gray-300 px-3 py-2.5 text-xs text-gray-500 flex items-center">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      placeholder="e.g. kisan@agriconnect.org"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm font-bold text-gray-900 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-gray-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('FORGOT_PASSWORD');
                        setResetStep(1);
                        setResetEmail(loginEmail);
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] font-bold text-emerald-700 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
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
                      <span>Verifying credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Agri Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

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
                      Register with Email →
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* ======================================================= */}
            {/* 2. REGISTRATION (EMAIL & PASSWORD)                      */}
            {/* ======================================================= */}
            {authMode === 'REGISTER' && (
              <div className="space-y-4">
                {/* Step Indicator */}
                <div className="space-y-1.5 pb-2">
                  <div className="flex items-center justify-between text-[11px] font-black text-gray-500 uppercase tracking-wider">
                    <span>
                      Step {regStep} of 2:{' '}
                      {regStep === 1 ? 'Credentials & Role' : 'Role Details & Location'}
                    </span>
                    <span className="text-emerald-700 font-extrabold">{regStep * 50}%</span>
                  </div>
                  <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-300"
                      style={{ width: `${regStep * 50}%` }}
                    />
                  </div>
                </div>

                {/* Step 1: Role, Name, Email, Passwords */}
                {regStep === 1 && (
                  <form onSubmit={handleRegStep1} className="space-y-3.5 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-black text-gray-800 uppercase tracking-wider mb-2">
                        1. Select Your Role:
                      </label>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedRole('FARMER')}
                          className={`p-3 rounded-2xl border-2 text-center transition flex flex-col items-center justify-center gap-1.5 ${
                            selectedRole === 'FARMER'
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                        >
                          <Sprout className="w-6 h-6 text-emerald-700" />
                          <span className="text-xs">Farmer</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedRole('BUYER')}
                          className={`p-3 rounded-2xl border-2 text-center transition flex flex-col items-center justify-center gap-1.5 ${
                            selectedRole === 'BUYER'
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                        >
                          <Building2 className="w-6 h-6 text-blue-700" />
                          <span className="text-xs">Buyer / Mandi</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedRole('VENDOR')}
                          className={`p-3 rounded-2xl border-2 text-center transition flex flex-col items-center justify-center gap-1.5 ${
                            selectedRole === 'VENDOR'
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                        >
                          <Store className="w-6 h-6 text-amber-700" />
                          <span className="text-xs">Agro Shop</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Patel"
                        value={regName}
                        onChange={e => setRegName(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold outline-none focus:border-emerald-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. ramesh@farm.org"
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold outline-none focus:border-emerald-600"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Create Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Min 6 characters"
                            value={regPassword}
                            onChange={e => setRegPassword(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold outline-none focus:border-emerald-600 pr-8"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Confirm Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Re-enter password"
                            value={regConfirmPassword}
                            onChange={e => setRegConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold outline-none focus:border-emerald-600 pr-8"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-2xl shadow transition flex items-center justify-center gap-2"
                    >
                      <span>Continue to Role Details →</span>
                    </button>
                  </form>
                )}

                {/* Step 2: Role Details & Location */}
                {regStep === 2 && (
                  <form onSubmit={handleRegFinalSubmit} className="space-y-4 animate-in fade-in">
                    {/* Location Box */}
                    <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/90 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase text-gray-700 tracking-wider flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          Location Setup
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowManualLocation(!showManualLocation)}
                          className="text-[11px] font-bold text-emerald-700 hover:underline"
                        >
                          {showManualLocation ? 'Hide Manual Entry' : 'Enter Location Manually'}
                        </button>
                      </div>

                      {locationToast && (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>{locationToast}</span>
                        </div>
                      )}

                      {detectedBadge ? (
                        <div className="p-2.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center justify-between text-xs font-black">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                            {detectedBadge}
                          </span>
                          <button
                            type="button"
                            onClick={handleDetectLocation}
                            disabled={isDetectingLocation}
                            className="text-[10px] text-emerald-800 underline hover:text-emerald-950 font-bold ml-2"
                          >
                            Retarget
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleDetectLocation}
                          disabled={isDetectingLocation}
                          className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-2 transition active:scale-95"
                        >
                          {isDetectingLocation ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                              <span>Detecting GPS Coordinates...</span>
                            </>
                          ) : (
                            <>
                              <Crosshair className="w-4 h-4 text-amber-300" />
                              <span>📍 Detect My Current Location</span>
                            </>
                          )}
                        </button>
                      )}

                      {(showManualLocation || detectedBadge) && (
                        <div className="pt-2 border-t border-stone-200 space-y-2 animate-in fade-in text-left">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-gray-500 block mb-0.5">Village / Town</label>
                              <input
                                type="text"
                                value={regVillage}
                                onChange={e => setRegVillage(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-bold outline-none"
                                placeholder="Kadiri Rural"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-gray-500 block mb-0.5">District</label>
                              <input
                                type="text"
                                value={regDistrict}
                                onChange={e => setRegDistrict(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-bold outline-none"
                                placeholder="Sri Sathya Sai"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-gray-500 block mb-0.5">State</label>
                              <input
                                type="text"
                                value={regState}
                                onChange={e => setRegState(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-bold outline-none"
                                placeholder="Andhra Pradesh"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-gray-500 block mb-0.5">PIN Code</label>
                              <input
                                type="text"
                                value={regPincode}
                                onChange={e => setRegPincode(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-bold outline-none"
                                placeholder="515591"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Farmer Specifics */}
                    {selectedRole === 'FARMER' && (
                      <div className="space-y-3">
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

                    {/* Buyer Specifics */}
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
                      </div>
                    )}

                    {/* Agro Shop Specifics */}
                    {selectedRole === 'VENDOR' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            Agro Shop Name *
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

                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            Seed & Fertilizer License No.
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
                        onClick={() => setRegStep(1)}
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

                {/* Step 3: Success */}
                {regStep === 3 && (
                  <div className="py-8 text-center space-y-3 animate-in zoom-in-95">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                      <Check className="w-8 h-8 stroke-[3]" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900">
                      Registration Complete!
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      Redirecting to your {selectedRole.toLowerCase()} dashboard...
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-100 text-center">
                  <p className="text-xs text-gray-500 font-medium">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('SIGN_IN')}
                      className="font-black text-emerald-800 hover:underline"
                    >
                      Sign In with Email →
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* ======================================================= */}
            {/* 3. FORGOT PASSWORD (EMAIL OTP RESET FLOW)               */}
            {/* ======================================================= */}
            {authMode === 'FORGOT_PASSWORD' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('SIGN_IN');
                      setError(null);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:underline"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Sign In
                  </button>
                  <span className="text-xs text-gray-400 font-bold">Step {resetStep} of 3</span>
                </div>

                {/* Step 1: Email */}
                {resetStep === 1 && (
                  <form onSubmit={handleSendResetOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Registered Email Address
                      </label>
                      <div className="relative flex rounded-2xl border border-gray-300 overflow-hidden focus-within:border-emerald-600">
                        <span className="bg-stone-100 border-r border-gray-300 px-3 py-2.5 text-xs text-gray-500 flex items-center">
                          <Mail className="w-4 h-4" />
                        </span>
                        <input
                          type="email"
                          placeholder="e.g. kisan@agriconnect.org"
                          value={resetEmail}
                          onChange={e => setResetEmail(e.target.value)}
                          className="w-full px-3 py-2.5 text-sm font-bold text-gray-900 outline-none"
                          required
                        />
                      </div>
                    </div>

                    <p className="text-xs text-gray-500">
                      We will generate and send a 6-digit verification code to this email to verify account ownership.
                    </p>

                    <button
                      type="submit"
                      disabled={isSubmitting || !resetEmail}
                      className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black text-xs rounded-2xl shadow transition flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Reset OTP Code →</span>}
                    </button>
                  </form>
                )}

                {/* Step 2: 6-digit OTP */}
                {resetStep === 2 && (
                  <form onSubmit={handleVerifyResetOtp} className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Code sent to <b>{resetEmail}</b></span>
                      <button
                        type="button"
                        onClick={() => setResetStep(1)}
                        className="text-emerald-700 font-bold hover:underline"
                      >
                        Change Email
                      </button>
                    </div>

                    <div className="grid grid-cols-6 gap-2">
                      {resetOtpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={el => (resetOtpRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={e =>
                            handleOtpBoxChange(idx, e.target.value, resetOtpDigits, setResetOtpDigits, resetOtpRefs)
                          }
                          onKeyDown={e => handleOtpKeyDown(idx, e, resetOtpDigits, resetOtpRefs)}
                          className="w-full h-12 text-center text-lg font-black rounded-xl border border-gray-300 focus:border-emerald-600 outline-none"
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 font-bold">
                      {isTimerRunning ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Resend in {countdown}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={async () => {
                            const r = await forgotPassword(resetEmail);
                            if (r.success) {
                              if (r.devOtp) setDevOtpToast(`AgroDex Reset OTP: ${r.devOtp}`);
                              setCountdown(60);
                              setIsTimerRunning(true);
                            }
                          }}
                          className="text-emerald-700 hover:underline flex items-center gap-1 font-bold"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Resend OTP
                        </button>
                      )}
                      <span className="text-gray-400">Valid for 5 mins</span>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || resetOtpDigits.join('').length < 6}
                      className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black text-xs rounded-2xl shadow transition flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify OTP Code →</span>}
                    </button>
                  </form>
                )}

                {/* Step 3: New Password */}
                {resetStep === 3 && (
                  <form onSubmit={handleCompletePasswordReset} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        New Password (min 6 characters) *
                      </label>
                      <input
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold outline-none focus:border-emerald-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Confirm New Password *
                      </label>
                      <input
                        type="password"
                        placeholder="Re-enter new password"
                        value={confirmNewPassword}
                        onChange={e => setConfirmNewPassword(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs font-bold outline-none focus:border-emerald-600"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !newPassword}
                      className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black text-xs rounded-2xl shadow transition flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Password & Sign In</span>}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Universal Page Footer Back/Cancel Button */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-gray-400">AgroDex Secure Gateway</span>
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition flex items-center gap-1"
              >
                <span>Back to Home / ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
