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

toggleBtn?.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  toggleBtn.textContent = isPassword ? 'Hide' : 'Show';
});

[emailInput, passwordInput].forEach(input => {
  input?.addEventListener('input', clearError);
});

submitBtn?.addEventListener('click', async () => {
  const email = emailInput?.value.trim();
  const password = passwordInput?.value;

  clearError();

  if (!email) {
    showError('Please enter your email address');
    emailInput?.focus();
    return;
  }

  if (!password) {
    showError('Please enter your password');
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
      'Too many requests': 'Too many attempts. Please wait a moment.'
    };
    showError(messages[err.message] || err.message);
    setLoading(false);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') submitBtn?.click();
});

googleBtn?.addEventListener('click', async () => {
  googleBtn.textContent = 'Redirecting to Google...';
  googleBtn.disabled = true;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/pages/buyer/dashboard.html'
    }
  });

  if (error) {
    googleBtn.textContent = 'Continue with Google';
    googleBtn.disabled = false;
    showError('Google sign in failed. Try email instead.');
  }
});

async function loadStats() {
  try {
    const [{ count: products }, { count: sellers }] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'seller')
    ]);

    const statProducts = document.getElementById('stat-products');
    const statSellers = document.getElementById('stat-sellers');

    if (statProducts) statProducts.textContent = products > 999 ? (products / 1000).toFixed(1) + 'k' : String(products || '0');
    if (statSellers) statSellers.textContent = sellers > 999 ? (sellers / 1000).toFixed(1) + 'k' : String(sellers || '0');
  } catch {}
}

async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) window.location.href = '/pages/buyer/dashboard.html';
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadStats();
});
