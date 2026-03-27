// Admin users page logic for Z3n Marketplace
import supabase from '../../core/supabase.js';
import toast from '../../components/toast.js';

let allUsers = [];

async function loadUsers() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href = '/pages/auth/login.html'; return; }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') { window.location.href = '/pages/index.html'; return; }

  const main = document.getElementById('admin-users-main');
  if (!main) return;
  main.innerHTML = '<div class="loading-skeleton">Loading users...</div>';

  try {
    const { data: users, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    allUsers = users || [];

    main.innerHTML = `
      <div class="page-header"><h1>Manage Users (${count || 0} total)</h1></div>
      <div class="search-bar">
        <input type="text" id="user-search" placeholder="Search by username...">
      </div>
      <div id="users-list">
        <table class="data-table">
          <thead><tr><th>User</th><th>Role</th><th>Total Sales</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody id="users-tbody">${renderUserRows(allUsers)}</tbody>
        </table>
      </div>
    `;

    let searchTimer;
    document.getElementById('user-search')?.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(async () => {
        const query = e.target.value.trim();
        if (!query) {
          document.getElementById('users-tbody').innerHTML = renderUserRows(allUsers);
          attachRoleListeners();
          return;
        }
        const { data: filtered } = await supabase
          .from('profiles')
          .select('*')
          .ilike('username', '%' + query + '%')
          .limit(20);
        document.getElementById('users-tbody').innerHTML = renderUserRows(filtered || []);
        attachRoleListeners();
      }, 300);
    });

    attachRoleListeners();
  } catch (err) {
    main.innerHTML = '<p class="error-state">Failed to load users</p>';
    toast.error('Failed to load users');
  }
}

function renderUserRows(users) {
  return users.map(u => `
    <tr>
      <td><strong>${u.display_name || u.username || 'Unknown'}</strong><br><small>@${u.username || ''}</small></td>
      <td>
        <select class="role-select" data-id="${u.id}">
          <option value="buyer" ${u.role === 'buyer' ? 'selected' : ''}>Buyer</option>
          <option value="seller" ${u.role === 'seller' ? 'selected' : ''}>Seller</option>
          <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
      </td>
      <td>${u.total_sales || 0}</td>
      <td>${u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}</td>
      <td>${u.username ? '<a href="/pages/storefront/index.html?username=' + u.username + '" class="btn-small">View</a>' : ''}</td>
    </tr>
  `).join('');
}

function attachRoleListeners() {
  document.querySelectorAll('.role-select').forEach(select => {
    select.addEventListener('change', async () => {
      const { error } = await supabase.from('profiles').update({ role: select.value }).eq('id', select.dataset.id);
      if (error) { toast.error('Failed to update role'); return; }
      toast.success('Role updated');
    });
  });
}

document.addEventListener('DOMContentLoaded', loadUsers);
