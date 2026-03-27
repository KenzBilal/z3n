// Admin listings review queue logic for Z3n Marketplace
import supabase from '../../core/supabase.js';
import { formatPrice, formatDate } from '../../core/utils.js';
import toast from '../../components/toast.js';

let pendingProducts = [];

async function loadListings() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href = '/pages/auth/login.html'; return; }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') { window.location.href = '/pages/index.html'; return; }

  const main = document.getElementById('admin-listings-main');
  if (!main) return;
  main.innerHTML = '<div class="loading-skeleton">Loading listings...</div>';

  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`*, profiles!products_seller_id_fkey(username, display_name)`)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;
    pendingProducts = products || [];

    main.innerHTML = `
      <div class="page-header"><h1>Listings Review (${pendingProducts.length})</h1></div>
      ${pendingProducts.length === 0 ? '<p class="empty-state">No pending listings</p>' : `
        <div class="listings-list">
          ${pendingProducts.map(p => `
            <div class="listing-card" id="product-${p.id}">
              <div class="listing-info">
                ${p.thumbnail_url ? `<img src="${p.thumbnail_url}" alt="${p.title}" class="listing-thumb">` : '<div class="listing-thumb placeholder"></div>'}
                <div>
                  <h3>${p.title}</h3>
                  <span>Seller: ${p.profiles?.display_name || p.profiles?.username || 'Unknown'}</span>
                  <span>Category: ${p.category || 'N/A'}</span>
                  <span>Price: ${p.price === 0 ? 'Free' : formatPrice(p.price)}</span>
                  <span>Submitted: ${formatDate(p.created_at)}</span>
                  ${p.preview_content ? `<p class="preview-snippet">${p.preview_content.substring(0, 100)}...</p>` : ''}
                </div>
              </div>
              <div class="listing-actions">
                <button class="btn-primary approve-btn" data-id="${p.id}">Approve</button>
                <button class="btn-danger reject-btn" data-id="${p.id}">Reject</button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
      <div id="reject-modal" class="modal" style="display:none">
        <div class="modal-content">
          <h3>Reject Product</h3>
          <textarea id="reject-reason" placeholder="Reason for rejection..."></textarea>
          <div class="modal-actions">
            <button id="cancel-reject" class="btn-secondary">Cancel</button>
            <button id="confirm-reject" class="btn-danger">Reject</button>
          </div>
        </div>
      </div>
    `;

    let rejectProductId = null;

    document.querySelectorAll('.approve-btn').forEach(btn => {
      btn.addEventListener('click', () => approveProduct(btn.dataset.id));
    });

    document.querySelectorAll('.reject-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        rejectProductId = btn.dataset.id;
        document.getElementById('reject-modal').style.display = '';
      });
    });

    document.getElementById('cancel-reject')?.addEventListener('click', () => {
      document.getElementById('reject-modal').style.display = 'none';
      rejectProductId = null;
    });

    document.getElementById('confirm-reject')?.addEventListener('click', () => {
      const reason = document.getElementById('reject-reason').value.trim();
      if (!reason) { toast.error('Please provide a reason'); return; }
      rejectProduct(rejectProductId, reason);
      document.getElementById('reject-modal').style.display = 'none';
    });
  } catch (err) {
    main.innerHTML = '<p class="error-state">Failed to load listings</p>';
    toast.error('Failed to load listings');
  }
}

async function approveProduct(productId) {
  const { error } = await supabase.from('products').update({ status: 'active' }).eq('id', productId);
  if (error) { toast.error('Failed to approve'); return; }

  const product = pendingProducts.find(p => p.id === productId);
  if (product) {
    await supabase.from('notifications').insert({
      user_id: product.seller_id,
      type: 'system',
      title: 'Product Approved!',
      body: `"${product.title}" is now live on Z3N Marketplace`,
      link: '/pages/product.html?slug=' + product.slug
    });
  }

  toast.success('Product approved!');
  document.getElementById('product-' + productId)?.remove();
}

async function rejectProduct(productId, reason) {
  const { error } = await supabase.from('products').update({ status: 'rejected', rejection_reason: reason }).eq('id', productId);
  if (error) { toast.error('Failed to reject'); return; }

  const product = pendingProducts.find(p => p.id === productId);
  if (product) {
    await supabase.from('notifications').insert({
      user_id: product.seller_id,
      type: 'system',
      title: 'Product Needs Changes',
      body: `"${product.title}" was not approved: ${reason}`,
      link: '/pages/seller/products.html'
    });
  }

  toast.info('Product rejected');
  document.getElementById('product-' + productId)?.remove();
}

document.addEventListener('DOMContentLoaded', loadListings);
