// Admin dashboard logic for Z3n Marketplace
import { requireAdmin } from '../../core/auth.js';

async function loadAdminDashboard() {
  await requireAdmin();
  // Load admin stats
}

document.addEventListener('DOMContentLoaded', loadAdminDashboard);
