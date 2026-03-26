// Dynamic nav loader for Z3n Marketplace
import { getCurrentUser, signOut } from '../core/auth.js';
import store from '../core/store.js';

async function loadNav() {
  const navContainer = document.getElementById('nav-container');
  if (!navContainer) return;
  const res = await fetch('/components/nav.html');
  navContainer.innerHTML = await res.text();
  // Auth state
  const user = await getCurrentUser();
  if (user) {
    document.querySelectorAll('.nav-logged-in').forEach(e => e.style.display = '');
    document.querySelectorAll('.nav-logged-out').forEach(e => e.style.display = 'none');
    // Avatar dropdown, etc.
  } else {
    document.querySelectorAll('.nav-logged-in').forEach(e => e.style.display = 'none');
    document.querySelectorAll('.nav-logged-out').forEach(e => e.style.display = '');
  }
  // Cart badge
  const badge = document.getElementById('cart-badge');
  if (badge) badge.textContent = store.getCartCount() || '';
  // Sign out
  const signOutBtn = document.getElementById('signout-btn');
  if (signOutBtn) signOutBtn.onclick = signOut;
  // Highlight active link
  const path = window.location.pathname;
  document.querySelectorAll('nav a').forEach(a => {
    if (a.pathname === path) a.classList.add('active');
  });
  // Mobile menu
  const burger = document.getElementById('nav-burger');
  const mobileMenu = document.getElementById('nav-mobile');
  if (burger && mobileMenu) {
    burger.onclick = () => mobileMenu.classList.toggle('open');
  }
}

document.addEventListener('DOMContentLoaded', loadNav);