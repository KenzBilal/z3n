// Checkout page logic for Z3n Marketplace — Manual Payment Flow
import supabase from '../core/supabase.js';
import toast from '../components/toast.js';

let cart = [];
let appliedDiscount = null;
let subtotal = 0;
let total = 0;

async function initCheckout() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    sessionStorage.setItem('z3n_intended_url', window.location.href);
    window.location.href = '/pages/auth/login.html';
    return;
  }

  cart = JSON.parse(localStorage.getItem('z3n_cart') || '[]');

  if (cart.length === 0) {
    document.getElementById('empty-cart').style.display = 'block';
    document.getElementById('checkout-content').style.display = 'none';
    return;
  }

  renderCartItems();
  calculateTotals();
  setupPaymentMethodToggle();
  setupDiscountCode();
  setupSubmitButtons();
}

function renderCartItems() {
  const list = document.getElementById('checkout-items-list');
  const sidebar = document.getElementById('sidebar-items');

  const itemsHtml = cart.map(item => `
    <div class="checkout-item" id="item-${item.id}">
      <img src="${item.thumbnail_url || ''}" width="60" height="60" alt="${item.title}" onerror="this.style.display='none'">
      <div class="item-details">
        <h4>${item.title}</h4>
        <span>${item.price === 0 ? 'Free' : '$' + Number(item.price).toFixed(2)}</span>
      </div>
      <button onclick="removeItem('${item.id}')" class="remove-btn">✕</button>
    </div>
  `).join('');

  if (list) list.innerHTML = itemsHtml;
  if (sidebar) sidebar.innerHTML = itemsHtml;
}

function calculateTotals() {
  subtotal = cart.reduce((sum, item) => sum + Number(item.price), 0);
  let discountAmount = 0;
  if (appliedDiscount) {
    if (appliedDiscount.type === 'percent' || appliedDiscount.type === 'percentage') {
      discountAmount = (subtotal * appliedDiscount.value) / 100;
    } else {
      discountAmount = Math.min(appliedDiscount.value, subtotal);
    }
  }
  total = Math.max(subtotal - discountAmount, 0);

  document.getElementById('checkout-subtotal').textContent = '$' + subtotal.toFixed(2);

  const discountRow = document.getElementById('discount-row');
  if (discountAmount > 0) {
    discountRow.style.display = 'flex';
    document.getElementById('checkout-discount').textContent = '-$' + discountAmount.toFixed(2);
  } else {
    discountRow.style.display = 'none';
  }

  document.getElementById('checkout-total').textContent = '$' + total.toFixed(2);

  const amountStr = '$' + total.toFixed(2);
  ['upi-amount', 'paypal-amount', 'bank-amount'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = amountStr;
  });

  if (total === 0) {
    document.getElementById('free-checkout').style.display = 'block';
    document.getElementById('paid-checkout').style.display = 'none';
  } else {
    document.getElementById('free-checkout').style.display = 'none';
    document.getElementById('paid-checkout').style.display = 'block';
  }
}

function setupDiscountCode() {
  document.getElementById('apply-discount-btn')?.addEventListener('click', async () => {
    const code = document.getElementById('discount-input').value.trim().toUpperCase();
    const msg = document.getElementById('discount-msg');
    if (!code) return;

    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        msg.textContent = 'Invalid code';
        msg.style.color = 'red';
        return;
      }

      if (data.max_uses && data.used_count >= data.max_uses) {
        msg.textContent = 'Code expired';
        msg.style.color = 'red';
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        msg.textContent = 'Code expired';
        msg.style.color = 'red';
        return;
      }

      appliedDiscount = data;
      msg.textContent = '✓ Discount applied!';
      msg.style.color = 'green';
      calculateTotals();
      toast.success('Discount applied');
    } catch (err) {
      msg.textContent = 'Error validating code';
      msg.style.color = 'red';
    }
  });
}

function setupPaymentMethodToggle() {
  document.querySelectorAll('input[name="payment"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.payment-info').forEach(el => el.style.display = 'none');
      document.getElementById(radio.value + '-details').style.display = 'block';
    });
  });
}

