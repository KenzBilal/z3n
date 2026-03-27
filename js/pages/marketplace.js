// Marketplace page logic for Z3n Marketplace
import supabase from '../core/supabase.js';
import toast from '../components/toast.js';

const PAGE_SIZE = 16;
let currentPage = 1;
let currentFilters = {};
let totalPages = 1;

async function loadMarketplace() {
  const params = new URLSearchParams(window.location.search);
  currentFilters = {
    category: params.get('category') || null,
    sort: params.get('sort') || 'newest',
    minPrice: params.get('min') ? Number(params.get('min')) : null,
    maxPrice: params.get('max') ? Number(params.get('max')) : null,
    aiModels: params.get('models') ? params.get('models').split(',') : [],
    free: params.get('free') === 'true'
  };
  currentPage = Number(params.get('page')) || 1;

  await loadCategories();
  loadAiModelFilters();
  syncFiltersToUI();
  await loadProducts();
}

async function loadCategories() {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .eq('is_active', true)
    .order('sort_order');

  const container = document.getElementById('category-filters');
  if (container && data) {
    container.innerHTML = `
      <label class="radio-label"><input type="radio" name="category" value="" ${!currentFilters.category ? 'checked' : ''}> All</label>
    ` + data.map(cat => `
      <label class="radio-label"><input type="radio" name="category" value="${cat.slug}" ${currentFilters.category === cat.slug ? 'checked' : ''}> ${cat.icon || ''} ${cat.name}</label>
    `).join('');

    container.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', () => {
        currentFilters.category = input.value || null;
        currentPage = 1;
        updateUrlAndLoad();
      });
    });
  }
}

function loadAiModelFilters() {
  const models = ['GPT-4', 'GPT-4o', 'Claude', 'Gemini', 'Midjourney', 'Stable Diffusion', 'DALL-E', 'Llama'];
  const container = document.getElementById('ai-model-filters');
  if (container) {
    container.innerHTML = models.map(m => `
      <label class="checkbox-label"><input type="checkbox" value="${m}" ${currentFilters.aiModels.includes(m) ? 'checked' : ''}> ${m}</label>
    `).join('');

    container.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', () => {
        const checked = [...container.querySelectorAll('input:checked')].map(i => i.value);
        currentFilters.aiModels = checked;
        currentPage = 1;
        updateUrlAndLoad();
      });
    });
  }
}

async function loadProducts() {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = '<div class="loading">Loading products...</div>';

  const offset = (currentPage - 1) * PAGE_SIZE;

  let query = supabase
    .from('products')
    .select(`
      id, title, slug, description, category, price,
      compare_price, thumbnail_url, rating_avg, rating_count,
      total_sales, tags, ai_models, is_featured, created_at,
      profiles!products_seller_id_fkey(username, display_name, is_verified)
    `, { count: 'exact' })
    .eq('status', 'active');

  if (currentFilters.category) query = query.eq('category', currentFilters.category);
  if (currentFilters.minPrice !== null) query = query.gte('price', currentFilters.minPrice);
  if (currentFilters.maxPrice !== null) query = query.lte('price', currentFilters.maxPrice);
  if (currentFilters.free) query = query.eq('price', 0);
  if (currentFilters.aiModels?.length) query = query.overlaps('ai_models', currentFilters.aiModels);

  switch (currentFilters.sort) {
    case 'popular': query = query.order('total_sales', { ascending: false }); break;
    case 'rating': query = query.order('rating_avg', { ascending: false }); break;
    case 'price_asc': query = query.order('price', { ascending: true }); break;
    case 'price_desc': query = query.order('price', { ascending: false }); break;
    default: query = query.order('created_at', { ascending: false });
  }

  query = query.range(offset, offset + PAGE_SIZE - 1);

  const { data: products, count, error } = await query;

  if (error) {
    grid.innerHTML = '<p>Error loading products</p>';
    return;
  }

  totalPages = Math.ceil((count || 0) / PAGE_SIZE);

  document.getElementById('results-count').textContent = (count || 0) + ' products';
  document.getElementById('page-info').textContent = 'Page ' + currentPage + ' of ' + (totalPages || 1);
  document.getElementById('prev-page').disabled = currentPage <= 1;
  document.getElementById('next-page').disabled = currentPage >= totalPages;

  if (!products || products.length === 0) {
    grid.innerHTML = '';
    document.getElementById('no-results').style.display = 'block';
    return;
  }

  document.getElementById('no-results').style.display = 'none';
  grid.innerHTML = products.map(p => `
    <a href="/pages/product.html?slug=${p.slug}" class="product-card">
      <div class="product-card-image">
        <img src="${p.thumbnail_url || ''}" alt="${p.title}" onerror="this.style.display='none'">
        ${p.is_featured ? '<span class="featured-badge">Featured</span>' : ''}
      </div>
      <div class="product-card-body">
        <span class="product-category">${p.category || ''}</span>
        <h3 class="product-title">${p.title}</h3>
        <p class="product-desc">${(p.description || '').slice(0, 80)}${(p.description || '').length > 80 ? '...' : ''}</p>
        <div class="product-meta">
          <span class="product-seller">${p.profiles?.display_name || p.profiles?.username || 'Unknown'} ${p.profiles?.is_verified ? '✓' : ''}</span>
          <span class="product-rating">${p.rating_avg ? '★ ' + Number(p.rating_avg).toFixed(1) : 'New'}</span>
        </div>
        <div class="product-footer">
          <span class="product-price">${p.price === 0 ? 'Free' : '$' + Number(p.price).toFixed(2)}</span>
          ${p.compare_price ? '<span class="product-compare">$' + Number(p.compare_price).toFixed(2) + '</span>' : ''}
          <span class="product-sales">${p.total_sales || 0} sold</span>
        </div>
      </div>
    </a>
  `).join('');
}

