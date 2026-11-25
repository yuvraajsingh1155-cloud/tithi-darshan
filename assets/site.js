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
      window.TithiPrefs?.set({preferred_city:city});
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

  // Accessible responsive menu, Escape close and outside click.
  const menuToggle=document.getElementById('menu-toggle');
  const header=document.querySelector('.header');
  const primaryNav=document.getElementById('primary-nav');
  const closeMenu=()=>{
    header?.classList.remove('menu-open');
    menuToggle?.setAttribute('aria-expanded','false');
    menuToggle?.setAttribute('aria-label','नेविगेशन मेन्यू खोलें');
  };
  menuToggle?.addEventListener('click',()=>{
    const opened=header?.classList.toggle('menu-open');
    menuToggle.setAttribute('aria-expanded',String(Boolean(opened)));
    menuToggle.setAttribute('aria-label',opened?'नेविगेशन मेन्यू बंद करें':'नेविगेशन मेन्यू खोलें');
  });
  primaryNav?.addEventListener('click',ev=>{
    if(ev.target.closest('a'))closeMenu();
  });
  document.addEventListener('keydown',ev=>{
    if(ev.key==='Escape'){closeMenu();}
  });
  document.addEventListener('click',ev=>{
    if(header&&!header.contains(ev.target))closeMenu();
  });
  document.getElementById('theme-toggle')?.addEventListener('click',()=>{
    const p=window.TithiPrefs;
    if(!p)return;
    const now=p.get().theme;
    p.set({theme:now==='light'?'dark':now==='dark'?'system':'light'});
  });
  const here=location.pathname;
  const active=here.startsWith('/calendar/')?'calendar':
    here.startsWith('/rashifal/')?'rashi':
    here.startsWith('/mera-account/')?'account':
    here.startsWith('/settings/')?'settings':
    (here==='/'||here.startsWith('/panchang/')||here.startsWith('/shehar/'))?'home':null;
  document.querySelectorAll('.mobile-bottom-nav [data-nav-key]').forEach(link=>{
    if(link.dataset.navKey===active)link.setAttribute('aria-current','page');
  });
  // App installability is optional; never cache any private response.
  if('serviceWorker' in navigator && location.protocol==='https:'){
    window.addEventListener('load',()=>{
      navigator.serviceWorker.register('/sw.js').catch(()=>{/* offline is an enhancement */});
    },{once:true});
  }
  document.querySelectorAll('[data-print-page]').forEach(button=>{
    button.addEventListener('click',()=>window.print());
  });
  document.querySelectorAll('[data-share-page]').forEach(button=>{
    button.addEventListener('click',async()=>{
      const link=location.href;
      try{
        if(navigator.share){
          await navigator.share({title:document.title,url:link});
          return;
        }
        if(navigator.clipboard?.writeText){
          await navigator.clipboard.writeText(link);
          button.textContent='✓ लिंक कॉपी हो गया';
        }else{
          const field=document.createElement('textarea');
          field.value=link;field.style.position='fixed';field.style.opacity='0';
          document.body.append(field);field.select();
          const copied=document.execCommand('copy');
          field.remove();
          if(!copied)throw Error('Clipboard not available');
          button.textContent='✓ लिंक कॉपी हो गया';
        }
      }catch(error){
        if(error?.name==='AbortError')return;
        const field=document.createElement('input');field.value=link;
        field.setAttribute('aria-label','इस पेज का लिंक');button.after(field);
        field.select();
        button.textContent='लिंक चुनकर कॉपी करें';
      }
    });
  });

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
