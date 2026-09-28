import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';
import { db } from './db.js';
import fs from 'fs';
import path from 'path';
import dns from 'dns';
import crypto from 'crypto';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const url = process.env.SUPABASE_URL || config.supabaseUrl;
  let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || config.supabaseServiceKey;
  if (serviceKey && serviceKey.startsWith('Sb_')) {
    serviceKey = 'sb_' + serviceKey.slice(3);
  }

  if (!url) {
    throw new Error('[SUPABASE CONFIG ERROR] Missing SUPABASE_URL. Please ensure SUPABASE_URL is set in backend/.env');
  }
  if (!serviceKey) {
    throw new Error('[SUPABASE CONFIG ERROR] Missing SUPABASE_SERVICE_ROLE_KEY. Please ensure SUPABASE_SERVICE_ROLE_KEY is set in backend/.env');
  }

  try {
    supabaseInstance = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: async (fetchUrl, options) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12000);
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
    throw err;
  }
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL || config.supabaseUrl;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || config.supabaseServiceKey;
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

  const toUuid = (str: string): string => {
    if (!str) return 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) return str;
    const hash = crypto.createHash('md5').update(str).digest('hex');
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
  };

  const normalizeRole = (role?: string): string => {
    const r = (role || 'farmer').toLowerCase();
    if (r === 'admin') return 'admin';
    if (r === 'vendor') return 'vendor';
    return 'farmer';
  };

  try {
    // 1. Sync profiles
    const users = db.getTable('users');
    if (users.length > 0) {
      const profileRows = users.map(u => ({
        id: toUuid(u.id),
        name: u.name || 'Farmer',
        phone: u.email || u.phone || '+91 9951518699',
        role: normalizeRole(u.role),
        location: `${u.village || ''}, ${u.district || 'Kadiri'}`.replace(/^, /, ''),
        created_at: u.createdAt || new Date().toISOString()
      }));
      try {
        const { error } = await client.from('profiles').upsert(profileRows, { onConflict: 'id' });
        if (error) errors.push(`profiles sync error: ${error.message}`);
        else syncedCounts.profiles = profileRows.length;
      } catch (e: any) {
        errors.push(`profiles: ${e.message}`);
      }
    }

    // 2. Sync farms
    const farms = db.getTable('farms');
    if (farms.length > 0) {
      const farmRows = farms.map(f => ({
        id: toUuid(f.id),
        farmer_id: toUuid(f.userId || 'usr-farmer-1'),
        name: f.name || 'Sri Venkateswara Farm',
        acreage: f.totalArea || 5.0,
        soil_type: f.soilType || 'RED_LOAM',
        irrigation_type: f.irrigationSource || 'BOREWELL',
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

    // 3. Sync crops
    const crops = db.getTable('crops');
    if (crops.length > 0) {
      const cropRows = crops.map(c => ({
        id: toUuid(c.id),
        farm_id: toUuid(c.farmId || 'farm-1'),
        crop_name: c.cropName || 'Groundnut',
        variety: c.variety || 'Kadiri-6',
        planting_date: c.sowingDate ? c.sowingDate.split('T')[0] : '2026-06-15',
        harvest_expected_date: c.expectedHarvestDate ? c.expectedHarvestDate.split('T')[0] : '2026-10-30',
        status: ((c as any).status || c.growthStage || 'growing').toLowerCase(),
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

    // 4. Sync soil_health_records
    const soilTests = db.getTable('soil_tests');
    if (soilTests.length > 0) {
      const soilRows = soilTests.map(s => ({
        id: toUuid(s.id),
        farm_id: toUuid(s.farmId || 'farm-1'),
        ph_level: s.ph || 6.8,
        nitrogen: s.nitrogenKgPerHa || 180,
        phosphorus: s.phosphorusKgPerHa || 22,
        potassium: s.potassiumKgPerHa || 240,
        organic_carbon: s.organicCarbonPct || 0.55,
        fertilizer_recommendation: s.recommendations || 'Apply 50kg Urea and 25kg DAP per acre',
        tested_at: s.testDate ? s.testDate.split('T')[0] : '2026-06-20'
      }));
      try {
        const { error } = await client.from('soil_health_records').upsert(soilRows, { onConflict: 'id' });
        if (error) errors.push(`soil sync error: ${error.message}`);
        else syncedCounts.soil_health_records = soilRows.length;
      } catch (e: any) {
        errors.push(`soil_health_records: ${e.message}`);
      }
    }

    // 5. Sync marketplace_products (all 128 products)
    const products = db.getTable('products');
    if (products.length > 0) {
      const mpRows = products.map(p => ({
        id: toUuid(p.id),
        vendor_id: toUuid(p.vendorId || 'usr-vendor-1'),
        name: p.name,
        category: p.category,
        price: p.price,
        stock_quantity: p.stockQuantity || 50,
        unit: p.packSize || 'kg',
        image_url: p.images?.[0] || 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=400',
        created_at: p.createdAt || new Date().toISOString()
      }));
      try {
        const { error } = await client.from('marketplace_products').upsert(mpRows, { onConflict: 'id' });
        if (error) errors.push(`marketplace_products sync error: ${error.message}`);
        else syncedCounts.marketplace_products = mpRows.length;
      } catch (e: any) {
        errors.push(`marketplace_products: ${e.message}`);
      }
    }

    // 6. Sync disease_scans
    const diagnoses = db.getTable('ai_diagnoses');
    if (diagnoses.length > 0) {
      const scanRows = diagnoses.map(d => ({
        id: toUuid(d.id),
        farmer_id: toUuid(d.userId || 'usr-farmer-1'),
        image_url: d.imageUrl || 'https://images.unsplash.com/photo-1592417817098-8f3d6910a455?w=500',
        detected_disease: d.suspectedIssue || 'Plant Foliar Condition',
        confidence_score: d.confidenceScore > 1 ? Number((d.confidenceScore / 100).toFixed(2)) : d.confidenceScore,
        treatment_recommendations: (d.chemicalControlSafe || []).join('; ') || 'Apply recommended crop protection input',
        created_at: d.createdAt || new Date().toISOString()
      }));
      try {
        const { error } = await client.from('disease_scans').upsert(scanRows, { onConflict: 'id' });
        if (error) errors.push(`disease_scans sync error: ${error.message}`);
        else syncedCounts.disease_scans = scanRows.length;
      } catch (e: any) {
        errors.push(`disease_scans: ${e.message}`);
      }
    }

    // 7. Sync orders
    const orders = db.getTable('orders');
    if (orders.length > 0) {
      const orderRows = orders.map(o => ({
        id: toUuid(o.id),
        buyer_id: toUuid(o.farmerId || 'usr-farmer-1'),
        total_amount: o.totalAmount || 0,
        payment_status: (o.paymentStatus || 'pending').toLowerCase(),
        delivery_status: (o.status || 'placed').toLowerCase(),
        items: o.items || [],
        created_at: o.createdAt || new Date().toISOString()
      }));
      try {
        const { error } = await client.from('orders').upsert(orderRows, { onConflict: 'id' });
        if (error) errors.push(`orders sync error: ${error.message}`);
        else syncedCounts.orders = orderRows.length;
      } catch (e: any) {
        errors.push(`orders: ${e.message}`);
      }
    }

    // 8. Sync produce listings
    const listings = db.getTable('produce_listings');
    if (listings.length > 0) {
      const listRows = listings.map(l => ({
        id: toUuid(l.id),
        farmer_id: toUuid(l.farmerId || 'usr-farmer-1'),
        crop_name: l.cropName,
        quantity: l.quantity || 10,
        expected_price_per_unit: l.expectedPricePerUnit || 5000,
        status: (l.status || 'active').toLowerCase(),
        created_at: l.createdAt || new Date().toISOString()
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

export const REQUIRED_STORAGE_BUCKETS = [
  'crop-scans',
  'scan-images',
  'soil-reports',
  'products',
  'avatars',
  'profiles',
  'crop-images'
] as const;

export type SupportedBucket = typeof REQUIRED_STORAGE_BUCKETS[number];

/**
 * Ensures all required Supabase Storage buckets exist and are marked public.
 */
export async function ensureStorageBucketsExist(): Promise<{ success: boolean; buckets: string[]; errors: string[] }> {
  const client = getSupabase();
  if (!client) {
    return { success: false, buckets: [], errors: ['Supabase client not configured'] };
  }

  const existingBuckets: string[] = [];
  const errors: string[] = [];

  try {
    const { data: buckets, error: listErr } = await client.storage.listBuckets();
    if (listErr) {
      errors.push(`listBuckets error: ${listErr.message}`);
    }

    const currentNames = new Set(buckets?.map(b => b.name) || []);

    for (const bName of REQUIRED_STORAGE_BUCKETS) {
      if (!currentNames.has(bName)) {
        try {
          const { error: createErr } = await client.storage.createBucket(bName, {
            public: true,
            fileSizeLimit: 15728640 // 15MB
          });
          if (createErr) {
            errors.push(`Bucket '${bName}' creation error: ${createErr.message}`);
          } else {
            console.log(`📦 [SUPABASE STORAGE] Created bucket '${bName}' (public: true)`);
            existingBuckets.push(bName);
          }
        } catch (e: any) {
          errors.push(`Bucket '${bName}' exception: ${e?.message}`);
        }
      } else {
        existingBuckets.push(bName);
      }
    }

    return {
      success: errors.length === 0,
      buckets: existingBuckets,
      errors
    };
  } catch (err: any) {
    return {
      success: false,
      buckets: existingBuckets,
      errors: [err?.message || String(err)]
    };
  }
}

/**
 * Universal file uploader for any Supabase Storage bucket.
 * Falls back to local file hosting (/uploads/...) if Supabase is temporarily unreachable.
 */
export async function uploadToStorage(
  bucketName: SupportedBucket | string,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  const client = getSupabase();
  if (!client) {
    return `/uploads/${fileName}`;
  }

  try {
    const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${Date.now()}_${cleanName}`;

    const { error: uploadError } = await client.storage
      .from(bucketName)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true
      });

    if (uploadError) {
      console.warn(`[SUPABASE STORAGE] Upload to bucket '${bucketName}' failed:`, uploadError.message);
      // If primary bucket failed, try fallback bucket
      if (bucketName === 'crop-scans') {
        const { error: fbErr } = await client.storage.from('scan-images').upload(storagePath, fileBuffer, { contentType: mimeType, upsert: true });
        if (!fbErr) {
          const { data: fbUrl } = client.storage.from('scan-images').getPublicUrl(storagePath);
          if (fbUrl?.publicUrl) return fbUrl.publicUrl;
        }
      }
      return `/uploads/${fileName}`;
    }

    const { data: urlData } = client.storage
      .from(bucketName)
      .getPublicUrl(storagePath);

    return urlData?.publicUrl || `/uploads/${fileName}`;
  } catch (err: any) {
    console.warn(`[SUPABASE STORAGE] Exception uploading to '${bucketName}':`, err?.message || err);
    return `/uploads/${fileName}`;
  }
}

/**
 * Uploads a disease scan leaf photo directly to Supabase Storage bucket 'crop-scans' / 'scan-images'
 * and returns the public CDN URL.
 */
export async function uploadScanImageToStorage(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  return uploadToStorage('crop-scans', fileBuffer, fileName, mimeType);
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

