import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Calendar,
  CheckCircle2,
  Search,
  Filter,
  ArrowRight,
  Sprout,
  DollarSign,
  ClipboardCheck,
  Building2,
  Clock,
  Sparkles,
  Tag,
  Share2,
  UserCheck
} from 'lucide-react';
import { NearbyFarmerProfile } from './buyerMockData';
import { useLanguage } from '../../context/LanguageContext';

interface NearbyFarmersDirectoryProps {
  farmers: NearbyFarmerProfile[];
  onCallFarmer: (farmer: NearbyFarmerProfile) => void;
  onSendOfferToFarmer: (farmer: NearbyFarmerProfile) => void;
  onBookInspection: (farmer: NearbyFarmerProfile) => void;
}

export const NearbyFarmersDirectory: React.FC<NearbyFarmersDirectoryProps> = ({
  farmers,
  onCallFarmer,
  onSendOfferToFarmer,
  onBookInspection
}) => {
  const { t } = useLanguage();
  const [distanceFilter, setDistanceFilter] = useState<number>(0); // 0 = all
  const [cropFilter, setCropFilter] = useState<string>('ALL');
  const [timelineFilter, setTimelineFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract unique crop categories
  const cropCategories = ['ALL', 'Tomato', 'Groundnut', 'Chilli', 'Paddy', 'Maize', 'Onion', 'Carrot', 'Jasmine', 'Cotton'];

  const filteredFarmers = farmers.filter(farmer => {
    // Distance
    if (distanceFilter > 0 && farmer.distanceKm > distanceFilter) {
      return false;
    }
    // Crop
    if (cropFilter !== 'ALL') {
      const c = cropFilter.toLowerCase();
      const matchCrop = farmer.cropName.toLowerCase().includes(c) || farmer.variety.toLowerCase().includes(c);
      if (!matchCrop) return false;
    }
    // Timeline
    if (timelineFilter !== 'ALL' && farmer.harvestTimeline !== timelineFilter) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        farmer.farmerName.toLowerCase().includes(q) ||
        farmer.village.toLowerCase().includes(q) ||
        farmer.taluk.toLowerCase().includes(q) ||
        farmer.district.toLowerCase().includes(q) ||
        farmer.cropName.toLowerCase().includes(q) ||
        farmer.variety.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Directory Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-700" />
              <span>{t('Nearby Verified Cultivators')} ({filteredFarmers.length})</span>
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              Direct farm gate standing crops • 100% Verified Farmer Profiles (Zero Mandi APMC Noise)
            </p>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search farmer, village, or crop..."
              className="w-full pl-9 pr-3 py-2 rounded-2xl border border-gray-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50/50"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Filters Row */}
        <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-2">
          {/* Distance Filter */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-bold">
            <span className="text-[10px] text-gray-500 px-1 uppercase tracking-wider">Radius:</span>
            {[
              { val: 0, label: 'All Distances' },
              { val: 15, label: '≤ 15 km' },
              { val: 30, label: '≤ 30 km' },
              { val: 50, label: '≤ 50 km' }
            ].map(d => (
              <button
                key={d.val}
                type="button"
                onClick={() => setDistanceFilter(d.val)}
                className={`px-2.5 py-1 rounded-lg transition ${
                  distanceFilter === d.val
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Harvest Timeline Filter */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-bold">
            <span className="text-[10px] text-gray-500 px-1 uppercase tracking-wider">Harvest:</span>
            {[
              { val: 'ALL', label: 'All' },
              { val: 'READY_NOW', label: 'Ready Now 🟢' },
              { val: 'NEXT_7_DAYS', label: 'Next 7d 🟡' },
              { val: 'NEXT_15_DAYS', label: 'Next 15d 🗓️' }
            ].map(t => (
              <button
                key={t.val}
                type="button"
                onClick={() => setTimelineFilter(t.val)}
                className={`px-2.5 py-1 rounded-lg transition ${
                  timelineFilter === t.val
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Crop Pills Scrollable Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
          {cropCategories.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setCropFilter(c)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                cropFilter === c
                  ? 'bg-emerald-800 text-white shadow-xs font-black'
                  : 'bg-stone-100 text-gray-700 hover:bg-stone-200'
              }`}
            >
              {c === 'ALL' ? '🌾 All Commodities' : c}
            </button>
          ))}
        </div>
      </div>

      {/* Farmers Grid */}
      {filteredFarmers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mx-auto text-xl font-bold">
            🌾
          </div>
          <h4 className="text-sm font-extrabold text-gray-800">No matching cultivators in this range</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Try expanding your distance radius or selecting "All Commodities" to see more verified farmers in Rayalaseema.
          </p>
          <button
            onClick={() => {
              setDistanceFilter(0);
              setCropFilter('ALL');
              setTimelineFilter('ALL');
              setSearchQuery('');
            }}
            className="mt-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFarmers.map(farmer => (
            <div
              key={farmer.id}
              className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200/90 hover:border-emerald-300 hover:shadow-md transition flex flex-col justify-between relative group"
            >
              {/* Card Top: Farmer identity & location */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 border-2 border-emerald-200 overflow-hidden shrink-0 flex items-center justify-center font-black text-emerald-900 text-base shadow-xs">
                      {farmer.avatarUrl ? (
                        <img src={farmer.avatarUrl} alt={farmer.farmerName} className="w-full h-full object-cover" />
                      ) : (
                        farmer.farmerName.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-black text-gray-900 leading-tight">
                          {farmer.farmerName}
                        </h4>
                        {farmer.isVerified && (
                          <span
                            title="Verified Land Registry Record"
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300"
                          >
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-gray-500 font-semibold mt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                        <span>
                          {farmer.village}, {farmer.taluk}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Distance Badge */}
                  <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-stone-100 text-stone-700 shrink-0 border border-stone-200/70">
                    📍 {farmer.distanceKm} km
                  </span>
                </div>

                {/* Standing Crop Detail Box */}
                <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-emerald-800 font-black block">
                        Standing Harvest:
                      </span>
                      <span className="text-sm font-black text-emerald-950 block">
                        {farmer.cropName}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-white text-emerald-900 border border-emerald-200">
                      {farmer.qualityGrade}
                    </span>
                  </div>

                  <p className="text-[11px] text-emerald-800 font-semibold italic">
                    Variety: {farmer.variety}
                  </p>

                  <div className="pt-2 border-t border-emerald-200/60 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-gray-500 block">{t('Cultivated Land:')}</span>
                      <strong className="text-gray-900 font-black">{farmer.totalAcreage} {t('acres') || 'Acres'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">{t('Available Quantity:')}</span>
                      <strong className="text-gray-900 font-black">
                        {farmer.estimatedQuantity} {farmer.unit}
                      </strong>
                    </div>
                  </div>

                  {/* Expected Rate */}
                  <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                    <span className="text-gray-500">{t('Expected Rate:')}</span>
                    {farmer.expectedPrice ? (
                      <span className="text-sm font-black text-emerald-900">
                        ₹{farmer.expectedPrice.toLocaleString('en-IN')} <span className="text-[10px] font-normal text-gray-500">/{farmer.priceUnit}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900">
                        {t('Open to Negotiate')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Harvest Timeline Badge */}
                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[11px] text-gray-600 font-semibold">
                      {t('Harvest Ready')}:
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    farmer.harvestTimeline === 'READY_NOW'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : farmer.harvestTimeline === 'NEXT_7_DAYS'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-blue-100 text-blue-800 border border-blue-300'
                  }`}>
                    {farmer.harvestTimeline === 'READY_NOW'
                      ? `● ${t('Ready Now')}`
                      : farmer.harvestTimeline === 'NEXT_7_DAYS'
                      ? `🗓️ ${t('Next 7 Days')}`
                      : `🗓️ ${t('Next 15 Days')}`}
                  </span>
                </div>

                {farmer.notes && (
                  <p className="text-[11px] text-gray-500 mt-2 line-clamp-2 italic">
                    "{farmer.notes}"
                  </p>
                )}
              </div>

              {/* Action Buttons: Call, Send Offer, Book Inspection */}
              <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {/* Call Farmer */}
                  <button
                    onClick={() => onCallFarmer(farmer)}
                    className="py-2 px-3 rounded-xl border border-gray-300 hover:bg-stone-50 font-black text-[11px] text-gray-700 flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{t('Call Farmer')}</span>
                  </button>

                  {/* Book Inspection */}
                  <button
                    onClick={() => onBookInspection(farmer)}
                    className="py-2 px-3 rounded-xl border border-emerald-600/40 bg-emerald-50/50 hover:bg-emerald-100 font-black text-[11px] text-emerald-900 flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5 text-emerald-800" />
                    <span>{t('Book Farm Inspection')}</span>
                  </button>
                </div>

                {/* Primary: Send Purchase Offer */}
                <button
                  onClick={() => onSendOfferToFarmer(farmer)}
                  className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>{t('Send Direct Offer')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
