import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { db } from '../database/db.js';
import { SupabaseDataService } from '../database/supabaseDataService.js';
import { Order, OrderItem, AppNotification, OrderStatus, Product } from '../models/types.js';
import { checkAndExpirePendingBookings } from '../services/orderExpiryScheduler.js';
import { v4 as uuidv4 } from 'uuid';

export const orderRouter = Router();

// GET orders for logged in user (Farmer sees own orders; Vendor sees incoming store bookings)
orderRouter.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  
  // Real-time check to ensure any orders past 24 hours are expired immediately
  try {
    await checkAndExpirePendingBookings();
  } catch (e) {
    // continue
  }

  let orders: Order[] = db.getTable('orders');

  if (user.role === 'VENDOR') {
    // Vendor sees orders assigned to their store, or demo vendor orders
    orders = orders.filter(o => o.vendorId === user.id || o.vendorId === 'usr-vendor-1');
  } else if (user.role === 'FARMER') {
    // Farmer sees their own orders
    orders = orders.filter(o => o.farmerId === user.id || o.farmerId === 'usr-farmer-1' || !o.farmerId);
  }

  // Sort latest first
  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json(orders);
});

// POST trigger 24h SLA expiry check (Runs on scheduler & manual triggers)
orderRouter.post('/check-expiry', async (_req, res) => {
  const expiredCount = await checkAndExpirePendingBookings();
  return res.json({ expiredCount, timestamp: new Date().toISOString() });
});

// GET single order
orderRouter.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const order = db.findById('orders', req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  return res.json(order);
});

