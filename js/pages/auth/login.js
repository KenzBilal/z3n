// Login page logic for Z3n Marketplace
import { signIn, signInWithGoogle } from '../../core/auth.js';
import supabase from '../../core/supabase.js';

async function handleLogin(e) {
  e.preventDefault();
  // Handle login form submit
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const submitBtn = document.getElementById('login-submit');
  const errorMsg = document.getElementById('login-error');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';
      if (errorMsg) errorMsg.textContent = '';
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailInput.value.trim(),
          password: passwordInput.value
        });
        if (error) throw error;
        const intended = sessionStorage.getItem('intended_url');
        sessionStorage.removeItem('intended_url');
        window.location.href = intended || '/pages/buyer/dashboard.html';
      } catch (err) {
        if (errorMsg) errorMsg.textContent = err.message;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }
    });
  }
  const googleBtn = document.getElementById('login-google');
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://z3n.vercel.app/pages/buyer/dashboard.html'
        }
      });
    });
  }
});
