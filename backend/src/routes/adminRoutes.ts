import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { db } from '../database/db.js';

export const adminRouter = Router();

// Platform analytics overview
adminRouter.get('/overview', authenticate, requireRole(['ADMIN']), (_req: AuthenticatedRequest, res: Response) => {
  const users = db.getTable('users');
  const products = db.getTable('products');
  const orders = db.getTable('orders');
  const diagnoses = db.getTable('ai_diagnoses');
  const produceListings = db.getTable('produce_listings');
  const vendors = db.getTable('vendor_profiles');

  const farmersCount = users.filter(u => u.role === 'FARMER').length;
  const vendorsCount = users.filter(u => u.role === 'VENDOR').length;
  const expertsCount = users.filter(u => u.role === 'EXPERT').length;
  const buyersCount = users.filter(u => u.role === 'BUYER').length;

  let totalRevenue = 0;
  orders.forEach(o => {
    if (o.status !== 'CANCELLED') totalRevenue += o.totalAmount;
  });

  return res.json({
    metrics: {
      totalUsers: users.length,
      farmersCount,
      vendorsCount,
      expertsCount,
      buyersCount,
      productsCount: products.length,
      ordersCount: orders.length,
      totalRevenue,
      aiScansCount: diagnoses.length,
      produceListingsCount: produceListings.length
    },
    recentOrders: orders.slice(-5).reverse(),
    recentDiagnoses: diagnoses.slice(-5).reverse(),
    pendingVendors: vendors.filter(v => v.verificationStatus === 'PENDING')
  });
});

// List users with role filter
adminRouter.get('/users', authenticate, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const role = req.query.role as string;
  let users = db.getTable('users').map(u => {
    const { passwordHash: _, ...safe } = u;
    return safe;
  });

  if (role) {
    users = users.filter(u => u.role === role);
  }

  return res.json(users);
});

// Verify or suspend vendor
adminRouter.patch('/vendors/:id/verify', authenticate, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status: 'VERIFIED' | 'SUSPENDED' | 'PENDING' };

  const vendor = db.findById('vendor_profiles', id);
  if (!vendor) return res.status(404).json({ error: 'Vendor profile not found' });

  const updated = db.update('vendor_profiles', id, { verificationStatus: status });
  return res.json(updated);
});

// Moderate product
adminRouter.patch('/products/:id/moderate', authenticate, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status: 'APPROVED' | 'REJECTED' | 'DRAFT' };

  const prod = db.findById('products', id);
  if (!prod) return res.status(404).json({ error: 'Product not found' });

  const updated = db.update('products', id, { status });
  return res.json(updated);
});

// AI audit logs
adminRouter.get('/ai-logs', authenticate, requireRole(['ADMIN']), (_req: AuthenticatedRequest, res: Response) => {
  const diagnoses = db.getTable('ai_diagnoses');
  diagnoses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json(diagnoses);
});
