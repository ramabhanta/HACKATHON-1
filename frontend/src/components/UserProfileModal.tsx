import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  X,
  User,
  Camera,
  MapPin,
  Lock,
  Building2,
  Sprout,
  Store,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  FileText
} from 'lucide-react';
import { detectLocation } from '../services/geolocationService';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 6 Curated Agricultural Avatars for Indian Farmers, Dealers & Wholesalers
const PRESET_AVATARS = [
  {
    id: 'farmer-cap',
    label: 'Organic Farmer',
    icon: '🌾',
    url: 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=250&auto=format&fit=crop&q=80'
  },
  {
    id: 'agronomist',
    label: 'Modern Agronomist',
    icon: '🔬',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&auto=format&fit=crop&q=80'
  },
  {
    id: 'dealer',
    label: 'Agro Shop Owner',
    icon: '🏪',
    url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=250&auto=format&fit=crop&q=80'
  },
  {
    id: 'tractor',
    label: 'Mechanized Farmer',
    icon: '🚜',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=250&auto=format&fit=crop&q=80'
  },
  {
    id: 'kisan-village',
    label: 'Village Kisan',
    icon: '🌻',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80'
  },
  {
    id: 'buyer',
    label: 'Mandi Wholesaler',
    icon: '📦',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80'
  }
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, role } = useAuth();
  const { t } = useLanguage();

  // Form states
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [totalAcreage, setTotalAcreage] = useState('');
  const [primaryCrops, setPrimaryCrops] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [shopName, setShopName] = useState('');

  // Status & Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize values from user profile
  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || '');
      setBio(user.bio || '');
      setAvatarUrl(user.avatarUrl || '');
      setVillage(user.village || 'Kadiri Rural');
      setDistrict(user.district || 'Sri Sathya Sai');
      setState(user.state || 'Andhra Pradesh');
      setPincode(user.pincode || '515591');
      setTotalAcreage(user.totalAcreage ? String(user.totalAcreage) : '5.0');
      setPrimaryCrops(Array.isArray(user.primaryCrops) ? user.primaryCrops.join(', ') : 'Groundnut, Tomato');
      setCompanyName(user.companyName || '');
      setShopName(user.shopName || '');
      setToast(null);
    }
  }, [user, isOpen]);

  // Universal Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    if (type === 'success') {
      setTimeout(() => {
        setToast(null);
        onClose();
      }, 1500);
    } else {
      setTimeout(() => setToast(null), 4000);
    }
  };

  // Handle custom image upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, or WebP).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be under 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // One-tap Auto-Detect GPS Location
  const handleAutoDetectLocation = async () => {
    setIsDetectingGps(true);
    try {
      const loc = await detectLocation();
      setVillage(loc.village || loc.taluk || village);
      setDistrict(loc.district || district);
      setState(loc.state || state);
      setPincode(loc.pincode || pincode);
      showToast(`📍 Location updated: ${loc.village || loc.taluk}, ${loc.district}`);
    } catch (err: any) {
      showToast(err.message || 'Location access denied or unavailable.', 'error');
    } finally {
      setIsDetectingGps(false);
    }
  };

  // Save changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter your full name.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const cropsArray = primaryCrops
        ? primaryCrops.split(',').map(c => c.trim()).filter(Boolean)
        : ['Groundnut', 'Tomato'];

      const updates: any = {
        name: name.trim(),
        bio: bio.trim(),
        avatarUrl,
        village: village.trim(),
        district: district.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        totalAcreage: totalAcreage ? parseFloat(totalAcreage) : undefined,
        primaryCrops: cropsArray,
        companyName: companyName.trim(),
        shopName: shopName.trim()
      };

      const result = await updateProfile(updates);
      if (result.success) {
        showToast('Profile updated successfully!', 'success');
      } else {
        showToast(result.error || 'Failed to update profile.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error while saving profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden my-6 transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Toast Alert */}
        {toast && (
          <div
            className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold transition-all animate-in slide-in-from-top-2 ${
              toast.type === 'success'
                ? 'bg-emerald-800 text-white border border-emerald-600'
                : 'bg-red-800 text-white border border-red-600'
            }`}
          >
            {toast.type === 'success' ? <Check className="w-4 h-4 text-emerald-300" /> : <AlertCircle className="w-4 h-4 text-red-300" />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Modal Header with High-Contrast 40x40px Close Button ('✕') */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <User className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Edit Farmer & Account Profile</h3>
              <p className="text-[11px] text-emerald-200">Manage display avatar, bio, farm address, and verified credentials</p>
            </div>
          </div>

          {/* Top-Right Close Button ('✕') */}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition border border-white/20 shadow-sm shrink-0"
            title="Close (Esc)"
            aria-label="Close Profile Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* 1. Avatar Customization Section */}
          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100/80 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-700" />
                <span>Profile Picture & Agricultural Avatar</span>
              </label>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                JPG, PNG, WebP up to 5MB
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Active Avatar Preview with Camera badge */}
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-emerald-600 text-white font-black text-2xl flex items-center justify-center border-2 border-emerald-500 overflow-hidden shadow-md">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{name ? name.charAt(0).toUpperCase() : user.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 shadow-md transition active:scale-90 border border-amber-500"
                  title="Upload Custom Photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
              </div>

              {/* 6 Preset Agricultural Avatars Grid */}
              <div className="flex-1 w-full min-w-0">
                <p className="text-[11px] font-bold text-gray-700 mb-2">
                  Or select an authentic agricultural identity:
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESET_AVATARS.map(preset => {
                    const isSelected = avatarUrl === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setAvatarUrl(preset.url)}
                        className={`relative rounded-xl p-1 border transition flex flex-col items-center gap-1 group text-center ${
                          isSelected
                            ? 'border-emerald-600 bg-white shadow-sm ring-2 ring-emerald-500/40'
                            : 'border-emerald-200/60 bg-white/60 hover:bg-white hover:border-emerald-400'
                        }`}
                        title={preset.label}
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden relative">
                          <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                          <span className="absolute bottom-0 right-0 text-[10px] bg-black/60 rounded px-0.5 leading-none">
                            {preset.icon}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-gray-700 line-clamp-1 leading-tight">
                          {preset.label}
                        </span>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-xs">
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Editable User Profile Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Full Display Name</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Ramesh Patel, Shivaraj Kumar"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>

            {/* Bio / About (max 200 chars) */}
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Bio / About</span>
                </label>
                <span className={`text-[10px] font-mono font-bold ${bio.length > 180 ? 'text-amber-600' : 'text-gray-400'}`}>
                  {bio.length}/200
                </span>
              </div>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value.slice(0, 200))}
                rows={2}
                placeholder="e.g. Organic Groundnut & Tomato grower in Kadiri Mandal. Interested in direct Mandi procurement."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition resize-none"
              />
            </div>

            {/* Address & Location with GPS Auto-Detect */}
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Farm / Street Address</span>
                </label>
                <button
                  type="button"
                  onClick={handleAutoDetectLocation}
                  disabled={isDetectingGps}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isDetectingGps ? 'animate-spin text-emerald-600' : ''}`} />
                  <span>{isDetectingGps ? 'Detecting GPS...' : '📍 Auto-Detect GPS'}</span>
                </button>
              </div>
              <input
                type="text"
                value={village}
                onChange={e => setVillage(e.target.value)}
                placeholder="Village / Street / Survey No."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>

            {/* District & Taluk */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Taluk / District</label>
              <input
                type="text"
                value={district}
                onChange={e => setDistrict(e.target.value)}
                placeholder="District (e.g. Sri Sathya Sai)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
              />
            </div>

            {/* State & PIN Code */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-700">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={e => setState(e.target.value)}
                    placeholder="State"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700">PIN Code</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={e => setPincode(e.target.value)}
                    placeholder="PIN Code"
                    maxLength={6}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                  />
                </div>
              </div>
            </div>

            {/* Role-Specific Editable Attributes */}
            {role === 'FARMER' ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Total Land Acreage</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={totalAcreage}
                    onChange={e => setTotalAcreage(e.target.value)}
                    placeholder="e.g. 5.0 Acres"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Primary Standing Crops</label>
                  <input
                    type="text"
                    value={primaryCrops}
                    onChange={e => setPrimaryCrops(e.target.value)}
                    placeholder="e.g. Groundnut, Tomato, Paddy"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                  />
                </div>
              </>
            ) : role === 'BUYER' ? (
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Company / Business Trade Name</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. Sri Balaji Agro Commodities Pvt Ltd"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>
            ) : role === 'VENDOR' ? (
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-teal-600" />
                  <span>Agro Inputs Retail Shop Name</span>
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={e => setShopName(e.target.value)}
                  placeholder="e.g. Lakshmi Fertilizer & Seed Depot"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>
            ) : null}
          </div>

          {/* 3. Strictly LOCKED (Read-Only) Fields Section */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200 space-y-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-500" />
              <p className="text-xs font-bold text-gray-700">Strictly Locked Security Credentials</p>
              <span className="text-[10px] font-bold text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                Read-Only
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                  <span>Registered Mobile Number</span>
                  <Lock className="w-3 h-3 text-gray-400" />
                </label>
                <input
                  type="text"
                  value={user.phone || '+91 98480 12345'}
                  disabled
                  className="w-full px-3 py-2 rounded-xl bg-gray-100 text-gray-500 font-mono text-xs cursor-not-allowed border border-gray-200 mt-1 select-none"
                />
                <p className="text-[10px] text-gray-400 mt-0.5">🔒 Registered credential (cannot be modified)</p>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                  <span>Registered Account Role</span>
                  <Lock className="w-3 h-3 text-gray-400" />
                </label>
                <div className="w-full px-3 py-2 rounded-xl bg-gray-100 text-gray-600 font-bold text-xs border border-gray-200 mt-1 flex items-center justify-between select-none">
                  <span>{user.role}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full">
                    VERIFIED
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">🔒 Primary portal permission level</p>
              </div>
            </div>
          </div>

          {/* Action Buttons: Save & Cancel */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-xs transition active:scale-95"
            >
              Cancel / ಹಿಂದೆ
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs transition shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Save Changes / ಉಳಿಸಿ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
