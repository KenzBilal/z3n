// Seller products page logic for Z3n Marketplace
import supabase from '../../core/supabase.js';
import toast from '../../components/toast.js';

async function loadSellerProducts() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href = '/pages/auth/login.html'; return; }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'seller' && profile?.role !== 'admin') { window.location.href = '/pages/buyer/dashboard.html'; return; }

  const main = document.getElementById('seller-products-main');
  if (!main) return;
  main.innerHTML = '<div class="loading-skeleton">Loading products...</div>';

  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', user.id)
      .neq('status', 'archived')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tabs = {
      all: products || [],
      active: products?.filter(p => p.status === 'active') || [],
      pending: products?.filter(p => p.status === 'pending') || [],
      paused: products?.filter(p => p.status === 'paused') || [],
      rejected: products?.filter(p => p.status === 'rejected') || []
    };

    main.innerHTML = `
      <div class="page-header">
        <h1>My Products</h1>
        <a href="/pages/seller/new-product.html" class="btn-primary">New Product</a>
      </div>
      <div class="filter-tabs">
        <button class="filter-tab active" data-filter="all" id="tab-all">All (${tabs.all.length})</button>
        <button class="filter-tab" data-filter="active" id="tab-active">Active (${tabs.active.length})</button>
        <button class="filter-tab" data-filter="pending" id="tab-pending">Pending (${tabs.pending.length})</button>
        <button class="filter-tab" data-filter="paused" id="tab-paused">Paused (${tabs.paused.length})</button>
        <button class="filter-tab" data-filter="rejected" id="tab-rejected">Rejected (${tabs.rejected.length})</button>
      </div>
      <div id="products-list"></div>
    `;

    let currentFilter = 'all';

    function renderProducts(filter) {
      const items = tabs[filter] || tabs.all;
      const container = document.getElementById('products-list');
      if (!container) return;

      if (!items.length) {
        container.innerHTML = '<div class="empty-state"><p>No ' + (filter === 'all' ? '' : filter) + ' products</p>' + (filter === 'all' ? '<a href="/pages/seller/new-product.html" class="btn-primary">+ Create First Product</a>' : '') + '</div>';
        return;
      }

      container.innerHTML = items.map(p => `
        <div class="product-row" id="product-${p.id}">
          <img src="${p.thumbnail_url || ''}" width="60" height="60" alt="" onerror="this.style.display='none'">
          <div class="product-row-info">
            <h4><a href="/pages/product.html?slug=${p.slug}">${p.title}</a></h4>
            <span class="category-badge">${p.category || ''}</span>
            <span class="status-badge status-${p.status}">${p.status}</span>
            ${p.status === 'rejected' && p.rejection_reason ? '<p class="rejection-reason">Rejected: ' + p.rejection_reason + '</p>' : ''}
          </div>
          <div class="product-row-stats">
            <span>${p.total_sales || 0} sales</span>
            <span>$${Number(p.total_revenue || 0).toFixed(2)}</span>
            <span>${p.rating_avg ? '★ ' + Number(p.rating_avg).toFixed(1) : 'New'}</span>
          </div>
          <div class="product-row-actions">
            <a href="/pages/seller/edit-product.html?id=${p.id}" class="btn-small">Edit</a>
            ${p.status === 'active' ? '<button onclick="toggleProduct(\'' + p.id + '\', \'paused\')" class="btn-small">Pause</button>' : ''}
            ${p.status === 'paused' ? '<button onclick="toggleProduct(\'' + p.id + '\', \'active\')" class="btn-small">Activate</button>' : ''}
            <a href="/pages/product.html?slug=${p.slug}" target="_blank" class="btn-small">View</a>
            <button onclick="deleteProduct(\'' + p.id + '\', \'' + p.title.replace(/'/g, "\\'") + '\')" class="btn-small btn-danger">Delete</button>
          </div>
        </div>
      `).join('');
    }

    renderProducts('all');

    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.filter;
        renderProducts(currentFilter);
      });
    });
  } catch (err) {
    main.innerHTML = '<p class="error-state">Failed to load products</p>';
    toast.error('Failed to load products');
  }
}

window.toggleProduct = async function(productId, newStatus) {
  const { error } = await supabase.from('products').update({ status: newStatus }).eq('id', productId);
  if (!error) { toast.success('Product ' + newStatus); loadSellerProducts(); }
  else { toast.error('Failed to update'); }
};

window.deleteProduct = async function(productId, title) {
  if (!confirm('Delete "' + title + '"? This cannot be undone.')) return;
  const { error } = await supabase.from('products').update({ status: 'archived' }).eq('id', productId);
  if (!error) { toast.info('Product deleted'); document.getElementById('product-' + productId)?.remove(); }
  else { toast.error('Failed to delete'); }
};

document.addEventListener('DOMContentLoaded', loadSellerProducts);
