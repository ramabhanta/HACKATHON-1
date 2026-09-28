import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';
import { db } from './db.js';
import fs from 'fs';
import path from 'path';

let supabaseInstance: SupabaseClient | null = null;
let lastUnreachableAt = 0;
const RETRY_COOLDOWN_MS = 25000; // 25s cooldown before probing again if unreachable

export function markSupabaseUnreachable(): void {
  lastUnreachableAt = Date.now();
}

export function markSupabaseReachable(): void {
  lastUnreachableAt = 0;
}

export function isSupabaseHealthy(): boolean {
  if (lastUnreachableAt > 0 && Date.now() - lastUnreachableAt < RETRY_COOLDOWN_MS) {
    return false;
  }
  return true;
}

export function getSupabase(force = false): SupabaseClient | null {
  if (!force && !isSupabaseHealthy()) {
    return null;
  }

  if (supabaseInstance) return supabaseInstance;

  const url = config.supabaseUrl || process.env.SUPABASE_URL;
  const key = config.supabaseServiceKey || config.supabaseAnonKey || process.env.SUPABASE_ANON_KEY;

  if (url && key && url.startsWith('http')) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: { persistSession: false },
        global: {
          fetch: async (fetchUrl, options) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s fast abort
            try {
              const res = await fetch(fetchUrl, {
                ...options,
                signal: controller.signal
              });
              clearTimeout(timeoutId);
              markSupabaseReachable();
              return res;
            } catch (err: any) {
              clearTimeout(timeoutId);
              markSupabaseUnreachable();
              throw err;
            }
          }
        }
      });
      return supabaseInstance;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return null;
}

export function isSupabaseConfigured(): boolean {
  const url = config.supabaseUrl || process.env.SUPABASE_URL;
  const key = config.supabaseAnonKey || config.supabaseServiceKey || process.env.SUPABASE_ANON_KEY;
  return Boolean(url && key && url.startsWith('http') && !url.includes('your-project-id'));
}

export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  url?: string;
  tableCounts?: Record<string, number>;
  error?: string;
}> {
  const client = getSupabase(true);
  if (!client) {
    return {
      connected: false,
      message: 'Supabase credentials not configured or incomplete. Please set SUPABASE_URL and SUPABASE_ANON_KEY.',
      url: config.supabaseUrl || ''
    };
  }

  try {
    // Attempt reading from market_prices or users table
    const { data, error, count } = await client
      .from('market_prices')
      .select('*', { count: 'exact', head: true });

    if (error) {
      // Table might not exist yet if schema was not run
      if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return {
          connected: true,
          message: 'Connected to Supabase project, but tables are not created yet! Please run supabase_schema.sql in your Supabase SQL Editor.',
          url: config.supabaseUrl,
          error: error.message
        };
      }
      return {
        connected: false,
        message: `Supabase connection error: ${error.message}`,
        url: config.supabaseUrl,
        error: error.message
      };
    }

    return {
      connected: true,
      message: 'Successfully connected to live Supabase PostgreSQL database!',
      url: config.supabaseUrl,
      tableCounts: {
        market_prices: count || 0
      }
    };
  } catch (err: any) {
    const isDnsOrNetwork = err?.message?.includes('fetch failed') || err?.message?.includes('ENOTFOUND');
    return {
      connected: false,
      message: isDnsOrNetwork
        ? 'Supabase cloud database credentials are saved. Waiting for project to wake up/unpause; local high-performance database is active.'
        : `Supabase status: ${err.message}`,
      url: config.supabaseUrl,
      error: err.message
    };
  }
}

/**
 * Push all current local data (users, farms, crops, products, listings, prices) into Supabase
 */
