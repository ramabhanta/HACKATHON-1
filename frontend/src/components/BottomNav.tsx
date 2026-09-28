import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useDisplayMode } from '../context/DisplayModeContext';
import { Home, Bot, Camera, ShoppingBag, TrendingUp, Layers, Package, Store, MessageSquare } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { t } = useLanguage();
  const { totalItems } = useCart();
  const { role } = useAuth();
  const { isDarkMode, isSimpleMode } = useDisplayMode();

  let navItems: { id: string; label: string; icon: any; isCenter?: boolean; badge?: number }[] = [];

  if (role === 'BUYER') {
    navItems = [
      { id: 'buyer-portal', label: 'Mandi Desk', icon: Package },
      { id: 'prices', label: t('mandiPrices'), icon: TrendingUp },
      { id: 'produce', label: 'Farmer Lots', icon: Layers, isCenter: true },
      { id: 'chat', label: 'Messages', icon: MessageSquare },
      { id: 'home', label: 'Overview', icon: Home }
    ];
  } else if (role === 'VENDOR') {
    navItems = [
      { id: 'vendor-portal', label: 'Vendor Desk', icon: Store },
      { id: 'store', label: t('store'), icon: ShoppingBag, badge: totalItems },
      { id: 'prices', label: t('mandiPrices'), icon: TrendingUp, isCenter: true },
      { id: 'chat', label: 'Messages', icon: MessageSquare },
      { id: 'home', label: 'Overview', icon: Home }
    ];
  } else {
    // Default: Farmer
    navItems = [
      { id: 'home', label: isSimpleMode ? 'రైతు హోమ్' : t('home'), icon: Home },
      { id: 'prices', label: t('mandiPrices'), icon: TrendingUp },
      { id: 'scan', label: t('scanCrop'), icon: Camera, isCenter: true },
      { id: 'store', label: t('store'), icon: ShoppingBag, badge: totalItems },
      { id: 'produce', label: t('sellProduce'), icon: Layers }
    ];
  }

  return (
    <div
      className={`md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md px-2 py-1 shadow-2xl transition-colors duration-200 ${
        isDarkMode
          ? 'bg-slate-900/95 border-t border-slate-800 text-slate-200'
          : isSimpleMode
          ? 'bg-amber-50/95 border-t-2 border-amber-300 text-stone-900'
          : 'bg-white/95 border-t border-gray-200 text-gray-800'
      }`}
    >
      <div className="flex items-center justify-around">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.isCenter) {
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center -mt-5 group"
              >
                <div
                  className={`w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                    isActive
                      ? 'bg-amber-500 text-white ring-4 ring-emerald-200'
                      : isDarkMode
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                      : 'bg-emerald-700 text-white hover:bg-emerald-800'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span
                  className={`text-[10px] font-black mt-1 ${
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
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center py-1 px-2 relative transition ${
                isActive
                  ? isDarkMode
                    ? 'text-emerald-400 font-black'
                    : 'text-emerald-700 font-black'
                  : isDarkMode
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-gray-500 hover:text-emerald-600'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 bg-amber-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

