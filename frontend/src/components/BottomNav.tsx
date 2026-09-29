import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useDisplayMode } from '../context/DisplayModeContext';
import {
  Home,
  Bot,
  Camera,
  ShoppingBag,
  TrendingUp,
  Layers,
  Package,
  Store,
  MessageSquare,
  Grid,
  X,
  ChevronRight,
  FlaskConical,
  Tractor,
  ClipboardList,
  LogOut,
  Sun,
  Moon,
  Layout,
  Globe,
  Sparkles,
  PhoneCall,
  Volume2
} from 'lucide-react';

interface DrawerFeature {
  id: string;
  title: string;
  desc: string;
  icon: any;
  color: string;
  badge?: number;
}

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenVoice?: () => void;
  onOpenProfile?: () => void;
  isDrawerOpen?: boolean;
  setIsDrawerOpen?: (open: boolean) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenVoice,
  onOpenProfile,
  isDrawerOpen: controlledDrawerOpen,
  setIsDrawerOpen: controlledSetDrawerOpen
}) => {
  const { t, language, setLanguage, languages, currentLangMeta } = useLanguage();
  const { totalItems } = useCart();
  const { role, user, logout } = useAuth();
  const { isDarkMode, isSimpleMode, mode, setMode } = useDisplayMode();

  const [internalDrawerOpen, setInternalDrawerOpen] = useState(false);
  const isDrawerOpen = controlledDrawerOpen !== undefined ? controlledDrawerOpen : internalDrawerOpen;
  const setIsDrawerOpen = controlledSetDrawerOpen || setInternalDrawerOpen;
  const [showLangPicker, setShowLangPicker] = useState(false);

  // Universal Escape key listener for BottomNav mobile drawer
  React.useEffect(() => {
    if (!isDrawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDrawerOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  // Prime bottom bar items (4 daily actions + Menu)
  let navItems: { id: string; label: string; icon: any; isCenter?: boolean; badge?: number }[] = [];

  if (role === 'BUYER') {
    navItems = [
      { id: 'buyer-portal', label: 'Procurement', icon: Package },
      { id: 'produce', label: 'Farmer Market', icon: Layers, isCenter: true },
      { id: 'purchase-offers', label: 'Offers', icon: ClipboardList },
      { id: 'prices', label: 'Mandi Rates', icon: TrendingUp },
      { id: 'menu', label: t('All Features') || 'More', icon: Grid }
    ];
  } else if (role === 'VENDOR') {
    navItems = [
      { id: 'vendor-portal', label: 'Inventory', icon: Store },
      { id: 'orders', label: 'Orders', icon: ClipboardList, isCenter: true },
      { id: 'store', label: 'Catalog', icon: ShoppingBag, badge: totalItems },
      { id: 'prices', label: 'Mandi Rates', icon: TrendingUp },
      { id: 'menu', label: t('All Features') || 'More', icon: Grid }
    ];
  } else {
    // Default: Farmer
    navItems = [
      { id: 'home', label: isSimpleMode ? t('farmerHome') || t('home') : t('home'), icon: Home },
      { id: 'scan', label: t('scanCrop') || 'Scan Crop', icon: Camera, isCenter: true },
      { id: 'store', label: t('store') || 'Agri Store', icon: ShoppingBag, badge: totalItems },
      { id: 'prices', label: t('mandiPrices') || 'Mandi Rates', icon: TrendingUp },
      { id: 'menu', label: t('All Features') || 'More', icon: Grid }
    ];
  }

  // Comprehensive drawer actions covering 100% desktop feature parity
  const farmerFeatures: DrawerFeature[] = [
    { id: 'produce', title: t('sellProduce') || 'Sell Produce', desc: 'Connect directly with verified buyers & create harvest lots', icon: Layers, color: 'bg-purple-500 text-white' },
    { id: 'farm-manager', title: t('farmManager') || 'Farm Manager', desc: 'GPS mapped plots & crop growth telemetry', icon: Tractor, color: 'bg-lime-600 text-white' },
    { id: 'ai', title: t('aiAssistant') || 'AI Assistant', desc: 'Ask Gemini 2.5 Flash crop & soil questions', icon: Bot, color: 'bg-emerald-500 text-white' },
    { id: 'scan', title: t('scanCrop') || 'Scan Crop', desc: 'Real-time camera scan & AI leaf diagnosis', icon: Camera, color: 'bg-amber-500 text-white' },
    { id: 'store', title: t('store') || 'Agri Store', desc: 'Authentic fertilizers, seeds, sprayers & tools', icon: ShoppingBag, color: 'bg-teal-500 text-white', badge: totalItems },
    { id: 'prices', title: t('mandiPrices') || 'Mandi Prices', desc: '100+ APMC live rates & price forecasts', icon: TrendingUp, color: 'bg-blue-500 text-white' },
    { id: 'soil', title: t('soilHealth') || 'Soil Health Card', desc: 'NPK test records & custom fertigation plans', icon: FlaskConical, color: 'bg-amber-600 text-white' },
    { id: 'orders', title: t('My Booking Orders') || 'My Booking Orders', desc: 'Track 24h dealer reservation SLA orders', icon: ClipboardList, color: 'bg-orange-500 text-white' },
    { id: 'shops', title: t('Nearby Input Retailers') || 'Nearby Retailers', desc: 'Verified local agro dealers within 25km', icon: Store, color: 'bg-indigo-500 text-white' },
    { id: 'cart', title: t('Cart & Checkout') || 'Cart & Checkout', desc: 'Review selected agricultural inputs', icon: ShoppingBag, color: 'bg-emerald-600 text-white', badge: totalItems },
    { id: 'chat', title: t('chat') || 'Farmer Chat', desc: 'Telugu, Kannada, Hindi & English farmers', icon: MessageSquare, color: 'bg-cyan-600 text-white' }
  ];

  const buyerFeatures: DrawerFeature[] = [
    { id: 'buyer-portal', title: 'Procurement Desk', desc: 'Manage purchase contracts & active demands', icon: Package, color: 'bg-emerald-600 text-white' },
    { id: 'purchase-offers', title: 'Purchase Offers', desc: 'Post new commodity purchase offers with target rates', icon: ClipboardList, color: 'bg-blue-600 text-white' },
    { id: 'produce', title: 'Farmer Market Lots', desc: 'Browse verified ready-to-harvest farmer produce', icon: Layers, color: 'bg-purple-600 text-white' },
    { id: 'prices', title: 'Mandi Rates', desc: '100+ APMC live mandi rates & daily trend graphs', icon: TrendingUp, color: 'bg-amber-600 text-white' },
    { id: 'chat', title: 'Logistics Chat', desc: 'Direct chat with farmers and transport drivers', icon: MessageSquare, color: 'bg-cyan-600 text-white' }
  ];

  const vendorFeatures: DrawerFeature[] = [
    { id: 'vendor-portal', title: 'Inventory & Stock', desc: 'Manage fertilizers, seeds, pesticides & inventory', icon: Store, color: 'bg-emerald-600 text-white' },
    { id: 'orders', title: 'Customer Orders', desc: 'Farmer booking reservations & pickup status', icon: ClipboardList, color: 'bg-amber-600 text-white' },
    { id: 'nearby-requests', title: 'Nearby Requests', desc: 'Incoming farmer procurement bids and offers', icon: Layers, color: 'bg-teal-600 text-white' },
    { id: 'analytics', title: 'Shop Analytics', desc: 'Daily revenue, fast-moving items and analytics', icon: TrendingUp, color: 'bg-purple-600 text-white' },
    { id: 'store', title: 'Product Catalog', desc: 'Customer-facing catalog of agro inputs', icon: ShoppingBag, color: 'bg-indigo-600 text-white', badge: totalItems },
    { id: 'prices', title: 'Mandi Benchmarks', desc: 'Live commodity prices for procurement reference', icon: TrendingUp, color: 'bg-blue-600 text-white' },
    { id: 'chat', title: 'Dealer Support Chat', desc: 'Coordinate with farmers, buyers & distributors', icon: MessageSquare, color: 'bg-cyan-600 text-white' }
  ];

  const activeFeatures = role === 'BUYER' ? buyerFeatures : role === 'VENDOR' ? vendorFeatures : farmerFeatures;

  const handleItemClick = (id: string) => {
    if (id === 'menu') {
      setIsDrawerOpen(true);
      return;
    }
    setActiveTab(id);
    setIsDrawerOpen(false);
  };

  return (
    <>
      {/* 1. Sleek Persistent Bottom Bar */}
      <nav
        aria-label="Mobile Navigation Bar"
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-lg px-2 py-1 shadow-2xl transition-colors duration-200 ${
          isDarkMode
            ? 'bg-slate-900/95 border-t border-slate-800 text-slate-200'
            : isSimpleMode
            ? 'bg-amber-50/95 border-t-2 border-amber-300 text-stone-900'
            : 'bg-white/95 border-t border-gray-200 text-gray-800'
        }`}
      >
        <div className="flex items-center justify-around h-16">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            if (item.isCenter) {
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className="flex flex-col items-center -mt-6 group min-w-[56px] min-h-[56px] justify-center focus:outline-none"
                  aria-label={item.label}
                >
                  <div
                    className={`w-13 h-13 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 active:scale-90 ${
                      isActive
                        ? 'bg-amber-500 text-white ring-4 ring-emerald-200 scale-105'
                        : isDarkMode
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                        : 'bg-emerald-700 text-white hover:bg-emerald-800'
                    }`}
                  >
                    <Icon className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <span
                    className={`text-[10px] font-black mt-1 line-clamp-1 max-w-[64px] text-center ${
                      isActive
                        ? isDarkMode
                          ? 'text-amber-400'
                          : 'text-emerald-700'
                        : isDarkMode
                        ? 'text-slate-400'
                        : 'text-gray-600'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-2.5 relative min-w-[52px] min-h-[44px] h-12 transition active:scale-95 ${
                  isActive
                    ? isDarkMode
                      ? 'text-emerald-400 font-black'
                      : 'text-emerald-700 font-black'
                    : isDarkMode
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-gray-500 hover:text-emerald-600'
                }`}
                aria-label={item.label}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -top-1.5 -right-2 bg-amber-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap line-clamp-1">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 2. Comprehensive Mobile "All Features" Slide-Out Drawer */}
      {isDrawerOpen && (
        <div
          onClick={() => setIsDrawerOpen(false)}
          className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            onClick={e => e.stopPropagation()}
            className={`w-full max-h-[88vh] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 ${
              isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'
            }`}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg">
                  🌾
                </div>
                <div>
                  <h3 className="font-black text-sm text-gray-900 dark:text-white leading-tight">
                    AgroDex Super Platform
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {user?.name || 'Farmer'} • {user?.village || 'Kadiri Rural'} ({role})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-gray-900 flex items-center justify-center transition active:scale-95 border border-gray-200 dark:border-slate-700"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick System Action Chips */}
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
              {/* Voice Farming Assistant */}
              {onOpenVoice && (
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenVoice();
                  }}
                  className="h-11 min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-700 text-amber-300 font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shadow-xs"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Voice Advisory</span>
                </button>
              )}

              {/* Display Mode Toggle */}
              <button
                onClick={() => setMode(mode === 'DARK' ? 'PRO' : mode === 'PRO' ? 'SIMPLE' : 'DARK')}
                className="h-11 min-h-[44px] px-3.5 py-2 rounded-xl bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap text-gray-700 dark:text-gray-200"
              >
                {mode === 'DARK' ? <Moon className="w-3.5 h-3.5 text-amber-400" /> : mode === 'SIMPLE' ? <Layout className="w-3.5 h-3.5 text-emerald-600" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                <span>Mode: {mode}</span>
              </button>

              {/* Language Switcher */}
              <button
                onClick={() => setShowLangPicker(!showLangPicker)}
                className="h-11 min-h-[44px] px-3.5 py-2 rounded-xl bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap text-gray-700 dark:text-gray-200"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span>{currentLangMeta?.nativeName || language.toUpperCase()}</span>
              </button>
            </div>

            {/* 1-Tap Quick Action Grid for Core Tools */}
            <div className="p-4 pb-2 border-b border-gray-100 dark:border-slate-800">
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                <span>⚡</span> <span>1-Tap Instant Quick Actions</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'scan', label: 'AI Disease Scan', icon: '📷', bg: 'bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-200' },
                  { id: 'soil', label: 'Soil Health Card', icon: '🌱', bg: 'bg-lime-50 hover:bg-lime-100 text-lime-950 border-lime-200' },
                  { id: 'store', label: 'Agro Store', icon: '🛒', bg: 'bg-teal-50 hover:bg-teal-100 text-teal-950 border-teal-200' },
                  { id: 'prices', label: 'Mandi Rates', icon: '📈', bg: 'bg-blue-50 hover:bg-blue-100 text-blue-950 border-blue-200' },
                  { id: 'farm-manager', label: 'Farm Manager', icon: '🚜', bg: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-200' },
                  { id: 'produce', label: 'Sell Produce', icon: '📦', bg: 'bg-purple-50 hover:bg-purple-100 text-purple-950 border-purple-200' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsDrawerOpen(false);
                    }}
                    className={`h-11 min-h-[44px] px-3 py-2 rounded-xl border font-bold text-xs flex items-center gap-2 transition active:scale-95 shadow-2xs ${item.bg}`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Inline Language Picker Popup in Drawer */}
            {showLangPicker && (
              <div className="p-3 bg-emerald-50 dark:bg-slate-800 border-b border-emerald-200 dark:border-slate-700 max-h-48 overflow-y-auto grid grid-cols-2 gap-2 text-xs">
                {languages.map(l => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      setShowLangPicker(false);
                    }}
                    className={`p-2 rounded-xl text-left font-bold flex items-center justify-between border ${
                      language === l.code
                        ? 'bg-emerald-700 text-white border-emerald-800'
                        : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-slate-600'
                    }`}
                  >
                    <span>{l.flag} {l.nativeName}</span>
                    {language === l.code && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}

            {/* All Feature Cards Grid */}
            <div className="p-4 overflow-y-auto max-h-[58vh] space-y-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                Complete Feature Suite (100% Parity)
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeFeatures.map(feat => {
                  const Icon = feat.icon;
                  const isCurrent = activeTab === feat.id;

                  return (
                    <button
                      key={feat.id}
                      onClick={() => {
                        setActiveTab(feat.id);
                        setIsDrawerOpen(false);
                      }}
                      className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between gap-3 min-h-[56px] active:scale-98 ${
                        isCurrent
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-sm'
                          : 'bg-gray-50/70 dark:bg-slate-800/40 border-gray-100 dark:border-slate-800 hover:bg-emerald-50/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl ${feat.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-xs text-gray-900 dark:text-white truncate">
                              {feat.title}
                            </span>
                            {feat.badge && feat.badge > 0 ? (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-500 text-white">
                                {feat.badge}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                            {feat.desc}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer with Interactive User Profile & Sign Out */}
            <div className="p-3 bg-gray-50 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2">
              {user ? (
                <div
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenProfile?.();
                  }}
                  className="flex items-center gap-2 cursor-pointer hover:bg-emerald-50 dark:hover:bg-slate-700/60 p-1.5 rounded-xl transition flex-1 min-w-0"
                  title="Edit Profile & Avatar"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 border border-emerald-400 flex items-center justify-center text-xs font-black text-white overflow-hidden shrink-0 shadow-xs">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold text-gray-900 dark:text-white truncate flex items-center gap-1">
                      <span>{user.name}</span>
                      <span className="text-[10px] text-emerald-600 font-bold">✏️</span>
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono truncate">
                      {user.role} • {user.village || 'Kadiri'}
                    </p>
                  </div>
                </div>
              ) : (
                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                  Guest User
                </span>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 font-bold text-xs hover:bg-gray-100 dark:hover:bg-slate-800 transition active:scale-95"
                >
                  Close / ಮುಚ್ಚಿ
                </button>
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    logout();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs flex items-center gap-1 transition active:scale-95 border border-red-200 shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


