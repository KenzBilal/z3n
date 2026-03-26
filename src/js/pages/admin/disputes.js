// Admin disputes page logic for Z3n Marketplace
import { requireAdmin } from '../../core/auth.js';

async function loadDisputes() {
  await requireAdmin();
  // Load disputes, resolve
}

document.addEventListener('DOMContentLoaded', loadDisputes);
