// Admin users page logic for Z3n Marketplace
import { requireAdmin } from '../../core/auth.js';

async function loadUsers() {
  await requireAdmin();
  // Load users, search, change role
}

document.addEventListener('DOMContentLoaded', loadUsers);
