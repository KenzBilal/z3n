// Seller dashboard logic for Z3n Marketplace
import { requireSeller } from '../../core/auth.js';

async function loadSellerDashboard() {
  await requireSeller();
  // Load stats, orders, top products
}

document.addEventListener('DOMContentLoaded', loadSellerDashboard);
