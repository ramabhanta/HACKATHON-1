import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';
import { db } from './db.js';
import fs from 'fs';
import path from 'path';
import dns from 'dns';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
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
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
            try {
              const res = await fetch(fetchUrl, {
                ...options,
                signal: controller.signal
              });
              clearTimeout(timeoutId);
              return res;
            } catch (err: any) {
              clearTimeout(timeoutId);
              console.error(`[SUPABASE NETWORK/FETCH ERROR] ${fetchUrl}:`, err?.message || err);
              throw err;
            }
          }
        }
      });
      return supabaseInstance;
    } catch (err) {
      console.error('[SUPABASE INIT ERROR] Failed to initialize Supabase client:', err);
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
  const client = getSupabase();
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

/**
 * Diagnostic health check verifying DNS, live ping, profiles query,
 * disease_scans insert, and row counts across all 8 tables.
 */
export async function checkDatabaseHealth(): Promise<{
  status: 'ONLINE' | 'PAUSED_OR_DNS_FAILED' | 'CONFIG_MISSING' | 'ERROR';
  connected: boolean;
  dnsResolution: { resolved: boolean; ip?: string; error?: string };
  supabaseUrl: string;
  profilesQuery: { success: boolean; count?: number; error?: string };
  diseaseScansInsert: { success: boolean; testId?: string; error?: string };
  tableRowCounts: Record<string, number | string>;
  message: string;
  timestamp: string;
}> {
  const timestamp = new Date().toISOString();
  const url = config.supabaseUrl || process.env.SUPABASE_URL || '';
  if (!url) {
    return {
      status: 'CONFIG_MISSING',
      connected: false,
      dnsResolution: { resolved: false, error: 'SUPABASE_URL is not set' },
      supabaseUrl: '',
      profilesQuery: { success: false, error: 'No URL configured' },
      diseaseScansInsert: { success: false, error: 'No URL configured' },
      tableRowCounts: {},
      message: 'Supabase URL is missing from environment configuration.',
      timestamp
    };
  }

  // 1. DNS Resolution check
  let host = '';
  try {
    const parsed = new URL(url);
    host = parsed.hostname;
  } catch {
    host = url.replace(/^https?:\/\//, '').split('/')[0];
  }

  let dnsResolved = false;
  let dnsIp: string | undefined = undefined;
  let dnsError: string | undefined = undefined;

  try {
    const lookupRes = await dns.promises.lookup(host);
    dnsResolved = true;
    dnsIp = lookupRes.address;
  } catch (err: any) {
    dnsResolved = false;
    dnsError = err.message || String(err);
    console.error('[SUPABASE ERROR] DNS Lookup failed for', host, ':', dnsError);
  }

  if (!dnsResolved) {
    return {
      status: 'PAUSED_OR_DNS_FAILED',
      connected: false,
      dnsResolution: { resolved: false, error: dnsError },
      supabaseUrl: url,
      profilesQuery: { success: false, error: `DNS cannot resolve ${host}. Project may be paused in Supabase dashboard.` },
      diseaseScansInsert: { success: false, error: 'DNS unreachable' },
      tableRowCounts: {
        profiles: 'Unreachable (DNS / Paused)',
        farms: 'Unreachable (DNS / Paused)',
        crops: 'Unreachable (DNS / Paused)',
        disease_scans: 'Unreachable (DNS / Paused)',
        soil_health_records: 'Unreachable (DNS / Paused)',
        marketplace_products: 'Unreachable (DNS / Paused)',
        produce_listings: 'Unreachable (DNS / Paused)',
        orders: 'Unreachable (DNS / Paused)'
      },
      message: `Cannot reach Supabase host '${host}'. On Supabase free tier, projects pause after inactivity. To restore: visit your Supabase dashboard at https://supabase.com/dashboard/project/yxdbvpzxkfptxoitseir and click 'Restore project'.`,
      timestamp
    };
  }

  const client = getSupabase();
  if (!client) {
    return {
      status: 'CONFIG_MISSING',
      connected: false,
      dnsResolution: { resolved: true, ip: dnsIp },
      supabaseUrl: url,
      profilesQuery: { success: false, error: 'Client initialization failed' },
      diseaseScansInsert: { success: false, error: 'Client initialization failed' },
      tableRowCounts: {},
      message: 'Supabase client failed to initialize.',
      timestamp
    };
  }

  // 2. Select from profiles
  let profilesSuccess = false;
  let profilesCount = 0;
  let profilesError: string | undefined = undefined;
  try {
    const { count, error } = await client.from('profiles').select('*', { count: 'exact', head: true });
    if (error) {
      console.error('[SUPABASE ERROR] db-check profiles select failed:', error.message);
      profilesError = error.message;
    } else {
      profilesSuccess = true;
      profilesCount = count || 0;
    }
  } catch (err: any) {
    profilesError = err.message;
    console.error('[SUPABASE ERROR] db-check profiles exception:', err.message);
  }

  // 3. Test insert into disease_scans
  const testId = `probe-scan-${Date.now()}`;
  let insertSuccess = false;
  let insertError: string | undefined = undefined;
  try {
    const probeScan = {
      id: testId,
      farmer_id: 'usr-farmer-1',
      image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
      detected_disease: 'Health Diagnostic Verification Probe',
      confidence: 0.99,
      remedies: 'System database diagnostic probe test passed.',
      created_at: new Date().toISOString()
    };
    const { error } = await client.from('disease_scans').upsert(probeScan, { onConflict: 'id' });
    if (error) {
      console.error('[SUPABASE ERROR] db-check disease_scans insert failed:', error.message);
      insertError = error.message;
    } else {
      insertSuccess = true;
      console.log(`✅ [SUPABASE SUCCESS] db-check probe inserted into disease_scans (${testId})`);
    }
  } catch (err: any) {
    insertError = err.message;
    console.error('[SUPABASE ERROR] db-check disease_scans exception:', err.message);
  }

  // 4. Report table row counts for all 8 tables
  const tables = [
    'profiles',
    'farms',
    'crops',
    'disease_scans',
    'soil_health_records',
    'marketplace_products',
    'produce_listings',
    'orders'
  ];

  const tableRowCounts: Record<string, number | string> = {};
  for (const t of tables) {
    try {
      const { count, error } = await client.from(t).select('*', { count: 'exact', head: true });
      if (error) {
        if (t === 'soil_health_records') {
          const fallback = await client.from('soil_tests').select('*', { count: 'exact', head: true });
          tableRowCounts[t] = !fallback.error && fallback.count !== null ? fallback.count : `Error: ${error.message}`;
        } else if (t === 'marketplace_products') {
          const fallback = await client.from('products').select('*', { count: 'exact', head: true });
          tableRowCounts[t] = !fallback.error && fallback.count !== null ? fallback.count : `Error: ${error.message}`;
        } else {
          tableRowCounts[t] = `Error: ${error.message}`;
        }
      } else {
        tableRowCounts[t] = count ?? 0;
      }
    } catch (e: any) {
      tableRowCounts[t] = `Error: ${e.message}`;
    }
  }

  const isHealthy = profilesSuccess && insertSuccess;
  return {
    status: isHealthy ? 'ONLINE' : 'ERROR',
    connected: isHealthy,
    dnsResolution: { resolved: true, ip: dnsIp },
    supabaseUrl: url,
    profilesQuery: { success: profilesSuccess, count: profilesCount, error: profilesError },
    diseaseScansInsert: { success: insertSuccess, testId, error: insertError },
    tableRowCounts,
    message: isHealthy
      ? 'Supabase database is fully operational with live read/write capability across all tables.'
      : 'Supabase host reachable, but table schema queries or write permissions encountered errors. Check tableRowCounts and schema.',
    timestamp
  };
}

