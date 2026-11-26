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
  window.TithiUI=Object.freeze({toast});
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
