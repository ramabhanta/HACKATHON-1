import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Filter,
  MapPin,
  Calendar,
  Sparkles,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  Flower2,
  Wheat,
  Carrot,
  Apple,
  Flame,
  Layers,
  ArrowUpDown,
  Building2,
  Share2,
  Info
} from 'lucide-react';

export type MandiCommodityType =
  | 'CROP'
  | 'GRAIN'
  | 'PULSE'
  | 'OILSEED'
  | 'VEGETABLE'
  | 'FRUIT'
  | 'SPICE'
  | 'FLOWER'
  | 'OTHER';

export interface MarketPrice {
  id: string;
  state: string;
  district: string;
  market: string;
  commodity: string;
  commodityType: MandiCommodityType;
  variety: string;
  unit: 'QUINTAL' | 'KG' | 'CRATE' | 'BUNDLE' | '100_FLOWERS' | 'TON';
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  priceDate: string;
  trend: 'UP' | 'DOWN' | 'STABLE';
  changeAmount?: number;
  reportedBy?: string;
  reportedByName?: string;
  createdAt: string;
}

export interface StateRegion {
  state: string;
  districts: string[];
  mandis: string[];
}

interface MarketPricesProps {
  setActiveTab?: (tab: string) => void;
}

export const MarketPrices: React.FC<MarketPricesProps> = ({ setActiveTab }) => {
  const { user, isAuthenticated } = useAuth();
  const { t, language } = useLanguage();

  // Data states
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [regions, setRegions] = useState<StateRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<{
    totalPrices: number;
    flowerCount: number;
    cropCount: number;
    risingCount: number;
    activeStatesCount: number;
    activeMarketsCount: number;
    topGainers: MarketPrice[];
  } | null>(null);

  // Filters
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'modalDesc' | 'modalAsc' | 'dateDesc' | 'nameAsc'>('dateDesc');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Add Price Form Fields
  const [formState, setFormState] = useState<string>('Andhra Pradesh');
  const [formDistrict, setFormDistrict] = useState<string>('Anantapur');
  const [formMarket, setFormMarket] = useState<string>('');
  const [formCommodity, setFormCommodity] = useState<string>('');
  const [formCommodityType, setFormCommodityType] = useState<MandiCommodityType>('FLOWER');
  const [formVariety, setFormVariety] = useState<string>('');
  const [formUnit, setFormUnit] = useState<string>('KG');
  const [formMinPrice, setFormMinPrice] = useState<string>('');
  const [formMaxPrice, setFormMaxPrice] = useState<string>('');
  const [formModalPrice, setFormModalPrice] = useState<string>('');
  const [formTrend, setFormTrend] = useState<'UP' | 'DOWN' | 'STABLE'>('UP');
  const [formChangeAmount, setFormChangeAmount] = useState<string>('20');
  const [formReporterName, setFormReporterName] = useState<string>('');

  // Fetch states and regions
  useEffect(() => {
    fetchRegions();
    fetchPrices();
    fetchSummary();
  }, []);

  const fetchRegions = async () => {
    try {
      const res = await fetch('/api/prices/states');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.states) && data.states.length > 0 && typeof data.states[0] === 'object') {
          setRegions(data.states);
        } else if (data.hierarchy) {
          const list: StateRegion[] = Object.entries(data.hierarchy).map(([st, info]: [string, any]) => ({
            state: st,
            districts: Array.isArray(info?.districts) ? info.districts : [],
            mandis: Array.isArray(info?.mandis) ? info.mandis : []
          }));
          setRegions(list);
        }
      }
    } catch (err) {
      console.error('Failed to load Indian state regions', err);
    }
  };

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/prices');
      if (res.ok) {
        const data = await res.json();
        setPrices(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load prices', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/prices/summary');
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.error('Failed to load summary stats', err);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPrices();
    fetchSummary();
  };

  // Dynamic district options cascading from selectedState
  const availableDistricts = useMemo(() => {
    if (!Array.isArray(regions) || regions.length === 0) return [];
    if (selectedState === 'ALL') {
      // Gather all unique districts from all states
      const allDists = new Set<string>();
      regions.forEach(r => {
        if (r && Array.isArray(r.districts)) {
          r.districts.forEach(d => allDists.add(d));
        }
      });
      return Array.from(allDists).sort();
    }
    const regionObj = regions.find(r => r?.state?.toLowerCase() === selectedState.toLowerCase());
    return regionObj && Array.isArray(regionObj.districts) ? regionObj.districts : [];
  }, [selectedState, regions]);

  // Dynamic districts for Add Price modal form
  const formAvailableDistricts = useMemo(() => {
    if (!Array.isArray(regions) || regions.length === 0) return [];
    const regionObj = regions.find(r => r?.state?.toLowerCase() === formState.toLowerCase());
    return regionObj && Array.isArray(regionObj.districts) ? regionObj.districts : [];
  }, [formState, regions]);

  // When formState changes, update formDistrict to first available
  const handleFormStateChange = (newState: string) => {
    setFormState(newState);
    const reg = regions.find(r => r?.state?.toLowerCase() === newState.toLowerCase());
    if (reg && Array.isArray(reg.districts) && reg.districts.length > 0) {
      setFormDistrict(reg.districts[0]);
    }
  };

  // Filtered prices
  const filteredPrices = useMemo(() => {
    return prices
      .filter(p => {
        // State filter
        if (selectedState !== 'ALL' && p.state.toLowerCase() !== selectedState.toLowerCase()) {
          return false;
        }
        // District filter
        if (selectedDistrict !== 'ALL' && p.district.toLowerCase() !== selectedDistrict.toLowerCase()) {
          return false;
        }
        // Category filter
        if (selectedCategory !== 'ALL' && p.commodityType !== selectedCategory) {
          return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            p.commodity.toLowerCase().includes(q) ||
            p.variety.toLowerCase().includes(q) ||
            p.market.toLowerCase().includes(q) ||
            p.district.toLowerCase().includes(q) ||
            p.state.toLowerCase().includes(q);
          if (!matches) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'modalDesc') return b.modalPrice - a.modalPrice;
        if (sortBy === 'modalAsc') return a.modalPrice - b.modalPrice;
        if (sortBy === 'nameAsc') return a.commodity.localeCompare(b.commodity);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [prices, selectedState, selectedDistrict, selectedCategory, searchQuery, sortBy]);

  // Category pills configuration
  const categories = [
    { id: 'ALL', label: 'All Commodities', icon: '🌐' },
    { id: 'FLOWER', label: '🌸 Flowers (పూలు / फूल)', icon: '🌸', highlight: true },
    { id: 'CROP', label: 'Crops & Fibers', icon: '🌾' },
    { id: 'GRAIN', label: 'Grains & Cereals', icon: '🌽' },
    { id: 'VEGETABLE', label: 'Vegetables', icon: '🥕' },
    { id: 'SPICE', label: 'Spices & Condiments', icon: '🌶️' },
    { id: 'OILSEED', label: 'Oilseeds', icon: '🌻' },
    { id: 'PULSE', label: 'Pulses', icon: '🫘' },
    { id: 'FRUIT', label: 'Fruits', icon: '🍎' }
  ];

  // Quick preset templates for rapid entry
  const presetTemplates = [
    {
      name: '🌸 Jasmine / Mallipoo (మల్లెపూలు)',
      commodity: 'Jasmine (Mallipoo / మల్లెపూలు)',
      type: 'FLOWER' as MandiCommodityType,
      variety: 'Local Fresh Fragrant Bud',
      unit: 'KG',
      modal: '450',
      min: '380',
      max: '520'
    },
    {
      name: '🌸 Marigold (Genda / బంతిపూలు)',
      commodity: 'Marigold (Bantipoolu / Genda)',
      type: 'FLOWER' as MandiCommodityType,
      variety: 'African Orange & Golden Yellow',
      unit: 'KG',
      modal: '75',
      min: '50',
      max: '95'
    },
    {
      name: '🌸 Cut Dutch Rose (గులాబీ)',
      commodity: 'Cut Dutch Rose (Gulab)',
      type: 'FLOWER' as MandiCommodityType,
      variety: 'Top Secret Red (20 Stems)',
      unit: 'BUNDLE',
      modal: '260',
      min: '200',
      max: '340'
    },
    {
      name: '🌸 Crossandra (Kanakambaram)',
      commodity: 'Crossandra (Kanakambaram / కనకాంబరం)',
      type: 'FLOWER' as MandiCommodityType,
      variety: 'Orange Deep Bloom',
      unit: 'KG',
      modal: '550',
      min: '450',
      max: '650'
    },
    {
      name: '🌾 Groundnut (వేరుశనగ)',
      commodity: 'Groundnut (వేరుశనగ)',
      type: 'OILSEED' as MandiCommodityType,
      variety: 'Kadiri-6 Pods',
      unit: 'QUINTAL',
      modal: '7350',
      min: '6800',
      max: '7600'
    },
    {
      name: '🌶️ Guntur Red Chilli (మిర్చి)',
      commodity: 'Dry Red Chilli (ఎండు మిర్చి)',
      type: 'SPICE' as MandiCommodityType,
      variety: 'Teja S17 Grade A',
      unit: 'QUINTAL',
      modal: '21500',
      min: '19800',
      max: '23500'
    }
  ];

  const applyPreset = (preset: typeof presetTemplates[0]) => {
    setFormCommodity(preset.commodity);
    setFormCommodityType(preset.type);
    setFormVariety(preset.variety);
    setFormUnit(preset.unit);
    setFormModalPrice(preset.modal);
    setFormMinPrice(preset.min);
    setFormMaxPrice(preset.max);
  };

  // Submit Handler for Add Market Price
  const handleAddPriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formState || !formDistrict || !formMarket.trim()) {
      setFormError('Please select state, district and enter market/mandi name.');
      return;
    }
    if (!formCommodity.trim()) {
      setFormError('Please enter commodity or flower name.');
      return;
    }
    const min = parseFloat(formMinPrice);
    const max = parseFloat(formMaxPrice);
    const modal = parseFloat(formModalPrice);

    if (isNaN(modal) || modal <= 0) {
      setFormError('Please enter a valid modal (prevailing) market price.');
      return;
    }
    if (isNaN(min) || isNaN(max) || min <= 0 || max <= 0) {
      setFormError('Please provide both minimum and maximum observed rates.');
      return;
    }
    if (min > modal || modal > max) {
      setFormError('Ensure: Min Price <= Modal Price <= Max Price.');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        state: formState,
        district: formDistrict,
        market: formMarket.trim(),
        commodity: formCommodity.trim(),
        commodityType: formCommodityType,
        variety: formVariety.trim() || 'Standard Market Quality',
        unit: formUnit,
        minPrice: min,
        maxPrice: max,
        modalPrice: modal,
        trend: formTrend,
        changeAmount: parseFloat(formChangeAmount) || 0,
        reportedBy: user?.id || 'usr-farmer-1',
        reportedByName: formReporterName.trim() || user?.name || 'Local Mandi Informant'
      };

      const res = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to submit market price.');
      }

      const createdPrice = await res.json();

      // Prepend to current prices
      setPrices(prev => [createdPrice, ...prev]);
      setIsAddModalOpen(false);

      // Reset form
      setFormMarket('');
      setFormCommodity('');
      setFormVariety('');
      setFormMinPrice('');
      setFormMaxPrice('');
      setFormModalPrice('');
      setFormChangeAmount('0');

      // Refresh stats
      fetchSummary();

      // Show toast
      setSuccessToast(`Market rate for "${createdPrice.commodity}" at ${createdPrice.market} added successfully!`);
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      setFormError(err.message || 'Error occurred while saving price.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const getCategoryBadge = (type: MandiCommodityType) => {
    switch (type) {
      case 'FLOWER':
        return {
          bg: 'bg-pink-100 text-pink-800 border-pink-200',
          icon: '🌸',
          label: 'Flower'
        };
      case 'SPICE':
        return {
          bg: 'bg-red-100 text-red-800 border-red-200',
          icon: '🌶️',
          label: 'Spice'
        };
      case 'VEGETABLE':
        return {
          bg: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: '🥕',
          label: 'Vegetable'
        };
      case 'GRAIN':
      case 'CROP':
        return {
          bg: 'bg-amber-100 text-amber-900 border-amber-200',
          icon: '🌾',
          label: type === 'GRAIN' ? 'Grain' : 'Crop'
        };
      case 'OILSEED':
        return {
          bg: 'bg-yellow-100 text-yellow-900 border-yellow-200',
          icon: '🌻',
          label: 'Oilseed'
        };
      case 'PULSE':
        return {
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
          icon: '🫘',
          label: 'Pulse'
        };
      case 'FRUIT':
        return {
          bg: 'bg-purple-100 text-purple-900 border-purple-200',
          icon: '🍎',
          label: 'Fruit'
        };
      default:
        return {
          bg: 'bg-stone-100 text-stone-800 border-stone-200',
          icon: '📦',
          label: 'Commodity'
        };
    }
  };

  const getUnitDisplay = (unit: string) => {
    switch (unit) {
      case 'QUINTAL':
        return '/ Quintal (100 kg)';
      case 'KG':
        return '/ kg';
      case 'BUNDLE':
        return '/ Bundle (కట్ట / बंडल)';
      case '100_FLOWERS':
        return '/ 100 Flowers (100 పూలు)';
      case 'CRATE':
        return '/ Crate';
      case 'TON':
        return '/ Ton';
      default:
        return `/${unit}`;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-4 z-50 max-w-md bg-emerald-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-700 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-sm font-medium">{successToast}</p>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-300 hover:text-white ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-700/30 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-1/4 bottom-0 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>All-India Mandi & Floriculture Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              🌾 Live APMC Mandi & Flower Rates
            </h1>
            <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
              Real-time daily wholesale prices for crops, grains, pulses, spices, and floriculture yards (Jasmine, Marigold, Rose, Crossandra, Chrysanthemum) across all Indian states and districts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-semibold transition text-white active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 text-sm font-bold shadow-lg shadow-amber-900/30 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Report Today's Market Price</span>
            </button>
          </div>
        </div>

        {/* Live Ticker KPI Summary */}
        {summary && (
          <div className="mt-8 pt-6 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
              <span className="text-xs text-emerald-200 block font-medium">Total Tracked Commodities</span>
              <div className="text-2xl font-black mt-1 text-white">{summary.totalPrices}</div>
              <span className="text-[11px] text-emerald-300">Updated today</span>
            </div>

            <div className="bg-pink-500/20 backdrop-blur-sm rounded-2xl p-3.5 border border-pink-400/30">
              <div className="flex items-center justify-between">
                <span className="text-xs text-pink-200 block font-medium">🌸 Flower Mandis</span>
                <span className="text-xs bg-pink-400/30 px-2 py-0.5 rounded text-pink-200 font-bold">Floriculture</span>
              </div>
              <div className="text-2xl font-black mt-1 text-pink-100">{summary.flowerCount}</div>
              <span className="text-[11px] text-pink-200">Jasmine, Rose, Marigold, Chamanti</span>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
              <span className="text-xs text-emerald-200 block font-medium">Active States & Mandis</span>
              <div className="text-2xl font-black mt-1 text-white">
                {summary.activeStatesCount} States / {summary.activeMarketsCount} Mandis
              </div>
              <span className="text-[11px] text-emerald-300">All India Coverage</span>
            </div>

            <div className="bg-emerald-500/20 backdrop-blur-sm rounded-2xl p-3.5 border border-emerald-400/30">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-200 block font-medium">Bullish Trend Mandis</span>
                <TrendingUp className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="text-2xl font-black mt-1 text-emerald-100">{summary.risingCount}</div>
              <span className="text-[11px] text-emerald-300">Rates climbing this week</span>
            </div>
          </div>
        )}
      </div>

      {/* Cascading State & District Selector + Search Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* State Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('selectStatePrompt')}</span>
            </label>
            <select
              value={selectedState}
              onChange={e => {
                setSelectedState(e.target.value);
                setSelectedDistrict('ALL'); // Reset district when state changes
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-stone-50 font-semibold text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            >
              <option value="ALL">{t('allIndia')}</option>
              {regions.map(r => (
                <option key={r.state} value={r.state}>
                  {r.state}
                </option>
              ))}
            </select>
          </div>

          {/* Cascading District Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              <span>{t('selectDistrictPrompt')}</span>
            </label>
            <select
              value={selectedDistrict}
              onChange={e => setSelectedDistrict(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-stone-50 font-semibold text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            >
              <option value="ALL">
                {selectedState === 'ALL'
                  ? t('allDistrictsIndia')
                  : t('allDistrictsInState', { state: selectedState })}
              </option>
              {availableDistricts.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-gray-500" />
              <span>3. Search Commodity / Flower / Mandi</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder='Search "Jasmine", "Rose", "Tomato", "Chilli", "Lasalgaon", "Kadiri"...'
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-300 bg-stone-50 font-medium text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Filter Pills (Highlighted Flowers) */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-4 overflow-x-auto pb-1">
          <div className="flex items-center gap-2 shrink-0">
            {categories.map(cat => {
              const isSelected = selectedCategory === cat.id;
              const isFlower = cat.id === 'FLOWER';
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? isFlower
                        ? 'bg-pink-600 text-white shadow-md shadow-pink-200 ring-2 ring-pink-400'
                        : 'bg-emerald-700 text-white shadow-md shadow-emerald-200'
                      : isFlower
                      ? 'bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sort & View Mode */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none"
            >
              <option value="dateDesc">Latest Rates</option>
              <option value="modalDesc">Price: High to Low</option>
              <option value="modalAsc">Price: Low to High</option>
              <option value="nameAsc">Commodity Name (A-Z)</option>
            </select>

            <div className="hidden sm:flex items-center bg-gray-100 rounded-xl p-0.5 border border-gray-200">
              <button
                onClick={() => setViewMode('CARDS')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  viewMode === 'CARDS' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  viewMode === 'TABLE' ? 'bg-white shadow-xs text-gray-900' : 'text-gray-500'
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filter Indicators */}
      {(selectedState !== 'ALL' || selectedDistrict !== 'ALL' || selectedCategory !== 'ALL' || searchQuery) && (
        <div className="flex items-center gap-2 flex-wrap text-xs text-gray-600 bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100">
          <span className="font-bold text-emerald-900">Active Filters:</span>
          {selectedState !== 'ALL' && (
            <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
              State: {selectedState}
              <button onClick={() => setSelectedState('ALL')} className="hover:text-emerald-950">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedDistrict !== 'ALL' && (
            <span className="bg-teal-100 text-teal-800 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
              District: {selectedDistrict}
              <button onClick={() => setSelectedDistrict('ALL')} className="hover:text-teal-950">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedCategory !== 'ALL' && (
            <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
              Category: {selectedCategory}
              <button onClick={() => setSelectedCategory('ALL')} className="hover:text-amber-950">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {searchQuery && (
            <span className="bg-gray-200 text-gray-800 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
              Search: "{searchQuery}"
              <button onClick={() => setSearchQuery('')} className="hover:text-gray-950">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            onClick={() => {
              setSelectedState('ALL');
              setSelectedDistrict('ALL');
              setSelectedCategory('ALL');
              setSearchQuery('');
            }}
            className="ml-auto text-emerald-800 underline font-bold hover:text-emerald-950"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Main Prices Display */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto" />
          <h3 className="text-lg font-bold text-gray-900">Fetching Indian Mandi & Flower Rates...</h3>
          <p className="text-sm text-gray-500">Connecting to wholesale agricultural market yards and floriculture boards.</p>
        </div>
      ) : filteredPrices.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-3xl mx-auto">
            🌾
          </div>
          <h3 className="text-lg font-bold text-gray-900">No Market Prices Found</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            No market rates recorded matching your current state, district, or commodity criteria. You can report today's price directly!
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition"
          >
            + Report Market Rate for this Mandi
          </button>
        </div>
      ) : viewMode === 'CARDS' ? (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPrices.map(item => {
            const badge = getCategoryBadge(item.commodityType);
            const isFlower = item.commodityType === 'FLOWER';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-3xl p-5 shadow-sm border transition hover:shadow-lg flex flex-col justify-between ${
                  isFlower
                    ? 'border-pink-200 hover:border-pink-300'
                    : 'border-gray-100 hover:border-emerald-200'
                }`}
              >
                <div>
                  {/* Category & Trend Pill */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}
                    >
                      <span>{badge.icon}</span>
                      <span>{badge.label}</span>
                    </span>

                    {/* Trend Indicator */}
                    <div className="flex items-center gap-1 text-xs font-bold">
                      {item.trend === 'UP' && (
                        <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>+₹{item.changeAmount || 0}</span>
                        </span>
                      )}
                      {item.trend === 'DOWN' && (
                        <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span>-₹{item.changeAmount || 0}</span>
                        </span>
                      )}
                      {item.trend === 'STABLE' && (
                        <span className="flex items-center gap-1 text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
                          <Minus className="w-3.5 h-3.5" />
                          <span>Stable</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Commodity Name & Variety */}
                  <div className="space-y-1">
                    <h3 className="text-lg font-extrabold text-gray-900 tracking-tight leading-snug">
                      {item.commodity}
                    </h3>
                    <p className="text-xs text-gray-600 font-medium">{item.variety}</p>
                  </div>

                  {/* Market & Location */}
                  <div className="mt-3 flex items-start gap-2 text-xs text-gray-600 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-gray-900 block">{item.market}</span>
                      <span className="text-gray-500">
                        {item.district}, {item.state}
                      </span>
                    </div>
                  </div>

                  {/* Price Box */}
                  <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-stone-50 border border-emerald-100/80">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                          Modal Rate (సగటు ధర)
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-2xl font-black text-emerald-900">
                            ₹{item.modalPrice.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs font-semibold text-gray-600">
                            {getUnitDisplay(item.unit)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Min to Max Range Bar */}
                    <div className="mt-3 pt-2.5 border-t border-emerald-100/60 flex items-center justify-between text-xs text-gray-600">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">Min</span>
                        <span className="font-bold text-gray-800">₹{item.minPrice.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="text-center px-2">
                        <span className="text-[10px] text-gray-400 block font-semibold">Range</span>
                        <div className="w-16 h-1 bg-emerald-200 rounded-full mt-1.5 mx-auto" />
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 block font-semibold">Max</span>
                        <span className="font-bold text-gray-800">₹{item.maxPrice.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer metadata */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                  <span className="flex items-center gap-1 truncate max-w-[170px]" title={item.reportedByName}>
                    <Building2 className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="truncate">{item.reportedByName || 'APMC Reporter'}</span>
                  </span>
                  <span className="shrink-0">{item.priceDate}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Tabular View */
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-gray-100 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <th className="py-4 px-5">Commodity / Flower</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">State & District</th>
                  <th className="py-4 px-4">Mandi / Market Yard</th>
                  <th className="py-4 px-4 text-right">Min Rate</th>
                  <th className="py-4 px-4 text-right">Modal Rate</th>
                  <th className="py-4 px-4 text-right">Max Rate</th>
                  <th className="py-4 px-4 text-center">Trend</th>
                  <th className="py-4 px-5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredPrices.map(item => {
                  const badge = getCategoryBadge(item.commodityType);
                  return (
                    <tr key={item.id} className="hover:bg-emerald-50/40 transition">
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-gray-900">{item.commodity}</div>
                        <div className="text-xs text-gray-500">{item.variety}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg}`}
                        >
                          <span>{badge.icon}</span>
                          <span>{badge.label}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{item.district}</div>
                        <div className="text-xs text-gray-500">{item.state}</div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-800 font-medium">{item.market}</td>
                      <td className="py-3.5 px-4 text-right font-medium text-gray-600 whitespace-nowrap">
                        ₹{item.minPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="font-extrabold text-emerald-900 text-base">
                          ₹{item.modalPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] text-gray-500 block">{getUnitDisplay(item.unit)}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-gray-600 whitespace-nowrap">
                        ₹{item.maxPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {item.trend === 'UP' && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold text-xs">
                            <TrendingUp className="w-3 h-3" />
                            <span>+₹{item.changeAmount || 0}</span>
                          </span>
                        )}
                        {item.trend === 'DOWN' && (
                          <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-bold text-xs">
                            <TrendingDown className="w-3 h-3" />
                            <span>-₹{item.changeAmount || 0}</span>
                          </span>
                        )}
                        {item.trend === 'STABLE' && (
                          <span className="inline-flex items-center gap-1 text-gray-500 bg-gray-50 px-2 py-0.5 rounded font-semibold text-xs">
                            <Minus className="w-3 h-3" />
                            <span>Stable</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right text-xs text-gray-500 whitespace-nowrap">
                        {item.priceDate}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD / REPORT MARKET PRICE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto border border-gray-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center text-xl">
                  📝
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Report Today's Market Price</h3>
                  <p className="text-xs text-gray-500">
                    Add verified wholesale mandi rates for crops, grains, and flowers all over India.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Quick Presets */}
            <div className="mt-4">
              <span className="text-xs font-bold text-gray-700 block mb-1.5">
                ⚡ Quick Fill Popular Presets (పూలు & పంటలు):
              </span>
              <div className="flex flex-wrap gap-2">
                {presetTemplates.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-900 font-semibold border border-stone-200 transition"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleAddPriceSubmit} className="mt-6 space-y-4">
              {/* State and Cascading District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    {t('stateLabel')} *
                  </label>
                  <select
                    value={formState}
                    onChange={e => handleFormStateChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    {regions.map(r => (
                      <option key={r.state} value={r.state}>
                        {r.state}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    {t('districtLabel')} *
                  </label>
                  <select
                    value={formDistrict}
                    onChange={e => setFormDistrict(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    {formAvailableDistricts.map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mandi / Market Yard Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Mandi / Market Yard Name *
                </label>
                <input
                  type="text"
                  value={formMarket}
                  onChange={e => setFormMarket(e.target.value)}
                  placeholder="e.g. Kadiri Mandi, Mattuthavani Flower Market, Ghazipur Mandi..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Commodity Category & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Commodity Category *
                  </label>
                  <select
                    value={formCommodityType}
                    onChange={e => setFormCommodityType(e.target.value as MandiCommodityType)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="FLOWER">🌸 Flower (పూలు / फूल)</option>
                    <option value="CROP">🌾 Crop & Fiber (పంట)</option>
                    <option value="GRAIN">🌽 Grain & Cereal (ధాన్యం)</option>
                    <option value="VEGETABLE">🥕 Vegetable (కూరగాయ)</option>
                    <option value="SPICE">🌶️ Spice (మసాలా)</option>
                    <option value="OILSEED">🌻 Oilseed (నూనెగింజలు)</option>
                    <option value="PULSE">🫘 Pulse (పప్పుధాన్యాలు)</option>
                    <option value="FRUIT">🍎 Fruit (పండు)</option>
                    <option value="OTHER">📦 Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Commodity / Flower Name *
                  </label>
                  <input
                    type="text"
                    value={formCommodity}
                    onChange={e => setFormCommodity(e.target.value)}
                    placeholder="e.g. Jasmine (మల్లెపూలు), Dutch Rose, Groundnut, Tomato..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Variety and Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Variety / Quality Grade
                  </label>
                  <input
                    type="text"
                    value={formVariety}
                    onChange={e => setFormVariety(e.target.value)}
                    placeholder="e.g. Local Fresh Bud, Grade A, High Fragrance..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Trading Unit *
                  </label>
                  <select
                    value={formUnit}
                    onChange={e => setFormUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="KG">Kilogram (KG) - Best for Flowers & Veg</option>
                    <option value="BUNDLE">Bundle (కట్ట / बंडल) - For Cut Roses</option>
                    <option value="100_FLOWERS">100 Flowers (100 పూలు) - For Lotus</option>
                    <option value="QUINTAL">Quintal (100 KG) - For Crops & Grains</option>
                    <option value="CRATE">Crate - For Tomatoes & Fruits</option>
                    <option value="TON">Ton (1000 KG)</option>
                  </select>
                </div>
              </div>

              {/* Price Fields: Min, Modal, Max */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                    Min Rate (₹) *
                  </label>
                  <input
                    type="number"
                    value={formMinPrice}
                    onChange={e => setFormMinPrice(e.target.value)}
                    placeholder="e.g. 380"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-800 uppercase mb-1">
                    Modal Rate (₹) *
                  </label>
                  <input
                    type="number"
                    value={formModalPrice}
                    onChange={e => setFormModalPrice(e.target.value)}
                    placeholder="e.g. 450"
                    className="w-full px-3 py-2 rounded-xl border border-emerald-400 bg-emerald-50/50 text-sm font-black text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                    Max Rate (₹) *
                  </label>
                  <input
                    type="number"
                    value={formMaxPrice}
                    onChange={e => setFormMaxPrice(e.target.value)}
                    placeholder="e.g. 520"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Trend and Change Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Price Trend *
                  </label>
                  <select
                    value={formTrend}
                    onChange={e => setFormTrend(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="UP">▲ Rising (పెరుగుతోంది)</option>
                    <option value="STABLE">— Stable (స్థిరంగా ఉంది)</option>
                    <option value="DOWN">▼ Falling (తగ్గుతోంది)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Daily Change (₹)
                  </label>
                  <input
                    type="number"
                    value={formChangeAmount}
                    onChange={e => setFormChangeAmount(e.target.value)}
                    placeholder="e.g. 20"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Reported By (Trader / Mandi)
                  </label>
                  <input
                    type="text"
                    value={formReporterName}
                    onChange={e => setFormReporterName(e.target.value)}
                    placeholder="e.g. Rayalaseema Florists Union"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-bold hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold shadow-lg shadow-emerald-900/20 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {formSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{formSubmitting ? 'Submitting to Mandi Board...' : 'Save & Publish Market Rate'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
