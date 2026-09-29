import React, { useState, useRef, useEffect } from 'react';
import { useAuth, UserRole } from '../context/AuthContext';
import {
  X,
  Lock,
  Mail,
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
  Loader2,
  MapPin,
  Crosshair,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import { detectLocation } from '../services/geolocationService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'LOGIN' | 'REGISTER';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialTab = 'LOGIN' }) => {
  const { loginWithPassword, register, forgotPassword, verifyResetOtp, resetPassword } = useAuth();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD'>(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [devOtpToast, setDevOtpToast] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sign In State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Registration State
  const [selectedRole, setSelectedRole] = useState<UserRole>('FARMER');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Location / Profile fields
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

  // GPS Geolocation & Reverse Geocoding states
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [detectedBadge, setDetectedBadge] = useState<string | null>(null);
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [regCoords, setRegCoords] = useState<{ lat?: number; lon?: number }>({});
  const [locationToast, setLocationToast] = useState<string | null>(null);

  // Forgot Password State
  const [resetEmail, setResetEmail] = useState('');
  const [resetStep, setResetStep] = useState<1 | 2 | 3>(1);
  const [resetOtpDigits, setResetOtpDigits] = useState(['', '', '', '', '', '']);
  const [verifiedOtp, setVerifiedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const resetOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Escape key handler for universal modal dismissal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

  if (!isOpen) return null;

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

  // Sign In with Strict Email & Password
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
    const res = await loginWithPassword(cleanEmail, loginPassword);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg('Signed in successfully!');
      setTimeout(() => onClose(), 600);
    } else {
      setError(res.error || 'Incorrect password. Please verify and try again.');
    }
  };

  // Registration Submission with Strict Validation
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanName = regName.trim();
    const cleanEmail = regEmail.trim().toLowerCase();

    if (!cleanName) {
      setError('Please provide your full name.');
      return;
    }
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setError('Please provide a valid email address.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please verify and re-enter.');
      return;
    }

    setIsSubmitting(true);
    const payload: any = {
      name: cleanName,
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
    } else if (selectedRole === 'BUYER') {
      payload.companyName = buyerCompany || `${cleanName} Wholesale Mandi`;
      payload.preferredCrops = selectedCrops;
    } else if (selectedRole === 'VENDOR') {
      payload.shopName = shopName || `${cleanName}'s Agro Hub`;
      payload.licenseNumber = shopLicense || `AP/AGRI/${Math.floor(10000 + Math.random() * 90000)}`;
      payload.address = shopAddress;
    }

    const res = await register(payload);
    setIsSubmitting(false);
    if (res.success) {
      setSuccessMsg('Registration successful! Redirecting to your dashboard...');
      setTimeout(() => onClose(), 800);
    } else {
      setError(res.error || 'Registration failed. Please try again.');
    }
  };

  // Forgot Password: Step 1 (Request OTP via Email)
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
        setDevOtpToast(`AgroDex Reset OTP: ${res.devOtp} (Valid for 5 mins)`);
      }
      setResetStep(2);
      setCountdown(60);
      setIsTimerRunning(true);
      setTimeout(() => resetOtpRefs.current[0]?.focus(), 150);
    } else {
      setError(res.error || 'Could not initiate password reset.');
    }
  };

  // Forgot Password: Step 2 (Verify OTP)
  const handleVerifyResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const code = resetOtpDigits.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits of the OTP.');
      return;
    }

    setIsSubmitting(true);
    const res = await verifyResetOtp(resetEmail.trim().toLowerCase(), code);
    setIsSubmitting(false);

    if (res.success) {
      setVerifiedOtp(code);
      setResetStep(3);
    } else {
      setError(res.error || 'Invalid or expired OTP.');
    }
  };

  // Forgot Password: Step 3 (Save New Password)
  const handleCompletePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
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
      setSuccessMsg('Password reset successfully! Please sign in with your new credentials.');
      setMode('LOGIN');
      setLoginEmail(resetEmail.trim().toLowerCase());
      setLoginPassword('');
      setResetStep(1);
      setResetOtpDigits(['', '', '', '', '', '']);
    } else {
      setError(res.error || 'Failed to reset password. Please try again.');
    }
  };

  // Password strength helper
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: 'Empty', color: 'bg-gray-200', text: 'text-gray-400' };
    if (pwd.length < 6) return { label: 'Too short', color: 'bg-red-400', text: 'text-red-500' };
    const hasNum = /\d/.test(pwd);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    if (pwd.length >= 8 && hasNum && hasSpecial) return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' };
    if (pwd.length >= 6 && hasNum) return { label: 'Medium', color: 'bg-amber-400', text: 'text-amber-600' };
    return { label: 'Weak', color: 'bg-orange-400', text: 'text-orange-600' };
  };

  const strength = getPasswordStrength(regPassword);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-emerald-100 relative space-y-4 my-auto"
      >
        {/* Universal Top-Right Close Button (Min 40x40px touch area) */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition active:scale-95 border border-gray-200 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center pt-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white p-1.5 shadow-md border border-emerald-100 mb-2 overflow-hidden">
            <img src="/agrodex-symbol.png" alt="AgroDex Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">
            {mode === 'LOGIN' && 'Sign In to AgroDex'}
            {mode === 'REGISTER' && 'Create Your AgroDex Account'}
            {mode === 'FORGOT_PASSWORD' && 'Reset Your AgroDex Password'}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {mode === 'LOGIN' && 'AgroDex — Cultivating Intelligence'}
            {mode === 'REGISTER' && 'Join thousands of Farmers, Buyers, and Agro Shops'}
            {mode === 'FORGOT_PASSWORD' && 'Secure self-service verification via Email OTP'}
          </p>
        </div>

        {/* Dev OTP Notification Toast */}
        {devOtpToast && (
          <div className="p-3 bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-emerald-500/10 border-2 border-emerald-500/50 rounded-2xl text-xs text-emerald-950 flex items-center justify-between shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2 font-bold">
              <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <KeyRound className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold text-xs text-emerald-900">{devOtpToast}</span>
            </div>
            <button
              onClick={() => setDevOtpToast(null)}
              className="text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded-md font-bold text-[11px] transition"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Primary Tab Switcher (Visible in Login & Register modes) */}
        {mode !== 'FORGOT_PASSWORD' && (
          <div className="flex bg-gray-100 p-1 rounded-2xl text-xs font-bold">
            <button
              onClick={() => { setMode('LOGIN'); setError(null); setSuccessMsg(null); }}
              className={`flex-1 py-2 rounded-xl transition ${mode === 'LOGIN' ? 'bg-white text-emerald-800 shadow-sm font-black' : 'text-gray-500'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('REGISTER'); setError(null); setSuccessMsg(null); }}
              className={`flex-1 py-2 rounded-xl transition ${mode === 'REGISTER' ? 'bg-white text-emerald-800 shadow-sm font-black' : 'text-gray-500'}`}
            >
              New Registration
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2 text-xs text-red-900 font-bold animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2 text-xs text-emerald-900 font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* 1. SIGN-IN MODE (STRICT EMAIL + PASSWORD)                */}
        {/* ======================================================== */}
        {mode === 'LOGIN' && (
          <form onSubmit={handlePasswordLogin} className="space-y-3.5 text-xs animate-in fade-in">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Email Address</label>
              <div className="relative flex rounded-xl border border-gray-200 overflow-hidden focus-within:border-emerald-600">
                <span className="bg-stone-100 px-3 py-2 text-xs text-gray-500 border-r border-gray-200 flex items-center">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="e.g. kisan@agriconnect.org"
                  className="w-full px-3 py-2 font-bold text-gray-900 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-gray-700">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('FORGOT_PASSWORD');
                    setResetStep(1);
                    setResetEmail(loginEmail);
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-emerald-700 hover:underline font-bold text-[11px]"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none pr-9 font-bold"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black rounded-2xl shadow transition text-xs flex items-center justify-center gap-2 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Agri Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* 2. REGISTRATION MODE (EMAIL + PASSWORD + ROLE SPECIFICS) */}
        {/* ======================================================== */}
        {mode === 'REGISTER' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs animate-in fade-in">
            {/* Role Selection */}
            <div>
              <label className="font-black text-gray-800 block mb-1.5 uppercase tracking-wider text-[11px]">
                Select Your Role:
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
                  <span className="block text-[11px]">Vendor/Buyer</span>
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

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                <label className="font-bold text-gray-700 block mb-1">Email Address *</label>
                <input
                  type="email"
                  placeholder="e.g. ramesh@farm.org"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none font-bold"
                  required
                />
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-gray-700">Create Password *</label>
                  <span className={`text-[10px] font-bold ${strength.text}`}>{strength.label}</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none font-bold pr-8"
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
                <label className="font-bold text-gray-700 block mb-1">Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={regConfirmPassword}
                    onChange={e => setRegConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none font-bold pr-8"
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

            {/* Automatic GPS Location Detection & Reverse Geocoding */}
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
                        placeholder="Village"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 block mb-0.5">District</label>
                      <input
                        type="text"
                        value={regDistrict}
                        onChange={e => setRegDistrict(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-bold outline-none"
                        placeholder="District"
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
                        placeholder="State"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 block mb-0.5">PIN Code</label>
                      <input
                        type="text"
                        value={regPincode}
                        onChange={e => setRegPincode(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-bold outline-none"
                        placeholder="PIN code"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Role Specific Additional Fields */}
            {selectedRole === 'FARMER' && (
              <div>
                <label className="font-bold text-gray-700 block mb-1">Land Holding (Acres)</label>
                <input
                  type="number"
                  step="0.5"
                  value={regAcreage}
                  onChange={e => setRegAcreage(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 outline-none font-bold"
                />
              </div>
            )}

            {selectedRole === 'VENDOR' && (
              <div className="space-y-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Agro Shop Name *</label>
                  <input
                    type="text"
                    placeholder="Sri Lakshmi Agri Inputs"
                    value={shopName}
                    onChange={e => setShopName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 outline-none font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">License Number</label>
                  <input
                    type="text"
                    placeholder="e.g. AP/AGRI/54321"
                    value={shopLicense}
                    onChange={e => setShopLicense(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 outline-none"
                  />
                </div>
              </div>
            )}

            {selectedRole === 'BUYER' && (
              <div>
                <label className="font-bold text-gray-700 block mb-1">Wholesale Firm / Company Name *</label>
                <input
                  type="text"
                  placeholder="Kisan Mandi Traders"
                  value={buyerCompany}
                  onChange={e => setBuyerCompany(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 outline-none font-bold"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black rounded-2xl shadow transition text-xs flex items-center justify-center gap-2 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Launch</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* 3. FORGOT PASSWORD (EMAIL OTP RESET FLOW)                */}
        {/* ======================================================== */}
        {mode === 'FORGOT_PASSWORD' && (
          <div className="space-y-3.5 text-xs animate-in fade-in">
            <div className="flex items-center justify-between pb-1">
              <button
                type="button"
                onClick={() => { setMode('LOGIN'); setError(null); }}
                className="flex items-center gap-1 text-emerald-800 hover:underline font-bold text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </button>
              <span className="text-[11px] text-gray-400 font-bold">Step {resetStep} of 3</span>
            </div>

            {/* Step 1: Enter Email */}
            {resetStep === 1 && (
              <form onSubmit={handleSendResetOtp} className="space-y-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Registered Email Address</label>
                  <div className="relative flex rounded-xl border border-gray-200 overflow-hidden focus-within:border-emerald-600">
                    <span className="bg-stone-100 px-3 py-2 text-xs text-gray-500 border-r border-gray-200 flex items-center">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      placeholder="e.g. kisan@agriconnect.org"
                      className="w-full px-3 py-2 font-bold text-gray-900 outline-none"
                      required
                    />
                  </div>
                </div>

                <p className="text-[11px] text-gray-500">
                  We'll send a 6-digit verification code to your email to securely reset your password.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting || !resetEmail}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black rounded-2xl shadow transition text-xs flex items-center justify-center gap-2 active:scale-95"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Reset OTP Code →</span>}
                </button>
              </form>
            )}

            {/* Step 2: Enter 6-digit OTP */}
            {resetStep === 2 && (
              <form onSubmit={handleVerifyResetOtp} className="space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Enter OTP sent to <b>{resetEmail}</b></span>
                  <button type="button" onClick={() => setResetStep(1)} className="text-emerald-700 font-bold hover:underline">
                    Edit Email
                  </button>
                </div>

                <div className="grid grid-cols-6 gap-1.5">
                  {resetOtpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => (resetOtpRefs.current[idx] = el)}
                      type="text"
                      maxLength={1}
                      inputMode="numeric"
                      value={digit}
                      onChange={e => handleOtpBoxChange(idx, e.target.value, resetOtpDigits, setResetOtpDigits, resetOtpRefs)}
                      onKeyDown={e => handleOtpKeyDown(idx, e, resetOtpDigits, resetOtpRefs)}
                      className="w-full h-11 text-center font-black text-base rounded-xl border border-gray-300 focus:border-emerald-600 outline-none"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold">
                  {isTimerRunning ? (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Resend OTP in {countdown}s
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
                      <RefreshCw className="w-3.5 h-3.5" /> Resend Code
                    </button>
                  )}
                  <span className="text-gray-400">Valid for 5 mins</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || resetOtpDigits.join('').length < 6}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black rounded-2xl shadow transition text-xs flex items-center justify-center gap-2 active:scale-95"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify OTP Code →</span>}
                </button>
              </form>
            )}

            {/* Step 3: Enter New Password */}
            {resetStep === 3 && (
              <form onSubmit={handleCompletePasswordReset} className="space-y-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Enter New Password *</label>
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Confirm New Password *</label>
                  <input
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 outline-none font-bold"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !newPassword}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black rounded-2xl shadow transition text-xs flex items-center justify-center gap-2 active:scale-95"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save New Password & Sign In</span>}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Universal Footer Cancel / Dismiss Button */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
          <span className="text-[11px] text-gray-400">AgriConnect Secure Auth</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
          >
            Cancel / ಮುಚ್ಚಿ
          </button>
        </div>
      </div>
    </div>
  );
};