export async function syncLocalDataToSupabase(): Promise<{
  success: boolean;
  syncedCounts: Record<string, number>;
  errors: string[];
}> {
  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      syncedCounts: {},
      errors: ['Supabase client not initialized. Check your credentials.']
    };
  }

  const errors: string[] = [];
  const syncedCounts: Record<string, number> = {};

  try {
    // 1. Sync users & profiles (Default farmer Ramesh Patel etc.)
    const users = db.getTable('users');
    if (users.length > 0) {
      const userRows = users.map(u => ({
        id: u.id,
        name: u.name,
        phone: u.phone,
        email: u.email || `${u.id}@agriconnect.com`,
        password_hash: u.passwordHash,
        role: u.role,
        language: u.language || 'en',
        village: u.village || '',
        district: u.district || '',
        state: u.state || '',
        pincode: u.pincode || '515591',
        latitude: u.latitude,
        longitude: u.longitude,
        avatar_url: u.avatarUrl,
        created_at: u.createdAt
      }));
      try {
        const { error } = await client.from('users').upsert(userRows, { onConflict: 'id' });
        if (error) errors.push(`users sync error: ${error.message}`);
        else syncedCounts.users = userRows.length;
      } catch (e: any) {
        errors.push(`users: ${e.message}`);
      }
      try {
        await client.from('profiles').upsert(userRows, { onConflict: 'id' });
        syncedCounts.profiles = userRows.length;
      } catch {}
    }

    // 2. Sync farms (Sri Venkateswara Farm)
    const farms = db.getTable('farms');
    if (farms.length > 0) {
      const farmRows = farms.map(f => ({
        id: f.id,
        user_id: f.userId,
        name: f.name,
        total_acres: f.totalArea || 6.5,
        soil_type: f.soilType || 'RED_LOAM',
        irrigation_type: f.irrigationSource || 'BOREWELL',
        village: f.location || 'Kadiri Rural',
        district: f.district || 'Sri Sathya Sai',
        state: f.state || 'Andhra Pradesh',
        created_at: f.createdAt || new Date().toISOString()
      }));
      try {
        const { error } = await client.from('farms').upsert(farmRows, { onConflict: 'id' });
        if (error) errors.push(`farms sync error: ${error.message}`);
        else syncedCounts.farms = farmRows.length;
      } catch (e: any) {
        errors.push(`farms: ${e.message}`);
      }
    }

    // 3. Sync crops (Groundnut, Tomato, Chilli)
    const crops = db.getTable('crops');
    if (crops.length > 0) {
      const cropRows = crops.map(c => ({
        id: c.id,
        farm_id: c.farmId,
        crop_name: c.cropName,
        variety: c.variety,
        season: 'Kharif',
        sowing_date: c.sowingDate ? c.sowingDate.split('T')[0] : '2026-07-10',
        expected_harvest_date: c.expectedHarvestDate ? c.expectedHarvestDate.split('T')[0] : '2026-10-25',
        acreage: c.areaPlanted || 2.0,
        status: 'GROWING',
        health_status: c.healthStatus || 'HEALTHY',
        created_at: c.createdAt || new Date().toISOString()
      }));
      try {
        const { error } = await client.from('crops').upsert(cropRows, { onConflict: 'id' });
        if (error) errors.push(`crops sync error: ${error.message}`);
        else syncedCounts.crops = cropRows.length;
      } catch (e: any) {
        errors.push(`crops: ${e.message}`);
      }
    }

    // 4. Sync soil tests / soil_health_records
    const soilTests = db.getTable('soil_tests');
    if (soilTests.length > 0) {
      const soilRows = soilTests.map(s => ({
        id: s.id,
        farm_id: s.farmId,
        user_id: s.userId,
        test_date: s.testDate || '2026-06-20',
        is_lab_certified: s.isLabCertified ?? true,
        source_type: s.sourceType || 'LAB_REPORT',
        ph: s.ph,
        nitrogen_kg_per_ha: s.nitrogenKgPerHa,
        phosphorus_kg_per_ha: s.phosphorusKgPerHa,
        potassium_kg_per_ha: s.potassiumKgPerHa,
        organic_carbon_pct: s.organicCarbonPct,
        electrical_conductivity: s.electricalConductivity,
        soil_moisture_pct: s.soilMoisturePct,
        summary: s.summary,
        recommendations: s.recommendations,
        created_at: s.createdAt || new Date().toISOString()
      }));
      try {
        await client.from('soil_tests').upsert(soilRows, { onConflict: 'id' });
        syncedCounts.soil_tests = soilRows.length;
      } catch {}
      try {
        await client.from('soil_health_records').upsert(soilRows, { onConflict: 'id' });
        syncedCounts.soil_health_records = soilRows.length;
      } catch {}
    }

    // 5. Sync product categories
    const categories = db.getTable('product_categories');
    if (categories.length > 0) {
      const catRows = categories.map(c => ({
        id: c.id,
        slug: c.slug,
        name_en: c.nameEn,
        name_hi: c.nameHi || c.nameEn,
        name_te: c.nameTe || c.nameEn,
        icon: c.icon
      }));
      try {
        await client.from('product_categories').upsert(catRows, { onConflict: 'id' });
        syncedCounts.product_categories = catRows.length;
      } catch {}
    }

    // 6. Sync products & marketplace_products
    const products = db.getTable('products');
    if (products.length > 0) {
      const prodRows = products.map(p => ({
        id: p.id,
        vendor_id: p.vendorId,
        category_id: p.categoryId,
        name: p.name,
        brand: p.brand,
        category: p.category,
        price: p.price,
        original_price: p.mrp || p.price,
        pack_size: p.packSize,
        in_stock: p.stockQuantity > 0,
        stock_quantity: p.stockQuantity,
        images: p.images || [],
        description: p.description,
        agricultural_use: p.agriculturalUse,
        dosage_guidance: p.dosageGuidance,
        label_instructions: p.labelInstructions,
        safety_warnings: p.safetyPrecautions || []
      }));
      try {
        const { error } = await client.from('products').upsert(prodRows, { onConflict: 'id' });
        if (error) errors.push(`products sync error: ${error.message}`);
        else syncedCounts.products = prodRows.length;
      } catch (e: any) {
        errors.push(`products: ${e.message}`);
      }
      try {
        await client.from('marketplace_products').upsert(prodRows, { onConflict: 'id' });
        syncedCounts.marketplace_products = prodRows.length;
      } catch {}
    }

    // 7. Sync disease_scans & ai_diagnoses
    const diagnoses = db.getTable('ai_diagnoses');
    if (diagnoses.length > 0) {
      const diagRows = diagnoses.map(d => ({
        id: d.id,
        user_id: d.userId,
        farm_id: d.farmId,
        crop_name: d.cropName,
        image_url: d.imageUrl,
        photo_metadata: d.photoMetadata || {},
        suspected_issue: d.suspectedIssue,
        confidence_score: d.confidenceScore,
        severity: d.severity,
        symptoms_evidence: d.symptomsEvidence || [],
        cultural_control: d.culturalControl || [],
        biological_control: d.biologicalControl || [],
        chemical_control_safe: d.chemicalControlSafe || [],
        safety_warnings: d.safetyWarnings || [],
        recommended_product_ids: d.recommendedProductIds || [],
        follow_up_questions: d.followUpQuestions || [],
        is_expert_reviewed: d.isExpertReviewed ?? false,
        created_at: d.createdAt || new Date().toISOString()
      }));
      try {
        await client.from('disease_scans').upsert(diagRows, { onConflict: 'id' });
        syncedCounts.disease_scans = diagRows.length;
      } catch {}
      try {
        await client.from('ai_diagnoses').upsert(diagRows, { onConflict: 'id' });
        syncedCounts.ai_diagnoses = diagRows.length;
      } catch {}
    }

    // 8. Sync market prices
    const prices = db.getTable('market_prices');
    if (prices.length > 0) {
      const priceRows = prices.map(p => ({
        id: p.id,
        state: p.state,
        district: p.district,
        market: p.market,
        commodity: p.commodity,
        commodity_type: p.commodityType || 'CROP',
        variety: p.variety,
        unit: p.unit || 'QUINTAL',
        min_price: p.minPrice,
        max_price: p.maxPrice,
        modal_price: p.modalPrice,
        price_date: p.priceDate,
        trend: p.trend,
        change_amount: p.changeAmount || 0,
        reported_by: p.reportedBy,
        reported_by_name: p.reportedByName
      }));
      try {
        const { error } = await client.from('market_prices').upsert(priceRows, { onConflict: 'id' });
        if (error) errors.push(`Prices sync error: ${error.message}`);
        else syncedCounts.market_prices = priceRows.length;
      } catch (e: any) {
        errors.push(`prices: ${e.message}`);
      }
    }

    // 9. Sync produce listings
    const listings = db.getTable('produce_listings');
    if (listings.length > 0) {
      const listRows = listings.map(l => ({
        id: l.id,
        farmer_id: l.farmerId,
        farmer_name: l.farmerName,
        farmer_phone: l.farmerPhone,
        crop_name: l.cropName,
        variety: l.variety,
        quantity_quintals: l.quantity,
        available_quantity_quintals: l.quantity,
        expected_price_per_quintal: l.expectedPricePerUnit,
        harvest_date: l.harvestDate,
        description: l.description,
        photos: l.images || [],
        location: `${l.village}, ${l.district}`,
        district: l.district,
        state: l.state,
        pincode: '515591',
        status: l.status,
        verified_sample: true
      }));
      try {
        const { error } = await client.from('produce_listings').upsert(listRows, { onConflict: 'id' });
        if (error) errors.push(`Listings sync error: ${error.message}`);
        else syncedCounts.produce_listings = listRows.length;
      } catch (e: any) {
        errors.push(`listings: ${e.message}`);
      }
    }

    return {
      success: errors.length === 0,
      syncedCounts,
      errors
    };
  } catch (err: any) {
    errors.push(`Sync failed with exception: ${err.message}`);
    return {
      success: false,
      syncedCounts,
      errors
    };
  }
}

