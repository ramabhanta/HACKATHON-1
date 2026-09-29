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
  Sparkles,
  Users,
  ClipboardCheck,
  Share2,
  Check
} from 'lucide-react';
import { apiUrl } from '../../services/api';
import {
  PurchaseOffer,
  NearbyFarmerProfile,
  FarmInspectionBooking,
  INITIAL_PURCHASE_OFFERS,
  INITIAL_NEARBY_FARMERS
} from './buyerMockData';
import { CreatePurchaseOfferModal } from './CreatePurchaseOfferModal';
import { NearbyFarmersDirectory } from './NearbyFarmersDirectory';
import { BookInspectionModal } from './BookInspectionModal';

interface BuyerPortalProps {
  setActiveTab?: (tab: string) => void;
}

export const BuyerPortal: React.FC<BuyerPortalProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Active Tab: OFFERS (Buyer demands) | FARMERS (Nearby directory) | LOTS (Harvest lots) | MY_BIDS | LOGISTICS
  const [activeTab, setActiveTabLocal] = useState<'OFFERS' | 'FARMERS' | 'LOTS' | 'MY_BIDS' | 'LOGISTICS'>('OFFERS');

  // Primary Data Collections
  const [purchaseOffers, setPurchaseOffers] = useState<PurchaseOffer[]>(() => {
    try {
      const saved = localStorage.getItem('agri_purchase_offers');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_PURCHASE_OFFERS;
  });

  const [nearbyFarmers, setNearbyFarmers] = useState<NearbyFarmerProfile[]>(() => {
    try {
      const saved = localStorage.getItem('agri_nearby_farmers');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_NEARBY_FARMERS;
  });

  const [farmInspections, setFarmInspections] = useState<FarmInspectionBooking[]>(() => {
    try {
      const saved = localStorage.getItem('agri_inspections');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'insp-sample-1',
        farmerId: 'usr-farmer-1',
        farmerName: 'Ramesh Patel',
        village: 'Kadiri Rural',
        cropName: 'Groundnut (Pod)',
        acreage: 6.0,
        inspectionDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        timeSlot: '07:30 AM - 10:30 AM',
        inspectorName: 'Suresh (Kadiri Mandi Sourcing)',
        inspectorPhone: '+91 94400 98765',
        notes: 'Pre-harvest moisture testing and kernel weight sampling.',
        status: 'SCHEDULED',
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [listings, setListings] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<{ incoming: any[]; outgoing: any[] }>({ incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(false);

  // Filter states for Lots
  const [cropFilter, setCropFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showCreateOfferModal, setShowCreateOfferModal] = useState(false);
  const [selectedFarmerForInspection, setSelectedFarmerForInspection] = useState<NearbyFarmerProfile | null>(null);
  const [selectedFarmerForDirectBid, setSelectedFarmerForDirectBid] = useState<NearbyFarmerProfile | null>(null);
  const [callingFarmer, setCallingFarmer] = useState<NearbyFarmerProfile | null>(null);
  const [selectedOfferForMatchmaking, setSelectedOfferForMatchmaking] = useState<PurchaseOffer | null>(null);

  // Direct Bid on Farmer Modal
  const [directBidPrice, setDirectBidPrice] = useState('');
  const [directBidQty, setDirectBidQty] = useState('');
  const [directBidNotes, setDirectBidNotes] = useState('Direct procurement offer. Spot cash payment upon weighment.');
  const [isSubmittingDirectBid, setIsSubmittingDirectBid] = useState(false);

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
    setTimeout(() => setToast(null), 4500);
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('agri_purchase_offers', JSON.stringify(purchaseOffers));
    } catch {}
  }, [purchaseOffers]);

  useEffect(() => {
    try {
      localStorage.setItem('agri_inspections', JSON.stringify(farmInspections));
    } catch {}
  }, [farmInspections]);

  // Load Remote Data
  const loadBuyerData = async () => {
    try {
      const [lRes, rRes, poRes, nfRes] = await Promise.all([
        fetch(apiUrl('/api/produce')),
        fetch(apiUrl('/api/produce/my-requests'), {
          headers: { Authorization: `Bearer ${localStorage.getItem('agri_token')}` }
        }),
        fetch(apiUrl('/api/produce/purchase-offers')),
        fetch(apiUrl('/api/produce/nearby-farmers'))
      ]);

      if (lRes.ok) setListings(await lRes.json());
      if (rRes.ok) setMyRequests(await rRes.json());
      if (poRes.ok) {
        const remoteOffers = await poRes.json();
        if (Array.isArray(remoteOffers) && remoteOffers.length > 0) {
          setPurchaseOffers(remoteOffers);
        }
      }
      if (nfRes.ok) {
        const remoteFarmers = await nfRes.json();
        if (Array.isArray(remoteFarmers) && remoteFarmers.length > 0) {
          setNearbyFarmers(remoteFarmers);
        }
      }
    } catch (err) {
      console.warn('⚡ [BuyerPortal] Local storage active, remote endpoint sync delayed:', err);
    }
  };

  useEffect(() => {
    loadBuyerData();
  }, []);

  // 1. Create Purchase Offer Handler
  const handleCreatePurchaseOffer = async (newOfferData: Partial<PurchaseOffer>) => {
    // Count matching farmers
    const cleanCrop = (newOfferData.cropName || '').toLowerCase().trim();
    const matchedCount = nearbyFarmers.filter(f =>
      f.cropName.toLowerCase().includes(cleanCrop) || cleanCrop.includes(f.cropName.toLowerCase())
    ).length;

    const newOffer: PurchaseOffer = {
      id: `po-${Date.now().toString(36)}`,
      buyerId: user?.id || 'usr-buyer-1',
      buyerName: user?.name || 'Kisan Mandi Wholesalers',
      buyerBusinessName: `${user?.name || 'Kisan Mandi'} Wholesale Procure Hub`,
      buyerPhone: user?.phone || '+91 94400 98765',
      cropName: newOfferData.cropName || 'Produce',
      variety: newOfferData.variety || 'Standard',
      qualityGrade: newOfferData.qualityGrade || 'Grade A',
      requiredQuantity: newOfferData.requiredQuantity || 100,
      unit: newOfferData.unit || 'QUINTAL',
      targetPrice: newOfferData.targetPrice || 5000,
      priceUnit: newOfferData.priceUnit || 'per Quintal',
      procurementCenter: newOfferData.procurementCenter || 'Kadiri APMC Yard',
      district: newOfferData.district || 'Sri Sathya Sai',
      state: newOfferData.state || 'Andhra Pradesh',
      validUntil: newOfferData.validUntil || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      specialRequirements: newOfferData.specialRequirements || '',
      status: 'ACTIVE',
      matchedFarmersCount: matchedCount,
      createdAt: new Date().toISOString()
    };

    // Prepend to top of state
    setPurchaseOffers(prev => [newOffer, ...prev]);

    // Async sync to backend
    try {
      await fetch(apiUrl('/api/produce/purchase-offers'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('agri_token')}`
        },
        body: JSON.stringify(newOffer)
      });
    } catch {}

    showToast(`Purchase offer for ${newOffer.cropName} (${newOffer.requiredQuantity} ${newOffer.unit}) published! ${matchedCount} matching nearby cultivators detected. ⚡`);
  };

  // Close an active offer
  const handleCloseOffer = async (offerId: string) => {
    setPurchaseOffers(prev =>
      prev.map(o => (o.id === offerId ? { ...o, status: 'CLOSED', updatedAt: new Date().toISOString() } : o))
    );
    showToast('Purchase offer closed and archived.');
    try {
      await fetch(apiUrl(`/api/produce/purchase-offers/${offerId}/close`), { method: 'PATCH' });
    } catch {}
  };

  // 2. Broadcast / Matchmaking Action
  const handleBroadcastOffer = async (offer: PurchaseOffer) => {
    const cleanCrop = offer.cropName.toLowerCase().trim();
    const matching = nearbyFarmers.filter(f =>
      f.cropName.toLowerCase().includes(cleanCrop) || cleanCrop.includes(f.cropName.toLowerCase())
    );

    if (matching.length === 0) {
      showToast(`No cultivators currently found matching ${offer.cropName} in your radius. Try broadening search.`, 'error');
      return;
    }

    try {
      await fetch(apiUrl(`/api/produce/purchase-offers/${offer.id}/match-broadcast`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmerIds: matching.map(f => f.farmerId) })
      });
    } catch {}

    showToast(`⚡ Instant Broadcast Sent! Direct procurement demand dispatched to ${matching.length} verified ${offer.cropName} farmers!`);
    setSelectedOfferForMatchmaking(null);
  };

  // 3. Confirm Farm Inspection
  const handleConfirmInspection = (booking: FarmInspectionBooking) => {
    setFarmInspections(prev => [booking, ...prev]);
    showToast(`Farm inspection scheduled with ${booking.farmerName} for ${booking.inspectionDate} (${booking.timeSlot})! 📋`);
  };

  // 4. Submit Direct Purchase Offer to Farmer
  const handleDirectBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmerForDirectBid) return;

    const price = parseFloat(directBidPrice);
    const qty = parseFloat(directBidQty);

    if (isNaN(price) || price <= 0 || isNaN(qty) || qty <= 0) {
      showToast('Please enter valid numeric price and quantity.', 'error');
      return;
    }

    setIsSubmittingDirectBid(true);

    const newBidItem = {
      id: `bid-${Math.random().toString(36).substring(2, 9)}`,
      cropName: selectedFarmerForDirectBid.cropName,
      farmerName: selectedFarmerForDirectBid.farmerName,
      farmerPhone: selectedFarmerForDirectBid.phone,
      offeredPrice: price,
      quantityRequested: qty,
      status: 'SUBMITTED',
      message: directBidNotes,
      createdAt: new Date().toISOString()
    };

    setMyRequests(prev => ({
      ...prev,
      outgoing: [newBidItem, ...prev.outgoing]
    }));

    showToast(`Purchase offer of ₹${price}/${selectedFarmerForDirectBid.priceUnit} sent to ${selectedFarmerForDirectBid.farmerName}! 📩`);
    setIsSubmittingDirectBid(false);
    setSelectedFarmerForDirectBid(null);
  };

  // Filtered harvest lots
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
    <div className="space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold transition-all animate-in slide-in-from-top-2 duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-800 text-white border border-emerald-600'
              : 'bg-red-800 text-white border border-red-600'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Floating Action Button on Mobile */}
      <div className="fixed bottom-20 right-4 z-40 md:hidden">
        <button
          onClick={() => setShowCreateOfferModal(true)}
          className="flex items-center gap-2 px-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-full shadow-2xl border-2 border-white/50 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Offer</span>
        </button>
      </div>

      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-emerald-900 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-amber-300">
              <Building2 className="w-3.5 h-3.5" />
              <span>Verified APMC Institutional Procurement Desk</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              📦 Buyer & Procurement Hub
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed">
              Post dynamic purchase demands across any agricultural crop, source directly from verified nearby cultivators, and dispatch transport fleets.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 text-left sm:text-right">
              <span className="text-[11px] text-emerald-200 block font-semibold">Active Buyer Account</span>
              <span className="text-sm font-black text-white">{user?.name || 'Kisan Mandi Wholesalers'}</span>
              <span className="text-[10px] text-amber-300 block font-bold">APMC Kadiri Reg #AP-WHL-8821</span>
            </div>

            {/* Prominent Header Action Button */}
            <button
              onClick={() => setShowCreateOfferModal(true)}
              className="px-5 py-3.5 bg-amber-400 hover:bg-amber-300 text-teal-950 font-black text-xs rounded-2xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 shrink-0 border border-amber-300"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Purchase Offer</span>
            </button>
          </div>
        </div>

        {/* Procurement KPI Summary */}
        <div className="mt-6 pt-5 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            onClick={() => setActiveTabLocal('OFFERS')}
            className="bg-white/10 hover:bg-white/15 cursor-pointer transition rounded-2xl p-3 border border-white/10"
          >
            <span className="text-xs text-emerald-200 block font-medium">My Active Demands</span>
            <div className="text-xl sm:text-2xl font-black text-amber-300 mt-0.5">
              {purchaseOffers.filter(o => o.status === 'ACTIVE').length} Offers
            </div>
            <span className="text-[10px] text-emerald-300">Live / Accepting Bids</span>
          </div>

          <div
            onClick={() => setActiveTabLocal('FARMERS')}
            className="bg-white/10 hover:bg-white/15 cursor-pointer transition rounded-2xl p-3 border border-white/10"
          >
            <span className="text-xs text-emerald-200 block font-medium">Nearby Cultivators</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5">
              {nearbyFarmers.length} Farmers
            </div>
            <span className="text-[10px] text-emerald-300">Within 50 km Radius</span>
          </div>

          <div
            onClick={() => setActiveTabLocal('MY_BIDS')}
            className="bg-white/10 hover:bg-white/15 cursor-pointer transition rounded-2xl p-3 border border-white/10"
          >
            <span className="text-xs text-emerald-200 block font-medium">Bids & Inspections</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5">
              {myRequests.outgoing.length + farmInspections.length} Active
            </div>
            <span className="text-[10px] text-amber-200">{farmInspections.length} Farm Visits</span>
          </div>

          <div
            onClick={() => setActiveTabLocal('LOGISTICS')}
            className="bg-white/10 hover:bg-white/15 cursor-pointer transition rounded-2xl p-3 border border-white/10"
          >
            <span className="text-xs text-emerald-200 block font-medium">Transport Fleet</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5">
              {logisticsTrucks.length} Trucks
            </div>
            <span className="text-[10px] text-emerald-300">Kadiri & Bengaluru Routes</span>
          </div>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex bg-stone-100 p-1.5 rounded-2xl text-xs font-bold max-w-4xl overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTabLocal('OFFERS')}
          className={`py-2.5 px-4 rounded-xl transition whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeTab === 'OFFERS' ? 'bg-white text-emerald-950 shadow-sm font-black' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Tag className="w-3.5 h-3.5 text-emerald-700" />
          <span>My Purchase Demands ({purchaseOffers.length})</span>
        </button>

        <button
          onClick={() => setActiveTabLocal('FARMERS')}
          className={`py-2.5 px-4 rounded-xl transition whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeTab === 'FARMERS' ? 'bg-white text-emerald-950 shadow-sm font-black' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-emerald-700" />
          <span>Nearby Farmers Directory ({nearbyFarmers.length})</span>
        </button>

        <button
          onClick={() => setActiveTabLocal('LOTS')}
          className={`py-2.5 px-4 rounded-xl transition whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeTab === 'LOTS' ? 'bg-white text-emerald-950 shadow-sm font-black' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Package className="w-3.5 h-3.5 text-emerald-700" />
          <span>Available Harvest Lots ({listings.length})</span>
        </button>

        <button
          onClick={() => setActiveTabLocal('MY_BIDS')}
          className={`py-2.5 px-4 rounded-xl transition whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeTab === 'MY_BIDS' ? 'bg-white text-emerald-950 shadow-sm font-black' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ClipboardCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>Bids & Inspections ({myRequests.outgoing.length + farmInspections.length})</span>
        </button>

        <button
          onClick={() => setActiveTabLocal('LOGISTICS')}
          className={`py-2.5 px-4 rounded-xl transition whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeTab === 'LOGISTICS' ? 'bg-white text-emerald-950 shadow-sm font-black' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Truck className="w-3.5 h-3.5 text-emerald-700" />
          <span>Logistics ({logisticsTrucks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab && setActiveTab('prices')}
          className="py-2.5 px-4 rounded-xl transition whitespace-nowrap text-pink-700 hover:bg-pink-100/60 flex items-center justify-center gap-1 font-bold ml-auto"
        >
          <span>🌸</span>
          <span>APMC Mandi Rates →</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. DYNAMIC BUYER PURCHASE DEMANDS / OFFERS TAB          */}
      {/* ======================================================== */}
      {activeTab === 'OFFERS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-gray-200/90 shadow-xs">
            <div>
              <h3 className="text-base font-black text-gray-900">
                Active Procurement Offers ({purchaseOffers.length})
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Live buyer demands broadcasted to local farmers for direct gate procurement.
              </p>
            </div>

            <button
              onClick={() => setShowCreateOfferModal(true)}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Post New Purchase Demand</span>
            </button>
          </div>

          {/* Offers List */}
          {purchaseOffers.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto text-xl font-bold">
                📦
              </div>
              <h4 className="text-sm font-extrabold text-gray-800">No purchase demands created yet</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Click "+ Post New Purchase Demand" to broadcast your crop requirements (Paddy, Tomato, Chilli, Cotton, etc.) to cultivators.
              </p>
              <button
                onClick={() => setShowCreateOfferModal(true)}
                className="px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl"
              >
                Create Your First Demand
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {purchaseOffers.map(offer => {
                const cleanCrop = offer.cropName.toLowerCase();
                const matchedFarmers = nearbyFarmers.filter(f =>
                  f.cropName.toLowerCase().includes(cleanCrop) || cleanCrop.includes(f.cropName.toLowerCase())
                );

                return (
                  <div
                    key={offer.id}
                    className={`bg-white rounded-3xl p-5 shadow-xs border transition flex flex-col justify-between ${
                      offer.status === 'ACTIVE'
                        ? 'border-emerald-200/90 hover:border-emerald-400'
                        : 'border-gray-200 bg-stone-50/50 opacity-80'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              offer.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-stone-200 text-stone-700'
                            }`}
                          >
                            {offer.status === 'ACTIVE' ? '● Live / Accepting Bids' : 'Archived / Closed'}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400">
                            {offer.qualityGrade}
                          </span>
                        </div>

                        <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-700" />
                          Valid till {offer.validUntil}
                        </span>
                      </div>

                      {/* Commodity Name & Target Price */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-lg font-black text-gray-900 leading-tight">
                            {offer.cropName}
                          </h4>
                          <p className="text-xs text-gray-500 font-semibold mt-0.5">
                            Variety: {offer.variety || 'Standard Quality'}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">
                            Target Offer
                          </span>
                          <span className="text-lg font-black text-emerald-900">
                            ₹{offer.targetPrice?.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-gray-500 block font-semibold">
                            {offer.priceUnit}
                          </span>
                        </div>
                      </div>

                      {/* Quantity & Procurement Details */}
                      <div className="mt-3 bg-stone-50 p-3 rounded-2xl border border-stone-200/70 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Required Volume:</span>
                          <span className="font-extrabold text-gray-900">
                            {offer.requiredQuantity} {offer.unit}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Procurement Center:</span>
                          <span className="font-bold text-gray-800 text-right truncate max-w-[200px]">
                            {offer.procurementCenter}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Total Purchase Value:</span>
                          <span className="font-black text-emerald-900">
                            ₹{((offer.requiredQuantity || 0) * (offer.targetPrice || 0)).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {offer.specialRequirements && (
                        <p className="text-[11px] text-gray-600 mt-2 line-clamp-2 italic bg-emerald-50/40 p-2 rounded-xl border border-emerald-100">
                          "{offer.specialRequirements}"
                        </p>
                      )}
                    </div>

                    {/* Footer Actions & Matchmaking Engine */}
                    <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                      {/* One-Click Matchmaking Trigger */}
                      {offer.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleBroadcastOffer(offer)}
                          className="w-full py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
                          <span>
                            ⚡ Send Direct Offer to Matching Cultivators ({matchedFarmers.length} Farmers in Radius)
                          </span>
                        </button>
                      )}

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-[11px] text-gray-400 font-medium">
                          Created {offer.createdAt?.split('T')[0]}
                        </span>

                        <div className="flex items-center gap-2">
                          {offer.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleCloseOffer(offer.id)}
                              className="px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-50 rounded-lg transition"
                            >
                              Close Offer
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setActiveTabLocal('FARMERS');
                              setCropFilter(offer.cropName);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-50 rounded-lg transition"
                          >
                            View Matching Farmers →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. REAL NEARBY FARMERS DIRECTORY (DECOUPLED FROM MANDI)  */}
      {/* ======================================================== */}
      {activeTab === 'FARMERS' && (
        <NearbyFarmersDirectory
          farmers={nearbyFarmers}
          onCallFarmer={farmer => setCallingFarmer(farmer)}
          onSendOfferToFarmer={farmer => {
            setSelectedFarmerForDirectBid(farmer);
            setDirectBidPrice(farmer.expectedPrice ? farmer.expectedPrice.toString() : '');
            setDirectBidQty(farmer.estimatedQuantity ? farmer.estimatedQuantity.toString() : '');
          }}
          onBookInspection={farmer => setSelectedFarmerForInspection(farmer)}
        />
      )}

      {/* ======================================================== */}
      {/* 3. AVAILABLE HARVEST LOTS TAB                            */}
      {/* ======================================================== */}
      {activeTab === 'LOTS' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-3xl border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
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
                  {c === 'ALL' ? t('catAll') + ' ' + t('farmerLots') : c}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('searchLotsPlaceholder')}
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
              {t('noLotsFound')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLots.map(lot => (
                <div
                  key={lot.id}
                  className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100 hover:border-emerald-200 transition flex flex-col justify-between"
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
                        <span className="text-gray-500">{t('Quantity')}:</span>
                        <span className="font-bold text-gray-900">
                          {lot.quantity} {lot.unit}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t('expectedRate')}</span>
                        <span className="font-black text-emerald-800 text-sm">
                          ₹{lot.expectedPricePerUnit?.toLocaleString('en-IN') || lot.expectedPrice?.toLocaleString('en-IN')} /{lot.unit}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t('verifiedFarmer')}</span>
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
                    <span className="text-[10px] text-gray-400">{t('harvestDate')} {lot.harvestDate}</span>
                    <button
                      onClick={() => {
                        setSelectedFarmerForDirectBid({
                          id: lot.id,
                          farmerId: lot.farmerId,
                          farmerName: lot.farmerName,
                          phone: lot.farmerPhone || '+91 98480 12345',
                          village: lot.village || 'Kadiri',
                          taluk: 'Kadiri',
                          district: lot.district || 'Sri Sathya Sai',
                          state: lot.state || 'Andhra Pradesh',
                          distanceKm: 8.5,
                          isVerified: true,
                          totalAcreage: 5.0,
                          cropName: lot.cropName,
                          variety: lot.variety,
                          estimatedQuantity: lot.quantity,
                          unit: lot.unit,
                          harvestTimeline: 'READY_NOW',
                          expectedPrice: lot.expectedPricePerUnit || lot.expectedPrice,
                          priceUnit: `per ${lot.unit}`,
                          qualityGrade: lot.qualityGrade,
                          readyHarvestDate: lot.harvestDate
                        });
                        setDirectBidPrice(lot.expectedPricePerUnit?.toString() || lot.expectedPrice?.toString() || '');
                        setDirectBidQty(lot.quantity?.toString() || '');
                      }}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{t('sendPurchaseOffer')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MY BIDS & SCHEDULED INSPECTIONS TAB                   */}
      {/* ======================================================== */}
      {activeTab === 'MY_BIDS' && (
        <div className="space-y-6">
          {/* Scheduled Farm Inspections */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200/90 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-emerald-700" />
                  <span>Scheduled Farm Quality Inspections ({farmInspections.length})</span>
                </h3>
                <p className="text-xs text-gray-500">
                  Pre-harvest gate visits and field moisture/brix testing
                </p>
              </div>
            </div>

            {farmInspections.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-xs">
                No farm gate inspections scheduled. In the "Nearby Farmers" tab, click "Book Inspection" on any cultivator card.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {farmInspections.map(insp => (
                  <div key={insp.id} className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-emerald-950 text-sm">{insp.farmerName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                        {insp.status}
                      </span>
                    </div>

                    <div className="space-y-1 text-gray-700">
                      <p>Crop: <strong className="font-bold">{insp.cropName}</strong> ({insp.acreage} Acres) in {insp.village}</p>
                      <p>Scheduled: <strong className="font-bold text-emerald-900">{insp.inspectionDate}</strong> at {insp.timeSlot}</p>
                      <p className="text-[11px] text-gray-500">Assigned: {insp.inspectorName} ({insp.inspectorPhone})</p>
                      {insp.notes && <p className="text-[11px] text-gray-600 italic">"{insp.notes}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing Bids */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200/90 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-emerald-700" />
                  <span>Submitted Purchase Offers ({myRequests.outgoing.length})</span>
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Real-time acceptance status from cultivators
                </p>
              </div>
            </div>

            {myRequests.outgoing.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-xs">
                You haven't submitted any individual lot offers yet. Browse farmer lots or nearby farmers to send an offer!
              </div>
            ) : (
              <div className="space-y-3">
                {myRequests.outgoing.map(bid => (
                  <div
                    key={bid.id}
                    className="p-4 rounded-2xl border border-gray-200 bg-stone-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
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
                      <span className="text-xs text-gray-500 block font-semibold">
                        Quantity: {bid.quantityRequested} Qtl
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. LOGISTICS TAB                                         */}
      {/* ======================================================== */}
      {activeTab === 'LOGISTICS' && (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200/90 space-y-4">
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

      {/* MODAL 1: CREATE DYNAMIC PURCHASE OFFER */}
      <CreatePurchaseOfferModal
        isOpen={showCreateOfferModal}
        onClose={() => setShowCreateOfferModal(false)}
        onSubmit={handleCreatePurchaseOffer}
        buyerName={user?.name}
        defaultDistrict="Sri Sathya Sai"
      />

      {/* MODAL 2: BOOK FARM INSPECTION */}
      <BookInspectionModal
        isOpen={!!selectedFarmerForInspection}
        onClose={() => setSelectedFarmerForInspection(null)}
        farmer={selectedFarmerForInspection}
        onConfirm={handleConfirmInspection}
        buyerName={user?.name}
        buyerPhone={user?.phone}
      />

      {/* MODAL 3: CALL FARMER DIALOG */}
      {callingFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative border border-gray-100 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto text-2xl font-black">
              📞
            </div>
            <div>
              <h3 className="font-black text-lg text-gray-900">{callingFarmer.farmerName}</h3>
              <p className="text-xs text-gray-500 font-medium">
                {callingFarmer.village}, {callingFarmer.taluk} • {callingFarmer.cropName} ({callingFarmer.estimatedQuantity} {callingFarmer.unit})
              </p>
              <div className="mt-3 p-3 bg-stone-50 rounded-2xl border border-gray-200">
                <span className="text-xs text-gray-400 block font-semibold">Registered Phone</span>
                <span className="text-base font-black text-gray-900 font-mono">{callingFarmer.phone}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCallingFarmer(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 font-bold text-xs text-gray-700"
              >
                Close
              </button>
              <a
                href={`tel:${callingFarmer.phone}`}
                onClick={() => {
                  showToast(`Calling ${callingFarmer.farmerName} (${callingFarmer.phone})...`);
                  setCallingFarmer(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Now</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: SEND DIRECT PURCHASE OFFER TO FARMER */}
      {selectedFarmerForDirectBid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-black text-lg text-gray-900">Direct Purchase Offer</h3>
                <p className="text-xs text-gray-500">
                  Target farmer: <strong>{selectedFarmerForDirectBid.farmerName}</strong> ({selectedFarmerForDirectBid.village})
                </p>
              </div>
              <button
                onClick={() => setSelectedFarmerForDirectBid(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDirectBidSubmit} className="space-y-3.5 text-xs">
              <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100 space-y-1">
                <span className="font-black text-emerald-950 block text-sm">
                  {selectedFarmerForDirectBid.cropName} ({selectedFarmerForDirectBid.variety})
                </span>
                <span className="text-emerald-800 block text-[11px]">
                  Estimated Harvest: {selectedFarmerForDirectBid.estimatedQuantity} {selectedFarmerForDirectBid.unit} • Expected Rate: ₹{selectedFarmerForDirectBid.expectedPrice || 'Open to negotiate'} /{selectedFarmerForDirectBid.priceUnit}
                </span>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Your Purchase Offer Price (₹ /{selectedFarmerForDirectBid.priceUnit}) *
                </label>
                <input
                  type="number"
                  value={directBidPrice}
                  onChange={e => setDirectBidPrice(e.target.value)}
                  placeholder="e.g. 7450"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 font-bold text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Quantity Desired ({selectedFarmerForDirectBid.unit}) *
                </label>
                <input
                  type="number"
                  value={directBidQty}
                  onChange={e => setDirectBidQty(e.target.value)}
                  placeholder="e.g. 40"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 font-bold text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Payment & Farm Gate Pickup Terms</label>
                <textarea
                  value={directBidNotes}
                  onChange={e => setDirectBidNotes(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFarmerForDirectBid(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDirectBid}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingDirectBid && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Send Offer to Cultivator</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
