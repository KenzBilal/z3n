// Search API calls for Z3n Marketplace
import supabase from '../core/supabase.js';
import toast from '../components/toast.js';

export async function search(query, filters) {
  try {
    const { data, error } = await supabase.functions.invoke('search-products', { body: { query, filters } });
    if (error) throw error;
    return data;
  } catch (err) {
    toast.error(err.message || 'Search failed');
    return [];
  }
}

export async function getSearchSuggestions(query) {
  try {
    const { data, error } = await supabase.from('products').select('title').ilike('title', `%${query}%`).limit(5);
    if (error) throw error;
    return data;
  } catch (err) {
    toast.error(err.message || 'Suggestions failed');
    return [];
  }
}

export async function trackSearch(query) {
  try {
    await supabase.from('searches').insert([{ query }]);
  } catch (err) {
    // Silent fail
  }
}