/**
 * Dynamically save Supabase credentials and re-initialize
 */
export function saveSupabaseConfig(url: string, anonKey: string, serviceKey?: string) {
  config.supabaseUrl = url;
  config.supabaseAnonKey = anonKey;
  if (serviceKey) config.supabaseServiceKey = serviceKey;

  process.env.SUPABASE_URL = url;
  process.env.SUPABASE_ANON_KEY = anonKey;
  if (serviceKey) process.env.SUPABASE_SERVICE_ROLE_KEY = serviceKey;

  supabaseInstance = null; // reset client so next call recreates it

  // Update .env file on disk
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    
    // Update or append SUPABASE_URL
    if (envContent.includes('SUPABASE_URL=')) {
      envContent = envContent.replace(/SUPABASE_URL=.*/g, `SUPABASE_URL=${url}`);
    } else {
      envContent += `\nSUPABASE_URL=${url}`;
    }

    // Update or append SUPABASE_ANON_KEY
    if (envContent.includes('SUPABASE_ANON_KEY=')) {
      envContent = envContent.replace(/SUPABASE_ANON_KEY=.*/g, `SUPABASE_ANON_KEY=${anonKey}`);
    } else {
      envContent += `\nSUPABASE_ANON_KEY=${anonKey}`;
    }

    if (serviceKey) {
      if (envContent.includes('SUPABASE_SERVICE_ROLE_KEY=')) {
        envContent = envContent.replace(/SUPABASE_SERVICE_ROLE_KEY=.*/g, `SUPABASE_SERVICE_ROLE_KEY=${serviceKey}`);
      } else {
        envContent += `\nSUPABASE_SERVICE_ROLE_KEY=${serviceKey}`;
      }
    }

    fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');
  } catch (e) {
    console.error('Failed to write .env file:', e);
  }
}

/**
 * Uploads a disease scan leaf photo directly to Supabase Storage bucket 'scan-images'
 * and returns the public CDN URL.
 */
export async function uploadScanImageToStorage(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  const client = getSupabase();
  if (!client) {
    return `/uploads/${fileName}`;
  }

  try {
    const bucketName = 'scan-images';
    // Ensure bucket exists or create it
    try {
      const { data: buckets } = await client.storage.listBuckets();
      const bucketExists = buckets?.some(b => b.name === bucketName);
      if (!bucketExists) {
        await client.storage.createBucket(bucketName, { public: true });
      }
    } catch {
      // ignore check error
    }

    const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${Date.now()}_${cleanName}`;

    const { error: uploadError } = await client.storage
      .from(bucketName)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true
      });

    if (uploadError) {
      console.warn('Supabase storage upload error, using local fallback:', uploadError.message);
      return `/uploads/${fileName}`;
    }

    const { data: urlData } = client.storage
      .from(bucketName)
      .getPublicUrl(storagePath);

    return urlData?.publicUrl || `/uploads/${fileName}`;
  } catch (err: any) {
    console.warn('Supabase storage exception, using local fallback:', err?.message || err);
    return `/uploads/${fileName}`;
  }
}

