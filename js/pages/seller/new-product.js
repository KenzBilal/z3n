// New Product 5-step form logic for Z3N Marketplace
import supabase from '../../core/supabase.js';
import toast from '../../components/toast.js';

const productData = {
  title: '', slug: '', category: '', subcategory: '',
  description: '', long_description: '', preview_content: '',
  price: 0, compare_price: null, demo_url: '',
  ai_models: [], tags: [], is_limited: false,
  max_sales: null, version: '1.0',
  thumbnail_url: '', file_url: '', gallery_urls: []
};

let currentStep = 1;

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function generateSlug(title) {
  const base = slugify(title);
  const suffix = Math.random().toString(36).substr(2, 6);
  return base + '-' + suffix;
}

function showStep(n) {
  document.querySelectorAll('.step').forEach((s, i) => {
    s.style.display = (i === n - 1) ? '' : 'none';
  });
  const bar = document.getElementById('product-progress-bar');
  if (bar) bar.textContent = `Step ${n} of 5`;
}

function validateStep(n) {
  if (n === 1) {
    const title = document.getElementById('step1-title')?.value.trim();
    const category = document.getElementById('step1-category')?.value;
    const desc = document.getElementById('step1-description')?.value.trim();
    if (!title) { toast.error('Title is required'); return false; }
    if (!category) { toast.error('Category is required'); return false; }
    if (!desc) { toast.error('Description is required'); return false; }
    productData.title = title;
    productData.category = category;
    productData.subcategory = document.getElementById('step1-subcategory')?.value || '';
    productData.description = desc;
    productData.slug = generateSlug(title);
  }
  if (n === 2) {
    const longDesc = document.getElementById('step2-long-desc')?.value.trim();
    const preview = document.getElementById('step2-preview')?.value.trim();
    if (!longDesc) { toast.error('Long description is required'); return false; }
    if (!preview) { toast.error('Preview content is required'); return false; }
    productData.long_description = longDesc;
    productData.preview_content = preview;
    productData.price = document.getElementById('step2-free')?.checked ? 0 : parseFloat(document.getElementById('step2-price')?.value || 0);
    productData.compare_price = document.getElementById('step2-compare-price')?.value ? parseFloat(document.getElementById('step2-compare-price').value) : null;
    productData.demo_url = document.getElementById('step2-demo-url')?.value.trim() || '';
    const aiModels = document.querySelectorAll('#step2-ai-models input:checked');
    productData.ai_models = Array.from(aiModels).map(cb => cb.value);
  }
  if (n === 3) {
    // File uploads are optional at this point, they happen on submit
  }
  if (n === 4) {
    const tagsInput = document.getElementById('step4-tags')?.value.trim();
    productData.tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean).slice(0, 10) : [];
    productData.is_limited = document.getElementById('step4-limited')?.checked || false;
    productData.max_sales = productData.is_limited && document.getElementById('step4-max-sales')?.value ? parseInt(document.getElementById('step4-max-sales').value) : null;
    productData.version = document.getElementById('step4-version')?.value || '1.0';
  }
  return true;
}

function nextStep() {
  if (!validateStep(currentStep)) return;
  if (currentStep === 5) return;
  currentStep++;
  showStep(currentStep);
  if (currentStep === 5) renderReview();
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    showStep(currentStep);
  }
}

async function loadCategories() {
  const { data: cats } = await supabase
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .eq('is_active', true)
    .order('sort_order');
  const catSel = document.getElementById('step1-category');
  if (catSel) {
    catSel.innerHTML = '<option value="">Select a category</option>' +
      (cats || []).map(c => `<option value="${c.slug}">${c.icon || ''} ${c.name}</option>`).join('');
  }
}

async function loadSubcategories(parentSlug) {
  const { data: cats } = await supabase
    .from('categories')
    .select('*')
    .eq('parent_id', parentSlug)
    .eq('is_active', true);
  const subSel = document.getElementById('step1-subcategory');
  if (subSel) {
    subSel.innerHTML = '<option value="">Select a subcategory</option>' +
      (cats || []).map(c => `<option value="${c.slug}">${c.name}</option>`).join('');
  }
}

