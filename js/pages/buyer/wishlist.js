// Buyer wishlist page logic for Z3n Marketplace
import supabase from '../../core/supabase.js';
import { requireAuth, getCurrentUser } from '../../core/auth.js';
import { formatPrice } from '../../core/utils.js';
import store from '../../core/store.js';
import toast from '../../components/toast.js';

async function loadWishlist() {
  await requireAuth();

  const main = document.getElementById('wishlist-main');
  if (!main) return;

  main.innerHTML = '<div class="loading-skeleton">Loading wishlist...</div>';

  try {
    const user = await getCurrentUser();
    const { data: items, error } = await supabase
      .from('wishlists')
      .select('*, products(id, title, thumbnail_url, price, slug, seller_id)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    main.innerHTML = `
      <div class="page-header"><h1>My Wishlist</h1></div>
      ${!items || items.length === 0 ? '<p class="empty-state">Your wishlist is empty. <a href="/pages/marketplace.html">Browse marketplace</a></p>' : `
        <div class="wishlist-grid">
          ${items.map(item => item.products ? `
            <div class="wishlist-card" data-id="${item.id}" data-product-id="${item.products.id}">
              ${item.products.thumbnail_url ? `<img src="${item.products.thumbnail_url}" alt="${item.products.title}" class="wishlist-thumb">` : '<div class="wishlist-thumb placeholder"></div>'}
              <div class="wishlist-info">
                <h3><a href="/pages/product.html?slug=${item.products.slug}">${item.products.title}</a></h3>
                <span class="wishlist-price">${item.products.price === 0 ? 'Free' : formatPrice(item.products.price)}</span>
                <div class="wishlist-actions">
                  <button class="add-cart-btn">Add to Cart</button>
                  <button class="remove-wishlist-btn">Remove</button>
                </div>
              </div>
            </div>
          ` : '').join('')}
        </div>
      `}
    `;

    document.querySelectorAll('.add-cart-btn').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        const product = items[i]?.products;
        if (product) store.addToCart(product);
      });
    });

    document.querySelectorAll('.remove-wishlist-btn').forEach((btn, i) => {
      btn.addEventListener('click', async () => {
        const wishlistId = items[i]?.id;
        if (!wishlistId) return;
        try {
          const { error } = await supabase.from('wishlists').delete().eq('id', wishlistId);
          if (error) throw error;
          toast.success('Removed from wishlist');
          loadWishlist();
        } catch (err) {
          toast.error('Failed to remove');
        }
      });
    });
  } catch (err) {
    main.innerHTML = '<p class="error-state">Failed to load wishlist</p>';
    toast.error('Failed to load wishlist');
  }
}

document.addEventListener('DOMContentLoaded', loadWishlist);
