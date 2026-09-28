import { Router, Request, Response } from 'express';
import { db } from '../database/db.js';
import { SupabaseDataService } from '../database/supabaseDataService.js';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { Product } from '../models/types.js';
import { v4 as uuidv4 } from 'uuid';

export const productRouter = Router();

// GET all product categories
productRouter.get('/categories', (_req: Request, res: Response) => {
  const categories = db.getTable('product_categories');
  return res.json(categories);
});

// GET products with search, category, crop, and stock filters (queries Supabase)
productRouter.get('/', async (req: Request, res: Response) => {
  const { search, category, crop, organic, minPrice, maxPrice, inStock, vendorId } = req.query;

  let products = await SupabaseDataService.getProducts(category as string);

  if (vendorId) {
    products = products.filter(p => p.vendorId === vendorId);
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

  // Attach vendor profile summary and nearby shop details to each product
  const vendorProfiles = db.getTable('vendor_profiles');
  const dbProducts = db.getTable('products');
  const enriched = products.map(prod => {
    const localProd = dbProducts.find(p => p.id === prod.id);
    const vProf = vendorProfiles.find(v => v.userId === (prod.vendorId || localProd?.vendorId));
    return {
      ...prod,
      ...(localProd || {}),
      id: prod.id || localProd?.id,
      vendorId: prod.vendorId || localProd?.vendorId,
      name: prod.name || localProd?.name,
      price: prod.price ?? localProd?.price,
      mrp: localProd?.mrp || prod.mrp || prod.price,
      brand: prod.brand || localProd?.brand,
      brandBadge: localProd?.brandBadge || prod.brandBadge || prod.brand,
      category: prod.category || localProd?.category,
      subcategory: localProd?.subcategory || (prod as any).subcategory,
      compositionFormula: localProd?.compositionFormula || (prod as any).compositionFormula || '',
      agriculturalUse: localProd?.agriculturalUse || prod.agriculturalUse || '',
      applicableCrops: (localProd?.applicableCrops && localProd.applicableCrops.length > 0 && localProd.applicableCrops[0] !== 'All Crops')
        ? localProd.applicableCrops
        : (prod.applicableCrops && prod.applicableCrops.length > 0 ? prod.applicableCrops : ['Paddy', 'Groundnut', 'Cotton', 'Chilli', 'Vegetables']),
      dosageGuidance: localProd?.dosageGuidance || (prod as any).dosageGuidance || '',
      safetyPrecautions: (localProd?.safetyPrecautions && localProd.safetyPrecautions.length > 0) ? localProd.safetyPrecautions : (prod as any).safetyPrecautions || [],
      labelInstructions: localProd?.labelInstructions || (prod as any).labelInstructions || '',
      subsidyDiscountedRate: localProd?.subsidyDiscountedRate || (prod as any).subsidyDiscountedRate || prod.price,
      subsidyLabel: localProd?.subsidyLabel || (prod as any).subsidyLabel || 'Govt. Subsidized statutory MRP',
      packagingType: localProd?.packagingType || (prod as any).packagingType || 'BAG',
      images: (localProd?.images && localProd.images.length > 0) ? localProd.images : prod.images,
      nearbyShops: (localProd?.nearbyShops && localProd.nearbyShops.length > 0) ? localProd.nearbyShops : ((prod as any).nearbyShops || []),
      vendorName: vProf?.shopName || 'Sri Lakshmi Agri Inputs',
      vendorRating: vProf?.rating || 4.8,
      vendorLocation: vProf ? `${vProf.district}, ${vProf.state}` : 'Kadiri, Andhra Pradesh',
      vendorDistanceKm: localProd?.nearbyShops?.[0]?.distanceKm || 2.3
    };
  });

  return res.json(enriched);
});

// GET product by id (queries Supabase + Local DB for rich specs)
productRouter.get('/:id', async (req: Request, res: Response) => {
  const localProd = db.findOne('products', p => p.id === req.params.id);
  const supabaseProd = await SupabaseDataService.getProductById(req.params.id);
  const baseProd = localProd ? { ...(supabaseProd || {}), ...localProd } : supabaseProd;
  
  if (!baseProd) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const vendorProfile = db.findOne('vendor_profiles', v => v.userId === baseProd.vendorId);
  return res.json({
    ...baseProd,
    brandBadge: localProd?.brandBadge || baseProd.brandBadge || baseProd.brand,
    compositionFormula: localProd?.compositionFormula || (baseProd as any).compositionFormula || '',
    dosageGuidance: localProd?.dosageGuidance || (baseProd as any).dosageGuidance || '',
    agriculturalUse: localProd?.agriculturalUse || baseProd.agriculturalUse || '',
    applicableCrops: (localProd?.applicableCrops && localProd.applicableCrops.length > 0) ? localProd.applicableCrops : baseProd.applicableCrops,
    safetyPrecautions: localProd?.safetyPrecautions || (baseProd as any).safetyPrecautions || [],
    labelInstructions: localProd?.labelInstructions || (baseProd as any).labelInstructions || '',
    subsidyDiscountedRate: localProd?.subsidyDiscountedRate || (baseProd as any).subsidyDiscountedRate || baseProd.price,
    nearbyShops: localProd?.nearbyShops || (baseProd as any).nearbyShops || [],
    packagingType: localProd?.packagingType || (baseProd as any).packagingType || 'BAG',
    images: (localProd?.images && localProd.images.length > 0) ? localProd.images : baseProd.images,
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

// POST add new product (Vendor only - persists to Supabase)
productRouter.post('/', authenticate, requireRole(['VENDOR', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
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

  const created = await SupabaseDataService.createProduct(newProduct);
  return res.status(201).json(created);
});

// PATCH update product stock (Vendor / Admin - updates in Supabase)
productRouter.patch('/:id/stock', authenticate, requireRole(['VENDOR', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  const { stockQuantity } = req.body;
  const product = db.findById('products', req.params.id);
  
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (product.vendorId !== req.user!.id && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized to modify this product inventory' });
  }

  const updated = await SupabaseDataService.updateProductStock(req.params.id, parseInt(stockQuantity, 10));
  return res.json(updated);
});

