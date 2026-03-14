// Agent search and filter functionality

document.addEventListener('DOMContentLoaded', function() {
  // Language toggle
  const langButtons = document.querySelectorAll('.lang-btn');
  let currentLang = 'en';

  function setLanguage(lang) {
    currentLang = lang;
    
    // Update button states
    langButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    
    // Toggle body class for language
    document.body.classList.toggle('lang-zh', lang === 'zh');
    
    // Store preference
    localStorage.setItem('agent-lang', lang);
  }

  langButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      setLanguage(btn.dataset.lang);
      // Update aria-pressed state
      langButtons.forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === btn.dataset.lang));
    });
  });

  // Restore language preference
  const savedLang = localStorage.getItem('agent-lang');
  if (savedLang) {
    setLanguage(savedLang);
  }

  // Category filter buttons
  const filterButtons = document.querySelectorAll('.filter-btn');
  let currentCategory = 'all';

  // Restore saved category from localStorage
  const savedCategory = localStorage.getItem('agent-category');
  if (savedCategory) {
    currentCategory = savedCategory;
    // Apply the saved category
    filterButtons.forEach(b => {
      const isActive = b.dataset.category === currentCategory;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-pressed', isActive);
    });
  } else {
    // Initialize aria-pressed for "All" button
    filterButtons.forEach(b => {
      b.setAttribute('aria-pressed', b.dataset.category === 'all');
    });
  }

  // Search functionality
  const searchInput = document.getElementById('search-input');
  const agentCards = document.querySelectorAll('.agent-card');
  const noResults = document.getElementById('no-results');

  function applyFilters() {
    // Apply category filter
    agentCards.forEach(card => {
      const cardCategory = card.dataset.category || '';
      const categoryMatch = currentCategory === 'all' || cardCategory === currentCategory;
      
      // Apply search filter
      let searchMatch = true;
      if (searchInput && searchInput.value) {
        const query = searchInput.value.toLowerCase().trim();
        const name = card.dataset.name || '';
        const description = card.dataset.description || '';
        searchMatch = query === '' || name.includes(query) || description.includes(query);
      }
      
      card.style.display = (categoryMatch && searchMatch) ? '' : 'none';
    });

    // Update no results
    const visibleCards = Array.from(agentCards).filter(card => card.style.display !== 'none');
    if (noResults) {
      noResults.style.display = visibleCards.length === 0 ? '' : 'none';
    }
  }

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentCategory = btn.dataset.category;

      // Update button states
      filterButtons.forEach(b => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-pressed', b === btn);
      });

      // Save to localStorage
      localStorage.setItem('agent-category', currentCategory);

      // Apply filters
      applyFilters();
    });
  });

  function filterAgents(query) {
    query = query.toLowerCase().trim();
    let visibleCount = 0;

    agentCards.forEach(card => {
      const name = card.dataset.name || '';
      const description = card.dataset.description || '';
      const category = card.dataset.category || '';
      
      const matches = query === '' || 
        name.includes(query) || 
        description.includes(query) ||
        category.includes(query);
      
      card.style.display = matches ? '' : 'none';
      if (matches) visibleCount++;
    });

    // Show/hide no results message
    if (noResults) {
      noResults.style.display = visibleCount === 0 ? '' : 'none';
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      applyFilters();
    });
    
    // Restore search query from localStorage
    const savedSearch = localStorage.getItem('agent-search');
    if (savedSearch) {
      searchInput.value = savedSearch;
      applyFilters();
    }
    
    searchInput.addEventListener('input', (e) => {
      localStorage.setItem('agent-search', e.target.value);
    });
  }

  function updateNoResults() {
    const visibleCards = Array.from(agentCards).filter(card => card.style.display !== 'none');
    if (noResults) {
      noResults.style.display = visibleCards.length === 0 ? '' : 'none';
    }
  }

  // Initial apply
  applyFilters();

  // Expose filter function globally for external use
  window.filterAgents = filterAgents;
  window.applyFilters = applyFilters;
});