function setupSubmitButtons() {
  document.getElementById('free-claim-btn')?.addEventListener('click', () => submitOrder('free', 'FREE'));

  document.getElementById('paid-submit-btn')?.addEventListener('click', () => {
    const method = document.querySelector('input[name="payment"]:checked')?.value || 'upi';
    const refMap = { upi: 'payment-reference', paypal: 'payment-reference-paypal', bank: 'payment-reference-bank' };
    const ref = document.getElementById(refMap[method])?.value.trim();
    if (!ref) {
      toast.error('Please enter your payment reference/transaction ID');
      return;
    }
    submitOrder(method, ref);
  });
}

async function submitOrder(paymentMethod, paymentReference) {
  const btn = paymentMethod === 'free'
    ? document.getElementById('free-claim-btn')
    : document.getElementById('paid-submit-btn');

  if (btn) { btn.disabled = true; btn.textContent = 'Processing...'; }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    const results = [];

    for (const item of cart) {
      const isFree = item.price === 0;
      const orderData = {
        product_id: item.id,
        buyer_id: user.id,
        seller_id: item.seller_id,
        amount: item.price,
        seller_amount: item.price,
        status: isFree ? 'completed' : 'pending',
        payment_method: isFree ? 'free' : paymentMethod,
        payment_reference: isFree ? 'FREE' : paymentReference,
        discount_code: document.getElementById('discount-input')?.value.trim() || null,
        delivered_at: isFree ? new Date().toISOString() : null
      };

      const { data, error } = await supabase.from('orders').insert(orderData).select().single();
      if (error) throw error;
      results.push(data);

      // If free, increment sales immediately
      if (isFree) {
        await supabase.from('products').update({
          total_sales: supabase.rpc ? undefined : 1
        }).eq('id', item.id);

        // Track analytics
        await supabase.from('analytics_events').insert({
          product_id: item.id,
          user_id: user.id,
          event_type: 'purchase'
        }).catch(() => {});

        // Notify seller
        await supabase.from('notifications').insert({
          user_id: item.seller_id,
          type: 'sale',
          title: 'New Free Claim!',
          body: 'Someone claimed "' + item.title + '" for free',
          link: '/pages/seller/dashboard.html'
        }).catch(() => {});
      } else {
        // Notify seller of pending payment
        await supabase.from('notifications').insert({
          user_id: item.seller_id,
          type: 'sale',
          title: 'Payment Submitted',
          body: 'Payment received for "' + item.title + '" - please confirm',
          link: '/pages/seller/dashboard.html'
        }).catch(() => {});
      }
    }

    // Clear cart
    localStorage.setItem('z3n_cart', '[]');
    const badge = document.getElementById('cart-count');
    if (badge) badge.textContent = '0';

    // Show success
    document.getElementById('checkout-content').style.display = 'none';
    document.getElementById('checkout-success').style.display = 'block';

    const isAllFree = results.every(r => r.status === 'completed');
    if (isAllFree) {
      document.getElementById('success-free').style.display = 'block';
    } else {
      document.getElementById('success-paid').style.display = 'block';
      document.getElementById('success-order-id').textContent = results[0]?.id?.substring(0, 8) || '';
    }

  } catch (err) {
    toast.error('Error: ' + (err.message || 'Something went wrong'));
    if (btn) {
      btn.disabled = false;
      btn.textContent = paymentMethod === 'free' ? 'Claim Free Product' : 'Submit Payment Proof';
    }
  }
}

window.removeItem = function(productId) {
  cart = cart.filter(i => i.id !== productId);
  localStorage.setItem('z3n_cart', JSON.stringify(cart));
  const badge = document.getElementById('cart-count');
  if (badge) badge.textContent = cart.length;
  if (cart.length === 0) { window.location.reload(); return; }
  renderCartItems();
  calculateTotals();
};

document.addEventListener('DOMContentLoaded', initCheckout);
