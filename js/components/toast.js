// Toast notifications for Z3n Marketplace — globally available
function ensureContainer() {
  let c = document.getElementById('toast-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toast-container';
    c.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
    document.body.appendChild(c);
  }
  return c;
}

function show(type, message, duration) {
  const c = ensureContainer();
  const toast = document.createElement('div');
  const colors = { success: '#22C55E', error: '#EF4444', warning: '#F59E0B', info: '#7B61FF' };
  const icons = { success: '✓', error: '✗', warning: '⚠', info: 'ℹ' };
  toast.style.cssText = 'background:#0A0A0A;border:1px solid ' + colors[type] + ';color:#FFF;padding:12px 16px;border-radius:6px;font-size:14px;display:flex;align-items:center;gap:8px;pointer-events:all;opacity:0;transform:translateX(100%);transition:all 200ms ease;max-width:320px;box-shadow:0 4px 12px rgba(0,0,0,0.5);cursor:pointer;';
  toast.innerHTML = '<span style="color:' + colors[type] + ';font-weight:bold">' + icons[type] + '</span><span>' + message + '</span>';
  c.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(0)'; });
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; setTimeout(() => toast.remove(), 200); }, duration || 4000);
  toast.addEventListener('click', () => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 200); });
}

const toast = {
  success: msg => show('success', msg),
  error: msg => show('error', msg),
  info: msg => show('info', msg),
  warning: msg => show('warning', msg)
};

// Make globally available
window.showToast = (msg, type) => show(type || 'info', msg);
window.toast = toast;

export default toast;
export { show, toast };
