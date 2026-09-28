import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  MapPin,
  Phone,
  Clock,
  Star,
  ShieldCheck,
  Search,
  Navigation,
  ExternalLink,
  ShoppingBag
} from 'lucide-react';

interface NearbyShopsProps {
  setActiveTab: (tab: string) => void;
}

export const NearbyShops: React.FC<NearbyShopsProps> = ({ setActiveTab }) => {
  const { t } = useLanguage();
  const [shops, setShops] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [radius, setRadius] = useState(25);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadShops() {
      try {
        const res = await fetch(`/api/shops/nearby?lat=14.1165&lon=78.1634&radius=${radius}&search=${search}`);
        if (res.ok) {
          setShops(await res.json());
        }
      } catch (err) {
        console.error('Failed to load nearby shops:', err);
      } finally {
        setLoading(false);
      }
    }
    loadShops();
  }, [radius, search]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 text-xs font-bold border border-indigo-200 mb-2">
            <span>📍 Kadiri Division & Surrounding Mandals</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Nearby Agricultural Input Shops
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Locate authorized fertilizer depots, certified seed dealers, and equipment centers
          </p>
        </div>

        {/* Radius filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500">Radius:</label>
          <select
            value={radius}
            onChange={e => setRadius(parseInt(e.target.value, 10))}
            className="bg-gray-50 border border-gray-200 text-gray-800 font-bold text-xs rounded-xl px-3 py-2 outline-none"
          >
            <option value={10}>Within 10 km</option>
            <option value={25}>Within 25 km</option>
            <option value={50}>Within 50 km</option>
          </select>
        </div>
      </div>

      {/* Interactive Map Visual Simulation */}
      <div className="bg-gradient-to-br from-emerald-900 to-teal-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="font-extrabold text-sm tracking-wide">Live GPS Radius Discovery</span>
          </div>
          <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
            {shops.length} Authorized Shops Found
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {shops.map(shop => (
            <div
              key={shop.id}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 transition cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <span className="text-base font-black">🏪</span>
                <span className="text-[10px] font-black bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full">
                  {shop.distanceKm} km
                </span>
              </div>
              <h4 className="font-extrabold text-xs text-white mt-2 line-clamp-1">{shop.name}</h4>
              <p className="text-[11px] text-emerald-200 mt-0.5 line-clamp-1">{shop.address}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Shop Listing Cards */}
      <div className="space-y-4">
        {shops.map(shop => (
          <div
            key={shop.id}
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:border-emerald-200 transition space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base text-gray-900">{shop.name}</h3>
                  {shop.isVerified && (
                    <span className="flex items-center gap-1 text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Vendor
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{shop.address}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 text-amber-800 text-xs font-black">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span>{shop.rating}</span>
                  <span className="text-gray-400 text-[10px]">({shop.reviews})</span>
                </div>
                <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl">
                  {shop.distanceKm} km away
                </span>
              </div>
            </div>

            {/* Operating info & In stock tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Hours: <strong>{shop.openingHours}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>Call: <strong>{shop.phone}</strong></span>
              </div>
            </div>

            {/* Featured Inputs Available */}
            <div>
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">
                Inputs Currently Available in Stock ({shop.inStockCount}+ items):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {shop.featuredInputs?.map((inp: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-gray-50 text-gray-700 text-[11px] font-semibold rounded-lg border border-gray-200">
                    ✓ {inp}
                  </span>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <a
                href={`tel:${shop.phone}`}
                className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Phone className="w-3.5 h-3.5" /> Call Shop
              </a>
              <button
                onClick={() => setActiveTab('store')}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-95"
              >
                <ShoppingBag className="w-3.5 h-3.5" /> View Products & Order
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
