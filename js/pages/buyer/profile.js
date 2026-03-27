// Buyer profile page logic for Z3n Marketplace
import supabase from '../../core/supabase.js';
import { requireAuth, getCurrentUser, getCurrentProfile, updateProfile } from '../../core/auth.js';
import toast from '../../components/toast.js';

async function loadProfile() {
  await requireAuth();

  const main = document.getElementById('profile-main');
  if (!main) return;

  main.innerHTML = '<div class="loading-skeleton">Loading profile...</div>';

  try {
    const user = await getCurrentUser();
    const profile = await getCurrentProfile();

    main.innerHTML = `
      <div class="page-header"><h1>My Profile</h1></div>
      <form id="profile-form" class="profile-form">
        <div class="form-group">
          <label for="profile-avatar">Avatar</label>
          ${profile?.avatar_url ? `<img src="${profile.avatar_url}" alt="Avatar" class="current-avatar">` : ''}
          <input type="file" id="profile-avatar" accept="image/*">
        </div>
        <div class="form-group">
          <label for="profile-display-name">Display Name</label>
          <input type="text" id="profile-display-name" value="${profile?.display_name || ''}">
        </div>
        <div class="form-group">
          <label for="profile-username">Username</label>
          <input type="text" id="profile-username" value="${profile?.username || ''}" disabled>
        </div>
        <div class="form-group">
          <label for="profile-bio">Bio</label>
          <textarea id="profile-bio">${profile?.bio || ''}</textarea>
        </div>
        <div class="form-group">
          <label for="profile-website">Website</label>
          <input type="url" id="profile-website" value="${profile?.website || ''}">
        </div>
        <div class="form-group">
          <label for="profile-twitter">Twitter</label>
          <input type="text" id="profile-twitter" value="${profile?.twitter || ''}">
        </div>
        <button type="submit" id="profile-submit" class="btn-primary">Save Changes</button>
      </form>
      ${profile?.role !== 'seller' ? `
        <div class="become-seller-section">
          <h2>Become a Seller</h2>
          <p>Start selling your products on Z3N</p>
          <button id="become-seller-btn" class="btn-secondary">Become a Seller</button>
        </div>
      ` : ''}
    `;

    document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('profile-submit');
      btn.disabled = true;
      btn.textContent = 'Saving...';

      try {
        const avatarFile = document.getElementById('profile-avatar').files[0];
        let avatarUrl = profile?.avatar_url;

        if (avatarFile) {
          const ext = avatarFile.name.split('.').pop();
          const path = `${user.id}/${Date.now()}.${ext}`;
          const { error: uploadError } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true });
          if (uploadError) throw uploadError;
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
          avatarUrl = urlData.publicUrl;
        }

        await updateProfile({
          display_name: document.getElementById('profile-display-name').value.trim(),
          bio: document.getElementById('profile-bio').value.trim(),
          website: document.getElementById('profile-website').value.trim(),
          twitter: document.getElementById('profile-twitter').value.trim(),
          avatar_url: avatarUrl
        });
        toast.success('Profile updated');
      } catch (err) {
        toast.error(err.message || 'Failed to update profile');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Save Changes';
      }
    });

    document.getElementById('become-seller-btn')?.addEventListener('click', async () => {
      try {
        const { error } = await supabase.from('profiles').update({ role: 'seller' }).eq('id', user.id);
        if (error) throw error;
        toast.success('You are now a seller!');
        loadProfile();
      } catch (err) {
        toast.error('Failed to become seller');
      }
    });
  } catch (err) {
    main.innerHTML = '<p class="error-state">Failed to load profile</p>';
    toast.error('Failed to load profile');
  }
}

document.addEventListener('DOMContentLoaded', loadProfile);
