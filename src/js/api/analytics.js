// Analytics API calls for Z3n Marketplace
import supabase from '../core/supabase.js';
import toast from '../components/toast.js';

export async function trackEvent(productId, eventType, metadata) {
  try {
    await supabase.from('analytics').insert([{ product_id: productId, event_type: eventType, metadata }]);
  } catch (err) {
    // Silent fail
  }
}

export async function getProductAnalytics(productId, dateRange) {
  try {
    const { data, error } = await supabase.from('analytics').select('*').eq('product_id', productId).gte('created_at', dateRange.start).lte('created_at', dateRange.end);
    if (error) throw error;
    return data;
  } catch (err) {
    toast.error(err.message || 'Failed to load analytics');
    return [];
  }
}

export async function getSellerAnalytics(sellerId, dateRange) {
  try {
    const { data, error } = await supabase.from('analytics').select('*').eq('seller_id', sellerId).gte('created_at', dateRange.start).lte('created_at', dateRange.end);
    if (error) throw error;
    return data;
  } catch (err) {
    toast.error(err.message || 'Failed to load analytics');
    return [];
  }
}

export async function getTopProducts(sellerId) {
  try {
    const { data, error } = await supabase.from('products').select('*').eq('seller_id', sellerId).order('sales', { ascending: false }).limit(5);
    if (error) throw error;
    return data;
  } catch (err) {
    toast.error(err.message || 'Failed to load top products');
    return [];
  }
}
