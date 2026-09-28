import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || 'https://yxdbvpzxkfptxoitselr.supabase.co';
const rawKey = metaEnv.VITE_SUPABASE_ANON_KEY || 'sb_publishable_2iL1pAVDMunWXz2rFFgqPw_C9R384xs';
// Ensure lowercase 'sb_'
const supabaseAnonKey = rawKey.startsWith('Sb_') ? 'sb_' + rawKey.substring(3) : rawKey;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http') && !supabaseUrl.includes('your-project-id'));
};

/**
 * Uploads a binary file or Blob directly to Supabase Storage
 */
export async function uploadToSupabaseStorage(
  bucket: 'crop-scans' | 'scan-images' | 'soil-reports' | 'products' | 'avatars' | 'profiles' | 'crop-images',
  file: File | Blob,
  customFileName?: string
): Promise<{ success: boolean; publicUrl: string; error?: string }> {
  try {
    const ext = file.type.split('/')[1] || 'jpg';
    const cleanName = (customFileName || `upload_${Date.now()}.${ext}`).replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${Date.now()}_${cleanName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, file, {
        contentType: file.type || 'image/jpeg',
        upsert: true
      });

    if (error) {
      console.warn(`[Supabase Storage Client] Upload to ${bucket} failed:`, error.message);
      return { success: false, publicUrl: '', error: error.message };
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);
    return { success: true, publicUrl: urlData.publicUrl };
  } catch (err: any) {
    console.error(`[Supabase Storage Client Exception]`, err);
    return { success: false, publicUrl: '', error: err.message || 'Upload failed' };
  }
}

/**
 * Helper to subscribe to Realtime changes on any Supabase table
 */
export function subscribeToTable<T = any>(
  tableName: string,
  callbacks: {
    onInsert?: (record: T) => void;
    onUpdate?: (record: T) => void;
    onDelete?: (oldRecord: T) => void;
    onChange?: (payload: any) => void;
  }
): RealtimeChannel {
  const channelName = `realtime:${tableName}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: tableName },
      (payload) => {
        console.log(`📡 [Realtime Event] table='${tableName}' event='${payload.eventType}':`, payload.new || payload.old);
        if (callbacks.onChange) callbacks.onChange(payload);
        if (payload.eventType === 'INSERT' && callbacks.onInsert) callbacks.onInsert(payload.new as T);
        if (payload.eventType === 'UPDATE' && callbacks.onUpdate) callbacks.onUpdate(payload.new as T);
        if (payload.eventType === 'DELETE' && callbacks.onDelete) callbacks.onDelete(payload.old as T);
      }
    )
    .subscribe((status) => {
      console.log(`🔌 [Realtime Status] table='${tableName}' subscription status: ${status}`);
    });

  return channel;
}
