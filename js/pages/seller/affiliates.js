// Seller affiliates page logic for Z3n Marketplace
import supabase from '../../core/supabase.js';
import { requireSeller, getCurrentUser } from '../../core/auth.js';
import toast from '../../components/toast.js';

async function loadAffiliates() {
  await requireSeller();

  const main = document.getElementById('affiliates-main');
  if (!main) return;

  main.innerHTML = '<div class="loading-skeleton">Loading affiliates...</div>';

  try {
    const user = await getCurrentUser();

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', user.id)
      .in('status', ['active', 'pending'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    main.innerHTML = `
      <div class="page-header"><h1>Affiliate Links</h1></div>
      ${!products || products.length === 0 ? '<p class="empty-state">No products yet. <a href="/pages/seller/new-product.html">Create a product</a></p>' : `
        <div class="affiliate-list">
          ${products.map(p => {
            const affiliateCode = p.affiliate_code || generateCode();
            const affiliateUrl = `${window.location.origin}/pages/product.html?slug=${p.slug}&ref=${affiliateCode}`;
            return `
              <div class="affiliate-card">
                <div class="affiliate-info">
                  <h3>${p.title}</h3>
                  <span class="status-badge status-${p.status}">${p.status}</span>
                </div>
                <div class="affiliate-link">
                  <input type="text" value="${affiliateUrl}" readonly class="affiliate-url-input" id="url-${p.id}">
                  <button class="btn-small copy-btn" data-url="${affiliateUrl}">Copy</button>
                </div>
                ${!p.affiliate_code ? `
                  <button class="btn-small generate-btn" data-id="${p.id}">Generate Code</button>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;

    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.dataset.url);
        toast.success('Copied to clipboard');
      });
    });

    document.querySelectorAll('.generate-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const code = Math.random().toString(36).slice(2, 10).toUpperCase();
        const { error } = await supabase.from('products').update({ affiliate_code: code }).eq('id', btn.dataset.id);
        if (error) { toast.error('Failed to generate code'); return; }
        toast.success('Affiliate code generated');
        loadAffiliates();
      });
    });
  } catch (err) {
    main.innerHTML = '<p class="error-state">Failed to load affiliates</p>';
    toast.error('Failed to load affiliates');
  }
}

function generateCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

document.addEventListener('DOMContentLoaded', loadAffiliates);
