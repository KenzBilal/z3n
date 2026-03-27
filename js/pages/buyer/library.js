// Buyer library page logic for Z3n Marketplace
import supabase from '../../core/supabase.js';
import toast from '../../components/toast.js';

async function loadLibrary() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href = '/pages/auth/login.html'; return; }

  const main = document.getElementById('library-main');
  if (!main) return;
  main.innerHTML = '<div class="loading-skeleton">Loading library...</div>';

  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, amount, status, delivered_at, created_at, products(id, title, slug, thumbnail_url, description, file_url, category, version)')
      .eq('buyer_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) throw error;

    main.innerHTML = `
      <div class="page-header"><h1>My Library</h1></div>
      <div id="library-grid">
        ${!orders?.length ? `
          <div id="empty-library">
            <h3>No purchases yet</h3>
            <p>Browse the marketplace to find products</p>
            <a href="/pages/marketplace.html" class="btn-primary">Browse Marketplace</a>
          </div>
        ` : orders.map(order => `
          <div class="library-item">
            <img src="${order.products?.thumbnail_url || ''}" alt="${order.products?.title || ''}" onerror="this.style.display='none'" class="library-thumb">
            <div class="library-item-info">
              <span class="library-category">${order.products?.category || ''}</span>
              <h3>${order.products?.title || 'Unknown'}</h3>
              <p>${(order.products?.description || '').slice(0, 80)}${(order.products?.description || '').length > 80 ? '...' : ''}</p>
              <small>v${order.products?.version || '1.0'} · Purchased ${new Date(order.created_at).toLocaleDateString()}</small>
            </div>
            <div class="library-item-actions">
              ${order.products?.file_url ? '<button onclick="downloadProduct(\'' + order.products.file_url + '\', \'' + (order.products.title || 'product') + '\')" class="btn-primary btn-small">Download</button>' : '<span class="no-file">No file available</span>'}
              <a href="/pages/product.html?slug=${order.products?.slug || ''}" class="btn-secondary btn-small">View Product</a>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    main.innerHTML = '<p class="error-state">Failed to load library</p>';
    toast.error('Failed to load library');
  }
}

window.downloadProduct = async function(filePath, title) {
  try {
    const { data, error } = await supabase.storage.from('products').createSignedUrl(filePath, 3600);
    if (error) throw error;
    const a = document.createElement('a');
    a.href = data.signedUrl;
    a.download = title;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Download started!');
  } catch (err) {
    toast.error('Download failed: ' + (err.message || 'Unknown error'));
  }
};

document.addEventListener('DOMContentLoaded', loadLibrary);
