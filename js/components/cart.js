// Cart logic for Z3n Marketplace
import store from '../core/store.js';
import { formatPrice } from '../core/utils.js';

function renderCart() {
  const cart = store.getCart();
  const container = document.getElementById('cart-modal');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
    return;
  }

  container.innerHTML = `
    <div class="cart-items">
      ${cart.map(item => `
        <div class="cart-item">
          ${item.thumbnail_url ? `<img src="${item.thumbnail_url}" alt="${item.title}" class="cart-item-thumb">` : ''}
          <div class="cart-item-info">
            <h4>${item.title}</h4>
            <span>${item.price === 0 ? 'Free' : formatPrice(item.price)}</span>
          </div>
          <button class="cart-remove-btn" data-id="${item.id}">Remove</button>
        </div>
      `).join('')}
    </div>
    <div class="cart-footer">
      <span class="cart-total">Total: ${store.getCartTotal()}</span>
      <a href="/pages/checkout.html" class="btn-primary">Checkout</a>
    </div>
  `;

  container.querySelectorAll('.cart-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      store.removeFromCart(btn.dataset.id);
      renderCart();
    });
  });
}

function openCart() {
  const modal = document.getElementById('cart-modal');
  if (modal) {
    modal.classList.add('open');
    renderCart();
  }
}

function closeCart() {
  const modal = document.getElementById('cart-modal');
  if (modal) modal.classList.remove('open');
}

function checkout() {
  window.location.href = '/pages/checkout.html';
}

export default {
  renderCart,
  openCart,
  closeCart,
  checkout
};
