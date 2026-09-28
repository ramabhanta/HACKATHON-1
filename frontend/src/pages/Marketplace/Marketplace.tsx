import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import {
  Search,
  Filter,
  ShoppingBag,
  CheckCircle2,
  MapPin,
  Star,
  Sparkles,
  Info,
  X,
  ShieldCheck,
  Check
} from 'lucide-react';

interface MarketplaceProps {
  setActiveTab: (tab: string) => void;
}

export const Marketplace: React.FC<MarketplaceProps> = ({ setActiveTab }) => {
  const { t, language } = useLanguage();
  const { addToCart } = useCart();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [organicOnly, setOrganicOnly] = useState(false);
  const [activeProductModal, setActiveProductModal] = useState<any | null>(null);
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCatalog() {
      try {
        const [pRes, cRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/products/categories')
        ]);
        if (pRes.ok) setProducts(await pRes.json());
        if (cRes.ok) setCategories(await cRes.json());
      } catch (err) {
        console.error('Failed to load marketplace products:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCatalog();
  }, []);

  const filteredProducts = products.filter(p => {
    if (selectedCategory && p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    if (organicOnly && !p.isOrganic) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.applicableCrops.some((c: string) => c.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleAddToCart = (product: any) => {
    addToCart(product);
    setAddedToast(`Added ${product.name} to cart!`);
    setTimeout(() => setAddedToast(null), 2500);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Toast Notification */}
      {addedToast && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-800 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-600 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span className="text-xs font-bold">{addedToast}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-teal-800 to-emerald-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-900/40 border border-teal-400/30 text-teal-200 text-xs font-semibold mb-2">
            <span>🛒 Certified Farm Inputs & Inputs Depot</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Agricultural Input Marketplace
          </h1>
          <p className="text-teal-100 text-xs sm:text-sm mt-1">
            Genuine Neem Coated Urea, DAP, Coromandel Gromor, Certified Seeds, and Bio-pesticides from verified dealers in Kadiri.
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-emerald-100 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Organic Filter Toggle */}
          <button
            onClick={() => setOrganicOnly(!organicOnly)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
              organicOnly
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <span>🌿 Organic & Bio-Inputs Only</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              selectedCategory === ''
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Products
          </button>
          <button
            onClick={() => setSelectedCategory('FERTILIZERS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1 ${
              selectedCategory === 'FERTILIZERS'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>🌱</span> Fertilizers (Urea, DAP, Gromor)
          </button>
          <button
            onClick={() => setSelectedCategory('SEEDS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1 ${
              selectedCategory === 'SEEDS'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>🌾</span> Certified Seeds (K6, Tomato)
          </button>
          <button
            onClick={() => setSelectedCategory('CROP_PROTECTION')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1 ${
              selectedCategory === 'CROP_PROTECTION'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>🛡️</span> Crop Protection (Neem Oil, Trichoderma)
          </button>
          <button
            onClick={() => setSelectedCategory('EQUIPMENT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1 ${
              selectedCategory === 'EQUIPMENT'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>🔧</span> Sprayers & Tools
          </button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map(p => (
          <div
            key={p.id}
            className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-md transition flex flex-col justify-between group"
          >
            <div>
              {/* Image & Badges */}
              <div
                className="relative rounded-2xl overflow-hidden bg-gray-50 h-44 cursor-pointer"
                onClick={() => setActiveProductModal(p)}
              >
                <img
                  src={p.images?.[0] || 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=300'}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-800 text-white shadow">
                  {p.brand}
                </span>
                {p.isOrganic && (
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-500 text-white shadow">
                    🌿 Bio-Organic
                  </span>
                )}
              </div>

              {/* Title & Specs */}
              <div className="mt-3 cursor-pointer" onClick={() => setActiveProductModal(p)}>
                <h3 className="font-extrabold text-sm text-gray-900 group-hover:text-emerald-800 transition line-clamp-1">
                  {p.name}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>

                <div className="flex items-center gap-1.5 mt-2 text-[10px] font-semibold text-emerald-800">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span>{p.vendorName} • {p.vendorDistanceKm || 2.3} km away</span>
                </div>
              </div>
            </div>

            {/* Price & Action */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-black text-gray-900">₹{p.price}</span>
                  {p.mrp > p.price && (
                    <span className="text-xs text-gray-400 line-through">₹{p.mrp}</span>
                  )}
                </div>
                <span className="text-[10px] text-gray-500 block font-medium">{p.packSize}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveProductModal(p)}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                  title="View Agricultural Info"
                >
                  <Info className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleAddToCart(p)}
                  className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 flex items-center gap-1"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{t('addToCart')}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Product Detail Modal */}
      {activeProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-emerald-100 relative space-y-4">
            <button
              onClick={() => setActiveProductModal(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Top overview */}
            <div className="flex flex-col sm:flex-row gap-4 items-start border-b border-gray-100 pb-4">
              <img
                src={activeProductModal.images?.[0]}
                alt={activeProductModal.name}
                className="w-full sm:w-44 h-44 rounded-2xl object-cover border border-gray-100"
              />
              <div className="flex-1">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase rounded">
                  {activeProductModal.brand}
                </span>
                <h2 className="text-xl font-black text-gray-900 mt-1">
                  {activeProductModal.name}
                </h2>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-black text-emerald-800">
                    ₹{activeProductModal.price}
                  </span>
                  {activeProductModal.mrp > activeProductModal.price && (
                    <span className="text-sm text-gray-400 line-through">
                      ₹{activeProductModal.mrp}
                    </span>
                  )}
                  <span className="text-xs text-gray-500 font-semibold">
                    ({activeProductModal.packSize})
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Available at <strong>{activeProductModal.vendorName}</strong> (2.3 km away)</span>
                </div>
              </div>
            </div>

            {/* Agricultural details & Safety Section */}
            <div className="space-y-3 text-xs">
              <div>
                <h4 className="font-bold text-gray-900 uppercase tracking-wider mb-1">
                  Agricultural Use & Compatibility:
                </h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed">
                  {activeProductModal.agriculturalUse}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 uppercase tracking-wider mb-1">
                  Dosage & Field Calibration Guidance:
                </h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed">
                  {activeProductModal.dosageGuidance}
                </p>
              </div>

              {/* Safety Precautions & Legal label */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-1.5 text-amber-950">
                <h4 className="font-extrabold flex items-center gap-1.5 text-amber-900 uppercase">
                  <ShieldCheck className="w-4 h-4 text-amber-700" /> Label & Safety Instructions:
                </h4>
                <p className="text-[11px] leading-relaxed">
                  {activeProductModal.labelInstructions}
                </p>
                <ul className="text-[11px] space-y-0.5 pl-4 list-disc text-amber-900">
                  {activeProductModal.safetyPrecautions?.map((sec: string, i: number) => (
                    <li key={i}>{sec}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex gap-3">
              <button
                onClick={() => {
                  handleAddToCart(activeProductModal);
                  setActiveProductModal(null);
                }}
                className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-2xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 text-sm"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart (₹{activeProductModal.price})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
