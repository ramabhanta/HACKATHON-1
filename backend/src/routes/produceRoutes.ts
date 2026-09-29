import { Router, Request, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { db } from '../database/db.js';
import { SupabaseDataService } from '../database/supabaseDataService.js';
import { ProduceListing, BuyerRequest, AppNotification, ProcurementVendor, VendorDealRequest } from '../models/types.js';
import { v4 as uuidv4 } from 'uuid';

export const produceRouter = Router();

// ==========================================
// 1. Procurement Vendors (Who is Buying What Crop)
// ==========================================

// GET all procurement vendors / buyers, with optional crop & district filters
produceRouter.get('/procurement-vendors', (req: Request, res: Response) => {
  const { crop, district } = req.query;
  const rawVendors = db.getTable('procurement_vendors') || [];

  // Normalize vendor objects to guarantee all properties exist
  let vendors = rawVendors.map(v => {
    const crops = Array.isArray(v.cropsBought) && v.cropsBought.length > 0
      ? v.cropsBought
      : Array.isArray((v as any).preferredCrops) && (v as any).preferredCrops.length > 0
      ? (v as any).preferredCrops
      : ['Groundnut', 'Tomato', 'Paddy'];

    const buyingRates = Array.isArray(v.buyingRates) && v.buyingRates.length > 0
      ? v.buyingRates
      : crops.map((c: string) => ({
          crop: c,
          rate: c.toLowerCase().includes('groundnut') ? 7450 : c.toLowerCase().includes('tomato') ? 520 : c.toLowerCase().includes('chilli') ? 19500 : 2400,
          unit: (c.toLowerCase().includes('tomato') ? 'CRATE' : 'QUINTAL') as any,
          note: 'Direct procurement rate'
        }));

    return {
      ...v,
      vendorName: v.vendorName || (v as any).companyName || 'Procurement Buyer',
      businessName: v.businessName || (v as any).companyName || `${v.vendorName || 'Agri'} Wholesale Procure Hub`,
      phone: v.phone || (v as any).contactPhone || '+91 98490 54321',
      avatarUrl: v.avatarUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150',
      cropsBought: crops,
      buyingRates,
      minQuantity: v.minQuantity || 10,
      maxQuantity: v.maxQuantity || 1000,
      unit: v.unit || 'QUINTAL',
      district: v.district || 'Sri Sathya Sai',
      state: v.state || 'Andhra Pradesh',
      village: v.village || 'Kadiri',
      paymentTerms: v.paymentTerms || 'Instant Bank Transfer / Cash on weighment',
      pickupAvailable: v.pickupAvailable !== undefined ? v.pickupAvailable : true,
      rating: v.rating || 4.8,
      verified: v.verified !== undefined ? v.verified : true
    };
  });

  if (crop && typeof crop === 'string' && crop.trim().length > 0) {
    const c = crop.trim().toLowerCase();
    vendors = vendors.filter(v =>
      (v.cropsBought || []).some((cb: string) => cb.toLowerCase().includes(c) || c.includes(cb.toLowerCase())) ||
      (v.buyingRates || []).some((br: any) => br.crop.toLowerCase().includes(c) || c.includes(br.crop.toLowerCase()))
    );
  }

  if (district && typeof district === 'string' && district.trim().length > 0) {
    const d = district.trim().toLowerCase();
    vendors = vendors.filter(v =>
      (v.district || '').toLowerCase().includes(d) ||
      (v.state || '').toLowerCase().includes(d) ||
      (v.village || '').toLowerCase().includes(d)
    );
  }

  // Enrich with active deal count
  const allRequests = db.getTable('vendor_deal_requests') || [];
  const enriched = vendors.map(v => ({
    ...v,
    activeRequestsCount: allRequests.filter(r => r.vendorId === v.vendorId && r.status === 'PENDING').length
  }));

  return res.json(enriched);
});

// GET single procurement vendor by id
produceRouter.get('/procurement-vendors/:id', (req: Request, res: Response) => {
  const vendor = db.findById('procurement_vendors', req.params.id);
  if (!vendor) return res.status(404).json({ error: 'Procurement vendor not found' });
  return res.json(vendor);
});

// ==========================================
// 2. Direct Farmer -> Vendor Deal Requests
// ==========================================

// GET my vendor deal requests (Farmer sees sent requests; Vendor sees received requests)
produceRouter.get('/vendor-requests/my', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const allRequests = await SupabaseDataService.getVendorDeals();

  // Farmer perspective: requests I sent
  const asFarmer = allRequests.filter(r => r.farmerId === userId);

  // Vendor / Buyer perspective: requests addressed to my account
  const asVendor = allRequests.filter(r => r.vendorId === userId || (req.user!.role === 'VENDOR' && r.vendorId === 'usr-vendor-1'));

  return res.json({ asFarmer, asVendor });
});

