import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  TrendingUp,
  Package,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  Truck,
  Plus,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Building2,
  X,
  Phone,
  AlertCircle,
  Loader2,
  Tag,
  DollarSign,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';

interface BuyerPortalProps {
  setActiveTab?: (tab: string) => void;
}

export const BuyerPortal: React.FC<BuyerPortalProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTabLocal] = useState<'LOTS' | 'MY_BIDS' | 'MANDI_RATES' | 'LOGISTICS'>('LOTS');
  const [listings, setListings] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<{ incoming: any[]; outgoing: any[] }>({ incoming: [], outgoing: [] });
  const [mandiPrices, setMandiPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states for Lots
  const [cropFilter, setCropFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Bid Modal
  const [selectedLotForBid, setSelectedLotForBid] = useState<any | null>(null);
  const [bidPrice, setBidPrice] = useState('');
  const [bidQty, setBidQty] = useState('');
  const [bidNotes, setBidNotes] = useState('');
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);

  // Logistics state
  const [logisticsTrucks, setLogisticsTrucks] = useState([
    {
      id: 'trk-101',
      driver: 'K. Narayana (Tata 407 - AP 04 W 3211)',
      route: 'Kadiri Mandi Yard → Bengaluru KR Market',
      commodity: 'Groundnut Pods (35 Qtl)',
      status: 'IN_TRANSIT',
      eta: 'Today, 4:30 PM',
      contact: '+91 94401 23456'
    },
    {
      id: 'trk-102',
      driver: 'M. Chennaiah (Mahindra Bolero Maxi - AP 02 TX 9811)',
      route: 'Anantapur Yard → Guntur Mirchi Yard',
      commodity: 'Dry Red Chilli Teja S17 (18 Qtl)',
      status: 'LOADING',
      eta: 'Tomorrow, 9:00 AM',
      contact: '+91 98480 87654'
    }
  ]);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadBuyerData = async () => {
    try {
      const [lRes, rRes, pRes] = await Promise.all([
        fetch('/api/produce'),
        fetch('/api/produce/my-requests', {
          headers: { Authorization: `Bearer ${localStorage.getItem('agri_token')}` }
        }),
        fetch('/api/prices')
      ]);

      if (lRes.ok) setListings(await lRes.json());
      if (rRes.ok) setMyRequests(await rRes.json());
      if (pRes.ok) setMandiPrices(await pRes.json());
    } catch (err) {
      console.error('Failed to load buyer portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBuyerData();
  }, []);

  const openBidModal = (lot: any) => {
    setSelectedLotForBid(lot);
    setBidPrice(lot.expectedPrice ? lot.expectedPrice.toString() : '');
    setBidQty(lot.quantity ? lot.quantity.toString() : '');
    setBidNotes('Immediate cash settlement upon weighment at Mandi Gate.');
    setBidError(null);
  };

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLotForBid) return;

    const price = parseFloat(bidPrice);
    const qty = parseFloat(bidQty);

    if (isNaN(price) || price <= 0) {
      setBidError('Please enter a valid purchase offer price.');
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      setBidError('Please enter a valid purchase quantity.');
      return;
    }

    setIsSubmittingBid(true);
    setBidError(null);

    try {
      const res = await fetch(`/api/produce/${selectedLotForBid.id}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('agri_token')}`
        },
        body: JSON.stringify({
          offeredPrice: price,
          quantityRequested: qty,
          message: bidNotes
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to submit buyer purchase offer.');
      }

      showToast(`Purchase offer of ₹${price} for ${selectedLotForBid.cropName} submitted to farmer!`);
      setSelectedLotForBid(null);
      await loadBuyerData();
    } catch (err: any) {
      setBidError(err.message || 'Error submitting bid');
    } finally {
      setIsSubmittingBid(false);
    }
  };

  // Filtered crop harvest lots
  const filteredLots = listings.filter(lot => {
    if (cropFilter !== 'ALL' && lot.cropName?.toLowerCase() !== cropFilter.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        lot.cropName?.toLowerCase().includes(q) ||
        lot.variety?.toLowerCase().includes(q) ||
        lot.district?.toLowerCase().includes(q) ||
        lot.farmerName?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold transition-all animate-in slide-in-from-top-2 duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-800 text-white border border-emerald-600'
              : 'bg-red-800 text-white border border-red-600'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-800 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-amber-300">
              <Building2 className="w-3.5 h-3.5" />
              <span>Wholesale APMC Produce & Flower Trading Desk</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              📦 Mandi Buyer & Procurement Portal
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed">
              Source verified farm harvests directly from cultivators across Andhra Pradesh, Telangana & Karnataka with zero middleman margin.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 text-right">
              <span className="text-[11px] text-emerald-200 block font-semibold">Active Buyer Account</span>
              <span className="text-sm font-black text-white">{user?.name || 'Kisan Mandi Wholesalers'}</span>
              <span className="text-[10px] text-amber-300 block">Verified APMC License #AP-KDR-8812</span>
            </div>
          </div>
        </div>

        {/* Procurement KPI Summary */}
        <div className="mt-6 pt-5 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <span className="text-xs text-emerald-200 block font-medium">Available Farmer Lots</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5">{listings.length} Lots</div>
            <span className="text-[10px] text-emerald-300">Groundnut, Tomato, Flowers</span>
          </div>

          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <span className="text-xs text-emerald-200 block font-medium">My Bids & Orders</span>
            <div className="text-xl sm:text-2xl font-black text-amber-300 mt-0.5">
              {myRequests.outgoing.length} Submitted
            </div>
            <span className="text-[10px] text-amber-200">Active negotiations</span>
          </div>

          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <span className="text-xs text-emerald-200 block font-medium">Active Mandi Dispatches</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5">
              {logisticsTrucks.length} Trucks
            </div>
            <span className="text-[10px] text-emerald-300">Kadiri & Bengaluru yards</span>
          </div>

          <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
            <span className="text-xs text-emerald-200 block font-medium">Tracked Mandi Commodities</span>
            <div className="text-xl sm:text-2xl font-black text-pink-300 mt-0.5">
              {mandiPrices.length} Items
            </div>
            <span className="text-[10px] text-pink-200">Including 9 Flower yards</span>
          </div>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl text-xs font-bold max-w-2xl overflow-x-auto">
        <button
          onClick={() => setActiveTabLocal('LOTS')}
          className={`flex-1 py-2.5 px-3 rounded-xl transition whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeTab === 'LOTS' ? 'bg-white text-emerald-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Farmer Harvest Lots ({listings.length})</span>
        </button>

        <button
          onClick={() => setActiveTabLocal('MY_BIDS')}
          className={`flex-1 py-2.5 px-3 rounded-xl transition whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeTab === 'MY_BIDS' ? 'bg-white text-emerald-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>My Purchase Offers ({myRequests.outgoing.length})</span>
        </button>

        <button
          onClick={() => setActiveTabLocal('LOGISTICS')}
          className={`flex-1 py-2.5 px-3 rounded-xl transition whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeTab === 'LOGISTICS' ? 'bg-white text-emerald-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Mandi Logistics ({logisticsTrucks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab && setActiveTab('prices')}
          className="flex-1 py-2.5 px-3 rounded-xl transition whitespace-nowrap text-pink-700 hover:bg-pink-100/50 flex items-center justify-center gap-1.5"
        >
          <span>🌸</span>
          <span>All-India Mandi Ticker →</span>
        </button>
      </div>

      {/* 1. FARMER HARVEST LOTS TAB */}
      {activeTab === 'LOTS' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {['ALL', 'Groundnut', 'Tomato', 'Dry Red Chilli', 'Cotton', 'Jasmine'].map(c => (
                <button
                  key={c}
                  onClick={() => setCropFilter(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    cropFilter === c
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-stone-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {c === 'ALL' ? 'All Harvests' : c}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search lot, variety, district..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Lots Grid */}
          {loading ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-gray-100">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
              <p className="text-xs text-gray-500 mt-2 font-medium">Fetching verified farmer harvests...</p>
            </div>
          ) : filteredLots.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 text-gray-500 text-xs">
              No harvest lots match your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLots.map(lot => (
                <div
                  key={lot.id}
                  className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:border-emerald-200 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-200">
                        {lot.qualityGrade?.replace('_', ' ') || 'GRADE A'}
                      </span>
                      <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        {lot.district}, {lot.state}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-gray-900 leading-snug">{lot.cropName}</h3>
                    <p className="text-xs text-gray-500 font-medium">{lot.variety}</p>

                    <div className="mt-3 bg-stone-50 p-3 rounded-2xl border border-stone-200/70 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Available Quantity:</span>
                        <span className="font-bold text-gray-900">
                          {lot.quantity} {lot.unit}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Farmer Asking Price:</span>
                        <span className="font-black text-emerald-800 text-sm">
                          ₹{lot.expectedPrice?.toLocaleString('en-IN')} /{lot.unit}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Cultivator:</span>
                        <span className="font-medium text-gray-700">{lot.farmerName}</span>
                      </div>
                    </div>

                    {lot.description && (
                      <p className="text-[11px] text-gray-500 mt-2 line-clamp-2 italic">
                        "{lot.description}"
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-gray-400">Harvest: {lot.harvestDate}</span>
                    <button
                      onClick={() => openBidModal(lot)}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Make Purchase Offer</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. MY PURCHASE OFFERS TAB */}
      {activeTab === 'MY_BIDS' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-gray-900">
              Procurement Offers Submitted to Cultivators
            </h3>
            <span className="text-xs text-gray-500 font-medium">
              Real-time response tracking from farmers
            </span>
          </div>

          {myRequests.outgoing.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs">
              You haven't submitted any purchase offers yet. Browse farmer lots above to make an offer!
            </div>
          ) : (
            <div className="space-y-3">
              {myRequests.outgoing.map(bid => (
                <div
                  key={bid.id}
                  className="p-4 rounded-2xl border border-gray-200 bg-stone-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-gray-900">{bid.cropName}</h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        bid.status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : bid.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {bid.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Farmer: <span className="font-bold text-gray-700">{bid.farmerName}</span> • Submitted: {bid.createdAt?.split('T')[0]}
                    </p>
                    {bid.message && (
                      <p className="text-[11px] text-gray-600 italic">"{bid.message}"</p>
                    )}
                  </div>

                  <div className="text-right sm:text-right">
                    <span className="text-[10px] text-gray-400 block font-semibold">Your Bid Rate</span>
                    <span className="text-lg font-black text-emerald-900">
                      ₹{bid.offeredPrice?.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-gray-500 block">
                      Quantity: {bid.quantityRequested} Qtl
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. LOGISTICS DISPATCH TAB */}
      {activeTab === 'LOGISTICS' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-gray-900">Mandi Transport & Fleet Telematics</h3>
              <p className="text-xs text-gray-500">Coordinate truck pickup from farm gate to APMC godown</p>
            </div>
            <button
              onClick={() => showToast('New transport dispatch booked for Kadiri Yard!')}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              + Book Transport Truck
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {logisticsTrucks.map(trk => (
              <div key={trk.id} className="p-4 rounded-2xl border border-gray-200 bg-stone-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    {trk.driver}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800">
                    {trk.status}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-gray-600">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Route:</span>
                    <span className="font-bold text-gray-800">{trk.route}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payload:</span>
                    <span className="font-bold text-emerald-900">{trk.commodity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">ETA at Mandi:</span>
                    <span className="font-bold text-gray-800">{trk.eta}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-xs">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    {trk.contact}
                  </span>
                  <button
                    onClick={() => showToast(`Calling driver ${trk.driver}...`)}
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    Call Driver
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT PURCHASE BID */}
      {selectedLotForBid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-black text-lg text-gray-900">Submit Purchase Offer</h3>
                <p className="text-xs text-gray-500">
                  Direct bid to farmer: {selectedLotForBid.farmerName}
                </p>
              </div>
              <button
                onClick={() => setSelectedLotForBid(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bidError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bidError}</span>
              </div>
            )}

            <form onSubmit={handleBidSubmit} className="space-y-3.5 text-xs">
              <div className="bg-stone-50 p-3 rounded-xl space-y-1">
                <span className="font-bold text-gray-700 block">{selectedLotForBid.cropName}</span>
                <span className="text-gray-500 block">
                  Lot: {selectedLotForBid.quantity} {selectedLotForBid.unit} • Asking Price: ₹{selectedLotForBid.expectedPrice}
                </span>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Your Offered Price (₹ / {selectedLotForBid.unit}) *</label>
                <input
                  type="number"
                  value={bidPrice}
                  onChange={e => setBidPrice(e.target.value)}
                  placeholder="e.g. 7200"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 font-bold text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Quantity Desired ({selectedLotForBid.unit}) *</label>
                <input
                  type="number"
                  value={bidQty}
                  onChange={e => setBidQty(e.target.value)}
                  placeholder="e.g. 30"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 font-bold text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Payment & Mandi Terms</label>
                <textarea
                  value={bidNotes}
                  onChange={e => setBidNotes(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLotForBid(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBid}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingBid && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Offer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
