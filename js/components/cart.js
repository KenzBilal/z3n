// Cart logic for Z3n Marketplace
import store from '../core/store.js';

function renderCart() {
  // Update cart UI from store.cart
}

function openCart() {
  // Show cart modal
}

function closeCart() {
  // Hide cart modal
}

function checkout() {
  window.location.href = '/src/pages/checkout.html';
}

export default {
  renderCart,
  openCart,
  closeCart,
  checkout
};
