import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { CartProvider } from './context/CartContext';
import { DisplayModeProvider, useDisplayMode } from './context/DisplayModeContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { AuthModal } from './components/AuthModal';

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
  const { role } = useAuth();
  const { isSimpleMode, mode } = useDisplayMode();
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isVoiceOpen, setIsVoiceOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [prefilledAiQuery, setPrefilledAiQuery] = useState<string>('');

  const handleVoiceQuery = (query: string) => {
    setPrefilledAiQuery(query);
    setActiveTab('ai');
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        if (isSimpleMode) {
          return <SimpleFieldDashboard setActiveTab={setActiveTab} onOpenVoice={() => setIsVoiceOpen(true)} />;
        }
        if (role === 'BUYER') return <BuyerPortal setActiveTab={setActiveTab} />;
        if (role === 'VENDOR') return <VendorPortal />;
        if (role === 'ADMIN') return <AdminPortal />;
        return <Dashboard setActiveTab={setActiveTab} onOpenVoice={() => setIsVoiceOpen(true)} />;
      case 'simple-dashboard':
        return <SimpleFieldDashboard setActiveTab={setActiveTab} onOpenVoice={() => setIsVoiceOpen(true)} />;
      case 'buyer-portal':
        return <BuyerPortal setActiveTab={setActiveTab} />;
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
      case 'vendor-portal':
        return <VendorPortal />;
      case 'admin-portal':
        return <AdminPortal />;
      case 'login':
        return <LoginPage setActiveTab={setActiveTab} />;
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
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {renderActiveScreen()}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onSubmitQuery={handleVoiceQuery}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
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

