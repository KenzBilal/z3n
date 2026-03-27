// Search bar logic for Z3n Marketplace
import { debounce } from '../core/utils.js';
import { getSearchSuggestions } from '../api/search.js';

function setupSearchBar() {
  const container = document.getElementById('nav-search-bar');
  if (!container) return;

  container.innerHTML = `
    <div class="search-bar-wrapper">
      <input type="text" id="nav-search" placeholder="Search products..." autocomplete="off">
      <div id="search-suggestions" class="search-suggestions" style="display:none"></div>
    </div>
  `;

  const input = document.getElementById('nav-search');
  const suggestionsDiv = document.getElementById('search-suggestions');

  if (!input || !suggestionsDiv) return;

  const showSuggestions = debounce(async () => {
    const query = input.value.trim();
    if (query.length < 2) {
      suggestionsDiv.style.display = 'none';
      return;
    }

    const suggestions = await getSearchSuggestions(query);
    if (!suggestions || suggestions.length === 0) {
      suggestionsDiv.style.display = 'none';
      return;
    }

    suggestionsDiv.innerHTML = suggestions.map(s =>
      `<div class="suggestion-item" data-title="${s.title}">${s.title}</div>`
    ).join('');
    suggestionsDiv.style.display = '';

    suggestionsDiv.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        input.value = item.dataset.title;
        suggestionsDiv.style.display = 'none';
        window.location.href = `/pages/search.html?q=${encodeURIComponent(item.dataset.title)}`;
      });
    });
  }, 300);

  input.addEventListener('input', showSuggestions);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      suggestionsDiv.style.display = 'none';
      window.location.href = `/pages/search.html?q=${encodeURIComponent(input.value.trim())}`;
    }
  });

  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      suggestionsDiv.style.display = 'none';
    }
  });
}

export default {
  setupSearchBar
};