// POST submit direct sell request from farmer to a specific vendor
produceRouter.post('/vendor-requests', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const {
    vendorId,
    vendorName,
    shopName,
    cropName,
    variety,
    quantity,
    unit,
    offeredPricePerUnit,
    proposedHarvestDate,
    deliveryPreference,
    qualityGrade,
    notes
  } = req.body;

  if (!cropName || !quantity || !offeredPricePerUnit || !vendorId) {
    return res.status(400).json({ error: 'Crop, quantity, offered price, and target vendor are required' });
  }

  const parsedQty = parseFloat(quantity);
  const parsedPrice = parseFloat(offeredPricePerUnit);

  if (isNaN(parsedQty) || parsedQty <= 0 || isNaN(parsedPrice) || parsedPrice <= 0) {
    return res.status(400).json({ error: 'Invalid quantity or offered price amount' });
  }

  const totalAmount = Math.round(parsedQty * parsedPrice);

  const newDealRequest: VendorDealRequest = {
    id: `deal-${uuidv4().substring(0, 8)}`,
    farmerId: req.user!.id,
    farmerName: req.user!.name,
    farmerPhone: req.user!.phone,
    farmerVillage: req.user!.village || 'Kadiri Rural',
    farmerDistrict: req.user!.district || 'Sri Sathya Sai',
    farmerState: req.user!.state || 'Andhra Pradesh',
    vendorId,
    vendorName: vendorName || 'Agri Procurement Vendor',
    shopName: shopName || 'Wholesale Mandi Depot',
    cropName,
    variety: variety || 'Standard Quality',
    quantity: parsedQty,
    unit: unit || 'QUINTAL',
    offeredPricePerUnit: parsedPrice,
    totalAmount,
    proposedHarvestDate: proposedHarvestDate || new Date().toISOString().split('T')[0],
    deliveryPreference: deliveryPreference || 'FARM_GATE_PICKUP',
    qualityGrade: qualityGrade || 'GRADE_A',
    notes: notes || '',
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };

  db.insert('vendor_deal_requests', newDealRequest);
  SupabaseDataService.createVendorDeal(newDealRequest);

  // 1. Notify the Target Vendor
  const vendorNotif: AppNotification = {
    id: `notif-${uuidv4().substring(0, 8)}`,
    userId: vendorId,
    title: `🌾 New Harvest Offer from Farmer ${req.user!.name}`,
    body: `${req.user!.name} offered ${parsedQty} ${unit || 'QUINTAL'} of ${cropName} at ₹${parsedPrice}/${unit || 'QUINTAL'} (Total: ₹${totalAmount.toLocaleString('en-IN')}).`,
    category: 'PRODUCE_REQUEST',
    linkUrl: '/vendor-portal',
    isRead: false,
    createdAt: new Date().toISOString()
  };
  db.insert('notifications', vendorNotif);

  // 2. Also notify the Farmer acknowledging submission
  const farmerConfirmNotif: AppNotification = {
    id: `notif-${uuidv4().substring(0, 8)}`,
    userId: req.user!.id,
    title: `📤 Sell Request Sent to ${vendorName}`,
    body: `Your offer for ${parsedQty} ${unit || 'QUINTAL'} ${cropName} has been submitted to ${vendorName}. You will be notified when they confirm.`,
    category: 'PRODUCE_REQUEST',
    linkUrl: '/produce',
    isRead: false,
    createdAt: new Date().toISOString()
  };
  db.insert('notifications', farmerConfirmNotif);

  return res.status(201).json(newDealRequest);
});

