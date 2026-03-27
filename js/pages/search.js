// Search results page logic for Z3n Marketplace
import supabase from '../core/supabase.js';
import { formatPrice } from '../core/utils.js';
import toast from '../components/toast.js';

async function loadSearch() {
  const main = document.getElementById('search-main');
  if (!main) return;

  const params = new URLSearchParams(window.location.search);
  const query = params.get('q') || '';

  main.innerHTML = `
    <div class="search-page">
      <div class="search-header">
        <input type="text" id="search-input" placeholder="Search products..." value="${query}">
        <button id="search-btn" class="btn-primary">Search</button>
      </div>
      <div id="search-count"></div>
      <div id="search-results" class="product-grid">
        ${query ? '<div class="loading-skeleton">Searching...</div>' : '<p class="empty-state">Enter a search term</p>'}
      </div>
    </div>
  `;

  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const resultsDiv = document.getElementById('search-results');
  const countDiv = document.getElementById('search-count');

  const doSearch = async () => {
    const q = searchInput.value.trim();
    if (!q) { resultsDiv.innerHTML = '<p class="empty-state">Enter a search term</p>'; return; }
    resultsDiv.innerHTML = '<div class="loading-skeleton">Searching...</div>';

    try {
      const { data: results, error } = await supabase
        .from('products')
        .select(`id, title, slug, description, price, thumbnail_url, rating_avg, total_sales, category, profiles!products_seller_id_fkey(username, display_name)`)
        .eq('status', 'active')
        .or('title.ilike.%' + q + '%,description.ilike.%' + q + '%,category.ilike.%' + q + '%')
        .order('total_sales', { ascending: false })
        .limit(20);

      if (error) throw error;

      countDiv.textContent = (results?.length || 0) + ' results for "' + q + '"';

      if (!results || results.length === 0) {
        resultsDiv.innerHTML = '<p class="empty-state">No results found for "' + q + '". Try different keywords.</p>';
        return;
      }

      resultsDiv.innerHTML = results.map(p => `
        <a href="/pages/product.html?slug=${p.slug}" class="product-card">
          <div class="product-card-image">
            <img src="${p.thumbnail_url || ''}" alt="${p.title}" onerror="this.style.display='none'">
          </div>
          <div class="product-card-body">
            <span class="product-category">${p.category || ''}</span>
            <h3 class="product-title">${p.title}</h3>
            <p class="product-desc">${(p.description || '').slice(0, 80)}...</p>
            <div class="product-meta">
              <span class="product-seller">${p.profiles?.display_name || p.profiles?.username || ''}</span>
              <span class="product-rating">${p.rating_avg ? '★ ' + Number(p.rating_avg).toFixed(1) : 'New'}</span>
            </div>
            <div class="product-footer">
              <span class="product-price">${p.price === 0 ? 'Free' : formatPrice(p.price)}</span>
              <span class="product-sales">${p.total_sales || 0} sold</span>
            </div>
          </div>
        </a>
      `).join('');
    } catch (err) {
      resultsDiv.innerHTML = '<p class="error-state">Search failed</p>';
      toast.error('Search failed');
    }
  };

  searchBtn?.addEventListener('click', doSearch);
  searchInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
  if (query) doSearch();
}

document.addEventListener('DOMContentLoaded', loadSearch);
