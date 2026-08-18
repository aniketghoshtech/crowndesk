import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (url && key) {
    try {
      supabaseClient = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      return supabaseClient;
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
    }
  }
  return null;
}

export const SUPABASE_BUCKET_NAME = process.env.STORAGE_BUCKET || process.env.AWS_S3_BUCKET || 'crowndesk-files';

/**
 * Upload a private file buffer to Supabase Storage
 */
export async function uploadToSupabaseStorage(
  storagePath: string,
  buffer: Buffer,
  contentType: string
): Promise<{ success: boolean; storagePath: string; error?: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, storagePath, error: 'Supabase credentials not configured' };
  }

  try {
    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      return { success: false, storagePath, error: error.message };
    }

    return { success: true, storagePath };
  } catch (err: any) {
    console.error('Supabase upload exception:', err);
    return { success: false, storagePath, error: err.message };
  }
}

/**
 * Download a private file buffer from Supabase Storage
 */
export async function downloadFromSupabaseStorage(
  storagePath: string
): Promise<{ data: Buffer | null; error?: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { data: null, error: 'Supabase credentials not configured' };
  }

  try {
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET_NAME)
      .download(storagePath);

    if (error || !data) {
      return { data: null, error: error?.message || 'File not found in storage' };
    }

    const arrayBuffer = await data.arrayBuffer();
    return { data: Buffer.from(arrayBuffer) };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}
