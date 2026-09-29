import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiUrl } from '../../services/api';
import {
  CloudSun,
  Bot,
  Camera,
  ShoppingBag,
  MapPin,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Droplets,
  Wind,
  Layers,
  ChevronRight,
  ShieldAlert,
  Sprout,
  ArrowRight,
  Plus,
  Edit2,
  Trash2,
  X,
  RefreshCw,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  Minus,
  TrendingDown
} from 'lucide-react';
import { subscribeToTable } from '../../services/supabaseClient';

function normalizeCategory(cat?: string): string {
  if (!cat) return 'OTHER';
  const c = cat.trim().toUpperCase();
  if (c.includes('FLOWER')) return 'FLOWER';
  if (c.includes('VEG')) return 'VEGETABLE';
  if (c.includes('FRUIT')) return 'FRUIT';
  if (c.includes('GRAIN') || c.includes('CEREAL') || c === 'PADDY' || c === 'RICE') return 'GRAIN';
  if (c.includes('PULSE') || c.includes('DAL') || c.includes('GRAM')) return 'PULSE';
  if (c.includes('SPICE') || c.includes('CONDIMENT')) return 'SPICE';
  if (c.includes('OILSEED') || c.includes('OIL')) return 'OILSEED';
  if (c.includes('CROP') || c.includes('FIBER') || c.includes('COTTON') || c.includes('SUGARCANE')) return 'CROP';
  return c;
}

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  onOpenVoice: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab, onOpenVoice }) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [weather, setWeather] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [selectedFarmIndex, setSelectedFarmIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [weatherRefreshing, setWeatherRefreshing] = useState(false);

  // Mandi & Flower Prices states on Dashboard
  const [mandiPrices, setMandiPrices] = useState<any[]>([]);
  const [priceRegions, setPriceRegions] = useState<any[]>([]);
  const [dashState, setDashState] = useState<string>('ALL');
  const [dashDistrict, setDashDistrict] = useState<string>('ALL');
  const [dashCategory, setDashCategory] = useState<string>('ALL');

  // Modals state
  const [showAddFarmModal, setShowAddFarmModal] = useState(false);
  const [showAddCropModal, setShowAddCropModal] = useState(false);
  const [editingCrop, setEditingCrop] = useState<any | null>(null);

  // Form states - Add Farm
  const [farmName, setFarmName] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [farmTotalArea, setFarmTotalArea] = useState('');
  const [farmSoilType, setFarmSoilType] = useState('RED_LOAM');
  const [farmIrrigation, setFarmIrrigation] = useState('BOREWELL');
  const [isSubmittingFarm, setIsSubmittingFarm] = useState(false);
  const [farmError, setFarmError] = useState<string | null>(null);

  // Form states - Add / Edit Crop
  const [cropName, setCropName] = useState('Groundnut (Peanut)');
  const [cropVariety, setCropVariety] = useState('Kadiri-6');
  const [cropAreaPlanted, setCropAreaPlanted] = useState('');
  const [cropGrowthStage, setCropGrowthStage] = useState('VEGETATIVE');
  const [cropHealthStatus, setCropHealthStatus] = useState('HEALTHY');
  const [cropSowingDate, setCropSowingDate] = useState(new Date().toISOString().split('T')[0]);
  const [cropHarvestDate, setCropHarvestDate] = useState(
    new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
  );
  const [isSubmittingCrop, setIsSubmittingCrop] = useState(false);
  const [cropError, setCropError] = useState<string | null>(null);
  const [deletingCropId, setDeletingCropId] = useState<string | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const loadData = async () => {
    try {
      const [wRes, tRes, fRes, pRes, sRes] = await Promise.all([
        fetch(apiUrl('/api/ai/weather?lat=14.1165&lon=78.1634&location=Kadiri,%20Andhra%20Pradesh')),
        fetch(apiUrl('/api/farm/tasks'), { headers: { Authorization: `Bearer ${localStorage.getItem('agri_token')}` } }),
        fetch(apiUrl('/api/farms'), { headers: { Authorization: `Bearer ${localStorage.getItem('agri_token')}` } }),
        fetch(apiUrl('/api/prices')),
        fetch(apiUrl('/api/prices/states'))
      ]);

      if (wRes.ok) setWeather(await wRes.json());
      if (tRes.ok) setTasks(await tRes.json());
      if (fRes.ok) setFarms(await fRes.json());
      if (pRes.ok) {
        const pData = await pRes.json();
        setMandiPrices(Array.isArray(pData) ? pData : []);
      }
      if (sRes.ok) {
        const sData = await sRes.json();
        if (Array.isArray(sData.states) && typeof sData.states[0] === 'object') {
          setPriceRegions(sData.states);
        } else if (sData.hierarchy) {
          setPriceRegions(Object.entries(sData.hierarchy).map(([st, info]: [string, any]) => ({
            state: st,
            districts: Array.isArray(info?.districts) ? info.districts : [],
            mandis: Array.isArray(info?.mandis) ? info.mandis : []
          })));
        }
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const subFarms = subscribeToTable('farms', {
      onChange: () => {
        console.log('⚡ [Realtime Dashboard] Farm changed, reloading...');
        loadData();
      }
    });

    const subCrops = subscribeToTable('crops', {
      onChange: () => {
        console.log('⚡ [Realtime Dashboard] Crops changed, reloading...');
        loadData();
      }
    });

    return () => {
      subFarms.unsubscribe();
      subCrops.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function fetchDashPrices() {
      try {
        const params = new URLSearchParams();
        if (dashState !== 'ALL') params.append('state', dashState);
        if (dashDistrict !== 'ALL') params.append('district', dashDistrict);
        const res = await fetch(`/api/market-prices?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setMandiPrices(data);
        }
      } catch (err) {
        console.error('Failed to load dashboard prices:', err);
      }
    }
    fetchDashPrices();
  }, [dashState, dashDistrict]);

  const refreshWeather = async () => {
    setWeatherRefreshing(true);
    try {
      const res = await fetch(apiUrl('/api/ai/weather?lat=14.1165&lon=78.1634&location=Kadiri,%20Andhra%20Pradesh'));
      if (res.ok) {
        setWeather(await res.json());
        showToast('Live weather and agricultural advisory updated!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWeatherRefreshing(false);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      const res = await fetch(apiUrl(`/api/farm/tasks/${taskId}/toggle`), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('agri_token')}` }
      });
      if (res.ok) {
        const updated = await res.json();
        setTasks(prev => prev.map(t => (t.id === taskId ? updated : t)));
        showToast(updated.isCompleted ? 'Task completed! ✓' : 'Task active');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Add Farm
  const handleAddFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFarmError(null);

    const parsedArea = parseFloat(farmTotalArea);
    if (!farmName.trim()) {
      setFarmError('Please enter a farm name.');
      return;
    }
    if (isNaN(parsedArea) || parsedArea <= 0) {
      setFarmError('Please enter a valid farm area greater than 0.');
      return;
    }

    setIsSubmittingFarm(true);
    try {
      const res = await fetch('/api/farms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('agri_token')}`
        },
        body: JSON.stringify({
          name: farmName.trim(),
          location: farmLocation.trim() || 'Survey #142/A, Kadiri Mandal',
          totalArea: parsedArea,
          areaUnit: 'ACRE',
          soilType: farmSoilType,
          irrigationSource: farmIrrigation
        })
      });

      if (res.ok) {
        setShowAddFarmModal(false);
        setFarmName('');
        setFarmLocation('');
        setFarmTotalArea('');
        showToast('Farm registered successfully! 🌾');
        await loadData();
      } else {
        const err = await res.json();
        setFarmError(err.error || 'Failed to create farm.');
      }
    } catch (err: any) {
      setFarmError(err.message || 'Network error while registering farm.');
    } finally {
      setIsSubmittingFarm(false);
    }
  };

  // Submit Add or Edit Crop
  const handleSaveCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    setCropError(null);

    if (!cropName.trim()) {
      setCropError('Please enter crop name.');
      return;
    }

    const currentFarm = farms[selectedFarmIndex] || farms[0];
    if (!currentFarm) {
      setCropError('No active farm selected. Please add a farm first.');
      return;
    }

    setIsSubmittingCrop(true);
    try {
      const isEditing = !!editingCrop;
      const url = isEditing ? `/api/farms/crops/${editingCrop.id}` : `/api/farms/${currentFarm.id}/crops`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('agri_token')}`
        },
        body: JSON.stringify({
          cropName: cropName.trim(),
          variety: cropVariety.trim(),
          areaPlanted: cropAreaPlanted ? parseFloat(cropAreaPlanted) : currentFarm.totalArea,
          growthStage: cropGrowthStage,
          healthStatus: cropHealthStatus,
          sowingDate: cropSowingDate,
          expectedHarvestDate: cropHarvestDate
        })
      });

      if (res.ok) {
        setShowAddCropModal(false);
        setEditingCrop(null);
        showToast(isEditing ? 'Crop record updated! 🍅' : 'Crop successfully registered to farm! 🌱');
        await loadData();
      } else {
        const err = await res.json();
        setCropError(err.error || 'Failed to save crop.');
      }
    } catch (err: any) {
      setCropError(err.message || 'Network error while saving crop.');
    } finally {
      setIsSubmittingCrop(false);
    }
  };

  // Delete Crop
  const handleDeleteCrop = async (cropId: string) => {
    if (!window.confirm('Are you sure you want to remove this standing crop from your farm?')) return;
    setDeletingCropId(cropId);
    try {
      const res = await fetch(`/api/farms/crops/${cropId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('agri_token')}` }
      });
      if (res.ok) {
        showToast('Crop deleted from farm records');
        await loadData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to delete crop', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting crop', 'error');
    } finally {
      setDeletingCropId(null);
    }
  };

  const openAddCropModal = () => {
    setEditingCrop(null);
    setCropName('Groundnut (Peanut)');
    setCropVariety('Kadiri-6');
    setCropAreaPlanted('');
    setCropGrowthStage('VEGETATIVE');
    setCropHealthStatus('HEALTHY');
    setCropError(null);
    setShowAddCropModal(true);
  };

  const openEditCropModal = (crop: any) => {
    setEditingCrop(crop);
    setCropName(crop.cropName || '');
    setCropVariety(crop.variety || '');
    setCropAreaPlanted(crop.areaPlanted ? crop.areaPlanted.toString() : '');
    setCropGrowthStage(crop.growthStage || 'VEGETATIVE');
    setCropHealthStatus(crop.healthStatus || 'HEALTHY');
    setCropHarvestDate(crop.expectedHarvestDate?.split('T')[0] || '');
    setCropError(null);
    setShowAddCropModal(true);
  };

  const primaryFarm = farms[selectedFarmIndex] || farms[0] || {
    name: 'Sri Venkateswara Farm',
    location: 'Survey #142/A, Kadiri Rural Road',
    totalArea: 5.5,
    areaUnit: 'ACRE',
    soilType: 'RED_LOAM',
    irrigationSource: 'BOREWELL',
    crops: [
      { id: 'crop-1', cropName: 'Groundnut (Peanut)', variety: 'Kadiri-6', growthStage: 'FLOWERING', healthStatus: 'NEEDS_ATTENTION' },
      { id: 'crop-2', cropName: 'Tomato', variety: 'Arka Rakshak', growthStage: 'VEGETATIVE', healthStatus: 'HEALTHY' }
    ]
  };

  const dashAvailableDistricts = React.useMemo<string[]>(() => {
    if (!Array.isArray(priceRegions) || priceRegions.length === 0) return [];
    if (dashState === 'ALL') {
      const allDists = new Set<string>();
      priceRegions.forEach(r => {
        if (r && Array.isArray(r.districts)) {
          r.districts.forEach((d: string) => allDists.add(d));
        }
      });
      return Array.from(allDists).sort();
    }
    const reg = priceRegions.find(r => r?.state?.toLowerCase() === dashState.toLowerCase());
    return reg && Array.isArray(reg.districts) ? (reg.districts as string[]) : [];
  }, [dashState, priceRegions]);

  const dashFilteredPrices = React.useMemo(() => {
    return mandiPrices.filter(p => {
      if (dashState !== 'ALL' && p.state?.toLowerCase() !== dashState.toLowerCase()) return false;
      if (dashDistrict !== 'ALL' && !p.isFallback && p.district?.toLowerCase() !== dashDistrict.toLowerCase()) return false;
      if (dashCategory !== 'ALL' && normalizeCategory(p.category || p.commodityType) !== normalizeCategory(dashCategory)) return false;
      return true;
    }).slice(0, 9);
  }, [mandiPrices, dashState, dashDistrict, dashCategory]);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Toast Feedback */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold transition-all animate-in slide-in-from-top-2 duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-800 text-white border border-emerald-600'
              : 'bg-red-800 text-white border border-red-600'
          }`}
        >
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. Header Greeting & Rural Welcome */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 text-white pointer-events-none select-none text-[180px]">
          🌾
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/40 border border-emerald-400/30 text-emerald-200 text-xs font-semibold mb-3">
            <span>📍 {user?.village || 'Kadiri Mandal'}, {user?.district || 'Sri Sathya Sai'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {language === 'te'
              ? `నమస్కారం, ${user?.name || 'రైతు'} గారు 👋`
              : language === 'hi'
              ? `नमस्ते, ${user?.name || 'किसान'} जी 👋`
              : `Good morning, ${user?.name || 'Farmer'} 👋`}
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base mt-2">
            {t('subGreeting')}
          </p>

          <div className="flex flex-wrap gap-2.5 mt-5">
            <button
              onClick={() => setActiveTab('ai')}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold rounded-xl shadow-lg transition active:scale-95 flex items-center gap-2 text-sm"
            >
              <span>🤖</span> {t('askAiBtn')}
            </button>
            <button
              onClick={() => setActiveTab('scan')}
              className="px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold rounded-xl border border-white/20 shadow transition active:scale-95 flex items-center gap-2 text-sm"
            >
              <span>📷</span> {t('scanCropBtn')}
            </button>
            <button
              onClick={onOpenVoice}
              className="px-3.5 py-2.5 bg-emerald-900/60 hover:bg-emerald-900 text-amber-300 rounded-xl border border-emerald-500/40 text-sm font-semibold transition flex items-center gap-1.5"
            >
              <span>🎙️</span>
              <span className="hidden sm:inline">{t('voiceAssistant')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Weather & Agronomic Advisory Card */}
      {weather && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-emerald-100/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                <CloudSun className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-gray-900">{weather.temperature}°C</span>
                  <span className="text-xs font-semibold text-gray-500">{weather.condition}</span>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {weather.location}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-100/60">
                  <span className="text-[10px] text-blue-700 font-semibold uppercase">{t('rainProbability')}</span>
                  <p className="text-base font-black text-blue-900">{weather.rainProbability}%</p>
                </div>
                <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100/60">
                  <span className="text-[10px] text-emerald-700 font-semibold uppercase">{t('humidity')}</span>
                  <p className="text-base font-black text-emerald-900">{weather.humidity}%</p>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="text-[10px] text-gray-600 font-semibold uppercase">{t('wind')}</span>
                  <p className="text-base font-black text-gray-800">{weather.windSpeed} km/h</p>
                </div>
              </div>
              <button
                onClick={refreshWeather}
                disabled={weatherRefreshing}
                className="p-2.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition shrink-0 ml-1"
                title={t('refreshWeather')}
              >
                <RefreshCw className={`w-4 h-4 ${weatherRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-3 bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200/60">
            <ShieldAlert className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-emerald-950 uppercase tracking-wide">{t('advisoryTitle')}</p>
              <p className="text-xs text-emerald-900 mt-0.5 leading-relaxed">
                {weather.agriculturalAdvisory}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. SIX LARGE HERO PRIMARY ACTION BUTTONS */}
      <div>
        <h2 className="text-base font-extrabold text-gray-900 mb-3 uppercase tracking-wider flex items-center gap-2">
          <span>⚡</span> {t('quickFarmActions')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {/* Ask AI */}
          <button
            onClick={() => setActiveTab('ai')}
            className="p-4 rounded-2xl bg-white hover:bg-emerald-50 border border-emerald-100 shadow-sm transition hover:shadow-md text-left flex flex-col justify-between group active:scale-95 min-h-[148px] h-full overflow-hidden"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl group-hover:scale-110 transition shrink-0">
              🤖
            </div>
            <div className="mt-3">
              <span className="text-xs font-bold text-gray-900 block group-hover:text-emerald-800 line-clamp-1">
                {t('askAiBtn')}
              </span>
              <span className="text-[10px] text-gray-500 line-clamp-2 leading-tight mt-0.5">{t('askAiDesc')}</span>
            </div>
          </button>

          {/* Scan Crop */}
          <button
            onClick={() => setActiveTab('scan')}
            className="p-4 rounded-2xl bg-white hover:bg-amber-50 border border-amber-100 shadow-sm transition hover:shadow-md text-left flex flex-col justify-between group active:scale-95 min-h-[148px] h-full overflow-hidden"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl group-hover:scale-110 transition shrink-0">
              📷
            </div>
            <div className="mt-3">
              <span className="text-xs font-bold text-gray-900 block group-hover:text-amber-800 line-clamp-1">
                {t('scanCropBtn')}
              </span>
              <span className="text-[10px] text-gray-500 line-clamp-2 leading-tight mt-0.5">{t('scanCropDesc')}</span>
            </div>
          </button>

          {/* Soil Intelligence */}
          <button
            onClick={() => setActiveTab('soil')}
            className="p-4 rounded-2xl bg-white hover:bg-lime-50 border border-lime-100 shadow-sm transition hover:shadow-md text-left flex flex-col justify-between group active:scale-95 min-h-[148px] h-full overflow-hidden"
          >
            <div className="w-12 h-12 rounded-xl bg-lime-100 text-lime-800 flex items-center justify-center text-2xl group-hover:scale-110 transition shrink-0">
              🌱
            </div>
            <div className="mt-3">
              <span className="text-xs font-bold text-gray-900 block group-hover:text-lime-800 line-clamp-1">
                {t('checkSoilBtn')}
              </span>
              <span className="text-[10px] text-gray-500 line-clamp-2 leading-tight mt-0.5">{t('checkSoilDesc')}</span>
            </div>
          </button>

          {/* Buy Farm Products */}
          <button
            onClick={() => setActiveTab('store')}
            className="p-4 rounded-2xl bg-white hover:bg-teal-50 border border-teal-100 shadow-sm transition hover:shadow-md text-left flex flex-col justify-between group active:scale-95 min-h-[148px] h-full overflow-hidden"
          >
            <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center text-2xl group-hover:scale-110 transition shrink-0">
              🛒
            </div>
            <div className="mt-3">
              <span className="text-xs font-bold text-gray-900 block group-hover:text-teal-800 line-clamp-1">
                {t('buyInputsBtn')}
              </span>
              <span className="text-[10px] text-gray-500 line-clamp-2 leading-tight mt-0.5">{t('buyInputsDesc')}</span>
            </div>
          </button>

          {/* Nearby Shops */}
          <button
            onClick={() => setActiveTab('shops')}
            className="p-4 rounded-2xl bg-white hover:bg-indigo-50 border border-indigo-100 shadow-sm transition hover:shadow-md text-left flex flex-col justify-between group active:scale-95 min-h-[148px] h-full overflow-hidden"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center text-2xl group-hover:scale-110 transition shrink-0">
              📍
            </div>
            <div className="mt-3">
              <span className="text-xs font-bold text-gray-900 block group-hover:text-indigo-800 line-clamp-1">
                {t('findShopsBtn')}
              </span>
              <span className="text-[10px] text-gray-500 line-clamp-2 leading-tight mt-0.5">{t('findShopsDesc')}</span>
            </div>
          </button>

          {/* Sell Produce */}
          <button
            onClick={() => setActiveTab('produce')}
            className="p-4 rounded-2xl bg-white hover:bg-orange-50 border border-orange-100 shadow-sm transition hover:shadow-md text-left flex flex-col justify-between group active:scale-95 min-h-[148px] h-full overflow-hidden"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center text-2xl group-hover:scale-110 transition shrink-0">
              📦
            </div>
            <div className="mt-3">
              <span className="text-xs font-bold text-gray-900 block group-hover:text-orange-800 line-clamp-1">
                {t('sellProduceBtn')}
              </span>
              <span className="text-[10px] text-gray-500 line-clamp-2 leading-tight mt-0.5">{t('sellProduceDesc')}</span>
            </div>
          </button>

          {/* Mandi & Flower Prices */}
          <button
            onClick={() => setActiveTab('prices')}
            className="p-4 rounded-2xl bg-white hover:bg-pink-50 border border-pink-100 shadow-sm transition hover:shadow-md text-left flex flex-col justify-between group active:scale-95 min-h-[148px] h-full overflow-hidden"
          >
            <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-800 flex items-center justify-center text-2xl group-hover:scale-110 transition shrink-0">
              🌸
            </div>
            <div className="mt-3">
              <span className="text-xs font-bold text-gray-900 block group-hover:text-pink-800 line-clamp-1">
                {t('mandiPricesCard')}
              </span>
              <span className="text-[10px] text-gray-500 line-clamp-2 leading-tight mt-0.5">{t('mandiPricesCardDesc')}</span>
            </div>
          </button>
        </div>
      </div>

      {/* 4. LIVE ALL-INDIA MANDI & FLOWER PRICES SECTION */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 text-white flex items-center justify-center text-2xl shadow-md shadow-emerald-900/20 shrink-0">
              🌸
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-gray-900">
                  {t('mandiFlowerHeading')}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-pink-100 text-pink-800 border border-pink-200">
                  {t('mandiFlowerBadge')}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {t('liveTodayBadge')}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {t('mandiFlowerDesc')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('prices')}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-black transition shadow-xs flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('reportPriceBtn')}</span>
            </button>
            <button
              onClick={() => setActiveTab('prices')}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95"
            >
              <span>{t('exploreAllPrices')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* State and Cascading District Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-600" />
              <span>{t('stateLabel')}</span>
            </label>
            <select
              value={dashState}
              onChange={e => {
                setDashState(e.target.value);
                setDashDistrict('ALL');
              }}
              className="w-full px-3 py-1.5 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">{t('allIndia')}</option>
              {priceRegions.map(r => (
                <option key={r.state} value={r.state}>{r.state}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1 flex items-center gap-1">
              <Sprout className="w-3 h-3 text-teal-600" />
              <span>{t('districtLabel')}</span>
            </label>
            <select
              value={dashDistrict}
              onChange={e => setDashDistrict(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">
                {dashState === 'ALL'
                  ? t('allDistrictsIndia')
                  : t('allDistrictsInState', { state: dashState })}
              </option>
              {dashAvailableDistricts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
              {t('categoryLabel')}
            </label>
            <div className="flex gap-1 overflow-x-auto pb-0.5">
              {[
                { id: 'ALL', label: t('catAll') || 'All', icon: '🌐' },
                { id: 'FLOWER', label: t('catFlowers') || '🌸 Flowers', icon: '🌸' },
                { id: 'CROP', label: t('catCrops') || '🌾 Crops & Fibers', icon: '🌾' },
                { id: 'GRAIN', label: t('catGrains') || '🌽 Grains', icon: '🌽' },
                { id: 'VEGETABLE', label: t('catVegetables') || '🥕 Veg', icon: '🥕' },
                { id: 'FRUIT', label: t('catFruits') || '🍎 Fruits', icon: '🍎' },
                { id: 'PULSE', label: t('catPulses') || '🫘 Pulses', icon: '🫘' },
                { id: 'SPICE', label: t('catSpices') || '🌶️ Spice', icon: '🌶️' },
                { id: 'OILSEED', label: t('catOilseeds') || '🌻 Oilseeds', icon: '🌻' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setDashCategory(cat.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                    dashCategory === cat.id
                      ? cat.id === 'FLOWER'
                        ? 'bg-pink-600 text-white shadow-xs'
                        : 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Rate Cards Grid */}
        {dashFilteredPrices.length === 0 ? (
          <div className="text-center py-6 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-gray-500">
            {t('noPricesFound')}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {dashFilteredPrices.map(item => {
              const catNorm = normalizeCategory(item.category || item.commodityType);
              const isFlower = catNorm === 'FLOWER';
              const modalVal = item.modalPrice || item.modal_price || 0;
              const minVal = item.minPrice || item.min_price || 0;
              const maxVal = item.maxPrice || item.max_price || 0;
              const pDate = item.priceDate || item.date || 'Today';
              const displayName = item.name || item.commodity;
              const unitStr = item.unit === 'QUINTAL' || item.unit === '₹/Quintal' ? 'Qtl' : item.unit === 'KG' || item.unit === '₹/Kg' ? 'Kg' : item.unit === '100_FLOWERS' ? '100 flw' : item.unit === 'BUNDLE' ? 'Bndl' : (item.unit || 'Qtl');

              return (
                <div
                  key={item.id}
                  onClick={() => setActiveTab('prices')}
                  className={`p-4 rounded-2xl border transition cursor-pointer hover:shadow-md flex flex-col justify-between ${
                    isFlower
                      ? 'bg-pink-50/50 border-pink-200 hover:border-pink-300'
                      : 'bg-stone-50/50 border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isFlower ? 'bg-pink-100 text-pink-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isFlower ? t('flowerBadge') : catNorm}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400">{pDate}</span>
                    </div>

                    <h4 className="font-extrabold text-sm text-gray-900 truncate" title={displayName}>
                      {displayName}
                    </h4>
                    <p className="text-[11px] text-gray-500 truncate">{item.variety}</p>
                    <p className="text-[11px] text-gray-600 mt-1 font-medium truncate">
                      📍 {item.market}, {item.district}
                    </p>
                    {item.fallbackBadge && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md inline-block mt-1">
                        📍 {item.fallbackBadge}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-gray-200/70 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 block font-semibold">{t('modalRate')}</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-emerald-900">
                          ₹{modalVal.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] font-semibold text-gray-500">
                          /{unitStr}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block font-semibold">
                        {t('priceRange')} ₹{minVal} - ₹{maxVal}
                      </span>
                      <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                        item.trend === 'UP' ? 'text-emerald-600' : item.trend === 'DOWN' ? 'text-rose-600' : 'text-gray-500'
                      }`}>
                        {item.trend === 'UP' ? '▲' : item.trend === 'DOWN' ? '▼' : '—'} ₹{item.changeAmount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Active Farm Overview & Standing Crops */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          {/* Farm Switcher if multiple farms */}
          {farms.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-3 mb-3 border-b border-gray-100">
              {farms.map((f, i) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFarmIndex(i)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    selectedFarmIndex === i
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.name} ({f.totalArea} {f.areaUnit || 'Acres'})
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">{primaryFarm.name}</h3>
                <p className="text-xs text-gray-500">{primaryFarm.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-extrabold border border-emerald-200">
                {primaryFarm.totalArea} {primaryFarm.areaUnit || t('acres')}
              </span>
              <button
                onClick={() => {
                  setFarmError(null);
                  setShowAddFarmModal(true);
                }}
                className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1"
                title={t('registerFarmTitle')}
              >
                <Plus className="w-3.5 h-3.5" /> {t('addFarm')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 bg-gray-50/80 p-3 rounded-2xl border border-gray-100 text-xs">
            <div>
              <span className="text-gray-400 block font-semibold">{t('soilType')}</span>
              <span className="font-bold text-gray-800 capitalize">
                {primaryFarm.soilType?.toLowerCase()?.replace('_', ' ') || 'Red Loam'}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block font-semibold">{t('irrigation')}</span>
              <span className="font-bold text-gray-800 capitalize">
                {primaryFarm.irrigationSource?.toLowerCase()?.replace('_', ' ') || 'Borewell'}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-gray-400 block font-semibold">{t('activeSeason')}</span>
              <span className="font-bold text-emerald-800">{t('kharifSeason')}</span>
            </div>
          </div>

          {/* Crops Cultivated Header with Add Crop Button */}
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
              {t('cropsCultivated')} ({primaryFarm.crops?.length || 0})
            </h4>
            <button
              onClick={openAddCropModal}
              className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> {t('addCrop')}
            </button>
          </div>

          <div className="space-y-3">
            {!primaryFarm.crops || primaryFarm.crops.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-gray-200 rounded-2xl">
                <p className="text-xs text-gray-400">{t('noStandingCrops')}</p>
                <button
                  onClick={openAddCropModal}
                  className="mt-2 text-xs font-bold text-emerald-700 hover:underline"
                >
                  {t('addFirstCrop')}
                </button>
              </div>
            ) : (
              primaryFarm.crops?.map((crop: any) => (
                <div
                  key={crop.id}
                  className="p-4 rounded-2xl border border-gray-100 bg-white hover:border-emerald-200 transition flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-lg">
                      {crop.cropName?.includes('Tomato') ? '🍅' : crop.cropName?.includes('Paddy') || crop.cropName?.includes('Rice') ? '🌾' : '🥜'}
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-gray-900">{crop.cropName}</h5>
                      <p className="text-xs text-gray-500">
                        {t('variety')}: <span className="font-medium text-gray-700">{crop.variety || 'Standard'}</span> • {t('stage')}:{' '}
                        <span className="font-medium text-emerald-700 capitalize">{crop.growthStage?.toLowerCase() || 'Vegetative'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        crop.healthStatus === 'HEALTHY'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {crop.healthStatus === 'HEALTHY' ? t('healthy') : t('needsAttention')}
                    </span>
                    <button
                      onClick={() => openEditCropModal(crop)}
                      className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                      title={t('editCrop')}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCrop(crop.id)}
                      disabled={deletingCropId === crop.id}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title={t('deleteCrop')}
                    >
                      {deletingCropId === crop.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('scan')}
                      className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                      title={t('scanThisCrop')}
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 5. Farm Tasks Scheduler */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>📋</span> {t('taskCalendar')}
              </h3>
              <button
                onClick={() => setActiveTab('farm-manager')}
                className="text-xs text-emerald-700 font-bold hover:underline flex items-center"
              >
                {t('viewAll')} <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {tasks.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">{t('noTasks')}</p>
              ) : (
                tasks.slice(0, 3).map((task: any) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-2xl border transition flex items-start gap-3 ${
                      task.isCompleted ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-emerald-100/70 shadow-xs'
                    }`}
                  >
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className="mt-0.5 text-emerald-600 hover:text-emerald-700"
                    >
                      <CheckCircle2 className={`w-5 h-5 ${task.isCompleted ? 'fill-emerald-600 text-white' : 'text-gray-300'}`} />
                    </button>
                    <div className="flex-1">
                      <p className={`text-xs font-bold ${task.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                          {t('due')}: {task.dueDate}
                        </span>
                        {task.priority === 'HIGH' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">
                            {t('priorityHigh')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => setActiveTab('farm-manager')}
              className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <span>{t('manageTasksBtn')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Add Farm */}
      {showAddFarmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 relative space-y-4">
            <button
              onClick={() => setShowAddFarmModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-gray-900">{t('registerFarmTitle')}</h3>

            {farmError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{farmError}</span>
              </div>
            )}

            <form onSubmit={handleAddFarm} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">{t('farmNameLabel')}</label>
                <input
                  type="text"
                  value={farmName}
                  onChange={e => setFarmName(e.target.value)}
                  placeholder={t('farmNamePlaceholder')}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">{t('surveyNoLabel')}</label>
                <input
                  type="text"
                  value={farmLocation}
                  onChange={e => setFarmLocation(e.target.value)}
                  placeholder={t('surveyNoPlaceholder')}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">{t('totalAreaLabel')}</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={farmTotalArea}
                    onChange={e => setFarmTotalArea(e.target.value)}
                    placeholder="e.g. 4.5"
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">{t('soilTypeLabel')}</label>
                  <select
                    value={farmSoilType}
                    onChange={e => setFarmSoilType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="RED_LOAM">{t('soilRedLoam')}</option>
                    <option value="BLACK_COTTON">{t('soilBlackCotton')}</option>
                    <option value="ALLUVIAL">{t('soilAlluvial')}</option>
                    <option value="SANDY">{t('soilSandy')}</option>
                    <option value="CLAY_LOAM">{t('soilClayLoam')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">{t('irrigationSourceLabel')}</label>
                <select
                  value={farmIrrigation}
                  onChange={e => setFarmIrrigation(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="BOREWELL">{t('irrigBorewell')}</option>
                  <option value="CANAL">{t('irrigCanal')}</option>
                  <option value="RAIN_FED">{t('irrigRainfed')}</option>
                  <option value="FARM_POND">{t('irrigPond')}</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmittingFarm}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow transition text-xs active:scale-95 flex items-center justify-center gap-2"
              >
                {isSubmittingFarm ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('registeringFarm')}</span>
                  </>
                ) : (
                  <span>{t('registerFarmBtn')}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Crop */}
      {showAddCropModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 relative space-y-4">
            <button
              onClick={() => {
                setShowAddCropModal(false);
                setEditingCrop(null);
              }}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-gray-900">
              {editingCrop ? t('editCropTitle') : t('registerCropTitle')}
            </h3>

            {cropError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{cropError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCrop} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">{t('cropNameLabel')}</label>
                  <input
                    type="text"
                    value={cropName}
                    onChange={e => setCropName(e.target.value)}
                    placeholder={t('cropNamePlaceholder')}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">{t('cropVarietyLabel')}</label>
                  <input
                    type="text"
                    value={cropVariety}
                    onChange={e => setCropVariety(e.target.value)}
                    placeholder={t('cropVarietyPlaceholder')}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">{t('areaPlantedLabel')}</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={cropAreaPlanted}
                    onChange={e => setCropAreaPlanted(e.target.value)}
                    placeholder={`e.g. ${primaryFarm.totalArea}`}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">{t('growthStageLabel')}</label>
                  <select
                    value={cropGrowthStage}
                    onChange={e => setCropGrowthStage(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="SOWING">{t('stageSowing')}</option>
                    <option value="VEGETATIVE">{t('stageVegetative')}</option>
                    <option value="FLOWERING">{t('stageFlowering')}</option>
                    <option value="POD_DEVELOPMENT">{t('stagePod')}</option>
                    <option value="MATURITY">{t('stageMaturity')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">{t('healthStatusLabel')}</label>
                  <select
                    value={cropHealthStatus}
                    onChange={e => setCropHealthStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="HEALTHY">{t('healthy')}</option>
                    <option value="NEEDS_ATTENTION">{t('needsAttention')}</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">{t('expectedHarvestLabel')}</label>
                  <input
                    type="date"
                    value={cropHarvestDate}
                    onChange={e => setCropHarvestDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingCrop}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow transition text-xs active:scale-95 flex items-center justify-center gap-2"
              >
                {isSubmittingCrop ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('savingCrop')}</span>
                  </>
                ) : (
                  <span>{editingCrop ? t('updateCropBtn') : t('saveCropBtn')}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
