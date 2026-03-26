// Toast notifications for Z3n Marketplace
const containerId = 'toast-container';

function ensureContainer() {
  let c = document.getElementById(containerId);
  if (!c) {
    c = document.createElement('div');
    c.id = containerId;
    document.body.appendChild(c);
  }
  return c;
}

function show(type, message) {
  const c = ensureContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  c.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

const toast = {
  success: msg => show('success', msg),
  error: msg => show('error', msg),
  info: msg => show('info', msg),
  warning: msg => show('warning', msg)
};

export default toast;
