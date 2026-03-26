// Utility functions for Z3n Marketplace
const formatPrice = amount => `$${(+amount).toFixed(2)}`;
const formatDate = ts => {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
const formatNumber = num => {
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'k';
  return num.toString();
};
const slugify = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const truncate = (text, len) => text.length > len ? text.slice(0, len) + '…' : text;
const debounce = (fn, delay) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
};
const generateAffiliateCode = () => Math.random().toString(36).slice(2, 10).toUpperCase();
const validateEmail = email => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
const getQueryParam = key => new URLSearchParams(window.location.search).get(key);
const setQueryParam = (key, value) => {
  const params = new URLSearchParams(window.location.search);
  params.set(key, value);
  window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
};
const showLoading = id => {
  const el = document.getElementById(id);
  if (el) el.classList.add('loading');
};
const hideLoading = id => {
  const el = document.getElementById(id);
  if (el) el.classList.remove('loading');
};

export {
  formatPrice,
  formatDate,
  formatNumber,
  slugify,
  truncate,
  debounce,
  generateAffiliateCode,
  validateEmail,
  getQueryParam,
  setQueryParam,
  showLoading,
  hideLoading
};
