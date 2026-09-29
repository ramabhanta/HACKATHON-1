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

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenVoice?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, onOpenVoice }) => {
  const { t, language, setLanguage, languages, currentLangMeta } = useLanguage();
  const { totalItems } = useCart();
  const { role, user, logout } = useAuth();
  const { isDarkMode, isSimpleMode, mode, setMode } = useDisplayMode();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);

  // Prime bottom bar items
  let navItems: { id: string; label: string; icon: any; isCenter?: boolean; badge?: number }[] = [];

  if (role === 'BUYER') {
    navItems = [
      { id: 'buyer-portal', label: t('buyerPortal') || 'Buyer Desk', icon: Package },
      { id: 'prices', label: t('mandiPrices') || 'Mandi Rates', icon: TrendingUp },
      { id: 'produce', label: t('farmerLots') || 'Procure Lots', icon: Layers, isCenter: true },
      { id: 'chat', label: t('chat') || 'Chat', icon: MessageSquare },
      { id: 'menu', label: 'All Features', icon: Grid }
    ];
  } else if (role === 'VENDOR') {
    navItems = [
      { id: 'vendor-portal', label: t('vendorDesk') || 'Vendor Desk', icon: Store },
      { id: 'store', label: t('store') || 'Catalog', icon: ShoppingBag, badge: totalItems },
      { id: 'prices', label: t('mandiPrices') || 'Market Rates', icon: TrendingUp, isCenter: true },
      { id: 'orders', label: 'Orders', icon: ClipboardList },
      { id: 'menu', label: 'All Features', icon: Grid }
    ];
  } else {
    // Default: Farmer
    navItems = [
      { id: 'home', label: isSimpleMode ? t('farmerHome') || 'Home' : t('home') || 'Home', icon: Home },
      { id: 'store', label: t('store') || 'Agri Store', icon: ShoppingBag, badge: totalItems },
      { id: 'scan', label: t('scanCrop') || 'Scan Crop', icon: Camera, isCenter: true },
      { id: 'prices', label: t('mandiPrices') || 'Mandi Rates', icon: TrendingUp },
      { id: 'menu', label: 'All Features', icon: Grid }
    ];
  }

  // Comprehensive drawer actions covering 100% desktop feature parity
  const farmerFeatures = [
    { id: 'ai', title: t('aiAssistant') || 'AI Agronomist', desc: 'Ask Gemini 2.5 Flash crop & soil questions', icon: Bot, color: 'bg-emerald-500 text-white' },
    { id: 'scan', title: t('scanCrop') || 'Crop Disease Scan', desc: 'Real-time camera scan & AI leaf diagnosis', icon: Camera, color: 'bg-amber-500 text-white' },
    { id: 'store', title: t('store') || 'Agri Store Depot', desc: 'Authentic fertilizers, seeds, sprayers & tools', icon: ShoppingBag, color: 'bg-teal-500 text-white', badge: totalItems },
    { id: 'prices', title: t('mandiPrices') || 'Mandi Live Prices', desc: '100+ APMC live rates & price forecasts', icon: TrendingUp, color: 'bg-blue-500 text-white' },
    { id: 'produce', title: t('sellProduce') || 'Sell Harvested Produce', desc: 'Connect directly with verified buyers', icon: Layers, color: 'bg-purple-500 text-white' },
    { id: 'soil', title: t('soilHealth') || 'Soil Health Card', desc: 'NPK test records & custom fertigation plans', icon: FlaskConical, color: 'bg-amber-600 text-white' },
    { id: 'farm-manager', title: t('farmManager') || 'Farm & Plot Manager', desc: 'GPS mapped plots & crop growth telemetry', icon: Tractor, color: 'bg-lime-600 text-white' },
    { id: 'orders', title: 'My Booking Orders', desc: 'Track 24h dealer reservation SLA orders', icon: ClipboardList, color: 'bg-orange-500 text-white' },
    { id: 'shops', title: 'Nearby Input Retailers', desc: 'Verified local agro dealers within 25km', icon: Store, color: 'bg-indigo-500 text-white' },
    { id: 'cart', title: 'Cart & Checkout', desc: 'Review selected agricultural inputs', icon: ShoppingBag, color: 'bg-emerald-600 text-white', badge: totalItems },
    { id: 'chat', title: t('chat') || 'Farmer Community Chat', desc: 'Telugu, Kannada, Hindi & English farmers', icon: MessageSquare, color: 'bg-cyan-600 text-white' }
  ];

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
        <div className="flex items-center justify-around h-15">
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
                className={`flex flex-col items-center justify-center py-1 px-2.5 relative min-w-[48px] min-h-[48px] transition active:scale-95 ${
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
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
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
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-gray-900 flex items-center justify-center transition"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
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
                  className="px-3 py-1.5 rounded-xl bg-emerald-700 text-amber-300 font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shadow-xs"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Voice Advisory</span>
                </button>
              )}

              {/* Display Mode Toggle */}
              <button
                onClick={() => setMode(mode === 'DARK' ? 'PRO' : mode === 'PRO' ? 'SIMPLE' : 'DARK')}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap text-gray-700 dark:text-gray-200"
              >
                {mode === 'DARK' ? <Moon className="w-3.5 h-3.5 text-amber-400" /> : mode === 'SIMPLE' ? <Layout className="w-3.5 h-3.5 text-emerald-600" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                <span>Mode: {mode}</span>
              </button>

              {/* Language Switcher */}
              <button
                onClick={() => setShowLangPicker(!showLangPicker)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap text-gray-700 dark:text-gray-200"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span>{currentLangMeta?.nativeName || language.toUpperCase()}</span>
              </button>
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
                {farmerFeatures.map(feat => {
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

            {/* Drawer Footer with Sign Out */}
            <div className="p-3 bg-gray-50 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                {user?.phone || 'Guest User'}
              </span>
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  logout();
                }}
                className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 border border-red-200"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


