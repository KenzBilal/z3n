import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../supabase/config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const emailInput = document.getElementById('reset-email');
const submitBtn = document.getElementById('reset-submit');
const errorDiv = document.getElementById('reset-error');
const successDiv = document.getElementById('reset-success');
const formSection = document.getElementById('reset-form-section');

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Trim on blur
emailInput?.addEventListener('blur', () => {
  emailInput.value = emailInput.value.trim();
});

// Clear error on input
emailInput?.addEventListener('input', () => {
  errorDiv.classList.remove('show');
  emailInput.classList.remove('field-error');
});

// Enter key
emailInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') submitBtn?.click();
});

// Submit
submitBtn?.addEventListener('click', async () => {
  const email = emailInput?.value.trim();

  errorDiv.classList.remove('show');
  emailInput.classList.remove('field-error');

  if (!email) {
    errorDiv.textContent = 'Please enter your email address';
    errorDiv.classList.add('show');
    emailInput?.classList.add('field-error');
    emailInput?.focus();
    return;
  }

  if (!validateEmail(email)) {
    errorDiv.textContent = 'Please enter a valid email address';
    errorDiv.classList.add('show');
    emailInput?.classList.add('field-error');
    emailInput?.focus();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/pages/auth/reset.html'
    });

    if (error) throw error;

    formSection.style.display = 'none';
    successDiv.classList.add('show');

  } catch (err) {
    const messages = {
      'User not found': 'No account found with this email.',
      'For security purposes, you can only request this once every 60 seconds': 'Please wait 60 seconds before trying again.',
      'Network request failed': 'Network error. Please check your connection.'
    };
    errorDiv.textContent = messages[err.message] || 'Failed to send reset email. Please try again.';
    errorDiv.classList.add('show');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send reset link';
  }
});

// Focus email on load
document.addEventListener('DOMContentLoaded', () => {
  emailInput?.focus();
});
