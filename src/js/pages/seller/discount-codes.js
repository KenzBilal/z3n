// Seller discount codes page logic for Z3n Marketplace
import { requireSeller } from '../../core/auth.js';

async function loadDiscountCodes() {
  await requireSeller();
  // Load and manage discount codes
}

document.addEventListener('DOMContentLoaded', loadDiscountCodes);