async function uploadThumbnail(file) {
  const ext = file.name.split('.').pop();
  const path = `thumbnails/${Date.now()}.${ext}`;
  const progressBar = document.getElementById('thumbnail-progress');
  if (progressBar) progressBar.style.display = '';

  const { data, error } = await supabase.storage
    .from('thumbnails')
    .upload(path, file, {
      onUploadProgress: (progress) => {
        const pct = (progress.loaded / progress.total) * 100;
        if (progressBar) progressBar.value = pct;
      }
    });
  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('thumbnails')
    .getPublicUrl(path);
  return urlData.publicUrl;
}

async function uploadProductFile(file) {
  const { data: { user } } = await supabase.auth.getUser();
  const path = `${user.id}/${Date.now()}_${file.name}`;
  const progressBar = document.getElementById('file-progress');
  if (progressBar) progressBar.style.display = '';

  const { data, error } = await supabase.storage
    .from('products')
    .upload(path, file, {
      onUploadProgress: (progress) => {
        const pct = (progress.loaded / progress.total) * 100;
        if (progressBar) progressBar.value = pct;
      }
    });
  if (error) throw error;
  return path;
}

async function uploadGalleryImages(files) {
  const urls = [];
  for (const file of files.slice(0, 5)) {
    const ext = file.name.split('.').pop();
    const path = `thumbnails/gallery/${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${ext}`;
    const { error } = await supabase.storage.from('thumbnails').upload(path, file);
    if (error) continue;
    const { data: urlData } = supabase.storage.from('thumbnails').getPublicUrl(path);
    urls.push(urlData.publicUrl);
  }
  return urls;
}

function renderReview() {
  const summary = document.getElementById('review-summary');
  if (!summary) return;
  summary.innerHTML = `
    <div class="review-section">
      ${productData.thumbnail_url ? `<img src="${productData.thumbnail_url}" alt="Thumbnail" class="review-thumb">` : '<p>No thumbnail uploaded</p>'}
    </div>
    <div class="review-section">
      <h3>Title</h3>
      <p>${productData.title}</p>
    </div>
    <div class="review-section">
      <h3>Category</h3>
      <p>${productData.category}${productData.subcategory ? ' > ' + productData.subcategory : ''}</p>
    </div>
    <div class="review-section">
      <h3>Price</h3>
      <p>${productData.price === 0 ? 'Free' : '$' + productData.price.toFixed(2)}</p>
    </div>
    <div class="review-section">
      <h3>Description</h3>
      <p>${productData.description.substring(0, 100)}${productData.description.length > 100 ? '...' : ''}</p>
    </div>
    ${productData.ai_models.length ? `<div class="review-section"><h3>AI Models</h3><p>${productData.ai_models.join(', ')}</p></div>` : ''}
    ${productData.tags.length ? `<div class="review-section"><h3>Tags</h3><p>${productData.tags.join(', ')}</p></div>` : ''}
    ${productData.file_url ? `<div class="review-section"><h3>Product File</h3><p>Uploaded</p></div>` : '<p style="color:orange">No product file uploaded</p>'}
  `;
}

