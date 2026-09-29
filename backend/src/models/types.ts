export type UserRole = 'FARMER' | 'VENDOR' | 'BUYER' | 'EXPERT' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  passwordHash: string;
  role: UserRole;
  language: 'en' | 'te' | 'hi';
  village?: string;
  district?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FarmerProfile {
  id: string;
  userId: string;
  totalAcreage: number;
  primaryCrops: string[];
  farmingExperienceYears: number;
  farmingType: 'ORGANIC' | 'CONVENTIONAL' | 'INTEGRATED';
  soilTypeDefault: string;
  hasSoilCard: boolean;
  irrigationType: 'BOREWELL' | 'CANAL' | 'DRIP' | 'RAINFED';
}

export interface VendorProfile {
  id: string;
  userId: string;
  shopName: string;
  licenseNumber: string;
  gstNumber?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'SUSPENDED';
  address: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  deliveryRadiusKm: number;
  contactPhone: string;
  openingHours: string;
}

export interface ExpertProfile {
  id: string;
  userId: string;
  qualification: string;
  institution: string;
  specialization: string[];
  isVerified: boolean;
  experienceYears: number;
  bio: string;
}

export interface Farm {
  id: string;
  userId: string;
  name: string;
  location: string;
  district: string;
  state: string;
  totalArea: number;
  areaUnit: 'ACRE' | 'GUNTHA' | 'HECTARE';
  soilType: 'RED_LOAM' | 'BLACK_COTTON' | 'ALLUVIAL' | 'SANDY_LOAM' | 'CLAY';
  irrigationSource: 'BOREWELL' | 'CANAL' | 'OPEN_WELL' | 'DRIP' | 'RAINFED';
  waterAvailability: 'ABUNDANT' | 'MODERATE' | 'SCARCE';
  createdAt: string;
}

export interface Crop {
  id: string;
  farmId: string;
  cropName: string;
  variety: string;
  sowingDate: string;
  expectedHarvestDate: string;
  growthStage: 'LAND_PREP' | 'GERMINATION' | 'VEGETATIVE' | 'FLOWERING' | 'FRUITING' | 'MATURITY' | 'HARVESTED';
  areaPlanted: number;
  previousCrop?: string;
  currentProblems?: string;
  healthStatus: 'HEALTHY' | 'NEEDS_ATTENTION' | 'DISEASED' | 'STRESSED';
  createdAt: string;
}

export interface SoilTestRecord {
  id: string;
  farmId: string;
  userId: string;
  testDate: string;
  isLabCertified: boolean;
  sourceType: 'LAB_REPORT' | 'MANUAL_ENTRY' | 'AI_IMAGE_ESTIMATE';
  ph: number;
  nitrogenKgPerHa: number;
  phosphorusKgPerHa: number;
  potassiumKgPerHa: number;
  organicCarbonPct: number;
  electricalConductivity: number;
  soilMoisturePct?: number;
  summary: string;
  recommendations: string[];
  createdAt: string;
}

export interface PhotoMetadata {
  uploadedAt: string;
  uploadedAtFormatted: string;
  captureDate?: string;
  fileName?: string;
  fileSizeBytes?: number;
  fileSizeFormatted?: string;
  dimensions?: string;
  megapixels?: string;
  mimeType?: string;
  aspectRatio?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  deviceSource?: string;
  verified?: boolean;
}

export interface AiDiagnosis {
  id: string;
  userId: string;
  cropName: string;
  farmId?: string;
  imageUrl: string;
  photoMetadata?: PhotoMetadata;
  suspectedIssue: string;
  detected_disease?: string;
  confidenceScore: number;
  confidence?: number;
  remedies?: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  symptomsEvidence: string[];
  culturalControl: string[];
  biologicalControl: string[];
  chemicalControlSafe: string[];
  safetyWarnings: string[];
  recommendedProductIds: string[];
  isExpertReviewed: boolean;
  expertNotes?: string;
  clarificationPrompt?: string;
  cropIdentified?: boolean;
  isCropPlant?: boolean;
  notPlantReason?: string;
  requiresFarmerConfirmation?: boolean;
  followUpQuestions?: string[];
  createdAt: string;
}

export interface ProductCategory {
  id: string;
  slug: string;
  nameEn: string;
  nameHi: string;
  nameTe: string;
  icon: string;
}

export interface NearbyShopInfo {
  shopId: string;
  shopName: string;
  ownerName?: string;
  distanceKm: number;
  inStock: boolean;
  stockCount: number;
  phone?: string;
  address?: string;
  rating?: number;
}

