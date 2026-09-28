import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  Navigation,
  Phone,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Check,
  XCircle,
  Building2,
  Sparkles,
  ShoppingBag,
  FileDown
} from 'lucide-react';
import { CountdownTimer } from '../../components/CountdownTimer';
import { subscribeToTable } from '../../services/supabaseClient';
import { exportOrderInvoicePDF } from '../../utils/reportExport';

interface OrderHistoryProps {
  setActiveTab: (tab: string) => void;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'COMPLETED'>('ALL');
  const [transferringOrderId, setTransferringOrderId] = useState<string | null>(null);
  const [selectedTransferShops, setSelectedTransferShops] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleDownloadInvoice = (order: any) => {
    setDownloadingInvoiceId(order.id);
    showToast('Generating official Agri Store Invoice PDF... 📄');
    setTimeout(() => {
      try {
        exportOrderInvoicePDF({
          id: order.id,
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          farmerName: order.farmerName || user?.name || 'Registered Farmer',
          vendorName: order.shopDetails?.name || order.vendorName,
          deliveryAddress: order.deliveryAddress,
          items: (order.items || []).map((it: any) => ({
            name: it.productName || it.name || 'Agri Item',
            quantity: it.quantity || 1,
            unitPrice: it.price || it.unitPrice || 0,
            price: it.price || it.unitPrice || 0,
            unit: it.packSize || 'pack'
          })),
          totalAmount: order.totalAmount || 0,
          paymentMethod: order.paymentMethod || 'PAY_ON_PICKUP',
          paymentStatus: order.paymentStatus || 'PENDING',
          status: order.status || 'PLACED',
          collectionOtp: order.collectionOtp
        });
        showToast('Invoice downloaded successfully! ✅');
      } catch (err) {
        showToast('Failed to generate invoice PDF', 'error');
      } finally {
        setDownloadingInvoiceId(null);
      }
    }, 350);
  };

  const loadOrders = async () => {
    try {
      const res = await fetch('/api/orders', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('agri_token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 15000);

    let channel: any = null;
    try {
      channel = subscribeToTable('orders', {
        onChange: () => {
          console.log('⚡ Realtime order update received! Refetching orders...');
          loadOrders();
        }
      });
    } catch (e) {
      console.warn('Realtime subscription error in OrderHistory:', e);
    }

    return () => {
      clearInterval(interval);
      if (channel) channel.unsubscribe();
    };
  }, []);

  const handleTransferOrder = async (orderId: string, fallbackShopId?: string) => {
    setTransferringOrderId(orderId);
    const targetShopId = selectedTransferShops[orderId] || fallbackShopId;

    try {
      const res = await fetch(`/api/orders/${orderId}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('agri_token')}`
        },
        body: JSON.stringify({ targetShopId })
      });

      if (res.ok) {
        const transferred = await res.json();
        showToast(`🎉 Reservation transferred to ${transferred.vendorName}! A fresh 24h dealer response window has started.`);
        await loadOrders();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to transfer order to alternative shop', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error transferring reservation', 'error');
    } finally {
      setTransferringOrderId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_OWNER_CONFIRMATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>Awaiting Dealer Confirmation</span>
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Confirmed • Pickup OTP Active</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-900 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-700" />
            <span>Booking Declined by Dealer</span>
          </span>
        );
      case 'EXPIRED_AUTO_CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gray-100 text-gray-700 border border-gray-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>24h SLA Auto-Expired</span>
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Delivered / Picked Up</span>
          </span>
        );
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-900">
            <Truck className="w-3.5 h-3.5 text-blue-700" />
            <span>Out for Delivery</span>
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900">
            <Package className="w-3.5 h-3.5 text-amber-700" />
            <span>Packing at Depot</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const pendingBookings = orders.filter(o => o.status === 'PENDING_OWNER_CONFIRMATION');
  const acceptedBookings = orders.filter(o => o.status === 'ACCEPTED');
  const needsReroute = orders.filter(o => o.status === 'REJECTED' || o.status === 'EXPIRED_AUTO_CANCELLED');

