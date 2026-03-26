// Global state management for Z3n Marketplace
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

function addToCart(item) {
  state.cart.push(item);
  setState('cart', state.cart);
}

function removeFromCart(productId) {
  state.cart = state.cart.filter(i => i.id !== productId);
  setState('cart', state.cart);
}

function clearCart() {
  state.cart = [];
  setState('cart', state.cart);
}

function getCartCount() {
  return state.cart.length;
}

function getCartTotal() {
  return state.cart.reduce((sum, i) => sum + (i.price || 0), 0);
}

// Load cart from localStorage
(function initCart() {
  const saved = localStorage.getItem('z3n_cart');
  if (saved) state.cart = JSON.parse(saved);
})();

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
