import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
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
  ShoppingBag,
  RefreshCw,
  Compass
} from 'lucide-react';
import { detectLocation, getCachedLocation, calculateDistance } from '../../services/geolocationService';

interface NearbyShopsProps {
  setActiveTab: (tab: string) => void;
}

export const NearbyShops: React.FC<NearbyShopsProps> = ({ setActiveTab }) => {
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();
  const [shops, setShops] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [radius, setRadius] = useState<number>(30);
  const [loading, setLoading] = useState(true);
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  // Active user coordinate resolution
  const cached = getCachedLocation();
  const userLat = user?.latitude || cached?.latitude || cached?.lat || 13.9890;
  const userLng = user?.longitude || cached?.longitude || cached?.lng || 77.7712;
  const userVillage = user?.village || cached?.village || 'Gorantla';
  const userDistrict = user?.district || cached?.district || 'Sri Sathya Sai';

  const fetchShops = async (lat: number, lon: number, rad: number, q: string) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        lat: lat.toString(),
        lon: lon.toString(),
        radius: rad.toString(),
        search: q,
        district: userDistrict,
        village: userVillage
      });
      const res = await fetch(`/api/shops/nearby?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        // Ensure distances are computed accurately with Haversine on client
        const enriched = data.map((s: any) => ({
          ...s,
          distanceKm: calculateDistance(lat, lon, s.latitude, s.longitude)
        })).sort((a: any, b: any) => a.distanceKm - b.distanceKm);
        setShops(enriched);
      }
    } catch (err) {
      console.error('Failed to load nearby shops:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops(userLat, userLng, radius, search);
  }, [userLat, userLng, radius, search, userDistrict, userVillage]);

  const handleRefreshGPS = async () => {
    setIsDetectingGps(true);
    try {
      const geo = await detectLocation();
      if (updateProfile) {
        await updateProfile({
          village: geo.village || geo.taluk || userVillage,
          district: geo.district || userDistrict,
          state: geo.state || user?.state,
          latitude: geo.lat,
          longitude: geo.lng
        });
      }
      fetchShops(geo.lat, geo.lng, radius, search);
    } catch (err) {
      console.error('GPS detection failed:', err);
    } finally {
      setIsDetectingGps(false);
    }
  };

  const radiusOptions = [
    { label: '< 5 km', value: 5 },
    { label: '< 15 km', value: 15 },
    { label: '< 30 km', value: 30 },
    { label: '< 50 km', value: 50 },
    { label: 'All Shops (100 km)', value: 100 }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Header with Live Geolocation Pill */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>📍 Active GPS Area: <strong>{userVillage}, {userDistrict}</strong></span>
            <button
              onClick={handleRefreshGPS}
              disabled={isDetectingGps}
              className="p-1 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition disabled:opacity-50 ml-1"
              title="Retarget Live GPS Location"
            >
              <RefreshCw className={`w-3 h-3 ${isDetectingGps ? 'animate-spin text-emerald-700' : ''}`} />
            </button>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Certified Krishi Kendras & Agro Input Stores
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Real-time GPS routing to authorized fertilizer depots, certified seed dealers, and agro-clinics
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px] sm:min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by shop, town, or product..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>
      </div>

      {/* Interactive Radius Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-bold text-gray-500 shrink-0 mr-1 flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 text-emerald-700" /> Radius Filter:
        </span>
        {radiusOptions.map(opt => {
          const isSelected = radius === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setRadius(opt.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition shadow-xs ${
                isSelected
                  ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-600/30'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Interactive Visual Map Card */}
      <div className="bg-gradient-to-br from-[#143728] via-[#1b4332] to-[#0f2d1e] rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="font-extrabold text-sm tracking-wide">Dynamic Haversine GPS Radar ({radius} km)</span>
          </div>
          <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
            {shops.length} Verified Stores Located
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {shops.slice(0, 4).map(shop => (
            <div
              key={shop.id}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 transition cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <span className="text-lg">🏪</span>
                <span className="text-[10px] font-black bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full shadow-xs">
                  📍 {shop.distanceKm} km
                </span>
              </div>
              <h4 className="font-extrabold text-xs text-white mt-2 truncate group-hover:text-amber-200 transition">
                {shop.name}
              </h4>
              <p className="text-[11px] text-emerald-200 mt-0.5 truncate">
                {shop.town || shop.district}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Shop Listing Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center text-gray-400 border border-gray-100">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
            <p className="text-sm font-semibold">Calculating dynamic road distances and verifying local dealers...</p>
          </div>
        ) : shops.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-gray-500 border border-gray-100 space-y-3">
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-xl">
              🏪
            </div>
            <h3 className="font-bold text-gray-900">No stores found within {radius} km</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Try expanding your search radius to 50 km or 100 km to view verified agricultural depots in neighboring taluks.
            </p>
            <button
              onClick={() => setRadius(100)}
              className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold shadow hover:bg-emerald-800 transition"
            >
              Expand to 100 km
            </button>
          </div>
        ) : (
          shops.map(shop => (
            <div
              key={shop.id}
              className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100 hover:border-emerald-300 transition space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3.5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-base text-gray-900">{shop.name}</h3>
                    {shop.isVerified && (
                      <span className="flex items-center gap-1 text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Vendor
                      </span>
                    )}
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {shop.town || shop.district}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{shop.address}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 text-amber-800 text-xs font-black">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>{shop.rating}</span>
                    <span className="text-gray-400 text-[10px]">({shop.reviews})</span>
                  </div>
                  <span className="text-xs font-black text-emerald-950 bg-emerald-100/80 border border-emerald-300/60 px-3 py-1.5 rounded-xl shadow-2xs">
                    📍 {shop.distanceKm} km away
                  </span>
                </div>
              </div>

              {/* Operating info & In stock tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Hours: <strong>{shop.openingHours}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Call: <strong>{shop.phone}</strong></span>
                </div>
              </div>

              {/* Featured Inputs Available */}
              <div>
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">
                  Inputs Currently Available in Stock ({shop.inStockCount || 30}+ items):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {shop.featuredInputs?.map((inp: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 bg-emerald-50/60 text-emerald-900 text-[11px] font-semibold rounded-lg border border-emerald-100">
                      ✓ {inp}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                <a
                  href={`tel:${shop.phone}`}
                  className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition flex-1 sm:flex-initial"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Dealer
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-emerald-200 transition flex-1 sm:flex-initial"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Get Directions
                </a>
                <button
                  onClick={() => setActiveTab('store')}
                  className="flex-1 py-2.5 px-5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-95"
                >
                  <ShoppingBag className="w-3.5 h-3.5" /> View Products & Book
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
