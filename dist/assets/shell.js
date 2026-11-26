/* Tithi Darshan shared application shell — safe, progressive enhancement.
   A local Supabase session key triggers a verification request, not authorization.
   The signed-in header is shown only after Supabase.auth.getUser succeeds. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const cityNames={delhi:'दिल्ली',lucknow:'लखनऊ',varanasi:'वाराणसी',mumbai:'मुंबई',
    kolkata:'कोलकाता',jaipur:'जयपुर',bengaluru:'बेंगलुरु',patna:'पटना',
    hardoi:'हरदोई',prayagraj:'प्रयागराज',kanpur:'कानपुर',bhopal:'भोपाल'};
  const PROJECT='ipqejplvpmznhhtcmozz';
  const URL='https://'+PROJECT+'.supabase.co';
  const PUBLIC_KEY='sb_publishable_y1vGfmJdnj9V9vc7KSWvqw_agNwvhW-';
  let client=null,toastTimer=null;
  function toast(text){
    const node=$('td-toast');
    if(!node)return;
    node.textContent=String(text||'');
    node.hidden=false;
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>{node.hidden=true;node.textContent='';},4200);
  }
  const searchDialog=$('td-search-dialog');
  const searchInput=$('td-command-input');
  const searchResults=$('td-command-results');
  let publicIndex=null,dialogOpener=null;
  const simplify=text=>String(text||'').toLocaleLowerCase('en-IN').normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const synonyms={ekadashi:'एकादशी',tithi:'तिथि',panchang:'पंचांग',
    today:'आज',aaj:'आज',kundli:'कुंडली',rashi:'राशि',shiv:'शिव',
    hanuman:'हनुमान',rahukal:'राहुकाल',hardoi:'हरदोई',lucknow:'लखनऊ'};
  function searchMatches(query){
    const words=simplify(query).split(' ').filter(Boolean).map(word=>synonyms[word]||word);
    const hits=[];
    for(const item of publicIndex||[]){
      if(typeof item.title!=='string'||typeof item.url!=='string')continue;
      if(!item.url.startsWith('/')||item.url.startsWith('//'))continue;
      const title=simplify(item.title),body=simplify(item.search+' '+item.description);
      if(words.some(word=>!title.includes(word)&&!body.includes(word)))continue;
      const score=words.reduce((value,word)=>value+(title.includes(word)?3:1),0);
      hits.push({item,score});
    }
    hits.sort((a,b)=>b.score-a.score||a.item.title.localeCompare(b.item.title,'hi'));
    return hits.slice(0,6).map(hit=>hit.item);
  }
  function paintSearch(){
    if(!searchResults)return;
    searchResults.replaceChildren();
    if(!publicIndex){
      const status=document.createElement('p');status.className='td-command-hint';
      status.textContent='खोज सूची लोड नहीं हुई। संपूर्ण खोज पेज से प्रयास करें।';
      searchResults.append(status);return;
    }
    const query=searchInput?.value||'';
    const matches=searchMatches(query);
    if(!matches.length){
      const status=document.createElement('p');status.className='td-command-hint';
      status.textContent='कोई प्रकाशित परिणाम नहीं मिला। दूसरा शब्द आज़माएँ।';
      searchResults.append(status);return;
    }
    for(const item of matches){
      const link=document.createElement('a');link.href=item.url;
      link.className='td-command-result';
      const label=document.createElement('span');label.className='td-command-kind';
      label.textContent=item.category||'सार्वजनिक पेज';
      const title=document.createElement('strong');title.textContent=item.title;
      const desc=document.createElement('small');desc.textContent=item.description||'';
      link.append(label,title,desc);searchResults.append(link);
    }
  }
  async function openSearch(){
    if(!searchDialog||typeof searchDialog.showModal!=='function'){
      location.assign('/khoj/');return;
    }
    dialogOpener=document.activeElement;
    if(!searchDialog.open)searchDialog.showModal();
    if(searchInput){searchInput.value='';searchInput.focus({preventScroll:true});}
    if(!publicIndex){
      if(searchResults)searchResults.textContent='प्रकाशित पेजों की खोज सूची लोड हो रही है…';
      try{
        const result=await fetch('/search-index.json',{cache:'no-store'});
        if(!result.ok)throw Error('Index unavailable');
        const json=await result.json();
        if(!Array.isArray(json.items))throw Error('Index invalid');
        publicIndex=json.items;
      }catch{publicIndex=null;}
    }
    if(searchDialog.open)paintSearch();
  }
  function closeSearch(){if(searchDialog?.open)searchDialog.close();}
  $('td-search-close')?.addEventListener('click',closeSearch);
  searchDialog?.addEventListener('click',event=>{if(event.target===searchDialog)closeSearch();});
  searchDialog?.addEventListener('close',()=>dialogOpener?.focus?.({preventScroll:true}));
  searchInput?.addEventListener('input',paintSearch);
  searchInput?.addEventListener('keydown',event=>{
    if(event.key==='ArrowDown'){
      const first=searchResults?.querySelector('a');
      if(first){event.preventDefault();first.focus();}
    }
  });
  searchResults?.addEventListener('keydown',event=>{
    if(!['ArrowDown','ArrowUp'].includes(event.key))return;
    const links=[...searchResults.querySelectorAll('a')];
    const index=links.indexOf(document.activeElement);
    if(index<0)return;
    event.preventDefault();
    if(event.key==='ArrowDown')links[Math.min(links.length-1,index+1)]?.focus();
    else if(index===0)searchInput?.focus();
    else links[index-1]?.focus();
  });
  document.querySelector('.td-header-search')?.addEventListener('click',event=>{
    if(searchDialog&&typeof searchDialog.showModal==='function'){
      event.preventDefault();void openSearch();
    }
  });
  window.TithiUI=Object.freeze({toast,openSearch,closeSearch});
  function updateCity(){
    const slug=window.TithiPrefs?.get()?.preferred_city||'delhi';
    const text=$('header-city-label');
    if(text)text.textContent=cityNames[slug]||'पंचांग';
  }
  const profile=$('header-profile');
  const trigger=$('header-profile-trigger');
  const menu=$('header-profile-menu');
  const loggedOut=$('header-account-link');
  function closeProfile(){
    if(menu)menu.hidden=true;
    trigger?.setAttribute('aria-expanded','false');
  }
  function showUser(user){
    if(!profile||!trigger)return;
    const authenticated=Boolean(user?.id);
    profile.hidden=!authenticated;
    if(loggedOut)loggedOut.hidden=authenticated;
    closeProfile();
    if(!authenticated)return;
    const display=String(user.user_metadata?.full_name||user.user_metadata?.name||
       user.email?.split('@')[0]||'मेरा अकाउंट').slice(0,75);
    $('header-profile-name').textContent=display;
    const email=$('header-profile-email');
    if(email)email.textContent=String(user.email||'').slice(0,254);
    const initial=$('header-profile-initial');
    if(initial){
      initial.textContent=(display[0]||'ॐ').toLocaleUpperCase('hi-IN');
      initial.querySelector('img')?.remove();
      // Restrict OAuth avatars to Google's real HTTPS image service.
      const avatar=user.user_metadata?.avatar_url||user.user_metadata?.picture;
      try{
        const parsed=new URL(avatar);
        if(parsed.protocol==='https:'&&
           (parsed.hostname==='googleusercontent.com'||parsed.hostname.endsWith('.googleusercontent.com'))){
          const img=document.createElement('img');
          img.src=parsed.href;
          img.alt='';
          img.loading='lazy';
          img.referrerPolicy='no-referrer';
          img.addEventListener('load',()=>{initial.firstChild?.nodeType===3&&(initial.firstChild.textContent='');});
          img.addEventListener('error',()=>img.remove());
          initial.append(img);
        }
      }catch{/* Keep the meaningful fallback initial. */}
    }
  }
  trigger?.addEventListener('click',()=>{
    if(!menu)return;
    const opening=menu.hidden;
    menu.hidden=!opening;
    trigger.setAttribute('aria-expanded',String(opening));
    if(opening)menu.querySelector('a,button')?.focus({preventScroll:true});
  });
  document.addEventListener('click',event=>{
    if(profile&&!profile.contains(event.target))closeProfile();
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!menu?.hidden){
      closeProfile();trigger?.focus({preventScroll:true});
    }
  });
  async function getLibrary(){
    if(window.supabase?.createClient)return window.supabase;
    if(window.__tithiLoadingSDK)return window.__tithiLoadingSDK;
    window.__tithiLoadingSDK=new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.87.3/dist/umd/supabase.min.js';
      script.async=true;
      script.onload=()=>window.supabase?.createClient?resolve(window.supabase):reject(new Error('Auth unavailable'));
      script.onerror=()=>reject(new Error('Auth script unavailable'));
      document.head.append(script);
    });
    return window.__tithiLoadingSDK;
  }
  async function checkAccount(){
    // Avoid fetching a large auth SDK for entirely logged-out visitors.
    let hasStoredSession=false;
    try{hasStoredSession=Boolean(localStorage.getItem('sb-'+PROJECT+'-auth-token'));}catch{}
    if(!hasStoredSession){showUser(null);return;}
    try{
      const supabase=await getLibrary();
      if(!client)client=window.TithiSupabaseClient||supabase.createClient(URL,PUBLIC_KEY);
      const {data,error}=await client.auth.getUser();
      if(error||!data?.user){showUser(null);return;}
      showUser(data.user);
    }catch{showUser(null);}
  }
  $('header-logout')?.addEventListener('click',async()=>{
    if(!client)return toast('सत्र उपलब्ध नहीं है। अकाउंट पेज खोलें।');
    const button=$('header-logout');
    button.disabled=true;
    try{
      const {error}=await client.auth.signOut();
      if(error)throw error;
      showUser(null);
      location.assign('/mera-account/');
    }catch{
      toast('लॉगआउट नहीं हो पाया। कृपया फिर प्रयास करें।');
      button.disabled=false;
    }
  });
  document.addEventListener('tithi:preferences-changed',updateCity);
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden)void checkAccount();
  });
  document.addEventListener('tithi:auth-changed',()=>{void checkAccount();});
  document.addEventListener('DOMContentLoaded',()=>{
    updateCity();
    void checkAccount();
  },{once:true});
})();
