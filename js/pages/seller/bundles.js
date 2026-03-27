// Seller bundles page logic for Z3n Marketplace
import supabase from '../../core/supabase.js';
import { requireSeller, getCurrentUser } from '../../core/auth.js';
import { formatPrice } from '../../core/utils.js';
import toast from '../../components/toast.js';

async function loadBundles() {
  await requireSeller();

  const main = document.getElementById('bundles-main');
  if (!main) return;

  main.innerHTML = '<div class="loading-skeleton">Loading bundles...</div>';

  try {
    const user = await getCurrentUser();

    const [bundlesResult, productsResult] = await Promise.all([
      supabase.from('bundles').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
      supabase.from('products').select('id, title, price').eq('seller_id', user.id).eq('status', 'active')
    ]);

    const bundles = bundlesResult.data || [];
    const products = productsResult.data || [];

    main.innerHTML = `
      <div class="page-header"><h1>Bundles</h1></div>
      <form id="create-bundle-form" class="inline-form">
        <input type="text" id="bundle-title" placeholder="Bundle title" required>
        <input type="number" id="bundle-price" placeholder="Price" min="0" step="0.01" required>
        <div id="bundle-products">
          <label>Select Products:</label>
          ${products.map(p => `
            <label><input type="checkbox" value="${p.id}" class="bundle-product-cb"> ${p.title} (${formatPrice(p.price)})</label>
          `).join('')}
        </div>
        <button type="submit" class="btn-primary">Create Bundle</button>
      </form>
      <section class="dashboard-section">
        <h2>Your Bundles</h2>
        ${bundles.length === 0 ? '<p>No bundles yet</p>' : `
          <div class="bundles-list">
            ${bundles.map(b => `
              <div class="bundle-card">
                <h3>${b.title}</h3>
                <span>${formatPrice(b.price)}</span>
                <span class="status-badge status-${b.is_active ? 'active' : 'paused'}">${b.is_active ? 'Active' : 'Inactive'}</span>
              </div>
            `).join('')}
          </div>
        `}
      </section>
    `;

    document.getElementById('create-bundle-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true;
      try {
        const selectedProducts = Array.from(document.querySelectorAll('.bundle-product-cb:checked')).map(cb => cb.value);
        if (selectedProducts.length < 2) {
          toast.error('Select at least 2 products');
          btn.disabled = false;
          return;
        }
        const { error } = await supabase.from('bundles').insert({
          seller_id: user.id,
          title: document.getElementById('bundle-title').value.trim(),
          price: parseFloat(document.getElementById('bundle-price').value),
          product_ids: selectedProducts,
          is_active: true
        });
        if (error) throw error;
        toast.success('Bundle created');
        loadBundles();
      } catch (err) {
        toast.error(err.message || 'Failed to create bundle');
        btn.disabled = false;
      }
    });
  } catch (err) {
    main.innerHTML = '<p class="error-state">Failed to load bundles</p>';
    toast.error('Failed to load bundles');
  }
}

document.addEventListener('DOMContentLoaded', loadBundles);
