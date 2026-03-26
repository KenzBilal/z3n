// Product API calls for Z3n Marketplace
import supabase from '../core/supabase.js';
import toast from '../components/toast.js';

export async function getProducts({ category, sort, page, limit, filters }) {
  try {
    let query = supabase.from('products').select('*');
    if (category) query = query.eq('category', category);
    // ...apply sort, filters, pagination
    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (err) {
    toast.error(err.message || 'Failed to load products');
    return [];
  }
}

export async function getProductBySlug(slug) {
  try {
    const { data, error } = await supabase.from('products').select('*').eq('slug', slug).single();
    if (error) throw error;
    return data;
  } catch (err) {
    toast.error(err.message || 'Product not found');
    return null;
  }
}

export async function getProductById(id) {
  try {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  } catch (err) {
    toast.error(err.message || 'Product not found');
    return null;
  }
}

export async function getFeaturedProducts() {
  try {
    const { data, error } = await supabase.from('products').select('*').eq('featured', true);
    if (error) throw error;
    return data;
  } catch (err) {
    toast.error(err.message || 'Failed to load featured');
    return [];
  }
}

export async function getProductsByCategory(category) {
  try {
    const { data, error } = await supabase.from('products').select('*').eq('category', category);
    if (error) throw error;
    return data;
  } catch (err) {
    toast.error(err.message || 'Failed to load category');
    return [];
  }
}

export async function getSellerProducts(sellerId) {
  try {
    const { data, error } = await supabase.from('products').select('*').eq('seller_id', sellerId);
    if (error) throw error;
    return data;
  } catch (err) {
    toast.error(err.message || 'Failed to load seller products');
    return [];
  }
}

export async function createProduct(data) {
  try {
    const { error } = await supabase.from('products').insert([data]);
    if (error) throw error;
    toast.success('Product created');
  } catch (err) {
    toast.error(err.message || 'Create failed');
  }
}

export async function updateProduct(id, data) {
  try {
    const { error } = await supabase.from('products').update(data).eq('id', id);
    if (error) throw error;
    toast.success('Product updated');
  } catch (err) {
    toast.error(err.message || 'Update failed');
  }
}

export async function deleteProduct(id) {
  try {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    toast.success('Product deleted');
  } catch (err) {
    toast.error(err.message || 'Delete failed');
  }
}

export async function searchProducts(query, filters) {
  try {
    const { data, error } = await supabase.functions.invoke('search-products', { body: { query, filters } });
    if (error) throw error;
    return data;
  } catch (err) {
    toast.error(err.message || 'Search failed');
    return [];
  }
}

export async function incrementProductView(productId) {
  try {
    await supabase.from('products').update({ views: supabase.raw('views + 1') }).eq('id', productId);
  } catch (err) {
    // Silent fail
  }
}

export async function getRelatedProducts(productId, category) {
  try {
    const { data, error } = await supabase.from('products').select('*').eq('category', category).neq('id', productId).limit(4);
    if (error) throw error;
    return data;
  } catch (err) {
    toast.error(err.message || 'Failed to load related');
    return [];
  }
}
