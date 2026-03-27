// Admin disputes page logic for Z3n Marketplace
import supabase from '../../core/supabase.js';
import { formatDate, formatPrice } from '../../core/utils.js';
import toast from '../../components/toast.js';

async function loadDisputes() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href = '/pages/auth/login.html'; return; }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') { window.location.href = '/pages/index.html'; return; }

  const main = document.getElementById('admin-disputes-main');
  if (!main) return;
  main.innerHTML = '<div class="loading-skeleton">Loading disputes...</div>';

  try {
    const { data: disputes, error } = await supabase
      .from('disputes')
      .select(`*, orders(id, amount, status, product_id, products(title), profiles!orders_buyer_id_fkey(username, display_name)), seller:profiles!disputes_seller_id_fkey(username, display_name)`)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (error) throw error;

    main.innerHTML = `
      <div class="page-header"><h1>Open Disputes (${disputes?.length || 0})</h1></div>
      ${!disputes?.length ? '<p class="empty-state">No open disputes</p>' : `
        <div class="disputes-list">
          ${disputes.map(d => `
            <div class="dispute-card" id="dispute-${d.id}">
              <div class="dispute-header">
                <h3>${d.orders?.products?.title || 'Unknown Product'}</h3>
                <span class="status-badge status-open">Open</span>
              </div>
              <div class="dispute-info">
                <p><strong>Buyer:</strong> ${d.orders?.profiles?.display_name || d.orders?.profiles?.username || 'Unknown'}</p>
                <p><strong>Seller:</strong> ${d.seller?.display_name || d.seller?.username || 'Unknown'}</p>
                <p><strong>Amount:</strong> ${formatPrice(d.orders?.amount || 0)}</p>
                <p><strong>Reason:</strong> ${d.reason || 'N/A'}</p>
                <p><strong>Description:</strong> ${d.description || 'N/A'}</p>
                <p><strong>Filed:</strong> ${formatDate(d.created_at)}</p>
              </div>
              <div class="dispute-actions">
                <button class="btn-danger refund-btn" data-id="${d.id}" data-order="${d.order_id}">Refund Buyer</button>
                <button class="btn-primary release-btn" data-id="${d.id}" data-order="${d.order_id}">Release to Seller</button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;

    document.querySelectorAll('.refund-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const { error } = await supabase.from('orders').update({ status: 'refunded' }).eq('id', btn.dataset.order);
        if (error) { toast.error('Failed to refund'); return; }
        await supabase.from('disputes').update({ status: 'resolved', resolution: 'refunded' }).eq('id', btn.dataset.id);
        toast.success('Order refunded');
        document.getElementById('dispute-' + btn.dataset.id)?.remove();
      });
    });

    document.querySelectorAll('.release-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const { error } = await supabase.from('orders').update({ status: 'completed' }).eq('id', btn.dataset.order);
        if (error) { toast.error('Failed to release'); return; }
        await supabase.from('disputes').update({ status: 'resolved', resolution: 'released' }).eq('id', btn.dataset.id);
        toast.success('Payment released to seller');
        document.getElementById('dispute-' + btn.dataset.id)?.remove();
      });
    });
  } catch (err) {
    main.innerHTML = '<p class="error-state">Failed to load disputes</p>';
    toast.error('Failed to load disputes');
  }
}

document.addEventListener('DOMContentLoaded', loadDisputes);
