export type UserRole = 'FARMER' | 'VENDOR' | 'BUYER' | 'EXPERT' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
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
  confidenceScore: number;
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

export interface Product {
  id: string;
  vendorId: string;
  categoryId: string;
  name: string;
  brand: string;
  category: 'SEEDS' | 'FERTILIZERS' | 'CROP_PROTECTION' | 'EQUIPMENT';
  images: string[];
  description: string;
  agriculturalUse: string;
  applicableCrops: string[];
  packSize: string;
  price: number;
  mrp: number;
  stockQuantity: number;
  isOrganic: boolean;
  chemicalComposition?: string;
  dosageGuidance: string;
  safetyPrecautions: string[];
  labelInstructions: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
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
  price: number;
  quantity: number;
  packSize: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  farmerId: string;
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
  paymentMethod: 'UPI' | 'CARDS' | 'NET_BANKING' | 'COD';
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  estimatedDeliveryDate: string;
  trackingUpdates: {
    status: string;
    message: string;
    timestamp: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

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

export type MandiCommodityType = 'CROP' | 'VEGETABLE' | 'FRUIT' | 'FLOWER' | 'PULSE' | 'OILSEED' | 'SPICE';

export interface MarketPrice {
  id: string;
  state: string;
  district: string;
  market: string;
  commodity: string;
  commodityType: MandiCommodityType;
  variety: string;
  unit: 'QUINTAL' | 'KG' | 'CRATE' | 'BUNDLE' | '100_FLOWERS';
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  priceDate: string;
  trend: 'UP' | 'DOWN' | 'STABLE';
  changeAmount?: number;
  reportedBy?: string;
  reportedByName?: string;
  createdAt: string;
}

