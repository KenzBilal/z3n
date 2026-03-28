import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../supabase/config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const emailInput = document.getElementById('login-email');
const passwordInput = document.getElementById('login-password');
const submitBtn = document.getElementById('login-submit');
const errorMsg = document.getElementById('error-msg');
const toggleBtn = document.getElementById('toggle-pw');
const googleBtn = document.getElementById('google-btn');

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.add('show');
  emailInput.classList.add('field-error');
  passwordInput.classList.add('field-error');
}

function clearError() {
  errorMsg.classList.remove('show');
  emailInput.classList.remove('field-error');
  passwordInput.classList.remove('field-error');
}

function setLoading(loading) {
  submitBtn.disabled = loading;
  submitBtn.textContent = loading ? 'Signing in...' : 'Sign in';
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Show/Hide password
let pwVisible = false;
toggleBtn?.addEventListener('click', () => {
  pwVisible = !pwVisible;
  passwordInput.type = pwVisible ? 'text' : 'password';
  toggleBtn.textContent = pwVisible ? 'Hide' : 'Show';
});

// Clear errors on input
[emailInput, passwordInput].forEach(input => {
  input?.addEventListener('input', () => {
    clearError();
    input.classList.remove('field-error');
  });
});

// Trim email on blur
emailInput?.addEventListener('blur', () => {
  emailInput.value = emailInput.value.trim();
});

// Login submit
submitBtn?.addEventListener('click', async () => {
  const email = emailInput?.value.trim();
  const password = passwordInput?.value;

  clearError();

  if (!email) {
    showError('Please enter your email address');
    emailInput?.classList.add('field-error');
    emailInput?.focus();
    return;
  }

  if (!validateEmail(email)) {
    showError('Please enter a valid email address');
    emailInput?.classList.add('field-error');
    emailInput?.focus();
    return;
  }

  if (!password) {
    showError('Please enter your password');
    passwordInput?.classList.add('field-error');
    passwordInput?.focus();
    return;
  }

  if (password.length < 8) {
    showError('Password must be at least 8 characters');
    passwordInput?.classList.add('field-error');
    passwordInput?.focus();
    return;
  }

  setLoading(true);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const intended = sessionStorage.getItem('intended_url');
    sessionStorage.removeItem('intended_url');

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (intended) {
      window.location.href = intended;
    } else if (profile?.role === 'admin') {
      window.location.href = '/pages/admin/dashboard.html';
    } else if (profile?.role === 'seller') {
      window.location.href = '/pages/seller/dashboard.html';
    } else {
      window.location.href = '/pages/buyer/dashboard.html';
    }

  } catch (err) {
    const messages = {
      'Invalid login credentials': 'Invalid email or password. Please try again.',
      'Email not confirmed': 'Please verify your email before signing in.',
      'Too many requests': 'Too many attempts. Please wait a moment before trying again.',
      'User not found': 'No account found with this email. Please sign up first.',
      'Network request failed': 'Network error. Please check your connection.'
    };
    showError(messages[err.message] || 'Something went wrong. Please try again.');
    setLoading(false);
  }
});

// Enter key
emailInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') passwordInput?.focus(); });
passwordInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitBtn?.click(); });

// Google OAuth
googleBtn?.addEventListener('click', async () => {
  googleBtn.innerHTML = 'Redirecting to Google...';
  googleBtn.disabled = true;

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/pages/buyer/dashboard.html' }
    });
    if (error) throw error;
  } catch (err) {
    googleBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> Continue with Google';
    googleBtn.disabled = false;
    showError('Google sign in failed. Please try again or use email.');
  }
});

// Load stats
async function loadStats() {
  try {
    const [{ count: products }, { count: sellers }] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'seller')
    ]);
    const el1 = document.getElementById('stat-products');
    const el2 = document.getElementById('stat-sellers');
    if (el1) el1.textContent = products > 999 ? (products / 1000).toFixed(1) + 'k' : String(products || '0');
    if (el2) el2.textContent = sellers > 999 ? (sellers / 1000).toFixed(1) + 'k' : String(sellers || '0');
  } catch {}
}

// Check if already logged in
async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) window.location.href = '/pages/buyer/dashboard.html';
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadStats();
  emailInput?.focus();
});
