// Dynamic nav loader for Z3n Marketplace
import supabase from '../core/supabase.js';
import store from '../core/store.js';
import searchbar from './search-bar.js';
import cart from './cart.js';

async function loadNav() {
  const navContainer = document.getElementById('nav-container');
  if (!navContainer) return;
  try {
    const res = await fetch('/components/nav.html');
    navContainer.innerHTML = await res.text();
  } catch (err) { return; }

  searchbar.setupSearchBar();
  setupNavListeners();
  await updateNavAuth();
  updateCartBadge();
  store.subscribe('cart', updateCartBadge);
}

function setupNavListeners() {
  const hamburger = document.getElementById('nav-hamburger');
  const mobileMenu = document.getElementById('nav-mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      mobileMenu.style.display = mobileMenu.style.display === 'none' ? '' : 'none';
    });
  }

  const cartIcon = document.getElementById('cart-icon');
  const cartModal = document.getElementById('cart-modal');
  if (cartIcon && cartModal) {
    cartIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      if (cartModal.style.display === 'none') { cartModal.style.display = ''; cart.renderCart(); }
      else { cartModal.style.display = 'none'; }
    });
    document.addEventListener('click', (e) => {
      if (!cartModal.contains(e.target) && !cartIcon.contains(e.target)) cartModal.style.display = 'none';
    });
  }

  const logoutBtn = document.getElementById('nav-logout');
  const logoutMobile = document.getElementById('nav-logout-mobile');
  const handleLogout = async (e) => {
    e.preventDefault();
    await supabase.auth.signOut();
    store.setState('user', null); store.setState('profile', null);
    window.location.href = '/pages/index.html';
  };
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  if (logoutMobile) logoutMobile.addEventListener('click', handleLogout);

  const avatar = document.getElementById('nav-avatar');
  const dropdown = document.getElementById('nav-dropdown');
  if (avatar && dropdown) {
    avatar.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'none' ? '' : 'none';
    });
    document.addEventListener('click', (e) => {
      if (!avatar.contains(e.target) && !dropdown.contains(e.target)) dropdown.style.display = 'none';
    });
  }

  // Notification bell
  const notifBell = document.getElementById('notif-bell');
  const notifDropdown = document.getElementById('notif-dropdown');
  if (notifBell && notifDropdown) {
    notifBell.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.style.display = notifDropdown.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', (e) => {
      if (!notifBell.contains(e.target) && !notifDropdown.contains(e.target)) notifDropdown.style.display = 'none';
    });
  }

  document.getElementById('mark-all-read')?.addEventListener('click', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) markAllRead(user.id);
  });
}

async function updateNavAuth() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      document.querySelectorAll('.nav-logged-in').forEach(e => e.style.display = '');
      document.querySelectorAll('.nav-logged-out').forEach(e => e.style.display = 'none');

      const { data: profile } = await supabase.from('profiles').select('avatar_url, display_name, username').eq('id', user.id).single();

      if (profile) {
        store.setState('user', user);
        store.setState('profile', profile);
        const avatarImg = document.getElementById('nav-avatar-img');
        const avatarPlaceholder = document.getElementById('nav-avatar-placeholder');
        if (profile.avatar_url && avatarImg) {
          avatarImg.src = profile.avatar_url; avatarImg.style.display = '';
          if (avatarPlaceholder) avatarPlaceholder.style.display = 'none';
        } else if (avatarPlaceholder) {
          avatarPlaceholder.textContent = (profile.display_name || profile.username || 'U').charAt(0).toUpperCase();
        }
      }

      loadNotifications(user.id);
    } else {
      document.querySelectorAll('.nav-logged-in').forEach(e => e.style.display = 'none');
      document.querySelectorAll('.nav-logged-out').forEach(e => e.style.display = '');
    }
  } catch (err) {}
}

async function loadNotifications(userId) {
  const { data: notifs } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  const unread = notifs?.filter(n => !n.is_read).length || 0;
  const countEl = document.getElementById('notif-count');
  if (countEl) {
    countEl.textContent = unread;
    countEl.style.display = unread > 0 ? 'inline' : 'none';
  }

  const list = document.getElementById('notif-list');
  if (list) {
    list.innerHTML = !notifs?.length ? '<p class="notif-empty">No notifications</p>' :
      notifs.map(n => '<div class="notif-item ' + (n.is_read ? '' : 'unread') + '" data-id="' + n.id + '"><strong>' + n.title + '</strong><p>' + (n.body || '') + '</p><small>' + new Date(n.created_at).toLocaleDateString() + '</small></div>').join('');

    list.querySelectorAll('.notif-item').forEach(item => {
      item.addEventListener('click', async () => {
        const notifId = item.dataset.id;
        await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
        item.classList.remove('unread');
        loadNotifications(userId);
      });
    });
  }
}

async function markAllRead(userId) {
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
  const countEl = document.getElementById('notif-count');
  if (countEl) countEl.style.display = 'none';
  document.querySelectorAll('.notif-item').forEach(el => el.classList.remove('unread'));
}

function updateCartBadge() {
  const badge = document.getElementById('cart-count');
  if (badge) {
    const count = store.getCartCount();
    badge.textContent = count > 0 ? count : '';
    badge.style.display = count > 0 ? '' : 'none';
  }
}

document.addEventListener('DOMContentLoaded', loadNav);
