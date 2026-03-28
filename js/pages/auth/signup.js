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
let pwVisible = false;

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

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateUsername(username) {
  return /^[a-z0-9_]{3,30}$/.test(username);
}

// Password show/hide
toggleBtn?.addEventListener('click', () => {
  pwVisible = !pwVisible;
  passwordInput.type = pwVisible ? 'text' : 'password';
  toggleBtn.textContent = pwVisible ? 'Hide' : 'Show';
});

// Password strength
passwordInput?.addEventListener('input', () => {
  const v = passwordInput.value;
  passwordInput.classList.remove('field-error');

  if (!v) {
    strengthFill.className = 'strength-fill';
    strengthLabel.textContent = '';
    strengthLabel.style.color = '#4A4A4A';
    return;
  }

  const hasUpper = /[A-Z]/.test(v);
  const hasLower = /[a-z]/.test(v);
  const hasNumber = /[0-9]/.test(v);
  const hasSymbol = /[^a-zA-Z0-9]/.test(v);
  const isLong = v.length >= 8;
  const isVeryLong = v.length >= 12;

  let score = 0;
  if (isLong) score++;
  if (hasUpper) score++;
  if (hasLower) score++;
  if (hasNumber) score++;
  if (hasSymbol) score++;
  if (isVeryLong) score++;

  if (score >= 5) {
    strengthFill.className = 'strength-fill strong';
    strengthLabel.textContent = 'Strong password';
    strengthLabel.style.color = '#22C55E';
  } else if (score >= 3) {
    strengthFill.className = 'strength-fill medium';
    if (!hasUpper) strengthLabel.textContent = 'Add an uppercase letter';
    else if (!hasNumber) strengthLabel.textContent = 'Add a number';
    else if (!hasSymbol) strengthLabel.textContent = 'Add a symbol (!@#$%)';
    else strengthLabel.textContent = 'Medium — make it longer';
    strengthLabel.style.color = '#F59E0B';
  } else {
    strengthFill.className = 'strength-fill weak';
    if (!isLong) strengthLabel.textContent = 'At least 8 characters required';
    else strengthLabel.textContent = 'Too simple — add variety';
    strengthLabel.style.color = '#EF4444';
  }
});

// Username availability check
usernameInput?.addEventListener('input', () => {
  let val = usernameInput.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  usernameInput.value = val;
  usernameAvailable = false;

  if (!val) {
    usernameStatus.textContent = '';
    usernameStatus.className = 'username-status';
    return;
  }

  if (val.length < 3) {
    usernameStatus.textContent = '✗ Min 3 characters';
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
        .maybeSingle();

      if (data) {
        usernameStatus.textContent = '✗ Already taken';
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
  }, 400);
});

// Auto username from name
firstNameInput?.addEventListener('input', () => {
  const first = firstNameInput.value.trim().toLowerCase().replace(/[^a-z]/g, '');
  const last = lastNameInput?.value.trim().toLowerCase().replace(/[^a-z]/g, '') || '';
  if (first) {
    usernameInput.value = (first + last).substring(0, 20);
    usernameInput.dispatchEvent(new Event('input'));
  }
});

lastNameInput?.addEventListener('input', () => {
  const first = firstNameInput?.value.trim().toLowerCase().replace(/[^a-z]/g, '') || '';
  const last = lastNameInput.value.trim().toLowerCase().replace(/[^a-z]/g, '');
  if (first && last) {
    usernameInput.value = (first + last).substring(0, 20);
    usernameInput.dispatchEvent(new Event('input'));
  }
});

// Clear errors on input
[firstNameInput, emailInput, usernameInput].forEach(el => {
  el?.addEventListener('input', () => {
    clearError();
    el.classList.remove('field-error');
  });
});

// Trim on blur
emailInput?.addEventListener('blur', () => { emailInput.value = emailInput.value.trim(); });
firstNameInput?.addEventListener('blur', () => { firstNameInput.value = firstNameInput.value.trim(); });

function validate() {
  const firstName = firstNameInput?.value.trim();
  const username = usernameInput?.value.trim();
  const email = emailInput?.value.trim();
  const password = passwordInput?.value;

  if (!firstName || firstName.length < 2) {
    showError('Please enter your first name');
    firstNameInput?.classList.add('field-error');
    firstNameInput?.focus();
    return false;
  }

  if (!username || username.length < 3) {
    showError('Username must be at least 3 characters');
    usernameInput?.classList.add('field-error');
    usernameInput?.focus();
    return false;
  }

  if (!validateUsername(username)) {
    showError('Username: letters, numbers, underscores only');
    usernameInput?.classList.add('field-error');
    usernameInput?.focus();
    return false;
  }

  if (!usernameAvailable) {
    showError('Please choose an available username');
    usernameInput?.classList.add('field-error');
    usernameInput?.focus();
    return false;
  }

  if (!email) {
    showError('Please enter your email address');
    emailInput?.classList.add('field-error');
    emailInput?.focus();
    return false;
  }

  if (!validateEmail(email)) {
    showError('Please enter a valid email address');
    emailInput?.classList.add('field-error');
    emailInput?.focus();
    return false;
  }

  if (!password || password.length < 8) {
    showError('Password must be at least 8 characters');
    passwordInput?.classList.add('field-error');
    passwordInput?.focus();
    return false;
  }

  return true;
}

// Sign up
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
      submitBtn.style.cursor = 'default';
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
      'Unable to validate email address': 'Please enter a valid email address.',
      'Signup is disabled': 'Signups are temporarily disabled.',
      'Network request failed': 'Network error. Please check your connection.'
    };
    showError(messages[err.message] || 'Something went wrong. Please try again.');
    setLoading(false);
  }
});

// Enter key navigation
firstNameInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') lastNameInput?.focus(); });
lastNameInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') usernameInput?.focus(); });
usernameInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') emailInput?.focus(); });
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
    showError('Google sign up failed. Please try again or use email.');
  }
});

// Check if logged in
async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) window.location.href = '/pages/buyer/dashboard.html';
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  firstNameInput?.focus();
});
