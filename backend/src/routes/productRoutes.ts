import { Router, Request, Response } from 'express';
import { db } from '../database/db.js';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { Product } from '../models/types.js';
import { v4 as uuidv4 } from 'uuid';

export const productRouter = Router();

// GET all product categories
productRouter.get('/categories', (_req: Request, res: Response) => {
  const categories = db.getTable('product_categories');
  return res.json(categories);
});

// GET products with search, category, crop, and stock filters
productRouter.get('/', (req: Request, res: Response) => {
  const { search, category, crop, organic, minPrice, maxPrice, inStock, vendorId } = req.query;

  let products = db.find('products', p => p.status === 'APPROVED' || !p.status);

  if (vendorId) {
    products = products.filter(p => p.vendorId === vendorId);
  }

  if (category) {
    products = products.filter(p => p.category.toLowerCase() === (category as string).toLowerCase());
  }

  if (organic !== undefined) {
    const isOrg = organic === 'true';
    products = products.filter(p => p.isOrganic === isOrg);
  }

  if (crop) {
    const c = (crop as string).toLowerCase();
    products = products.filter(p => 
      p.applicableCrops.some(ac => ac.toLowerCase().includes(c) || ac.toLowerCase() === 'all crops')
    );
  }

  if (search) {
    const q = (search as string).toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.applicableCrops.some(ac => ac.toLowerCase().includes(q))
    );
  }

  if (maxPrice) {
    const max = parseFloat(maxPrice as string);
    products = products.filter(p => p.price <= max);
  }

  if (inStock === 'true') {
    products = products.filter(p => p.stockQuantity > 0);
  }

  // Attach vendor profile summary to each product
  const vendorProfiles = db.getTable('vendor_profiles');
  const enriched = products.map(prod => {
    const vProf = vendorProfiles.find(v => v.userId === prod.vendorId);
    return {
      ...prod,
      vendorName: vProf?.shopName || 'Sri Lakshmi Agri Traders',
      vendorRating: vProf?.rating || 4.8,
      vendorLocation: vProf ? `${vProf.district}, ${vProf.state}` : 'Kadiri, Andhra Pradesh',
      vendorDistanceKm: 2.3
    };
  });

  return res.json(enriched);
});

// GET product by id
productRouter.get('/:id', (req: Request, res: Response) => {
  const product = db.findById('products', req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const vendorProfile = db.findOne('vendor_profiles', v => v.userId === product.vendorId);
  return res.json({
    ...product,
    vendor: vendorProfile || {
      shopName: 'Sri Lakshmi Agri Inputs',
      rating: 4.8,
      address: 'Shop #14, Main Bazaar, Kadiri',
      district: 'Sri Sathya Sai',
      state: 'Andhra Pradesh',
      contactPhone: '+91 98490 54321',
      verificationStatus: 'VERIFIED'
    }
  });
});

// POST add new product (Vendor only)
productRouter.post('/', authenticate, requireRole(['VENDOR', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const {
    name, brand, category, images, description, agriculturalUse,
    applicableCrops, packSize, price, mrp, stockQuantity, isOrganic,
    chemicalComposition, dosageGuidance, safetyPrecautions, labelInstructions
  } = req.body;

  if (!name || !price || !category) {
    return res.status(400).json({ error: 'Product name, price, and category are required' });
  }

  const newProduct: Product = {
    id: `prod-${uuidv4().substring(0, 8)}`,
    vendorId: req.user!.id,
    categoryId: `cat-${category.toLowerCase()}`,
    name,
    brand: brand || 'AgriBrand',
    category,
    images: images && images.length ? images : ['https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=400'],
    description: description || '',
    agriculturalUse: agriculturalUse || '',
    applicableCrops: applicableCrops || ['All Crops'],
    packSize: packSize || '1 Unit',
    price: parseFloat(price),
    mrp: mrp ? parseFloat(mrp) : parseFloat(price),
    stockQuantity: parseInt(stockQuantity, 10) || 50,
    isOrganic: !!isOrganic,
    chemicalComposition,
    dosageGuidance: dosageGuidance || 'Follow label instructions.',
    safetyPrecautions: safetyPrecautions || ['Wear protective gloves and keep away from children.'],
    labelInstructions: labelInstructions || 'Official registered agrochemical input.',
    status: 'APPROVED',
    createdAt: new Date().toISOString()
  };

  db.insert('products', newProduct);
  return res.status(201).json(newProduct);
});

// PATCH update product stock (Vendor / Admin)
productRouter.patch('/:id/stock', authenticate, requireRole(['VENDOR', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { stockQuantity } = req.body;

  const product = db.findById('products', id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  if (product.vendorId !== req.user!.id && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized to update this product stock' });
  }

  const updated = db.update('products', id, {
    stockQuantity: Math.max(0, parseInt(stockQuantity, 10) || 0)
  });

  return res.json(updated);
});

// PUT edit product (Vendor / Admin)
productRouter.put('/:id', authenticate, requireRole(['VENDOR', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const product = db.findById('products', id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  if (product.vendorId !== req.user!.id && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized to edit this product' });
  }

  const { name, brand, category, price, mrp, stockQuantity, packSize, description } = req.body;
  const updated = db.update('products', id, {
    name: name ?? product.name,
    brand: brand ?? product.brand,
    category: category ?? product.category,
    price: price ? parseFloat(price) : product.price,
    mrp: mrp ? parseFloat(mrp) : product.mrp,
    stockQuantity: stockQuantity !== undefined ? parseInt(stockQuantity, 10) : product.stockQuantity,
    packSize: packSize ?? product.packSize,
    description: description ?? product.description
  });

  return res.json(updated);
});

