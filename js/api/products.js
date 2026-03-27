// Product API calls for Z3n Marketplace
import supabase from '../core/supabase.js';
import toast from '../components/toast.js';
import { getCurrentUser } from '../core/auth.js';
import { slugify } from '../core/utils.js';

export async function getProducts({ category, sort, minPrice, maxPrice, aiModels, page, limit } = {}) {
  try {
    let query = supabase
      .from('products')
      .select('*, profiles:profiles!products_seller_id_fkey(id, username, full_name, avatar_url)', { count: 'exact' })
      .eq('status', 'active');
    if (category) query = query.eq('category', category);
    if (minPrice) query = query.gte('price', minPrice);
    if (maxPrice) query = query.lte('price', maxPrice);
    if (aiModels && aiModels.length) query = query.contains('ai_models', aiModels);
    if (sort === 'newest') query = query.order('created_at', { ascending: false });
    else if (sort === 'popular') query = query.order('total_sales', { ascending: false });
    else if (sort === 'rating') query = query.order('rating_avg', { ascending: false });
    else if (sort === 'price_asc') query = query.order('price', { ascending: true });
    else if (sort === 'price_desc') query = query.order('price', { ascending: false });
    else query = query.order('created_at', { ascending: false });
    const pageNum = page || 1;
    const pageSize = limit || 20;
    const from = (pageNum - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    const { data, error, count } = await query;
    if (error) throw error;
    return { products: data || [], count: count || 0, pages: Math.ceil((count || 0) / pageSize) };
  } catch (err) {
    toast.error(err.message || 'Failed to load products');
    return { products: [], count: 0, pages: 0 };
  }
}

export async function getProductBySlug(slug) {
  try {
    const user = await getCurrentUser();
    let query = supabase
      .from('products')
      .select('*, profiles:profiles!products_seller_id_fkey(id, username, full_name, avatar_url)')
      .eq('slug', slug)
      .limit(1);
    if (user) {
      query = query.or(`status.eq.active,seller_id.eq.${user.id}`);
    } else {
      query = query.eq('status', 'active');
    }
    const { data, error } = await query.single();
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

export async function getFeaturedProducts(limit = 8) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, profiles:profiles!products_seller_id_fkey(id, username, full_name, avatar_url)')
      .eq('is_featured', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  } catch (err) {
    return [];
  }
}

export async function getProductsByCategory(category, limit = 12) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, profiles:profiles!products_seller_id_fkey(id, username, full_name, avatar_url)')
      .eq('category', category)
      .eq('status', 'active')
      .order('total_sales', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  } catch (err) {
    return [];
  }
}

export async function getSellerProducts(sellerId) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    toast.error(err.message || 'Failed to load products');
    return [];
  }
}

export async function createProduct(data) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const slug = slugify(data.title) + '-' + Math.random().toString(36).substr(2, 6);
    const { data: created, error } = await supabase.from('products').insert({
      ...data,
      seller_id: user.id,
      slug,
      status: 'pending'
    }).select('*').single();
    if (error) throw error;
    toast.success('Product created (pending approval)');
    return created;
  } catch (err) {
    toast.error(err.message || 'Create failed');
    return null;
  }
}

export async function updateProduct(id, data) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const { data: product, error: err1 } = await supabase.from('products').select('seller_id').eq('id', id).single();
    if (err1) throw err1;
    if (product.seller_id !== user.id) throw new Error('Not authorized');
    const { data: updated, error } = await supabase.from('products').update(data).eq('id', id).select('*').single();
    if (error) throw error;
    toast.success('Product updated');
    return updated;
  } catch (err) {
    toast.error(err.message || 'Update failed');
    return null;
  }
}

export async function deleteProduct(id) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const { data: product, error: err1 } = await supabase.from('products').select('seller_id').eq('id', id).single();
    if (err1) throw err1;
    if (product.seller_id !== user.id) throw new Error('Not authorized');
    const { error } = await supabase.from('products').update({ status: 'archived' }).eq('id', id);
    if (error) throw error;
    toast.success('Product archived');
    return true;
  } catch (err) {
    toast.error(err.message || 'Delete failed');
    return false;
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
    const user = await getCurrentUser();
    await supabase.from('analytics_events').insert([{
      product_id: productId,
      event_type: 'view',
      user_id: user ? user.id : null
    }]);
    await supabase.rpc('increment_view_count', { product_id: productId });
  } catch (err) {
    // Silent fail for analytics
  }
}

export async function getRelatedProducts(productId, category, limit = 4) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, profiles:profiles!products_seller_id_fkey(id, username, full_name, avatar_url)')
      .eq('category', category)
      .neq('id', productId)
      .eq('status', 'active')
      .order('rating_avg', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  } catch (err) {
    return [];
  }
}

export async function validateDiscount(code, sellerId) {
  try {
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code)
      .eq('seller_id', sellerId)
      .eq('is_active', true)
      .single();
    if (error) throw error;
    if (data.max_uses && data.used_count >= data.max_uses) throw new Error('Discount code expired');
    if (data.expires_at && new Date(data.expires_at) < new Date()) throw new Error('Discount code expired');
    return data;
  } catch (err) {
    toast.error(err.message || 'Invalid discount code');
    return null;
  }
}

export async function getCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;
    return data || [];
  } catch (err) {
    return [];
  }
}
