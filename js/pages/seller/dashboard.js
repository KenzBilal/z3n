// Seller dashboard logic for Z3n Marketplace
import supabase from '../../core/supabase.js';
import toast from '../../components/toast.js';

async function loadSellerDashboard() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href = '/pages/auth/login.html'; return; }

  const main = document.getElementById('seller-dashboard-main');
  if (!main) return;
  main.innerHTML = '<div class="loading-skeleton">Loading seller dashboard...</div>';

  const { data: profile } = await supabase.from('profiles').select('role, display_name, wallet_balance').eq('id', user.id).single();
  if (profile?.role !== 'seller' && profile?.role !== 'admin') { window.location.href = '/pages/buyer/dashboard.html'; return; }

  try {
    const { data: products } = await supabase.from('products').select('id, status, total_sales, total_revenue, slug').eq('seller_id', user.id);
    const activeProducts = products?.filter(p => p.status === 'active').length || 0;
    const pendingProducts = products?.filter(p => p.status === 'pending').length || 0;
    const totalRevenue = products?.reduce((s, p) => s + Number(p.total_revenue || 0), 0) || 0;
    const totalSales = products?.reduce((s, p) => s + (p.total_sales || 0), 0) || 0;

    const { data: orders } = await supabase.from('orders').select('id, amount, seller_amount, created_at, status, products(title, thumbnail_url), profiles!orders_buyer_id_fkey(username, display_name)').eq('seller_id', user.id).order('created_at', { ascending: false }).limit(5);

    // Pending confirmations
    const { data: pendingOrders } = await supabase
      .from('orders')
      .select('id, amount, payment_reference, payment_method, created_at, products(title, thumbnail_url), profiles!orders_buyer_id_fkey(username, display_name)')
      .eq('seller_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    const topProducts = [...(products || [])].sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0)).slice(0, 3);

    main.innerHTML = `
      <div class="dashboard-header">
        <h1>Seller Dashboard</h1>
        <a href="/pages/seller/new-product.html" class="btn-primary">New Product</a>
      </div>
      <div class="dashboard-stats">
        <div class="stat-card"><span class="stat-value">$${totalRevenue.toFixed(2)}</span><span class="stat-label">Total Revenue</span></div>
        <div class="stat-card"><span class="stat-value">${totalSales}</span><span class="stat-label">Total Sales</span></div>
        <div class="stat-card"><span class="stat-value">${activeProducts}</span><span class="stat-label">Active Products</span></div>
        <div class="stat-card"><span class="stat-value">${pendingProducts}</span><span class="stat-label">Pending Approval</span></div>
        <div class="stat-card"><span class="stat-value">$${Number(profile?.wallet_balance || 0).toFixed(2)}</span><span class="stat-label">Wallet Balance</span></div>
      </div>
      ${pendingOrders?.length ? `
        <section class="dashboard-section pending-section">
          <h2>Pending Confirmations (${pendingOrders.length})</h2>
          <div id="pending-confirmations">
            ${pendingOrders.map(o => `
              <div class="pending-order" id="pending-${o.id}">
                <img src="${o.products?.thumbnail_url || ''}" width="50" height="50" alt="" onerror="this.style.display='none'">
                <div class="pending-info">
                  <strong>${o.products?.title || 'Unknown'}</strong>
                  <p>By: ${o.profiles?.display_name || o.profiles?.username}</p>
                  <p>Amount: $${Number(o.amount).toFixed(2)}</p>
                  <p>Method: ${o.payment_method} | Ref: ${o.payment_reference || 'N/A'}</p>
                  <p>Time: ${new Date(o.created_at).toLocaleString()}</p>
                </div>
                <div class="pending-actions">
                  <button onclick="confirmOrder('${o.id}')" class="btn-primary btn-small">Confirm</button>
                  <button onclick="rejectOrder('${o.id}')" class="btn-danger btn-small">Reject</button>
                </div>
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}
      <section class="dashboard-section">
        <h2>Recent Orders</h2>
        ${!orders?.length ? '<p>No sales yet. Share your products!</p>' : `
          <div class="orders-list">
            ${orders.map(o => `
              <div class="order-row">
                <img src="${o.products?.thumbnail_url || ''}" alt="" width="40" height="40" style="object-fit:cover" onerror="this.style.display='none'">
                <span>${o.products?.title || 'Unknown'}</span>
                <span>${o.profiles?.display_name || o.profiles?.username || 'Unknown'}</span>
                <span>$${Number(o.seller_amount || o.amount).toFixed(2)}</span>
                <span>${new Date(o.created_at).toLocaleDateString()}</span>
                <span class="status-${o.status}">${o.status}</span>
              </div>
            `).join('')}
          </div>
        `}
        <a href="/pages/seller/analytics.html">View all analytics</a>
      </section>
      <section class="dashboard-section">
        <h2>Top Products</h2>
        ${topProducts.length === 0 ? '<p>No products yet. <a href="/pages/seller/new-product.html">Create one!</a></p>' : `
          <div class="product-grid">
            ${topProducts.map(p => '<a href="/pages/product.html?slug=' + p.slug + '" class="product-card"><span>' + (p.status === 'active' ? '✓' : '⏳') + '</span><span>$' + Number(p.total_revenue || 0).toFixed(2) + ' revenue</span><span>' + (p.total_sales || 0) + ' sales</span></a>').join('')}
          </div>
        `}
      </section>
    `;
  } catch (err) {
    main.innerHTML = '<p class="error-state">Failed to load dashboard</p>';
    toast.error('Failed to load dashboard');
  }
}

window.confirmOrder = async function(orderId) {
  try {
    const { data: order } = await supabase.from('orders').select('buyer_id, seller_id, product_id, amount, seller_amount, products(title)').eq('id', orderId).single();

    const { error } = await supabase.from('orders').update({ status: 'completed', payment_status: 'completed', delivered_at: new Date().toISOString() }).eq('id', orderId);
    if (error) throw error;

    // Track purchase analytics
    await supabase.from('analytics_events').insert({ product_id: order.product_id, user_id: order.buyer_id, event_type: 'purchase' }).catch(() => {});

    // Notify buyer
    await supabase.from('notifications').insert({
      user_id: order.buyer_id,
      type: 'sale',
      title: 'Access Granted!',
      body: 'Your purchase of "' + (order.products?.title || 'product') + '" has been confirmed. Download now!',
      link: '/pages/buyer/library.html'
    }).catch(() => {});

    toast.success('Order confirmed! Buyer notified.');
    document.getElementById('pending-' + orderId)?.remove();
  } catch (err) {
    toast.error('Failed to confirm order');
  }
};

window.rejectOrder = async function(orderId) {
  const reason = prompt('Reason for rejection (shown to buyer):');
  if (!reason) return;

  try {
    const { data: order } = await supabase.from('orders').select('buyer_id, products(title)').eq('id', orderId).single();

    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);

    await supabase.from('notifications').insert({
      user_id: order.buyer_id,
      type: 'system',
      title: 'Payment Not Verified',
      body: 'Your order was cancelled: ' + reason,
      link: '/pages/buyer/orders.html'
    }).catch(() => {});

    toast.info('Order rejected. Buyer notified.');
    document.getElementById('pending-' + orderId)?.remove();
  } catch (err) {
    toast.error('Failed to reject order');
  }
};

document.addEventListener('DOMContentLoaded', loadSellerDashboard);
