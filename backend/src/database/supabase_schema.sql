-- ==============================================================================
-- AgroDex - Cloud PostgreSQL Schema for Supabase
-- One-Click Run in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & PROFILES TABLE
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT ('usr-' || substr(uuid_generate_v4()::text, 1, 8)),
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('FARMER', 'VENDOR', 'BUYER', 'ADMIN')),
    language TEXT NOT NULL DEFAULT 'en',
    village TEXT,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FARMER PROFILES
CREATE TABLE IF NOT EXISTS farmer_profiles (
    id TEXT PRIMARY KEY DEFAULT ('fprof-' || substr(uuid_generate_v4()::text, 1, 8)),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    farm_size_acres DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    primary_crops TEXT[] DEFAULT '{}',
    soil_type TEXT DEFAULT 'Red Loam',
    irrigation_source TEXT DEFAULT 'Borewell & Drip Irrigation',
    kisan_credit_card BOOLEAN DEFAULT true,
    annual_turnover DOUBLE PRECISION DEFAULT 450000,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. VENDOR PROFILES
CREATE TABLE IF NOT EXISTS vendor_profiles (
    id TEXT PRIMARY KEY DEFAULT ('vprof-' || substr(uuid_generate_v4()::text, 1, 8)),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shop_name TEXT NOT NULL,
    shop_address TEXT NOT NULL,
    license_number TEXT NOT NULL,
    verified BOOLEAN DEFAULT true,
    categories_supplied TEXT[] DEFAULT '{}',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    delivery_radius_km DOUBLE PRECISION DEFAULT 30.0,
    contact_person TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FARMS TABLE
CREATE TABLE IF NOT EXISTS farms (
    id TEXT PRIMARY KEY DEFAULT ('farm-' || substr(uuid_generate_v4()::text, 1, 8)),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    total_acres DOUBLE PRECISION NOT NULL,
    soil_type TEXT NOT NULL,
    irrigation_type TEXT NOT NULL,
    survey_number TEXT,
    village TEXT,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CROPS TABLE
CREATE TABLE IF NOT EXISTS crops (
    id TEXT PRIMARY KEY DEFAULT ('crop-' || substr(uuid_generate_v4()::text, 1, 8)),
    farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    crop_name TEXT NOT NULL,
    variety TEXT NOT NULL,
    season TEXT NOT NULL,
    sowing_date DATE NOT NULL,
    expected_harvest_date DATE NOT NULL,
    acreage DOUBLE PRECISION NOT NULL,
    status TEXT NOT NULL DEFAULT 'GROWING',
    health_status TEXT NOT NULL DEFAULT 'EXCELLENT',
    expected_yield_quintals DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SOIL INTELLIGENCE TESTS
CREATE TABLE IF NOT EXISTS soil_tests (
    id TEXT PRIMARY KEY DEFAULT ('soil-' || substr(uuid_generate_v4()::text, 1, 8)),
    farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_lab_certified BOOLEAN DEFAULT false,
    source_type TEXT NOT NULL DEFAULT 'MANUAL_ENTRY',
    ph DOUBLE PRECISION NOT NULL DEFAULT 6.8,
    nitrogen_kg_per_ha DOUBLE PRECISION NOT NULL DEFAULT 190.0,
    phosphorus_kg_per_ha DOUBLE PRECISION NOT NULL DEFAULT 21.0,
    potassium_kg_per_ha DOUBLE PRECISION NOT NULL DEFAULT 280.0,
    organic_carbon_pct DOUBLE PRECISION NOT NULL DEFAULT 0.42,
    electrical_conductivity DOUBLE PRECISION NOT NULL DEFAULT 0.35,
    soil_moisture_pct DOUBLE PRECISION,
    summary TEXT,
    recommendations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AI DIAGNOSES TABLE (Photo Leaf Diagnostics)
CREATE TABLE IF NOT EXISTS ai_diagnoses (
    id TEXT PRIMARY KEY DEFAULT ('diag-' || substr(uuid_generate_v4()::text, 1, 8)),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    farm_id TEXT,
    crop_name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    photo_metadata JSONB DEFAULT '{}'::jsonb,
    suspected_issue TEXT NOT NULL,
    confidence_score DOUBLE PRECISION NOT NULL,
    severity TEXT NOT NULL DEFAULT 'MODERATE',
    symptoms_evidence JSONB DEFAULT '[]'::jsonb,
    cultural_control JSONB DEFAULT '[]'::jsonb,
    biological_control JSONB DEFAULT '[]'::jsonb,
    chemical_control_safe JSONB DEFAULT '[]'::jsonb,
    safety_warnings JSONB DEFAULT '[]'::jsonb,
    recommended_product_ids JSONB DEFAULT '[]'::jsonb,
    follow_up_questions JSONB DEFAULT '[]'::jsonb,
    is_expert_reviewed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PRODUCT CATEGORIES
CREATE TABLE IF NOT EXISTS product_categories (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name_en TEXT NOT NULL,
    name_hi TEXT NOT NULL,
    name_te TEXT NOT NULL,
    icon TEXT,
    image_url TEXT
);

-- 9. PRODUCTS TABLE (Agri Inputs)
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY DEFAULT ('prod-' || substr(uuid_generate_v4()::text, 1, 8)),
    vendor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES product_categories(id),
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('SEEDS', 'FERTILIZERS', 'CROP_PROTECTION', 'EQUIPMENT')),
    sub_category TEXT,
    price DOUBLE PRECISION NOT NULL,
    original_price DOUBLE PRECISION,
    discount_percent DOUBLE PRECISION DEFAULT 0,
    pack_size TEXT NOT NULL,
    in_stock BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT 50,
    rating DOUBLE PRECISION DEFAULT 4.8,
    reviews_count INTEGER DEFAULT 12,
    images JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    agricultural_use TEXT,
    active_ingredients TEXT,
    dosage_guidance TEXT,
    label_instructions TEXT,
    safety_warnings JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY DEFAULT ('ord-' || substr(uuid_generate_v4()::text, 1, 8)),
    farmer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vendor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount DOUBLE PRECISION NOT NULL,
    payment_mode TEXT NOT NULL DEFAULT 'COD',
    payment_status TEXT NOT NULL DEFAULT 'PENDING',
    delivery_address TEXT NOT NULL,
    delivery_status TEXT NOT NULL DEFAULT 'PLACED',
    tracking_timeline JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. PRODUCE LISTINGS TABLE (Farmer Marketplace)
CREATE TABLE IF NOT EXISTS produce_listings (
    id TEXT PRIMARY KEY DEFAULT ('lot-' || substr(uuid_generate_v4()::text, 1, 8)),
    farmer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    farmer_name TEXT NOT NULL,
    farmer_phone TEXT NOT NULL,
    crop_name TEXT NOT NULL,
    variety TEXT NOT NULL,
    quantity_quintals DOUBLE PRECISION NOT NULL,
    available_quantity_quintals DOUBLE PRECISION NOT NULL,
    expected_price_per_quintal DOUBLE PRECISION NOT NULL,
    harvest_date DATE NOT NULL,
    description TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    location TEXT NOT NULL,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    buyer_inquiries_count INTEGER DEFAULT 0,
    verified_sample BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. PROCUREMENT VENDORS & BUYERS
CREATE TABLE IF NOT EXISTS procurement_vendors (
    id TEXT PRIMARY KEY DEFAULT ('proc-ven-' || substr(uuid_generate_v4()::text, 1, 8)),
    company_name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    buyer_type TEXT NOT NULL,
    verified BOOLEAN DEFAULT true,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    commodities_needed JSONB DEFAULT '[]'::jsonb,
    min_quantity_quintals DOUBLE PRECISION DEFAULT 20,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. VENDOR DEAL REQUESTS (Farmer <-> Vendor Deal Workflow)
CREATE TABLE IF NOT EXISTS vendor_deal_requests (
    id TEXT PRIMARY KEY DEFAULT ('deal-' || substr(uuid_generate_v4()::text, 1, 8)),
    listing_id TEXT REFERENCES produce_listings(id) ON DELETE SET NULL,
    farmer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vendor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vendor_name TEXT NOT NULL,
    vendor_phone TEXT NOT NULL,
    crop_name TEXT NOT NULL,
    variety TEXT NOT NULL,
    offered_price_per_quintal DOUBLE PRECISION NOT NULL,
    requested_quantity_quintals DOUBLE PRECISION NOT NULL,
    total_deal_value DOUBLE PRECISION NOT NULL,
    pickup_type TEXT NOT NULL DEFAULT 'FARM_GATE_PICKUP',
    delivery_window TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. BUYER REQUESTS
CREATE TABLE IF NOT EXISTS buyer_requests (
    id TEXT PRIMARY KEY DEFAULT ('req-' || substr(uuid_generate_v4()::text, 1, 8)),
    buyer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    buyer_name TEXT NOT NULL,
    buyer_phone TEXT NOT NULL,
    listing_id TEXT NOT NULL REFERENCES produce_listings(id) ON DELETE CASCADE,
    crop_name TEXT NOT NULL,
    variety TEXT NOT NULL,
    requested_quantity_quintals DOUBLE PRECISION NOT NULL,
    offered_price_per_quintal DOUBLE PRECISION NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. ALL-INDIA MANDI MARKET PRICES
CREATE TABLE IF NOT EXISTS market_prices (
    id TEXT PRIMARY KEY DEFAULT ('price-' || substr(uuid_generate_v4()::text, 1, 8)),
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    market TEXT NOT NULL,
    commodity TEXT NOT NULL,
    commodity_type TEXT NOT NULL DEFAULT 'CROP',
    variety TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'QUINTAL',
    min_price DOUBLE PRECISION NOT NULL,
    max_price DOUBLE PRECISION NOT NULL,
    modal_price DOUBLE PRECISION NOT NULL,
    price_date DATE NOT NULL DEFAULT CURRENT_DATE,
    trend TEXT NOT NULL DEFAULT 'STABLE' CHECK (trend IN ('UP', 'DOWN', 'STABLE')),
    change_amount DOUBLE PRECISION DEFAULT 0,
    reported_by TEXT,
    reported_by_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY DEFAULT ('notif-' || substr(uuid_generate_v4()::text, 1, 8)),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT false,
    link_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. CHAT & LOGISTICS MESSAGES
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY DEFAULT ('msg-' || substr(uuid_generate_v4()::text, 1, 8)),
    sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    receiver_name TEXT NOT NULL,
    text TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    deal_id TEXT
);

-- INDEXES FOR FAST SEARCH
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_produce_listings_status ON produce_listings(status);
CREATE INDEX IF NOT EXISTS idx_market_prices_state_district ON market_prices(state, district);
CREATE INDEX IF NOT EXISTS idx_market_prices_commodity ON market_prices(commodity);
CREATE INDEX IF NOT EXISTS idx_vendor_deal_farmer ON vendor_deal_requests(farmer_id);
CREATE INDEX IF NOT EXISTS idx_vendor_deal_vendor ON vendor_deal_requests(vendor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- DISABLE ROW LEVEL SECURITY (RLS) FOR FULL API ACCESS OR ENABLE POLICIES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE produce_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_deal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow public read access to market prices and products
CREATE POLICY "Public Market Prices" ON market_prices FOR SELECT USING (true);
CREATE POLICY "Public Products" ON products FOR SELECT USING (true);
CREATE POLICY "Public Produce Listings" ON produce_listings FOR SELECT USING (true);
CREATE POLICY "Allow All for Authenticated & Anon API" ON users FOR ALL USING (true);
CREATE POLICY "Allow All for Authenticated Deals" ON vendor_deal_requests FOR ALL USING (true);
CREATE POLICY "Allow All for Authenticated Orders" ON orders FOR ALL USING (true);

-- 18. STORAGE BUCKET FOR CROP DISEASE SCANS ('scan-images')
INSERT INTO storage.buckets (id, name, public)
VALUES ('scan-images', 'scan-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for scan-images
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Scan Images Access'
    ) THEN
        CREATE POLICY "Public Scan Images Access" ON storage.objects FOR SELECT USING (bucket_id = 'scan-images');
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Scan Images Upload'
    ) THEN
        CREATE POLICY "Public Scan Images Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'scan-images');
    END IF;
END $$;

-- 19. COMPATIBILITY VIEWS (profiles, marketplace_products, disease_scans, soil_health_records)
CREATE OR REPLACE VIEW profiles AS SELECT * FROM users;
CREATE OR REPLACE VIEW marketplace_products AS SELECT * FROM products;
CREATE OR REPLACE VIEW disease_scans AS SELECT * FROM ai_diagnoses;
CREATE OR REPLACE VIEW soil_health_records AS SELECT * FROM soil_tests;



