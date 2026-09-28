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
  Search
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenVoice: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenVoice, onOpenAuth }) => {
  const { user, role, switchRole, logout, isAuthenticated } = useAuth();
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
    { role: 'FARMER', label: 'Farmer (రైతు / किसान)', icon: '🌾', defaultTab: 'home' },
    { role: 'BUYER', label: 'Produce Buyer (Mandi Desk)', icon: '📦', defaultTab: 'buyer-portal' },
    { role: 'VENDOR', label: 'Agri Shop Vendor (Storefront)', icon: '🏪', defaultTab: 'vendor-portal' },
    { role: 'ADMIN', label: 'Platform Overseer (Admin)', icon: '⚙️', defaultTab: 'admin-portal' }
  ];

  const displayModes: { mode: DisplayMode; label: string; sub: string; icon: any }[] = [
    { mode: 'PRO', label: 'Clean Pro Mode', sub: 'Full data telemetry & graphs', icon: Sun },
    { mode: 'SIMPLE', label: 'Simple Field Mode', sub: 'High-contrast large touch targets', icon: Layout },
    { mode: 'DARK', label: 'Dark Night Mode', sub: 'Eye-friendly low-light theme', icon: Moon }
  ];

  const currentModeObj = displayModes.find(m => m.mode === mode) || displayModes[0];

  const ModeIcon = currentModeObj.icon;

  return (
    <header className={`sticky top-0 z-40 text-white shadow-md transition-colors duration-200 ${
      isDarkMode
        ? 'bg-slate-900 border-b border-slate-800'
        : isSimpleMode
        ? 'bg-emerald-900 border-b-4 border-amber-400'
        : 'bg-emerald-800'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => {
              if (role === 'BUYER') setActiveTab('buyer-portal');
              else if (role === 'VENDOR') setActiveTab('vendor-portal');
              else if (role === 'ADMIN') setActiveTab('admin-portal');
              else setActiveTab('home');
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <span className="text-2xl">🌾</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white">Agri<span className="text-amber-400">Dex</span></span>
                <span className="text-[10px] bg-amber-400 text-amber-950 font-black px-1.5 py-0.5 rounded shadow-sm uppercase">AI</span>
                {isSimpleMode && (
                  <span className="text-[10px] bg-emerald-500/40 text-emerald-200 border border-emerald-400/50 font-black px-1.5 py-0.5 rounded uppercase">
                    Field Mode
                  </span>
                )}
              </div>
              <p className="text-[10px] text-emerald-100 hidden sm:block tracking-wide">
                AI for Every Farmer — Diagnose, Decide, Buy, Sell & Grow
              </p>
            </div>
          </div>

          {/* Center Navigation (Desktop) - Adapts intelligently per active role */}
          <nav className="hidden lg:flex items-center gap-1">
            {role === 'BUYER' ? (
              <>
                <button
                  onClick={() => setActiveTab('buyer-portal')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                    activeTab === 'buyer-portal' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-emerald-100 hover:bg-emerald-700/50'
                  }`}
                >
                  <span>📦</span> Mandi Lots Desk
                </button>
                <button
                  onClick={() => setActiveTab('produce')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                    activeTab === 'produce' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-emerald-100 hover:bg-emerald-700/50'
                  }`}
                >
                  <span>🌾</span> Farmer Market
                </button>
                <button
                  onClick={() => setActiveTab('prices')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                    activeTab === 'prices' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-emerald-100 hover:bg-emerald-700/50'
                  }`}
                >
                  <span>📊</span> All-India Rates
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                    activeTab === 'chat' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-emerald-100 hover:bg-emerald-700/50'
                  }`}
                >
                  <span>💬</span> Logistics Chat
                </button>
              </>
            ) : role === 'VENDOR' ? (
              <>
                <button
                  onClick={() => setActiveTab('vendor-portal')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                    activeTab === 'vendor-portal' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-emerald-100 hover:bg-emerald-700/50'
                  }`}
                >
                  <span>🏪</span> Vendor Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('store')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                    activeTab === 'store' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-emerald-100 hover:bg-emerald-700/50'
                  }`}
                >
                  <span>🛒</span> Product Catalog
                </button>
                <button
                  onClick={() => setActiveTab('prices')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                    activeTab === 'prices' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-emerald-100 hover:bg-emerald-700/50'
                  }`}
                >
                  <span>📊</span> Mandi Market Prices
                </button>
              </>
            ) : role === 'ADMIN' ? (
              <>
                <button
                  onClick={() => setActiveTab('admin-portal')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                    activeTab === 'admin-portal' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-emerald-100 hover:bg-emerald-700/50'
                  }`}
                >
                  <span>⚙️</span> Platform Admin Hub
                </button>
                <button
                  onClick={() => setActiveTab('prices')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                    activeTab === 'prices' ? 'bg-emerald-900/80 text-white' : 'text-emerald-100 hover:bg-emerald-700/50'
                  }`}
                >
                  <span>📊</span> Market Rates
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('home')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                    activeTab === 'home' || activeTab === 'simple-dashboard' ? 'bg-emerald-900/80 text-white' : 'text-emerald-100 hover:bg-emerald-700/50'
                  }`}
                >
                  {t('home')}
                </button>
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1 ${
                    activeTab === 'ai' ? 'bg-emerald-900/80 text-white' : 'text-emerald-100 hover:bg-emerald-700/50'
                  }`}
                >
                  <span>🤖</span> {t('aiAssistant')}
                </button>
                <button
                  onClick={() => setActiveTab('scan')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1 ${
                    activeTab === 'scan' ? 'bg-emerald-900/80 text-white' : 'text-emerald-100 hover:bg-emerald-700/50'
                  }`}
                >
                  <span>📷</span> {t('scanCrop')}
                </button>
                <button
                  onClick={() => setActiveTab('store')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1 ${
                    activeTab === 'store' ? 'bg-emerald-900/80 text-white' : 'text-emerald-100 hover:bg-emerald-700/50'
                  }`}
                >
                  <span>🛒</span> {t('store')}
                </button>
                <button
                  onClick={() => setActiveTab('produce')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1 ${
                    activeTab === 'produce' ? 'bg-emerald-900/80 text-white' : 'text-emerald-100 hover:bg-emerald-700/50'
                  }`}
                >
                  <span>📦</span> {t('sellProduce')}
                </button>
                <button
                  onClick={() => setActiveTab('prices')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1 ${
                    activeTab === 'prices' ? 'bg-emerald-900/80 text-white' : 'text-emerald-100 hover:bg-emerald-700/50'
                  }`}
                >
                  <span>📊</span> {t('mandiPrices')}
                </button>
                <button
                  onClick={() => setActiveTab('farm-manager')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                    activeTab === 'farm-manager' ? 'bg-emerald-900/80 text-white' : 'text-emerald-100 hover:bg-emerald-700/50'
                  }`}
                >
                  {t('farmManager')}
                </button>
              </>
            )}
            <button
              onClick={() => setActiveTab('login')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1 ${
                activeTab === 'login' ? 'bg-emerald-900/80 text-white' : 'text-emerald-100 hover:bg-emerald-700/50'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          </nav>

          {/* Right Controls: Voice, Mode Switcher, Language, Role Switcher, Cart, Profile */}
          <div className="flex items-center gap-2">
            {/* Voice Assistant Button */}
            <button
              onClick={onOpenVoice}
              title="Voice Farming Assistant"
              className="p-2 rounded-full bg-emerald-700/80 hover:bg-emerald-600 text-amber-300 border border-emerald-500/50 shadow-sm transition active:scale-95"
            >
              <Volume2 className="w-5 h-5" />
            </button>

            {/* Display Mode Switcher (Clean Pro / Simple Field / Dark Night) */}
            <div className="relative">
              <button
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

            {/* Role Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowRoleMenu(!showRoleMenu);
                  setShowModeMenu(false);
                  setShowLangMenu(false);
                  setShowUserMenu(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-400/30 text-xs font-semibold transition"
                title="Switch Demonstration Role"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline capitalize">{role.toLowerCase()}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl py-2 text-gray-800 border border-gray-100 z-50">
                  <div className="px-3 py-1.5 border-b border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Test Any Platform Role</p>
                    <p className="text-[11px] text-gray-500">Instantly switch role workstations</p>
                  </div>
                  {roles.map(r => (
                    <button
                      key={r.role}
                      onClick={() => {
                        switchRole(r.role);
                        setShowRoleMenu(false);
                        setActiveTab(r.defaultTab);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-xs hover:bg-emerald-50 flex items-center gap-2.5 transition ${
                        role === r.role ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-gray-700'
                      }`}
                    >
                      <span className="text-xl">{r.icon}</span>
                      <div className="flex-1">
                        <p className="font-bold text-xs">{r.label}</p>
                        <p className="text-[10px] text-gray-400">Opens {r.defaultTab.replace('-', ' ')}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>


            {/* User Account / Sign In Dropdown */}
            <div className="relative">
              {isAuthenticated && user ? (
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-emerald-700/60 hover:bg-emerald-700 text-white transition text-xs font-semibold"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-600 border border-emerald-400 flex items-center justify-center text-[11px] font-black text-white">
                    {user.name.charAt(0)}
                  </div>
                  <span className="hidden md:inline max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                  <ChevronDown className="w-3 h-3 text-emerald-300" />
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab('login')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs transition shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}

              {/* User Dropdown Menu */}
              {showUserMenu && user && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl p-3 text-gray-800 border border-gray-100 z-50 space-y-2">
                  <div className="border-b border-gray-100 pb-2">
                    <p className="font-extrabold text-xs text-gray-900">{user.name}</p>
                    <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                        {user.role}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {user.village || 'Kadiri'}, {user.district || 'Andhra Pradesh'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setActiveTab('login');
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-gray-50 text-xs text-gray-700 flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5 text-gray-500" />
                      <span>Login / Switch Account</span>
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
              onClick={() => setActiveTab('cart')}
              className="relative p-2 rounded-lg bg-emerald-700/60 hover:bg-emerald-700 text-white transition"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 text-amber-950 text-xs font-black rounded-full flex items-center justify-center border-2 border-emerald-800 shadow-sm animate-pulse">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

