import { db } from '../database/db.js';
import { PurchaseOffer, NearbyFarmerProfile } from '../models/types.js';
import { v4 as uuidv4 } from 'uuid';

export const PRELOADED_NEARBY_FARMERS: NearbyFarmerProfile[] = [
  {
    id: 'farmer-dir-1',
    farmerId: 'usr-farmer-1',
    farmerName: 'Ramesh Patel',
    phone: '+91 98480 12345',
    avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
    village: 'Kadiri Rural',
    taluk: 'Kadiri',
    district: 'Sri Sathya Sai',
    state: 'Andhra Pradesh',
    distanceKm: 4.2,
    isVerified: true,
    totalAcreage: 6.0,
    cropName: 'Groundnut (Pod)',
    variety: 'Kadiri-6 (High Oil Content)',
    estimatedQuantity: 45,
    unit: 'QUINTAL',
    harvestTimeline: 'READY_NOW',
    expectedPrice: 7400,
    priceUnit: 'per Quintal',
    qualityGrade: 'Grade A (Premium)',
    readyHarvestDate: '2026-10-02',
    notes: 'Pods harvested from borewell irrigated field, thoroughly sun-dried with < 7% moisture.'
  },
  {
    id: 'farmer-dir-2',
    farmerId: 'usr-farmer-2',
    farmerName: 'K. Venkataramana Reddy',
    phone: '+91 94412 87654',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    village: 'Talupula',
    taluk: 'Kadiri',
    district: 'Sri Sathya Sai',
    state: 'Andhra Pradesh',
    distanceKm: 11.5,
    isVerified: true,
    totalAcreage: 4.5,
    cropName: 'Tomato',
    variety: 'Arka Rakshak F1',
    estimatedQuantity: 180,
    unit: 'CRATE',
    harvestTimeline: 'READY_NOW',
    expectedPrice: 520,
    priceUnit: 'per Crate (25kg)',
    qualityGrade: 'Grade A (Red Ripe)',
    readyHarvestDate: '2026-10-01',
    notes: 'Firm, uniform red-ripe fruits. Daily picking capacity of 50-60 crates available at farm gate.'
  },
  {
    id: 'farmer-dir-3',
    farmerId: 'usr-farmer-3',
    farmerName: 'B. Chenna Keshava',
    phone: '+91 99890 43210',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    village: 'Mudigubba',
    taluk: 'Dharmavaram',
    district: 'Sri Sathya Sai',
    state: 'Andhra Pradesh',
    distanceKm: 22.0,
    isVerified: true,
    totalAcreage: 8.0,
    cropName: 'Chilli',
    variety: 'Guntur Teja S17',
    estimatedQuantity: 60,
    unit: 'QUINTAL',
    harvestTimeline: 'NEXT_7_DAYS',
    expectedPrice: 18500,
    priceUnit: 'per Quintal',
    qualityGrade: 'Export Quality (Hot Red)',
    readyHarvestDate: '2026-10-06',
    notes: 'Uniform color value > 90 ASTA, deep red with high capsaicin content. Yard drying underway.'
  },
  {
    id: 'farmer-dir-4',
    farmerId: 'usr-farmer-4',
    farmerName: 'S. Gangadharappa',
    phone: '+91 97011 23456',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    village: 'Madanapalle Rural',
    taluk: 'Madanapalle',
    district: 'Annamayya',
    state: 'Andhra Pradesh',
    distanceKm: 38.0,
    isVerified: true,
    totalAcreage: 5.5,
    cropName: 'Tomato',
    variety: 'Saaho 3251',
    estimatedQuantity: 240,
    unit: 'CRATE',
    harvestTimeline: 'NEXT_7_DAYS',
    expectedPrice: 500,
    priceUnit: 'per Crate (25kg)',
    qualityGrade: 'Grade A (Semi-Ripe/Firm)',
    readyHarvestDate: '2026-10-05',
    notes: 'Long shelf-life hybrid variety suited for long-distance transport to Bangalore & Chennai mandis.'
  },
  {
    id: 'farmer-dir-5',
    farmerId: 'usr-farmer-5',
    farmerName: 'G. Lakshminarayana',
    phone: '+91 96112 34567',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    village: 'Bagepalli Border',
    taluk: 'Chikkaballapur',
    district: 'Chikkaballapur',
    state: 'Karnataka',
    distanceKm: 28.5,
    isVerified: true,
    totalAcreage: 7.0,
    cropName: 'Maize',
    variety: 'Pioneer P3396 (Yellow Feed Corn)',
    estimatedQuantity: 95,
    unit: 'QUINTAL',
    harvestTimeline: 'READY_NOW',
    expectedPrice: 2150,
    priceUnit: 'per Quintal',
    qualityGrade: 'Grade A (Feed Quality)',
    readyHarvestDate: '2026-09-30',
    notes: 'Grain moisture 13.5%, high starch yellow corn suitable for starch mills and poultry feed units.'
  },
  {
    id: 'farmer-dir-6',
    farmerId: 'usr-farmer-6',
    farmerName: 'M. Anjaneyulu',
    phone: '+91 98499 87123',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    village: 'Gorantla',
    taluk: 'Penukonda',
    district: 'Sri Sathya Sai',
    state: 'Andhra Pradesh',
    distanceKm: 18.0,
    isVerified: true,
    totalAcreage: 3.5,
    cropName: 'Onion',
    variety: 'Bellary Red Medium',
    estimatedQuantity: 75,
    unit: 'QUINTAL',
    harvestTimeline: 'NEXT_15_DAYS',
    expectedPrice: null,
    priceUnit: 'per Quintal',
    qualityGrade: 'Medium Table Grade',
    readyHarvestDate: '2026-10-12',
    notes: 'Open to price negotiation for bulk farm-gate upliftment. Dry shed curing scheduled.'
  },
  {
    id: 'farmer-dir-7',
    farmerId: 'usr-farmer-7',
    farmerName: 'P. Subbarayudu',
    phone: '+91 94901 65432',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
    village: 'Nallamada',
    taluk: 'Kadiri',
    district: 'Sri Sathya Sai',
    state: 'Andhra Pradesh',
    distanceKm: 14.2,
    isVerified: true,
    totalAcreage: 4.0,
    cropName: 'Paddy',
    variety: 'Sona Masoori (BPT 5204)',
    estimatedQuantity: 110,
    unit: 'QUINTAL',
    harvestTimeline: 'NEXT_15_DAYS',
    expectedPrice: 2380,
    priceUnit: 'per Quintal',
    qualityGrade: 'Grade A Raw Paddy',
    readyHarvestDate: '2026-10-15',
    notes: 'Fine grain aromatic Sona Masoori, zero pesticide spray in last 25 days, ideal for rice millers.'
  },
  {
    id: 'farmer-dir-8',
    farmerId: 'usr-farmer-8',
    farmerName: 'D. Sivamma (Women SHG Farmer)',
    phone: '+91 93902 11223',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    village: 'Gandlapenta',
    taluk: 'Kadiri',
    district: 'Sri Sathya Sai',
    state: 'Andhra Pradesh',
    distanceKm: 8.5,
    isVerified: true,
    totalAcreage: 2.5,
    cropName: 'Jasmine',
    variety: 'Kadiri Kakada (Gundu Malli)',
    estimatedQuantity: 15,
    unit: 'QUINTAL',
    harvestTimeline: 'READY_NOW',
    expectedPrice: 45000,
    priceUnit: 'per Quintal (₹450/Kg)',
    qualityGrade: 'Fresh Morning Pluck (Unopened Bud)',
    readyHarvestDate: '2026-10-01',
    notes: 'Harvested before sunrise daily. High fragrance unopened white buds for wholesale flower traders.'
  },
  {
    id: 'farmer-dir-9',
    farmerId: 'usr-farmer-9',
    farmerName: 'K. Mallikarjuna',
    phone: '+91 91772 33445',
    avatarUrl: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150',
    village: 'Bathalapalle',
    taluk: 'Dharmavaram',
    district: 'Sri Sathya Sai',
    state: 'Andhra Pradesh',
    distanceKm: 32.0,
    isVerified: true,
    totalAcreage: 10.0,
    cropName: 'Cotton',
    variety: 'BT Cotton Mallika',
    estimatedQuantity: 85,
    unit: 'QUINTAL',
    harvestTimeline: 'NEXT_15_DAYS',
    expectedPrice: 7100,
    priceUnit: 'per Quintal',
    qualityGrade: 'Medium Staple White',
    readyHarvestDate: '2026-10-14',
    notes: 'First picking bolls opening nicely. Ginning outturn estimated at > 34%.'
  },
  {
    id: 'farmer-dir-10',
    farmerId: 'usr-farmer-10',
    farmerName: 'T. Harish Kumar',
    phone: '+91 95531 44556',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    village: 'Hindupur Rural',
    taluk: 'Hindupur',
    district: 'Sri Sathya Sai',
    state: 'Andhra Pradesh',
    distanceKm: 44.0,
    isVerified: true,
    totalAcreage: 3.0,
    cropName: 'Carrot',
    variety: 'Kuroda English Hybrid',
    estimatedQuantity: 65,
    unit: 'QUINTAL',
    harvestTimeline: 'READY_NOW',
    expectedPrice: 2900,
    priceUnit: 'per Quintal',
    qualityGrade: 'Washed Table Grade',
    readyHarvestDate: '2026-10-02',
    notes: 'Deep orange crunchy roots, machine washed and sorted into 50kg net bags.'
  }
];

