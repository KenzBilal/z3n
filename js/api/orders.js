// Order API calls for Z3n Marketplace
import supabase from '../core/supabase.js';
import toast from '../components/toast.js';

export async function createOrder(productId, amount, affiliateCode) {
  try {
    const { error } = await supabase.from('orders').insert([{ product_id: productId, amount, affiliate_code: affiliateCode }]);
    if (error) throw error;
    toast.success('Order created');
  } catch (err) {
    toast.error(err.message || 'Order failed');
  }
}

export async function getOrder(orderId) {
  try {
    const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (error) throw error;
    return data;
  } catch (err) {
    toast.error(err.message || 'Failed to load order');
    return null;
  }
}

export async function getBuyerOrders(buyerId) {
  try {
    const { data, error } = await supabase.from('orders').select('*').eq('buyer_id', buyerId);
    if (error) throw error;
    return data;
  } catch (err) {
    toast.error(err.message || 'Failed to load orders');
    return [];
  }
}

export async function getSellerOrders(sellerId) {
  try {
    const { data, error } = await supabase.from('orders').select('*').eq('seller_id', sellerId);
    if (error) throw error;
    return data;
  } catch (err) {
    toast.error(err.message || 'Failed to load orders');
    return [];
  }
}

export async function processOrderDelivery(orderId) {
  try {
    const { data, error } = await supabase.functions.invoke('process-purchase', { body: { orderId } });
    if (error) throw error;
    return data;
  } catch (err) {
    toast.error(err.message || 'Delivery failed');
    return null;
  }
}

export async function requestRefund(orderId, reason) {
  try {
    const { error } = await supabase.from('refunds').insert([{ order_id: orderId, reason }]);
    if (error) throw error;
    toast.success('Refund requested');
  } catch (err) {
    toast.error(err.message || 'Refund failed');
  }
}
