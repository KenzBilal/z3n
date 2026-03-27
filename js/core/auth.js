// Authentication logic for Z3n Marketplace
import supabase, { auth } from './supabase.js';
import store from './store.js';
import toast from '../components/toast.js';

export async function signUp(email, password, username, displayName) {
  try {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    if (existing) throw new Error('Username already taken');
    const { data, error } = await auth.signUp({
      email,
      password,
      options: {
        data: { username, full_name: displayName || username }
      }
    });
    if (error) throw error;
    toast.success('Signup successful!');
    window.location.href = '/pages/buyer/dashboard.html';
    return data.user;
  } catch (err) {
    toast.error(err.message || 'Signup failed');
    return null;
  }
}

export async function signIn(email, password) {
  try {
    const { data, error } = await auth.signInWithPassword({ email, password });
    if (error) throw error;
    toast.success('Login successful!');
    const intended = sessionStorage.getItem('z3n_intended_url');
    sessionStorage.removeItem('z3n_intended_url');
    window.location.href = intended || '/pages/buyer/dashboard.html';
    return data.user;
  } catch (err) {
    toast.error(err.message || 'Login failed');
    return null;
  }
}

export async function signInWithGoogle() {
  try {
    const { error } = await auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/pages/buyer/dashboard.html'
      }
    });
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
    toast.success('Signed out');
    window.location.href = '/pages/index.html';
  } catch (err) {
    toast.error(err.message || 'Sign out failed');
  }
}

export async function getCurrentUser() {
  const { data } = await auth.getUser();
  return data.user || null;
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
    return null;
  }
}

export function onAuthStateChange(callback) {
  return auth.onAuthStateChange(callback);
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    sessionStorage.setItem('z3n_intended_url', window.location.pathname + window.location.search);
    window.location.href = '/pages/auth/login.html';
  }
}

export async function requireSeller() {
  await requireAuth();
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== 'seller' && profile.role !== 'admin')) {
    window.location.href = '/pages/buyer/dashboard.html';
  }
}

export async function requireAdmin() {
  await requireAuth();
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
    window.location.href = '/pages/index.html';
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
