// Review API calls for Z3n Marketplace
import supabase from '../core/supabase.js';
import toast from '../components/toast.js';

export async function getProductReviews(productId) {
  try {
    const { data, error } = await supabase.from('reviews').select('*').eq('product_id', productId);
    if (error) throw error;
    return data;
  } catch (err) {
    toast.error(err.message || 'Failed to load reviews');
    return [];
  }
}

export async function createReview(productId, orderId, rating, title, body) {
  try {
    const { error } = await supabase.from('reviews').insert([{ product_id: productId, order_id: orderId, rating, title, body }]);
    if (error) throw error;
    toast.success('Review submitted');
  } catch (err) {
    toast.error(err.message || 'Review failed');
  }
}

export async function updateReview(reviewId, data) {
  try {
    const { error } = await supabase.from('reviews').update(data).eq('id', reviewId);
    if (error) throw error;
    toast.success('Review updated');
  } catch (err) {
    toast.error(err.message || 'Update failed');
  }
}

export async function addSellerReply(reviewId, reply) {
  try {
    const { error } = await supabase.from('reviews').update({ seller_reply: reply }).eq('id', reviewId);
    if (error) throw error;
    toast.success('Reply added');
  } catch (err) {
    toast.error(err.message || 'Reply failed');
  }
}

export async function markReviewHelpful(reviewId) {
  try {
    const { error } = await supabase.from('reviews').update({ helpful: true }).eq('id', reviewId);
    if (error) throw error;
    toast.success('Marked as helpful');
  } catch (err) {
    toast.error(err.message || 'Failed to mark helpful');
  }
}
