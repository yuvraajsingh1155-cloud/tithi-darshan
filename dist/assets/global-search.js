/* Crawlable public pages are indexed from the build. All results local
   and curated: no personal details sent to analytics or a remote search API. */
(() => {
  'use strict';
  const form=document.getElementById('universal-search-form');
  if(!form)return;
  const input=document.getElementById('global-search-input');
  const grid=document.getElementById('search-results-grid');
  const title=document.getElementById('search-heading');
  const count=document.getElementById('search-count');
  const loading=document.getElementById('search-loading');
  const empty=document.getElementById('search-no-results');
  const normalize=str=>String(str||'').toLocaleLowerCase('en-IN')
    .normalize('NFKC').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const aliases=[
    [/\b(ekadashi|ekadasi)\b/g,' एकादशी '],
    [/\b(aaj|aj|today)\b/g,' आज '],
    [/\b(tithi|thithi)\b/g,' तिथि '],
    [/\b(panchang|panchanga)\b/g,' पंचांग '],
    [/\b(rahu|rahukal|rahu kaal)\b/g,' राहुकाल '],
    [/\b(kundli|kundali)\b/g,' कुंडली '],
    [/\b(rashi|rashifal|horoscope)\b/g,' राशिफल '],
    [/\b(aarti|arti)\b/g,' आरती '],
    [/\b(hanuman|hanumaan)\b/g,' हनुमान '],
    [/\b(hardoi)\b/g,' हरदोई '],
    [/\b(lucknow)\b/g,' लखनऊ '],
    [/\b(varanasi|banaras)\b/g,' वाराणसी '],
    [/\b(choghadiya|chogadia)\b/g,' चौघड़िया ']
  ];
  function expand(value){
    let output=' '+normalize(value)+' ';
    for(const [pattern,replacement] of aliases)output=output.replace(pattern,replacement);
    return normalize(output);
  }
  let index=[];
  let meta={};
  function draw(query){
    const q=expand(query).slice(0,120);
    const terms=q.split(/\s+/).filter(Boolean);
    const scores=[];
    for(const item of index){
      const name=expand(item.title);
      const key=expand(item.search||'');
      const description=expand(item.description);
      if(terms.length&&terms.some(t=>!name.includes(t)&&!key.includes(t)&&!description.includes(t)))continue;
      let score=0;
      for(const t of terms)score+=name.includes(t)?8:key.includes(t)?4:1;
      scores.push({item,score});
    }
    scores.sort((a,b)=>b.score-a.score||a.item.title.localeCompare(b.item.title,'hi'));
    const date=/^\d{4}-\d{2}-\d{2}$/.exec(query.trim());
    if(date&&meta.range&&date[0]>=meta.range.start&&date[0]<=meta.range.end){
      const city=window.TithiPrefs?.get()?.preferred_city||'delhi';
      scores.unshift({item:{
        title:date[0]+' का पंचांग',
        url:'/panchang/'+city+'/'+date[0]+'/',
        description:'आपके चुने शहर की इस तारीख की गणना आधारित तिथि और मुहूर्त',
        category:'तारीख'
      },score:100});
    }
    grid.replaceChildren();
    const matches=scores.slice(0,20);
    for(const {item} of matches){
      if(!item.url?.startsWith('/')||item.url.startsWith('//'))continue;
      const link=document.createElement('a');
      link.className='search-result-card';link.href=item.url;
      const label=document.createElement('small');label.className='kicker';label.textContent=item.category;
      const name=document.createElement('strong');name.textContent=item.title;
      const description=document.createElement('span');description.textContent=item.description;
      link.append(label,name,description);
      grid.append(link);
    }
    const shown=grid.childElementCount;
    title.textContent=q?'खोज के परिणाम':'सुझाए गए विषय';
    count.textContent=shown+' परिणाम दिख रहे हैं';
    empty.hidden=shown!==0;
  }
  async function load(){
    try{
      const response=await fetch('/search-index.json',{cache:'no-store'});
      if(!response.ok)throw Error('Index unavailable');
      const data=await response.json();
      if(!Array.isArray(data.items))throw Error('Index invalid');
      index=data.items.filter(x=>typeof x.title==='string'&&
        typeof x.description==='string'&&typeof x.url==='string'&&typeof x.category==='string');
      meta=data;
      loading.hidden=true;
      draw(input.value);
    }catch{
      loading.textContent='खोज सूची अभी उपलब्ध नहीं है। इंटरनेट कनेक्शन जाँचकर पेज दोबारा खोलें।';
      grid.replaceChildren();
    }
  }
  const params=new URLSearchParams(location.search);
  input.value=(params.get('q')||'').slice(0,120);
  form.addEventListener('submit',event=>{
    event.preventDefault();
    const value=input.value.trim();
    history.replaceState(null,'',value?'/khoj/?q='+encodeURIComponent(value):'/khoj/');
    draw(value);
  });
  input.addEventListener('input',()=>{if(index.length)draw(input.value);});
  void load();
})();