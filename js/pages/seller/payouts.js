// Seller payouts page logic for Z3n Marketplace
import { requireSeller } from '../../core/auth.js';

async function loadPayouts() {
  await requireSeller();
  // Load wallet, payout history
}

document.addEventListener('DOMContentLoaded', loadPayouts);
