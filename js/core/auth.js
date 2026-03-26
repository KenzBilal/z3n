// Authentication logic for Z3n Marketplace
import supabase, { auth } from './supabase.js';
import store from './store.js';
import toast from '../components/toast.js';

export async function signUp(email, password, username, displayName) {
  try {
    const { user, error } = await auth.signUp({
      email,
      password,
      options: {
        data: { username, display_name: displayName }
      }
    });
    if (error) throw error;
    return user;
  } catch (err) {
    toast.error(err.message || 'Signup failed');
    return null;
  }
}

export async function signIn(email, password) {
  try {
    const { user, error } = await auth.signInWithPassword({ email, password });
    if (error) throw error;
    return user;
  } catch (err) {
    toast.error(err.message || 'Login failed');
    return null;
  }
}

export async function signInWithGoogle() {
  try {
    const { error } = await auth.signInWithOAuth({ provider: 'google' });
    if (error) throw error;
  } catch (err) {
    toast.error(err.message || 'Google sign-in failed');
  }
}

export async function signOut() {
  try {
    const { error } = await auth.signOut();
    if (error) throw error;
    store.setState('user', null);
    store.setState('profile', null);
  } catch (err) {
    toast.error(err.message || 'Sign out failed');
  }
}

export function getCurrentUser() {
  return auth.getUser().then(({ data }) => data.user || null);
}

export async function getCurrentProfile() {
  try {
    const user = await getCurrentUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    toast.error(err.message || 'Failed to load profile');
    return null;
  }
}

export function onAuthStateChange(callback) {
  return auth.onAuthStateChange(callback);
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) window.location.href = '/src/pages/auth/login.html';
}

export async function requireSeller() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'seller') {
    window.location.href = '/src/pages/marketplace.html';
  }
}

export async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
    window.location.href = '/src/pages/marketplace.html';
  }
}

export async function updateProfile(data) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id);
    if (error) throw error;
    toast.success('Profile updated');
  } catch (err) {
    toast.error(err.message || 'Profile update failed');
  }
}
