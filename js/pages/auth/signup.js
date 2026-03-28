import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../supabase/config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const firstNameInput = document.getElementById('first-name');
const lastNameInput = document.getElementById('last-name');
const usernameInput = document.getElementById('signup-username');
const emailInput = document.getElementById('signup-email');
const passwordInput = document.getElementById('signup-password');
const submitBtn = document.getElementById('signup-submit');
const errorMsg = document.getElementById('error-msg');
const toggleBtn = document.getElementById('toggle-pw');
const googleBtn = document.getElementById('google-btn');
const usernameStatus = document.getElementById('username-status');
const strengthFill = document.getElementById('strength-fill');
const strengthLabel = document.getElementById('strength-label');

let usernameAvailable = false;
let checkTimer = null;

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove('success');
  errorMsg.classList.add('show');
  errorMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showSuccess(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.add('success', 'show');
}

function clearError() {
  errorMsg.classList.remove('show', 'success');
}

function setLoading(loading) {
  submitBtn.disabled = loading;
  submitBtn.textContent = loading ? 'Creating account...' : 'Create account';
}

toggleBtn?.addEventListener('click', () => {
  const isPass = passwordInput.type === 'password';
  passwordInput.type = isPass ? 'text' : 'password';
  toggleBtn.textContent = isPass ? 'Hide' : 'Show';
});

passwordInput?.addEventListener('input', () => {
  const v = passwordInput.value;
  if (!v) {
    strengthFill.className = 'strength-fill';
    strengthLabel.textContent = '';
    return;
  }
  const hasUpper = /[A-Z]/.test(v);
  const hasNumber = /[0-9]/.test(v);
  const hasSymbol = /[^a-zA-Z0-9]/.test(v);
  const isLong = v.length >= 8;
  const score = [hasUpper, hasNumber, hasSymbol, isLong].filter(Boolean).length;

  if (score >= 4) {
    strengthFill.className = 'strength-fill strong';
    strengthLabel.textContent = 'Strong password';
    strengthLabel.style.color = '#22C55E';
  } else if (score >= 2) {
    strengthFill.className = 'strength-fill medium';
    strengthLabel.textContent = 'Medium — add uppercase, numbers or symbols';
    strengthLabel.style.color = '#F59E0B';
  } else {
    strengthFill.className = 'strength-fill weak';
    strengthLabel.textContent = 'Weak — password too simple';
    strengthLabel.style.color = '#EF4444';
  }
});

usernameInput?.addEventListener('input', () => {
  const val = usernameInput.value.trim().toLowerCase();
  usernameAvailable = false;

  if (!val) {
    usernameStatus.textContent = '';
    usernameStatus.className = 'username-status';
    return;
  }

  if (!/^[a-z0-9_]{3,30}$/.test(val)) {
    usernameStatus.textContent = '✗ Invalid format';
    usernameStatus.className = 'username-status taken';
    return;
  }

  usernameStatus.textContent = 'Checking...';
  usernameStatus.className = 'username-status checking';

  clearTimeout(checkTimer);
  checkTimer = setTimeout(async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', val)
        .single();

      if (data) {
        usernameStatus.textContent = '✗ Taken';
        usernameStatus.className = 'username-status taken';
        usernameAvailable = false;
      } else {
        usernameStatus.textContent = '✓ Available';
        usernameStatus.className = 'username-status available';
        usernameAvailable = true;
      }
    } catch {
      usernameStatus.textContent = '✓ Available';
      usernameStatus.className = 'username-status available';
      usernameAvailable = true;
    }
  }, 500);
});

firstNameInput?.addEventListener('input', () => {
  if (usernameInput.value) return;
  const first = firstNameInput.value.trim().toLowerCase();
  const last = lastNameInput?.value.trim().toLowerCase() || '';
  if (first) {
    usernameInput.value = (first + last).replace(/[^a-z0-9]/g, '');
    usernameInput.dispatchEvent(new Event('input'));
  }
});

[emailInput, passwordInput, usernameInput].forEach(el => {
  el?.addEventListener('input', clearError);
});

function validate() {
  const firstName = firstNameInput?.value.trim();
  const username = usernameInput?.value.trim();
  const email = emailInput?.value.trim();
  const password = passwordInput?.value;

  if (!firstName) { showError('Please enter your first name'); firstNameInput?.focus(); return false; }
  if (!username || username.length < 3) { showError('Username must be at least 3 characters'); usernameInput?.focus(); return false; }
  if (!/^[a-z0-9_]{3,30}$/.test(username)) { showError('Username can only contain letters, numbers and underscores'); usernameInput?.focus(); return false; }
  if (!usernameAvailable) { showError('Please choose an available username'); usernameInput?.focus(); return false; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('Please enter a valid email address'); emailInput?.focus(); return false; }
  if (!password || password.length < 8) { showError('Password must be at least 8 characters'); passwordInput?.focus(); return false; }
  return true;
}

submitBtn?.addEventListener('click', async () => {
  clearError();
  if (!validate()) return;

  const firstName = firstNameInput.value.trim();
  const lastName = lastNameInput?.value.trim() || '';
  const username = usernameInput.value.trim().toLowerCase();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const displayName = [firstName, lastName].filter(Boolean).join(' ');

  setLoading(true);

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, full_name: displayName, first_name: firstName, last_name: lastName }
      }
    });

    if (error) throw error;

    if (data.user && !data.session) {
      submitBtn.textContent = '✓ Check your email!';
      submitBtn.style.background = '#22C55E';
      setLoading(false);
      showSuccess('We sent a confirmation to ' + email + '. Click the link to activate your account.');
      return;
    }

    if (data.session) {
      window.location.href = '/pages/buyer/dashboard.html';
    }

  } catch (err) {
    const messages = {
      'User already registered': 'An account with this email already exists. Try signing in.',
      'Password should be at least 6 characters': 'Password must be at least 8 characters.',
      'Unable to validate email address': 'Please enter a valid email address.'
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
    options: { redirectTo: window.location.origin + '/pages/buyer/dashboard.html' }
  });

  if (error) {
    googleBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> Continue with Google';
    googleBtn.disabled = false;
    showError('Google sign up failed. Try email instead.');
  }
});

async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) window.location.href = '/pages/buyer/dashboard.html';
}

document.addEventListener('DOMContentLoaded', checkAuth);
