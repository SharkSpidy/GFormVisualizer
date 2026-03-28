import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Dataset {
  id: string;
  user_id: string;
  name: string;
  source_type: 'csv' | 'google_sheets';
  raw_data: any[];
  processed_data: any;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface Analysis {
  id: string;
  dataset_id: string;
  analysis_type: string;
  results: any;
  visualizations: any[];
  created_at: string;
}
