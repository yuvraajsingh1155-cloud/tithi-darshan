(() => {
  'use strict';
  const stage=document.getElementById('dashboard-stage');
  if(!stage)return;
  const prefs=window.TithiPrefs;
  const names={delhi:'दिल्ली',lucknow:'लखनऊ',varanasi:'वाराणसी',mumbai:'मुंबई',kolkata:'कोलकाता',jaipur:'जयपुर',bengaluru:'बेंगलुरु',patna:'पटना',hardoi:'हरदोई',prayagraj:'प्रयागराज',kanpur:'कानपुर',bhopal:'भोपाल'};
  const date=document.getElementById('dashboard-day');
  if(date)date.textContent=new Intl.DateTimeFormat('hi-IN',{
    timeZone:'Asia/Kolkata',weekday:'long',day:'numeric',month:'long',year:'numeric'
  }).format(new Date());
  function city(){
    const selected=prefs?.get()?.preferred_city||'delhi';
    const label=document.getElementById('dashboard-city');
    if(label)label.textContent=names[selected]||'शहर नहीं चुना';
  }
  city();
  document.addEventListener('tithi:preferences-changed',city);
  const toggle=document.getElementById('dashboard-sidebar-toggle');
  const key='tithi-darshan:dashboard-compact';
  function setCollapsed(collapsed){
    stage.classList.toggle('td-sidebar-collapsed',Boolean(collapsed));
    if(toggle){
      toggle.setAttribute('aria-pressed',String(Boolean(collapsed)));
      const span=toggle.querySelector('span');
      if(span)span.textContent=collapsed?'मेन्यू बड़ा करें':'मेन्यू छोटा करें';
      toggle.title=collapsed?'डैशबोर्ड मेन्यू खोलें':'डैशबोर्ड मेन्यू छोटा करें';
    }
  }
  try{setCollapsed(localStorage.getItem(key)==='yes');}catch{setCollapsed(false)}
  toggle?.addEventListener('click',()=>{
    const next=!stage.classList.contains('td-sidebar-collapsed');
    setCollapsed(next);
    try{localStorage.setItem(key,next?'yes':'no');}catch{}
  });
  document.getElementById('dashboard-sidebar-logout')?.addEventListener('click',()=>{
    document.getElementById('auth-signout')?.click();
  });
})();