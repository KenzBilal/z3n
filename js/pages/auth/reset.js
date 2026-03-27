// Password reset page logic for Z3n Marketplace
import { auth } from '../../core/supabase.js';
import toast from '../../components/toast.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('reset-form');
  if (!form) return;

  form.innerHTML = `
    <h2>Reset Password</h2>
    <div>
      <label for="reset-email">Email</label>
      <input type="email" id="reset-email" required autocomplete="email">
    </div>
    <button type="submit" id="reset-submit">Send Reset Link</button>
    <div id="reset-error" style="color:red;"></div>
    <div id="reset-success" style="color:green;"></div>
  `;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('reset-email').value.trim();
    const submitBtn = document.getElementById('reset-submit');
    const errorDiv = document.getElementById('reset-error');
    const successDiv = document.getElementById('reset-success');

    errorDiv.textContent = '';
    successDiv.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      const { error } = await auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/pages/auth/reset.html'
      });
      if (error) throw error;
      successDiv.textContent = 'Check your email for a reset link.';
      toast.success('Reset email sent');
    } catch (err) {
      errorDiv.textContent = err.message || 'Failed to send reset email';
      toast.error(err.message || 'Failed to send reset email');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Reset Link';
    }
  });
});
