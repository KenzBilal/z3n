// User/profile API calls for Z3n Marketplace
import supabase from '../core/supabase.js';
import toast from '../components/toast.js';

export async function getProfile(userId) {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;
    return data;
  } catch (err) {
    toast.error(err.message || 'Failed to load profile');
    return null;
  }
}

export async function getProfileByUsername(username) {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('username', username).single();
    if (error) throw error;
    return data;
  } catch (err) {
    toast.error(err.message || 'Failed to load user');
    return null;
  }
}

export async function updateProfile(data) {
  try {
    const { error } = await supabase.from('profiles').update(data).eq('id', data.id);
    if (error) throw error;
    toast.success('Profile updated');
  } catch (err) {
    toast.error(err.message || 'Update failed');
  }
}

export async function getSellerStorefront(username) {
  try {
    const { data: profile, error: err1 } = await supabase.from('profiles').select('*').eq('username', username).single();
    if (err1) throw err1;
    const { data: products, error: err2 } = await supabase.from('products').select('*').eq('seller_id', profile.id).eq('status', 'active');
    if (err2) throw err2;
    return { profile, products };
  } catch (err) {
    toast.error(err.message || 'Failed to load storefront');
    return null;
  }
}

export async function becomesSeller(userId) {
  try {
    const { error } = await supabase.from('profiles').update({ role: 'seller' }).eq('id', userId);
    if (error) throw error;
    toast.success('You are now a seller!');
  } catch (err) {
    toast.error(err.message || 'Failed to become seller');
  }
}
