import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Upload,
  Layers,
  CheckCircle2,
  Droplet,
  Flame,
  ArrowRight,
  Info
} from 'lucide-react';

interface SoilHealthProps {
  setActiveTab: (tab: string) => void;
}

export const SoilHealth: React.FC<SoilHealthProps> = ({ setActiveTab }) => {
  const { t } = useLanguage();
  const { addToCart } = useCart();

  const [inputMode, setInputMode] = useState<'MANUAL' | 'REPORT' | 'IMAGE'>('MANUAL');
  const [ph, setPh] = useState(6.8);
  const [nitrogen, setNitrogen] = useState(185);
  const [phosphorus, setPhosphorus] = useState(19.5);
  const [potassium, setPotassium] = useState(290);
  const [organicCarbon, setOrganicCarbon] = useState(0.44);
  const [ec, setEc] = useState(0.38);
  const [soilType, setSoilType] = useState('RED_LOAM');
  const [soilError, setSoilError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>({
    ph: 6.8,
    nitrogenKgPerHa: 185,
    phosphorusKgPerHa: 19.5,
    potassiumKgPerHa: 290,
    organicCarbonPct: 0.44,
    electricalConductivity: 0.38,
    summary: 'Slightly low Nitrogen & Organic Carbon; Medium Phosphorus; Adequate Potassium. pH 6.8 is optimal for legume nodulation and groundnut pegging.',
    recommendations: [
      'Apply Farm Yard Manure (FYM) or Vermicompost @ 4-5 tonnes/acre to replenish organic carbon and enhance water-holding capacity.',
      'Split application of Urea: 50% basal with DAP, and 50% top-dressing at 30 days after sowing.',
      'Apply Gypsum @ 200 kg/acre at 40-45 DAS (flowering/pegging) for Pod filling and Calcium/Sulfur enrichment.',
      'Treat seed with Rhizobium bio-inoculant to stimulate biological atmospheric nitrogen fixation.'
    ],
    suitableCrops: ['Groundnut', 'Red Gram', 'Tomato', 'Castor', 'Sunflower'],
    soilHealthScore: 78
  });

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setSoilError(null);
    try {
      const res = await fetch('/api/ai/soil-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('agri_token')}`
        },
        body: JSON.stringify({
          sourceType: inputMode === 'MANUAL' ? 'MANUAL_ENTRY' : 'LAB_REPORT',
          ph,
          nitrogen,
          phosphorus,
          potassium,
          organicCarbon,
          electricalConductivity: ec,
          soilType
        })
      });

      if (res.ok) {
        const data = await res.json();
        setResult({
          ...data,
          soilHealthScore: Math.round(75 + (ph >= 6.5 && ph <= 7.5 ? 10 : 0) + (organicCarbon > 0.5 ? 10 : 0)),
          suitableCrops: ['Groundnut', 'Red Gram', 'Tomato', 'Castor', 'Sunflower']
        });
        setToast('Fertilizer balancing plan recomputed based on updated soil test! 🧪');
        setTimeout(() => setToast(null), 3500);
      } else {
        const err = await res.json();
        setSoilError(err.error || 'Failed to analyze soil parameters.');
      }
    } catch (err: any) {
      setSoilError(err.message || 'Network error while analyzing soil.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold bg-emerald-800 text-white border border-emerald-600 animate-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* Title */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-50 text-lime-800 text-xs font-bold border border-lime-200 mb-2">
            <span>🌱 Soil Intelligence & Fertilizer Balancer</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Soil Health & Nutrient Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Input soil parameters or lab card values to receive tailored fertilizer balancing plans
          </p>
        </div>

        {/* Input Mode Selector */}
        <div className="flex bg-gray-100 p-1 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setInputMode('MANUAL')}
            className={`px-3 py-1.5 rounded-xl transition ${inputMode === 'MANUAL' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-600'}`}
          >
            Enter Values
          </button>
          <button
            onClick={() => setInputMode('REPORT')}
            className={`px-3 py-1.5 rounded-xl transition ${inputMode === 'REPORT' ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-600'}`}
          >
            Upload Soil Card
          </button>
        </div>
      </div>

      {/* Input Form Panel */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 space-y-5">
        <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
          <span>🧪</span> Soil Parameters (Sri Venkateswara Farm)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {/* pH */}
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-gray-700">Soil pH</label>
              <span className="text-xs font-extrabold text-emerald-700">{ph}</span>
            </div>
            <input
              type="range"
              min="4.5"
              max="9.0"
              step="0.1"
              value={ph}
              onChange={e => setPh(parseFloat(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <span className="text-[10px] text-gray-400 block mt-1">Optimal: 6.5 - 7.5</span>
          </div>

          {/* Nitrogen */}
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-gray-700">Available N</label>
              <span className="text-xs font-extrabold text-emerald-700">{nitrogen} kg/ha</span>
            </div>
            <input
              type="range"
              min="80"
              max="600"
              step="5"
              value={nitrogen}
              onChange={e => setNitrogen(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <span className="text-[10px] text-amber-600 font-semibold block mt-1">Status: Low (&lt;280)</span>
          </div>

          {/* Phosphorus */}
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-gray-700">Available P</label>
              <span className="text-xs font-extrabold text-emerald-700">{phosphorus} kg/ha</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="0.5"
              value={phosphorus}
              onChange={e => setPhosphorus(parseFloat(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <span className="text-[10px] text-emerald-600 font-semibold block mt-1">Status: Medium (19.5)</span>
          </div>

          {/* Potassium */}
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-gray-700">Available K</label>
              <span className="text-xs font-extrabold text-emerald-700">{potassium} kg/ha</span>
            </div>
            <input
              type="range"
              min="80"
              max="500"
              step="10"
              value={potassium}
              onChange={e => setPotassium(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <span className="text-[10px] text-emerald-600 font-semibold block mt-1">Status: High (&gt;280)</span>
          </div>

          {/* Organic Carbon */}
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-gray-700">Organic Carbon</label>
              <span className="text-xs font-extrabold text-emerald-700">{organicCarbon}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.5"
              step="0.02"
              value={organicCarbon}
              onChange={e => setOrganicCarbon(parseFloat(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <span className="text-[10px] text-amber-600 font-semibold block mt-1">Status: Low (&lt;0.5%)</span>
          </div>

          {/* Electrical Conductivity */}
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-gray-700">EC (Salinity)</label>
              <span className="text-xs font-extrabold text-emerald-700">{ec} dS/m</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.05"
              value={ec}
              onChange={e => setEc(parseFloat(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <span className="text-[10px] text-emerald-600 font-semibold block mt-1">Normal / Non-saline</span>
          </div>
        </div>

        {soilError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{soilError}</span>
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow-md transition active:scale-95 flex items-center justify-center gap-2 text-sm"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{isAnalyzing ? 'Evaluating Soil Biology...' : 'Recalculate Fertilizer Balancing Plan'}</span>
        </button>
      </div>

      {/* Analysis Output Result */}
      {result && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-200 space-y-6 animate-in fade-in">
          {/* Header Score */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-1">
                <span>✓ Soil Test Analysis Completed</span>
              </div>
              <h2 className="text-lg font-black text-gray-900 mt-1">
                Nutrient Fertility Status & Fertilizer Strategy
              </h2>
              <p className="text-xs text-gray-500">
                Calibrated for Red Loam Soil in Kadiri Agricultural Division
              </p>
            </div>

            <div className="flex items-center gap-3 bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl font-black">
                {result.soilHealthScore}
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase block">Soil Health Index</span>
                <span className="text-xs font-black text-emerald-900">Good Fertility</span>
              </div>
            </div>
          </div>

          {/* AI Estimate vs Lab Disclaimer */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <span>
              <strong>Scientific Notice:</strong> This analysis provides an agronomic screening estimate based on your soil values. For official government subsidy or certified farm records, refer to state Soil Health Card laboratory testing.
            </span>
          </div>

          {/* Condition Summary */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">
              Agronomic Condition Summary:
            </h4>
            <p className="text-xs text-gray-700 leading-relaxed">
              {result.summary}
            </p>
          </div>

          {/* Fertilizer Action Plan */}
          <div>
            <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span>🌾</span> Prescribed Fertilizer & Soil Enrichment Protocol:
            </h4>
            <div className="space-y-2">
              {result.recommendations.map((rec: string, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-100 flex items-start gap-2.5 text-xs text-emerald-950">
                  <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Crop Suitability Comparison */}
          <div>
            <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider mb-2">
              Highly Suitable Crops for this Soil:
            </h4>
            <div className="flex flex-wrap gap-2">
              {result.suitableCrops.map((crop: string, i: number) => (
                <span key={i} className="px-3 py-1.5 bg-gray-100 hover:bg-emerald-50 text-gray-800 hover:text-emerald-800 font-bold text-xs rounded-xl border border-gray-200 transition">
                  🌱 {crop}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Buy Prescribed Inputs */}
          <div className="pt-2">
            <button
              onClick={() => setActiveTab('store')}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Buy Recommended Fertilizers (Urea, DAP, Gromor) in Store</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