async function submitProduct() {
  if (!validateStep(4)) return;
  const btn = document.getElementById('step5-submit');
  btn.disabled = true;
  btn.textContent = 'Uploading files...';

  try {
    // Upload thumbnail if selected
    const thumbnailInput = document.getElementById('step3-thumbnail');
    if (thumbnailInput?.files[0]) {
      productData.thumbnail_url = await uploadThumbnail(thumbnailInput.files[0]);
    }

    // Upload product file if selected
    const fileInput = document.getElementById('step3-file');
    if (fileInput?.files[0]) {
      productData.file_url = await uploadProductFile(fileInput.files[0]);
    }

    // Upload gallery images
    const galleryInput = document.getElementById('step3-gallery');
    if (galleryInput?.files.length) {
      productData.gallery_urls = await uploadGalleryImages(Array.from(galleryInput.files));
    }

    btn.textContent = 'Submitting...';

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('products')
      .insert({
        seller_id: user.id,
        title: productData.title,
        slug: productData.slug,
        description: productData.description,
        long_description: productData.long_description,
        preview_content: productData.preview_content,
        category: productData.category,
        subcategory: productData.subcategory,
        price: productData.price,
        compare_price: productData.compare_price,
        demo_url: productData.demo_url,
        ai_models: productData.ai_models,
        tags: productData.tags,
        thumbnail_url: productData.thumbnail_url,
        file_url: productData.file_url,
        gallery_urls: productData.gallery_urls,
        is_limited: productData.is_limited,
        max_sales: productData.max_sales,
        version: productData.version,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    toast.success('Product submitted for review!');
    setTimeout(() => {
      window.location.href = '/pages/seller/products.html';
    }, 2000);

  } catch (err) {
    toast.error(err.message || 'Submission failed');
    btn.disabled = false;
    btn.textContent = 'Submit for Review';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  showStep(1);
  loadCategories();

  // Step navigation
  document.getElementById('step1-next')?.addEventListener('click', nextStep);
  document.getElementById('step2-back')?.addEventListener('click', prevStep);
  document.getElementById('step2-next')?.addEventListener('click', nextStep);
  document.getElementById('step3-back')?.addEventListener('click', prevStep);
  document.getElementById('step3-next')?.addEventListener('click', nextStep);
  document.getElementById('step4-back')?.addEventListener('click', prevStep);
  document.getElementById('step4-next')?.addEventListener('click', nextStep);
  document.getElementById('step5-back')?.addEventListener('click', prevStep);

  // Form submit
  document.getElementById('new-product-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    submitProduct();
  });

  // Title → slug live update
  document.getElementById('step1-title')?.addEventListener('input', (e) => {
    const slugEl = document.getElementById('step1-slug');
    if (slugEl) slugEl.textContent = e.target.value ? generateSlug(e.target.value) : 'Auto-generated from title';
  });

  // Description counter
  document.getElementById('step1-description')?.addEventListener('input', (e) => {
    const counter = document.getElementById('desc-counter');
    if (counter) counter.textContent = `${e.target.value.length}/160`;
  });

  // Category change → load subcategories
  document.getElementById('step1-category')?.addEventListener('change', (e) => {
    if (e.target.value) loadSubcategories(e.target.value);
  });

  // Free checkbox
  document.getElementById('step2-free')?.addEventListener('change', (e) => {
    const priceInput = document.getElementById('step2-price');
    if (priceInput) {
      priceInput.style.display = e.target.checked ? 'none' : '';
      if (e.target.checked) priceInput.value = '0';
    }
  });

  // Limited edition checkbox
  document.getElementById('step4-limited')?.addEventListener('change', (e) => {
    const maxSalesLabel = document.getElementById('max-sales-label');
    if (maxSalesLabel) maxSalesLabel.style.display = e.target.checked ? '' : 'none';
  });

  // Thumbnail preview
  document.getElementById('step3-thumbnail')?.addEventListener('change', (e) => {
    const preview = document.getElementById('thumbnail-preview');
    const file = e.target.files[0];
    if (file && preview) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        preview.innerHTML = `<img src="${ev.target.result}" alt="Thumbnail preview" style="max-width:200px;max-height:200px">`;
      };
      reader.readAsDataURL(file);
    }
  });

  // File name display
  document.getElementById('step3-file')?.addEventListener('change', (e) => {
    const filenameEl = document.getElementById('file-filename');
    if (filenameEl && e.target.files[0]) {
      filenameEl.textContent = `Selected: ${e.target.files[0].name}`;
    }
  });

  // Gallery previews
  document.getElementById('step3-gallery')?.addEventListener('change', (e) => {
    const previewDiv = document.getElementById('gallery-previews');
    if (!previewDiv) return;
    previewDiv.innerHTML = '';
    const files = Array.from(e.target.files).slice(0, 5);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = document.createElement('img');
        img.src = ev.target.result;
        img.style.cssText = 'max-width:100px;max-height:100px;margin:4px';
        previewDiv.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  });

  // Tags chips
  document.getElementById('step4-tags')?.addEventListener('input', (e) => {
    const chipsDiv = document.getElementById('tags-chips');
    if (!chipsDiv) return;
    const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean).slice(0, 10);
    chipsDiv.innerHTML = tags.map(t => `<span class="tag-chip">${t}</span>`).join('');
  });
});