// PATCH vendor confirms (accepts) or rejects farmer sell request
produceRouter.patch('/vendor-requests/:id/respond', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, vendorResponseNotes, pickupScheduledDate } = req.body as {
    status: 'CONFIRMED' | 'REJECTED';
    vendorResponseNotes?: string;
    pickupScheduledDate?: string;
  };

  if (!status || (status !== 'CONFIRMED' && status !== 'REJECTED')) {
    return res.status(400).json({ error: 'Status must be CONFIRMED or REJECTED' });
  }

  const deal = db.findById('vendor_deal_requests', id);
  if (!deal) return res.status(404).json({ error: 'Deal request not found' });

  const now = new Date().toISOString();
  const updateData: Partial<VendorDealRequest> = {
    status,
    vendorResponseNotes: vendorResponseNotes || (status === 'CONFIRMED' ? 'Procurement confirmed by vendor.' : 'Declined due to godown capacity.'),
    pickupScheduledDate: pickupScheduledDate || deal.proposedHarvestDate,
    ...(status === 'CONFIRMED' ? { confirmedAt: now } : { rejectedAt: now })
  };

  const updatedDeal = db.update('vendor_deal_requests', id, updateData);
  await SupabaseDataService.updateVendorDealStatus(id, status);

  // Notify the Farmer of Vendor's decision
  const farmerNotif: AppNotification = {
    id: `notif-${uuidv4().substring(0, 8)}`,
    userId: deal.farmerId,
    title: status === 'CONFIRMED'
      ? `🎉 Deal Confirmed! ${deal.vendorName} Accepted Your Offer`
      : `❌ Offer Declined: ${deal.cropName}`,
    body: status === 'CONFIRMED'
      ? `Great news! ${deal.vendorName} confirmed your lot of ${deal.quantity} ${deal.unit} ${deal.cropName} at ₹${deal.offeredPricePerUnit}/${deal.unit} (₹${deal.totalAmount.toLocaleString('en-IN')}). Pickup date: ${updateData.pickupScheduledDate}.`
      : `${deal.vendorName} was unable to accept your ${deal.cropName} offer. Note: "${updateData.vendorResponseNotes}".`,
    category: 'PRODUCE_REQUEST',
    linkUrl: '/produce',
    isRead: false,
    createdAt: new Date().toISOString()
  };
  db.insert('notifications', farmerNotif);

  return res.json(updatedDeal);
});

// ==========================================
// 3. Existing Produce Listings & Bids
// ==========================================

// GET all produce listings (queries Supabase)
produceRouter.get('/', async (req: Request, res: Response) => {
  const { crop, district } = req.query;
  let listings = await SupabaseDataService.getProduceListings();

  if (crop) {
    const c = (crop as string).toLowerCase();
    listings = listings.filter(l => l.cropName.toLowerCase().includes(c) || l.variety.toLowerCase().includes(c));
  }

  if (district) {
    const d = (district as string).toLowerCase();
    listings = listings.filter(l => l.district.toLowerCase().includes(d));
  }

  const requests = db.getTable('buyer_requests');
  const enriched = listings.map(l => ({
    ...l,
    requestCount: requests.filter(r => r.produceListingId === l.id).length
  }));

  return res.json(enriched);
});

