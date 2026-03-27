// Buyer dashboard logic for Z3n Marketplace
import supabase from '../../core/supabase.js';
import { requireAuth, getCurrentUser, getCurrentProfile } from '../../core/auth.js';
import { formatPrice, formatDate } from '../../core/utils.js';
import toast from '../../components/toast.js';

async function loadBuyerDashboard() {
  await requireAuth();

  const main = document.getElementById('buyer-dashboard-main');
  if (!main) return;

  main.innerHTML = '<div class="loading-skeleton">Loading dashboard...</div>';

  try {
    const user = await getCurrentUser();
    const [profile, ordersResult, wishlistResult] = await Promise.all([
      getCurrentProfile(),
      supabase.from('orders').select('*, products(title, thumbnail_url, slug)').eq('buyer_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('wishlists').select('*, products(id, title, thumbnail_url, price, slug)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(4)
    ]);

    const orders = ordersResult.data || [];
    const wishlist = wishlistResult.data || [];

    const { count: totalOrders } = await supabase
      .from('orders').select('*', { count: 'exact', head: true }).eq('buyer_id', user.id);

    const isBuyer = profile?.role === 'buyer';

    main.innerHTML = `
      <div class="dashboard-header">
        <h1>Welcome, ${profile?.display_name || profile?.username || 'Buyer'}</h1>
      </div>
      ${isBuyer ? `
        <div id="become-seller-banner">
          <h3>Start selling on Z3N</h3>
          <p>Share your AI creations and earn money</p>
          <button id="become-seller-btn" class="btn-primary">Become a Seller</button>
        </div>
      ` : ''}
      <div class="dashboard-stats">
        <div class="stat-card"><span class="stat-value">${totalOrders || 0}</span><span class="stat-label">Total Orders</span></div>
        <div class="stat-card"><span class="stat-value">${wishlist.length}</span><span class="stat-label">Wishlist Items</span></div>
      </div>
      <section class="dashboard-section">
        <h2>Recent Orders</h2>
        ${orders.length === 0 ? '<p>No orders yet. <a href="/pages/marketplace.html">Browse marketplace</a></p>' : `
          <div class="orders-list">
            ${orders.map(o => `
              <div class="order-card">
                ${o.products?.thumbnail_url ? '<img src="' + o.products.thumbnail_url + '" alt="' + (o.products?.title || '') + '" class="order-thumb">' : ''}
                <div class="order-info">
                  <h3><a href="/pages/product.html?slug=${o.products?.slug || ''}">${o.products?.title || 'Product'}</a></h3>
                  <span>${formatDate(o.created_at)}</span>
                  <span>${formatPrice(o.amount)}</span>
                </div>
              </div>
            `).join('')}
          </div>
        `}
        <a href="/pages/buyer/orders.html">View all orders</a>
      </section>
      <section class="dashboard-section">
        <h2>Wishlist</h2>
        ${wishlist.length === 0 ? '<p>No wishlist items</p>' : `
          <div class="product-grid">
            ${wishlist.map(w => w.products ? `
              <a href="/pages/product.html?slug=${w.products.slug}" class="product-card">
                ${w.products.thumbnail_url ? '<img src="' + w.products.thumbnail_url + '" alt="' + w.products.title + '" class="product-thumb">' : ''}
                <h3>${w.products.title}</h3>
                <span>${w.products.price === 0 ? 'Free' : formatPrice(w.products.price)}</span>
              </a>
            ` : '').join('')}
          </div>
        `}
        <a href="/pages/buyer/wishlist.html">View full wishlist</a>
      </section>
    `;

    document.getElementById('become-seller-btn')?.addEventListener('click', async () => {
      const btn = document.getElementById('become-seller-btn');
      btn.disabled = true;
      btn.textContent = 'Updating...';
      const { error } = await supabase.from('profiles').update({ role: 'seller' }).eq('id', user.id);
      if (!error) {
        toast.success('You are now a seller!');
        setTimeout(() => { window.location.href = '/pages/seller/dashboard.html'; }, 1500);
      } else {
        toast.error('Failed to become seller');
        btn.disabled = false;
        btn.textContent = 'Become a Seller';
      }
    });
  } catch (err) {
    main.innerHTML = '<p class="error-state">Failed to load dashboard</p>';
    toast.error('Failed to load dashboard');
  }
}

document.addEventListener('DOMContentLoaded', loadBuyerDashboard);
