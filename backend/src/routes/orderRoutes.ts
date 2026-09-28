import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { db } from '../database/db.js';
import { SupabaseDataService } from '../database/supabaseDataService.js';
import { Order, OrderItem, AppNotification } from '../models/types.js';
import { v4 as uuidv4 } from 'uuid';

export const orderRouter = Router();

// GET orders for logged in user (Farmer sees own orders; Vendor sees incoming orders - from Supabase)
orderRouter.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let orders: Order[] = await SupabaseDataService.getOrders(user.id, user.role);

  // Sort latest first
  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json(orders);
});

// GET single order
orderRouter.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const order = db.findById('orders', req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  // Guard access
  if (req.user!.role !== 'ADMIN' && order.farmerId !== req.user!.id && order.vendorId !== req.user!.id) {
    return res.status(403).json({ error: 'Unauthorized to view this order' });
  }

  return res.json(order);
});

// POST create order from cart
orderRouter.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { items, deliveryAddress, paymentMethod } = req.body as {
    items: { productId: string; quantity: number }[];
    deliveryAddress: any;
    paymentMethod: 'UPI' | 'CARDS' | 'NET_BANKING' | 'COD';
  };

  if (!items || !items.length) {
    return res.status(400).json({ error: 'Order must contain at least one item' });
  }

  if (!deliveryAddress || !deliveryAddress.village || !deliveryAddress.phone) {
    return res.status(400).json({ error: 'Valid delivery address is required' });
  }

  // Validate items and check stock
  const orderItems: OrderItem[] = [];
  let subtotal = 0;
  let targetVendorId = 'usr-vendor-1';
  let targetVendorName = 'Sri Lakshmi Agri Inputs';

  for (const it of items) {
    const prod = db.findById('products', it.productId);
    if (!prod) {
      return res.status(404).json({ error: `Product ID ${it.productId} not found` });
    }
    if (prod.stockQuantity < it.quantity) {
      return res.status(400).json({ error: `Insufficient stock for ${prod.name}. Available: ${prod.stockQuantity}` });
    }

    targetVendorId = prod.vendorId;
    const vendorProf = db.findOne('vendor_profiles', v => v.userId === targetVendorId);
    if (vendorProf) targetVendorName = vendorProf.shopName;

    // Deduct stock
    db.update('products', prod.id, { stockQuantity: prod.stockQuantity - it.quantity });

    orderItems.push({
      id: `item-${uuidv4().substring(0, 8)}`,
      orderId: '', // Will set below
      productId: prod.id,
      productName: prod.name,
      brand: prod.brand,
      price: prod.price,
      quantity: it.quantity,
      packSize: prod.packSize
    });

    subtotal += prod.price * it.quantity;
  }

  const deliveryFee = subtotal > 1500 ? 0 : 50;
  const totalAmount = subtotal + deliveryFee;

  const orderNumber = `AGRI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const orderId = `ord-${uuidv4().substring(0, 8)}`;

  orderItems.forEach(oi => { oi.orderId = orderId; });

  const estDate = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

  const newOrder: Order = {
    id: orderId,
    orderNumber,
    farmerId: req.user!.id,
    vendorId: targetVendorId,
    vendorName: targetVendorName,
    items: orderItems,
    subtotal,
    deliveryFee,
    totalAmount,
    deliveryAddress: {
      name: deliveryAddress.name || req.user!.name,
      phone: deliveryAddress.phone || req.user!.phone,
      village: deliveryAddress.village,
      district: deliveryAddress.district || 'Sri Sathya Sai',
      state: deliveryAddress.state || 'Andhra Pradesh',
      pincode: deliveryAddress.pincode || '515591',
      landmark: deliveryAddress.landmark || ''
    },
    paymentMethod: paymentMethod || 'UPI',
    paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PAID',
    status: 'CONFIRMED',
    estimatedDeliveryDate: estDate,
    trackingUpdates: [
      {
        status: 'ORDER_PLACED',
        message: 'Order placed successfully and confirmed.',
        timestamp: new Date().toISOString()
      },
      {
        status: 'CONFIRMED',
        message: `Order assigned to ${targetVendorName} for dispatch.`,
        timestamp: new Date().toISOString()
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await SupabaseDataService.createOrder(newOrder);

  // Send notification to farmer
  const notif: AppNotification = {
    id: `notif-${uuidv4().substring(0, 8)}`,
    userId: req.user!.id,
    title: `Order Placed: ${orderNumber}`,
    body: `Your order for ₹${totalAmount.toLocaleString('en-IN')} has been placed with ${targetVendorName}.`,
    category: 'ORDER',
    linkUrl: `/orders`,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  db.insert('notifications', notif);

  return res.status(201).json(newOrder);
});

// PATCH update order status (Vendor / Admin only - updates in Supabase)
orderRouter.patch('/:id/status', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, message } = req.body;

  const order = db.findById('orders', id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (req.user!.role !== 'ADMIN' && order.vendorId !== req.user!.id) {
    return res.status(403).json({ error: 'Unauthorized to update this order' });
  }

  const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid order status' });
  }

  const trackingUpdates = [
    ...order.trackingUpdates,
    {
      status,
      message: message || `Order status updated to ${status}.`,
      timestamp: new Date().toISOString()
    }
  ];

  const updated = await SupabaseDataService.updateOrderStatus(id, status, trackingUpdates);
  return res.json(updated);
});

