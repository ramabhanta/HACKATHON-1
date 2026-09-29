import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { CartProvider } from './context/CartContext';
import { DisplayModeProvider, useDisplayMode } from './context/DisplayModeContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';

import { Dashboard } from './pages/Dashboard/Dashboard';
import { SimpleFieldDashboard } from './components/SimpleFieldDashboard';
import { BuyerPortal } from './pages/BuyerPortal/BuyerPortal';
import { AiAssistant } from './pages/AiAssistant/AiAssistant';
import { DiseaseScan } from './pages/DiseaseScan/DiseaseScan';
import { SoilHealth } from './pages/SoilHealth/SoilHealth';
import { Marketplace } from './pages/Marketplace/Marketplace';
import { CartCheckout } from './pages/CartCheckout/CartCheckout';
import { OrderHistory } from './pages/OrderHistory/OrderHistory';
import { NearbyShops } from './pages/NearbyShops/NearbyShops';
import { ProduceMarket } from './pages/ProduceMarket/ProduceMarket';
import { FarmManager } from './pages/FarmManager/FarmManager';
import { Chat } from './pages/Chat/Chat';
import { VendorPortal } from './pages/VendorPortal/VendorPortal';
import { AdminPortal } from './pages/AdminPortal/AdminPortal';
import { LoginPage } from './pages/Auth/LoginPage';
import { MarketPrices } from './pages/MarketPrices/MarketPrices';

function MainApp() {
  const { role, user, isAuthenticated } = useAuth();
  const { isSimpleMode, mode } = useDisplayMode();
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isVoiceOpen, setIsVoiceOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [prefilledAiQuery, setPrefilledAiQuery] = useState<string>('');

  const handleVoiceQuery = (query: string) => {
    setPrefilledAiQuery(query);
    setActiveTab('ai');
  };

  // Mandatory Authentication Gate for First-Time / Unauthenticated Visitors
  if (!isAuthenticated || !user) {
    return (
      <div
        className={`min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-emerald-200 ${
          mode === 'DARK'
            ? 'bg-slate-950 text-slate-100'
            : isSimpleMode
            ? 'bg-amber-50/50 text-stone-900'
            : 'bg-stone-50 text-gray-900'
        }`}
      >
        <header className="sticky top-0 z-40 bg-emerald-800 text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                <span className="text-2xl">🌾</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white">Agro<span className="text-amber-400">Dex</span></span>
                <span className="text-[10px] bg-amber-400 text-amber-950 font-black px-1.5 py-0.5 rounded shadow-sm uppercase">AI</span>
              </div>
            </div>
            <div className="text-xs text-emerald-200 font-semibold flex items-center gap-1.5">
              <span>🔒 Farmer & Dealer Gateway</span>
            </div>
          </div>
        </header>
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 flex items-center justify-center">
          <LoginPage setActiveTab={setActiveTab} />
        </main>
      </div>
    );
  }

  // Enforce role boundaries strictly
  const renderActiveScreen = () => {
    if (role === 'BUYER') {
      switch (activeTab) {
        case 'buyer-portal':
          return <BuyerPortal setActiveTab={setActiveTab} />;
        case 'produce':
          return <ProduceMarket setActiveTab={setActiveTab} />;
        case 'prices':
          return <MarketPrices setActiveTab={setActiveTab} />;
        case 'chat':
          return <Chat />;
        default:
          return <BuyerPortal setActiveTab={setActiveTab} />;
      }
    }

    if (role === 'VENDOR') {
      switch (activeTab) {
        case 'vendor-portal':
          return <VendorPortal />;
        case 'store':
          return <Marketplace setActiveTab={setActiveTab} />;
        case 'orders':
          return <OrderHistory setActiveTab={setActiveTab} />;
        case 'prices':
          return <MarketPrices setActiveTab={setActiveTab} />;
        case 'chat':
          return <Chat />;
        default:
          return <VendorPortal />;
      }
    }

    if (role === 'ADMIN') {
      switch (activeTab) {
        case 'admin-portal':
          return <AdminPortal />;
        case 'prices':
          return <MarketPrices setActiveTab={setActiveTab} />;
        default:
          return <AdminPortal />;
      }
    }

    // Default: Farmer Role Boundaries
    switch (activeTab) {
      case 'home':
        if (isSimpleMode) {
          return <SimpleFieldDashboard setActiveTab={setActiveTab} onOpenVoice={() => setIsVoiceOpen(true)} />;
        }
        return <Dashboard setActiveTab={setActiveTab} onOpenVoice={() => setIsVoiceOpen(true)} />;
      case 'simple-dashboard':
        return <SimpleFieldDashboard setActiveTab={setActiveTab} onOpenVoice={() => setIsVoiceOpen(true)} />;
      case 'ai':
        return <AiAssistant setActiveTab={setActiveTab} onOpenVoice={() => setIsVoiceOpen(true)} />;
      case 'scan':
        return <DiseaseScan setActiveTab={setActiveTab} />;
      case 'soil':
        return <SoilHealth setActiveTab={setActiveTab} />;
      case 'store':
        return <Marketplace setActiveTab={setActiveTab} />;
      case 'cart':
        return <CartCheckout setActiveTab={setActiveTab} />;
      case 'orders':
        return <OrderHistory setActiveTab={setActiveTab} />;
      case 'shops':
        return <NearbyShops setActiveTab={setActiveTab} />;
      case 'produce':
        return <ProduceMarket setActiveTab={setActiveTab} />;
      case 'prices':
        return <MarketPrices setActiveTab={setActiveTab} />;
      case 'farm-manager':
        return <FarmManager setActiveTab={setActiveTab} />;
      case 'chat':
        return <Chat />;
      default:
        return <Dashboard setActiveTab={setActiveTab} onOpenVoice={() => setIsVoiceOpen(true)} />;
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-emerald-200 ${
        mode === 'DARK'
          ? 'bg-slate-950 text-slate-100'
          : isSimpleMode
          ? 'bg-amber-50/50 text-stone-900'
          : 'bg-stone-50 text-gray-900'
      }`}
    >
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenVoice={() => setIsVoiceOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-28 md:pb-8 overflow-x-hidden">
        {renderActiveScreen()}
      </main>

      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenVoice={() => setIsVoiceOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onSubmitQuery={handleVoiceQuery}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <CartProvider>
          <DisplayModeProvider>
            <MainApp />
          </DisplayModeProvider>
        </CartProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