export const PRELOADED_PURCHASE_OFFERS: PurchaseOffer[] = [
  {
    id: 'po-kadiri-8812',
    buyerId: 'usr-buyer-1',
    buyerName: 'Kisan Mandi Wholesalers',
    buyerBusinessName: 'Kisan Mandi Multi-Commodity Procure Hub',
    buyerPhone: '+91 94400 98765',
    cropName: 'Groundnut (Pod)',
    variety: 'Kadiri-6',
    qualityGrade: 'Grade A (Premium)',
    requiredQuantity: 100,
    unit: 'QUINTAL',
    targetPrice: 7500,
    priceUnit: 'per Quintal',
    procurementCenter: 'Kadiri APMC Main Yard',
    district: 'Sri Sathya Sai',
    state: 'Andhra Pradesh',
    validUntil: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    specialRequirements: 'Sun-dried pods, moisture < 7.5%, free from mold. Spot payment via RTGS immediately after weighment.',
    status: 'ACTIVE',
    matchedFarmersCount: 1,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'po-kadiri-8813',
    buyerId: 'usr-buyer-1',
    buyerName: 'Kisan Mandi Wholesalers',
    buyerBusinessName: 'Kisan Mandi Multi-Commodity Procure Hub',
    buyerPhone: '+91 94400 98765',
    cropName: 'Tomato',
    variety: 'Grade A Red-Ripe Hybrid',
    qualityGrade: 'Export Quality (Firm Red)',
    requiredQuantity: 500,
    unit: 'CRATE',
    targetPrice: 530,
    priceUnit: 'per Crate (25kg)',
    procurementCenter: 'Madanapalle / Kadiri Collection Center',
    district: 'Sri Sathya Sai & Annamayya',
    state: 'Andhra Pradesh',
    validUntil: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    specialRequirements: 'Uniform red ripeness, clean crates, immediate farm-gate truck pickup arranged by our logistics team.',
    status: 'ACTIVE',
    matchedFarmersCount: 2,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

export class FarmerDirectoryService {
  public static getNearbyFarmers(params?: {
    crop?: string;
    district?: string;
    maxDistanceKm?: number;
    timeline?: string;
    search?: string;
  }): NearbyFarmerProfile[] {
    let farmers = [...PRELOADED_NEARBY_FARMERS];

    if (params?.crop && params.crop !== 'ALL' && params.crop !== 'All') {
      const c = params.crop.toLowerCase().trim();
      farmers = farmers.filter(f =>
        f.cropName.toLowerCase().includes(c) ||
        f.variety.toLowerCase().includes(c) ||
        c.includes(f.cropName.toLowerCase())
      );
    }

    if (params?.maxDistanceKm && params.maxDistanceKm > 0) {
      farmers = farmers.filter(f => f.distanceKm <= params.maxDistanceKm!);
    }

    if (params?.timeline && params.timeline !== 'ALL') {
      farmers = farmers.filter(f => f.harvestTimeline === params.timeline);
    }

    if (params?.district && params.district.trim()) {
      const d = params.district.toLowerCase().trim();
      farmers = farmers.filter(f =>
        f.district.toLowerCase().includes(d) ||
        f.taluk.toLowerCase().includes(d) ||
        f.village.toLowerCase().includes(d)
      );
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      farmers = farmers.filter(f =>
        f.farmerName.toLowerCase().includes(q) ||
        f.village.toLowerCase().includes(q) ||
        f.taluk.toLowerCase().includes(q) ||
        f.cropName.toLowerCase().includes(q) ||
        f.variety.toLowerCase().includes(q)
      );
    }

    return farmers;
  }

  public static getPurchaseOffers(buyerId?: string): PurchaseOffer[] {
    const raw = db.getTable('purchase_offers');
    let offers: PurchaseOffer[] = [];
    if (Array.isArray(raw) && raw.length > 0) {
      offers = raw as PurchaseOffer[];
    } else {
      offers = [...PRELOADED_PURCHASE_OFFERS];
      for (const po of offers) {
        db.insert('purchase_offers', po);
      }
    }

    if (buyerId) {
      // Return offers for this buyer or default public ones
      const buyerOffers = offers.filter(o => o.buyerId === buyerId || o.buyerId === 'usr-buyer-1');
      return buyerOffers.length > 0 ? buyerOffers : offers;
    }
    return offers;
  }

  public static createPurchaseOffer(offerData: Partial<PurchaseOffer>): PurchaseOffer {
    const matched = this.matchFarmers(offerData.cropName || '', offerData.district);

    const newOffer: PurchaseOffer = {
      id: `po-${uuidv4().substring(0, 8)}`,
      buyerId: offerData.buyerId || 'usr-buyer-1',
      buyerName: offerData.buyerName || 'Kisan Mandi Wholesalers',
      buyerBusinessName: offerData.buyerBusinessName || 'Agri Procurement Hub',
      buyerPhone: offerData.buyerPhone || '+91 94400 98765',
      cropName: offerData.cropName || 'Produce',
      variety: offerData.variety || 'Standard Quality',
      qualityGrade: offerData.qualityGrade || 'Grade A',
      requiredQuantity: Number(offerData.requiredQuantity) || 50,
      unit: offerData.unit || 'QUINTAL',
      targetPrice: Number(offerData.targetPrice) || 5000,
      priceUnit: offerData.priceUnit || `per ${offerData.unit || 'QUINTAL'}`,
      procurementCenter: offerData.procurementCenter || 'Kadiri Mandi Procurement Yard',
      district: offerData.district || 'Sri Sathya Sai',
      state: offerData.state || 'Andhra Pradesh',
      validUntil: offerData.validUntil || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      specialRequirements: offerData.specialRequirements || 'Direct farm gate pickup, prompt payment.',
      status: 'ACTIVE',
      matchedFarmersCount: matched.length,
      createdAt: new Date().toISOString()
    };

    db.insert('purchase_offers', newOffer);
    return newOffer;
  }

  public static closePurchaseOffer(offerId: string): PurchaseOffer | null {
    const updated = db.update('purchase_offers', offerId, { status: 'CLOSED', updatedAt: new Date().toISOString() });
    return updated as PurchaseOffer | null;
  }

  public static matchFarmers(cropName: string, district?: string): NearbyFarmerProfile[] {
    const cleanCrop = cropName.toLowerCase().trim();
    return PRELOADED_NEARBY_FARMERS.filter(f => {
      const cropMatch = f.cropName.toLowerCase().includes(cleanCrop) || cleanCrop.includes(f.cropName.toLowerCase());
      if (!cropMatch) return false;
      if (district && district.trim()) {
        const d = district.toLowerCase().trim();
        return f.district.toLowerCase().includes(d) || d.includes(f.district.toLowerCase());
      }
      return true;
    });
  }
}
