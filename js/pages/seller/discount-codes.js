// Seller discount codes page logic for Z3n Marketplace
import supabase from '../../core/supabase.js';
import { requireSeller, getCurrentUser } from '../../core/auth.js';
import { formatDate } from '../../core/utils.js';
import toast from '../../components/toast.js';

async function loadDiscountCodes() {
  await requireSeller();

  const main = document.getElementById('discount-codes-main');
  if (!main) return;

  main.innerHTML = '<div class="loading-skeleton">Loading discount codes...</div>';

  try {
    const user = await getCurrentUser();

    const { data: codes, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    main.innerHTML = `
      <div class="page-header"><h1>Discount Codes</h1></div>
      <form id="create-discount-form" class="inline-form">
        <input type="text" id="discount-code-input" placeholder="Code" required>
        <select id="discount-type">
          <option value="percent">Percent (%)</option>
          <option value="fixed">Fixed ($)</option>
        </select>
        <input type="number" id="discount-value" placeholder="Value" min="0" step="0.01" required>
        <input type="date" id="discount-expiry" placeholder="Expiry">
        <input type="number" id="discount-max-uses" placeholder="Max uses" min="1">
        <button type="submit" class="btn-primary">Create</button>
      </form>
      <section class="dashboard-section">
        <h2>Your Codes</h2>
        ${!codes || codes.length === 0 ? '<p>No discount codes yet</p>' : `
          <table class="data-table">
            <thead><tr><th>Code</th><th>Value</th><th>Used</th><th>Expires</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              ${codes.map(c => `
                <tr>
                  <td><strong>${c.code}</strong></td>
                  <td>${c.type === 'percent' ? c.value + '%' : '$' + c.value}</td>
                  <td>${c.used_count || 0}${c.max_uses ? ' / ' + c.max_uses : ''}</td>
                  <td>${c.expires_at ? formatDate(c.expires_at) : 'Never'}</td>
                  <td><span class="status-badge status-${c.is_active ? 'active' : 'paused'}">${c.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button class="btn-small toggle-code-btn" data-id="${c.id}" data-active="${c.is_active}">
                      ${c.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </section>
    `;

    document.getElementById('create-discount-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true;
      try {
        const { error } = await supabase.from('discount_codes').insert({
          seller_id: user.id,
          code: document.getElementById('discount-code-input').value.trim().toUpperCase(),
          type: document.getElementById('discount-type').value,
          value: parseFloat(document.getElementById('discount-value').value),
          expires_at: document.getElementById('discount-expiry').value || null,
          max_uses: document.getElementById('discount-max-uses').value ? parseInt(document.getElementById('discount-max-uses').value) : null,
          is_active: true,
          used_count: 0
        });
        if (error) throw error;
        toast.success('Discount code created');
        loadDiscountCodes();
      } catch (err) {
        toast.error(err.message || 'Failed to create code');
        btn.disabled = false;
      }
    });

    document.querySelectorAll('.toggle-code-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const isActive = btn.dataset.active === 'true';
        const { error } = await supabase.from('discount_codes').update({ is_active: !isActive }).eq('id', btn.dataset.id);
        if (error) { toast.error('Failed to update'); return; }
        toast.success(isActive ? 'Deactivated' : 'Activated');
        loadDiscountCodes();
      });
    });
  } catch (err) {
    main.innerHTML = '<p class="error-state">Failed to load discount codes</p>';
    toast.error('Failed to load discount codes');
  }
}

document.addEventListener('DOMContentLoaded', loadDiscountCodes);
