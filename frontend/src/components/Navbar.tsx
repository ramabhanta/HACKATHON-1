import React, { useState, useEffect } from 'react';
import { useAuth, UserRole } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useDisplayMode, DisplayMode } from '../context/DisplayModeContext';
import {
  Sprout,
  ShoppingCart,
  Bell,
  Globe,
  UserCheck,
  ChevronDown,
  X,
  Volume2,
  User,
  LogOut,
  LogIn,
  MapPin,
  ShieldCheck,
  Sun,
  Moon,
  Layout,
  Layers,
  Sparkles,
  Eye,
  Search,
  RefreshCw,
  Menu
} from 'lucide-react';
import { detectLocation, getCachedLocation } from '../services/geolocationService';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenVoice: () => void;
  onOpenAuth: () => void;
  onOpenProfile?: () => void;
  onOpenMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenVoice,
  onOpenAuth,
  onOpenProfile,
  onOpenMenu
}) => {
  const { user, role, switchRole, logout, isAuthenticated, updateProfile } = useAuth();
  const { language, setLanguage, t, languages, currentLangMeta } = useLanguage();
  const { totalItems } = useCart();
  const { mode, setMode, isSimpleMode, isDarkMode } = useDisplayMode();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  const handleRetargetNavbarGPS = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsDetectingGps(true);
    try {
      const geo = await detectLocation();
      if (updateProfile) {
        await updateProfile({
          village: geo.village || geo.taluk || user?.village,
          district: geo.district || user?.district,
          state: geo.state || user?.state,
          latitude: geo.lat,
          longitude: geo.lng
        });
      }
    } catch (err) {
      console.error('GPS retarget error in Navbar:', err);
    } finally {
      setIsDetectingGps(false);
    }
  };


  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('agri_token')}` }
      });
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (e) {
      // ignore network errors
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 6000);
    return () => clearInterval(interval);
  }, [role]);

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('agri_token')}` }
      });
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    try {
      await fetch(`/api/notifications/${notif.id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('agri_token')}` }
      });
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
    setShowNotifMenu(false);
    if (notif.linkUrl) {
      if (notif.linkUrl.includes('produce')) setActiveTab('produce');
      else if (notif.linkUrl.includes('vendor')) setActiveTab('vendor-portal');
      else if (notif.linkUrl.includes('buyer')) setActiveTab('buyer-portal');
      else if (notif.linkUrl.includes('order')) setActiveTab('orders');
    }
  };

  const unreadNotifs = notifications.filter(n => !n.isRead);

  const roles: { role: UserRole; label: string; icon: string; defaultTab: string }[] = [
    { role: 'FARMER', label: t('roleFarmerTitle'), icon: '🌾', defaultTab: 'home' },
    { role: 'BUYER', label: t('roleBuyerTitle'), icon: '📦', defaultTab: 'buyer-portal' },
    { role: 'VENDOR', label: t('roleVendorTitle'), icon: '🏪', defaultTab: 'vendor-portal' },
    { role: 'ADMIN', label: t('roleAdminTitle'), icon: '⚙️', defaultTab: 'admin-portal' }
  ];

  const displayModes: { mode: DisplayMode; label: string; sub: string; icon: any }[] = [
    { mode: 'PRO', label: 'Clean Pro Mode', sub: 'Full data telemetry & graphs', icon: Sun },
    { mode: 'SIMPLE', label: 'Simple Field Mode', sub: 'High-contrast large touch targets', icon: Layout },
    { mode: 'DARK', label: 'Dark Night Mode', sub: 'Eye-friendly low-light theme', icon: Moon }
  ];

  const currentModeObj = displayModes.find(m => m.mode === mode) || displayModes[0];
  const ModeIcon = currentModeObj.icon;

  const getNavPillClass = (isActive: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 shadow-xs ${
      isActive
        ? isDarkMode
          ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm ring-1 ring-emerald-400/50 scale-[1.02]'
          : 'bg-white text-emerald-950 font-bold shadow-sm ring-1 ring-white/50 scale-[1.02]'
        : isDarkMode
        ? 'text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95'
        : 'text-emerald-100 hover:text-white hover:bg-white/15 active:scale-95'
    }`;

  return (
    <header className={`sticky top-0 z-40 text-white shadow-md transition-colors duration-200 ${
      isDarkMode
        ? 'bg-slate-900 border-b border-slate-800'
        : isSimpleMode
        ? 'bg-emerald-900 border-b-4 border-amber-400'
        : 'bg-emerald-800'
    }`}>
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* 1. Left Zone: AgroDex Logo + Active Role Badge */}
          <div
            className="flex items-center gap-2 cursor-pointer select-none shrink-0"
            onClick={() => {
              if (role === 'BUYER') setActiveTab('buyer-portal');
              else if (role === 'VENDOR') setActiveTab('inventory');
              else if (role === 'ADMIN') setActiveTab('admin-portal');
              else setActiveTab(isSimpleMode ? 'simple-dashboard' : 'home');
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner shrink-0">
              <span className="text-2xl">🌾</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                  Agro<span className="text-amber-400">Dex</span>
                </span>
                <span className="text-[10px] bg-amber-400 text-amber-950 font-black px-1.5 py-0.5 rounded shadow-sm uppercase">
                  AI
                </span>
                {/* Active Role Badge */}
                {role === 'BUYER' ? (
                  <span className="text-[10px] bg-amber-500/20 text-amber-200 border border-amber-400/40 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    📦 Buyer
                  </span>
                ) : role === 'VENDOR' ? (
                  <span className="text-[10px] bg-teal-500/20 text-teal-200 border border-teal-400/40 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    🏪 Agro Shop
                  </span>
                ) : role === 'ADMIN' ? (
                  <span className="text-[10px] bg-purple-500/20 text-purple-200 border border-purple-400/40 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    ⚙️ Admin
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-700/80 text-emerald-100 border border-emerald-400/50 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    🌾 {isSimpleMode ? 'Field Mode' : 'Farmer'}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-emerald-100 hidden sm:block tracking-wide">
                AI for Every Farmer — Diagnose, Decide, Buy, Sell & Grow
              </p>
            </div>
          </div>

          {/* 2. Center Zone: Primary Navigation Pills (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1.5 xl:gap-2 overflow-x-auto scrollbar-none py-1">
            {role === 'BUYER' ? (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('buyer-portal')}
                  className={getNavPillClass(activeTab === 'buyer-portal')}
                >
                  <span>📦</span> {t('procurementDesk') || 'Procurement Desk'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('purchase-offers')}
                  className={getNavPillClass(activeTab === 'purchase-offers')}
                >
                  <span>📑</span> {t('purchaseOffers') || 'Purchase Offers'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('produce')}
                  className={getNavPillClass(activeTab === 'produce')}
                >
                  <span>🌾</span> {t('farmerMarket') || 'Farmer Market'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('prices')}
                  className={getNavPillClass(activeTab === 'prices')}
                >
                  <span>📊</span> {t('mandiRates') || 'Mandi Rates'}
                </button>
              </>
            ) : role === 'VENDOR' ? (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('inventory')}
                  className={getNavPillClass(activeTab === 'inventory' || activeTab === 'vendor-portal')}
                >
                  <span>🏪</span> {t('inventoryAndStock') || 'Inventory & Stock'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className={getNavPillClass(activeTab === 'orders')}
                >
                  <span>📦</span> {t('customerOrders') || 'Customer Orders'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('nearby-requests')}
                  className={getNavPillClass(activeTab === 'nearby-requests')}
                >
                  <span>📍</span> {t('nearbyRequests') || 'Nearby Requests'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('analytics')}
                  className={getNavPillClass(activeTab === 'analytics')}
                >
                  <span>📈</span> {t('shopAnalytics') || 'Shop Analytics'}
                </button>
              </>
            ) : role === 'ADMIN' ? (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('admin-portal')}
                  className={getNavPillClass(activeTab === 'admin-portal')}
                >
                  <span>⚙️</span> {t('platformAdminHub') || 'Admin Portal'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('prices')}
                  className={getNavPillClass(activeTab === 'prices')}
                >
                  <span>📊</span> {t('marketRates') || 'Market Rates'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab(isSimpleMode ? 'simple-dashboard' : 'home')}
                  className={getNavPillClass(activeTab === 'home' || activeTab === 'simple-dashboard')}
                >
                  <span>🌾</span> {t('myFarm') || t('home') || 'My Farm'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ai')}
                  className={getNavPillClass(activeTab === 'ai')}
                >
                  <span>🤖</span> {t('aiAssistant') || 'AI Assistant'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('scan')}
                  className={getNavPillClass(activeTab === 'scan')}
                >
                  <span>📷</span> {t('scanCrop') || 'Scan Crop'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('store')}
                  className={getNavPillClass(activeTab === 'store')}
                >
                  <span>🛒</span> {t('agriStore') || t('store') || 'Agri Store'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('produce')}
                  className={getNavPillClass(activeTab === 'produce')}
                >
                  <span>📦</span> {t('sellProduce') || 'Sell Produce'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('prices')}
                  className={getNavPillClass(activeTab === 'prices')}
                >
                  <span>📊</span> {t('mandiPrices') || 'Mandi Prices'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('farm-manager')}
                  className={getNavPillClass(activeTab === 'farm-manager')}
                >
                  <span>🚜</span> {t('farmManager') || 'Farm Manager'}
                </button>
              </>
            )}
          </nav>

          {/* 3. Right Zone: Utility Controls neatly grouped */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Audio Assist (Desktop) */}
            <button
              type="button"
              onClick={onOpenVoice}
              title="Voice Farming Assistant / Audio Assist"
              aria-label="Voice Farming Assistant"
              className="hidden md:flex p-2 rounded-full bg-emerald-700/80 hover:bg-emerald-600 text-amber-300 border border-emerald-500/50 shadow-sm transition active:scale-95"
            >
              <Volume2 className="w-5 h-5" />
            </button>

            {/* Display Mode Switcher (Clean Pro / Simple Field / Dark Night) - Desktop */}
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => {
                  setShowModeMenu(!showModeMenu);
                  setShowRoleMenu(false);
                  setShowLangMenu(false);
                  setShowUserMenu(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-700/70 hover:bg-emerald-600 border border-emerald-500/60 transition shadow-sm"
                title="Switch Interface Mode"
              >
                <ModeIcon className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden xl:inline">{currentModeObj.label}</span>
                <ChevronDown className="w-3 h-3 text-emerald-300" />
              </button>

              {showModeMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl p-2 text-gray-800 border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Display & Usability Mode</p>
                    <p className="text-xs text-gray-600 font-medium">Select interface optimized for your environment</p>
                  </div>
                  <div className="p-1 space-y-1">
                    {displayModes.map(dm => {
                      const Icon = dm.icon;
                      const isSelected = mode === dm.mode;
                      return (
                        <button
                          key={dm.mode}
                          onClick={() => {
                            setMode(dm.mode);
                            setShowModeMenu(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl transition flex items-start gap-2.5 ${
                            isSelected
                              ? 'bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold'
                              : 'hover:bg-gray-50 text-gray-700 font-medium'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold">{dm.label}</p>
                              {isSelected && <span className="text-xs text-emerald-600 font-extrabold">✓</span>}
                            </div>
                            <p className="text-[11px] text-gray-500 leading-tight">{dm.sub}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* All-India Language Selector (11 Indian Languages) */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowLangMenu(!showLangMenu);
                  setShowModeMenu(false);
                  setShowRoleMenu(false);
                  setShowUserMenu(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-700/60 hover:bg-emerald-700 border border-emerald-600/60 transition shadow-sm"
                title="Select Indian Language"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-200" />
                <span className="font-extrabold">{currentLangMeta?.nativeName || language.toUpperCase()}</span>
                <ChevronDown className="w-3 h-3 text-emerald-300" />
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl p-2.5 text-gray-800 border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-2 py-1.5 border-b border-gray-100 mb-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-black text-gray-600 uppercase tracking-wider">
                        🇮🇳 Select Language / భాష / भाषा
                      </p>
                      <button
                        onClick={() => setShowLangMenu(false)}
                        className="text-gray-400 hover:text-gray-600 p-0.5 rounded-lg hover:bg-gray-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                      ✓ Instant translation across all 11 Indian languages
                    </p>

                    {/* Search filter */}
                    <div className="relative mt-2">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search language or state..."
                        value={langSearch}
                        onChange={e => setLangSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-1 p-0.5">
                    {languages
                      .filter(l =>
                        l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
                        l.nativeName.toLowerCase().includes(langSearch.toLowerCase()) ||
                        l.region.toLowerCase().includes(langSearch.toLowerCase())
                      )
                      .map(l => {
                        const isSelected = language === l.code;
                        return (
                          <button
                            key={l.code}
                            onClick={() => {
                              setLanguage(l.code);
                              setShowLangMenu(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold'
                                : 'hover:bg-gray-50 text-gray-700 font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-base">{l.flag}</span>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-gray-900">{l.nativeName}</span>
                                  <span className="text-[11px] text-gray-400">({l.name})</span>
                                </div>
                                <p className="text-[10px] text-gray-500 leading-tight">{l.region}</p>
                              </div>
                            </div>
                            {isSelected && (
                              <span className="text-xs font-black text-emerald-600 bg-emerald-100/70 px-1.5 py-0.5 rounded-full">
                                ✓
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>




            {/* Live Location Pill (Header Display) */}
            {isAuthenticated && user && (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/40 text-emerald-100 text-xs font-semibold shadow-xs">
                <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="max-w-[120px] truncate">
                  {user.village || getCachedLocation()?.village || 'Kadiri'}, {user.district || getCachedLocation()?.district || 'Sri Sathya Sai'}
                </span>
                <button
                  onClick={handleRetargetNavbarGPS}
                  disabled={isDetectingGps}
                  className="p-1 rounded-full hover:bg-emerald-600/80 text-amber-300 hover:text-white transition disabled:opacity-50"
                  title="Detect & Retarget Live GPS Location"
                >
                  <RefreshCw className={`w-3 h-3 ${isDetectingGps ? 'animate-spin text-amber-400' : ''}`} />
                </button>
              </div>
            )}

            {/* User Account / Sign In Dropdown */}
            {isAuthenticated && user && (
              <div className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-full bg-emerald-700/60 hover:bg-emerald-700 text-white transition text-xs font-semibold shadow-xs"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-600 border border-emerald-400 flex items-center justify-center text-[11px] font-black text-white overflow-hidden shrink-0">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="hidden md:inline max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3 h-3 text-emerald-300" />
                </button>

              {/* User Dropdown Menu */}
              {showUserMenu && user && (
                <div className="absolute right-0 mt-2 w-68 bg-white rounded-2xl shadow-2xl p-3 text-gray-800 border border-gray-100 z-50 space-y-2">
                  <div
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenProfile?.();
                    }}
                    className="border-b border-gray-100 pb-2 cursor-pointer hover:bg-emerald-50/60 p-2 rounded-xl transition group"
                    title="Click to edit profile & avatar"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 border border-emerald-400 flex items-center justify-center text-xs font-black text-white overflow-hidden shrink-0 shadow-xs">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-extrabold text-xs text-gray-900 truncate group-hover:text-emerald-800 transition">{user.name}</p>
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.2 rounded-md">Edit ✏️</span>
                        </div>
                        <p className="text-[11px] font-mono text-gray-500 truncate">{user.phone || user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                        {user.role}
                      </span>
                      {user.bio && (
                        <p className="text-[10px] text-gray-500 line-clamp-1 italic">"{user.bio}"</p>
                      )}
                    </div>

                    {/* Live Location interactive badge */}
                    <div className="flex items-center justify-between gap-1.5 mt-2 bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span className="text-[11px] font-bold text-emerald-950 truncate">
                          {user.village || getCachedLocation()?.village || 'Kadiri'}, {user.district || getCachedLocation()?.district || 'Sri Sathya Sai'}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRetargetNavbarGPS(e);
                        }}
                        disabled={isDetectingGps}
                        className="p-1 rounded-lg bg-white hover:bg-emerald-100 text-emerald-700 shadow-xs border border-emerald-200 transition shrink-0"
                        title="Detect & Retarget Live GPS Location"
                      >
                        <RefreshCw className={`w-3 h-3 ${isDetectingGps ? 'animate-spin text-emerald-600' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenProfile?.();
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-xs text-emerald-950 font-bold flex items-center gap-2 transition"
                    >
                      <User className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Edit Profile & Avatar</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setActiveTab('login');
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-gray-50 text-xs text-gray-700 flex items-center gap-2"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-gray-500" />
                      <span>Switch Account</span>
                    </button>

                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-50 text-xs text-red-600 font-semibold flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

            {/* Unauthenticated Sign In Button */}
            {!isAuthenticated && (
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs transition shadow-sm shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Notification Bell with Real-Time Unread Count & Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifMenu(!showNotifMenu);
                  setShowRoleMenu(false);
                  setShowLangMenu(false);
                  setShowUserMenu(false);
                  setShowModeMenu(false);
                }}
                className="relative p-2 rounded-lg bg-emerald-700/60 hover:bg-emerald-700 text-white transition active:scale-95"
                title="Notifications & Mandi Deal Alerts"
              >
                <Bell className="w-5 h-5 text-amber-300" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-emerald-800 shadow-sm animate-pulse">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl p-3 text-gray-800 border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2 px-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">🔔</span>
                      <h4 className="font-black text-xs text-gray-900">Notifications & Deal Alerts</h4>
                      {unreadNotifs.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-red-100 text-red-700">
                          {unreadNotifs.length} new
                        </span>
                      )}
                    </div>
                    {unreadNotifs.length > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 py-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-xs text-gray-400">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 8).map(n => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-2.5 rounded-xl cursor-pointer transition text-left space-y-1 ${
                            !n.isRead ? 'bg-emerald-50/70 hover:bg-emerald-100/60' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-extrabold text-xs text-gray-900 leading-tight">
                              {n.title}
                            </p>
                            {!n.isRead && (
                              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                            {n.body}
                          </p>
                          <p className="text-[9px] text-gray-400 font-semibold">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Click to open
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Cart Icon with Counter */}
            <button
              type="button"
              onClick={() => setActiveTab('cart')}
              className="relative p-2 rounded-lg bg-emerald-700/60 hover:bg-emerald-700 text-white transition shrink-0"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 text-amber-950 text-xs font-black rounded-full flex items-center justify-center border-2 border-emerald-800 shadow-sm animate-pulse">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Mobile & Tablet: Responsive Hamburger Menu Button (☰) */}
            <button
              type="button"
              onClick={onOpenMenu}
              className="lg:hidden p-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-amber-300 border border-emerald-500/50 shadow-sm transition active:scale-95 min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

