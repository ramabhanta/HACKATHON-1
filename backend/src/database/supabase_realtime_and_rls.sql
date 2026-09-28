-- ============================================================================
-- AgroDex Supabase Realtime, Storage Buckets & RLS Policy Configuration
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/yxdbvpzxkfptxoitselr/sql
-- ============================================================================

-- 1. EXPAND PROFILES ROLE CHECK (ALLOW FARMER, VENDOR, BUYER, EXPERT, ADMIN)
DO $$
BEGIN
    ALTER TABLE IF EXISTS profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE IF EXISTS profiles ADD CONSTRAINT profiles_role_check 
        CHECK (role IN ('farmer', 'vendor', 'buyer', 'expert', 'admin', 'FARMER', 'VENDOR', 'BUYER', 'EXPERT', 'ADMIN'));
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- 2. ENABLE SUPABASE REALTIME REPLICATION ON KEY APPLICATION TABLES
DO $$
BEGIN
    -- Ensure publication exists
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;

    -- Add application tables to realtime stream
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
    ALTER PUBLICATION supabase_realtime ADD TABLE farms;
    ALTER PUBLICATION supabase_realtime ADD TABLE crops;
    ALTER PUBLICATION supabase_realtime ADD TABLE disease_scans;
    ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_products;
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
    ALTER PUBLICATION supabase_realtime ADD TABLE soil_health_records;
    ALTER PUBLICATION supabase_realtime ADD TABLE produce_listings;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN others THEN NULL;
END $$;

-- Set full replica identity so Realtime updates deliver complete row payloads
ALTER TABLE IF EXISTS profiles REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS farms REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS crops REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS disease_scans REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS marketplace_products REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS orders REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS soil_health_records REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS produce_listings REPLICA IDENTITY FULL;

-- 3. PERMISSIVE ROW LEVEL SECURITY POLICIES FOR REST & REALTIME CLIENTS
-- (Enables anonymous & authenticated frontend web clients to read & write live)

-- PROFILES
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All For Profiles" ON profiles;
CREATE POLICY "Allow All For Profiles" ON profiles FOR ALL TO public USING (true) WITH CHECK (true);

-- FARMS
ALTER TABLE IF EXISTS farms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All For Farms" ON farms;
CREATE POLICY "Allow All For Farms" ON farms FOR ALL TO public USING (true) WITH CHECK (true);

-- CROPS
ALTER TABLE IF EXISTS crops ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All For Crops" ON crops;
CREATE POLICY "Allow All For Crops" ON crops FOR ALL TO public USING (true) WITH CHECK (true);

-- DISEASE_SCANS (CROP LEAF SCANS)
ALTER TABLE IF EXISTS disease_scans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All For Disease Scans" ON disease_scans;
CREATE POLICY "Allow All For Disease Scans" ON disease_scans FOR ALL TO public USING (true) WITH CHECK (true);

-- MARKETPLACE_PRODUCTS
ALTER TABLE IF EXISTS marketplace_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All For Marketplace Products" ON marketplace_products;
CREATE POLICY "Allow All For Marketplace Products" ON marketplace_products FOR ALL TO public USING (true) WITH CHECK (true);

-- ORDERS
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All For Orders" ON orders;
CREATE POLICY "Allow All For Orders" ON orders FOR ALL TO public USING (true) WITH CHECK (true);

-- SOIL_HEALTH_RECORDS
ALTER TABLE IF EXISTS soil_health_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All For Soil Records" ON soil_health_records;
CREATE POLICY "Allow All For Soil Records" ON soil_health_records FOR ALL TO public USING (true) WITH CHECK (true);

-- PRODUCE_LISTINGS
ALTER TABLE IF EXISTS produce_listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All For Produce Listings" ON produce_listings;
CREATE POLICY "Allow All For Produce Listings" ON produce_listings FOR ALL TO public USING (true) WITH CHECK (true);

-- 4. STORAGE BUCKETS AUTO-PROVISIONING & PUBLIC ACCESS
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES 
    ('crop-scans', 'crop-scans', true, 15728640),
    ('scan-images', 'scan-images', true, 15728640),
    ('soil-reports', 'soil-reports', true, 15728640),
    ('products', 'products', true, 15728640),
    ('avatars', 'avatars', true, 15728640),
    ('profiles', 'profiles', true, 15728640),
    ('crop-images', 'crop-images', true, 15728640)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage object policies for all 7 buckets
DO $$
DECLARE
    b_name TEXT;
    bucket_list TEXT[] := ARRAY['crop-scans', 'scan-images', 'soil-reports', 'products', 'avatars', 'profiles', 'crop-images'];
BEGIN
    FOREACH b_name IN ARRAY bucket_list LOOP
        -- Select Policy
        EXECUTE format('DROP POLICY IF EXISTS "Public Select for %s" ON storage.objects;', b_name);
        EXECUTE format('CREATE POLICY "Public Select for %s" ON storage.objects FOR SELECT USING (bucket_id = %L);', b_name, b_name);

        -- Insert / Upload Policy
        EXECUTE format('DROP POLICY IF EXISTS "Public Insert for %s" ON storage.objects;', b_name);
        EXECUTE format('CREATE POLICY "Public Insert for %s" ON storage.objects FOR INSERT WITH CHECK (bucket_id = %L);', b_name, b_name);

        -- Update Policy
        EXECUTE format('DROP POLICY IF EXISTS "Public Update for %s" ON storage.objects;', b_name);
        EXECUTE format('CREATE POLICY "Public Update for %s" ON storage.objects FOR UPDATE USING (bucket_id = %L) WITH CHECK (bucket_id = %L);', b_name, b_name);
    END LOOP;
END $$;
