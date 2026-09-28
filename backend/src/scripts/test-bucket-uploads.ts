import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getSupabase } from '../database/supabaseClient.js';

async function testUploads() {
  const sb = getSupabase();
  const testBuffer = Buffer.from('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  const buckets = ['scan-images', 'crop-images', 'profiles', 'products'];

  for (const bucket of buckets) {
    const filename = `test_${Date.now()}.png`;
    const { data: uploadData, error: upErr } = await sb.storage
      .from(bucket)
      .upload(filename, testBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (upErr) {
      console.error(`❌ Upload to ${bucket} failed:`, upErr);
    } else {
      const { data: urlData } = sb.storage.from(bucket).getPublicUrl(filename);
      console.log(`✅ Upload to ${bucket} success! Public URL:`, urlData.publicUrl);
    }
  }
}

testUploads().catch(console.error);
