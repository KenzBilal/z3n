// Simple client-side router for Z3n Marketplace
const listeners = [];

function navigate(path) {
  window.location.hash = path;
  listeners.forEach(cb => cb(getCurrentPath()));
}

function getCurrentPath() {
  return window.location.hash.replace(/^#/, '') || '/';
}

function onRouteChange(callback) {
  listeners.push(callback);
  window.addEventListener('hashchange', () => callback(getCurrentPath()));
}

export { navigate, getCurrentPath, onRouteChange };
