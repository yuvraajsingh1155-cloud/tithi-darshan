/* Real sunrise-vs-current Tithi. All intervals were computed by Swiss Ephemeris
   at build time; this script only selects a verified instant on the client. */
(() => {
  'use strict';
  const body=document.body;
  if(!body||!['home','city','date'].includes(body.dataset.page))return;
  const pageDate=body.dataset.date||'';
  const city=body.dataset.city||'delhi';
  const banner=document.getElementById('freshness-banner');
  const reason=document.getElementById('freshness-reason');
  const current=document.getElementById('current-tithi-card');
  const currentName=document.getElementById('current-tithi-name');
  const detail=document.getElementById('current-tithi-detail');
  const upcoming=document.getElementById('current-tithi-next');
  let segments=[];
  try {
    segments=JSON.parse(document.getElementById('tithi-civil-segments')?.textContent||'[]');
    if(!Array.isArray(segments)||!segments.length)throw Error('Timeline unavailable');
    for(const item of segments){
      if(typeof item.startIso!=='string'||typeof item.endIso!=='string'||
         typeof item.tithi!=='string'||typeof item.paksha!=='string')throw Error('Invalid segment');
    }
  } catch {segments=[];}
  const indianDate=()=>{
    const parts=new Intl.DateTimeFormat('en-GB',{
      timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'
    }).formatToParts(new Date());
    const value=part=>parts.find(x=>x.type===part)?.value;
    return value('year')+'-'+value('month')+'-'+value('day');
  };
  const showStale=message=>{
    body.classList.add('stale-panchang');
    if(banner)banner.hidden=false;
    if(reason)reason.textContent=message;
    if(current)current.hidden=true;
  };
  const fmt=timestamp=>{
    try{return new Intl.DateTimeFormat('hi-IN',{timeZone:'Asia/Kolkata',
      hour:'numeric',minute:'2-digit',hour12:true}).format(new Date(timestamp));}
    catch{return 'समय उपलब्ध नहीं';}
  };
  function renderNow(){
    const today=indianDate();
    if(pageDate!==today){
      if(body.dataset.page==='date'){
        const title=document.querySelector('.hero-main h1');
        if(title)title.textContent=pageDate+' को सूर्योदय की तिथि';
        document.querySelectorAll('.remaining').forEach(el=>{el.hidden=true;});
        if(current)current.hidden=true;
        return;
      }
      showStale('पुराने दिन के पंचांग को आज का पंचांग न मानें। नई तारीख का डेटा खोज रहे हैं।');
      const destination='/panchang/'+encodeURIComponent(city)+'/'+today+'/';
      // Validate that Cloudflare actually serves today's pre-generated page.
      // Never blindly redirect to a 404 or loop on an old cached homepage.
      fetch(destination,{method:'HEAD',cache:'no-store'})
        .then(response=>{
          if(response.ok)location.replace(destination+'?fresh='+Date.now());
          else showStale('आज का ताज़ा पंचांग अभी प्रकाशित नहीं हुआ है। पिछली तिथि को वर्तमान न मानें।');
        }).catch(()=>showStale('ताज़ा पंचांग की पुष्टि नहीं हुई। इंटरनेट लौटने पर फिर जाँचें।'));
      return;
    }
    if(!segments.length){
      showStale('इस दिन की वर्तमान तिथि की जाँची हुई समय-रेखा उपलब्ध नहीं है।');
      return;
    }
    body.classList.remove('stale-panchang');
    if(banner)banner.hidden=true;
    const time=Date.now();
    const active=segments.find(item=>time>=Date.parse(item.startIso)&&time<Date.parse(item.endIso));
    if(!active){
      showStale('वर्तमान खगोलीय तिथि की पुष्टि नहीं हो पा रही है।');
      return;
    }
    if(current)current.hidden=false;
    if(currentName)currentName.textContent=active.paksha+' · '+active.tithi;
    if(detail)detail.textContent='यह अभी चल रही तिथि है; नीचे दिया पंचांग सूर्योदय की तिथि पर आधारित है।';
    if(upcoming){
      const end=Date.parse(active.endIso);
      const last=active===segments[segments.length-1];
      if(last){
        upcoming.textContent='आज आधी रात तक इसके अगले बदलाव का समय इस पेज में नहीं है; अगले दिन का पंचांग देखें।';
      }else{
        const mins=Math.max(0,Math.ceil((end-time)/60000));
        upcoming.textContent='अगली तिथि लगभग '+fmt(active.endIso)+' (IST) से · '+Math.floor(mins/60)+' घंटे '+(mins%60)+' मिनट';
      }
    }
  }
  renderNow();
  // Keep the active Tithi accurate after a transition and after local midnight.
  setInterval(renderNow,30_000);
  if(body.dataset.page==='home'||body.dataset.page==='city'){
    fetch('/build-info.json?check='+Date.now(),{cache:'no-store'})
      .then(response=>response.ok?response.json():Promise.reject(new Error('No build metadata')))
      .then(info=>{
        if(typeof info.indian_date==='string'&&info.indian_date!==indianDate())
          showStale('वेबसाइट का अंतिम जनरेट किया गया डेटा '+info.indian_date+' का है। वर्तमान पंचांग की पुष्टि नहीं हुई।');
      })
      .catch(()=>{/* The verified embedded civil-day segments remain useful; no unsupported claims. */});
  }
})();