// GET buyer requests for current user (Farmer receives on their listings; Buyer sees what they submitted)
produceRouter.get('/my-requests', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const myListings = db.find('produce_listings', l => l.farmerId === userId);
  const myListingIds = new Set(myListings.map(l => l.id));

  const incoming = db.find('buyer_requests', r => myListingIds.has(r.produceListingId)).map(r => ({
    ...r,
    listing: myListings.find(l => l.id === r.produceListingId)
  }));

  const outgoing = db.find('buyer_requests', r => r.buyerId === userId).map(r => ({
    ...r,
    listing: db.findById('produce_listings', r.produceListingId)
  }));

  return res.json({ incoming, outgoing });
});

// GET ready farmer harvests for vendor procurement
produceRouter.get('/ready-farmer-harvests', (req: Request, res: Response) => {
  const { crop, district } = req.query;
  let listings = db.getTable('produce_listings') || [];

  if (crop && typeof crop === 'string' && crop.trim().length > 0) {
    const c = crop.trim().toLowerCase();
    listings = listings.filter(l => l.cropName.toLowerCase().includes(c) || l.variety.toLowerCase().includes(c));
  }

  if (district && typeof district === 'string' && district.trim().length > 0) {
    const d = district.trim().toLowerCase();
    listings = listings.filter(l => l.district.toLowerCase().includes(d) || l.state.toLowerCase().includes(d));
  }

  const requests = db.getTable('buyer_requests') || [];
  const enriched = listings.map(l => ({
    ...l,
    requestCount: requests.filter(r => r.produceListingId === l.id).length
  }));

  return res.json(enriched);
});

// GET single listing
produceRouter.get('/:id', (req: Request, res: Response) => {
  const listing = db.findById('produce_listings', req.params.id);
  if (!listing) return res.status(404).json({ error: 'Produce listing not found' });

  const requests = db.find('buyer_requests', r => r.produceListingId === listing.id);
  return res.json({ ...listing, requests });
});


// POST create produce listing (Farmer - persists to Supabase)
produceRouter.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { cropName, variety, quantity, unit, expectedPricePerUnit, harvestDate, village, district, state, qualityGrade, images, description, photoMetadata } = req.body;

  if (!cropName || !quantity || !expectedPricePerUnit) {
    return res.status(400).json({ error: 'Crop name, quantity, and expected price are required' });
  }

  const newListing: ProduceListing = {
    id: `prod-list-${uuidv4().substring(0, 8)}`,
    farmerId: req.user!.id,
    farmerName: req.user!.name,
    farmerPhone: req.user!.phone,
    cropName,
    variety: variety || 'Standard Quality',
    quantity: parseFloat(quantity),
    unit: unit || 'QUINTAL',
    expectedPricePerUnit: parseFloat(expectedPricePerUnit),
    harvestDate: harvestDate || new Date().toISOString().split('T')[0],
    village: village || req.user!.village || 'Kadiri',
    district: district || req.user!.district || 'Sri Sathya Sai',
    state: state || req.user!.state || 'Andhra Pradesh',
    qualityGrade: qualityGrade || 'GRADE_A',
    images: images && images.length ? images : ['https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400'],
    description: description || 'Directly harvested from farm, clean and sorted.',
    photoMetadata: photoMetadata || undefined,
    status: 'AVAILABLE',
    createdAt: new Date().toISOString()
  };

  const created = await SupabaseDataService.createProduceListing(newListing);
  return res.status(201).json(created);
});

