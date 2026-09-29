import bcrypt from 'bcryptjs';
import { db } from './db.js';
import {
  User,
  FarmerProfile,
  VendorProfile,
  ExpertProfile,
  Farm,
  Crop,
  SoilTestRecord,
  ProductCategory,
  Product,
  Order,
  ProduceListing,
  BuyerRequest,
  ProcurementVendor,
  VendorDealRequest,
  FarmTask,
  FarmExpense,
  AppNotification,
  AiDiagnosis,
  MarketPrice,
  Shop
} from '../models/types.js';
import { syncLocalDataToSupabase } from './supabaseClient.js';
import { extendedCategories, comprehensiveProductsCatalog } from './productsCatalog.js';
import { PRELOADED_PURCHASE_OFFERS, PRELOADED_NEARBY_FARMERS } from '../services/farmerDirectoryService.js';

export async function seedDatabase() {
  console.log('🌱 Seeding AgriConnect AI database with realistic agricultural data...');
  
  const passwordHash = await bcrypt.hash('password123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  // 1. Users
  const users: User[] = [
    {
      id: 'usr-farmer-1',
      name: 'Ramesh Patel',
      phone: '+91 98480 12345',
      email: 'farmer@agriconnect.com',
      passwordHash,
      role: 'FARMER',
      language: 'en',
      village: 'Kadiri Rural',
      district: 'Sri Sathya Sai',
      state: 'Andhra Pradesh',
      pincode: '515591',
      latitude: 14.1165,
      longitude: 78.1634,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'usr-vendor-1',
      name: 'Sri Lakshmi Agri Traders',
      phone: '+91 98490 54321',
      email: 'vendor@agriconnect.com',
      passwordHash,
      role: 'VENDOR',
      language: 'en',
      village: 'Kadiri Town',
      district: 'Sri Sathya Sai',
      state: 'Andhra Pradesh',
      pincode: '515591',
      latitude: 14.1120,
      longitude: 78.1601,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'usr-buyer-1',
      name: 'Kisan Mandi Wholesalers',
      phone: '+91 94400 98765',
      email: 'buyer@agriconnect.com',
      passwordHash,
      role: 'BUYER',
      language: 'en',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      pincode: '560001',
      latitude: 12.9716,
      longitude: 77.5946,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'usr-expert-1',
      name: 'Dr. K. Swaminathan (Agronomist)',
      phone: '+91 93900 11223',
      email: 'expert@agriconnect.com',
      passwordHash,
      role: 'EXPERT',
      language: 'en',
      district: 'Tirupati',
      state: 'Andhra Pradesh',
      pincode: '517502',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'usr-admin-1',
      name: 'AgriConnect Administrator',
      phone: '+91 99999 00000',
      email: 'admin@agriconnect.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      language: 'en',
      district: 'Hyderabad',
      state: 'Telangana',
      pincode: '500081',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // 2. Profiles
  const farmerProfiles: FarmerProfile[] = [
    {
      id: 'prof-farmer-1',
      userId: 'usr-farmer-1',
      totalAcreage: 5.5,
      primaryCrops: ['Groundnut', 'Tomato', 'Paddy'],
      farmingExperienceYears: 16,
      farmingType: 'INTEGRATED',
      soilTypeDefault: 'RED_LOAM',
      hasSoilCard: true,
      irrigationType: 'BOREWELL'
    }
  ];

  const vendorProfiles: VendorProfile[] = [
    {
      id: 'prof-vendor-1',
      userId: 'usr-vendor-1',
      shopName: 'Sri Lakshmi Agri Inputs & Seeds Depot',
      licenseNumber: 'AP/SSS/FERT/2023/8891',
      gstNumber: '37AABCS1429B1Z8',
      verificationStatus: 'VERIFIED',
      address: 'Shop #14, Main Bazaar, Near Old Bus Stand, Kadiri',
      district: 'Sri Sathya Sai',
      state: 'Andhra Pradesh',
      pincode: '515591',
      latitude: 14.1120,
      longitude: 78.1601,
      rating: 4.8,
      reviewCount: 142,
      deliveryRadiusKm: 25,
      contactPhone: '+91 98490 54321',
      openingHours: '07:30 AM - 08:30 PM (Mon-Sat)'
    }
  ];

  const expertProfiles: ExpertProfile[] = [
    {
      id: 'prof-expert-1',
      userId: 'usr-expert-1',
      qualification: 'Ph.D. in Agronomy & Plant Pathology',
      institution: 'Acharya N.G. Ranga Agricultural University (ANGRAU)',
      specialization: ['Groundnut Diseases', 'Nutrient Deficiency in Red Soils', 'Integrated Pest Management'],
      isVerified: true,
      experienceYears: 22,
      bio: 'Agricultural scientist with over two decades of field extension experience across Rayalaseema and South Indian cropping zones.'
    }
  ];

  // 3. Farms & Crops
  const farms: Farm[] = [
    {
      id: 'farm-1',
      userId: 'usr-farmer-1',
      name: 'Sri Venkateswara Farm',
      location: 'Survey #142/A, Kadiri Rural Road',
      district: 'Sri Sathya Sai',
      state: 'Andhra Pradesh',
      totalArea: 6.5,
      areaUnit: 'ACRE',
      soilType: 'RED_LOAM',
      irrigationSource: 'BOREWELL',
      waterAvailability: 'MODERATE',
      createdAt: '2026-06-15T00:00:00.000Z'
    }
  ];

  const crops: Crop[] = [
    {
      id: 'crop-1',
      farmId: 'farm-1',
      cropName: 'Groundnut (Peanut)',
      variety: 'Kadiri-6 (K-6)',
      sowingDate: '2026-07-10T00:00:00.000Z',
      expectedHarvestDate: '2026-10-25T00:00:00.000Z',
      growthStage: 'FLOWERING',
      areaPlanted: 4.0,
      previousCrop: 'Fallow / Green Manure',
      currentProblems: 'Mild leaf spot (Tikka) spotted on lower foliage after monsoon rains',
      healthStatus: 'NEEDS_ATTENTION',
      createdAt: '2026-07-10T00:00:00.000Z'
    },
    {
      id: 'crop-2',
      farmId: 'farm-1',
      cropName: 'Tomato',
      variety: 'Arka Rakshak (Triple Disease Resistant)',
      sowingDate: '2026-08-01T00:00:00.000Z',
      expectedHarvestDate: '2026-11-15T00:00:00.000Z',
      growthStage: 'VEGETATIVE',
      areaPlanted: 1.5,
      previousCrop: 'Groundnut',
      currentProblems: 'None. Good vegetative vigor with drip fertigation.',
      healthStatus: 'HEALTHY',
      createdAt: '2026-08-01T00:00:00.000Z'
    },
    {
      id: 'crop-3',
      farmId: 'farm-1',
      cropName: 'Chilli (Mirchi)',
      variety: 'Guntur Hope / Byadagi Dry Red',
      sowingDate: '2026-08-10T00:00:00.000Z',
      expectedHarvestDate: '2026-12-05T00:00:00.000Z',
      growthStage: 'VEGETATIVE',
      areaPlanted: 1.0,
      previousCrop: 'Legume Green Manure',
      currentProblems: 'None observed. Vigorous canopy with drip fertigation.',
      healthStatus: 'HEALTHY',
      createdAt: '2026-08-10T00:00:00.000Z'
    }
  ];

  // 4. Soil Test
  const soilTests: SoilTestRecord[] = [
    {
      id: 'soil-1',
      farmId: 'farm-1',
      userId: 'usr-farmer-1',
      testDate: '2026-06-20',
      isLabCertified: true,
      sourceType: 'LAB_REPORT',
      ph: 6.8,
      nitrogenKgPerHa: 185,
      phosphorusKgPerHa: 19.5,
      potassiumKgPerHa: 290,
      organicCarbonPct: 0.44,
      electricalConductivity: 0.38,
      soilMoisturePct: 18,
      summary: 'Slightly low Nitrogen & Organic Carbon; Medium Phosphorus; Adequate Potassium. pH 6.8 is optimal for legume nodulation and groundnut pegging.',
      recommendations: [
        'Apply Farm Yard Manure (FYM) or Vermicompost @ 4-5 tonnes/acre to replenish organic carbon.',
        'Split application of Urea: 50% basal with DAP, and 50% top-dressing at 30 days after sowing.',
        'Apply Gypsum @ 200 kg/acre at 40-45 DAS (flowering/pegging) for Pod filling and Calcium/Sulfur enrichment.'
      ],
      createdAt: '2026-06-20T10:00:00.000Z'
    }
  ];

  // 5. Shops & Input Dealers
  const shops: Shop[] = [
    {
      id: 'shop-1',
      name: 'Sri Lakshmi Agri Inputs & Seeds Depot',
      ownerName: 'Sri Lakshmi Agri Traders',
      phone: '+91 98490 54321',
      address: 'Shop #14, Main Bazaar, Near Old Bus Stand, Kadiri',
      district: 'Sri Sathya Sai',
      state: 'Andhra Pradesh',
      pincode: '515591',
      latitude: 14.1120,
      longitude: 78.1601,
      rating: 4.8,
      reviews: 142,
      isVerified: true,
      openingHours: '07:30 AM - 08:30 PM (Mon-Sat)',
      distanceKm: 2.3,
      googleMapsUrl: 'https://maps.google.com/?q=14.1120,78.1601',
      featuredInputs: ['Neem Coated Urea', 'DAP 18:46:0', 'Coromandel Gromor 28-28-0', 'Groundnut K6 Seeds'],
      inStockCount: 38
    },
    {
      id: 'shop-2',
      name: 'Kisan Seva Kendra & Fertilizer Hub',
      ownerName: 'Anantha Farmers Cooperative',
      phone: '+91 94411 77889',
      address: 'Court Road, Opposite Rythu Bharosa Kendra, Kadiri',
      district: 'Sri Sathya Sai',
      state: 'Andhra Pradesh',
      pincode: '515591',
      latitude: 14.1205,
      longitude: 78.1680,
      rating: 4.6,
      reviews: 98,
      isVerified: true,
      openingHours: '08:00 AM - 07:00 PM',
      distanceKm: 3.1,
      googleMapsUrl: 'https://maps.google.com/?q=14.1205,78.1680',
      featuredInputs: ['Organic Compost', 'Bio-fertilizers', 'Knapsack Sprayers', 'Drip Lateral Pipes'],
      inStockCount: 29
    },
    {
      id: 'shop-3',
      name: 'Balaji Agro-Chemicals & Plant Health Clinic',
      ownerName: 'Balaji Agro Enterprises',
      phone: '+91 98485 22334',
      address: 'NH 42 Junction, Tanakal Road, Kadiri Bypass',
      district: 'Sri Sathya Sai',
      state: 'Andhra Pradesh',
      pincode: '515591',
      latitude: 14.0950,
      longitude: 78.1450,
      rating: 4.7,
      reviews: 64,
      isVerified: true,
      openingHours: '07:00 AM - 09:00 PM',
      distanceKm: 4.8,
      googleMapsUrl: 'https://maps.google.com/?q=14.0950,78.1450',
      featuredInputs: ['Trichoderma Viride', 'Neem Oil 10,000 PPM', 'NPK 19-19-19', 'Tomato Hybrid Seeds'],
      inStockCount: 34
    },
    {
      id: 'shop-4',
      name: 'Rythu Mitra Agri Super Center',
      ownerName: 'Chaitanya Reddy',
      phone: '+91 99890 33445',
      address: 'Mudigubba Road, Kadiri West',
      district: 'Sri Sathya Sai',
      state: 'Andhra Pradesh',
      pincode: '515591',
      latitude: 14.1350,
      longitude: 78.1820,
      rating: 4.5,
      reviews: 51,
      isVerified: true,
      openingHours: '08:00 AM - 08:00 PM',
      distanceKm: 6.2,
      googleMapsUrl: 'https://maps.google.com/?q=14.1350,78.1820',
      featuredInputs: ['MOP Fertilizer', 'SSP Single Super Phosphate', 'Drip Filters', 'Tarpaulins'],
      inStockCount: 22
    },
    {
      id: 'shop-5',
      name: 'Sri Venkateswara Krishi Seva Kendra',
      ownerName: 'K. Venkataswamy',
      phone: '+91 94901 88220',
      address: 'Market Yard Road, Near APMC Gate 2, Kadiri',
      district: 'Sri Sathya Sai',
      state: 'Andhra Pradesh',
      pincode: '515591',
      latitude: 14.1080,
      longitude: 78.1520,
      rating: 4.9,
      reviews: 110,
      isVerified: true,
      openingHours: '06:30 AM - 08:00 PM',
      distanceKm: 7.5,
      googleMapsUrl: 'https://maps.google.com/?q=14.1080,78.1520',
      featuredInputs: ['Certified Groundnut Seeds', 'Water Soluble Fertilizers', 'Syngenta Fungicides'],
      inStockCount: 45
    }
  ];

  // Helper nearby stores reference
  const nearbyStoresList = [
    { shopId: 'shop-1', shopName: 'Sri Lakshmi Agri Inputs', distanceKm: 2.3, inStock: true, stockCount: 45, phone: '+91 98490 54321', address: 'Shop #14, Main Bazaar, Kadiri', rating: 4.8 },
    { shopId: 'shop-2', shopName: 'Kisan Seva Kendra & Fertilizer Hub', distanceKm: 3.1, inStock: true, stockCount: 30, phone: '+91 94411 77889', address: 'Court Road, Opp RBK, Kadiri', rating: 4.6 },
    { shopId: 'shop-3', shopName: 'Balaji Agro-Chemicals', distanceKm: 4.8, inStock: true, stockCount: 25, phone: '+91 98485 22334', address: 'NH 42 Junction, Tanakal Road, Kadiri', rating: 4.7 },
    { shopId: 'shop-4', shopName: 'Rythu Mitra Agri Super Center', distanceKm: 6.2, inStock: true, stockCount: 18, phone: '+91 99890 33445', address: 'Mudigubba Road, Kadiri', rating: 4.5 },
    { shopId: 'shop-5', shopName: 'Sri Venkateswara Krishi Seva Kendra', distanceKm: 7.5, inStock: true, stockCount: 22, phone: '+91 94901 88220', address: 'Market Yard Road, Kadiri', rating: 4.9 }
  ];

  // 6. Product Categories
  const productCategories: ProductCategory[] = extendedCategories;

  // 7. Packaging-Accurate Products Catalog (128 products across 8 categories)
  const products: Product[] = comprehensiveProductsCatalog;

  // 7. Orders
  const orders: Order[] = [
    {
      id: 'ord-1001',
      orderNumber: 'AGRI-2026-9812',
      farmerId: 'usr-farmer-1',
      vendorId: 'usr-vendor-1',
      vendorName: 'Sri Lakshmi Agri Inputs',
      items: [
        {
          id: 'item-1',
          orderId: 'ord-1001',
          productId: 'prod-urea-iffco',
          productName: 'Urea 46% N (Neem Coated)',
          brand: 'IFFCO',
          price: 266.50,
          quantity: 2,
          packSize: '45 kg Bag'
        },
        {
          id: 'item-2',
          orderId: 'ord-1001',
          productId: 'prod-neem-oil',
          productName: 'Cold Pressed Pure Neem Oil 10,000 PPM',
          brand: 'GreenAgri Bio',
          price: 420.00,
          quantity: 1,
          packSize: '1 Litre Bottle'
        }
      ],
      subtotal: 953.00,
      deliveryFee: 50.00,
      totalAmount: 1003.00,
      deliveryAddress: {
        name: 'Ramesh Patel',
        phone: '+91 98480 12345',
        village: 'Kadiri Rural',
        district: 'Sri Sathya Sai',
        state: 'Andhra Pradesh',
        pincode: '515591',
        landmark: 'Near Gram Panchayat Water Tank'
      },
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      status: 'PROCESSING',
      estimatedDeliveryDate: '2026-09-29',
      trackingUpdates: [
        {
          status: 'ORDER_PLACED',
          message: 'Order received and payment confirmed via UPI.',
          timestamp: '2026-09-27T09:15:00.000Z'
        },
        {
          status: 'CONFIRMED',
          message: 'Vendor Sri Lakshmi Agri Inputs accepted the order and packed items.',
          timestamp: '2026-09-27T11:30:00.000Z'
        },
        {
          status: 'PROCESSING',
          message: 'Items staged at Kadiri hub for delivery partner dispatch.',
          timestamp: '2026-09-27T15:00:00.000Z'
        }
      ],
      createdAt: '2026-09-27T09:15:00.000Z',
      updatedAt: '2026-09-27T15:00:00.000Z'
    }
  ];

  // 8. Farmer Produce Listings
  const produceListings: ProduceListing[] = [
    {
      id: 'prod-list-1',
      farmerId: 'usr-farmer-1',
      farmerName: 'Ramesh Patel',
      farmerPhone: '+91 98480 12345',
      cropName: 'Groundnut (Pod)',
      variety: 'Kadiri-6 (High Oil Content)',
      quantity: 30,
      unit: 'QUINTAL',
      expectedPricePerUnit: 7400,
      harvestDate: '2026-10-25',
      village: 'Kadiri Rural',
      district: 'Sri Sathya Sai',
      state: 'Andhra Pradesh',
      qualityGrade: 'GRADE_A',
      images: ['https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400'],
      description: 'First quality Kadiri-6 groundnut pods with 2-seeded uniform kernels, clean sun-dried pods (moisture < 8%). Pre-booking accepted for October harvest.',
      status: 'AVAILABLE',
      createdAt: '2026-09-20T10:00:00.000Z'
    },
    {
      id: 'prod-list-2',
      farmerId: 'usr-farmer-1',
      farmerName: 'Ramesh Patel',
      farmerPhone: '+91 98480 12345',
      cropName: 'Tomato',
      variety: 'Arka Rakshak F1',
      quantity: 50,
      unit: 'CRATE',
      expectedPricePerUnit: 480,
      harvestDate: '2026-11-10',
      village: 'Kadiri Rural',
      district: 'Sri Sathya Sai',
      state: 'Andhra Pradesh',
      qualityGrade: 'GRADE_A',
      images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400'],
      description: 'Firm, uniform red-ripe hybrid tomatoes (approx. 25 kg per crate). Ideal for retail supermarket supply and Bangalore mandi dispatch.',
      status: 'AVAILABLE',
      createdAt: '2026-09-22T14:30:00.000Z'
    }
  ];

  // 9. Buyer Requests
  const buyerRequests: BuyerRequest[] = [
    {
      id: 'req-1',
      produceListingId: 'prod-list-1',
      buyerId: 'usr-buyer-1',
      buyerName: 'Kisan Mandi Wholesalers',
      buyerPhone: '+91 94400 98765',
      offeredPricePerUnit: 7250,
      requestedQuantity: 25,
      message: 'We are interested in 25 quintals of Kadiri-6 groundnuts for Bengaluru processing plant. Can arrange direct pickup at farm gate on harvest day.',
      status: 'SUBMITTED',
      createdAt: '2026-09-25T11:00:00.000Z'
    }
  ];

  // 10. Farm Tasks
  const farmTasks: FarmTask[] = [
    {
      id: 'task-1',
      farmId: 'farm-1',
      cropId: 'crop-1',
      userId: 'usr-farmer-1',
      title: 'Foliar Spray of 19-19-19 (5g/L)',
      description: 'Nutrient spray during flower initiation to support peg penetration and reduce flower drop.',
      dueDate: '2026-09-28',
      priority: 'HIGH',
      category: 'FERTILIZER',
      isCompleted: false
    },
    {
      id: 'task-2',
      farmId: 'farm-1',
      cropId: 'crop-1',
      userId: 'usr-farmer-1',
      title: 'Check Soil Moisture Before 3rd Irrigation',
      description: 'Moisture is critical during groundnut pegging stage. Irrigate if soil ball crumbles easily.',
      dueDate: '2026-09-29',
      priority: 'MEDIUM',
      category: 'IRRIGATION',
      isCompleted: false
    },
    {
      id: 'task-3',
      farmId: 'farm-1',
      cropId: 'crop-1',
      userId: 'usr-farmer-1',
      title: 'Scout Lower Leaves for Early Leaf Spot (Tikka)',
      description: 'Examine 20 random plants across the 4-acre field for circular dark brown lesions.',
      dueDate: '2026-09-30',
      priority: 'HIGH',
      category: 'PEST_INSPECTION',
      isCompleted: false
    }
  ];

  // 11. Farm Expenses
  const expenses: FarmExpense[] = [
    {
      id: 'exp-1',
      farmId: 'farm-1',
      cropId: 'crop-1',
      userId: 'usr-farmer-1',
      category: 'MACHINERY',
      amount: 4500,
      date: '2026-07-05',
      notes: 'Tractor deep plowing & rotavator field preparation (3 passes)'
    },
    {
      id: 'exp-2',
      farmId: 'farm-1',
      cropId: 'crop-1',
      userId: 'usr-farmer-1',
      category: 'SEEDS',
      amount: 5700,
      date: '2026-07-08',
      notes: '2 bags (60 kg) Certified Kadiri-6 groundnut seed'
    },
    {
      id: 'exp-3',
      farmId: 'farm-1',
      cropId: 'crop-1',
      userId: 'usr-farmer-1',
      category: 'FERTILIZER',
      amount: 3200,
      date: '2026-07-10',
      notes: 'Basal application: 2 bags DAP and 1 bag Gypsum'
    },
    {
      id: 'exp-4',
      farmId: 'farm-1',
      cropId: 'crop-1',
      userId: 'usr-farmer-1',
      category: 'LABOUR',
      amount: 4800,
      date: '2026-08-05',
      notes: 'Manual weeding and intercultural hoeing (8 workers)'
    }
  ];

  // 12. Procurement Vendors (Vendors & Mandi Buyers who purchase crops directly from farmers)
  const procurementVendors: ProcurementVendor[] = [
    {
      id: 'proc-ven-1',
      vendorId: 'usr-vendor-1',
      vendorName: 'Sri Lakshmi Agri Traders & Oil Mills',
      businessName: 'Sri Lakshmi Agri Procurement Yard & Oil Expellers',
      phone: '+91 98490 54321',
      avatarUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150',
      cropsBought: ['Groundnut', 'Groundnut (Pod)', 'Paddy', 'Maize', 'Sunflower', 'Cotton'],
      buyingRates: [
        { crop: 'Groundnut', rate: 7450, unit: 'QUINTAL', note: 'Sun-dried pods, moisture < 8%' },
        { crop: 'Paddy', rate: 2380, unit: 'QUINTAL', note: 'Grade A Sona Masoori' },
        { crop: 'Maize', rate: 2180, unit: 'QUINTAL', note: 'Clean yellow corn' },
        { crop: 'Sunflower', rate: 5600, unit: 'QUINTAL', note: 'Oil content > 38%' }
      ],
      minQuantity: 10,
      maxQuantity: 500,
      unit: 'QUINTAL',
      village: 'Kadiri Town',
      district: 'Sri Sathya Sai',
      state: 'Andhra Pradesh',
      paymentTerms: 'Spot Cash / Instant UPI at Farm Gate',
      pickupAvailable: true,
      qualityPreference: 'Grade A pods, clean sun-dried, foreign matter < 1%',
      rating: 4.9,
      verified: true
    },
    {
      id: 'proc-ven-2',
      vendorId: 'usr-buyer-1',
      vendorName: 'Kisan Mandi Wholesalers & Cold Chain',
      businessName: 'Kisan Mandi Multi-Commodity Procure Hub',
      phone: '+91 94400 98765',
      avatarUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=150',
      cropsBought: ['Tomato', 'Chilli', 'Onion', 'Mango', 'Watermelon', 'Vegetables'],
      buyingRates: [
        { crop: 'Tomato', rate: 520, unit: 'CRATE', note: '25kg firm red-ripe hybrid' },
        { crop: 'Chilli', rate: 19500, unit: 'QUINTAL', note: 'Guntur Teja dry red' },
        { crop: 'Onion', rate: 2850, unit: 'QUINTAL', note: 'Medium-Large Nashik Red' },
        { crop: 'Mango', rate: 48000, unit: 'TONNE', note: 'Banganapalli grade 1' }
      ],
      minQuantity: 20,
      maxQuantity: 1000,
      unit: 'CRATE',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      paymentTerms: 'Same-day Bank Transfer (NEFT/RTGS) post weighment',
      pickupAvailable: true,
      qualityPreference: 'Uniform ripeness, export carton grade, zero fruit borer',
      rating: 4.8,
      verified: true
    },
    {
      id: 'proc-ven-3',
      vendorId: 'usr-vendor-rayalaseema',
      vendorName: 'Rayalaseema Cotton Ginning & Grain Depot',
      businessName: 'Rayalaseema Agro Processing Industries',
      phone: '+91 98765 43210',
      avatarUrl: 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?w=150',
      cropsBought: ['Cotton', 'Red Gram (Toor)', 'Bengal Gram (Chana)', 'Castor', 'Groundnut'],
      buyingRates: [
        { crop: 'Cotton', rate: 7950, unit: 'QUINTAL', note: 'Long staple 29mm+, low trash' },
        { crop: 'Red Gram (Toor)', rate: 10400, unit: 'QUINTAL', note: 'White/Red toor whole' },
        { crop: 'Bengal Gram (Chana)', rate: 6200, unit: 'QUINTAL', note: 'Desi chana bold' }
      ],
      minQuantity: 15,
      maxQuantity: 800,
      unit: 'QUINTAL',
      district: 'Anantapur',
      state: 'Andhra Pradesh',
      paymentTerms: 'Instant weighbridge voucher + Immediate NEFT',
      pickupAvailable: true,
      qualityPreference: 'Clean lint, low trash content, no rain damage',
      rating: 4.7,
      verified: true
    },
    {
      id: 'proc-ven-4',
      vendorId: 'usr-vendor-phool',
      vendorName: 'South India Floriculture & Phool Mandi Direct',
      businessName: 'Gudimalkapur & Bangalore Phool Syndicate',
      phone: '+91 97654 32109',
      avatarUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=150',
      cropsBought: ['Jasmine (Mallipoo)', 'Marigold (Banti)', 'Cut Dutch Rose', 'Crossandra (Kanakambaram)', 'Flowers'],
      buyingRates: [
        { crop: 'Jasmine (Mallipoo)', rate: 440, unit: 'KG', note: 'Morning fresh tight bud stage' },
        { crop: 'Marigold (Banti)', rate: 70, unit: 'KG', note: 'Deep orange/yellow garland grade' },
        { crop: 'Cut Dutch Rose', rate: 190, unit: 'BUNDLE', note: '20 stems, 50cm+ straight stems' },
        { crop: 'Crossandra (Kanakambaram)', rate: 520, unit: 'KG', note: 'Vibrant orange whole flowers' }
      ],
      minQuantity: 5,
      maxQuantity: 200,
      unit: 'KG',
      district: 'Hyderabad',
      state: 'Telangana',
      paymentTerms: 'Daily morning UPI settlement',
      pickupAvailable: true,
      qualityPreference: 'Fresh morning harvest without petal browning or pest blemish',
      rating: 4.9,
      verified: true
    },
    {
      id: 'proc-ven-5',
      vendorId: 'usr-vendor-coromandel',
      vendorName: 'Coromandel Grain & Pulse Millers',
      businessName: 'Coromandel Food Grains Agro Corp',
      phone: '+91 99887 76655',
      avatarUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=150',
      cropsBought: ['Paddy', 'Groundnut', 'Black Gram', 'Green Gram', 'Maize'],
      buyingRates: [
        { crop: 'Paddy', rate: 2420, unit: 'QUINTAL', note: 'BPT 5204 Samba Mahsuri' },
        { crop: 'Groundnut', rate: 7500, unit: 'QUINTAL', note: 'Kernel yield > 70%' },
        { crop: 'Black Gram', rate: 8900, unit: 'QUINTAL', note: 'Machine cleaned' }
      ],
      minQuantity: 25,
      maxQuantity: 1500,
      unit: 'QUINTAL',
      district: 'Guntur',
      state: 'Andhra Pradesh',
      paymentTerms: 'Direct bank transfer within 2 hours of gate entry',
      pickupAvailable: false,
      qualityPreference: 'Fair Average Quality (FAQ), Moisture < 12%',
      rating: 4.8,
      verified: true
    }
  ];

  // 13. Vendor Deal Requests (Direct Farmer -> Vendor Sell Requests)
  const vendorDealRequests: VendorDealRequest[] = [
    {
      id: 'deal-101',
      farmerId: 'usr-farmer-1',
      farmerName: 'Ramesh Patel',
      farmerPhone: '+91 98480 12345',
      farmerVillage: 'Kadiri Rural',
      farmerDistrict: 'Sri Sathya Sai',
      farmerState: 'Andhra Pradesh',
      vendorId: 'usr-vendor-1',
      vendorName: 'Sri Lakshmi Agri Traders & Oil Mills',
      shopName: 'Sri Lakshmi Agri Procurement Yard & Oil Expellers',
      cropName: 'Groundnut (Pod)',
      variety: 'Kadiri-6 High Oil',
      quantity: 25,
      unit: 'QUINTAL',
      offeredPricePerUnit: 7450,
      totalAmount: 186250,
      proposedHarvestDate: '2026-10-25',
      deliveryPreference: 'FARM_GATE_PICKUP',
      qualityGrade: 'GRADE_A',
      notes: 'Borewell irrigated 4-acre field. Sun-dried on polythene tarps, moisture 7.5%. Ready for truck loading.',
      status: 'CONFIRMED',
      vendorResponseNotes: 'Deal confirmed! We have dispatched our logistics partner Srinivas Rao with truck AP 02 TE 4821 for Oct 26 morning farm gate pickup with electronic weigh scale.',
      pickupScheduledDate: '2026-10-26',
      confirmedAt: '2026-09-27T14:20:00.000Z',
      createdAt: '2026-09-27T10:30:00.000Z'
    },
    {
      id: 'deal-102',
      farmerId: 'usr-farmer-1',
      farmerName: 'Ramesh Patel',
      farmerPhone: '+91 98480 12345',
      farmerVillage: 'Kadiri Rural',
      farmerDistrict: 'Sri Sathya Sai',
      farmerState: 'Andhra Pradesh',
      vendorId: 'usr-buyer-1',
      vendorName: 'Kisan Mandi Wholesalers & Cold Chain',
      shopName: 'Kisan Mandi Multi-Commodity Procure Hub',
      cropName: 'Tomato',
      variety: 'Arka Rakshak F1',
      quantity: 40,
      unit: 'CRATE',
      offeredPricePerUnit: 500,
      totalAmount: 20000,
      proposedHarvestDate: '2026-11-12',
      deliveryPreference: 'FARM_GATE_PICKUP',
      qualityGrade: 'GRADE_A',
      notes: 'Harvesting triple disease resistant hybrid tomatoes. Can supply 40 crates per picking every 4 days.',
      status: 'PENDING',
      createdAt: '2026-09-28T07:15:00.000Z'
    }
  ];

  // 14. App Notifications
  const notifications: AppNotification[] = [
    {
      id: 'notif-1',
      userId: 'usr-farmer-1',
      title: 'Weather Alert: Light to Moderate Rain Expected',
      body: 'Regional forecast predicts 15-20 mm rainfall over Kadiri region in the next 36 hours. Delay irrigation and wait for clear skies before foliar spraying.',
      category: 'WEATHER_ALERT',
      isRead: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'notif-deal-conf',
      userId: 'usr-farmer-1',
      title: '🎉 Deal Confirmed: Groundnut Lot Accepted!',
      body: 'Sri Lakshmi Agri Traders confirmed your 25 Quintals Groundnut offer at ₹7,450/Qtl (Total: ₹1,86,250). Farm gate pickup scheduled for Oct 26.',
      category: 'PRODUCE_REQUEST',
      linkUrl: '/produce',
      isRead: false,
      createdAt: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: 'notif-ven-offer',
      userId: 'usr-vendor-1',
      title: '🌾 New Harvest Offer from Farmer Ramesh Patel',
      body: 'Farmer Ramesh Patel offered 25 Quintals Groundnut (Pod) at ₹7,450/Qtl. View and confirm the procurement deal.',
      category: 'PRODUCE_REQUEST',
      linkUrl: '/vendor-portal',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'notif-buyer-offer',
      userId: 'usr-buyer-1',
      title: '🌾 New Tomato Offer from Farmer Ramesh Patel',
      body: 'Farmer Ramesh Patel offered 40 Crates Tomato (Arka Rakshak F1) at ₹500/Crate. View and confirm lot.',
      category: 'PRODUCE_REQUEST',
      linkUrl: '/buyer-portal',
      isRead: false,
      createdAt: new Date(Date.now() - 900000).toISOString()
    }
  ];

  // 15. Real AI Diagnoses & Leaf Scans (So disease_scans is never empty)
  const aiDiagnoses: AiDiagnosis[] = [
    {
      id: 'diag-scan-1',
      userId: 'usr-farmer-1',
      farmId: 'farm-1',
      cropName: 'Groundnut (Peanut)',
      imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=600',
      suspectedIssue: 'Early Leaf Spot (Tikka Disease - Cercospora arachidicola)',
      confidenceScore: 94.5,
      severity: 'MODERATE',
      cropIdentified: true,
      clarificationPrompt: '',
      symptomsEvidence: [
        'Circular reddish-brown to dark necrotic spots (2-8 mm) on leaf lamina.',
        'Distinct chlorotic yellow halo surrounding necrotic margins.',
        'Early signs of defoliation starting from lower canopy.'
      ],
      culturalControl: [
        'Collect and destroy infected crop residues to disrupt fungal inoculum.',
        'Maintain optimum plant spacing for adequate air circulation.',
        'Avoid late-evening overhead sprinkler irrigation.'
      ],
      biologicalControl: [
        'Foliar spray of cold-pressed Neem Oil 10,000 PPM @ 3-4 ml per litre of water.',
        'Apply Multiplex Trichoderma Viride 1% WP @ 5g per litre of water.'
      ],
      chemicalControlSafe: [
        'Dhanuka M-45 (Mancozeb 75% WP) @ 400-500g in 200L water per acre (2-2.5g/L).',
        'Tata Rallis Contaf Plus (Hexaconazole 5% SC) @ 400 ml in 200L water per acre (2 ml/L).'
      ],
      safetyWarnings: [
        'Wear protective face mask and gloves during mixing and spray application.',
        'Spray during calm morning (before 9 AM) or evening (after 4:30 PM).',
        'Observe minimum pre-harvest interval (PHI) of 15 days.'
      ],
      recommendedProductIds: ['prod-trichoderma', 'prod-neem-oil', 'prod-sprayer'],
      isExpertReviewed: true,
      expertNotes: 'Fungal spores germinating under >85% relative humidity and 25-30°C temperature with conidial dispersal by rain-splash.',
      followUpQuestions: [
        'How many days ago did you first observe these lesions?',
        'Was there continuous heavy rainfall or dense dew recently?'
      ],
      createdAt: '2026-09-27T10:00:00.000Z'
    },
    {
      id: 'diag-scan-2',
      userId: 'usr-farmer-1',
      farmId: 'farm-1',
      cropName: 'Tomato',
      imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600',
      suspectedIssue: 'Healthy Crop Status / Vigorous Fruiting Stage',
      confidenceScore: 96.0,
      severity: 'MILD',
      cropIdentified: true,
      clarificationPrompt: '',
      symptomsEvidence: [
        'Deep green, turgid leaves with normal venation and zero chlorosis.',
        'Sturdy stems and healthy cluster flowering without flower drop.'
      ],
      culturalControl: [
        'Maintain regular drip irrigation scheduling at 2-day intervals.',
        'Stake and trellis plants to prevent soil contact with fruits.'
      ],
      biologicalControl: [
        'Soil application of Pseudomonas fluorescens @ 2.5 kg/acre with FYM for root vigor.'
      ],
      chemicalControlSafe: [
        'No synthetic chemical intervention required for healthy crop.',
        'Foliar spray of NPK 19-19-19 @ 5g/L for balanced fruit expansion.'
      ],
      safetyWarnings: [
        'Avoid excessive Nitrogen application which can attract sucking pests.'
      ],
      recommendedProductIds: ['prod-mahadhan-19', 'prod-neem-oil'],
      isExpertReviewed: true,
      expertNotes: 'Optimal nutritional balance observed. Keep monitoring for early whitefly vectors.',
      createdAt: '2026-09-28T08:30:00.000Z'
    }
  ];

  // 16. Live Mandi Market Prices
  const marketPrices: MarketPrice[] = [
    {
      id: 'price-1',
      state: 'Andhra Pradesh',
      district: 'Sri Sathya Sai',
      market: 'Kadiri APMC Mandi',
      commodity: 'Groundnut (Pod)',
      commodityType: 'OILSEED',
      variety: 'Kadiri-6 Bold',
      unit: 'QUINTAL',
      minPrice: 7100,
      maxPrice: 7650,
      modalPrice: 7450,
      priceDate: '2026-09-28',
      trend: 'UP',
      changeAmount: 120,
      reportedBy: 'APMC Market Secretary',
      reportedByName: 'Kadiri APMC Yard',
      createdAt: new Date().toISOString()
    },
    {
      id: 'price-2',
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      market: 'Yeshwanthpur APMC Mandi',
      commodity: 'Tomato',
      commodityType: 'VEGETABLE',
      variety: 'Hybrid Red (Arka)',
      unit: 'CRATE',
      minPrice: 420,
      maxPrice: 530,
      modalPrice: 480,
      priceDate: '2026-09-28',
      trend: 'STABLE',
      changeAmount: 0,
      reportedBy: 'Mandi Trade Board',
      reportedByName: 'Bangalore Mandi Desk',
      createdAt: new Date().toISOString()
    },
    {
      id: 'price-3',
      state: 'Andhra Pradesh',
      district: 'Guntur',
      market: 'Guntur Mirchi Yard',
      commodity: 'Chilli (Dry Red)',
      commodityType: 'SPICE',
      variety: 'Teja S17 / Byadagi',
      unit: 'QUINTAL',
      minPrice: 18500,
      maxPrice: 20800,
      modalPrice: 19500,
      priceDate: '2026-09-28',
      trend: 'UP',
      changeAmount: 350,
      reportedBy: 'Spices Board Field Officer',
      reportedByName: 'Guntur Mirchi Yard',
      createdAt: new Date().toISOString()
    },
    {
      id: 'price-4',
      state: 'Andhra Pradesh',
      district: 'Anantapur',
      market: 'Anantapur Cotton Market',
      commodity: 'Cotton',
      commodityType: 'CROP',
      variety: 'Medium-Long Staple',
      unit: 'QUINTAL',
      minPrice: 7600,
      maxPrice: 8200,
      modalPrice: 7950,
      priceDate: '2026-09-28',
      trend: 'UP',
      changeAmount: 80,
      reportedBy: 'Cotton Corporation of India',
      reportedByName: 'Anantapur Yard',
      createdAt: new Date().toISOString()
    },
    {
      id: 'price-5',
      state: 'Andhra Pradesh',
      district: 'Sri Sathya Sai',
      market: 'Kadiri APMC Mandi',
      commodity: 'Paddy (Dhan)',
      commodityType: 'CROP',
      variety: 'Common / Sona Masoori',
      unit: 'QUINTAL',
      minPrice: 2280,
      maxPrice: 2450,
      modalPrice: 2380,
      priceDate: '2026-09-28',
      trend: 'STABLE',
      changeAmount: 0,
      reportedBy: 'APMC Market Secretary',
      reportedByName: 'Kadiri APMC Yard',
      createdAt: new Date().toISOString()
    }
  ];

  db.reset({
    users,
    farmer_profiles: farmerProfiles,
    vendor_profiles: vendorProfiles,
    expert_profiles: expertProfiles,
    farms,
    crops,
    soil_tests: soilTests,
    ai_diagnoses: aiDiagnoses,
    product_categories: productCategories,
    products,
    orders,
    produce_listings: produceListings,
    buyer_requests: buyerRequests,
    procurement_vendors: procurementVendors,
    vendor_deal_requests: vendorDealRequests,
    farm_tasks: farmTasks,
    expenses,
    messages: [],
    notifications,
    market_prices: marketPrices,
    shops,
    purchase_offers: PRELOADED_PURCHASE_OFFERS,
    nearby_farmers: PRELOADED_NEARBY_FARMERS
  });

  console.log('✅ Database seeded successfully with all tables and realistic data.');

  // Asynchronously trigger sync to Supabase Cloud tables
  syncLocalDataToSupabase().then(res => {
    if (res.success) {
      console.log('☁️ Supabase Cloud Tables successfully seeded and synchronized:', res.syncedCounts);
    } else {
      console.warn('⚠️ Supabase Cloud Tables sync notice (local database is fully active):', res.errors.join('; '));
    }
  }).catch(e => {
    console.warn('⚠️ Supabase Cloud sync exception:', e?.message || e);
  });
}

if (process.argv[1] && process.argv[1].includes('seed')) {
  seedDatabase().then(() => process.exit(0));
}

