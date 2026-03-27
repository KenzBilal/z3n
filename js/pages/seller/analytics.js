// Seller analytics page logic for Z3n Marketplace
import supabase from '../../core/supabase.js';
import { formatDate } from '../../core/utils.js';
import toast from '../../components/toast.js';

async function loadSellerAnalytics() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href = '/pages/auth/login.html'; return; }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'seller' && profile?.role !== 'admin') { window.location.href = '/pages/buyer/dashboard.html'; return; }

  const main = document.getElementById('analytics-main');
  if (!main) return;
  main.innerHTML = '<div class="loading-skeleton">Loading analytics...</div>';

  let currentRange = 30;

  const loadAnalytics = async () => {
    try {
      const { data: sellerProducts } = await supabase.from('products').select('id, title, total_sales, total_revenue').eq('seller_id', user.id);
      const productIds = (sellerProducts || []).map(p => p.id);
      if (productIds.length === 0) {
        main.innerHTML = '<div class="page-header"><h1>Analytics</h1></div><p class="empty-state">No products yet</p>';
        return;
      }

      const now = new Date();
      const startDate = new Date(now.getTime() - currentRange * 24 * 60 * 60 * 1000).toISOString();

      const [viewEvents, wishlistEvents, purchaseEvents] = await Promise.all([
        supabase.from('analytics_events').select('*', { count: 'exact', head: true }).in('product_id', productIds).eq('event_type', 'view').gte('created_at', startDate),
        supabase.from('analytics_events').select('*', { count: 'exact', head: true }).in('product_id', productIds).eq('event_type', 'wishlist_add').gte('created_at', startDate),
        supabase.from('analytics_events').select('*', { count: 'exact', head: true }).in('product_id', productIds).eq('event_type', 'purchase').gte('created_at', startDate)
      ]);

      const views = viewEvents.count || 0;
      const wishlists = wishlistEvents.count || 0;
      const purchases = purchaseEvents.count || 0;
      const convRate = views > 0 ? ((purchases / views) * 100).toFixed(1) : '0.0';

      main.innerHTML = `
        <div class="page-header">
          <h1>Analytics</h1>
          <div class="date-range-btns">
            <button class="btn-small range-btn ${currentRange === 7 ? 'active' : ''}" data-days="7">7d</button>
            <button class="btn-small range-btn ${currentRange === 30 ? 'active' : ''}" data-days="30">30d</button>
            <button class="btn-small range-btn ${currentRange === 90 ? 'active' : ''}" data-days="90">90d</button>
          </div>
        </div>
        <div class="dashboard-stats">
          <div class="stat-card"><span class="stat-value">${views}</span><span class="stat-label">Views (${currentRange}d)</span></div>
          <div class="stat-card"><span class="stat-value">${wishlists}</span><span class="stat-label">Wishlist Adds</span></div>
          <div class="stat-card"><span class="stat-value">${purchases}</span><span class="stat-label">Purchases</span></div>
          <div class="stat-card"><span class="stat-value">${convRate}%</span><span class="stat-label">Conversion Rate</span></div>
        </div>
        <section class="dashboard-section">
          <h2>Per Product</h2>
          <table class="data-table">
            <thead><tr><th>Product</th><th>Sales</th><th>Revenue</th></tr></thead>
            <tbody>
              ${(sellerProducts || []).map(p => '<tr><td>' + p.title + '</td><td>' + (p.total_sales || 0) + '</td><td>$' + Number(p.total_revenue || 0).toFixed(2) + '</td></tr>').join('')}
            </tbody>
          </table>
        </section>
      `;

      document.querySelectorAll('.range-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          currentRange = parseInt(btn.dataset.days);
          loadAnalytics();
        });
      });
    } catch (err) {
      main.innerHTML = '<p class="error-state">Failed to load analytics</p>';
      toast.error('Failed to load analytics');
    }
  };

  loadAnalytics();
}

document.addEventListener('DOMContentLoaded', loadSellerAnalytics);
