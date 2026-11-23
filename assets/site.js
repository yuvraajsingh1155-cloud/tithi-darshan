(() => {
  'use strict';
  const isoIndia = () => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const get = (part) => parts.find(x => x.type === part).value;
    return `${get('year')}-${get('month')}-${get('day')}`;
  };
  const page = document.body.dataset;
  const form = document.getElementById('findPanchang');
  if (form) {
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const city = document.getElementById('citySelect').value;
      const date = document.getElementById('dateSelect').value;
      if (!/^[a-z-]+$/.test(city) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
      location.assign(`/panchang/${city}/${date}/`);
    });
  }
  const remain = document.querySelector('[data-tithi-end]');
  if (remain) {
    const end = new Date(remain.getAttribute('data-tithi-end')).getTime();
    const diff = end - Date.now();
    if (Number.isFinite(diff)) {
      if (diff <= 0) remain.textContent = 'इस तिथि का समापन हो चुका है; अगली तिथि की पुष्टि करें।';
      else {
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        remain.textContent = `तिथि समाप्त होने में लगभग ${hours} घंटे ${minutes} मिनट शेष`;
      }
    }
  }
  // Homepage fallback: if a scheduled deployment is delayed, never present a
  // yesterday's tithi as "today" to a user. Date pages are pre-generated.
  if (page.page === 'home' && page.date && page.date !== isoIndia()) {
    const today = isoIndia();
    if (/^\d{4}-\d{2}-\d{2}$/.test(today)) {
      location.replace(`/panchang/${page.city || 'delhi'}/${today}/`);
    }
  }

  // All article cards are pre-rendered HTML for crawlers. This enhances
  // the local search experience without sending personal queries to a server.
  const articleSearch = document.querySelector('[data-article-search]');
  if (articleSearch) {
    const allCards = [...document.querySelectorAll('[data-article-list] .article-card')];
    const count = document.querySelector('[data-article-count]');
    const empty = document.querySelector('[data-empty-results]');
    const params = new URLSearchParams(location.search);
    articleSearch.value = params.get('q') || '';
    const filterArticles = () => {
      const query = articleSearch.value.toLocaleLowerCase('hi-IN').trim();
      const terms = query.split(/\s+/).filter(Boolean);
      let shown = 0;
      for (const card of allCards) {
        const haystack = (card.dataset.search || '').toLocaleLowerCase('hi-IN');
        const visible = terms.every(term => haystack.includes(term));
        card.hidden = !visible;
        if (visible) shown++;
      }
      if (count) count.textContent = shown + ' लेख मिले';
      if (empty) empty.hidden = shown !== 0;
    };
    articleSearch.addEventListener('input', filterArticles);
    filterArticles();
  }

})();
