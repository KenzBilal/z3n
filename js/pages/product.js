// Product detail page logic for Z3n Marketplace
import supabase from '../core/supabase.js';
import toast from '../components/toast.js';

let currentProduct = null;
let selectedRating = 0;

async function loadProduct() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  if (!slug) {
    window.location.href = '/pages/marketplace.html';
    return;
  }

  const { data: product, error } = await supabase
    .from('products')
    .select(`*, profiles!products_seller_id_fkey(id, username, display_name, avatar_url, is_verified, total_sales)`)
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (error || !product) {
    document.getElementById('product-loading').textContent = 'Product not found';
    return;
  }

  currentProduct = product;
  trackView(product.id);
  renderProduct(product);
  loadReviews(product.id);
  loadRelated(product.id, product.category);
  checkOwnership(product.id);
  checkWishlist(product.id);
  checkCanReview(product.id);

  document.getElementById('product-loading').style.display = 'none';
  document.getElementById('product-content').style.display = 'grid';
}

function renderProduct(product) {
  document.title = product.title + ' — Z3N';

  document.getElementById('product-title').textContent = product.title;
  const thumbSrc = product.thumbnail_url || '';
  document.getElementById('product-thumbnail').src = thumbSrc;
  document.getElementById('sidebar-thumbnail').src = thumbSrc;
  document.getElementById('product-long-description').innerHTML = product.long_description || product.description || 'No description available';
  document.getElementById('product-preview-content').textContent = product.preview_content || 'No preview available';

  const priceEl = document.getElementById('product-price');
  priceEl.textContent = product.price === 0 ? 'Free' : '$' + Number(product.price).toFixed(2);

  if (product.compare_price) {
    document.getElementById('product-compare-price').textContent = '$' + Number(product.compare_price).toFixed(2);
  }

  document.getElementById('product-rating').textContent = product.rating_avg ? '★ ' + Number(product.rating_avg).toFixed(1) : 'No ratings';
  document.getElementById('product-review-count').textContent = '(' + (product.rating_count || 0) + ' reviews)';

  document.getElementById('product-sales').textContent = product.total_sales || 0;
  document.getElementById('product-category-badge').textContent = product.category || '';

  if (product.ai_models?.length) {
    document.getElementById('product-ai-models').innerHTML = product.ai_models.map(m => '<span class="tag">' + m + '</span>').join('');
  }

  if (product.tags?.length) {
    document.getElementById('product-tags').innerHTML = product.tags.map(t => '<span class="tag">#' + t + '</span>').join('');
  }

  const seller = product.profiles;
  if (seller) {
    document.getElementById('seller-name').textContent = seller.display_name || seller.username;
    document.getElementById('seller-name').href = '/pages/storefront/index.html?username=' + seller.username;
    document.getElementById('seller-total-sales').textContent = (seller.total_sales || 0) + ' sales';
    if (seller.avatar_url) document.getElementById('seller-avatar').src = seller.avatar_url;
    if (seller.is_verified) document.getElementById('seller-verified').textContent = '✓ Verified';
  }

  if (product.demo_url) {
    const demoBtn = document.getElementById('btn-demo');
    demoBtn.href = product.demo_url;
    demoBtn.style.display = 'block';
  }

  if (product.gallery_urls?.length) {
    document.getElementById('product-gallery-thumbs').innerHTML = product.gallery_urls.map(url =>
      '<img src="' + url + '" onclick="document.getElementById(\'product-thumbnail\').src=\'' + url + '\'" style="cursor:pointer;width:60px;height:60px;object-fit:cover;margin:4px">'
    ).join('');
  }

  document.getElementById('btn-add-cart').addEventListener('click', () => addToCart(product));
  document.getElementById('btn-buy-now').addEventListener('click', () => { addToCart(product); window.location.href = '/pages/checkout.html'; });
  document.getElementById('btn-wishlist').addEventListener('click', () => toggleWishlist(product.id));
}

async function trackView(productId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('analytics_events').insert({ product_id: productId, user_id: user?.id || null, event_type: 'view' });
  } catch (e) {}
}

async function loadReviews(productId) {
  const { data: reviews } = await supabase
    .from('reviews')
    .select(`*, profiles!reviews_buyer_id_fkey(username, display_name, avatar_url)`)
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  const list = document.getElementById('product-reviews-list');
  if (!reviews || reviews.length === 0) {
    list.innerHTML = '<p>No reviews yet. Be the first!</p>';
    return;
  }

  list.innerHTML = reviews.map(r => `
    <div class="review-card">
      <div class="review-header">
        <span>${r.profiles?.display_name || r.profiles?.username || 'Anonymous'}</span>
        <span>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
        <span>${new Date(r.created_at).toLocaleDateString()}</span>
        ${r.is_verified ? '<span>✓ Verified Purchase</span>' : ''}
      </div>
      ${r.title ? '<h4>' + r.title + '</h4>' : ''}
      <p>${r.body || ''}</p>
      ${r.seller_reply ? '<div class="seller-reply"><strong>Seller reply:</strong><p>' + r.seller_reply + '</p></div>' : ''}
    </div>
  `).join('');
}