// POST create Agri Store Booking Request (Zero instant debit, 24-Hour Confirmation Window)
orderRouter.post('/booking', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const {
    items,
    shopId,
    pickupPreference = 'COUNTER_PICKUP',
    deliveryAddress,
    notes
  } = req.body as {
    items: { productId: string; quantity: number }[];
    shopId?: string;
    pickupPreference?: 'COUNTER_PICKUP' | 'STORE_DELIVERY';
    deliveryAddress?: any;
    notes?: string;
  };

  if (!items || !items.length) {
    return res.status(400).json({ error: 'Booking must contain at least one item' });
  }

  const allShops = db.getTable('shops');
  const targetShop = allShops.find(s => s.id === shopId) || allShops[0] || {
    id: 'shop-1',
    name: 'Sri Lakshmi Agri Inputs & Seeds Depot',
    ownerName: 'Sri Lakshmi Agri Traders',
    phone: '+91 98490 54321',
    address: 'Shop #14, Main Bazaar, Near Old Bus Stand, Kadiri',
    district: 'Sri Sathya Sai',
    state: 'Andhra Pradesh',
    pincode: '515591',
    distanceKm: 2.3,
    googleMapsUrl: 'https://maps.google.com/?q=14.1120,78.1601'
  };

  const alternativeShops = allShops
    .filter(s => s.id !== targetShop.id)
    .map(s => ({
      id: s.id,
      name: s.name,
      distanceKm: s.distanceKm || 3.5,
      phone: s.phone,
      address: s.address
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const orderItems: OrderItem[] = [];
  let subtotal = 0;

  for (const it of items) {
    let prod = db.findById('products', it.productId);
    if (!prod && (it as any).productName) {
      prod = db.getTable('products').find(p => p.name?.toLowerCase() === (it as any).productName?.toLowerCase());
    }

    const price = prod ? (prod.subsidyDiscountedRate || prod.price) : ((it as any).price || (it as any).subsidyDiscountedRate || 350);
    const productName = prod ? prod.name : ((it as any).productName || (it as any).name || 'Agricultural Input Item');
    const brand = prod ? prod.brand : ((it as any).brand || 'AgriConnect Certified');
    const brandBadge = prod ? (prod.brandBadge || prod.brand) : ((it as any).brandBadge || brand);
    const mrp = prod ? prod.mrp : ((it as any).mrp || Math.round(price * 1.25));
    const packSize = prod ? prod.packSize : ((it as any).packSize || '1 Pack');
    const imageUrl = (prod?.images?.[0]) || ((it as any).imageUrl || (it as any).image || 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=400');
    const compositionFormula = prod?.compositionFormula || (it as any).compositionFormula || 'Standard Agronomic Composition';

    orderItems.push({
      id: `item-${uuidv4().substring(0, 8)}`,
      orderId: '',
      productId: prod?.id || it.productId || `prod-${uuidv4().substring(0, 6)}`,
      productName,
      brand,
      brandBadge,
      price,
      mrp,
      subsidyDiscountedRate: prod?.subsidyDiscountedRate || price,
      quantity: it.quantity,
      packSize,
      imageUrl,
      compositionFormula
    });

    subtotal += price * it.quantity;
  }

  const deliveryFee = pickupPreference === 'STORE_DELIVERY' ? (subtotal > 2000 ? 0 : 70) : 0;
  const totalAmount = subtotal + deliveryFee;

  const orderNumber = `AGRO-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  const orderId = `ord-${uuidv4().substring(0, 8)}`;
  orderItems.forEach(oi => { oi.orderId = orderId; });

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 24-hour SLA

  const newOrder: Order = {
    id: orderId,
    orderNumber,
    farmerId: req.user!.id,
    farmerName: req.user!.name || deliveryAddress?.name || 'Farmer',
    farmerPhone: req.user!.phone || deliveryAddress?.phone || '+91 9951518699',
    vendorId: 'usr-vendor-1',
    vendorName: targetShop.name,
    items: orderItems,
    subtotal,
    deliveryFee,
    totalAmount,
    deliveryAddress: {
      name: deliveryAddress?.name || req.user!.name,
      phone: deliveryAddress?.phone || req.user!.phone || '+91 9951518699',
      village: deliveryAddress?.village || req.user!.village || 'Kadiri Rural',
      district: deliveryAddress?.district || req.user!.district || 'Sri Sathya Sai',
      state: deliveryAddress?.state || req.user!.state || 'Andhra Pradesh',
      pincode: deliveryAddress?.pincode || req.user!.pincode || '515591',
      landmark: deliveryAddress?.landmark || notes || ''
    },
    paymentMethod: 'CASH_ON_PICKUP',
    paymentStatus: 'PENDING',
    status: 'PENDING_OWNER_CONFIRMATION',
    bookingType: 'STORE_RESERVATION',
    pickupPreference,
    expiresAt,
    shopDetails: {
      id: targetShop.id,
      name: targetShop.name,
      address: targetShop.address,
      phone: targetShop.phone,
      mapUrl: targetShop.googleMapsUrl || `https://maps.google.com/?q=${targetShop.address}`,
      distanceKm: targetShop.distanceKm || 2.3
    },
    alternativeShops,
    estimatedDeliveryDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    trackingUpdates: [
      {
        status: 'PENDING_OWNER_CONFIRMATION',
        message: `Booking submitted. Awaiting confirmation from ${targetShop.name} within 24 hours.`,
        timestamp: now.toISOString()
      }
    ],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  db.insert('orders', newOrder);

  try {
    await SupabaseDataService.createOrder(newOrder);
  } catch (err) {
    // continue
  }

  // Notify Farmer
  const farmerNotif: AppNotification = {
    id: `notif-${uuidv4().substring(0, 8)}`,
    userId: req.user!.id,
    title: `Agri Booking Submitted: #${orderNumber}`,
    body: `Your booking for ₹${totalAmount.toLocaleString('en-IN')} has been sent to ${targetShop.name}. Awaiting dealer acceptance within 24h.`,
    category: 'ORDER',
    linkUrl: `/orders`,
    isRead: false,
    createdAt: now.toISOString()
  };
  db.insert('notifications', farmerNotif);

  // Notify Store Owner
  const vendorNotif: AppNotification = {
    id: `notif-${uuidv4().substring(0, 8)}`,
    userId: 'usr-vendor-1',
    title: `New Booking Request: #${orderNumber}`,
    body: `Farmer ${newOrder.farmerName} booked ${orderItems.length} input(s) worth ₹${totalAmount.toLocaleString('en-IN')}. Please confirm within 24 hours.`,
    category: 'ORDER',
    linkUrl: `/vendor-portal`,
    isRead: false,
    createdAt: now.toISOString()
  };
  db.insert('notifications', vendorNotif);

  return res.status(201).json(newOrder);
});

// PATCH Accept Booking (Merchant Action - Generates Collection OTP)
orderRouter.patch('/:id/accept', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const order = db.findById('orders', id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (order.status !== 'PENDING_OWNER_CONFIRMATION') {
    return res.status(400).json({ error: `Cannot accept order in status ${order.status}` });
  }

  const now = new Date();
  const collectionOtp = Math.floor(1000 + Math.random() * 9000).toString();

  const trackingUpdates = [
    ...(order.trackingUpdates || []),
    {
      status: 'ACCEPTED',
      message: `Booking accepted by ${order.vendorName}. Collection OTP is ${collectionOtp}. Ready for ${order.pickupPreference === 'COUNTER_PICKUP' ? 'store counter pickup' : 'store delivery'}.`,
      timestamp: now.toISOString()
    }
  ];

  const updatedOrder = db.update('orders', id, {
    status: 'ACCEPTED',
    collectionOtp,
    trackingUpdates,
    updatedAt: now.toISOString()
  });

  try {
    await SupabaseDataService.updateOrderStatus(id, 'ACCEPTED', trackingUpdates);
  } catch (err) {
    // continue
  }

  // Notify Farmer of acceptance
  const notif: AppNotification = {
    id: `notif-${uuidv4().substring(0, 8)}`,
    userId: order.farmerId,
    title: `🎉 Booking Accepted: #${order.orderNumber}`,
    body: `Your booking at ${order.vendorName} is confirmed! Your pickup collection OTP is ${collectionOtp}. Pay ₹${order.totalAmount} upon collection.`,
    category: 'ORDER',
    linkUrl: `/orders`,
    isRead: false,
    createdAt: now.toISOString()
  };
  db.insert('notifications', notif);

  return res.json(updatedOrder);
});

// PATCH Reject Booking (Merchant Action with Predefined Reasons)
orderRouter.patch('/:id/reject', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { rejectionReason = 'OUT_OF_STOCK', rejectionNotes } = req.body as {
    rejectionReason: string;
    rejectionNotes?: string;
  };

  const order = db.findById('orders', id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (order.status !== 'PENDING_OWNER_CONFIRMATION') {
    return res.status(400).json({ error: `Cannot reject order in status ${order.status}` });
  }

  const now = new Date();
  const reasonLabels: Record<string, string> = {
    OUT_OF_STOCK: 'Out of Stock / Inventory Depleted',
    PRICE_REVISION: 'Manufacturer Price Revision',
    SHOP_CLOSED: 'Shop Closed / Public Holiday',
    DELIVERY_UNAVAILABLE: 'Delivery to this Village Not Feasible'
  };

  const reasonText = reasonLabels[rejectionReason] || rejectionReason || 'Declined by merchant';

  const trackingUpdates = [
    ...(order.trackingUpdates || []),
    {
      status: 'REJECTED',
      message: `Booking declined by ${order.vendorName}: ${reasonText}. ${rejectionNotes ? `Notes: ${rejectionNotes}` : ''}`,
      timestamp: now.toISOString()
    }
  ];

  const updatedOrder = db.update('orders', id, {
    status: 'REJECTED',
    rejectionReason,
    rejectionNotes: rejectionNotes || reasonText,
    trackingUpdates,
    updatedAt: now.toISOString()
  });

  try {
    await SupabaseDataService.updateOrderStatus(id, 'REJECTED', trackingUpdates);
  } catch (err) {
    // continue
  }

  // Notify Farmer of rejection with prompt to transfer
  const notif: AppNotification = {
    id: `notif-${uuidv4().substring(0, 8)}`,
    userId: order.farmerId,
    title: `Booking Declined: #${order.orderNumber}`,
    body: `${order.vendorName} declined this booking (${reasonText}). Tap to re-route your items to the next nearest dealer instantly!`,
    category: 'ORDER',
    linkUrl: `/orders`,
    isRead: false,
    createdAt: now.toISOString()
  };
  db.insert('notifications', notif);

  return res.json(updatedOrder);
});

// POST One-Click Re-Request / Transfer to Next Nearest Shop
orderRouter.post('/:id/transfer', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { targetShopId } = req.body as { targetShopId?: string };

  const originalOrder = db.findById('orders', id);
  if (!originalOrder) return res.status(404).json({ error: 'Original order not found' });

  if (originalOrder.status !== 'REJECTED' && originalOrder.status !== 'EXPIRED_AUTO_CANCELLED') {
    return res.status(400).json({ error: 'Only rejected or expired bookings can be transferred to alternative dealers.' });
  }

  const allShops = db.getTable('shops');
  let targetShop = allShops.find(s => s.id === targetShopId);

  // If no target shop provided, automatically pick the next nearest alternative
  if (!targetShop) {
    targetShop = allShops.find(s => s.id !== originalOrder.shopDetails?.id) || allShops[0];
  }

  const now = new Date();
  const newOrderNumber = `AGRI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const newOrderId = `ord-${uuidv4().substring(0, 8)}`;
  const newExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const newItems = (originalOrder.items || []).map(it => ({
    ...it,
    id: `item-${uuidv4().substring(0, 8)}`,
    orderId: newOrderId
  }));

  const remainingAlternatives = allShops
    .filter(s => s.id !== targetShop!.id)
    .map(s => ({
      id: s.id,
      name: s.name,
      distanceKm: s.distanceKm || 4.2,
      phone: s.phone,
      address: s.address
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const transferredOrder: Order = {
    ...originalOrder,
    id: newOrderId,
    orderNumber: newOrderNumber,
    items: newItems,
    vendorId: 'usr-vendor-1',
    vendorName: targetShop.name,
    status: 'PENDING_OWNER_CONFIRMATION',
    expiresAt: newExpiresAt,
    collectionOtp: undefined,
    rejectionReason: undefined,
    rejectionNotes: undefined,
    transferredFromOrderId: originalOrder.id,
    shopDetails: {
      id: targetShop.id,
      name: targetShop.name,
      address: targetShop.address,
      phone: targetShop.phone,
      mapUrl: targetShop.googleMapsUrl || `https://maps.google.com/?q=${targetShop.address}`,
      distanceKm: targetShop.distanceKm || 3.1
    },
    alternativeShops: remainingAlternatives,
    trackingUpdates: [
      {
        status: 'PENDING_OWNER_CONFIRMATION',
        message: `Booking transferred from #${originalOrder.orderNumber} to ${targetShop.name}. Fresh 24-hour confirmation SLA activated.`,
        timestamp: now.toISOString()
      }
    ],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  db.insert('orders', transferredOrder);

  try {
    await SupabaseDataService.createOrder(transferredOrder);
  } catch (err) {
    // continue
  }

  // Notify Farmer
  const notif: AppNotification = {
    id: `notif-${uuidv4().substring(0, 8)}`,
    userId: req.user!.id,
    title: `🔄 Booking Transferred to ${targetShop.name}`,
    body: `New booking #${newOrderNumber} created with a fresh 24h confirmation window.`,
    category: 'ORDER',
    linkUrl: `/orders`,
    isRead: false,
    createdAt: now.toISOString()
  };
  db.insert('notifications', notif);

  return res.status(201).json(transferredOrder);
});

