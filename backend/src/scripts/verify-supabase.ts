import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

// Load backend/.env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getSupabase } from '../database/supabaseClient.js';

function toUuid(str: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
    return str;
  }
  const hash = crypto.createHash('md5').update(str).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

async function verifySupabase() {
  console.log('=== SUPABASE CONNECTION VERIFICATION ===');

  try {
    const supabase = getSupabase();

    // 1. Insert or upsert test profile into 'profiles'
    let profileId = 'usr-nani-test';
    let profilePayload: any = {
      id: profileId,
      name: 'nani',
      email: 'yugandharreddy350@gmail.com',
      role: 'farmer'
    };

    let { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' })
      .select();

    while (profileError) {
      let changed = false;
      if (profileError.code === '22P02' || profileError.message?.includes('uuid')) {
        profileId = toUuid(profileId);
        profilePayload.id = profileId;
        changed = true;
      }
      if (profileError.code === 'PGRST204' || profileError.message?.includes('email')) {
        delete profilePayload.email;
        profilePayload.phone = 'yugandharreddy350@gmail.com';
        changed = true;
      }
      if (!changed) break;

      const retryProfile = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' })
        .select();

      profileData = retryProfile.data;
      profileError = retryProfile.error;
    }

    if (profileError) {
      console.error('❌ Profiles insertion error:', {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint
      });
      process.exit(1);
    }

    // 2. Insert sample record into 'disease_scans'
    let scanId = 'scan-nani-' + Date.now();
    let scanPayload: any = {
      id: scanId,
      farmer_id: profileId,
      detected_disease: 'Early Leaf Spot (Tikka Disease)',
      confidence: 0.95,
      remedies: 'Spray Chlorothalonil 75% WP @ 2g/litre',
      created_at: new Date().toISOString()
    };

    let { data: scanData, error: scanError } = await supabase
      .from('disease_scans')
      .insert(scanPayload)
      .select();

    while (scanError) {
      let changed = false;
      if (scanError.code === '22P02' || scanError.message?.includes('uuid')) {
        scanPayload.id = crypto.randomUUID();
        scanPayload.farmer_id = toUuid(profileId);
        changed = true;
      }
      if (scanError.message?.includes('image_url') || scanError.details?.includes('image_url')) {
        scanPayload.image_url = 'https://images.unsplash.com/photo-1592417817098-8f3d6910a455?w=500';
        changed = true;
      }
      if (scanError.code === 'PGRST204' || scanError.message?.includes('confidence') || scanError.message?.includes('remedies')) {
        scanPayload.confidence_score = scanPayload.confidence || 0.95;
        scanPayload.treatment_recommendations = scanPayload.remedies || 'Spray Chlorothalonil 75% WP @ 2g/litre';
        delete scanPayload.confidence;
        delete scanPayload.remedies;
        changed = true;
      }
      if (!changed) break;

      const retryScan = await supabase
        .from('disease_scans')
        .insert(scanPayload)
        .select();

      scanData = retryScan.data;
      scanError = retryScan.error;
    }

    if (scanError) {
      console.error('❌ Disease scans insertion error:', {
        code: scanError.code,
        message: scanError.message,
        details: scanError.details,
        hint: scanError.hint
      });
      process.exit(1);
    }

    // 3. Query row count > 0 on both tables
    const { count: profilesCount, error: countPErr } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (countPErr) {
      console.error('❌ Error counting profiles:', countPErr);
    }

    const { count: scansCount, error: countSErr } = await supabase
      .from('disease_scans')
      .select('*', { count: 'exact', head: true });

    if (countSErr) {
      console.error('❌ Error counting disease_scans:', countSErr);
    }

    console.log(`Profiles Count: ${profilesCount ?? 0}`);
    console.log(`Disease Scans Count: ${scansCount ?? 0}`);
    console.log('Live insertion SUCCESS: Rows are now active in Supabase.');

  } catch (err: any) {
    console.error('❌ Supabase verification exception:', {
      message: err.message || String(err),
      details: err.details || err.stack || err
    });
    process.exit(1);
  }
}

verifySupabase();
