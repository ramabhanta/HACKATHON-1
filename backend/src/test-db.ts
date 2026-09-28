import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { createClient } from '@supabase/supabase-js';
import dns from 'dns';

async function runTest() {
  console.log('====================================================');
  console.log('🔍 AGRODEX SUPABASE DIRECT DB INSERTION TEST');
  console.log('====================================================');

  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

  console.log(`URL: ${supabaseUrl}`);
  console.log(`Key prefix: ${supabaseKey.substring(0, 15)}... (Length: ${supabaseKey.length})`);

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment.');
    process.exit(1);
  }

  // 1. DNS Resolution check
  try {
    const host = new URL(supabaseUrl).hostname;
    console.log(`\n1️⃣ Testing DNS resolution for host: ${host}...`);
    const addresses = await new Promise<string[]>((resolve, reject) => {
      dns.resolve4(host, (err, addrs) => {
        if (err) reject(err);
        else resolve(addrs);
      });
    });
    console.log(`✅ Host ${host} resolved successfully to IP(s):`, addresses);
  } catch (dnsErr: any) {
    console.error(`❌ DNS Resolution failed:`, dnsErr.message);
    if (dnsErr.code === 'ENOTFOUND') {
      console.error(`⚠️ The project domain cannot be resolved. The Supabase project is almost certainly PAUSED due to free-tier inactivity.`);
      console.error(`👉 Go to: https://supabase.com/dashboard/project/yxdbvpzxkfptxoitseir and click 'Restore project' or 'Unpause'.`);
    }
  }

  // 2. Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  // 3. Test insert into 'profiles'
  console.log('\n2️⃣ Testing direct insertion into "profiles" table...');
  const testUser = {
    id: 'usr-test-' + Date.now().toString(36),
    name: 'nani',
    email: 'yugandharreddy350@gmail.com',
    role: 'FARMER',
    village: 'Kadiri Rural',
    district: 'Sri Sathya Sai',
    state: 'Andhra Pradesh',
    created_at: new Date().toISOString()
  };

  try {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert(testUser, { onConflict: 'email' })
      .select();

    if (profileError) {
      console.error('❌ Insertion into "profiles" FAILED:');
      console.error('   Code:', profileError.code);
      console.error('   Message:', profileError.message);
      console.error('   Details:', profileError.details);
      console.error('   Hint:', profileError.hint);
    } else {
      console.log('✅ Insertion into "profiles" SUCCEEDED!');
      console.log('   Inserted/Upserted row:', profileData);
    }
  } catch (err: any) {
    console.error('❌ Exception during "profiles" insert:', err.message || err);
  }

  // 4. Test insert into 'disease_scans'
  console.log('\n3️⃣ Testing direct insertion into "disease_scans" table...');
  const testScan = {
    id: 'scan-test-' + Date.now().toString(36),
    farmer_id: testUser.id,
    image_url: 'https://images.unsplash.com/photo-1592417817098-8f3d6910a455?w=500',
    detected_disease: 'Early Blight (Alternaria solani)',
    confidence: 0.94,
    remedies: JSON.stringify(['Mancozeb 75% WP @ 2.5g/L', 'Copper Oxychloride 50% WP @ 3g/L']),
    created_at: new Date().toISOString()
  };

  try {
    const { data: scanData, error: scanError } = await supabase
      .from('disease_scans')
      .insert(testScan)
      .select();

    if (scanError) {
      console.error('❌ Insertion into "disease_scans" FAILED:');
      console.error('   Code:', scanError.code);
      console.error('   Message:', scanError.message);
      console.error('   Details:', scanError.details);
      console.error('   Hint:', scanError.hint);
    } else {
      console.log('✅ Insertion into "disease_scans" SUCCEEDED!');
      console.log('   Inserted row:', scanData);
    }
  } catch (err: any) {
    console.error('❌ Exception during "disease_scans" insert:', err.message || err);
  }

  console.log('\n====================================================\n');
}

runTest();
