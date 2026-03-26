// Seller new product page logic for Z3n Marketplace
import { requireSeller } from '../../core/auth.js';

async function loadNewProduct() {
  await requireSeller();
  // Multi-step form logic
}

document.addEventListener('DOMContentLoaded', loadNewProduct);
