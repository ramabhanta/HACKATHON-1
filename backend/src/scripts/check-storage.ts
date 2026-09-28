import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getSupabase } from '../database/supabaseClient.js';

async function checkBuckets() {
  const sb = getSupabase();
  const { data, error } = await sb.storage.listBuckets();
  console.log('Existing buckets:', data?.map(b => b.name));
  if (error) console.error('Error listing buckets:', error);

  const requiredBuckets = [
    'crop-scans',
    'scan-images',
    'soil-reports',
    'products',
    'avatars',
    'profiles',
    'crop-images'
  ];

  for (const bucket of requiredBuckets) {
    const exists = data?.some(b => b.name === bucket);
    if (!exists) {
      console.log(`Creating bucket '${bucket}' with public: true...`);
      const { data: created, error: cErr } = await sb.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 15728640 // 15MB
      });
      if (cErr) {
        console.error(`Failed to create bucket '${bucket}':`, cErr);
      } else {
        console.log(`Bucket '${bucket}' created successfully.`);
      }
    } else {
      console.log(`Bucket '${bucket}' already exists.`);
    }
  }

  const { data: finalBuckets } = await sb.storage.listBuckets();
  console.log('Final buckets list:', finalBuckets?.map(b => ({ name: b.name, public: b.public })));
}

checkBuckets().catch(console.error);
