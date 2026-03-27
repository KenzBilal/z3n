// Admin revenue page logic for Z3n Marketplace
import supabase from '../../core/supabase.js';
import { requireAdmin } from '../../core/auth.js';
import { formatPrice, formatNumber } from '../../core/utils.js';
import toast from '../../components/toast.js';

async function loadRevenue() {
  await requireAdmin();

  const main = document.getElementById('admin-revenue-main');
  if (!main) return;

  main.innerHTML = '<div class="loading-skeleton">Loading revenue...</div>';

  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('amount, created_at, status')
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const totalRevenue = (orders || []).reduce((sum, o) => sum + (o.amount || 0), 0);
    const platformFees = totalRevenue * 0.1;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentOrders = (orders || []).filter(o => new Date(o.created_at) >= thirtyDaysAgo);
    const recentRevenue = recentOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

    main.innerHTML = `
      <div class="page-header"><h1>Revenue</h1></div>
      <div class="dashboard-stats">
        <div class="stat-card"><span class="stat-value">${formatPrice(totalRevenue)}</span><span class="stat-label">Total Revenue</span></div>
        <div class="stat-card"><span class="stat-value">${formatPrice(platformFees)}</span><span class="stat-label">Platform Fees (10%)</span></div>
        <div class="stat-card"><span class="stat-value">${formatPrice(recentRevenue)}</span><span class="stat-label">Last 30 Days</span></div>
        <div class="stat-card"><span class="stat-value">${formatNumber(orders?.length || 0)}</span><span class="stat-label">Total Orders</span></div>
      </div>
      <section class="dashboard-section">
        <h2>Recent Transactions</h2>
        ${(orders || []).length === 0 ? '<p>No transactions yet</p>' : `
          <table class="data-table">
            <thead><tr><th>Amount</th><th>Platform Fee</th><th>Date</th></tr></thead>
            <tbody>
              ${(orders || []).slice(0, 20).map(o => `
                <tr>
                  <td>${formatPrice(o.amount)}</td>
                  <td>${formatPrice(o.amount * 0.1)}</td>
                  <td>${new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </section>
    `;
  } catch (err) {
    main.innerHTML = '<p class="error-state">Failed to load revenue</p>';
    toast.error('Failed to load revenue');
  }
}

document.addEventListener('DOMContentLoaded', loadRevenue);
