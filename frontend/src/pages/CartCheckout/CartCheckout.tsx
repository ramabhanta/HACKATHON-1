import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  QrCode,
  Truck,
  ArrowRight,
  MapPin,
  Sparkles
} from 'lucide-react';

interface CartCheckoutProps {
  setActiveTab: (tab: string) => void;
}

export const CartCheckout: React.FC<CartCheckoutProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { items, updateQuantity, removeFromCart, clearCart, subtotal, deliveryFee, totalAmount } = useCart();

  const [name, setName] = useState(user?.name || 'Ramesh Patel');
  const [phone, setPhone] = useState(user?.phone || '+91 98480 12345');
  const [village, setVillage] = useState(user?.village || 'Kadiri Rural');
  const [district, setDistrict] = useState(user?.district || 'Sri Sathya Sai');
  const [state, setState] = useState(user?.state || 'Andhra Pradesh');
  const [pincode, setPincode] = useState('515591');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARDS' | 'COD'>('UPI');
  const [isPlacing, setIsPlacing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<any | null>(null);

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;

    setIsPlacing(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('agri_token')}`
        },
        body: JSON.stringify({
          items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
          deliveryAddress: { name, phone, village, district, state, pincode },
          paymentMethod
        })
      });

      if (res.ok) {
        const orderData = await res.json();
        setConfirmedOrder(orderData);
        clearCart();
      } else {
        const err = await res.json();
        alert(`Order placement failed: ${err.error}`);
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      setIsPlacing(false);
    }
  };

  if (confirmedOrder) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 shadow-sm border border-emerald-200 text-center space-y-5 animate-in zoom-in-95 duration-200">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Order Confirmed & Placed!
          </span>
          <h2 className="text-2xl font-black text-gray-900 mt-2">
            Order #{confirmedOrder.orderNumber}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Vendor: <strong>{confirmedOrder.vendorName}</strong>
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-left text-xs space-y-2">
          <div className="flex justify-between font-semibold text-gray-700">
            <span>Payment Method:</span>
            <span className="text-emerald-800 uppercase font-bold">{confirmedOrder.paymentMethod}</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-700">
            <span>Estimated Delivery:</span>
            <span className="font-bold text-gray-900">{confirmedOrder.estimatedDeliveryDate}</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-700">
            <span>Delivery Village:</span>
            <span>{confirmedOrder.deliveryAddress.village}, {confirmedOrder.deliveryAddress.district}</span>
          </div>
          <div className="pt-2 border-t border-gray-200 flex justify-between font-extrabold text-sm text-gray-900">
            <span>Total Amount Paid:</span>
            <span className="text-emerald-700">₹{confirmedOrder.totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => setActiveTab('orders')}
            className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-2xl shadow transition active:scale-95 text-xs flex items-center justify-center gap-1.5"
          >
            <Truck className="w-4 h-4" />
            <span>Track Live Delivery Status</span>
          </button>
          <button
            onClick={() => {
              setConfirmedOrder(null);
              setActiveTab('home');
            }}
            className="py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition text-xs"
          >
            Back to Farm
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-3xl p-10 text-center shadow-sm border border-gray-100 space-y-4">
        <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto text-3xl">
          🛒
        </div>
        <h2 className="text-xl font-black text-gray-900">Your Agricultural Cart is Empty</h2>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          Need fertilizers, certified seeds, or bio-pesticides for your field? Explore verified inputs available nearby.
        </p>
        <button
          onClick={() => setActiveTab('store')}
          className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl shadow-md transition active:scale-95 text-xs inline-flex items-center gap-2"
        >
          <span>Visit Agri Input Store</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">Shopping Cart & Checkout</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {items.length} item(s) from Sri Lakshmi Agri Inputs (Kadiri)
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-bold text-red-600 hover:underline"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-2 space-y-3">
          {items.map(item => (
            <div
              key={item.productId}
              className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-gray-100 shrink-0"
                />
                <div className="truncate">
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    {item.brand}
                  </span>
                  <h3 className="font-extrabold text-sm text-gray-900 truncate mt-0.5">{item.name}</h3>
                  <p className="text-xs text-gray-500">{item.packSize}</p>
                  <p className="text-sm font-black text-emerald-800 mt-1">₹{item.price}</p>
                </div>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
                  <button
                    onClick={() => updateQuantity(item.productId, -1)}
                    className="p-1.5 hover:bg-gray-200 text-gray-600 transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 text-xs font-black text-gray-900">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, 1)}
                    className="p-1.5 hover:bg-gray-200 text-gray-600 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Delivery Address Card */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-emerald-100 space-y-3">
            <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-700" /> Delivery Address
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-gray-500 font-semibold block mb-1">Farmer Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="text-gray-500 font-semibold block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="text-gray-500 font-semibold block mb-1">Village / Mandal</label>
                <input
                  type="text"
                  value={village}
                  onChange={e => setVillage(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="text-gray-500 font-semibold block mb-1">District / Pincode</label>
                <input
                  type="text"
                  value={`${district}, ${pincode}`}
                  onChange={e => setDistrict(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Payment & Summary */}
        <div className="space-y-4">
          {/* Payment Method */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-emerald-100 space-y-3">
            <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
              Select Payment Method
            </h3>

            <div className="space-y-2">
              <label
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                  paymentMethod === 'UPI' ? 'border-emerald-600 bg-emerald-50/50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <QrCode className="w-5 h-5 text-emerald-700" />
                  <div>
                    <p className="text-xs font-bold text-gray-900">UPI / QR Code</p>
                    <p className="text-[10px] text-gray-500">GPay, PhonePe, Paytm</p>
                  </div>
                </div>
                <input type="radio" checked={paymentMethod === 'UPI'} readOnly className="accent-emerald-600" />
              </label>

              <label
                onClick={() => setPaymentMethod('COD')}
                className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                  paymentMethod === 'COD' ? 'border-emerald-600 bg-emerald-50/50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Truck className="w-5 h-5 text-emerald-700" />
                  <div>
                    <p className="text-xs font-bold text-gray-900">Cash on Delivery (COD)</p>
                    <p className="text-[10px] text-gray-500">Pay when goods reach farm gate</p>
                  </div>
                </div>
                <input type="radio" checked={paymentMethod === 'COD'} readOnly className="accent-emerald-600" />
              </label>
            </div>

            {paymentMethod === 'UPI' && (
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                <span className="text-[10px] text-emerald-800 font-bold block uppercase">AgroDex Secure UPI</span>
                <span className="text-xs font-mono font-bold text-emerald-950">agrodex@icici</span>
              </div>
            )}
          </div>

          {/* Bill Summary */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-emerald-100 space-y-3">
            <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
              Bill Summary
            </h3>

            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee:</span>
                <span className={`font-semibold ${deliveryFee === 0 ? 'text-emerald-700' : 'text-gray-900'}`}>
                  {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-100 flex justify-between font-black text-sm text-gray-900">
                <span>Total Amount:</span>
                <span className="text-emerald-800">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isPlacing}
              className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black rounded-2xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 text-xs uppercase tracking-wide"
            >
              {isPlacing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Confirming Order...</span>
                </>
              ) : (
                <>
                  <span>Place Order (₹{totalAmount.toLocaleString('en-IN')})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