  const filteredOrders = orders.filter(order => {
    if (activeFilter === 'PENDING') return order.status === 'PENDING_OWNER_CONFIRMATION';
    if (activeFilter === 'ACCEPTED') return order.status === 'ACCEPTED';
    if (activeFilter === 'COMPLETED') return order.status === 'DELIVERED' || order.status === 'REJECTED' || order.status === 'EXPIRED_AUTO_CANCELLED' || order.status === 'CANCELLED';
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Toast Alert */}
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

      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold mb-2">
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-700" />
            <span>Agri Store Booking Desk</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            My Farm Input Orders & Reservations
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Track certified seeds, fertilizers, nearby store reservations, and collection OTPs with zero online debit
          </p>
        </div>
        <button
          onClick={() => setActiveTab('store')}
          className="px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold rounded-2xl transition shadow-md active:scale-95 flex items-center gap-2 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>+ Reserve Agri Inputs</span>
        </button>
      </div>

      {/* Re-route Urgency Banner if any order was declined or expired */}
      {needsReroute.length > 0 && (
        <div className="p-4 rounded-3xl bg-amber-500/15 border border-amber-300 flex items-start gap-3.5 text-xs text-amber-950">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-black text-sm">
              {needsReroute.length} of your booking requests need re-routing!
            </p>
            <p className="text-amber-900/90 leading-relaxed text-[11px]">
              A dealer was either out of stock or did not respond within the 24-hour window. Use the one-click transfer button below to instantly re-route your items to the next nearest dealer.
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl text-xs font-bold overflow-x-auto gap-1">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-4 py-2 rounded-xl transition ${
            activeFilter === 'ALL' ? 'bg-white text-emerald-800 shadow-sm font-extrabold' : 'text-gray-600 hover:text-emerald-700'
          }`}
        >
          All Orders ({orders.length})
        </button>

        <button
          onClick={() => setActiveFilter('PENDING')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeFilter === 'PENDING' ? 'bg-white text-amber-900 shadow-sm font-extrabold' : 'text-gray-600 hover:text-amber-800'
          }`}
        >
          <span>⏳ Awaiting Dealer</span>
          {pendingBookings.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-black">
              {pendingBookings.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveFilter('ACCEPTED')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            activeFilter === 'ACCEPTED' ? 'bg-white text-emerald-900 shadow-sm font-extrabold' : 'text-gray-600 hover:text-emerald-700'
          }`}
        >
          <span>🔐 Ready for Pickup</span>
          {acceptedBookings.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-black">
              {acceptedBookings.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveFilter('COMPLETED')}
          className={`px-4 py-2 rounded-xl transition ${
            activeFilter === 'COMPLETED' ? 'bg-white text-emerald-800 shadow-sm font-extrabold' : 'text-gray-600 hover:text-emerald-700'
          }`}
        >
          Delivered / History
        </button>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs text-gray-500 font-bold">Loading your farm reservations...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 space-y-3">
          <div className="text-4xl">🌾</div>
          <p className="text-base font-extrabold text-gray-800">No orders found in this view</p>
          <p className="text-xs text-gray-500">
            {activeFilter === 'PENDING'
              ? 'You have no pending dealer confirmations right now.'
              : 'Reserve subsidized fertilizers, certified seeds, and equipment from verified Kadiri dealers with zero upfront debit.'}
          </p>
          <button
            onClick={() => setActiveTab('store')}
            className="mt-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow transition"
          >
            Browse Agri Store
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map(order => {
            const isPending = order.status === 'PENDING_OWNER_CONFIRMATION';
            const isAccepted = order.status === 'ACCEPTED';
            const isRejected = order.status === 'REJECTED';
            const isExpired = order.status === 'EXPIRED_AUTO_CANCELLED';
            const canTransfer = isRejected || isExpired;
            const shopName = order.shopDetails?.name || order.vendorName;
            const alternativeShops = order.alternativeShops || [];
            const nextShop = alternativeShops[0];

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl p-5 sm:p-6 shadow-sm border transition space-y-4 ${
                  isPending
                    ? 'border-amber-300 ring-2 ring-amber-100/60 bg-gradient-to-b from-amber-50/20 to-white'
                    : isAccepted
                    ? 'border-emerald-300 ring-2 ring-emerald-100/60 bg-gradient-to-b from-emerald-50/20 to-white'
                    : canTransfer
                    ? 'border-rose-200 bg-rose-50/10'
                    : 'border-gray-100'
                }`}
              >
                {/* Header Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-base text-gray-900">
                        Order #{order.orderNumber}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                      <span>Placed on {new Date(order.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Dealer: <strong>{shopName}</strong></span>
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                    <div>
                      <span className="text-base font-black text-emerald-800">
                        ₹{order.totalAmount?.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-gray-500 hidden sm:block uppercase font-bold">
                        Zero Online Debit • Cash/UPI on Pickup
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownloadInvoice(order)}
                      disabled={downloadingInvoiceId === order.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 border border-gray-200 rounded-xl text-xs font-bold transition active:scale-95 disabled:opacity-50"
                      title="Download Official Tax Invoice PDF"
                    >
                      {downloadingInvoiceId === order.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FileDown className="w-3.5 h-3.5 text-emerald-700" />
                      )}
                      <span>Invoice PDF</span>
                    </button>
                  </div>
                </div>

                {/* ============================================================ */}
                {/* 1. PENDING DEALER CONFIRMATION (LIVE 24-HOUR COUNTDOWN CLOCK) */}
                {/* ============================================================ */}
                {isPending && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                        ⏳
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-xs text-amber-950">
                            Awaiting Confirmation from {shopName}
                          </h4>
                        </div>
                        <p className="text-[11px] text-amber-900/90 mt-0.5 leading-relaxed">
                          Dealer has a 24-hour SLA to verify physical godown stock. If not confirmed in time, you can re-route with one click.
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <CountdownTimer expiresAt={order.expiresAt} urgencyThresholdHours={4} />
                    </div>
                  </div>
                )}

