import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://wubumkaugtoyktzrxoiu.supabase.co')
  .trim()
  .replace(/\/rest\/v1\/?$/i, '')
  .replace(/\/+$/, '');

const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
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

// সরাসরি ইমপোর্টের সুবিধার্থে এক্সপোর্ট
export const supabase = getSupabaseAdmin() || createClient(
  SUPABASE_URL,
  SUPABASE_KEY || 'dummy_anon_key_placeholder',
  {
    auth: { persistSession: false, autoRefreshToken: false }
  }
);

export const SUPABASE_BUCKET_NAME = process.env.STORAGE_BUCKET || process.env.AWS_S3_BUCKET || 'crowndesk-files';

/**
 * Upload a private file buffer to Supabase Storage
 */
export async function uploadToSupabaseStorage(
  storagePath: string,
  buffer: Buffer,
  contentType: string
): Promise<{ success: boolean; storagePath: string; error?: string }> {
  const client = getSupabaseAdmin();
  if (!client) {
    return { success: false, storagePath, error: 'Supabase credentials not configured' };
  }

  try {
    const { error } = await client.storage
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
  const client = getSupabaseAdmin();
  if (!client) {
    return { data: null, error: 'Supabase credentials not configured' };
  }

  try {
    const { data, error } = await client.storage
      .from(SUPABASE_BUCKET_NAME)
      .download(storagePath);

    if (error || !data) {
      return { data: null, error: error?.message || 'File not found in storage' };
    }

    const arrayBuffer = await data.arrayBuffer();
    return { data: Buffer.from(arrayBuffer) };
  } catch (err: any) {
    console.error('Supabase download exception:', err);
    return { data: null, error: err.message };
  }
}

/**
 * Database Helpers for Permanent Profile Persistence
 */
export async function syncUserProfileToSupabase(user: any): Promise<boolean> {
  const client = getSupabaseAdmin();
  if (!client) return false;

  try {
    const { error } = await client.from('profiles').upsert({
      id: user.id,
      email: user.email.toLowerCase().trim(),
      name: user.name,
      role: user.role,
      phone: user.phone || '',
      clinic_or_lab_name: user.clinicOrLabName || '',
      specialization: user.specialization || '',
      is_active: user.isActive !== false,
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.warn('Failed to upsert profile to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase sync exception:', err);
    return false;
  }
}