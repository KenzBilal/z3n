// Storefront public seller page logic for Z3n Marketplace
import supabase from '../../core/supabase.js';
import { formatPrice } from '../../core/utils.js';
import toast from '../../components/toast.js';

async function loadStorefront() {
  const main = document.getElementById('storefront-main');
  if (!main) return;
  main.innerHTML = '<div class="loading-skeleton">Loading storefront...</div>';

  const params = new URLSearchParams(window.location.search);
  const username = params.get('username') || params.get('u');

  if (!username) { main.innerHTML = '<p class="error-state">No seller specified</p>'; return; }

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !profile) { main.innerHTML = '<p class="error-state">Seller not found</p>'; return; }

    document.title = (profile.display_name || username) + ' — Z3N';

    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', profile.id)
      .eq('status', 'active')
      .order('total_sales', { ascending: false });

    main.innerHTML = `
      <div id="storefront-header">
        ${profile.avatar_url ? '<img id="seller-avatar-img" src="' + profile.avatar_url + '" alt="" class="storefront-avatar">' : '<div class="storefront-avatar placeholder"></div>'}
        <div class="storefront-info">
          <h1 id="seller-display-name">${profile.display_name || profile.username}</h1>
          <p id="seller-username">@${profile.username}</p>
          ${profile.is_verified ? '<span id="seller-verified-badge" class="verified-badge">✓ Verified Seller</span>' : ''}
          <p id="seller-bio">${profile.bio || ''}</p>
          <p id="seller-total-sales">${profile.total_sales || 0} total sales</p>
          ${profile.website ? '<a id="seller-website" href="' + profile.website + '" target="_blank">' + profile.website + '</a>' : ''}
          ${profile.twitter ? '<a id="seller-twitter" href="https://twitter.com/' + profile.twitter + '" target="_blank">@' + profile.twitter + '</a>' : ''}
        </div>
      </div>
      <div id="storefront-products-section">
        <h2>Products (${products?.length || 0})</h2>
        <div id="storefront-products" class="product-grid">
          ${!products?.length ? '<p class="empty-state">No products yet</p>' :
            products.map(p => `
              <a href="/pages/product.html?slug=${p.slug}" class="product-card">
                <div class="product-card-image">
                  <img src="${p.thumbnail_url || ''}" alt="${p.title}" onerror="this.style.display='none'">
                </div>
                <div class="product-card-body">
                  <h3 class="product-title">${p.title}</h3>
                  <div class="product-meta">
                    <span class="product-rating">${p.rating_avg ? '★ ' + Number(p.rating_avg).toFixed(1) : 'New'}</span>
                    <span class="product-sales">${p.total_sales || 0} sold</span>
                  </div>
                  <span class="product-price">${p.price === 0 ? 'Free' : formatPrice(p.price)}</span>
                </div>
              </a>
            `).join('')}
        </div>
      </div>
    `;
  } catch (err) {
    main.innerHTML = '<p class="error-state">Failed to load storefront</p>';
    toast.error('Failed to load storefront');
  }
}

document.addEventListener('DOMContentLoaded', loadStorefront);
