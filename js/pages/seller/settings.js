// Seller settings page logic for Z3n Marketplace
import supabase from '../../core/supabase.js';
import { requireSeller, getCurrentUser, getCurrentProfile } from '../../core/auth.js';
import toast from '../../components/toast.js';

async function loadSellerSettings() {
  await requireSeller();

  const main = document.getElementById('seller-settings-main');
  if (!main) return;

  main.innerHTML = '<div class="loading-skeleton">Loading settings...</div>';

  try {
    const user = await getCurrentUser();
    const profile = await getCurrentProfile();

    main.innerHTML = `
      <div class="page-header"><h1>Seller Settings</h1></div>
      <form id="seller-settings-form">
        <div class="form-group">
          <label for="settings-display-name">Display Name</label>
          <input type="text" id="settings-display-name" value="${profile?.display_name || ''}">
        </div>
        <div class="form-group">
          <label for="settings-bio">Bio</label>
          <textarea id="settings-bio">${profile?.bio || ''}</textarea>
        </div>
        <div class="form-group">
          <label for="settings-website">Website</label>
          <input type="url" id="settings-website" value="${profile?.website || ''}">
        </div>
        <div class="form-group">
          <label for="settings-twitter">Twitter</label>
          <input type="text" id="settings-twitter" value="${profile?.twitter || ''}">
        </div>
        <div class="form-group">
          <label for="settings-payout-email">Payout Email</label>
          <input type="email" id="settings-payout-email" value="${profile?.payout_email || ''}">
        </div>
        <button type="submit" id="settings-submit" class="btn-primary">Save Settings</button>
      </form>
    `;

    document.getElementById('seller-settings-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('settings-submit');
      btn.disabled = true;
      btn.textContent = 'Saving...';

      try {
        const { error } = await supabase.from('profiles').update({
          display_name: document.getElementById('settings-display-name').value.trim(),
          bio: document.getElementById('settings-bio').value.trim(),
          website: document.getElementById('settings-website').value.trim(),
          twitter: document.getElementById('settings-twitter').value.trim(),
          payout_email: document.getElementById('settings-payout-email').value.trim()
        }).eq('id', user.id);

        if (error) throw error;
        toast.success('Settings saved');
      } catch (err) {
        toast.error(err.message || 'Failed to save settings');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Save Settings';
      }
    });
  } catch (err) {
    main.innerHTML = '<p class="error-state">Failed to load settings</p>';
    toast.error('Failed to load settings');
  }
}

document.addEventListener('DOMContentLoaded', loadSellerSettings);