async function checkCanReview(productId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: order } = await supabase.from('orders').select('id').eq('buyer_id', user.id).eq('product_id', productId).eq('status', 'completed').single();
  if (!order) return;

  const { data: existing } = await supabase.from('reviews').select('id').eq('buyer_id', user.id).eq('product_id', productId).single();
  if (existing) return;

  const formSection = document.getElementById('review-form-section');
  if (formSection) {
    formSection.innerHTML = `
      <div id="review-form">
        <h3>Write a Review</h3>
        <div id="star-rating">
          <span class="star" data-value="1">★</span>
          <span class="star" data-value="2">★</span>
          <span class="star" data-value="3">★</span>
          <span class="star" data-value="4">★</span>
          <span class="star" data-value="5">★</span>
        </div>
        <input type="text" id="review-title" placeholder="Review title (optional)">
        <textarea id="review-body" placeholder="Share your experience..."></textarea>
        <button id="submit-review" class="btn-primary">Submit Review</button>
      </div>
    `;

    document.querySelectorAll('.star').forEach(star => {
      star.addEventListener('mouseover', () => highlightStars(Number(star.dataset.value)));
      star.addEventListener('mouseout', () => highlightStars(selectedRating));
      star.addEventListener('click', () => { selectedRating = Number(star.dataset.value); highlightStars(selectedRating); });
    });

    document.getElementById('submit-review')?.addEventListener('click', async () => {
      if (!selectedRating) { toast.error('Please select a rating'); return; }
      const btn = document.getElementById('submit-review');
      btn.disabled = true;
      btn.textContent = 'Submitting...';

      const { data: orderData } = await supabase.from('orders').select('id').eq('buyer_id', user.id).eq('product_id', productId).eq('status', 'completed').single();

      const { error } = await supabase.from('reviews').insert({
        product_id: productId,
        buyer_id: user.id,
        order_id: orderData.id,
        rating: selectedRating,
        title: document.getElementById('review-title').value.trim(),
        body: document.getElementById('review-body').value.trim(),
        is_verified: true
      });

      if (!error) {
        toast.success('Review submitted!');
        formSection.innerHTML = '';
        loadReviews(productId);
      } else {
        toast.error('Failed to submit review');
        btn.disabled = false;
        btn.textContent = 'Submit Review';
      }
    });
  }
}

function highlightStars(count) {
  document.querySelectorAll('.star').forEach(star => {
    star.style.color = Number(star.dataset.value) <= count ? '#f59e0b' : '#666';
  });
}

async function checkOwnership(productId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data } = await supabase.from('orders').select('id').eq('buyer_id', user.id).eq('product_id', productId).eq('status', 'completed').single();

  if (data) {
    document.getElementById('purchase-buttons').style.display = 'none';
    document.getElementById('already-purchased').style.display = 'block';
    document.getElementById('btn-download').addEventListener('click', async () => {
      if (currentProduct?.file_url) {
        const { data: urlData } = await supabase.storage.from('products').createSignedUrl(currentProduct.file_url, 3600);
        if (urlData?.signedUrl) window.open(urlData.signedUrl, '_blank');
        else toast.error('Failed to get download link');
      }
    });
  }
}

async function checkWishlist(productId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data } = await supabase.from('wishlists').select('id').eq('user_id', user.id).eq('product_id', productId).single();
  if (data) {
    const btn = document.getElementById('btn-wishlist');
    btn.innerHTML = '&#9829; Saved';
    btn.dataset.wishlisted = 'true';
  }
}

async function toggleWishlist(productId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href = '/pages/auth/login.html'; return; }

  const btn = document.getElementById('btn-wishlist');
  const isWishlisted = btn.dataset.wishlisted === 'true';

  if (isWishlisted) {
    await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', productId);
    btn.innerHTML = '&#9825; Save'; btn.dataset.wishlisted = 'false'; toast.info('Removed from wishlist');
  } else {
    await supabase.from('wishlists').insert({ user_id: user.id, product_id: productId });
    btn.innerHTML = '&#9829; Saved'; btn.dataset.wishlisted = 'true'; toast.success('Added to wishlist');
  }
}

async function loadRelated(productId, category) {
  const { data } = await supabase.from('products').select('id, title, slug, thumbnail_url, price, rating_avg').eq('category', category).eq('status', 'active').neq('id', productId).limit(4);
  const grid = document.getElementById('related-grid');
  if (!data || data.length === 0) { grid.innerHTML = '<p>No related products</p>'; return; }
  grid.innerHTML = data.map(p => '<a href="/pages/product.html?slug=' + p.slug + '" class="product-card"><img src="' + (p.thumbnail_url || '') + '" alt="' + p.title + '"><h4>' + p.title + '</h4><span>' + (p.price === 0 ? 'Free' : '$' + Number(p.price).toFixed(2)) + '</span></a>').join('');
}

function addToCart(product) {
  const cart = JSON.parse(localStorage.getItem('z3n_cart') || '[]');
  if (cart.find(i => i.id === product.id)) { toast.info('Already in cart'); return; }
  cart.push({ id: product.id, title: product.title, price: product.price, thumbnail_url: product.thumbnail_url, seller_id: product.seller_id, slug: product.slug, file_url: product.file_url });
  localStorage.setItem('z3n_cart', JSON.stringify(cart));
  const badge = document.getElementById('cart-count');
  if (badge) badge.textContent = cart.length;
  toast.success('Added to cart!');
}

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.hidden = true);
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).hidden = false;
    });
  });
}

document.addEventListener('DOMContentLoaded', () => { loadProduct(); initTabs(); });