export interface Shop {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviews: number;
  isVerified: boolean;
  openingHours: string;
  distanceKm?: number;
  googleMapsUrl?: string;
  featuredInputs?: string[];
  inStockCount?: number;
}

export interface Product {
  id: string;
  vendorId: string;
  categoryId: string;
  name: string;
  brand: string;
  brandBadge?: string;
  category: 'SEEDS' | 'FERTILIZERS' | 'CROP_PROTECTION' | 'EQUIPMENT' | 'UREA' | 'COMPLEX_NPK' | 'WATER_SOLUBLE' | 'MICRONUTRIENTS' | 'BIO_ORGANIC';
  subcategory?: string;
  images: string[];
  description: string;
  agriculturalUse: string;
  applicableCrops: string[];
  packSize: string;
  price: number;
  mrp: number;
  subsidyDiscountedRate?: number;
  subsidyLabel?: string;
  compositionFormula?: string;
  packagingType?: 'BAG' | 'BOTTLE' | 'POUCH' | 'BOX' | 'CAN';
  stockQuantity: number;
  isOrganic: boolean;
  chemicalComposition?: string;
  dosageGuidance: string;
  safetyPrecautions: string[];
  labelInstructions: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  preferredShopId?: string;
  nearbyShops?: NearbyShopInfo[];
  createdAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  product: Product;
  vendorName: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  brand: string;
  brandBadge?: string;
  price: number;
  mrp?: number;
  subsidyDiscountedRate?: number;
  quantity: number;
  packSize: string;
  imageUrl?: string;
  compositionFormula?: string;
}

