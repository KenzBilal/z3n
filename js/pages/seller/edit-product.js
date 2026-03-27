// Seller edit product page logic for Z3n Marketplace
import supabase from '../../core/supabase.js';
import { formatDate } from '../../core/utils.js';
import toast from '../../components/toast.js';

async function loadEditProduct() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href = '/pages/auth/login.html'; return; }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'seller' && profile?.role !== 'admin') { window.location.href = '/pages/buyer/dashboard.html'; return; }

  const main = document.getElementById('edit-product-main');
  if (!main) return;
  main.innerHTML = '<div class="loading-skeleton">Loading product...</div>';

  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');
  if (!productId) { main.innerHTML = '<p class="error-state">No product specified</p>'; return; }

  try {
    const { data: product, error } = await supabase.from('products').select('*').eq('id', productId).eq('seller_id', user.id).single();
    if (error) throw error;

    const aiModels = ['GPT-4', 'GPT-4o', 'Claude', 'Gemini', 'Midjourney', 'Stable Diffusion', 'DALL-E', 'Llama', 'Mistral', 'Other'];

    main.innerHTML = `
      <div class="page-header"><h1>Edit Product</h1></div>
      <form id="edit-form">
        <div class="form-group">
          <label for="edit-title">Title</label>
          <input type="text" id="edit-title" value="${product.title || ''}" required>
        </div>
        <div class="form-group">
          <label for="edit-description">Short Description (max 160)</label>
          <textarea id="edit-description" maxlength="160">${product.description || ''}</textarea>
        </div>
        <div class="form-group">
          <label for="edit-long-desc">Long Description</label>
          <textarea id="edit-long-desc">${product.long_description || ''}</textarea>
        </div>
        <div class="form-group">
          <label for="edit-preview">Preview Content</label>
          <textarea id="edit-preview">${product.preview_content || ''}</textarea>
        </div>
        <div class="form-group">
          <label for="edit-price">Price ($)</label>
          <input type="number" id="edit-price" value="${product.price}" min="0" step="0.01" required>
        </div>
        <div class="form-group">
          <label for="edit-compare-price">Compare Price ($)</label>
          <input type="number" id="edit-compare-price" value="${product.compare_price || ''}" min="0" step="0.01">
        </div>
        <div class="form-group">
          <label for="edit-demo-url">Demo URL</label>
          <input type="url" id="edit-demo-url" value="${product.demo_url || ''}">
        </div>
        <div class="form-group">
          <label>AI Models</label>
          <div id="ai-models-checkboxes">
            ${aiModels.map(m => '<label class="checkbox-label"><input type="checkbox" value="' + m + '" ' + ((product.ai_models || []).includes(m) ? 'checked' : '') + '> ' + m + '</label>').join('')}
          </div>
        </div>
        <div class="form-group">
          <label for="edit-tags">Tags (comma separated)</label>
          <input type="text" id="edit-tags" value="${(product.tags || []).join(', ')}">
        </div>
        <div class="form-group">
          <label for="edit-status">Status</label>
          <select id="edit-status">
            <option value="active" ${product.status === 'active' ? 'selected' : ''}>Active</option>
            <option value="paused" ${product.status === 'paused' ? 'selected' : ''}>Paused</option>
          </select>
        </div>
        <div class="form-actions">
          <button type="submit" id="edit-submit" class="btn-primary">Save Changes</button>
          <a href="/pages/seller/products.html" class="btn-secondary">Cancel</a>
        </div>
      </form>
    `;

    document.getElementById('edit-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('edit-submit');
      btn.disabled = true;
      btn.textContent = 'Saving...';

      try {
        const tags = document.getElementById('edit-tags').value.split(',').map(t => t.trim()).filter(Boolean);
        const selectedModels = Array.from(document.querySelectorAll('#ai-models-checkboxes input:checked')).map(cb => cb.value);

        const { error } = await supabase.from('products').update({
          title: document.getElementById('edit-title').value.trim(),
          description: document.getElementById('edit-description').value.trim(),
          long_description: document.getElementById('edit-long-desc').value.trim(),
          preview_content: document.getElementById('edit-preview').value.trim(),
          price: parseFloat(document.getElementById('edit-price').value),
          compare_price: document.getElementById('edit-compare-price').value ? parseFloat(document.getElementById('edit-compare-price').value) : null,
          demo_url: document.getElementById('edit-demo-url').value.trim(),
          ai_models: selectedModels,
          tags: tags,
          status: document.getElementById('edit-status').value
        }).eq('id', productId);

        if (error) throw error;
        toast.success('Product updated');
        setTimeout(() => { window.location.href = '/pages/seller/products.html'; }, 1000);
      } catch (err) {
        toast.error(err.message || 'Failed to update');
        btn.disabled = false;
        btn.textContent = 'Save Changes';
      }
    });
  } catch (err) {
    main.innerHTML = '<p class="error-state">Failed to load product</p>';
    toast.error('Failed to load product');
  }
}

document.addEventListener('DOMContentLoaded', loadEditProduct);
