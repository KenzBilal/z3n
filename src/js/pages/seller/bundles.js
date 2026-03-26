// Seller bundles page logic for Z3n Marketplace
import { requireSeller } from '../../core/auth.js';

async function loadBundles() {
  await requireSeller();
  // Load and manage bundles
}

document.addEventListener('DOMContentLoaded', loadBundles);
