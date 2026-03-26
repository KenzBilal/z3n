// Seller affiliates page logic for Z3n Marketplace
import { requireSeller } from '../../core/auth.js';

async function loadAffiliates() {
  await requireSeller();
  // Load affiliate links, stats
}

document.addEventListener('DOMContentLoaded', loadAffiliates);
