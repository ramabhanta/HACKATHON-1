import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Store,
  Package,
  Truck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Edit2,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  X,
  Check,
  AlertCircle,
  Loader2,
  Navigation,
  MapPin,
  Search,
  Filter,
  Phone,
  Calendar,
  XCircle,
  Send,
  Building2,
  Sparkles,
  FileText
} from 'lucide-react';

export const VendorPortal: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'INVENTORY' | 'PROCUREMENT' | 'FARMER_OFFERS' | 'LOGISTICS'>('ORDERS');
  const [loading, setLoading] = useState(true);

  // Status updating state
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Stock edit state
  const [editingStockProductId, setEditingStockProductId] = useState<string | null>(null);
  const [newStockQty, setNewStockQty] = useState('');
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  // Add Product Modal
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodBrand, setProdBrand] = useState('Coromandel / IFFCO');
  const [prodCategory, setProdCategory] = useState('FERTILIZER');
  const [prodPrice, setProdPrice] = useState('');
  const [prodMrp, setProdMrp] = useState('');
  const [prodPackSize, setProdPackSize] = useState('50 kg Bag');
  const [prodStock, setProdStock] = useState('50');
  const [prodDesc, setProdDesc] = useState('');
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);

  // ==========================================
  // Procurement: Buy from Farmers & Manage Direct Offers
  // ==========================================
  const [readyFarmerHarvests, setReadyFarmerHarvests] = useState<any[]>([]);
  const [incomingFarmerDeals, setIncomingFarmerDeals] = useState<any[]>([]);
  const [outgoingVendorBids, setOutgoingVendorBids] = useState<any[]>([]);
  const [procurementSubTab, setProcurementSubTab] = useState<'SEARCH_FARMERS' | 'SENT_BIDS'>('SEARCH_FARMERS');
  const [cropSearchQuery, setCropSearchQuery] = useState('');
  const [selectedCropFilter, setSelectedCropFilter] = useState('All');

  // Modal: Send Bid / Offer to a Farmer's Ready Crop
  const [selectedLotForBid, setSelectedLotForBid] = useState<any | null>(null);
  const [bidPrice, setBidPrice] = useState('');
  const [bidQty, setBidQty] = useState('');
  const [bidPickupDate, setBidPickupDate] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);

  // Modal: Confirm / Accept Farmer Direct Deal
  const [selectedDealForConfirm, setSelectedDealForConfirm] = useState<any | null>(null);
  const [confirmPickupDate, setConfirmPickupDate] = useState('');
  const [confirmNotes, setConfirmNotes] = useState('');
  const [isConfirmingDeal, setIsConfirmingDeal] = useState(false);

  // Modal: Reject Farmer Direct Deal
  const [selectedDealForReject, setSelectedDealForReject] = useState<any | null>(null);
  const [rejectNotes, setRejectNotes] = useState('Godown currently at maximum storage capacity for this commodity.');
  const [isRejectingDeal, setIsRejectingDeal] = useState(false);

  // Logistics simulation state
  const [assignedDriver, setAssignedDriver] = useState<string>('Srinivas Rao (Tata Ace - AP 02 TE 4821)');
  const [driverStatus, setDriverStatus] = useState<string>('DISPATCHED');
  const [driverLocation, setDriverLocation] = useState<string>('En route to Kadiri Rural (3.4 km away)');

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
      const [oRes, pRes, rRes, dRes, bRes] = await Promise.all([
        fetch('/api/orders', { headers: { Authorization: `Bearer ${localStorage.getItem('agri_token')}` } }),
        fetch('/api/products?vendorId=usr-vendor-1'),
        fetch('/api/produce/ready-farmer-harvests'),
        fetch('/api/produce/vendor-requests/my', {
          headers: { Authorization: `Bearer ${localStorage.getItem('agri_token')}` }
        }),
        fetch('/api/produce/my-requests', {
          headers: { Authorization: `Bearer ${localStorage.getItem('agri_token')}` }
        })
      ]);

      if (oRes.ok) setOrders(await oRes.json());
      if (pRes.ok) setProducts(await pRes.json());
      if (rRes.ok) setReadyFarmerHarvests(await rRes.json());
      if (dRes.ok) {
        const dealsData = await dRes.json();
        setIncomingFarmerDeals(dealsData.asVendor || []);
      }
      if (bRes.ok) {
        const bidsData = await bRes.json();
        setOutgoingVendorBids(bidsData.outgoing || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('agri_token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`Order status updated to ${newStatus}`);
        await loadData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update order status', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating order status', 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleUpdateStock = async (productId: string) => {
    const parsed = parseInt(newStockQty, 10);
    if (isNaN(parsed) || parsed < 0) {
      showToast('Please enter a valid stock quantity', 'error');
      return;
    }

    setIsUpdatingStock(true);
    try {
      const res = await fetch(`/api/products/${productId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('agri_token')}`
        },
        body: JSON.stringify({ stockQuantity: parsed })
      });

      if (res.ok) {
        showToast('Stock quantity updated successfully! 📦');
        setEditingStockProductId(null);
        setNewStockQty('');
        await loadData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update stock', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error updating stock', 'error');
    } finally {
      setIsUpdatingStock(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductError(null);

    const priceNum = parseFloat(prodPrice);
    if (!prodName.trim()) {
      setProductError('Product name is required.');
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setProductError('Please enter a valid selling price greater than ₹0.');
      return;
    }

    setIsSubmittingProduct(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('agri_token')}`
        },
        body: JSON.stringify({
          name: prodName.trim(),
          brand: prodBrand.trim(),
          category: prodCategory,
          packSize: prodPackSize.trim(),
          price: priceNum,
          mrp: prodMrp ? parseFloat(prodMrp) : priceNum,
          stockQuantity: parseInt(prodStock, 10) || 50,
          description: prodDesc.trim() || 'Verified genuine agricultural input.'
        })
      });

      if (res.ok) {
        setShowAddProductModal(false);
        showToast('Product added to inventory catalog! 🌾');
        setProdName('');
        setProdPrice('');
        setProdMrp('');
        setProdDesc('');
        await loadData();
      } else {
        const err = await res.json();
        setProductError(err.error || 'Failed to add product.');
      }
    } catch (err: any) {
      setProductError(err.message || 'Network error while adding product.');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Open modal to submit purchase offer to a farmer
  const handleOpenBidModal = (lot: any) => {
    setSelectedLotForBid(lot);
    setBidPrice(lot.expectedPricePerUnit.toString());
    setBidQty(lot.quantity.toString());
    setBidPickupDate(lot.harvestDate || new Date().toISOString().split('T')[0]);
    setBidMessage(`We are interested in procuring ${lot.quantity} ${lot.unit} of your ${lot.cropName}. Farm gate truck pickup available.`);
    setBidError(null);
  };

  // Submit purchase offer to farmer
  const handleSubmitBidToFarmer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLotForBid) return;
    setBidError(null);

    const priceNum = parseFloat(bidPrice);
    const qtyNum = parseFloat(bidQty);

    if (isNaN(priceNum) || priceNum <= 0) {
      setBidError('Please enter a valid offer price per unit.');
      return;
    }
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setBidError('Please enter a valid requested quantity.');
      return;
    }

    setIsSubmittingBid(true);
    try {
      const res = await fetch(`/api/produce/${selectedLotForBid.id}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('agri_token')}`
        },
        body: JSON.stringify({
          offeredPricePerUnit: priceNum,
          requestedQuantity: qtyNum,
          message: bidMessage.trim(),
          proposedPickupDate: bidPickupDate
        })
      });

      if (res.ok) {
        setSelectedLotForBid(null);
        showToast(`Purchase offer sent to Farmer ${selectedLotForBid.farmerName}! 📩 The farmer has been notified to confirm or reject.`);
        await loadData();
        setProcurementSubTab('SENT_BIDS');
      } else {
        const err = await res.json();
        setBidError(err.error || 'Failed to send purchase offer to farmer.');
      }
    } catch (err: any) {
      setBidError(err.message || 'Network error while sending offer.');
    } finally {
      setIsSubmittingBid(false);
    }
  };

  // Confirm / Accept Farmer Direct Deal
  const handleConfirmFarmerDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDealForConfirm) return;

    setIsConfirmingDeal(true);
    try {
      const res = await fetch(`/api/produce/vendor-requests/${selectedDealForConfirm.id}/respond`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('agri_token')}`
        },
        body: JSON.stringify({
          status: 'CONFIRMED',
          pickupScheduledDate: confirmPickupDate || selectedDealForConfirm.proposedHarvestDate,
          vendorResponseNotes: confirmNotes.trim() || 'Procurement deal confirmed! Truck will arrive on scheduled pickup date.'
        })
      });

      if (res.ok) {
        setSelectedDealForConfirm(null);
        showToast(`Procurement deal confirmed! 🎉 Farmer ${selectedDealForConfirm.farmerName} has been notified with the gate pass.`);
        await loadData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to confirm deal', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error confirming deal', 'error');
    } finally {
      setIsConfirmingDeal(false);
    }
  };

  // Reject Farmer Direct Deal
  const handleRejectFarmerDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDealForReject) return;

    setIsRejectingDeal(true);
    try {
      const res = await fetch(`/api/produce/vendor-requests/${selectedDealForReject.id}/respond`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('agri_token')}`
        },
        body: JSON.stringify({
          status: 'REJECTED',
          vendorResponseNotes: rejectNotes.trim() || 'Declined due to godown capacity or pricing mismatch.'
        })
      });

      if (res.ok) {
        setSelectedDealForReject(null);
        showToast(`Offer declined. The farmer has been notified with your reason note. ❌`);
        await loadData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to decline offer', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error declining offer', 'error');
    } finally {
      setIsRejectingDeal(false);
    }
  };

  // Filter ready harvests by crop & search
  const filteredHarvests = readyFarmerHarvests.filter(lot => {
    const matchesCrop =
      selectedCropFilter === 'All' ||
      lot.cropName.toLowerCase().includes(selectedCropFilter.toLowerCase()) ||
      lot.variety.toLowerCase().includes(selectedCropFilter.toLowerCase());

    const matchesSearch =
      !cropSearchQuery.trim() ||
      lot.cropName.toLowerCase().includes(cropSearchQuery.toLowerCase()) ||
      lot.farmerName.toLowerCase().includes(cropSearchQuery.toLowerCase()) ||
      lot.village.toLowerCase().includes(cropSearchQuery.toLowerCase()) ||
      lot.district.toLowerCase().includes(cropSearchQuery.toLowerCase());

    return matchesCrop && matchesSearch;
  });

  const totalSales = orders.reduce((acc, o) => (o.status !== 'CANCELLED' ? acc + o.totalAmount : acc), 0);
  const pendingOrders = orders.filter(o => o.status === 'CONFIRMED' || o.status === 'PROCESSING');
  const pendingFarmerDeals = incomingFarmerDeals.filter(d => d.status === 'PENDING');

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

      {/* Top Vendor Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 border border-white/20 text-amber-200 text-xs font-bold mb-2">
            <span>✓ {t('vendorBadgeDepot')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {t('vendorShopName')}
          </h1>
          <p className="text-amber-100 text-xs sm:text-sm mt-0.5">
            {t('vendorDepotSub')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center">
            <span className="text-[10px] font-extrabold text-amber-200 uppercase tracking-wider block">
              {t('totalSalesRevenue')}
            </span>
            <span className="text-2xl font-black text-white">
              ₹{totalSales.toLocaleString('en-IN')}
            </span>
          </div>
          <button
            onClick={() => {
              setProductError(null);
              setShowAddProductModal(true);
            }}
            className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition shadow-lg active:scale-95 text-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addProductBtn')}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase">{t('tabIncomingOrders')}</span>
          <p className="text-xl font-black text-gray-900 mt-1">{orders.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase">{t('tabFarmerDirectOffers')}</span>
          <p className="text-xl font-black text-amber-600 mt-1">
            {pendingFarmerDeals.length} Pending
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase">{t('availableFarmerLots')}</span>
          <p className="text-xl font-black text-emerald-700 mt-1">{readyFarmerHarvests.length} Lots</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase">Customer Rating</span>
          <p className="text-xl font-black text-gray-900 mt-1">4.9 ★ (APMC)</p>
        </div>
      </div>

      {/* Primary Tabs */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl text-xs font-bold overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('PROCUREMENT')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'PROCUREMENT' ? 'bg-white text-emerald-800 shadow-sm font-extrabold' : 'text-gray-600 hover:text-emerald-700'
          }`}
        >
          <span>🌾</span>
          <span>{t('tabProcureFarmers')}</span>
        </button>

        <button
          onClick={() => setActiveTab('FARMER_OFFERS')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'FARMER_OFFERS' ? 'bg-white text-emerald-800 shadow-sm font-extrabold' : 'text-gray-600 hover:text-emerald-700'
          }`}
        >
          <span>📥</span>
          <span>{t('tabFarmerDirectOffers')}</span>
          {pendingFarmerDeals.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-black animate-pulse">
              {pendingFarmerDeals.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'ORDERS' ? 'bg-white text-emerald-800 shadow-sm font-extrabold' : 'text-gray-600 hover:text-emerald-700'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>{t('tabIncomingOrders')} ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('INVENTORY')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'INVENTORY' ? 'bg-white text-emerald-800 shadow-sm font-extrabold' : 'text-gray-600 hover:text-emerald-700'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>{t('tabStoreInventory')} ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('LOGISTICS')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'LOGISTICS' ? 'bg-white text-emerald-800 shadow-sm font-extrabold' : 'text-gray-600 hover:text-emerald-700'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>{t('tabDeliveryFleet')}</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. PROCUREMENT TAB: VENDOR SEARCHES READY FARMERS & SENDS BIDS */}
      {/* ======================================================== */}
      {activeTab === 'PROCUREMENT' && (
        <div className="space-y-4">
          {/* Sub-tabs: Search Harvests vs Sent Bids */}
          <div className="flex bg-white rounded-2xl p-1.5 border border-emerald-100 max-w-md text-xs font-bold">
            <button
              onClick={() => setProcurementSubTab('SEARCH_FARMERS')}
              className={`flex-1 py-2 rounded-xl transition ${
                procurementSubTab === 'SEARCH_FARMERS' ? 'bg-emerald-700 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Ready Farmer Harvests ({filteredHarvests.length})
            </button>
            <button
              onClick={() => setProcurementSubTab('SENT_BIDS')}
              className={`flex-1 py-2 rounded-xl transition ${
                procurementSubTab === 'SENT_BIDS' ? 'bg-emerald-700 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              My Sent Bids to Farmers ({outgoingVendorBids.length})
            </button>
          </div>

          {procurementSubTab === 'SEARCH_FARMERS' ? (
            <div className="space-y-4">
              {/* Crop Search & Filters */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-emerald-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                      <Search className="w-4 h-4 text-emerald-600" />
                      <span>Search Ready Crops to Procure:</span>
                    </h3>
                    <p className="text-xs text-gray-500">
                      Find farmers who have harvested crops ready for wholesale purchase
                    </p>
                  </div>

                  <div className="relative max-w-xs w-full">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search crop, farmer or village..."
                      value={cropSearchQuery}
                      onChange={e => setCropSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
                  {[
                    { label: '🌾 All Crops', value: 'All' },
                    { label: '🥜 Groundnut', value: 'Groundnut' },
                    { label: '🍅 Tomato', value: 'Tomato' },
                    { label: '🌾 Paddy', value: 'Paddy' },
                    { label: '🌸 Flowers', value: 'Flowers' },
                    { label: '🌿 Cotton', value: 'Cotton' },
                    { label: '🌶️ Chilli', value: 'Chilli' },
                    { label: '🧅 Onion', value: 'Onion' }
                  ].map(c => (
                    <button
                      key={c.value}
                      onClick={() => setSelectedCropFilter(c.value)}
                      className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition border ${
                        selectedCropFilter === c.value
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ready Farmers Lot Grid */}
              {filteredHarvests.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-sm space-y-2">
                  <p className="text-3xl">🔍</p>
                  <p className="font-extrabold text-sm text-gray-800">No ready harvests found for this filter</p>
                  <p className="text-xs text-gray-500">Try selecting "All Crops" to view available farmer lots.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredHarvests.map(lot => (
                    <div
                      key={lot.id}
                      className="bg-white rounded-3xl p-5 shadow-sm border border-emerald-100 hover:border-emerald-300 transition space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="relative h-40 rounded-2xl overflow-hidden bg-gray-100">
                          <img
                            src={lot.images?.[0] || 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400'}
                            alt={lot.cropName}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-emerald-800 text-white font-black text-[10px] rounded-md uppercase">
                            {lot.qualityGrade?.replace('_', ' ') || 'GRADE A'}
                          </span>
                          <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 bg-amber-400 text-amber-950 font-black text-[10px] rounded-md uppercase">
                            Ready Lot
                          </span>

                          {lot.photoMetadata && (
                            <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-xs text-white text-[9px] font-mono flex items-center justify-between">
                              <span className="truncate flex items-center gap-1 text-emerald-300 font-bold">
                                <span>📸</span>
                                <span>{lot.photoMetadata.uploadDateFormatted} • {lot.photoMetadata.uploadTimeFormatted}</span>
                              </span>
                              <span className="text-[8px] text-gray-300 font-semibold shrink-0">
                                {lot.photoMetadata.dimensions || 'Field Verified'}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-black text-base text-gray-900">{lot.cropName}</h4>
                            <p className="text-xs text-emerald-800 font-bold">{lot.variety}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-base font-black text-emerald-800">
                              ₹{lot.expectedPricePerUnit.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-gray-400 block font-semibold">
                              Asking / {lot.unit}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                          {lot.description}
                        </p>

                        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                          <div>
                            <span className="text-gray-400 block text-[10px] font-bold">Farmer Lot Size</span>
                            <span className="font-extrabold text-gray-800">{lot.quantity} {lot.unit}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px] font-bold">Harvest Window</span>
                            <span className="font-extrabold text-gray-800">{lot.harvestDate}</span>
                          </div>
                          <div className="col-span-2 flex items-center gap-1 text-[11px] text-gray-500">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Farmer: <strong>{lot.farmerName}</strong> • {lot.village}, {lot.district}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                        {lot.farmerPhone && (
                          <a
                            href={`tel:${lot.farmerPhone}`}
                            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition flex items-center gap-1 font-bold text-xs"
                            title="Call Farmer"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-700" />
                            <span className="hidden sm:inline">Call Farmer</span>
                          </a>
                        )}

                        <button
                          onClick={() => handleOpenBidModal(lot)}
                          className="flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow transition active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          <span>Request This Farmer (Send Offer)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Sent Bids to Farmers Tracker */
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 space-y-4">
              <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                <span>📋</span> Sent Procurement Offers to Farmers ({outgoingVendorBids.length})
              </h3>
              <p className="text-xs text-gray-500">
                Track status of purchase offers you submitted to farmers. Farmers have the choice to accept or decline based on price suitability.
              </p>

              {outgoingVendorBids.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs">
                  No outgoing offers submitted to farmers yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {outgoingVendorBids.map(bid => {
                    const isAccepted = bid.status === 'ACCEPTED';
                    const isRejected = bid.status === 'REJECTED';

                    return (
                      <div
                        key={bid.id}
                        className={`p-4 rounded-2xl border transition text-xs space-y-2.5 ${
                          isAccepted
                            ? 'bg-emerald-50/50 border-emerald-300'
                            : isRejected
                            ? 'bg-red-50/40 border-red-200'
                            : 'bg-gray-50/60 border-gray-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="font-black text-sm text-gray-900">
                              {bid.listing?.cropName || 'Produce Lot'}
                            </span>
                            <span className="text-xs text-gray-500 block">
                              Farmer: <strong>{bid.listing?.farmerName}</strong> • {bid.listing?.village}, {bid.listing?.district}
                            </span>
                          </div>

                          <div>
                            {isAccepted ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-600 text-white font-black text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>CONFIRMED BY FARMER</span>
                              </span>
                            ) : isRejected ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-red-600 text-white font-black text-xs">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>DECLINED BY FARMER</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-400 text-amber-950 font-black text-xs animate-pulse">
                                <Clock className="w-3.5 h-3.5" />
                                <span>AWAITING FARMER CHOICE</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white border border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <span className="text-gray-400 text-[10px] font-bold block">Your Offered Rate</span>
                            <span className="font-black text-emerald-800">₹{bid.offeredPricePerUnit} / {bid.listing?.unit}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 text-[10px] font-bold block">Requested Quantity</span>
                            <span className="font-black text-gray-800">{bid.requestedQuantity} {bid.listing?.unit}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 text-[10px] font-bold block">Total Deal Value</span>
                            <span className="font-black text-emerald-800">
                              ₹{(bid.offeredPricePerUnit * bid.requestedQuantity).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 text-[10px] font-bold block">Pickup Date</span>
                            <span className="font-extrabold text-gray-700">{bid.proposedPickupDate || 'On harvest'}</span>
                          </div>
                        </div>

                        {bid.farmerReason && (
                          <div className="p-2 rounded-xl bg-red-100/60 text-red-950 border border-red-200 text-[11px]">
                            <strong>Farmer Decline Reason:</strong> "{bid.farmerReason}"
                          </div>
                        )}

                        {bid.responseNotes && (
                          <div className="p-2 rounded-xl bg-emerald-100/60 text-emerald-950 border border-emerald-200 text-[11px]">
                            <strong>Farmer Acceptance Note:</strong> "{bid.responseNotes}"
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. FARMER DIRECT OFFERS (INCOMING HARVEST REQUESTS TO VENDOR) */}
      {/* ======================================================== */}
      {activeTab === 'FARMER_OFFERS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                <span>📥</span> {t('farmerDirectSellRequests')} ({incomingFarmerDeals.length})
              </h3>
              <p className="text-xs text-gray-500">
                {t('farmersOfferingDirect')}
              </p>
            </div>

            {incomingFarmerDeals.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-xs">
                No direct farmer offers received yet. When farmers select your business to sell crops, they will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {incomingFarmerDeals.map(deal => {
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

                          <p className="text-xs text-emerald-800 font-bold mt-0.5">
                            Farmer: <strong>{deal.farmerName}</strong> • {deal.farmerVillage}, {deal.farmerDistrict}
                          </p>

                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span>Offered Qty: <strong>{deal.quantity} {deal.unit}</strong></span>
                            <span>•</span>
                            <span>Asking Rate: <strong>₹{deal.offeredPricePerUnit.toLocaleString('en-IN')}/{deal.unit}</strong></span>
                            <span>•</span>
                            <span>Total Value: <strong className="text-emerald-800">₹{deal.totalAmount.toLocaleString('en-IN')}</strong></span>
                          </div>
                        </div>

                        <div>
                          {isConfirmed ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-sm">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>DEAL CONFIRMED</span>
                            </span>
                          ) : isRejected ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-600 text-white text-xs font-black shadow-sm">
                              <XCircle className="w-4 h-4" />
                              <span>OFFER DECLINED</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400 text-amber-950 text-xs font-black shadow-sm animate-pulse">
                              <Clock className="w-4 h-4" />
                              <span>ACTION REQUIRED</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-white/80 border border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400 text-[10px] font-bold block">Proposed Harvest / Handover Date:</span>
                          <span className="font-extrabold text-gray-800">{deal.proposedHarvestDate}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 text-[10px] font-bold block">Delivery Preference:</span>
                          <span className="font-extrabold text-gray-800">
                            {deal.deliveryPreference === 'FARM_GATE_PICKUP' ? '🚛 Farm Gate Truck Pickup' : '🚜 Farmer Deliver to Godown'}
                          </span>
                        </div>
                        {deal.notes && (
                          <div className="col-span-1 sm:col-span-2 pt-2 border-t border-gray-100">
                            <span className="text-[10px] font-bold text-gray-400 block">Farmer Instructions:</span>
                            <p className="text-xs text-gray-700 italic">"{deal.notes}"</p>
                          </div>
                        )}
                        {deal.vendorResponseNotes && (
                          <div className="col-span-1 sm:col-span-2 pt-2 border-t border-gray-100">
                            <span className="text-[10px] font-bold text-gray-400 block">Your Response Note:</span>
                            <p className="text-xs text-gray-800 font-semibold italic">"{deal.vendorResponseNotes}"</p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons for Vendor */}
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                        {deal.farmerPhone && (
                          <a
                            href={`tel:${deal.farmerPhone}`}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition flex items-center gap-1 font-bold text-xs"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Call Farmer</span>
                          </a>
                        )}

                        {isPending && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedDealForConfirm(deal);
                                setConfirmPickupDate(deal.proposedHarvestDate);
                                setConfirmNotes(`Deal accepted! We will send our logistics truck on ${deal.proposedHarvestDate} morning with electronic weigh scales.`);
                              }}
                              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{t('acceptOffer')}</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedDealForReject(deal);
                                setRejectNotes('Godown currently at maximum storage capacity for this commodity.');
                              }}
                              className="px-3 py-2 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-700 font-bold text-xs rounded-xl transition flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>{t('declineOffer')}</span>
                            </button>
                          </div>
                        )}
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
      {/* 3. CUSTOMER ORDERS TAB */}
      {/* ======================================================== */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 space-y-4">
            <h3 className="font-extrabold text-base text-gray-900">
              {t('customerOrdersHeading')} ({orders.length})
            </h3>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">{t('noOrdersYet')}</div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => (
                  <div key={order.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-gray-900">{order.orderNumber}</span>
                      <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900">
                        {order.status}
                      </span>
                    </div>
                    <div className="text-gray-600">
                      <span>{t('Total')}: <strong>₹{order.totalAmount}</strong></span> • <span>Payment: <strong>{order.paymentMethod} ({order.paymentStatus})</strong></span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      {order.status === 'PROCESSING' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'SHIPPED')}
                          disabled={updatingOrderId === order.id}
                          className="px-3 py-1.5 bg-emerald-700 text-white rounded-xl font-bold"
                        >
                          {t('dispatchDelivery')}
                        </button>
                      )}
                      {order.status === 'SHIPPED' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'DELIVERED')}
                          disabled={updatingOrderId === order.id}
                          className="px-3 py-1.5 bg-emerald-700 text-white rounded-xl font-bold"
                        >
                          {t('markDelivered')}
                        </button>
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
      {/* 4. INVENTORY TAB */}
      {/* ======================================================== */}
      {activeTab === 'INVENTORY' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-base text-gray-900">{t('tabStoreInventory')} ({products.length})</h3>
            <button
              onClick={() => setShowAddProductModal(true)}
              className="px-3 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold"
            >
              {t('addProductBtn')}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {products.map(p => (
              <div key={p.id} className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-gray-900">{p.name}</h4>
                  <p className="text-gray-500">{p.brand} • {p.packSize}</p>
                  <p className="text-emerald-800 font-black mt-1">₹{p.price}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-gray-700 block">Stock: {p.stockQuantity}</span>
                  <button
                    onClick={() => {
                      setEditingStockProductId(p.id);
                      setNewStockQty(p.stockQuantity.toString());
                    }}
                    className="text-[11px] text-emerald-700 font-bold hover:underline"
                  >
                    Edit Stock
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. LOGISTICS TAB */}
      {/* ======================================================== */}
      {activeTab === 'LOGISTICS' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 space-y-4">
          <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-600" />
            <span>Transport & Delivery Telematics</span>
          </h3>
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-2">
            <p><strong>Assigned Fleet:</strong> {assignedDriver}</p>
            <p><strong>Live Status:</strong> <span className="text-emerald-700 font-bold">{driverStatus}</span></p>
            <p><strong>Telemetry:</strong> {driverLocation}</p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: SUBMIT PURCHASE BID TO FARMER */}
      {/* ======================================================== */}
      {selectedLotForBid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 relative space-y-4">
            <button
              onClick={() => setSelectedLotForBid(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase mb-1">
                Wholesale Procurement Bid
              </div>
              <h3 className="text-lg font-black text-gray-900">
                Purchase Offer to Farmer {selectedLotForBid.farmerName}
              </h3>
              <p className="text-xs text-gray-500">
                Crop: <strong>{selectedLotForBid.cropName}</strong> • Asking: ₹{selectedLotForBid.expectedPricePerUnit}/{selectedLotForBid.unit}
              </p>
            </div>

            {bidError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bidError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitBidToFarmer} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Your Offer Price (₹/{selectedLotForBid.unit}) *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={bidPrice}
                    onChange={e => setBidPrice(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 font-extrabold text-emerald-800"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Quantity ({selectedLotForBid.unit}) *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={bidQty}
                    onChange={e => setBidQty(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 font-extrabold text-gray-900"
                    required
                  />
                </div>
              </div>

              {/* Total Calculation Banner */}
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-950 font-bold">
                <span>Total Offer Amount:</span>
                <span className="text-base font-black text-amber-900">
                  ₹{(parseFloat(bidQty || '0') * parseFloat(bidPrice || '0')).toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Proposed Pickup / Logistics Date</label>
                <input
                  type="date"
                  value={bidPickupDate}
                  onChange={e => setBidPickupDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Message to Farmer (Pickup terms & Payment)</label>
                <textarea
                  value={bidMessage}
                  onChange={e => setBidMessage(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingBid}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black rounded-2xl shadow transition text-xs active:scale-95 flex items-center justify-center gap-2"
              >
                {isSubmittingBid ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Offer to Farmer...</span>
                  </>
                ) : (
                  <span>Send Purchase Offer to Farmer</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIRM FARMER DIRECT DEAL */}
      {/* ======================================================== */}
      {selectedDealForConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 relative space-y-4">
            <button
              onClick={() => setSelectedDealForConfirm(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl mx-auto">
                🤝
              </div>
              <h3 className="text-lg font-black text-gray-900">
                Confirm Procurement Deal
              </h3>
              <p className="text-xs text-gray-500">
                Farmer: <strong>{selectedDealForConfirm.farmerName}</strong> • {selectedDealForConfirm.quantity} {selectedDealForConfirm.unit} {selectedDealForConfirm.cropName} (₹{selectedDealForConfirm.totalAmount.toLocaleString('en-IN')})
              </p>
            </div>

            <form onSubmit={handleConfirmFarmerDeal} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Scheduled Pickup Date</label>
                <input
                  type="date"
                  value={confirmPickupDate}
                  onChange={e => setConfirmPickupDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Confirmation Note & Logistics Details</label>
                <textarea
                  value={confirmNotes}
                  onChange={e => setConfirmNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isConfirmingDeal}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black rounded-2xl shadow transition text-xs active:scale-95 flex items-center justify-center gap-2"
              >
                {isConfirmingDeal ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Locking Deal & Notifying Farmer...</span>
                  </>
                ) : (
                  <span>Confirm Deal & Generate Gate Pass</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REJECT FARMER DIRECT DEAL */}
      {/* ======================================================== */}
      {selectedDealForReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-100 relative space-y-4">
            <button
              onClick={() => setSelectedDealForReject(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-black text-gray-900">
                Decline Offer from {selectedDealForReject.farmerName}
              </h3>
              <p className="text-xs text-gray-500">
                Crop: {selectedDealForReject.cropName} • Offered Price: ₹{selectedDealForReject.offeredPricePerUnit}/{selectedDealForReject.unit}
              </p>
            </div>

            <form onSubmit={handleRejectFarmerDeal} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Reason for Declining (Visible to Farmer):</label>
                <textarea
                  value={rejectNotes}
                  onChange={e => setRejectNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                {[
                  'Godown full capacity',
                  'Price above current mandi rate',
                  'Lot size too small'
                ].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRejectNotes(r)}
                    className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[10px] font-semibold text-gray-700"
                  >
                    {r}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={isRejectingDeal}
                className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black rounded-2xl shadow transition text-xs active:scale-95 flex items-center justify-center gap-2"
              >
                {isRejectingDeal ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Declining...</span>
                  </>
                ) : (
                  <span>Confirm Decline & Notify Farmer</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD PRODUCT TO STORE CATALOG */}
      {/* ======================================================== */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-emerald-100 relative space-y-4">
            <button
              onClick={() => setShowAddProductModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-gray-900">Add Agricultural Product to Store</h3>
            <p className="text-xs text-gray-500">List certified seeds, fertilizers, or tools for local farmers to purchase.</p>

            {productError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{productError}</span>
              </div>
            )}

            <form onSubmit={handleAddProduct} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={prodName}
                    onChange={e => setProdName(e.target.value)}
                    placeholder="e.g. Urea 46% N"
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Brand / Manufacturer</label>
                  <input
                    type="text"
                    value={prodBrand}
                    onChange={e => setProdBrand(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Category</label>
                <select
                  value={prodCategory}
                  onChange={e => setProdCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="FERTILIZER">Fertilizers & Nutrients</option>
                  <option value="SEEDS">Certified Seeds</option>
                  <option value="CROP_PROTECTION">Crop Protection (Pesticides / Bio)</option>
                  <option value="EQUIPMENT">Farm Machinery & Tools</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={prodPrice}
                    onChange={e => setProdPrice(e.target.value)}
                    placeholder="e.g. 268"
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={prodMrp}
                    onChange={e => setProdMrp(e.target.value)}
                    placeholder="e.g. 290"
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={prodStock}
                    onChange={e => setProdStock(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Pack Size / Net Weight</label>
                <input
                  type="text"
                  value={prodPackSize}
                  onChange={e => setProdPackSize(e.target.value)}
                  placeholder="e.g. 45 kg Bag or 500 ml Bottle"
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Usage Guidance & Description</label>
                <textarea
                  value={prodDesc}
                  onChange={e => setProdDesc(e.target.value)}
                  rows={2}
                  placeholder="Mention application method, dosage, safety precautions..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingProduct}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow transition text-xs active:scale-95 flex items-center justify-center gap-2"
              >
                {isSubmittingProduct ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Listing Product...</span>
                  </>
                ) : (
                  <span>Publish Product to Store</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