// POST submit buyer purchase offer on farmer's lot (Vendor -> Farmer)
produceRouter.post('/:id/requests', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { offeredPricePerUnit, requestedQuantity, message, proposedPickupDate } = req.body;

  const listing = db.findById('produce_listings', id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });

  const parsedPrice = parseFloat(offeredPricePerUnit);
  const parsedQty = parseFloat(requestedQuantity);

  if (isNaN(parsedPrice) || parsedPrice <= 0 || isNaN(parsedQty) || parsedQty <= 0) {
    return res.status(400).json({ error: 'Valid price and quantity are required' });
  }

  const totalAmount = Math.round(parsedPrice * parsedQty);

  const buyerReq: BuyerRequest = {
    id: `req-${uuidv4().substring(0, 8)}`,
    produceListingId: id,
    buyerId: req.user!.id,
    buyerName: req.user!.name,
    buyerPhone: req.user!.phone,
    offeredPricePerUnit: parsedPrice,
    requestedQuantity: parsedQty,
    totalAmount,
    message: message || 'Interested in purchasing this lot directly.',
    proposedPickupDate: proposedPickupDate || listing.harvestDate,
    status: 'SUBMITTED',
    createdAt: new Date().toISOString()
  };

  db.insert('buyer_requests', buyerReq);

  // Notify farmer of incoming vendor purchase offer
  const farmerNotif: AppNotification = {
    id: `notif-${uuidv4().substring(0, 8)}`,
    userId: listing.farmerId,
    title: `🌾 Purchase Offer from ${req.user!.name}`,
    body: `${req.user!.name} offered ₹${parsedPrice}/${listing.unit} for ${parsedQty} ${listing.unit} ${listing.cropName} (Total: ₹${totalAmount.toLocaleString('en-IN')}). Review and confirm or reject based on your choice.`,
    category: 'PRODUCE_REQUEST',
    linkUrl: `/produce`,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  db.insert('notifications', farmerNotif);

  return res.status(201).json(buyerReq);
});

// PATCH accept / reject buyer request with farmer reasons (Farmer Choice)
produceRouter.patch('/requests/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, farmerReason, responseNotes } = req.body as {
    status: 'ACCEPTED' | 'REJECTED';
    farmerReason?: string;
    responseNotes?: string;
  };

  if (!status || (status !== 'ACCEPTED' && status !== 'REJECTED')) {
    return res.status(400).json({ error: 'Status must be ACCEPTED or REJECTED' });
  }

  const reqItem = db.findById('buyer_requests', id);
  if (!reqItem) return res.status(404).json({ error: 'Request not found' });

  const listing = db.findById('produce_listings', reqItem.produceListingId);
  if (!listing || listing.farmerId !== req.user!.id) {
    return res.status(403).json({ error: 'Unauthorized to respond to this request' });
  }

  const now = new Date().toISOString();
  const updateData: Partial<BuyerRequest> = {
    status,
    farmerReason: farmerReason || (status === 'REJECTED' ? 'Price offered does not meet cost expectation' : undefined),
    responseNotes: responseNotes || (status === 'ACCEPTED' ? 'Lot confirmed and reserved for your pickup.' : undefined),
    respondedAt: now
  };

  const updated = db.update('buyer_requests', id, updateData);

  if (status === 'ACCEPTED') {
    db.update('produce_listings', listing.id, { status: 'UNDER_NEGOTIATION' });
  }

  // Notify Vendor of Farmer's Decision
  const vendorNotif: AppNotification = {
    id: `notif-${uuidv4().substring(0, 8)}`,
    userId: reqItem.buyerId,
    title: status === 'ACCEPTED'
      ? `🎉 Offer Confirmed! Farmer ${listing.farmerName} Accepted Your Bid`
      : `❌ Offer Declined: Farmer ${listing.farmerName} on ${listing.cropName}`,
    body: status === 'ACCEPTED'
      ? `Farmer ${listing.farmerName} confirmed your purchase offer for ${reqItem.requestedQuantity} ${listing.unit} ${listing.cropName} at ₹${reqItem.offeredPricePerUnit}/${listing.unit}. ${responseNotes ? `Note: "${responseNotes}"` : 'Please coordinate pickup.'}`
      : `Farmer ${listing.farmerName} declined your offer of ₹${reqItem.offeredPricePerUnit}/${listing.unit} for ${listing.cropName}. Reason: "${updateData.farmerReason}".`,
    category: 'PRODUCE_REQUEST',
    linkUrl: req.user!.role === 'VENDOR' ? '/vendor-portal' : '/buyer-portal',
    isRead: false,
    createdAt: now
  };
  db.insert('notifications', vendorNotif);

  return res.json(updated);
});


