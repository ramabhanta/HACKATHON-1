import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useDisplayMode } from '../context/DisplayModeContext';
import {
  Camera,
  Bot,
  TrendingUp,
  ShoppingBag,
  Volume2,
  CloudSun,
  Droplets,
  Sprout,
  ArrowRight,
  Sparkles,
  Phone,
  Layers
} from 'lucide-react';

interface SimpleFieldDashboardProps {
  setActiveTab: (tab: string) => void;
  onOpenVoice: () => void;
}

export const SimpleFieldDashboard: React.FC<SimpleFieldDashboardProps> = ({
  setActiveTab,
  onOpenVoice
}) => {
  const { t, language } = useLanguage();
  const { setMode } = useDisplayMode();

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-4xl mx-auto">
      {/* Mode Indicator & Switcher Banner */}
      <div className="bg-amber-100 border-2 border-amber-300 rounded-3xl p-4 flex items-center justify-between gap-3 text-amber-950">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🌾</span>
          <div>
            <span className="text-xs font-black uppercase tracking-wider block">
              రైతు సులభ మోడ్ • Simple Field Mode
            </span>
            <span className="text-xs text-amber-900">
              High contrast, large buttons, simplified for field use under sunlight.
            </span>
          </div>
        </div>
        <button
          onClick={() => setMode('PRO')}
          className="px-3.5 py-2 rounded-xl bg-emerald-800 text-white font-black text-xs shadow-md transition active:scale-95 shrink-0"
        >
          Switch to Pro Analytics 📊
        </button>
      </div>

      {/* Voice Assistant Large Tap Button */}
      <div
        onClick={onOpenVoice}
        className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-6 text-amber-950 shadow-xl cursor-pointer hover:shadow-2xl transition transform active:scale-98 flex items-center justify-between border-4 border-amber-300"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white text-orange-600 flex items-center justify-center text-3xl shadow-md shrink-0">
            🎙️
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {language === 'te'
                ? 'AI రైతు సహాయకుడితో మాట్లాడండి'
                : language === 'hi'
                ? 'एआई किसान सहायक से बोलकर पूछें'
                : 'Tap to Speak with AI Assistant'}
            </h2>
            <p className="text-xs sm:text-sm text-amber-100 font-semibold mt-0.5">
              Ask in Telugu, Hindi or English — pests, crops, weather, mandi
            </p>
          </div>
        </div>
        <div className="p-3 bg-white/20 rounded-2xl text-white hidden sm:block">
          <Volume2 className="w-8 h-8" />
        </div>
      </div>

      {/* Big Micro-Weather Card */}
      <div className="bg-white rounded-3xl p-6 border-2 border-emerald-300 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🌤️</span>
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase block">
                {language === 'te' ? 'పొలం వాతావరణం' : 'Farm Weather — Kadiri, AP'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-900">31°C</span>
                <span className="text-sm font-bold text-emerald-700">Partly Cloudy</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-gray-500 block">Rain Chance</span>
            <span className="text-xl font-black text-blue-700">15%</span>
          </div>
        </div>

        <div className="mt-4 p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs sm:text-sm font-bold text-emerald-900 flex items-center gap-2">
          <span>✅</span>
          <span>
            {language === 'te'
              ? 'ఈరోజు పురుగుమందులు & ఎరువులు చల్లడానికి వాతావరణం అనుకూలంగా ఉంది.'
              : 'Safe for spraying fertilizers and crop protection today. No heavy rain expected.'}
          </span>
        </div>
      </div>

      {/* 4 PRIMARY GIANT ACTION CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 1. Camera Disease Scanner */}
        <button
          onClick={() => setActiveTab('scan')}
          className="p-6 rounded-3xl bg-white hover:bg-emerald-50/70 border-3 border-emerald-200 hover:border-emerald-500 text-left transition shadow-md active:scale-95 flex items-center gap-4 group"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition">
            📷
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 group-hover:text-emerald-900">
              {language === 'te' ? 'ఆకు తెగులు స్కాన్ చేయండి' : 'Scan Affected Crop Leaf'}
            </h3>
            <p className="text-xs text-gray-500 font-semibold mt-1">
              Take photo to identify leaf spot, pests & treatment in 5 seconds
            </p>
          </div>
        </button>

        {/* 2. Live Mandi & Flower Rates */}
        <button
          onClick={() => setActiveTab('prices')}
          className="p-6 rounded-3xl bg-white hover:bg-pink-50/70 border-3 border-pink-200 hover:border-pink-500 text-left transition shadow-md active:scale-95 flex items-center gap-4 group"
        >
          <div className="w-16 h-16 rounded-2xl bg-pink-100 text-pink-800 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition">
            🌸
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 group-hover:text-pink-900">
              {language === 'te' ? 'ఈరోజు మార్కెట్ & పూల ధరలు' : "Today's Mandi & Flower Rates"}
            </h3>
            <p className="text-xs text-gray-500 font-semibold mt-1">
              Live prices: Jasmine (₹450), Chilli (₹21,600), Groundnut (₹7,350)
            </p>
          </div>
        </button>

        {/* 3. Buy Fertilizers & Seeds */}
        <button
          onClick={() => setActiveTab('store')}
          className="p-6 rounded-3xl bg-white hover:bg-teal-50/70 border-3 border-teal-200 hover:border-teal-500 text-left transition shadow-md active:scale-95 flex items-center gap-4 group"
        >
          <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition">
            🛒
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 group-hover:text-teal-900">
              {language === 'te' ? 'ఎరువులు & విత్తనాలు కొనండి' : 'Buy Fertilizers & Seeds'}
            </h3>
            <p className="text-xs text-gray-500 font-semibold mt-1">
              Order from certified local dealers in Kadiri with farm delivery
            </p>
          </div>
        </button>

        {/* 4. Sell Produce & Buyer Offers */}
        <button
          onClick={() => setActiveTab('produce')}
          className="p-6 rounded-3xl bg-white hover:bg-orange-50/70 border-3 border-orange-200 hover:border-orange-500 text-left transition shadow-md active:scale-95 flex items-center gap-4 group"
        >
          <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-800 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition">
            📦
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 group-hover:text-orange-900">
              {language === 'te' ? 'పంట దిగుబడిని అమ్మండి' : 'Sell Harvest to Buyers'}
            </h3>
            <p className="text-xs text-gray-500 font-semibold mt-1">
              Direct mandi traders & buyers with zero middleman commission
            </p>
          </div>
        </button>
      </div>

      {/* Simple Standing Crops List */}
      <div className="bg-white rounded-3xl p-6 border-2 border-gray-200 shadow-sm space-y-3">
        <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
          <span>🌱</span>
          <span>{language === 'te' ? 'మీ పొలంలో ఉన్న పంటలు' : 'Your Standing Crops (Kadiri Farm)'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="font-extrabold text-gray-900 text-sm block">Groundnut (వేరుశనగ)</span>
              <span className="text-xs text-gray-600">Kadiri-6 • 4.0 Acres • Flowering</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-950 font-black text-xs">
              ✓ Good
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between">
            <div>
              <span className="font-extrabold text-gray-900 text-sm block">Tomato (టమోటా)</span>
              <span className="text-xs text-gray-600">Arka Rakshak • 1.5 Acres • Fruit Set</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-200 text-amber-950 font-black text-xs">
              ⚠️ Watch
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
