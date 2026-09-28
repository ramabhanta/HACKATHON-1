import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  TrendingUp,
  Plus,
  Package,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Sparkles,
  ArrowRight,
  X,
  Phone,
  Check,
  AlertCircle,
  Loader2,
  Tag,
  Truck,
  Building2,
  ShieldCheck,
  FileText,
  Clock,
  Search,
  Filter,
  Users,
  Camera,
  Upload,
  HardDrive
} from 'lucide-react';
import { extractPhotoTelemetry, PhotoTelemetryInfo } from '../../utils/photoTelemetry';

interface ProduceMarketProps {
  setActiveTab: (tab: string) => void;
}

export const ProduceMarket: React.FC<ProduceMarketProps> = ({ setActiveTab }) => {
  const { user, isFarmer } = useAuth();
  const { t } = useLanguage();

  const [activeSubTab, setActiveSubTab] = useState<'BUYERS' | 'MY_DEALS' | 'BROWSE' | 'OFFERS'>('BUYERS');
  const [listings, setListings] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<{ incoming: any[]; outgoing: any[] }>({ incoming: [], outgoing: [] });
  const [procurementVendors, setProcurementVendors] = useState<any[]>([]);
  const [myVendorDeals, setMyVendorDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Crop & District Filter for Procurement Vendors
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('All');
  const [vendorSearchQuery, setVendorSearchQuery] = useState<string>('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedListingForOffer, setSelectedListingForOffer] = useState<any | null>(null);
  const [selectedVendorForRequest, setSelectedVendorForRequest] = useState<any | null>(null);
  const [viewAgreementDeal, setViewAgreementDeal] = useState<any | null>(null);
  const [selectedBidForFarmerReject, setSelectedBidForFarmerReject] = useState<any | null>(null);
  const [farmerDeclineReason, setFarmerDeclineReason] = useState('Offered price is below my cultivation cost and expected mandi rate.');
  const [isSubmittingDecline, setIsSubmittingDecline] = useState(false);

  // Form fields - Create Listing (Public Mandi)
  const [cropName, setCropName] = useState('Groundnut');
  const [variety, setVariety] = useState('Kadiri-6 (High Oil Content)');
  const [quantity, setQuantity] = useState('30');
  const [unit, setUnit] = useState('QUINTAL');
  const [expectedPrice, setExpectedPrice] = useState('7400');
  const [harvestDate, setHarvestDate] = useState('2026-10-25');
  const [qualityGrade, setQualityGrade] = useState('GRADE_A');
  const [description, setDescription] = useState('Clean, well-sorted pods directly harvested from our borewell irrigated farm.');
  const [isSubmittingListing, setIsSubmittingListing] = useState(false);
  const [listingError, setListingError] = useState<string | null>(null);
  const [lotPhotoFile, setLotPhotoFile] = useState<File | null>(null);
  const [lotPhotoPreview, setLotPhotoPreview] = useState<string | null>(null);
  const [lotPhotoTelemetry, setLotPhotoTelemetry] = useState<PhotoTelemetryInfo | null>(null);

  const handleProducePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLotPhotoFile(file);
      setLotPhotoPreview(URL.createObjectURL(file));

      const telemetry = await extractPhotoTelemetry(file, {
        latitude: user?.latitude || 14.1165,
        longitude: user?.longitude || 78.1634,
        locationName: `${user?.village ? user.village + ', ' : ''}${user?.district || 'Sri Sathya Sai'}, ${user?.state || 'Andhra Pradesh'}`
      });
      setLotPhotoTelemetry(telemetry);
    }
  };

  // Form fields - Buyer Offer on a Listing
  const [offerPrice, setOfferPrice] = useState('');
  const [offerQty, setOfferQty] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);

  // Form fields - Direct Farmer to Vendor Sell Request
  const [reqCropName, setReqCropName] = useState('Groundnut');
  const [reqVariety, setReqVariety] = useState('Kadiri-6 High Oil');
  const [reqQuantity, setReqQuantity] = useState('25');
  const [reqUnit, setReqUnit] = useState<'QUINTAL' | 'CRATE' | 'KG' | 'TONNE' | 'BUNDLE'>('QUINTAL');
  const [reqPrice, setReqPrice] = useState('7450');
  const [reqHarvestDate, setReqHarvestDate] = useState('2026-10-25');
  const [reqDeliveryPref, setReqDeliveryPref] = useState<'FARM_GATE_PICKUP' | 'FARMER_DELIVERY'>('FARM_GATE_PICKUP');
  const [reqQualityGrade, setReqQualityGrade] = useState<'GRADE_A' | 'GRADE_B' | 'ORGANIC'>('GRADE_A');
  const [reqNotes, setReqNotes] = useState('Harvest ready from borewell irrigated plot. Clean sun-dried with moisture < 8%. Gate pickup preferred.');
  const [isSubmittingVendorReq, setIsSubmittingVendorReq] = useState(false);
  const [vendorReqError, setVendorReqError] = useState<string | null>(null);

  // Action status loading for requests
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const loadData = async () => {
    try {
      const [lRes, rRes, vRes, dRes] = await Promise.all([
        fetch('/api/produce'),
        fetch('/api/produce/my-requests', {
          headers: { Authorization: `Bearer ${localStorage.getItem('agri_token')}` }
        }),
        fetch('/api/produce/procurement-vendors'),
        fetch('/api/produce/vendor-requests/my', {
          headers: { Authorization: `Bearer ${localStorage.getItem('agri_token')}` }
        })
      ]);

      if (lRes.ok) setListings(await lRes.json());
      if (rRes.ok) setMyRequests(await rRes.json());
      if (vRes.ok) setProcurementVendors(await vRes.json());
      if (dRes.ok) {
        const dealsData = await dRes.json();
        setMyVendorDeals(dealsData.asFarmer || []);
      }
    } catch (err) {
      console.error('Failed to load produce data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter vendors based on selected crop & search query
  const filteredVendors = procurementVendors.filter(v => {
    const matchesCrop =
      selectedCropFilter === 'All' ||
      v.cropsBought.some((c: string) => c.toLowerCase().includes(selectedCropFilter.toLowerCase())) ||
      v.buyingRates.some((br: any) => br.crop.toLowerCase().includes(selectedCropFilter.toLowerCase()));

    const matchesSearch =
      !vendorSearchQuery.trim() ||
      v.vendorName.toLowerCase().includes(vendorSearchQuery.toLowerCase()) ||
      v.businessName.toLowerCase().includes(vendorSearchQuery.toLowerCase()) ||
      v.district.toLowerCase().includes(vendorSearchQuery.toLowerCase());

    return matchesCrop && matchesSearch;
  });

  // Open modal for sending request to a specific vendor
  const handleOpenVendorRequestModal = (vendor: any) => {
    setSelectedVendorForRequest(vendor);
    setVendorReqError(null);

    // Pre-select matching crop rate if applicable
    const matchedCrop = selectedCropFilter !== 'All' ? selectedCropFilter : vendor.cropsBought[0] || 'Groundnut';
    setReqCropName(matchedCrop);

    const matchedRateObj = vendor.buyingRates?.find((br: any) =>
      br.crop.toLowerCase().includes(matchedCrop.toLowerCase())
    );

    if (matchedRateObj) {
      setReqPrice(matchedRateObj.rate.toString());
      setReqUnit(matchedRateObj.unit || 'QUINTAL');
    } else if (vendor.buyingRates?.[0]) {
      setReqPrice(vendor.buyingRates[0].rate.toString());
      setReqUnit(vendor.buyingRates[0].unit || 'QUINTAL');
    }

    setReqQuantity('25');
  };

  // Submit Direct Deal Request to Vendor
  const handleSubmitVendorRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorForRequest) return;
    setVendorReqError(null);

    const parsedQty = parseFloat(reqQuantity);
    const parsedPrice = parseFloat(reqPrice);

    if (!reqCropName.trim()) {
      setVendorReqError('Crop name is required.');
      return;
    }
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setVendorReqError('Please enter a valid quantity greater than 0.');
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setVendorReqError('Please enter a valid offered price per unit.');
      return;
    }

    setIsSubmittingVendorReq(true);
    try {
      const res = await fetch('/api/produce/vendor-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('agri_token')}`
        },
        body: JSON.stringify({
          vendorId: selectedVendorForRequest.vendorId,
          vendorName: selectedVendorForRequest.vendorName,
          shopName: selectedVendorForRequest.businessName,
          cropName: reqCropName.trim(),
          variety: reqVariety.trim(),
          quantity: parsedQty,
          unit: reqUnit,
          offeredPricePerUnit: parsedPrice,
          proposedHarvestDate: reqHarvestDate,
          deliveryPreference: reqDeliveryPref,
          qualityGrade: reqQualityGrade,
          notes: reqNotes.trim()
        })
      });

      if (res.ok) {
        setSelectedVendorForRequest(null);
        showToast(`Sell request sent to ${selectedVendorForRequest.businessName}! 🌾 The vendor has been notified.`);
        await loadData();
        setActiveSubTab('MY_DEALS');
      } else {
        const err = await res.json();
        setVendorReqError(err.error || 'Failed to submit request to vendor.');
      }
    } catch (err: any) {
      setVendorReqError(err.message || 'Network error while submitting request.');
    } finally {
      setIsSubmittingVendorReq(false);
    }
  };

  // Create Listing Submit (Public Open Mandi)
  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setListingError(null);

    const parsedQty = parseFloat(quantity);
    const parsedPrice = parseFloat(expectedPrice);

    if (!cropName.trim()) {
      setListingError('Crop name is required.');
      return;
    }
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setListingError('Please enter a valid quantity greater than 0.');
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setListingError('Please enter a valid expected price greater than ₹0.');
      return;
    }

    setIsSubmittingListing(true);
    try {
      const res = await fetch('/api/produce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('agri_token')}`
        },
        body: JSON.stringify({
          cropName: cropName.trim(),
          variety: variety.trim(),
          quantity: parsedQty,
          unit,
          expectedPricePerUnit: parsedPrice,
          harvestDate,
          qualityGrade,
          description: description.trim(),
          images: lotPhotoPreview ? [lotPhotoPreview] : undefined,
          photoMetadata: lotPhotoTelemetry || undefined
        })
      });

      if (res.ok) {
        setShowCreateModal(false);
        setLotPhotoFile(null);
        setLotPhotoPreview(null);
        setLotPhotoTelemetry(null);
        showToast('Produce lot with verified field photo published to wholesale buyers! 🌾');
        await loadData();
        setActiveSubTab('BROWSE');
      } else {
        const err = await res.json();
        setListingError(err.error || 'Failed to publish listing.');
      }
    } catch (err: any) {
      setListingError(err.message || 'Network error while creating listing.');
    } finally {
      setIsSubmittingListing(false);
    }
  };

  // Submit Buyer Offer on Public Lot
  const handleSendBuyerOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListingForOffer) return;
    setOfferError(null);

    const parsedPrice = parseFloat(offerPrice);
    const parsedQty = parseFloat(offerQty);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setOfferError('Please enter a valid offer price.');
      return;
    }
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setOfferError('Please enter a valid quantity.');
      return;
    }

    setIsSubmittingOffer(true);
    try {
      const res = await fetch(`/api/produce/${selectedListingForOffer.id}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('agri_token')}`
        },
        body: JSON.stringify({
          offeredPricePerUnit: parsedPrice,
          requestedQuantity: parsedQty,
          message: offerMessage.trim()
        })
      });

      if (res.ok) {
        setSelectedListingForOffer(null);
        showToast('Purchase offer sent to farmer! 📩');
        await loadData();
      } else {
        const err = await res.json();
        setOfferError(err.error || 'Failed to send offer.');
      }
    } catch (err: any) {
      setOfferError(err.message || 'Network error sending offer.');
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  // Accept Buyer/Vendor Offer on Farmer Listing
  const handleAcceptBuyerOffer = async (requestId: string) => {
    setProcessingRequestId(requestId);
    try {
      const res = await fetch(`/api/produce/requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('agri_token')}`
        },
        body: JSON.stringify({
          status: 'ACCEPTED',
          responseNotes: 'Offer accepted by farmer. Ready for pickup and weighment coordination.'
        })
      });

      if (res.ok) {
        showToast('Purchase offer accepted! You can now coordinate dispatch with the buyer. 🎉');
        await loadData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to accept offer.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error accepting offer.', 'error');
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Farmer Choice: Decline Buyer/Vendor Offer with reason
  const handleFarmerDeclineBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBidForFarmerReject) return;
    setIsSubmittingDecline(true);
    try {
      const res = await fetch(`/api/produce/requests/${selectedBidForFarmerReject.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('agri_token')}`
        },
        body: JSON.stringify({
          status: 'REJECTED',
          farmerReason: farmerDeclineReason.trim()
        })
      });

      if (res.ok) {
        setSelectedBidForFarmerReject(null);
        showToast('Offer declined. The buyer/vendor has been notified with your reason. ❌');
        await loadData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to decline offer', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error declining offer', 'error');
    } finally {
      setIsSubmittingDecline(false);
    }
  };


  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Toast Notification */}
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

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
            <span>🌾 Direct Farmer-to-Vendor Mandi (0% Middleman Commission)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Sell Produce Directly to Verified Buyers
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            See which vendors are actively buying your crop, request instant gate pickup, and get confirmed procurement deals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setListingError(null);
              setShowCreateModal(true);
            }}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow transition active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>List Open Lot</span>
          </button>
        </div>
      </div>

      {/* Mandi & Flower Prices Quick Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-pink-50 to-amber-50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-800 flex items-center justify-center text-xl shrink-0">
            🌸
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-gray-900">Check Daily All-India Mandi & Flower Rates</h4>
            <p className="text-xs text-gray-600">
              Live wholesale rates for Jasmine, Marigold, Dutch Rose, Groundnut, Tomato & 20+ Mandis across India.
            </p>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('prices')}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold rounded-xl shadow-xs transition shrink-0 self-start sm:self-auto active:scale-95"
        >
          View Live Mandi Rates →
        </button>
      </div>

      {/* Primary Sub Tabs */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl text-xs font-bold overflow-x-auto gap-1">
        <button
          onClick={() => setActiveSubTab('BUYERS')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'BUYERS' ? 'bg-white text-emerald-800 shadow-sm font-extrabold' : 'text-gray-600 hover:text-emerald-700'
          }`}
        >
          <span>🤝</span>
          <span>Who is Buying ({filteredVendors.length} Vendors)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('MY_DEALS')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'MY_DEALS' ? 'bg-white text-emerald-800 shadow-sm font-extrabold' : 'text-gray-600 hover:text-emerald-700'
          }`}
        >
          <span>📋</span>
          <span>My Outgoing Requests</span>
          {myVendorDeals.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900 font-black">
              {myVendorDeals.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('BROWSE')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'BROWSE' ? 'bg-white text-emerald-800 shadow-sm font-extrabold' : 'text-gray-600 hover:text-emerald-700'
          }`}
        >
          <span>📦</span>
          <span>Open Mandi Lots ({listings.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('OFFERS')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'OFFERS' ? 'bg-white text-emerald-800 shadow-sm font-extrabold' : 'text-gray-600 hover:text-emerald-700'
          }`}
        >
          <span>📥</span>
          <span>Incoming Bids ({myRequests.incoming.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. WHO IS BUYING: MATCHING VENDORS & PROCUREMENT BUYERS */}
      {/* ======================================================== */}
      {activeSubTab === 'BUYERS' && (
        <div className="space-y-4">
          {/* Crop Selector Quick Pills */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-emerald-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-emerald-600" />
                  <span>Select Crop You Want to Sell:</span>
                </h3>
                <p className="text-xs text-gray-500">
                  Filter vendors and millers actively procuring this specific commodity
                </p>
              </div>

              {/* Search bar */}
              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search vendor or city..."
                  value={vendorSearchQuery}
                  onChange={e => setVendorSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
              {[
                { label: '🌾 All Crops', value: 'All' },
                { label: '🥜 Groundnut', value: 'Groundnut' },
                { label: '🍅 Tomato', value: 'Tomato' },
                { label: '🌾 Paddy (Rice)', value: 'Paddy' },
                { label: '🌸 Flowers & Floriculture', value: 'Flowers' },
                { label: '🌿 Cotton', value: 'Cotton' },
                { label: '🌶️ Chilli', value: 'Chilli' },
                { label: '🧅 Onion', value: 'Onion' },
                { label: '🌽 Maize', value: 'Maize' },
                { label: '🥭 Mango', value: 'Mango' }
              ].map(c => (
                <button
                  key={c.value}
                  onClick={() => setSelectedCropFilter(c.value)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition border ${
                    selectedCropFilter === c.value
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50 hover:border-emerald-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vendors Grid */}
          {filteredVendors.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-sm space-y-2">
              <p className="text-3xl">🔍</p>
              <p className="font-extrabold text-sm text-gray-800">No matching procurement vendors found</p>
              <p className="text-xs text-gray-500">
                Try selecting "All Crops" or clearing your search term to see wholesale buyers across all commodities.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredVendors.map(vendor => {
                // Find matching crop rate if applicable
                const matchedRate = vendor.buyingRates?.find((br: any) =>
                  selectedCropFilter === 'All'
                    ? true
                    : br.crop.toLowerCase().includes(selectedCropFilter.toLowerCase())
                ) || vendor.buyingRates?.[0];

                return (
                  <div
                    key={vendor.id}
                    className="bg-white rounded-3xl p-5 shadow-sm border border-emerald-100 hover:border-emerald-300 hover:shadow-md transition space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Vendor Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={vendor.avatarUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150'}
                            alt={vendor.businessName}
                            className="w-12 h-12 rounded-2xl object-cover border border-gray-200 shadow-inner"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-black text-sm text-gray-900 leading-tight">
                                {vendor.businessName}
                              </h3>
                              {vendor.verified && (
                                <span title="APMC Verified Buyer">
                                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-emerald-800 font-semibold mt-0.5">
                              {vendor.vendorName}
                            </p>
                            <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                              <MapPin className="w-3 h-3 text-emerald-600" />
                              <span>{vendor.village ? `${vendor.village}, ` : ''}{vendor.district}, {vendor.state}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-extrabold">
                            ★ {vendor.rating || 4.8}
                          </span>
                        </div>
                      </div>

                      {/* Commodities Buying Chips */}
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                          Actively Buying Commodities:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {vendor.cropsBought.map((cropItem: string) => (
                            <span
                              key={cropItem}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                selectedCropFilter !== 'All' && cropItem.toLowerCase().includes(selectedCropFilter.toLowerCase())
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {cropItem}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Buying Price & Capacity Card */}
                      {matchedRate && (
                        <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider block">
                              Procurement Rate ({matchedRate.crop})
                            </span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <span className="text-lg font-black text-emerald-900">
                                ₹{matchedRate.rate.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] text-emerald-800 font-bold">
                                / {matchedRate.unit}
                              </span>
                            </div>
                            {matchedRate.note && (
                              <p className="text-[10px] text-emerald-700 italic mt-0.5">{matchedRate.note}</p>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block">
                              Capacity Lot
                            </span>
                            <span className="font-extrabold text-gray-800 text-xs">
                              {vendor.minQuantity} - {vendor.maxQuantity} {vendor.unit}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Terms & Pickup Perks */}
                      <div className="space-y-1.5 text-xs text-gray-600">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            {vendor.pickupAvailable ? (
                              <strong className="text-emerald-800 font-bold">Farm-Gate Truck Pickup Provided</strong>
                            ) : (
                              'Farmer Delivery to Godown'
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>Payment: <strong>{vendor.paymentTerms}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      {vendor.phone && (
                        <a
                          href={`tel:${vendor.phone}`}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition flex items-center gap-1.5 font-bold text-xs"
                          title="Call Vendor"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-700" />
                          <span className="hidden sm:inline">Call Buyer</span>
                        </a>
                      )}

                      <button
                        onClick={() => handleOpenVendorRequestModal(vendor)}
                        className="flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow transition active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <span>Sell to This Vendor (Send Request)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MY OUTGOING SELL REQUESTS (FARMER TO VENDOR TRACKER) */}
      {/* ======================================================== */}
      {activeSubTab === 'MY_DEALS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <span>📋</span> My Outgoing Vendor Sell Requests ({myVendorDeals.length})
                </h3>
                <p className="text-xs text-gray-500">
                  Track direct harvest offers sent to wholesale vendors. When confirmed, view digital gate pass and dispatch schedules.
                </p>
              </div>

              <button
                onClick={() => setActiveSubTab('BUYERS')}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold text-xs rounded-xl transition self-start sm:self-auto"
              >
                + Request Another Vendor
              </button>
            </div>

            {myVendorDeals.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs space-y-2">
                <p className="text-3xl">🌾</p>
                <p className="font-extrabold text-gray-700 text-sm">No outgoing vendor requests yet</p>
                <p>Browse the "Who is Buying" tab to find verified buyers for your crops and send direct sell requests.</p>
                <button
                  onClick={() => setActiveSubTab('BUYERS')}
                  className="mt-2 px-4 py-2 bg-emerald-700 text-white font-bold rounded-xl text-xs"
                >
                  Find Buyers for My Crops
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myVendorDeals.map(deal => {
                  const isConfirmed = deal.status === 'CONFIRMED';
                  const isRejected = deal.status === 'REJECTED';
                  const isPending = deal.status === 'PENDING';

                  return (
                    <div
                      key={deal.id}
                      className={`p-5 rounded-3xl border transition shadow-sm space-y-3 ${
                        isConfirmed
                          ? 'bg-emerald-50/40 border-emerald-300'
                          : isRejected
                          ? 'bg-red-50/30 border-red-200'
                          : 'bg-white border-amber-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-base text-gray-900">
                              {deal.cropName} ({deal.variety || 'Standard'})
                            </h4>
                            <span className="text-xs px-2 py-0.5 rounded-md font-extrabold bg-gray-100 text-gray-700">
                              {deal.qualityGrade}
                            </span>
                          </div>

                          <p className="text-xs text-emerald-800 font-bold mt-0.5 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Requested Vendor: <strong>{deal.shopName || deal.vendorName}</strong></span>
                          </p>

                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span>Qty: <strong>{deal.quantity} {deal.unit}</strong></span>
                            <span>•</span>
                            <span>Offered Rate: <strong>₹{deal.offeredPricePerUnit.toLocaleString('en-IN')}/{deal.unit}</strong></span>
                            <span>•</span>
                            <span>Total Value: <strong className="text-emerald-800">₹{deal.totalAmount.toLocaleString('en-IN')}</strong></span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isConfirmed ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-sm">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>DEAL CONFIRMED & ACCEPTED</span>
                            </span>
                          ) : isRejected ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-600 text-white text-xs font-black shadow-sm">
                              <XCircle className="w-4 h-4" />
                              <span>OFFER DECLINED</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400 text-amber-950 text-xs font-black shadow-sm animate-pulse">
                              <Clock className="w-4 h-4" />
                              <span>AWAITING VENDOR REVIEW</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Logistics & Response Note */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs p-3 rounded-2xl bg-white/80 border border-gray-100">
                        <div>
                          <span className="text-gray-400 text-[10px] font-bold block">Proposed Harvest / Pickup Date</span>
                          <span className="font-extrabold text-gray-800">
                            {deal.pickupScheduledDate || deal.proposedHarvestDate}
                          </span>
                        </div>

                        <div>
                          <span className="text-gray-400 text-[10px] font-bold block">Handover Preference</span>
                          <span className="font-extrabold text-gray-800">
                            {deal.deliveryPreference === 'FARM_GATE_PICKUP' ? '🚛 Farm Gate Truck Pickup' : '🚜 Farmer Godown Delivery'}
                          </span>
                        </div>

                        {deal.vendorResponseNotes && (
                          <div className="col-span-1 sm:col-span-2 pt-2 border-t border-gray-100">
                            <span className="text-[10px] font-bold text-gray-400 block">Vendor Response Note:</span>
                            <p className="text-xs text-gray-800 font-medium italic mt-0.5">
                              "{deal.vendorResponseNotes}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-gray-400">
                          Submitted on {new Date(deal.createdAt).toLocaleDateString()}
                        </span>

                        <div className="flex items-center gap-2">
                          {isConfirmed && (
                            <button
                              onClick={() => setViewAgreementDeal(deal)}
                              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm active:scale-95"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Digital Gate Pass & Agreement</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. BROWSE OPEN MARKETPLACE LOTS */}
      {/* ======================================================== */}
      {activeSubTab === 'BROWSE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listings.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:border-emerald-200 transition space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 rounded-2xl overflow-hidden bg-gray-100 mb-3">
                  <img
                    src={item.images?.[0] || 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400'}
                    alt={item.cropName}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-emerald-800 text-white font-black text-[10px] rounded-md uppercase">
                    {item.qualityGrade?.replace('_', ' ') || 'GRADE A'}
                  </span>
                  <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 bg-amber-400 text-amber-950 font-black text-[10px] rounded-md uppercase">
                    {item.status?.replace('_', ' ') || 'AVAILABLE'}
                  </span>

                  {item.photoMetadata && (
                    <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-xs text-white text-[9px] font-mono flex items-center justify-between">
                      <span className="truncate flex items-center gap-1 text-emerald-300 font-bold">
                        <span>📸</span>
                        <span>{item.photoMetadata.uploadDateFormatted} • {item.photoMetadata.uploadTimeFormatted}</span>
                      </span>
                      <span className="text-[8px] text-gray-300 font-semibold shrink-0">
                        {item.photoMetadata.dimensions || 'Field Verified'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-base text-gray-900">{item.cropName}</h3>
                    <p className="text-xs text-emerald-800 font-semibold">{item.variety}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-emerald-800">
                      ₹{item.expectedPricePerUnit.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-gray-400 block font-semibold">per {item.unit}</span>
                  </div>
                </div>

                <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px] font-bold">Lot Quantity</span>
                    <span className="font-extrabold text-gray-800">{item.quantity} {item.unit}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] font-bold">Harvest Window</span>
                    <span className="font-extrabold text-gray-800">{item.harvestDate}</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1 text-[11px] text-gray-500">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{item.village}, {item.district}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-gray-700 truncate">
                  Farmer: {item.farmerName}
                </span>
                <button
                  onClick={() => {
                    setSelectedListingForOffer(item);
                    setOfferPrice(item.expectedPricePerUnit.toString());
                    setOfferQty(item.quantity.toString());
                    setOfferError(null);
                  }}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 shrink-0"
                >
                  Send Purchase Offer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. INCOMING BIDS ON MY OPEN LOTS */}
      {/* ======================================================== */}
      {activeSubTab === 'OFFERS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 space-y-4">
            <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
              <span>🤝</span> Received Purchase Offers from Buyers ({myRequests.incoming.length})
            </h3>
            <p className="text-xs text-gray-500">
              Direct wholesale offers submitted for your harvest lots. Review and accept bids to initiate logistics.
            </p>

            {myRequests.incoming.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                No buyer offers received on your listings yet. Incoming bids will appear here in real-time.
              </div>
            ) : (
              <div className="space-y-3">
                {myRequests.incoming.map(reqItem => (
                  <div
                    key={reqItem.id}
                    className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-gray-900 text-sm">
                          {reqItem.listing?.cropName || 'Produce Lot'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Offered: ₹{reqItem.offeredPricePerUnit} / {reqItem.listing?.unit || 'Unit'}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">
                        Buyer: <strong>{reqItem.buyerName}</strong> • Requested: <strong>{reqItem.requestedQuantity} {reqItem.listing?.unit}</strong>
                      </p>
                      {reqItem.message && (
                        <p className="text-gray-500 italic mt-0.5">"{reqItem.message}"</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {reqItem.buyerPhone && (
                        <a
                          href={`tel:${reqItem.buyerPhone}`}
                          className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition flex items-center gap-1 font-bold text-xs"
                          title="Call Buyer"
                        >
                          <Phone className="w-3.5 h-3.5" /> Call
                        </a>
                      )}

                      {reqItem.status === 'SUBMITTED' ? (
                        <>
                          <button
                            onClick={() => handleAcceptBuyerOffer(reqItem.id)}
                            disabled={processingRequestId === reqItem.id}
                            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black rounded-xl transition text-xs flex items-center gap-1 shadow-xs active:scale-95"
                          >
                            {processingRequestId === reqItem.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Accept Offer</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBidForFarmerReject(reqItem);
                              setFarmerDeclineReason('Offered price is below my cultivation cost and expected mandi rate.');
                            }}
                            disabled={processingRequestId === reqItem.id}
                            className="px-3 py-2 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-700 disabled:opacity-50 font-bold rounded-xl transition text-xs flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Decline (Farmer Choice)</span>
                          </button>
                        </>
                      ) : (
                        <div className="text-right">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                            reqItem.status === 'ACCEPTED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {reqItem.status === 'ACCEPTED' ? '✓ Accepted by You' : '✕ Declined by You'}
                          </span>
                          {reqItem.farmerReason && (
                            <p className="text-[10px] text-gray-500 mt-1 italic">
                              Reason: "{reqItem.farmerReason}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}


      {/* ======================================================== */}
      {/* MODAL: DIRECT SELL REQUEST TO SPECIFIC VENDOR */}
      {/* ======================================================== */}
      {selectedVendorForRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-emerald-100 relative space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedVendorForRequest(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase mb-1">
                Direct Deal Request
              </div>
              <h3 className="text-lg font-black text-gray-900">
                Sell Produce to {selectedVendorForRequest.businessName}
              </h3>
              <p className="text-xs text-gray-500">
                Contact: {selectedVendorForRequest.vendorName} • {selectedVendorForRequest.district}, {selectedVendorForRequest.state}
              </p>
            </div>

            {vendorReqError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{vendorReqError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitVendorRequest} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Crop Name *</label>
                  <input
                    type="text"
                    value={reqCropName}
                    onChange={e => setReqCropName(e.target.value)}
                    placeholder="e.g. Groundnut"
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Variety</label>
                  <input
                    type="text"
                    value={reqVariety}
                    onChange={e => setReqVariety(e.target.value)}
                    placeholder="e.g. Kadiri-6 / Arka Rakshak"
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={reqQuantity}
                    onChange={e => setReqQuantity(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Unit</label>
                  <select
                    value={reqUnit}
                    onChange={e => setReqUnit(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="QUINTAL">Quintal (100 kg)</option>
                    <option value="CRATE">Crate (25 kg)</option>
                    <option value="KG">Kilogram (kg)</option>
                    <option value="TONNE">Tonne</option>
                    <option value="BUNDLE">Bundle (Flowers)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Asking Rate (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={reqPrice}
                    onChange={e => setReqPrice(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 font-extrabold text-emerald-800"
                    required
                  />
                </div>
              </div>

              {/* Total Calculation Banner */}
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-950 font-bold">
                <span>Total Expected Deal Value:</span>
                <span className="text-base font-black text-amber-900">
                  ₹{(parseFloat(reqQuantity || '0') * parseFloat(reqPrice || '0')).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Proposed Harvest / Handover Date</label>
                  <input
                    type="date"
                    value={reqHarvestDate}
                    onChange={e => setReqHarvestDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Quality Grade</label>
                  <select
                    value={reqQualityGrade}
                    onChange={e => setReqQualityGrade(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="GRADE_A">Grade A (Sorted Premium)</option>
                    <option value="GRADE_B">Grade B (Standard Market)</option>
                    <option value="ORGANIC">Certified Organic</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Logistics & Delivery Preference</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReqDeliveryPref('FARM_GATE_PICKUP')}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                      reqDeliveryPref === 'FARM_GATE_PICKUP'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-extrabold'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50 font-medium'
                    }`}
                  >
                    <Truck className="w-4 h-4 text-emerald-700" />
                    <span>Farm Gate Pickup</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReqDeliveryPref('FARMER_DELIVERY')}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                      reqDeliveryPref === 'FARMER_DELIVERY'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-extrabold'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50 font-medium'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-emerald-700" />
                    <span>Deliver to Godown</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Farmer Notes / Moisture / Loading Instructions</label>
                <textarea
                  value={reqNotes}
                  onChange={e => setReqNotes(e.target.value)}
                  rows={2}
                  placeholder="Mention field survey location, tare weight, moisture %, loading arrangements..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingVendorReq}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black rounded-2xl shadow transition text-xs active:scale-95 flex items-center justify-center gap-2"
              >
                {isSubmittingVendorReq ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Request to Vendor...</span>
                  </>
                ) : (
                  <span>Submit Deal Request to Vendor</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: VIEW DIGITAL AGREEMENT & GATE PASS */}
      {/* ======================================================== */}
      {viewAgreementDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 relative space-y-4">
            <button
              onClick={() => setViewAgreementDeal(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl mx-auto">
                📜
              </div>
              <h3 className="text-lg font-black text-gray-900">
                Digital Mandi Procurement Pass
              </h3>
              <p className="text-[11px] text-gray-500">
                Official deal voucher between Farmer & Mandi Vendor
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                <span className="text-gray-500 font-bold">Deal ID:</span>
                <span className="font-mono font-black text-gray-900">{viewAgreementDeal.id}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-400 text-[10px] font-bold block">Farmer</span>
                  <span className="font-extrabold text-gray-800">{viewAgreementDeal.farmerName}</span>
                  <span className="text-[10px] text-gray-500 block">{viewAgreementDeal.farmerVillage}, {viewAgreementDeal.farmerDistrict}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] font-bold block">Vendor / Mandi Depot</span>
                  <span className="font-extrabold text-gray-800">{viewAgreementDeal.shopName || viewAgreementDeal.vendorName}</span>
                </div>
              </div>

              <div className="border-t border-stone-200 pt-2 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-400 text-[10px] font-bold block">Crop & Variety</span>
                  <span className="font-extrabold text-emerald-900">{viewAgreementDeal.cropName} ({viewAgreementDeal.variety})</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] font-bold block">Contracted Quantity</span>
                  <span className="font-black text-gray-900">{viewAgreementDeal.quantity} {viewAgreementDeal.unit}</span>
                </div>
              </div>

              <div className="border-t border-stone-200 pt-2 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-400 text-[10px] font-bold block">Agreed Procurement Rate</span>
                  <span className="font-black text-emerald-800">₹{viewAgreementDeal.offeredPricePerUnit}/{viewAgreementDeal.unit}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] font-bold block">Total Payable</span>
                  <span className="font-black text-emerald-800 text-sm">₹{viewAgreementDeal.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="border-t border-stone-200 pt-2">
                <span className="text-gray-400 text-[10px] font-bold block">Scheduled Pickup / Gate Entry:</span>
                <span className="font-black text-amber-900">
                  {viewAgreementDeal.pickupScheduledDate || viewAgreementDeal.proposedHarvestDate}
                </span>
              </div>

              {viewAgreementDeal.vendorResponseNotes && (
                <div className="p-2.5 rounded-xl bg-emerald-100/60 text-emerald-950 text-[11px] font-medium border border-emerald-200">
                  <strong>Vendor Confirmation:</strong> "{viewAgreementDeal.vendorResponseNotes}"
                </div>
              )}
            </div>

            <button
              onClick={() => {
                showToast('Procurement voucher downloaded to your device! 📄');
                setViewAgreementDeal(null);
              }}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition"
            >
              Download PDF / Share Receipt
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE PUBLIC OPEN MANDI LISTING */}
      {/* ======================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-emerald-100 relative space-y-4">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-gray-900">List Produce for Direct Sale</h3>
            <p className="text-xs text-gray-500">Connect with wholesale traders and mandis across AP and Karnataka</p>

            {listingError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{listingError}</span>
              </div>
            )}

            <form onSubmit={handleCreateListing} className="space-y-3 text-xs">
              {/* Field Harvest Photo with Real Date & Telemetry */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-700 flex items-center gap-1.5 text-xs">
                    <Camera className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Upload or Snap Harvest Photo</span>
                  </label>
                  {lotPhotoTelemetry && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Verified Real-time Stamp
                    </span>
                  )}
                </div>

                {lotPhotoPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-black/5">
                    <img src={lotPhotoPreview} alt="Lot preview" className="w-full h-32 object-cover" />
                    {lotPhotoTelemetry && (
                      <div className="absolute bottom-1.5 left-1.5 right-1.5 p-1.5 rounded-lg bg-black/80 backdrop-blur-xs text-white text-[9px] font-mono flex items-center justify-between">
                        <span>📅 {lotPhotoTelemetry.uploadDateFormatted} • {lotPhotoTelemetry.uploadTimeFormatted}</span>
                        <span>{lotPhotoTelemetry.dimensions}</span>
                      </div>
                    )}
                    <label className="absolute top-2 right-2 px-2.5 py-1 bg-black/70 hover:bg-black/90 text-white rounded-lg text-[10px] font-bold cursor-pointer transition">
                      Change Photo
                      <input type="file" accept="image/*" onChange={handleProducePhotoChange} className="hidden" />
                    </label>
                  </div>
                ) : (
                  <label className="p-3 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl bg-emerald-50/50 hover:bg-emerald-50 cursor-pointer flex items-center justify-center gap-2 text-emerald-800 transition">
                    <Upload className="w-4 h-4 text-emerald-700" />
                    <span className="font-bold text-xs">Snap Photo with Real Date, Time & GPS</span>
                    <input type="file" accept="image/*" onChange={handleProducePhotoChange} className="hidden" />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Crop Name *</label>
                  <input
                    type="text"
                    value={cropName}
                    onChange={e => setCropName(e.target.value)}
                    placeholder="e.g. Groundnut"
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Variety</label>
                  <input
                    type="text"
                    value={variety}
                    onChange={e => setVariety(e.target.value)}
                    placeholder="e.g. Kadiri-6"
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Unit</label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="QUINTAL">Quintal (100 kg)</option>
                    <option value="CRATE">Crate (25 kg)</option>
                    <option value="KG">Kilogram (kg)</option>
                    <option value="TONNE">Tonne</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Expected Price (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={expectedPrice}
                    onChange={e => setExpectedPrice(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Harvest Window</label>
                  <input
                    type="date"
                    value={harvestDate}
                    onChange={e => setHarvestDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Quality Grade</label>
                  <select
                    value={qualityGrade}
                    onChange={e => setQualityGrade(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="GRADE_A">Grade A (Premium)</option>
                    <option value="GRADE_B">Grade B (Standard)</option>
                    <option value="GRADE_C">Grade C (Commercial)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Description / Sorting Details</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Mention moisture content, pod sorting, farm-gate availability..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingListing}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow transition text-xs active:scale-95 flex items-center justify-center gap-2"
              >
                {isSubmittingListing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing Listing...</span>
                  </>
                ) : (
                  <span>Publish Listing to Buyers</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: BUYER SEND OFFER ON PUBLIC LOT */}
      {/* ======================================================== */}
      {selectedListingForOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 relative space-y-4">
            <button
              onClick={() => setSelectedListingForOffer(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-gray-900">
              Submit Offer for {selectedListingForOffer.cropName}
            </h3>
            <p className="text-xs text-gray-500">
              Farmer: <strong>{selectedListingForOffer.farmerName}</strong> • Asking Price: ₹{selectedListingForOffer.expectedPricePerUnit}/{selectedListingForOffer.unit}
            </p>

            {offerError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{offerError}</span>
              </div>
            )}

            <form onSubmit={handleSendBuyerOffer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Your Offered Price per {selectedListingForOffer.unit} (₹) *</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={offerPrice}
                  onChange={e => setOfferPrice(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Requested Quantity ({selectedListingForOffer.unit}) *</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={offerQty}
                  onChange={e => setOfferQty(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Message to Farmer (Logistics / Mandi terms)</label>
                <textarea
                  value={offerMessage}
                  onChange={e => setOfferMessage(e.target.value)}
                  placeholder="e.g. Can arrange farm-gate truck collection on harvest day..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingOffer}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow transition text-xs active:scale-95 flex items-center justify-center gap-2"
              >
                {isSubmittingOffer ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Offer...</span>
                  </>
                ) : (
                  <span>Send Offer to Farmer</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: FARMER DECLINE BUYER OFFER (FARMER CHOICE) */}
      {/* ======================================================== */}
      {selectedBidForFarmerReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-100 relative space-y-4">
            <button
              onClick={() => setSelectedBidForFarmerReject(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center text-lg font-black shrink-0">
                ✕
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">Decline Buyer Offer</h3>
                <p className="text-[11px] text-gray-500">As the farmer, you have complete choice to accept or decline</p>
              </div>
            </div>

            {/* Offer Summary */}
            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-bold">Buyer / Vendor:</span>
                <span className="font-extrabold text-gray-900">{selectedBidForFarmerReject.buyerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-bold">Offered Rate:</span>
                <span className="font-black text-gray-900">
                  ₹{selectedBidForFarmerReject.offeredPricePerUnit} / {selectedBidForFarmerReject.unit || 'unit'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-bold">Requested Quantity:</span>
                <span className="font-bold text-gray-800">
                  {selectedBidForFarmerReject.requestedQuantity} {selectedBidForFarmerReject.unit || 'units'}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-200 pt-1.5 font-bold">
                <span className="text-gray-600">Total Bid:</span>
                <span className="text-sm font-black text-gray-900">
                  ₹{(selectedBidForFarmerReject.totalAmount || (selectedBidForFarmerReject.offeredPricePerUnit * selectedBidForFarmerReject.requestedQuantity)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Decline Form */}
            <form onSubmit={handleFarmerDeclineBid} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Reason for Declining (Vendor will be notified):
                </label>

                {/* Quick Presets */}
                <div className="grid grid-cols-1 gap-1.5 mb-2">
                  {[
                    '💰 Offered price is below my cultivation cost and expected mandi rate.',
                    '🌾 Produce lot is already committed or sold to another vendor.',
                    '🗓️ Pickup or harvest timeline does not match field conditions.',
                    '⚖️ Requested quantity is less than minimum harvest batch.'
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFarmerDeclineReason(preset)}
                      className={`text-left p-2 rounded-xl border text-[11px] transition ${
                        farmerDeclineReason === preset
                          ? 'bg-red-50 border-red-300 text-red-900 font-bold'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <textarea
                  value={farmerDeclineReason}
                  onChange={e => setFarmerDeclineReason(e.target.value)}
                  rows={3}
                  required
                  placeholder="Enter reason or note to buyer..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500 text-xs text-gray-800"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedBidForFarmerReject(null)}
                  className="w-1/3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDecline || !farmerDeclineReason.trim()}
                  className="w-2/3 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                >
                  {isSubmittingDecline ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Declining...</span>
                    </>
                  ) : (
                    <span>Decline This Offer</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
