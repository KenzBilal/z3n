// Storage API calls for Z3n Marketplace
import supabase from '../core/supabase.js';
import toast from '../components/toast.js';

export async function uploadProductFile(file, productId) {
  try {
    const { error } = await supabase.storage.from('private').upload(`products/${productId}/${file.name}`, file);
    if (error) throw error;
    toast.success('File uploaded');
  } catch (err) {
    toast.error(err.message || 'Upload failed');
  }
}

export async function uploadThumbnail(file, productId) {
  try {
    const { error } = await supabase.storage.from('public').upload(`thumbnails/${productId}/${file.name}`, file);
    if (error) throw error;
    toast.success('Thumbnail uploaded');
  } catch (err) {
    toast.error(err.message || 'Upload failed');
  }
}

export async function uploadAvatar(file, userId) {
  try {
    const { error } = await supabase.storage.from('public').upload(`avatars/${userId}/${file.name}`, file);
    if (error) throw error;
    toast.success('Avatar uploaded');
  } catch (err) {
    toast.error(err.message || 'Upload failed');
  }
}

export async function getProductFileUrl(path) {
  try {
    const { data, error } = await supabase.storage.from('private').createSignedUrl(path, 3600);
    if (error) throw error;
    return data.signedUrl;
  } catch (err) {
    toast.error(err.message || 'Failed to get file URL');
    return null;
  }
}

export async function deleteFile(path, bucket) {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
    toast.success('File deleted');
  } catch (err) {
    toast.error(err.message || 'Delete failed');
  }
}