function updateUrlAndLoad() {
  const params = new URLSearchParams();
  if (currentFilters.category) params.set('category', currentFilters.category);
  if (currentFilters.sort && currentFilters.sort !== 'newest') params.set('sort', currentFilters.sort);
  if (currentFilters.minPrice) params.set('min', currentFilters.minPrice);
  if (currentFilters.maxPrice) params.set('max', currentFilters.maxPrice);
  if (currentFilters.aiModels?.length) params.set('models', currentFilters.aiModels.join(','));
  if (currentFilters.free) params.set('free', 'true');
  if (currentPage > 1) params.set('page', currentPage);

  const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
  window.history.pushState({}, '', newUrl);
  loadProducts();
}

function syncFiltersToUI() {
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.value = currentFilters.sort || 'newest';

  sortSelect?.addEventListener('change', () => {
    currentFilters.sort = sortSelect.value;
    currentPage = 1;
    updateUrlAndLoad();
  });

  document.getElementById('prev-page')?.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; updateUrlAndLoad(); }
  });

  document.getElementById('next-page')?.addEventListener('click', () => {
    if (currentPage < totalPages) { currentPage++; updateUrlAndLoad(); }
  });

  document.getElementById('clear-filters')?.addEventListener('click', () => {
    currentFilters = { sort: 'newest' };
    currentPage = 1;
    document.querySelectorAll('#filters-sidebar input[type="radio"][name="category"]')[0].checked = true;
    document.querySelectorAll('#filters-sidebar input[type="radio"][name="price"]')[0].checked = true;
    document.querySelectorAll('#ai-model-filters input').forEach(cb => cb.checked = false);
    document.getElementById('filter-min-price').value = '';
    document.getElementById('filter-max-price').value = '';
    window.history.pushState({}, '', window.location.pathname);
    loadMarketplace();
  });

  // Price radio filter
  document.querySelectorAll('input[name="price"]').forEach(radio => {
    radio.addEventListener('change', () => {
      currentFilters.free = radio.value === 'free';
      if (radio.value === 'all') {
        currentFilters.minPrice = null;
        currentFilters.maxPrice = null;
        currentFilters.free = false;
      }
      currentPage = 1;
      updateUrlAndLoad();
    });
  });

  // Price range inputs
  const minPrice = document.getElementById('filter-min-price');
  const maxPrice = document.getElementById('filter-max-price');
  let priceTimer;
  [minPrice, maxPrice].forEach(input => {
    input?.addEventListener('input', () => {
      clearTimeout(priceTimer);
      priceTimer = setTimeout(() => {
        currentFilters.minPrice = minPrice?.value ? Number(minPrice.value) : null;
        currentFilters.maxPrice = maxPrice?.value ? Number(maxPrice.value) : null;
        currentPage = 1;
        updateUrlAndLoad();
      }, 500);
    });
  });
}

document.addEventListener('DOMContentLoaded', loadMarketplace);
