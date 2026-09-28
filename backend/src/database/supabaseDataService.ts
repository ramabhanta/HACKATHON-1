import crypto from 'crypto';
import { getSupabase } from './supabaseClient.js';
import { db } from './db.js';
import {
  User,
  UserRole,
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
        let { data, error } = await query;

        if (error || !data || data.length === 0) {
          let pQuery = client.from('profiles').select('*');
          if (role) pQuery = pQuery.eq('role', role);
          const pRes = await pQuery;
          if (!pRes.error && pRes.data && pRes.data.length > 0) {
            data = pRes.data;
          }
        }

        if (data && data.length > 0) {
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
        let { data, error } = await client.from('users').select('*').eq('id', id).single();
        if (error || !data) {
          const p = await client.from('profiles').select('*').eq('id', id).single();
          if (!p.error && p.data) data = p.data;
        }
        if (data) return this.mapUserFromSupabase(data);
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
        let { data, error } = await client
          .from('users')
          .select('*')
          .or(`email.ilike.${lower},phone.eq.${identifier},name.ilike.${lower}`)
          .limit(1);
        if (error || !data || data.length === 0) {
          const p = await client
            .from('profiles')
            .select('*')
            .or(`email.ilike.${lower},phone.eq.${identifier},name.ilike.${lower}`)
            .limit(1);
          if (!p.error && p.data && p.data[0]) data = p.data;
        }
        if (data && data[0]) return this.mapUserFromSupabase(data[0]);
      } catch (e) {
        console.warn('Supabase getUserByEmailOrPhone fallback to local db:', (e as any)?.message);
      }
    }
    return db.findOne('users', u => 
      u.email?.toLowerCase() === identifier.toLowerCase() || 
      u.phone === identifier ||
      u.name?.toLowerCase() === identifier.toLowerCase()
    );
  }

  public static async getUserByPhone(phone: string): Promise<User | undefined> {
    const rawDigits = phone.replace(/[^0-9]/g, '');
    const clean10 = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;
    const client = getSupabase();
    if (client) {
      try {
        let { data, error } = await client
          .from('users')
          .select('*')
          .or(`phone.ilike.%${clean10}%,phone.eq.${phone}`)
          .limit(1);
        if (error || !data || data.length === 0) {
          const p = await client
            .from('profiles')
            .select('*')
            .or(`phone.ilike.%${clean10}%,phone.eq.${phone}`)
            .limit(1);
          if (!p.error && p.data && p.data[0]) data = p.data;
        }
        if (data && data[0]) return this.mapUserFromSupabase(data[0]);
      } catch (e) {
        console.warn('Supabase getUserByPhone fallback to local db:', (e as any)?.message);
      }
    }
    return db.findOne('users', u => {
      const uDigits = (u.phone || '').replace(/[^0-9]/g, '');
      return uDigits.endsWith(clean10) || u.phone === phone;
    });
  }

  public static async createUser(user: User): Promise<User> {
    db.insert('users', user);
    const client = getSupabase();
    if (client) {
      const userPayload = {
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
      };
      try {
        await Promise.allSettled([
          client.from('users').upsert(userPayload),
          client.from('profiles').upsert(userPayload)
        ]);
        console.log(`✅ [SUPABASE] User '${user.name}' (${user.email}) created.`);
      } catch (e: any) {
        console.error('[SUPABASE ERROR] createUser error:', e?.message || e);
      }
    }
    return user;
  }

  public static toUuid(str: string): string {
    if (!str) return 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
      return str;
    }
    const hash = crypto.createHash('md5').update(str).digest('hex');
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
  }

  public static async upsertProfile(user: User, rawPassword?: string): Promise<void> {
    const client = getSupabase();
    if (!client) return;

    const userUuid = this.toUuid(user.id);
    const payload: any = {
      id: userUuid,
      name: user.name || 'Farmer',
      phone: user.phone || '+91 99515 18699',
      role: (user.role || 'farmer').toLowerCase(),
      location: `${user.village || ''}, ${user.district || 'Kadiri'}`.replace(/^, /, ''),
      created_at: user.createdAt || new Date().toISOString()
    };

    try {
      const { error } = await client.from('profiles').upsert(payload, { onConflict: 'id' });
      if (error) {
        console.warn('[SUPABASE] upsertProfile error:', error.message);
      } else {
        console.log(`✅ [SUPABASE SUCCESS] Profile '${user.name}' upserted to Supabase 'profiles' (UUID: ${userUuid}).`);
      }
    } catch (err: any) {
      console.warn('[SUPABASE EXCEPTION] upsertProfile:', err?.message || err);
    }
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
        let q = client.from('farms').select('*');
        if (userId) {
          q = q.or(`user_id.eq.${userId},farmer_id.eq.${userId}`);
        }
        let { data, error } = await q;

        if (error) {
          console.error('[SUPABASE ERROR] getFarms failed:', error.message);
          const fallback = await client.from('farms').select('*').eq('user_id', userId);
          if (!fallback.error && fallback.data) data = fallback.data;
        }

        if (data && data.length > 0) {
          return data.map(d => ({
            id: d.id,
            userId: d.user_id || d.farmer_id || userId,
            name: d.name,
            location: d.village || d.location || 'Kadiri',
            district: d.district || 'Sri Sathya Sai',
            state: d.state || 'Andhra Pradesh',
            totalArea: d.total_acres || d.total_area || d.area_acres || 5.0,
            areaUnit: 'ACRE' as const,
            soilType: (d.soil_type?.toUpperCase().replace(/\s+/g, '_') as any) || 'RED_LOAM',
            irrigationSource: (d.irrigation_type?.toUpperCase().replace(/\s+/g, '_') as any) || 'BOREWELL',
            waterAvailability: 'MODERATE' as const,
            createdAt: d.created_at
          }));
        }
      } catch (e: any) {
        console.error('[SUPABASE EXCEPTION] getFarms:', e?.message || e);
      }
    }
    return db.find('farms', f => f.userId === userId || !f.userId);
  }

  public static async createFarm(farm: Farm): Promise<Farm> {
    db.insert('farms', farm);
    const client = getSupabase();
    if (client) {
      const farmPayload: any = {
        id: farm.id,
        user_id: farm.userId,
        farmer_id: farm.userId,
        name: farm.name,
        total_acres: farm.totalArea,
        soil_type: farm.soilType,
        irrigation_type: farm.irrigationSource,
        village: farm.location,
        district: farm.district,
        state: farm.state,
        created_at: farm.createdAt
      };
      try {
        console.log(`[SUPABASE] Inserting farm '${farm.name}' into 'farms'...`);
        const { error } = await client.from('farms').upsert(farmPayload, { onConflict: 'id' });
        if (error) {
          console.error('[SUPABASE ERROR] createFarm failed:', error.message);
          if (error.message.includes('farmer_id') || error.message.includes('column')) {
            delete farmPayload.farmer_id;
            await client.from('farms').upsert(farmPayload, { onConflict: 'id' });
          }
        } else {
          console.log(`✅ [SUPABASE SUCCESS] Farm '${farm.name}' saved to farms table.`);
        }
      } catch (e: any) {
        console.error('[SUPABASE EXCEPTION] createFarm:', e?.message || e);
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
      } catch (e: any) {
        console.error('[SUPABASE ERROR] deleteFarm:', e?.message || e);
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
        if (error) {
          console.error('[SUPABASE ERROR] getCrops failed:', error.message);
        } else if (data && data.length > 0) {
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
      } catch (e: any) {
        console.error('[SUPABASE EXCEPTION] getCrops:', e?.message || e);
      }
    }
    return farmId ? db.find('crops', c => c.farmId === farmId) : db.getTable('crops');
  }

  public static async createCrop(crop: Crop): Promise<Crop> {
    db.insert('crops', crop);
    const client = getSupabase();
    if (client) {
      const cropPayload = {
        id: crop.id,
        farm_id: crop.farmId,
        crop_name: crop.cropName,
        variety: crop.variety,
        season: 'KHARIF',
        sowing_date: crop.sowingDate ? crop.sowingDate.split('T')[0] : '2026-07-10',
        expected_harvest_date: crop.expectedHarvestDate ? crop.expectedHarvestDate.split('T')[0] : '2026-10-25',
        acreage: crop.areaPlanted,
        status: crop.growthStage,
        health_status: crop.healthStatus,
        created_at: crop.createdAt
      };
      try {
        console.log(`[SUPABASE] Inserting crop '${crop.cropName}' into 'crops'...`);
        const { error } = await client.from('crops').upsert(cropPayload, { onConflict: 'id' });
        if (error) {
          console.error('[SUPABASE ERROR] createCrop failed:', error.message);
        } else {
          console.log(`✅ [SUPABASE SUCCESS] Crop '${crop.cropName}' saved to crops table.`);
        }
      } catch (e: any) {
        console.error('[SUPABASE EXCEPTION] createCrop:', e?.message || e);
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
  // 2b. SOIL TESTS & HEALTH RECORDS
  // ============================================================================

  public static async getSoilTests(farmId?: string): Promise<SoilTestRecord[]> {
    const client = getSupabase();
    if (client) {
      try {
        let q = client.from('soil_health_records').select('*');
        if (farmId) q = q.eq('farm_id', this.toUuid(farmId));
        const { data, error } = await q;
        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            farmId: farmId || 'farm-1',
            userId: 'usr-farmer-1',
            testDate: d.tested_at || new Date().toISOString().split('T')[0],
            isLabCertified: true,
            sourceType: 'LAB_REPORT',
            ph: d.ph_level || 6.8,
            nitrogenKgPerHa: d.nitrogen || 180,
            phosphorusKgPerHa: d.phosphorus || 22,
            potassiumKgPerHa: d.potassium || 240,
            organicCarbonPct: d.organic_carbon || 0.55,
            electricalConductivity: 0.8,
            soilMoisturePct: 35,
            summary: `Soil pH: ${d.ph_level || 6.8}, Nitrogen: ${d.nitrogen || 180} kg/ha, Phosphorus: ${d.phosphorus || 22} kg/ha, Potassium: ${d.potassium || 240} kg/ha.`,
            recommendations: d.fertilizer_recommendation ? d.fertilizer_recommendation.split('; ') : ['Apply balanced NPK nutrients based on crop stage.'],
            createdAt: d.tested_at || new Date().toISOString()
          }));
        }
      } catch (e: any) {
        console.warn('Supabase getSoilTests fallback:', e?.message);
      }
    }
    return farmId ? db.find('soil_tests', s => s.farmId === farmId) : db.getTable('soil_tests');
  }

  public static async saveSoilTest(record: SoilTestRecord): Promise<SoilTestRecord> {
    db.insert('soil_tests', record);
    const client = getSupabase();
    if (client) {
      try {
        const soilUuid = this.toUuid(record.id);
        const farmUuid = this.toUuid(record.farmId || 'farm-1');
        const payload = {
          id: soilUuid,
          farm_id: farmUuid,
          ph_level: record.ph,
          nitrogen: record.nitrogenKgPerHa,
          phosphorus: record.phosphorusKgPerHa,
          potassium: record.potassiumKgPerHa,
          organic_carbon: record.organicCarbonPct,
          fertilizer_recommendation: Array.isArray(record.recommendations) ? record.recommendations.join('; ') : String(record.recommendations || ''),
          tested_at: record.testDate ? record.testDate.split('T')[0] : new Date().toISOString().split('T')[0]
        };
        const { error } = await client.from('soil_health_records').upsert(payload, { onConflict: 'id' });
        if (error) {
          console.warn('[SUPABASE] saveSoilTest error:', error.message);
        } else {
          console.log(`✅ [SUPABASE SUCCESS] Soil test persisted to Supabase soil_health_records (UUID: ${soilUuid}).`);
        }
      } catch (err: any) {
        console.warn('[SUPABASE EXCEPTION] saveSoilTest:', err?.message || err);
      }
    }
    return record;
  }

  // ============================================================================
  // 3. DISEASE SCANS (AI DIAGNOSES)
  // ============================================================================

  public static async getDiagnoses(userId?: string): Promise<AiDiagnosis[]> {
    const client = getSupabase();
    if (client) {
      try {
        let q = client.from('disease_scans').select('*');
        if (userId) q = q.eq('user_id', userId);
        let { data, error } = await q.order('created_at', { ascending: false });

        if (error || !data || data.length === 0) {
          let aiQ = client.from('ai_diagnoses').select('*');
          if (userId) aiQ = aiQ.eq('user_id', userId);
          const aiRes = await aiQ.order('created_at', { ascending: false });
          if (!aiRes.error && aiRes.data && aiRes.data.length > 0) {
            data = aiRes.data;
          }
        }

        if (data && data.length > 0) {
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
    return userId ? db.find('ai_diagnoses', d => d.userId === userId) : db.getTable('ai_diagnoses');
  }

  public static async saveDiagnosis(diagnosis: AiDiagnosis): Promise<AiDiagnosis> {
    db.insert('ai_diagnoses', diagnosis);
    const client = getSupabase();
    if (client) {
      const remediesList = [
        ...(diagnosis.culturalControl || []),
        ...(diagnosis.biologicalControl || []),
        ...(diagnosis.chemicalControlSafe || [])
      ];
      const remediesStr = remediesList.length > 0
        ? remediesList.map(r => `• ${r}`).join('\n')
        : 'Consult local Krishi Vigyan Kendra (KVK)';

      // Ensure valid UUID for farmer_id and id
      let farmerId = diagnosis.userId;
      if (!farmerId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(farmerId)) {
        farmerId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // Default farmer UUID
      }
      let scanId = diagnosis.id;
      if (!scanId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(scanId)) {
        scanId = crypto.randomUUID();
      }

      const scanPayload: any = {
        id: scanId,
        farmer_id: farmerId,
        image_url: diagnosis.imageUrl || 'https://images.unsplash.com/photo-1592417817098-8f3d6910a455?w=500',
        detected_disease: diagnosis.suspectedIssue || 'Plant Foliar Condition',
        confidence_score: diagnosis.confidenceScore > 1 ? Number((diagnosis.confidenceScore / 100).toFixed(2)) : (diagnosis.confidenceScore || 0.95),
        treatment_recommendations: remediesStr,
        created_at: diagnosis.createdAt || new Date().toISOString()
      };

      try {
        console.log(`[SUPABASE] Inserting diagnosis '${scanId}' into 'disease_scans'...`);
        const { error } = await client.from('disease_scans').upsert(scanPayload, { onConflict: 'id' });
        if (error) {
          console.error('[SUPABASE ERROR] disease_scans upsert failed:', error.message, error.details || error);
        } else {
          console.log(`✅ [SUPABASE SUCCESS] Disease scan '${scanId}' inserted into disease_scans table.`);
        }
      } catch (e: any) {
        console.error('[SUPABASE EXCEPTION] saveDiagnosis:', e?.message || e);
      }
    }
    return diagnosis;
  }


  // ============================================================================
  // 5. MARKETPLACE PRODUCTS & CATEGORIES
  // ============================================================================

  public static async getProducts(category?: string): Promise<Product[]> {
    const client = getSupabase();
    if (client) {
      try {
        let q = client.from('marketplace_products').select('*');
        if (category && category !== 'ALL') q = q.eq('category', category);
        let { data, error } = await q;

        if (error) {
          console.error('[SUPABASE ERROR] getProducts from marketplace_products failed:', error.message);
          // Fallback query to products table
          const prodQ = client.from('products').select('*');
          if (category && category !== 'ALL') prodQ.eq('category', category);
          const pRes = await prodQ;
          if (!pRes.error && pRes.data && pRes.data.length > 0) {
            data = pRes.data;
            error = null;
          }
        }

        // Auto-seed default certified Indian fertilizers, bio-pesticides, and seeds if marketplace_products is empty
        if (!error && (!data || data.length === 0)) {
          const defaultProducts = db.getTable('products');
          if (defaultProducts.length > 0) {
            console.log('🌱 [SUPABASE] marketplace_products is empty. Auto-seeding default certified inputs...');
            const seedRows = defaultProducts.map(p => ({
              id: p.id,
              vendor_id: p.vendorId || 'usr-vendor-1',
              category_id: p.categoryId || 'cat-fertilizers',
              name: p.name,
              brand: p.brand,
              category: p.category,
              price: p.price,
              original_price: p.mrp || p.price,
              pack_size: p.packSize,
              in_stock: p.stockQuantity > 0,
              stock_quantity: p.stockQuantity || 50,
              images: p.images || [],
              description: p.description,
              agricultural_use: p.agriculturalUse,
              dosage_guidance: p.dosageGuidance || '',
              label_instructions: p.labelInstructions || '',
              safety_warnings: p.safetyPrecautions || [],
              created_at: p.createdAt || new Date().toISOString()
            }));
            const { error: seedErr } = await client.from('marketplace_products').upsert(seedRows, { onConflict: 'id' });
            if (seedErr) {
              console.error('[SUPABASE ERROR] Auto-seeding marketplace_products failed:', seedErr.message);
            } else {
              console.log(`✅ [SUPABASE SUCCESS] Auto-seeded ${seedRows.length} certified products into marketplace_products.`);
              let reQ = client.from('marketplace_products').select('*');
              if (category && category !== 'ALL') reQ = reQ.eq('category', category);
              const reRes = await reQ;
              if (reRes.data && reRes.data.length > 0) data = reRes.data;
            }
          }
        }

        if (data && data.length > 0) {
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
      } catch (e: any) {
        console.error('[SUPABASE EXCEPTION] getProducts:', e?.message || e);
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
        let { data, error } = await client.from('marketplace_products').select('*').eq('id', id).single();
        if (error || !data) {
          const mp = await client.from('products').select('*').eq('id', id).single();
          if (!mp.error && mp.data) data = mp.data;
        }
        if (data) {
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
      } catch (e: any) {
        console.error('[SUPABASE EXCEPTION] getProductById:', e?.message || e);
      }
    }
    return db.findById('products', id);
  }

  public static async createProduct(product: Product): Promise<Product> {
    db.insert('products', product);
    const client = getSupabase();
    if (client) {
      const prodPayload = {
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
      };
      try {
        console.log(`[SUPABASE] Inserting product '${product.name}' into 'marketplace_products'...`);
        const { error } = await client.from('marketplace_products').upsert(prodPayload, { onConflict: 'id' });
        if (error) {
          console.error('[SUPABASE ERROR] createProduct failed:', error.message);
          await client.from('products').upsert(prodPayload, { onConflict: 'id' });
        } else {
          console.log(`✅ [SUPABASE SUCCESS] Product '${product.name}' saved to marketplace_products table.`);
        }
      } catch (e: any) {
        console.error('[SUPABASE EXCEPTION] createProduct:', e?.message || e);
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
        if (error) {
          console.error('[SUPABASE ERROR] getOrders failed:', error.message);
        } else if (data && data.length > 0) {
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
              village: d.delivery_address || 'Kadiri',
              district: 'Sri Sathya Sai',
              state: 'AP',
              pincode: '515591'
            },
            paymentMethod: d.payment_mode || 'COD',
            paymentStatus: d.payment_status || 'PENDING',
            status: d.delivery_status || 'CONFIRMED',
            estimatedDeliveryDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
            trackingUpdates: d.tracking_timeline || [],
            createdAt: d.created_at,
            updatedAt: d.created_at
          }));
        }
      } catch (e: any) {
        console.error('[SUPABASE EXCEPTION] getOrders:', e?.message || e);
      }
    }
    if (userId && role === 'FARMER') return db.find('orders', o => o.farmerId === userId);
    if (userId && role === 'VENDOR') return db.find('orders', o => o.vendorId === userId);
    return db.getTable('orders');
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
  // 12. ORDERS & AGRI STORE BOOKINGS
  // ============================================================================

  public static async createOrder(order: Order): Promise<Order> {
    db.insert('orders', order);
    const client = getSupabase();
    if (client) {
      try {
        const orderUuid = this.toUuid(order.id);
        const buyerUuid = this.toUuid(order.farmerId || 'usr-farmer-1');

        const orderPayload = {
          id: orderUuid,
          buyer_id: buyerUuid,
          total_amount: order.totalAmount || 0,
          payment_status: (order.paymentStatus || 'pending').toLowerCase(),
          delivery_status: (order.status || 'placed').toLowerCase(),
          items: order.items || [],
          created_at: order.createdAt || new Date().toISOString()
        };

        const { data, error } = await client.from('orders').insert(orderPayload).select();
        if (error) {
          console.warn('[SUPABASE] createOrder insert error:', error.message);
        } else {
          console.log(`✅ [SUPABASE SUCCESS] Order '${order.id}' persisted to Supabase orders table (UUID: ${orderUuid}).`);
        }
      } catch (err: any) {
        console.warn('[SUPABASE EXCEPTION] createOrder:', err?.message || err);
      }
    }
    return order;
  }

  public static async updateOrderStatus(orderId: string, status: string, paymentStatusOrExtra?: any): Promise<Order | undefined> {
    const existing = db.findById('orders', orderId);
    let local: Order | undefined;
    if (existing) {
      existing.status = status as any;
      if (typeof paymentStatusOrExtra === 'string') {
        existing.paymentStatus = paymentStatusOrExtra as any;
      } else if (Array.isArray(paymentStatusOrExtra)) {
        existing.trackingUpdates = paymentStatusOrExtra;
      }
      existing.updatedAt = new Date().toISOString();
      local = db.update('orders', orderId, existing);
    }

    const client = getSupabase();
    if (client) {
      try {
        const orderUuid = this.toUuid(orderId);
        const updatePayload: any = {
          delivery_status: status.toLowerCase()
        };
        if (typeof paymentStatusOrExtra === 'string') {
          updatePayload.payment_status = paymentStatusOrExtra.toLowerCase();
        }

        const { error } = await client.from('orders').update(updatePayload).eq('id', orderUuid);
        if (error) {
          console.warn('[SUPABASE] updateOrderStatus error:', error.message);
        } else {
          console.log(`✅ [SUPABASE SUCCESS] Order '${orderId}' status updated in Supabase to '${status}'.`);
        }
      } catch (err: any) {
        console.warn('[SUPABASE EXCEPTION] updateOrderStatus:', err?.message || err);
      }
    }
    return local;
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private static mapUserFromSupabase(d: any): User {
    const local = db.findOne('users', u => u.id === d.id || (d.phone && u.phone === d.phone));
    return {
      id: d.id,
      name: d.name || local?.name || 'Farmer',
      phone: d.phone || local?.phone || '+91 99515 18699',
      email: d.email || local?.email,
      passwordHash: d.password_hash || d.passwordHash || local?.passwordHash || '',
      role: (d.role ? String(d.role).toUpperCase() : local?.role || 'FARMER') as UserRole,
      language: d.language || local?.language || 'en',
      village: d.village || local?.village || 'Kadiri Rural',
      district: d.district || local?.district || 'Sri Sathya Sai',
      state: d.state || local?.state || 'Andhra Pradesh',
      pincode: d.pincode || local?.pincode || '515591',
      latitude: d.latitude || local?.latitude || 14.1165,
      longitude: d.longitude || local?.longitude || 78.1634,
      avatarUrl: d.avatar_url || local?.avatarUrl,
      createdAt: d.created_at || local?.createdAt || new Date().toISOString(),
      updatedAt: d.updated_at || local?.updatedAt || new Date().toISOString()
    };
  }
}
