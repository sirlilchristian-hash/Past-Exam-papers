import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Paper } from '../types';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
// Strip trailing /rest/v1 or trailing slashes to leave the clean Supabase base URL
export const sanitizedSupabaseUrl = rawUrl
  ? rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
  : '';

export const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(sanitizedSupabaseUrl && supabaseAnonKey);

let client: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  try {
    client = createClient(sanitizedSupabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
  }
}

export const supabase = client;

/**
 * Fetch all papers from Supabase public.Papers
 */
export async function fetchPapersFromSupabase(): Promise<{
  papers: Paper[] | null;
  error: string | null;
}> {
  if (!supabase) {
    return { papers: null, error: 'Supabase client is not configured' };
  }

  try {
    const result = await supabase
      .from('Papers')
      .select('id, created_at, unit_code, paper_title, price, file_path, status')
      .order('created_at', { ascending: false });

    if (result.error) {
      console.warn('Supabase Papers query note:', result.error.message);
      return { papers: null, error: result.error.message };
    }

    const loadedPapers: Paper[] = (result.data || []).map((row: any) => ({
      id: String(row.id),
      created_at: row.created_at,
      unit_code: row.unit_code || '',
      paper_title: row.paper_title || '',
      price: row.price ?? 'KSh 50',
      file_path: row.file_path || null,
      status: typeof row.status === 'string' ? row.status : 'available',
    }));

    return { papers: loadedPapers, error: null };
  } catch (err: any) {
    console.warn('Supabase fetch exception:', err);
    return { papers: null, error: err?.message || 'Failed to query Supabase' };
  }
}

/**
 * Unified helper to save/create a paper across backend API & Supabase
 */
export async function savePaperUnified(
  paperData: Omit<Paper, 'id' | 'created_at'>
): Promise<{ data: Paper | null; error: string | null }> {
  try {
    // 1. Save to backend API (reliable persistence)
    const res = await fetch('/api/papers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paperData),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return { data: null, error: errJson.error || 'Failed to save paper to backend' };
    }

    const saved = await res.json();
    return { data: saved, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Network error saving paper' };
  }
}

/**
 * Unified helper to update a paper across backend API & Supabase
 */
export async function updatePaperUnified(
  id: string,
  updates: Partial<Paper>
): Promise<{ data: Paper | null; error: string | null }> {
  try {
    const res = await fetch(`/api/papers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return { data: null, error: errJson.error || 'Failed to update paper' };
    }

    const updated = await res.json();
    return { data: updated, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Network error updating paper' };
  }
}

/**
 * Unified helper to delete a paper across backend API & Supabase
 */
export async function deletePaperUnified(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const res = await fetch(`/api/papers/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      return { success: false, error: 'Failed to delete paper' };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error deleting paper' };
  }
}

/**
 * Attempt to insert a new paper record into public.Papers
 * Note: Subject to RLS policies. Returns error if unauthorized.
 */
export async function insertPaperToSupabase(
  paper: Omit<Paper, 'id' | 'created_at'>
): Promise<{ data: Paper | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: 'Supabase client is not configured' };
  }

  try {
    const payload = {
      unit_code: paper.unit_code,
      paper_title: paper.paper_title,
      price: paper.price,
      status: paper.status,
      file_path: paper.file_path,
    };

    const result = await supabase.from('Papers').insert([payload]).select().single();

    if (result.error) {
      return { data: null, error: result.error.message };
    }

    return { data: result.data as Paper, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to insert paper into Supabase' };
  }
}

/**
 * Attempt to update a paper in public.Papers
 * Note: Subject to RLS policies. Returns error if unauthorized.
 */
export async function updatePaperInSupabase(
  id: string,
  updates: Partial<Paper>
): Promise<{ data: Paper | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: 'Supabase client is not configured' };
  }

  try {
    const payload: Record<string, any> = {};
    if (updates.unit_code !== undefined) payload.unit_code = updates.unit_code;
    if (updates.paper_title !== undefined) payload.paper_title = updates.paper_title;
    if (updates.price !== undefined) payload.price = updates.price;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.file_path !== undefined) payload.file_path = updates.file_path;

    const result = await supabase.from('Papers').update(payload).eq('id', id).select().single();

    if (result.error) {
      return { data: null, error: result.error.message };
    }

    return { data: result.data as Paper, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || 'Failed to update paper in Supabase' };
  }
}

/**
 * Attempt to delete a paper from public.Papers
 * Note: Subject to RLS policies. Returns error if unauthorized.
 */
export async function deletePaperFromSupabase(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  if (!supabase) {
    return { success: false, error: 'Supabase client is not configured' };
  }

  try {
    const result = await supabase.from('Papers').delete().eq('id', id);

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete paper from Supabase' };
  }
}