// Standard cart checkout (Backward Compatibility)
orderRouter.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { items, deliveryAddress, paymentMethod } = req.body as {
    items: { productId: string; quantity: number }[];
    deliveryAddress: any;
    paymentMethod: 'UPI' | 'CARDS' | 'NET_BANKING' | 'COD';
  };

  if (!items || !items.length) {
    return res.status(400).json({ error: 'Order must contain at least one item' });
  }

  const orderItems: OrderItem[] = [];
  let subtotal = 0;
  let targetVendorId = 'usr-vendor-1';
  let targetVendorName = 'Sri Lakshmi Agri Inputs & Seeds Depot';

  for (const it of items) {
    let prod = db.findById('products', it.productId);
    if (!prod && (it as any).productName) {
      prod = db.getTable('products').find(p => p.name?.toLowerCase() === (it as any).productName?.toLowerCase());
    }
    const price = prod ? (prod.subsidyDiscountedRate || prod.price) : ((it as any).price || (it as any).subsidyDiscountedRate || 350);
    const productName = prod ? prod.name : ((it as any).productName || (it as any).name || 'Agricultural Input Item');
    const brand = prod ? prod.brand : ((it as any).brand || 'AgriConnect Certified');
    const brandBadge = prod ? (prod.brandBadge || prod.brand) : ((it as any).brandBadge || brand);
    const mrp = prod ? prod.mrp : ((it as any).mrp || Math.round(price * 1.25));
    const packSize = prod ? prod.packSize : ((it as any).packSize || '1 Pack');
    const imageUrl = (prod?.images?.[0]) || ((it as any).imageUrl || (it as any).image || 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=400');
    const compositionFormula = prod?.compositionFormula || (it as any).compositionFormula || 'Standard Agronomic Composition';
    targetVendorId = prod?.vendorId || targetVendorId;

    orderItems.push({
      id: `item-${uuidv4().substring(0, 8)}`,
      orderId: '',
      productId: prod?.id || it.productId || `prod-${uuidv4().substring(0, 6)}`,
      productName,
      brand,
      brandBadge,
      price,
      mrp,
      subsidyDiscountedRate: prod?.subsidyDiscountedRate || price,
      quantity: it.quantity,
      packSize,
      imageUrl,
      compositionFormula
    });

    subtotal += price * it.quantity;
  }

  const deliveryFee = subtotal > 1500 ? 0 : 50;
  const totalAmount = subtotal + deliveryFee;
  const orderNumber = `AGRO-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  const orderId = `ord-${uuidv4().substring(0, 8)}`;
  orderItems.forEach(oi => { oi.orderId = orderId; });

  const now = new Date();
  const newOrder: Order = {
    id: orderId,
    orderNumber,
    farmerId: req.user!.id,
    farmerName: req.user!.name,
    farmerPhone: req.user!.phone,
    vendorId: targetVendorId,
    vendorName: targetVendorName,
    items: orderItems,
    subtotal,
    deliveryFee,
    totalAmount,
    deliveryAddress: {
      name: deliveryAddress?.name || req.user!.name,
      phone: deliveryAddress?.phone || req.user!.phone || '+91 9951518699',
      village: deliveryAddress?.village || 'Kadiri',
      district: deliveryAddress?.district || 'Sri Sathya Sai',
      state: deliveryAddress?.state || 'Andhra Pradesh',
      pincode: deliveryAddress?.pincode || '515591',
      landmark: deliveryAddress?.landmark || ''
    },
    paymentMethod: paymentMethod || 'UPI',
    paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PAID',
    status: 'CONFIRMED',
    estimatedDeliveryDate: new Date(now.getTime() + 2 * 86400000).toISOString().split('T')[0],
    trackingUpdates: [
      {
        status: 'ORDER_PLACED',
        message: 'Order placed successfully and confirmed.',
        timestamp: now.toISOString()
      }
    ],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  db.insert('orders', newOrder);

  try {
    await SupabaseDataService.createOrder(newOrder);
  } catch (err) {
    // continue
  }

  return res.status(201).json(newOrder);
});

// PATCH update order status
orderRouter.patch('/:id/status', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, message } = req.body;

  const order = db.findById('orders', id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const validStatuses = [
    'PENDING_OWNER_CONFIRMATION',
    'ACCEPTED',
    'REJECTED',
    'EXPIRED_AUTO_CANCELLED',
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED'
  ];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid order status' });
  }

  const trackingUpdates = [
    ...(order.trackingUpdates || []),
    {
      status,
      message: message || `Order status updated to ${status}.`,
      timestamp: new Date().toISOString()
    }
  ];

  const updated = db.update('orders', id, {
    status,
    trackingUpdates,
    updatedAt: new Date().toISOString()
  });

  try {
    await SupabaseDataService.updateOrderStatus(id, status, trackingUpdates);
  } catch (err) {
    // continue
  }

  return res.json(updated);
});
