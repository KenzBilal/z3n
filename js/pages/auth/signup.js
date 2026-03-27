// Signup page logic for Z3n Marketplace

import { debounce } from '../../core/utils.js';
import toast from '../../components/toast.js';
import supabase, { auth } from '../../core/supabase.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signup-form');
  const usernameInput = document.getElementById('signup-username');
  const emailInput = document.getElementById('signup-email');
  const passwordInput = document.getElementById('signup-password');
  const submitBtn = document.getElementById('signup-submit');
  const googleBtn = document.getElementById('signup-google');
  const errorDiv = document.getElementById('signup-error');
  const usernameStatus = document.getElementById('username-status');

  let usernameAvailable = false;

  // Debounced username check
  const checkUsername = debounce(async () => {
    const username = usernameInput.value.trim();
    usernameStatus.textContent = '';
    usernameAvailable = false;
    if (!username) return;
    usernameStatus.textContent = 'Checking...';
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    if (existing) {
      usernameStatus.textContent = '❌ Taken';
      usernameAvailable = false;
    } else {
      usernameStatus.textContent = '✅ Available';
      usernameAvailable = true;
    }
  }, 400);

  usernameInput.addEventListener('input', checkUsername);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing up...';

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Re-check username before submit
    usernameStatus.textContent = 'Checking...';
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    if (existing) {
      usernameStatus.textContent = '❌ Taken';
      errorDiv.textContent = 'Username already taken.';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign Up';
      return;
    }

    try {
      const { data, error } = await auth.signUp({
        email,
        password,
        options: {
          data: { username }
        }
      });
      if (error) throw error;
      toast.success('Signup successful!');
      window.location.href = '/pages/buyer/dashboard.html';
    } catch (err) {
      errorDiv.textContent = err.message || 'Signup failed.';
      toast.error(err.message || 'Signup failed.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign Up';
    }
  });

  googleBtn.addEventListener('click', async () => {
    try {
      const { error } = await auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/pages/buyer/dashboard.html'
        }
      });
      if (error) throw error;
    } catch (err) {
      errorDiv.textContent = err.message || 'Google signup failed.';
      toast.error(err.message || 'Google signup failed.');
    }
  });
});
