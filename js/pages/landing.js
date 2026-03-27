// Landing page logic for Z3n Marketplace
import supabase from '../core/supabase.js';

async function loadLanding() {
  // Load stats
  const [{ count: productCount }, { count: sellerCount }, { count: salesCount }] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'seller'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed')
  ]);
  document.getElementById('stat-products').textContent = productCount || '0';
  document.getElementById('stat-sellers').textContent = sellerCount || '0';
  document.getElementById('stat-sales').textContent = salesCount || '0';

  // Load categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .eq('is_active', true)
    .order('sort_order');
  const grid = document.getElementById('categories-grid');
  if (grid && categories) {
    grid.innerHTML = categories.map(cat => `
      <a href="/pages/marketplace.html?category=${cat.slug}">
        <span>${cat.icon || ''}</span>
        <span>${cat.name}</span>
      </a>
    `).join('');
  }

  // Load featured products
  const { data: featured } = await supabase
    .from('products')
    .select('*, profiles!products_seller_id_fkey(username, display_name)')
    .eq('status', 'active')
    .eq('is_featured', true)
    .limit(8);
  const featuredGrid = document.getElementById('featured-grid');
  if (featuredGrid) {
    if (!featured || featured.length === 0) {
      featuredGrid.innerHTML = '<p>No featured products yet</p>';
    } else {
      featuredGrid.innerHTML = featured.map(p => `
        <a href="/pages/product.html?slug=${p.slug}">
          <img src="${p.thumbnail_url || ''}" alt="${p.title}">
          <h3>${p.title}</h3>
          <p>By ${p.profiles?.display_name || p.profiles?.username || 'Unknown'}</p>
          <span>${p.price === 0 ? 'Free' : '$' + Number(p.price).toFixed(2)}</span>
        </a>
      `).join('');
    }
  }
}

document.addEventListener('DOMContentLoaded', loadLanding);