export type OrderStatus =
  | 'PENDING_OWNER_CONFIRMATION'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED_AUTO_CANCELLED'
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface Order {
  id: string;
  orderNumber: string;
  farmerId: string;
  farmerName?: string;
  farmerPhone?: string;
  vendorId: string;
  vendorName: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  deliveryAddress: {
    name: string;
    phone: string;
    village: string;
    district: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  paymentMethod: 'UPI' | 'CARDS' | 'NET_BANKING' | 'COD' | 'CASH_ON_PICKUP';
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  status: OrderStatus;
  bookingType?: 'STORE_RESERVATION' | 'DIRECT_PURCHASE';
  pickupPreference?: 'COUNTER_PICKUP' | 'STORE_DELIVERY';
  expiresAt?: string; // 24-hour expiry SLA
  collectionOtp?: string; // 4-digit code generated when accepted
  rejectionReason?: 'OUT_OF_STOCK' | 'PRICE_REVISION' | 'SHOP_CLOSED' | 'DELIVERY_UNAVAILABLE' | string;
  rejectionNotes?: string;
  shopDetails?: {
    id: string;
    name: string;
    address: string;
    phone: string;
    mapUrl?: string;
    distanceKm?: number;
  };
  alternativeShops?: Array<{
    id: string;
    name: string;
    distanceKm: number;
    phone: string;
    address: string;
  }>;
  transferredFromOrderId?: string;
  estimatedDeliveryDate?: string;
  trackingUpdates: {
    status: string;
    message: string;
    timestamp: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export type BookingOrder = Order;

export interface ProduceListing {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  cropName: string;
  variety: string;
  quantity: number;
  unit: 'KG' | 'QUINTAL' | 'TONNE' | 'CRATE';
  expectedPricePerUnit: number;
  harvestDate: string;
  village: string;
  district: string;
  state: string;
  qualityGrade: 'GRADE_A' | 'GRADE_B' | 'STANDARD';
  images: string[];
  description: string;
  photoMetadata?: PhotoMetadata;
  status: 'AVAILABLE' | 'UNDER_NEGOTIATION' | 'SOLD';
  createdAt: string;
}

export interface BuyerRequest {
  id: string;
  produceListingId: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  offeredPricePerUnit: number;
  requestedQuantity: number;
  totalAmount?: number;
  message: string;
  proposedPickupDate?: string;
  status: 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED';
  farmerReason?: string;
  responseNotes?: string;
  respondedAt?: string;
  createdAt: string;
}


export interface ProcurementVendor {
  id: string;
  vendorId: string;
  vendorName: string;
  businessName: string;
  phone: string;
  avatarUrl?: string;
  cropsBought: string[];
  buyingRates: { crop: string; rate: number; unit: string; note?: string }[];
  minQuantity: number;
  maxQuantity: number;
  unit: string;
  village?: string;
  district: string;
  state: string;
  paymentTerms: string;
  pickupAvailable: boolean;
  qualityPreference: string;
  rating: number;
  verified: boolean;
  activeRequestsCount?: number;
}

export interface VendorDealRequest {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  farmerVillage: string;
  farmerDistrict: string;
  farmerState: string;
  vendorId: string;
  vendorName: string;
  shopName: string;
  cropName: string;
  variety: string;
  quantity: number;
  unit: 'QUINTAL' | 'CRATE' | 'KG' | 'TONNE' | 'BUNDLE';
  offeredPricePerUnit: number;
  totalAmount: number;
  proposedHarvestDate: string;
  deliveryPreference: 'FARM_GATE_PICKUP' | 'FARMER_DELIVERY';
  qualityGrade: 'GRADE_A' | 'GRADE_B' | 'ORGANIC' | 'STANDARD';
  notes?: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  vendorResponseNotes?: string;
  pickupScheduledDate?: string;
  confirmedAt?: string;
  rejectedAt?: string;
  createdAt: string;
}

export interface PurchaseOffer {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerBusinessName?: string;
  buyerPhone: string;
  cropName: string;
  variety?: string;
  qualityGrade: string;
  requiredQuantity: number;
  unit: 'QUINTAL' | 'TONNE' | 'CRATE' | 'BAGS' | 'KG';
  targetPrice: number;
  priceUnit: string;
  procurementCenter: string;
  district: string;
  state: string;
  validUntil: string;
  specialRequirements?: string;
  status: 'ACTIVE' | 'CLOSED' | 'FULFILLED';
  matchedFarmersCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface NearbyFarmerProfile {
  id: string;
  farmerId: string;
  farmerName: string;
  phone: string;
  avatarUrl?: string;
  village: string;
  taluk: string;
  district: string;
  state: string;
  distanceKm: number;
  isVerified: boolean;
  totalAcreage: number;
  cropName: string;
  variety: string;
  estimatedQuantity: number;
  unit: 'QUINTAL' | 'TONNE' | 'CRATE' | 'BAGS';
  harvestTimeline: 'READY_NOW' | 'NEXT_7_DAYS' | 'NEXT_15_DAYS' | 'NEXT_30_DAYS';
  expectedPrice: number | null;
  priceUnit: string;
  qualityGrade: string;
  readyHarvestDate: string;
  notes?: string;
}


export interface FarmTask {
  id: string;
  farmId: string;
  cropId?: string;
  userId: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  category: 'IRRIGATION' | 'FERTILIZER' | 'PEST_INSPECTION' | 'WEEDING' | 'HARVEST';
  isCompleted: boolean;
  completedAt?: string;
}

export interface FarmExpense {
  id: string;
  farmId: string;
  cropId?: string;
  userId: string;
  category: 'SEEDS' | 'FERTILIZER' | 'PESTICIDE' | 'LABOUR' | 'IRRIGATION' | 'MACHINERY' | 'TRANSPORT' | 'OTHER';
  amount: number;
  date: string;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string;
  content: string;
  imageUrl?: string;
  referenceType?: 'PRODUCT' | 'ORDER' | 'DIAGNOSIS' | 'PRODUCE';
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  category: 'ORDER' | 'FARM_TASK' | 'WEATHER_ALERT' | 'DIAGNOSIS' | 'PRODUCE_REQUEST' | 'SYSTEM';
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export type MandiCommodityType =
  | 'CROP'
  | 'VEGETABLE'
  | 'FRUIT'
  | 'FLOWER'
  | 'PULSE'
  | 'OILSEED'
  | 'SPICE'
  | 'GRAIN'
  | 'OTHER';

export interface MarketPrice {
  id: string;
  name?: string;
  commodity: string;
  category?: string;
  commodityType: MandiCommodityType;
  variety: string;
  market: string;
  district: string;
  state: string;
  unit: 'QUINTAL' | 'KG' | 'CRATE' | 'BUNDLE' | '100_FLOWERS' | 'TON' | string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  min_price?: number;
  max_price?: number;
  modal_price?: number;
  priceDate: string;
  date?: string;
  trend: 'UP' | 'DOWN' | 'STABLE';
  changeAmount?: number;
  arrivals?: string;
  isFallback?: boolean;
  fallbackSource?: string;
  fallbackBadge?: string;
  reportedBy?: string;
  reportedByName?: string;
  createdAt: string;
}

