import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../supabase/config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const emailInput = document.getElementById('reset-email');
const submitBtn = document.getElementById('reset-submit');
const errorDiv = document.getElementById('reset-error');
const successDiv = document.getElementById('reset-success');
const formSection = document.getElementById('reset-form-section');

submitBtn?.addEventListener('click', async () => {
  const email = emailInput?.value.trim();

  errorDiv.classList.remove('show');

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errorDiv.textContent = 'Please enter a valid email address';
    errorDiv.classList.add('show');
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
    errorDiv.textContent = err.message || 'Failed to send reset email. Please try again.';
    errorDiv.classList.add('show');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send reset link';
  }
});

emailInput?.addEventListener('input', () => {
  errorDiv.classList.remove('show');
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') submitBtn?.click();
});
