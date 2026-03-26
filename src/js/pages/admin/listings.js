// Admin listings review queue logic for Z3n Marketplace
import { requireAdmin } from '../../core/auth.js';

async function loadListings() {
  await requireAdmin();
  // Load pending products, approve/reject
}

document.addEventListener('DOMContentLoaded', loadListings);
