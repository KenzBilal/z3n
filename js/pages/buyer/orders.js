// Buyer orders page logic for Z3n Marketplace
import supabase from '../../core/supabase.js';
import { formatPrice, formatDate } from '../../core/utils.js';
import toast from '../../components/toast.js';

let allOrders = [];

async function loadOrders() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href = '/pages/auth/login.html'; return; }

  const main = document.getElementById('orders-main');
  if (!main) return;
  main.innerHTML = '<div class="loading-skeleton">Loading orders...</div>';

  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, products(id, title, thumbnail_url, slug, file_url)')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    allOrders = orders || [];

    let currentFilter = 'all';

    const renderOrders = () => {
      const filtered = currentFilter === 'all' ? allOrders : allOrders.filter(o => o.status === currentFilter);
      const grid = document.getElementById('orders-grid');
      if (grid) {
        grid.innerHTML = filtered.length === 0 ? '<p class="empty-state">No orders found</p>' :
          filtered.map(o => `
            <div class="order-card">
              ${o.products?.thumbnail_url ? '<img src="' + o.products.thumbnail_url + '" alt="" class="order-thumb">' : '<div class="order-thumb placeholder"></div>'}
              <div class="order-info">
                <h3><a href="/pages/product.html?slug=${o.products?.slug || ''}">${o.products?.title || 'Product'}</a></h3>
                <span class="order-date">${formatDate(o.created_at)}</span>
                <span class="order-amount">${formatPrice(o.amount)}</span>
                <span class="order-status status-${o.status}">${o.status}</span>
              </div>
              <div class="order-actions">
                ${o.status === 'completed' && o.products?.file_url ? '<button class="btn-small download-btn" data-path="' + o.products.file_url + '">Download</button>' : ''}
                ${o.status === 'completed' ? '<a href="/pages/product.html?slug=' + (o.products?.slug || '') + '#tab-reviews" class="btn-small">Review</a>' : ''}
                ${o.status !== 'disputed' && o.status !== 'refunded' ? '<button class="btn-small report-btn" data-order="' + o.id + '">Report Issue</button>' : ''}
              </div>
            </div>
          `).join('');

        grid.querySelectorAll('.download-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            try {
              const { data: urlData } = await supabase.storage.from('products').createSignedUrl(btn.dataset.path, 3600);
              if (urlData?.signedUrl) window.open(urlData.signedUrl, '_blank');
              else toast.error('Failed to get download link');
            } catch (e) { toast.error('Download failed'); }
          });
        });

        grid.querySelectorAll('.report-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const reason = prompt('Describe the issue:');
            if (!reason) return;
            const order = allOrders.find(o => o.id === btn.dataset.order);
            if (!order) return;
            await supabase.from('orders').update({ status: 'disputed' }).eq('id', order.id);
            await supabase.from('disputes').insert({
              order_id: order.id,
              buyer_id: user.id,
              seller_id: order.seller_id,
              reason: reason,
              status: 'open'
            });
            toast.success('Issue reported. Admin will review.');
            loadOrders();
          });
        });
      }
    };

    main.innerHTML = `
      <div class="page-header"><h1>My Orders (${allOrders.length})</h1></div>
      <div class="filter-tabs">
        <button class="filter-tab active" data-filter="all">All (${allOrders.length})</button>
        <button class="filter-tab" data-filter="completed">Completed (${allOrders.filter(o => o.status === 'completed').length})</button>
        <button class="filter-tab" data-filter="pending">Pending (${allOrders.filter(o => o.status === 'pending').length})</button>
        <button class="filter-tab" data-filter="disputed">Disputed (${allOrders.filter(o => o.status === 'disputed').length})</button>
      </div>
      <div id="orders-grid"></div>
    `;

    renderOrders();

    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.filter;
        renderOrders();
      });
    });
  } catch (err) {
    main.innerHTML = '<p class="error-state">Failed to load orders</p>';
    toast.error('Failed to load orders');
  }
}

document.addEventListener('DOMContentLoaded', loadOrders);
