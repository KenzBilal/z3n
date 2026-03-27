// Admin dashboard logic for Z3n Marketplace
import supabase from '../../core/supabase.js';
import { formatNumber, formatPrice, formatDate } from '../../core/utils.js';
import toast from '../../components/toast.js';

async function loadAdminDashboard() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href = '/pages/auth/login.html'; return; }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') { window.location.href = '/pages/index.html'; return; }

  const main = document.getElementById('admin-dashboard-main');
  if (!main) return;
  main.innerHTML = '<div class="loading-skeleton">Loading admin dashboard...</div>';

  try {
    const [productsCount, usersCount, ordersCount, revenueResult, sellersCount, pendingCount] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('orders').select('amount').eq('status', 'completed'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'seller'),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    ]);

    const totalRevenue = (revenueResult.data || []).reduce((sum, o) => sum + (o.amount || 0), 0);

    const { data: recentOrders } = await supabase
      .from('orders')
      .select('*, products(title), profiles!orders_buyer_id_fkey(username)')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: recentSignups } = await supabase
      .from('profiles')
      .select('username, display_name, role, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    main.innerHTML = `
      <div class="page-header"><h1>Admin Dashboard</h1></div>
      <div class="dashboard-stats">
        <div class="stat-card"><span class="stat-value">${formatNumber(usersCount.count || 0)}</span><span class="stat-label">Total Users</span></div>
        <div class="stat-card"><span class="stat-value">${formatNumber(sellersCount.count || 0)}</span><span class="stat-label">Sellers</span></div>
        <div class="stat-card"><span class="stat-value">${formatNumber(productsCount.count || 0)}</span><span class="stat-label">Products</span></div>
        <div class="stat-card ${pendingCount.count > 0 ? 'stat-alert' : ''}"><span class="stat-value">${pendingCount.count || 0}</span><span class="stat-label">Pending Review</span></div>
        <div class="stat-card"><span class="stat-value">${formatNumber(ordersCount.count || 0)}</span><span class="stat-label">Orders</span></div>
        <div class="stat-card"><span class="stat-value">${formatPrice(totalRevenue)}</span><span class="stat-label">Revenue</span></div>
      </div>
      <div class="dashboard-links">
        <a href="/pages/admin/listings.html" class="dashboard-link"><h3>Pending Listings</h3><span>${pendingCount.count || 0} pending</span></a>
        <a href="/pages/admin/users.html" class="dashboard-link"><h3>Manage Users</h3><span>${usersCount.count || 0} users</span></a>
        <a href="/pages/admin/disputes.html" class="dashboard-link"><h3>Disputes</h3><span>View disputes</span></a>
      </div>
      <section class="dashboard-section">
        <h2>Recent Orders</h2>
        ${!recentOrders?.length ? '<p>No orders yet</p>' : `
          <table class="data-table">
            <thead><tr><th>Product</th><th>Buyer</th><th>Amount</th><th>Date</th></tr></thead>
            <tbody>${recentOrders.map(o => '<tr><td>' + (o.products?.title || 'Unknown') + '</td><td>' + (o.profiles?.username || 'Unknown') + '</td><td>' + formatPrice(o.amount) + '</td><td>' + formatDate(o.created_at) + '</td></tr>').join('')}</tbody>
          </table>
        `}
      </section>
      <section class="dashboard-section">
        <h2>Recent Signups</h2>
        ${!recentSignups?.length ? '<p>No signups yet</p>' : `
          <table class="data-table">
            <thead><tr><th>User</th><th>Role</th><th>Joined</th></tr></thead>
            <tbody>${recentSignups.map(u => '<tr><td>' + (u.display_name || u.username || 'Unknown') + '</td><td>' + u.role + '</td><td>' + formatDate(u.created_at) + '</td></tr>').join('')}</tbody>
          </table>
        `}
      </section>
    `;
  } catch (err) {
    main.innerHTML = '<p class="error-state">Failed to load admin dashboard</p>';
    toast.error('Failed to load admin dashboard');
  }
}

document.addEventListener('DOMContentLoaded', loadAdminDashboard);
