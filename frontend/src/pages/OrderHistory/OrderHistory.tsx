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
  RotateCcw
} from 'lucide-react';

interface OrderHistoryProps {
  setActiveTab: (tab: string) => void;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch('/api/orders', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('agri_token')}`
          }
        });
        if (res.ok) {
          setOrders(await res.json());
        }
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Delivered</span>;
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">Out for Delivery</span>;
      case 'PROCESSING':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Packing at Depot</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800">Confirmed</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">My Farm Orders & Deliveries</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Track certified seeds, fertilizers, and equipment dispatch
          </p>
        </div>
        <button
          onClick={() => setActiveTab('store')}
          className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition"
        >
          + Order Inputs
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-gray-100">
          <p className="text-sm font-semibold text-gray-500">You have no active orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div
              key={order.id}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4"
            >
              {/* Top order summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-gray-900">
                      Order #{order.orderNumber}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Placed on {new Date(order.createdAt).toLocaleDateString()} • Vendor: <strong>{order.vendorName}</strong>
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-sm font-black text-emerald-800">
                    ₹{order.totalAmount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-gray-500 block uppercase font-bold">
                    Paid via {order.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Items in order */}
              <div className="space-y-2">
                {order.items?.map((it: any) => (
                  <div key={it.id} className="flex justify-between items-center text-xs text-gray-700 py-1">
                    <span>
                      <strong>{it.quantity}x</strong> {it.productName} ({it.packSize})
                    </span>
                    <span className="font-bold">₹{it.price * it.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Live Tracking Timeline */}
              <div className="pt-3 border-t border-gray-100">
                <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-3">
                  Live Dispatch Milestone History:
                </p>

                <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-200">
                  {order.trackingUpdates?.map((step: any, idx: number) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-emerald-600 ring-4 ring-emerald-50"></div>
                      <p className="text-xs font-bold text-gray-900">{step.message}</p>
                      <span className="text-[10px] text-gray-400">
                        {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {new Date(step.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery destination */}
              <div className="bg-gray-50 p-3 rounded-2xl flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  <span>Delivering to: {order.deliveryAddress.village}, {order.deliveryAddress.district}</span>
                </div>
                <span className="font-bold text-emerald-800">Est. Arrival: {order.estimatedDeliveryDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
