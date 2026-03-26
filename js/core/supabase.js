// Supabase client initialization

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../supabase/config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const auth = supabase.auth;
export const storage = supabase.storage;
export const functions = supabase.functions;
export default supabase;

// TEMPORARY TEST: Check DB connection and log categories
const { data, error } = await supabase
	.from('categories')
	.select('name, slug')
	.limit(6);

console.log('Z3n DB connected:', data, error);
