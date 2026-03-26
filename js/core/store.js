// Global state management for Z3n Marketplace
import toast from '../components/toast.js';
const state = {
  user: null,
  profile: null,
  cart: [],
  notifications: []
};

const listeners = {};

function getState() {
  return { ...state };
}

function setState(key, value) {
  state[key] = value;
  if (listeners[key]) {
    listeners[key].forEach(cb => cb(value));
  }
  if (key === 'cart') {
    localStorage.setItem('z3n_cart', JSON.stringify(state.cart));
  }
}

function subscribe(key, callback) {
  if (!listeners[key]) listeners[key] = [];
  listeners[key].push(callback);
  return () => {
    listeners[key] = listeners[key].filter(cb => cb !== callback);
  };
}

// Cart operations
function getCart() {
  return state.cart;
}

function addToCart(product) {
  if (state.cart.some(i => i.id === product.id)) {
    toast.info('Already in cart');
    return;
  }
  state.cart.push({
    id: product.id,
    title: product.title,
    price: product.price,
    thumbnail_url: product.thumbnail_url,
    seller_id: product.seller_id,
    slug: product.slug
  });
  setState('cart', state.cart);
  updateCartBadge();
  toast.success('Added to cart');
}

function removeFromCart(productId) {
  state.cart = state.cart.filter(i => i.id !== productId);
  setState('cart', state.cart);
  updateCartBadge();
  toast.info('Removed from cart');
}

function clearCart() {
  state.cart = [];
  setState('cart', state.cart);
  updateCartBadge();
}

function getCartCount() {
  return state.cart.length;
}

function getCartTotal() {
  const total = state.cart.reduce((sum, i) => sum + (i.price || 0), 0);
  return `$${total.toFixed(2)}`;
}


// Load cart from localStorage
(function initCart() {
  const saved = localStorage.getItem('z3n_cart');
  if (saved) state.cart = JSON.parse(saved);
  updateCartBadge();
})();

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (badge) badge.textContent = state.cart.length > 0 ? state.cart.length : '';
}

export default {
  getState,
  setState,
  subscribe,
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  getCartCount,
  getCartTotal
};
