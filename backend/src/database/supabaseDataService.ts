import { getSupabase } from './supabaseClient.js';
import { db } from './db.js';
import {
  User,
  FarmerProfile,
  VendorProfile,
  Farm,
  Crop,
  SoilTestRecord,
  AiDiagnosis,
  Product,
  ProductCategory,
  Order,
  ProduceListing,
  VendorDealRequest,
  BuyerRequest,
  MarketPrice,
  AppNotification,
  ChatMessage
} from '../models/types.js';

export class SupabaseDataService {
  // ============================================================================
  // 1. PROFILES & USERS
  // ============================================================================

  public static async getUsers(role?: string): Promise<User[]> {
    const client = getSupabase();
    if (client) {
      try {
        let query = client.from('users').select('*');
        if (role) query = query.eq('role', role);
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map(this.mapUserFromSupabase);
        }
      } catch (e) {
        console.warn('Supabase getUsers fallback to local db:', (e as any)?.message);
      }
    }
    return role ? db.find('users', u => u.role === role) : db.getTable('users');
  }

  public static async getUserById(id: string): Promise<User | undefined> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client.from('users').select('*').eq('id', id).single();
        if (!error && data) return this.mapUserFromSupabase(data);
      } catch (e) {
        console.warn('Supabase getUserById fallback to local db:', (e as any)?.message);
      }
    }
    return db.findById('users', id);
  }

  public static async getUserByEmailOrPhone(identifier: string): Promise<User | undefined> {
    const client = getSupabase();
    if (client) {
      try {
        const lower = identifier.toLowerCase();
        const { data, error } = await client
          .from('users')
          .select('*')
          .or(`email.ilike.${lower},phone.eq.${identifier}`)
          .limit(1);
        if (!error && data && data[0]) return this.mapUserFromSupabase(data[0]);
      } catch (e) {
        console.warn('Supabase getUserByEmailOrPhone fallback to local db:', (e as any)?.message);
      }
    }
    return db.findOne('users', u => u.email?.toLowerCase() === identifier.toLowerCase() || u.phone === identifier);
  }

  public static async createUser(user: User): Promise<User> {
    db.insert('users', user);
    const client = getSupabase();
    if (client) {
      try {
        await client.from('users').upsert({
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          password_hash: user.passwordHash,
          role: user.role,
          language: user.language || 'en',
          village: user.village || '',
          district: user.district || '',
          state: user.state || '',
          pincode: user.pincode || '515591',
          latitude: user.latitude,
          longitude: user.longitude,
          avatar_url: user.avatarUrl,
          created_at: user.createdAt
        });
      } catch (e) {
        console.warn('Supabase createUser async mirror warning:', (e as any)?.message);
      }
    }
    return user;
  }

  public static async getFarmerProfile(userId: string): Promise<FarmerProfile | undefined> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client.from('farmer_profiles').select('*').eq('user_id', userId).single();
        if (!error && data) {
          return {
            id: data.id,
            userId: data.user_id,
            totalAcreage: data.farm_size_acres || 3.0,
            primaryCrops: data.primary_crops || [],
            farmingExperienceYears: data.farming_experience_years || 5,
            farmingType: data.farming_type || 'INTEGRATED',
            soilTypeDefault: data.soil_type || 'RED_LOAM',
            hasSoilCard: !!data.kisan_credit_card,
            irrigationType: (data.irrigation_source?.toUpperCase() as any) || 'BOREWELL'
          };
        }
      } catch (e) {
        console.warn('Supabase getFarmerProfile fallback to local db:', (e as any)?.message);
      }
    }
    return db.findOne('farmer_profiles', p => p.userId === userId);
  }

  public static async createFarmerProfile(profile: FarmerProfile): Promise<FarmerProfile> {
    db.insert('farmer_profiles', profile);
    const client = getSupabase();
    if (client) {
      try {
        await client.from('farmer_profiles').upsert({
          id: profile.id,
          user_id: profile.userId,
          farm_size_acres: profile.totalAcreage,
          primary_crops: profile.primaryCrops,
          soil_type: profile.soilTypeDefault,
          irrigation_source: profile.irrigationType,
          kisan_credit_card: profile.hasSoilCard,
          annual_turnover: 350000,
          created_at: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Supabase createFarmerProfile mirror warning:', (e as any)?.message);
      }
    }
    return profile;
  }

  public static async getVendorProfile(userId: string): Promise<VendorProfile | undefined> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client.from('vendor_profiles').select('*').eq('user_id', userId).single();
        if (!error && data) {
          return {
            id: data.id,
            userId: data.user_id,
            shopName: data.shop_name,
            licenseNumber: data.license_number,
            gstNumber: data.gst_number || '',
            verificationStatus: data.verified ? 'VERIFIED' : 'PENDING',
            address: data.shop_address || '',
            district: data.district || 'Sri Sathya Sai',
            state: data.state || 'Andhra Pradesh',
            pincode: data.pincode || '515591',
            latitude: data.latitude || 14.1120,
            longitude: data.longitude || 78.1601,
            rating: data.rating || 5.0,
            reviewCount: data.review_count || 0,
            deliveryRadiusKm: data.delivery_radius_km || 30,
            contactPhone: data.contact_person || '',
            openingHours: '08:00 AM - 08:00 PM'
          };
        }
      } catch (e) {
        console.warn('Supabase getVendorProfile fallback to local db:', (e as any)?.message);
      }
    }
    return db.findOne('vendor_profiles', p => p.userId === userId);
  }

  public static async createVendorProfile(profile: VendorProfile): Promise<VendorProfile> {
    db.insert('vendor_profiles', profile);
    const client = getSupabase();
    if (client) {
      try {
        await client.from('vendor_profiles').upsert({
          id: profile.id,
          user_id: profile.userId,
          shop_name: profile.shopName,
          shop_address: profile.address,
          license_number: profile.licenseNumber,
          verified: profile.verificationStatus === 'VERIFIED',
          district: profile.district,
          state: profile.state,
          pincode: profile.pincode,
          latitude: profile.latitude,
          longitude: profile.longitude,
          delivery_radius_km: profile.deliveryRadiusKm,
          contact_person: profile.contactPhone,
          created_at: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Supabase createVendorProfile mirror warning:', (e as any)?.message);
      }
    }
    return profile;
  }

  // ============================================================================
  // 2. FARMS & CROPS
  // ============================================================================

  public static async getFarms(userId: string): Promise<Farm[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client.from('farms').select('*').eq('user_id', userId);
        if (!error && data && data.length > 0) {
          return data.map(d => ({
            id: d.id,
            userId: d.user_id,
            name: d.name,
            location: d.village || d.location || 'Kadiri',
            district: d.district || 'Sri Sathya Sai',
            state: d.state || 'Andhra Pradesh',
            totalArea: d.total_acres || 5.0,
            areaUnit: 'ACRE' as const,
            soilType: (d.soil_type?.toUpperCase().replace(/\s+/g, '_') as any) || 'RED_LOAM',
            irrigationSource: (d.irrigation_type?.toUpperCase().replace(/\s+/g, '_') as any) || 'BOREWELL',
            waterAvailability: 'MODERATE' as const,
            createdAt: d.created_at
          }));
        }
      } catch (e) {
        console.warn('Supabase getFarms fallback to local db:', (e as any)?.message);
      }
    }
    return db.find('farms', f => f.userId === userId);
  }

  public static async createFarm(farm: Farm): Promise<Farm> {
    db.insert('farms', farm);
    const client = getSupabase();
    if (client) {
      try {
        await client.from('farms').upsert({
          id: farm.id,
          user_id: farm.userId,
          name: farm.name,
          total_acres: farm.totalArea,
          soil_type: farm.soilType,
          irrigation_type: farm.irrigationSource,
          village: farm.location,
          district: farm.district,
          state: farm.state,
          created_at: farm.createdAt
        });
      } catch (e) {
        console.warn('Supabase createFarm mirror warning:', (e as any)?.message);
      }
    }
    return farm;
  }

  public static async deleteFarm(id: string): Promise<boolean> {
    const local = db.delete('farms', id);
    const client = getSupabase();
    if (client) {
      try {
        await client.from('crops').delete().eq('farm_id', id);
        await client.from('farms').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase deleteFarm mirror warning:', (e as any)?.message);
      }
    }
    return local;
  }

  public static async getCrops(farmId?: string): Promise<Crop[]> {
    const client = getSupabase();
    if (client) {
      try {
        let q = client.from('crops').select('*');
        if (farmId) q = q.eq('farm_id', farmId);
        const { data, error } = await q;
        if (!error && data && data.length > 0) {
          return data.map(d => ({
            id: d.id,
            farmId: d.farm_id,
            cropName: d.crop_name,
            variety: d.variety,
            sowingDate: d.sowing_date,
            expectedHarvestDate: d.expected_harvest_date,
            growthStage: (d.status?.toUpperCase() as any) || 'VEGETATIVE',
            areaPlanted: d.acreage || 2.0,
            healthStatus: (d.health_status?.toUpperCase() as any) || 'HEALTHY',
            createdAt: d.created_at
          }));
        }
      } catch (e) {
        console.warn('Supabase getCrops fallback to local db:', (e as any)?.message);
      }
    }
    return farmId ? db.find('crops', c => c.farmId === farmId) : db.getTable('crops');
  }

  public static async createCrop(crop: Crop): Promise<Crop> {
    db.insert('crops', crop);
    const client = getSupabase();
    if (client) {
      try {
        await client.from('crops').upsert({
          id: crop.id,
          farm_id: crop.farmId,
          crop_name: crop.cropName,
          variety: crop.variety,
          season: 'KHARIF',
          sowing_date: crop.sowingDate,
          expected_harvest_date: crop.expectedHarvestDate,
          acreage: crop.areaPlanted,
          status: crop.growthStage,
          health_status: crop.healthStatus,
          created_at: crop.createdAt
        });
      } catch (e) {
        console.warn('Supabase createCrop mirror warning:', (e as any)?.message);
      }
    }
    return crop;
  }

  public static async updateCrop(id: string, updates: Partial<Crop>): Promise<Crop | undefined> {
    const local = db.update('crops', id, updates);
    const client = getSupabase();
    if (client) {
      try {
        const payload: any = {};
        if (updates.cropName) payload.crop_name = updates.cropName;
        if (updates.variety) payload.variety = updates.variety;
        if (updates.growthStage) payload.status = updates.growthStage;
        if (updates.healthStatus) payload.health_status = updates.healthStatus;
        if (updates.expectedHarvestDate) payload.expected_harvest_date = updates.expectedHarvestDate;
        if (updates.areaPlanted !== undefined) payload.acreage = updates.areaPlanted;
        await client.from('crops').update(payload).eq('id', id);
      } catch (e) {
        console.warn('Supabase updateCrop mirror warning:', (e as any)?.message);
      }
    }
    return local;
  }

  public static async deleteCrop(id: string): Promise<boolean> {
    const local = db.delete('crops', id);
    const client = getSupabase();
    if (client) {
      try {
        await client.from('crops').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase deleteCrop mirror warning:', (e as any)?.message);
      }
    }
    return local;
  }

  // ============================================================================
  // 3. DISEASE SCANS (AI DIAGNOSES)
  // ============================================================================

  public static async getDiagnoses(userId: string): Promise<AiDiagnosis[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client.from('ai_diagnoses').select('*').eq('user_id', userId);
        if (!error && data && data.length > 0) {
          return data.map(d => ({
            id: d.id,
            userId: d.user_id,
            farmId: d.farm_id,
            cropName: d.crop_name,
            imageUrl: d.image_url,
            photoMetadata: d.photo_metadata,
            suspectedIssue: d.suspected_issue,
            confidenceScore: d.confidence_score,
            severity: d.severity,
            symptomsEvidence: d.symptoms_evidence || [],
            culturalControl: d.cultural_control || [],
            biologicalControl: d.biological_control || [],
            chemicalControlSafe: d.chemical_control_safe || [],
            safetyWarnings: d.safety_warnings || [],
            recommendedProductIds: d.recommended_product_ids || [],
            followUpQuestions: d.follow_up_questions || [],
            isExpertReviewed: d.is_expert_reviewed || false,
            createdAt: d.created_at
          }));
        }
      } catch (e) {
        console.warn('Supabase getDiagnoses fallback to local db:', (e as any)?.message);
      }
    }
    return db.find('ai_diagnoses', d => d.userId === userId);
  }

  public static async saveDiagnosis(diagnosis: AiDiagnosis): Promise<AiDiagnosis> {
    db.insert('ai_diagnoses', diagnosis);
    const client = getSupabase();
    if (client) {
      try {
        await client.from('ai_diagnoses').upsert({
          id: diagnosis.id,
          user_id: diagnosis.userId,
          farm_id: diagnosis.farmId,
          crop_name: diagnosis.cropName,
          image_url: diagnosis.imageUrl,
          photo_metadata: diagnosis.photoMetadata,
          suspected_issue: diagnosis.suspectedIssue,
          confidence_score: diagnosis.confidenceScore,
          severity: diagnosis.severity,
          symptoms_evidence: diagnosis.symptomsEvidence,
          cultural_control: diagnosis.culturalControl,
          biological_control: diagnosis.biologicalControl,
          chemical_control_safe: diagnosis.chemicalControlSafe,
          safety_warnings: diagnosis.safetyWarnings,
          recommended_product_ids: diagnosis.recommendedProductIds,
          follow_up_questions: diagnosis.followUpQuestions,
          is_expert_reviewed: diagnosis.isExpertReviewed,
          created_at: diagnosis.createdAt
        });
      } catch (e) {
        console.warn('Supabase saveDiagnosis mirror warning:', (e as any)?.message);
      }
    }
    return diagnosis;
  }

  // ============================================================================
  // 4. SOIL HEALTH RECORDS
  // ============================================================================

  public static async getSoilTests(farmId?: string): Promise<SoilTestRecord[]> {
    const client = getSupabase();
    if (client) {
      try {
        let q = client.from('soil_tests').select('*');
        if (farmId) q = q.eq('farm_id', farmId);
        const { data, error } = await q;
        if (!error && data && data.length > 0) {
          return data.map(d => ({
            id: d.id,
            farmId: d.farm_id,
            userId: d.user_id,
            testDate: d.test_date,
            isLabCertified: d.is_lab_certified,
            sourceType: d.source_type,
            ph: d.ph,
            nitrogenKgPerHa: d.nitrogen_kg_per_ha,
            phosphorusKgPerHa: d.phosphorus_kg_per_ha,
            potassiumKgPerHa: d.potassium_kg_per_ha,
            organicCarbonPct: d.organic_carbon_pct,
            electricalConductivity: d.electrical_conductivity,
            soilMoisturePct: d.soil_moisture_pct,
            summary: d.summary,
            recommendations: d.recommendations || [],
            createdAt: d.created_at
          }));
        }
      } catch (e) {
        console.warn('Supabase getSoilTests fallback to local db:', (e as any)?.message);
      }
    }
    return farmId ? db.find('soil_tests', s => s.farmId === farmId) : db.getTable('soil_tests');
  }

  public static async saveSoilTest(test: SoilTestRecord): Promise<SoilTestRecord> {
    db.insert('soil_tests', test);
    const client = getSupabase();
    if (client) {
      try {
        await client.from('soil_tests').upsert({
          id: test.id,
          farm_id: test.farmId,
          user_id: test.userId,
          test_date: test.testDate,
          is_lab_certified: test.isLabCertified,
          source_type: test.sourceType,
          ph: test.ph,
          nitrogen_kg_per_ha: test.nitrogenKgPerHa,
          phosphorus_kg_per_ha: test.phosphorusKgPerHa,
          potassium_kg_per_ha: test.potassiumKgPerHa,
          organic_carbon_pct: test.organicCarbonPct,
          electrical_conductivity: test.electricalConductivity,
          soil_moisture_pct: test.soilMoisturePct,
          summary: test.summary,
          recommendations: test.recommendations,
          created_at: test.createdAt
        });
      } catch (e) {
        console.warn('Supabase saveSoilTest mirror warning:', (e as any)?.message);
      }
    }
    return test;
  }

  // ============================================================================
  // 5. MARKETPLACE PRODUCTS & CATEGORIES
  // ============================================================================

  public static async getProducts(category?: string): Promise<Product[]> {
    const client = getSupabase();
    if (client) {
      try {
        let q = client.from('products').select('*');
        if (category && category !== 'ALL') q = q.eq('category', category);
        const { data, error } = await q;
        if (!error && data && data.length > 0) {
          return data.map(d => ({
            id: d.id,
            vendorId: d.vendor_id,
            categoryId: d.category_id,
            name: d.name,
            brand: d.brand,
            category: d.category,
            images: d.images || [],
            description: d.description,
            agriculturalUse: d.agricultural_use,
            applicableCrops: ['All Crops'],
            packSize: d.pack_size,
            price: d.price,
            mrp: d.original_price || d.price,
            stockQuantity: d.stock_quantity || 50,
            isOrganic: d.is_organic || false,
            dosageGuidance: d.dosage_guidance || '',
            safetyPrecautions: d.safety_warnings || [],
            labelInstructions: d.label_instructions || '',
            status: 'APPROVED',
            createdAt: d.created_at
          }));
        }
      } catch (e) {
        console.warn('Supabase getProducts fallback to local db:', (e as any)?.message);
      }
    }
    return category && category !== 'ALL'
      ? db.find('products', p => p.category === category)
      : db.getTable('products');
  }

  public static async getProductById(id: string): Promise<Product | undefined> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client.from('products').select('*').eq('id', id).single();
        if (!error && data) {
          return {
            id: data.id,
            vendorId: data.vendor_id,
            categoryId: data.category_id,
            name: data.name,
            brand: data.brand,
            category: data.category,
            images: data.images || [],
            description: data.description,
            agriculturalUse: data.agricultural_use,
            applicableCrops: ['All Crops'],
            packSize: data.pack_size,
            price: data.price,
            mrp: data.original_price || data.price,
            stockQuantity: data.stock_quantity || 50,
            isOrganic: data.is_organic || false,
            dosageGuidance: data.dosage_guidance || '',
            safetyPrecautions: data.safety_warnings || [],
            labelInstructions: data.label_instructions || '',
            status: 'APPROVED',
            createdAt: data.created_at
          };
        }
      } catch (e) {
        console.warn('Supabase getProductById fallback to local db:', (e as any)?.message);
      }
    }
    return db.findById('products', id);
  }

  public static async createProduct(product: Product): Promise<Product> {
    db.insert('products', product);
    const client = getSupabase();
    if (client) {
      try {
        await client.from('products').upsert({
          id: product.id,
          vendor_id: product.vendorId,
          category_id: product.categoryId,
          name: product.name,
          brand: product.brand,
          category: product.category,
          price: product.price,
          original_price: product.mrp,
          pack_size: product.packSize,
          in_stock: product.stockQuantity > 0,
          stock_quantity: product.stockQuantity,
          images: product.images,
          description: product.description,
          agricultural_use: product.agriculturalUse,
          dosage_guidance: product.dosageGuidance,
          label_instructions: product.labelInstructions,
          safety_warnings: product.safetyPrecautions,
          created_at: product.createdAt
        });
      } catch (e) {
        console.warn('Supabase createProduct mirror warning:', (e as any)?.message);
      }
    }
    return product;
  }

  public static async updateProductStock(id: string, stockQuantity: number): Promise<Product | undefined> {
    const local = db.update('products', id, { stockQuantity });
    const client = getSupabase();
    if (client) {
      try {
        await client.from('products').update({
          stock_quantity: stockQuantity,
          in_stock: stockQuantity > 0
        }).eq('id', id);
      } catch (e) {
        console.warn('Supabase updateProductStock mirror warning:', (e as any)?.message);
      }
    }
    return local;
  }

  // ============================================================================
  // 6. PRODUCE LISTINGS & DEALS
  // ============================================================================

  public static async getProduceListings(status?: string): Promise<ProduceListing[]> {
    const client = getSupabase();
    if (client) {
      try {
        let q = client.from('produce_listings').select('*');
        if (status) q = q.eq('status', status);
        const { data, error } = await q;
        if (!error && data && data.length > 0) {
          return data.map(d => ({
            id: d.id,
            farmerId: d.farmer_id,
            farmerName: d.farmer_name,
            farmerPhone: d.farmer_phone,
            cropName: d.crop_name,
            variety: d.variety,
            quantity: d.quantity_quintals,
            unit: 'QUINTAL',
            expectedPricePerUnit: d.expected_price_per_quintal,
            harvestDate: d.harvest_date,
            village: d.location.split(',')[0] || 'Kadiri',
            district: d.district,
            state: d.state,
            qualityGrade: 'GRADE_A',
            images: d.photos || [],
            description: d.description || '',
            status: d.status,
            createdAt: d.created_at
          }));
        }
      } catch (e) {
        console.warn('Supabase getProduceListings fallback to local db:', (e as any)?.message);
      }
    }
    return status ? db.find('produce_listings', p => p.status === status) : db.getTable('produce_listings');
  }

  public static async createProduceListing(listing: ProduceListing): Promise<ProduceListing> {
    db.insert('produce_listings', listing);
    const client = getSupabase();
    if (client) {
      try {
        await client.from('produce_listings').upsert({
          id: listing.id,
          farmer_id: listing.farmerId,
          farmer_name: listing.farmerName,
          farmer_phone: listing.farmerPhone,
          crop_name: listing.cropName,
          variety: listing.variety,
          quantity_quintals: listing.quantity,
          available_quantity_quintals: listing.quantity,
          expected_price_per_quintal: listing.expectedPricePerUnit,
          harvest_date: listing.harvestDate,
          description: listing.description,
          photos: listing.images || [],
          location: `${listing.village}, ${listing.district}`,
          district: listing.district,
          state: listing.state,
          pincode: '515591',
          status: listing.status,
          verified_sample: true,
          created_at: listing.createdAt
        });
      } catch (e) {
        console.warn('Supabase createProduceListing mirror warning:', (e as any)?.message);
      }
    }
    return listing;
  }

  public static async getVendorDeals(farmerId?: string, vendorId?: string): Promise<VendorDealRequest[]> {
    const client = getSupabase();
    if (client) {
      try {
        let q = client.from('vendor_deal_requests').select('*');
        if (farmerId) q = q.eq('farmer_id', farmerId);
        if (vendorId) q = q.eq('vendor_id', vendorId);
        const { data, error } = await q;
        if (!error && data && data.length > 0) {
          return data.map(d => ({
            id: d.id,
            farmerId: d.farmer_id,
            farmerName: d.farmer_name || 'Farmer',
            farmerPhone: d.farmer_phone || '+91 98480 12345',
            farmerVillage: d.farmer_village || 'Kadiri',
            farmerDistrict: d.district || 'Sri Sathya Sai',
            farmerState: d.state || 'Andhra Pradesh',
            vendorId: d.vendor_id,
            vendorName: d.vendor_name,
            shopName: d.shop_name || 'Wholesale Mandi Depot',
            cropName: d.crop_name,
            variety: d.variety,
            quantity: d.requested_quantity_quintals || 25,
            unit: 'QUINTAL' as const,
            offeredPricePerUnit: d.offered_price_per_quintal || 6200,
            totalAmount: d.total_deal_value || 155000,
            proposedHarvestDate: d.delivery_window || new Date().toISOString().split('T')[0],
            deliveryPreference: (d.pickup_type as any) || 'FARM_GATE_PICKUP',
            qualityGrade: 'GRADE_A' as const,
            notes: d.notes,
            status: d.status as 'PENDING' | 'CONFIRMED' | 'REJECTED',
            vendorResponseNotes: d.vendor_response_notes,
            pickupScheduledDate: d.pickup_scheduled_date,
            createdAt: d.created_at
          }));
        }
      } catch (e) {
        console.warn('Supabase getVendorDeals fallback to local db:', (e as any)?.message);
      }
    }
    if (farmerId) return db.find('vendor_deal_requests', d => d.farmerId === farmerId);
    if (vendorId) return db.find('vendor_deal_requests', d => d.vendorId === vendorId);
    return db.getTable('vendor_deal_requests');
  }

  public static async createVendorDeal(deal: VendorDealRequest): Promise<VendorDealRequest> {
    db.insert('vendor_deal_requests', deal);
    const client = getSupabase();
    if (client) {
      try {
        await client.from('vendor_deal_requests').upsert({
          id: deal.id,
          farmer_id: deal.farmerId,
          farmer_name: deal.farmerName,
          farmer_phone: deal.farmerPhone,
          vendor_id: deal.vendorId,
          vendor_name: deal.vendorName,
          crop_name: deal.cropName,
          variety: deal.variety,
          offered_price_per_quintal: deal.offeredPricePerUnit,
          requested_quantity_quintals: deal.quantity,
          total_deal_value: deal.totalAmount,
          pickup_type: deal.deliveryPreference,
          delivery_window: deal.proposedHarvestDate,
          notes: deal.notes,
          status: deal.status,
          created_at: deal.createdAt
        });
      } catch (e) {
        console.warn('Supabase createVendorDeal mirror warning:', (e as any)?.message);
      }
    }
    return deal;
  }

  public static async updateVendorDealStatus(
    id: string,
    status: 'CONFIRMED' | 'REJECTED'
  ): Promise<VendorDealRequest | undefined> {
    const local = db.update('vendor_deal_requests', id, { status, updatedAt: new Date().toISOString() } as any);
    const client = getSupabase();
    if (client) {
      try {
        await client.from('vendor_deal_requests').update({
          status,
          updated_at: new Date().toISOString()
        }).eq('id', id);
      } catch (e) {
        console.warn('Supabase updateVendorDealStatus mirror warning:', (e as any)?.message);
      }
    }
    return local;
  }

  // ============================================================================
  // 7. ORDERS
  // ============================================================================

  public static async getOrders(userId?: string, role?: string): Promise<Order[]> {
    const client = getSupabase();
    if (client) {
      try {
        let q = client.from('orders').select('*');
        if (userId && role === 'FARMER') q = q.eq('farmer_id', userId);
        else if (userId && role === 'VENDOR') q = q.eq('vendor_id', userId);
        const { data, error } = await q;
        if (!error && data && data.length > 0) {
          return data.map(d => ({
            id: d.id,
            orderNumber: d.id,
            farmerId: d.farmer_id,
            vendorId: d.vendor_id,
            vendorName: 'Sri Lakshmi Agri Inputs',
            items: d.items || [],
            subtotal: d.total_amount,
            deliveryFee: 0,
            totalAmount: d.total_amount,
            deliveryAddress: {
              name: 'Farmer',
              phone: '+91 98480 12345',
              village: d.delivery_address,
              district: 'Kadiri',
              state: 'AP',
              pincode: '515591'
            },
            paymentMethod: 'COD',
            paymentStatus: d.payment_status || 'PENDING',
            status: d.delivery_status || 'CONFIRMED',
            estimatedDeliveryDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
            trackingUpdates: d.tracking_timeline || [],
            createdAt: d.created_at,
            updatedAt: d.created_at
          }));
        }
      } catch (e) {
        console.warn('Supabase getOrders fallback to local db:', (e as any)?.message);
      }
    }
    if (userId && role === 'FARMER') return db.find('orders', o => o.farmerId === userId);
    if (userId && role === 'VENDOR') return db.find('orders', o => o.vendorId === userId);
    return db.getTable('orders');
  }

  public static async createOrder(order: Order): Promise<Order> {
    db.insert('orders', order);
    const client = getSupabase();
    if (client) {
      try {
        await client.from('orders').upsert({
          id: order.id,
          farmer_id: order.farmerId,
          vendor_id: order.vendorId,
          items: order.items,
          total_amount: order.totalAmount,
          payment_mode: order.paymentMethod,
          payment_status: order.paymentStatus,
          delivery_address: `${order.deliveryAddress.village}, ${order.deliveryAddress.district}`,
          delivery_status: order.status,
          tracking_timeline: order.trackingUpdates,
          created_at: order.createdAt
        });
      } catch (e) {
        console.warn('Supabase createOrder mirror warning:', (e as any)?.message);
      }
    }
    return order;
  }

  public static async updateOrderStatus(id: string, status: Order['status'], trackingUpdates: any[]): Promise<Order | undefined> {
    const local = db.update('orders', id, {
      status,
      trackingUpdates,
      updatedAt: new Date().toISOString()
    });
    const client = getSupabase();
    if (client) {
      try {
        await client.from('orders').update({
          delivery_status: status,
          tracking_timeline: trackingUpdates
        }).eq('id', id);
      } catch (e) {
        console.warn('Supabase updateOrderStatus mirror warning:', (e as any)?.message);
      }
    }
    return local;
  }

  // ============================================================================
  // 8. MARKET PRICES
  // ============================================================================

  public static async getMarketPrices(state?: string, district?: string): Promise<MarketPrice[]> {
    const client = getSupabase();
    if (client) {
      try {
        let q = client.from('market_prices').select('*');
        if (state && state !== 'ALL') q = q.eq('state', state);
        if (district && district !== 'ALL') q = q.eq('district', district);
        const { data, error } = await q;
        if (!error && data && data.length > 0) {
          return data.map(d => ({
            id: d.id,
            state: d.state,
            district: d.district,
            market: d.market,
            commodity: d.commodity,
            commodityType: d.commodity_type || 'CROP',
            variety: d.variety,
            unit: d.unit || 'QUINTAL',
            minPrice: d.min_price,
            maxPrice: d.max_price,
            modalPrice: d.modal_price,
            priceDate: d.price_date,
            trend: d.trend,
            changeAmount: d.change_amount || 0,
            reportedBy: d.reported_by,
            reportedByName: d.reported_by_name,
            createdAt: d.created_at
          }));
        }
      } catch (e) {
        console.warn('Supabase getMarketPrices fallback to local db:', (e as any)?.message);
      }
    }
    return db.getTable('market_prices');
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private static mapUserFromSupabase(d: any): User {
    return {
      id: d.id,
      name: d.name,
      phone: d.phone,
      email: d.email,
      passwordHash: d.password_hash,
      role: d.role,
      language: d.language || 'en',
      village: d.village,
      district: d.district,
      state: d.state,
      pincode: d.pincode,
      latitude: d.latitude,
      longitude: d.longitude,
      avatarUrl: d.avatar_url,
      createdAt: d.created_at,
      updatedAt: d.updated_at
    };
  }
}
