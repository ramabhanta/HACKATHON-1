import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';
import { db } from './db.js';
import fs from 'fs';
import path from 'path';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const url = config.supabaseUrl || process.env.SUPABASE_URL;
  const key = config.supabaseServiceKey || config.supabaseAnonKey || process.env.SUPABASE_ANON_KEY;

  if (url && key && url.startsWith('http')) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: { persistSession: false }
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
    return {
      connected: false,
      message: `Failed to ping Supabase: ${err.message}`,
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
    // 1. Sync users
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
      const { error } = await client.from('users').upsert(userRows, { onConflict: 'id' });
      if (error) errors.push(`Users sync error: ${error.message}`);
      else syncedCounts.users = userRows.length;
    }

    // 2. Sync product categories
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
      const { error } = await client.from('product_categories').upsert(catRows, { onConflict: 'id' });
      if (error) errors.push(`Categories sync error: ${error.message}`);
      else syncedCounts.product_categories = catRows.length;
    }

    // 3. Sync products
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
      const { error } = await client.from('products').upsert(prodRows, { onConflict: 'id' });
      if (error) errors.push(`Products sync error: ${error.message}`);
      else syncedCounts.products = prodRows.length;
    }

    // 4. Sync market prices
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
      const { error } = await client.from('market_prices').upsert(priceRows, { onConflict: 'id' });
      if (error) errors.push(`Prices sync error: ${error.message}`);
      else syncedCounts.market_prices = priceRows.length;
    }

    // 5. Sync produce listings
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
      const { error } = await client.from('produce_listings').upsert(listRows, { onConflict: 'id' });
      if (error) errors.push(`Listings sync error: ${error.message}`);
      else syncedCounts.produce_listings = listRows.length;
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