                {/* ============================================================ */}
                {/* 2. ACCEPTED STATE: COLLECTION OTP & GOOGLE MAPS NAVIGATION   */}
                {/* ============================================================ */}
                {isAccepted && order.collectionOtp && (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-md space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-emerald-100 text-[10px] font-black uppercase mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Reservation Confirmed by Dealer</span>
                        </div>
                        <h4 className="text-lg font-black text-white">
                          Ready for Counter Collection!
                        </h4>
                        <p className="text-xs text-emerald-100 mt-0.5">
                          Present this 4-digit OTP at the store counter upon payment & pickup
                        </p>
                      </div>

                      {/* Huge OTP Box */}
                      <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/30 text-center shrink-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200 block">
                          Collection OTP
                        </span>
                        <span className="text-3xl font-black tracking-widest text-amber-300 font-mono">
                          {order.collectionOtp}
                        </span>
                      </div>
                    </div>

                    {/* Dealer Location & Navigation Links */}
                    <div className="bg-black/20 backdrop-blur-sm p-3.5 rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-extrabold text-white flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-amber-300" />
                          <span>{shopName}</span>
                          {order.shopDetails?.distanceKm && (
                            <span className="text-emerald-200 font-normal">
                              ({order.shopDetails.distanceKm} km away)
                            </span>
                          )}
                        </span>
                        <p className="text-emerald-100 text-[11px] mt-0.5">
                          {order.shopDetails?.address || 'Main Bazaar, Near Old Bus Stand, Kadiri'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {order.shopDetails?.phone && (
                          <a
                            href={`tel:${order.shopDetails.phone}`}
                            className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold transition flex items-center gap-1.5 text-xs"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call Shop</span>
                          </a>
                        )}

                        <a
                          href={order.shopDetails?.mapUrl || `https://maps.google.com/?q=${encodeURIComponent(shopName + ' Kadiri')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black rounded-xl transition flex items-center gap-1.5 text-xs shadow-md"
                        >
                          <Navigation className="w-3.5 h-3.5 text-amber-950" />
                          <span>Open in Google Maps</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* ============================================================ */}
                {/* 3. REJECTED / EXPIRED: ONE-CLICK TRANSFER TO NEXT NEAREST SHOP */}
                {/* ============================================================ */}
                {canTransfer && (
                  <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black shrink-0">
                        {isRejected ? <XCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-black text-sm text-rose-950">
                          {isRejected
                            ? `Reservation Declined by ${shopName}`
                            : '24-Hour Confirmation Window Expired'}
                        </h4>
                        <p className="text-xs text-rose-900/90">
                          {isRejected
                            ? `Reason: ${order.rejectionReason?.replace(/_/g, ' ') || 'Out of stock'}${order.rejectionNotes ? ` — "${order.rejectionNotes}"` : ''}`
                            : 'The merchant did not respond within the 24h SLA. No money was charged.'}
                        </p>
                      </div>
                    </div>

                    {/* Next Nearest Dealer Recommendation & Transfer CTA */}
                    <div className="p-4 rounded-xl bg-white border border-rose-200 space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-black text-gray-900">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>Instant Re-Routing to Next Nearest Verified Dealer:</span>
                      </div>

                      {alternativeShops.length > 0 ? (
                        <div className="space-y-2">
                          {alternativeShops.slice(0, 3).map((alt: any, idx: number) => {
                            const isSelected = (selectedTransferShops[order.id] || nextShop?.id) === alt.id;
                            return (
                              <label
                                key={alt.id}
                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition text-xs ${
                                  isSelected
                                    ? 'border-emerald-600 bg-emerald-50/60 font-bold text-emerald-950'
                                    : 'border-gray-200 bg-gray-50/50 text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <input
                                    type="radio"
                                    name={`transfer-${order.id}`}
                                    value={alt.id}
                                    checked={isSelected}
                                    onChange={() =>
                                      setSelectedTransferShops(prev => ({
                                        ...prev,
                                        [order.id]: alt.id
                                      }))
                                    }
                                    className="text-emerald-600 focus:ring-emerald-500"
                                  />
                                  <div>
                                    <div className="font-extrabold text-xs">
                                      {alt.name} {idx === 0 && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded ml-1">Next Nearest</span>}
                                    </div>
                                    <div className="text-[11px] text-gray-500">{alt.address}</div>
                                  </div>
                                </div>
                                <span className="text-xs font-black text-emerald-800 shrink-0">
                                  {alt.distanceKm} km away
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-600">
                          Transfer to <strong>Kisan Seva Kendra & Fertilizer Hub</strong> (3.1 km away).
                        </p>
                      )}

                      <button
                        onClick={() => handleTransferOrder(order.id, nextShop?.id || 'shop-2')}
                        disabled={transferringOrderId === order.id}
                        className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black rounded-xl shadow-md transition text-xs flex items-center justify-center gap-2 active:scale-95"
                      >
                        {transferringOrderId === order.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Re-Routing Reservation...</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-4 h-4" />
                            <span>Transfer Request to Next Nearest Shop (Instant 1-Click)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Items in order */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                    Reserved Inputs:
                  </span>
                  <div className="space-y-2">
                    {order.items?.map((it: any, idx: number) => (
                      <div
                        key={it.id || idx}
                        className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/70 border border-gray-100 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 overflow-hidden shrink-0">
                            <img
                              src={it.imageUrl || 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=200'}
                              alt={it.productName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-extrabold text-gray-900">{it.productName}</h5>
                              {it.brandBadge && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">
                                  {it.brandBadge}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              {it.quantity} x {it.packSize} • Rate: ₹{it.price}
                            </div>
                            {it.compositionFormula && (
                              <span className="inline-block mt-0.5 text-[10px] font-mono text-gray-700 bg-white px-1.5 py-0.2 rounded border border-gray-200">
                                🔬 {it.compositionFormula}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="font-black text-emerald-800 text-sm shrink-0">
                          ₹{(it.price * it.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Milestone Tracking Updates Timeline */}
                {order.trackingUpdates && order.trackingUpdates.length > 0 && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2.5">
                      Milestone History:
                    </p>
                    <div className="relative pl-5 space-y-2.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-200">
                      {order.trackingUpdates.map((step: any, idx: number) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-emerald-50"></div>
                          <p className="text-xs font-bold text-gray-900 leading-snug">{step.message}</p>
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                            {new Date(step.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Delivery / Store Destination Info */}
                <div className="bg-gray-50 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>
                      {order.pickupPreference === 'STORE_DELIVERY'
                        ? `Delivery to: ${order.deliveryAddress?.village || 'Kadiri Rural'}, ${order.deliveryAddress?.district || 'Sri Sathya Sai'}`
                        : `Pickup at: ${shopName} (Kadiri)`}
                    </span>
                  </div>
                  <span className="font-extrabold text-emerald-800">
                    {order.pickupPreference === 'STORE_DELIVERY' ? 'Doorstep Village Delivery' : 'Self Counter Pickup'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
