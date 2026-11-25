/* Shared local accessibility and navigation preferences — no tracking or private tokens. */
(() => {
  'use strict';
  const KEY='tithi-darshan:preferences:v1';
  const defaults=Object.freeze({theme:'system',font_scale:1,high_contrast:false,reduced_motion:false,preferred_city:'delhi',time_format:'24h',nav_language:'hi'});
  const cities=new Set(['delhi','lucknow','varanasi','mumbai','kolkata','jaipur','bengaluru','patna','hardoi','prayagraj','kanpur','bhopal']);
  const allowed={theme:new Set(['light','dark','system']),time_format:new Set(['12h','24h']),nav_language:new Set(['hi','en'])};
  const storage=()=>{
    try{const raw=localStorage.getItem(KEY);return raw?JSON.parse(raw):{};}catch{return {};}
  };
  function normalize(data){
    const x={...defaults};
    if(!data||typeof data!=='object'||Array.isArray(data))return x;
    for(const key of Object.keys(allowed))if(allowed[key].has(data[key]))x[key]=data[key];
    if(cities.has(data.preferred_city))x.preferred_city=data.preferred_city;
    if(typeof data.font_scale==='number'&&Number.isFinite(data.font_scale))x.font_scale=Math.min(1.3,Math.max(.85,Math.round(data.font_scale*100)/100));
    for(const key of ['high_contrast','reduced_motion'])if(typeof data[key]==='boolean')x[key]=data[key];
    return x;
  }
  let prefs=normalize(storage());
  const dictionary={
    home:['आज का पंचांग','Today'],calendar:['मासिक कैलेंडर','Calendar'],articles:['लेख','Articles'],
    kundli:['कुंडली मिलान','Kundli Milan'],rashi:['राशिफल','Horoscope'],cities:['शहर','Cities'],
    account:['मेरा अकाउंट','My account'],settings:['सेटिंग्स','Settings'],deities:['देवी-देवता','Deities'],
    more:['मेन्यू','Menu'],theme:['थीम बदलें','Change theme'],search:['खोजें','Search']
  };
  function apply(){
    const prefersDark=window.matchMedia?.('(prefers-color-scheme: dark)').matches||false;
    const mode=prefs.theme==='system'?(prefersDark?'dark':'light'):prefs.theme;
    const root=document.documentElement;
    root.dataset.theme=mode;
    root.dataset.themeMode=prefs.theme;
    root.dataset.contrast=prefs.high_contrast?'high':'normal';
    root.dataset.motion=prefs.reduced_motion?'reduce':'normal';
    root.style.setProperty('--ui-font-scale',String(prefs.font_scale));
    root.lang=prefs.nav_language==='en'?'hi':'hi'; // Hindi article content remains Hindi.
    document.querySelectorAll('[data-i18n]').forEach(node=>{
      const translations=dictionary[node.dataset.i18n];
      if(translations)node.textContent=translations[prefs.nav_language==='en'?1:0];
    });
    document.querySelectorAll('[data-preferred-panchang]').forEach(link=>{
      if(link.tagName==='A'){
        const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
        const match=/\d{4}-\d{2}-\d{2}/.exec(date);
        link.href=match?'/panchang/'+prefs.preferred_city+'/'+match[0]+'/':'/';
      }
    });
    document.querySelectorAll('[data-clock]').forEach(node=>{
      const raw=node.getAttribute('data-clock')||'';
      const match=/^(\d{1,2}):(\d{2})$/.exec(raw);
      if(!match){node.textContent=raw;return;}
      const hour=Number(match[1]);
      if(prefs.time_format==='12h')node.textContent=String(hour%12||12).padStart(2,'0')+':'+match[2]+' '+(hour<12?'AM':'PM');
      else node.textContent=String(hour).padStart(2,'0')+':'+match[2];
    });
    const toggle=document.getElementById('theme-toggle');
    if(toggle){toggle.textContent=mode==='dark'?'☾':'☀';toggle.setAttribute('aria-label','थीम बदलें: '+prefs.theme);toggle.title='Theme: '+prefs.theme;}
    const form=document.getElementById('website-settings');
    if(form){
      for(const key of Object.keys(defaults)){
        const control=form.elements.namedItem(key);
        if(!control)continue;
        if(control.type==='checkbox')control.checked=prefs[key];
        else control.value=String(prefs[key]);
      }
      const preview=document.getElementById('settings-preview');
      if(preview)preview.textContent='थीम: '+(mode==='dark'?'Dark':'Light')+' · शहर: '+(form.elements.namedItem('preferred_city')?.selectedOptions[0]?.textContent||'');
    }
    try{document.dispatchEvent(new CustomEvent('tithi:preferences-changed',{detail:{...prefs}}));}catch{}
  }
  function set(next){
    prefs=normalize({...prefs,...next});
    try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch{}
    apply();
  }
  function reset(){prefs={...defaults};try{localStorage.removeItem(KEY);}catch{}apply();}
  window.TithiPrefs=Object.freeze({get:()=>({...prefs}),set,reset,defaults});
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change',()=>{if(prefs.theme==='system')apply();});
  document.addEventListener('DOMContentLoaded',apply,{once:true});
})();