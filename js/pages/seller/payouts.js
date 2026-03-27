// Seller payouts page logic for Z3n Marketplace
import supabase from '../../core/supabase.js';
import { requireSeller, getCurrentUser, getCurrentProfile } from '../../core/auth.js';
import { formatPrice, formatDate } from '../../core/utils.js';
import toast from '../../components/toast.js';

async function loadPayouts() {
  await requireSeller();

  const main = document.getElementById('payouts-main');
  if (!main) return;

  main.innerHTML = '<div class="loading-skeleton">Loading payouts...</div>';

  try {
    const user = await getCurrentUser();
    const profile = await getCurrentProfile();

    const { data: payouts, error } = await supabase
      .from('payouts')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    main.innerHTML = `
      <div class="page-header"><h1>Payouts</h1></div>
      <div class="dashboard-stats">
        <div class="stat-card">
          <span class="stat-value">${formatPrice(profile?.wallet_balance || 0)}</span>
          <span class="stat-label">Available Balance</span>
        </div>
      </div>
      ${(profile?.wallet_balance || 0) > 0 ? `
        <button id="request-payout-btn" class="btn-primary">Request Payout</button>
      ` : '<p>No balance available for payout</p>'}
      <section class="dashboard-section">
        <h2>Payout History</h2>
        ${!payouts || payouts.length === 0 ? '<p>No payouts yet</p>' : `
          <table class="data-table">
            <thead><tr><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              ${payouts.map(p => `
                <tr>
                  <td>${formatPrice(p.amount)}</td>
                  <td><span class="status-badge status-${p.status}">${p.status}</span></td>
                  <td>${formatDate(p.created_at)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </section>
    `;

    document.getElementById('request-payout-btn')?.addEventListener('click', async () => {
      const btn = document.getElementById('request-payout-btn');
      btn.disabled = true;
      try {
        const { error } = await supabase.from('payouts').insert({
          seller_id: user.id,
          amount: profile.wallet_balance,
          status: 'pending'
        });
        if (error) throw error;
        toast.success('Payout requested');
        loadPayouts();
      } catch (err) {
        toast.error(err.message || 'Failed to request payout');
        btn.disabled = false;
      }
    });
  } catch (err) {
    main.innerHTML = '<p class="error-state">Failed to load payouts</p>';
    toast.error('Failed to load payouts');
  }
}

document.addEventListener('DOMContentLoaded', loadPayouts);
