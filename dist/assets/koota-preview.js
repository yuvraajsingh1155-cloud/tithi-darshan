(() => {
  'use strict';
  const nak=['अश्विनी','भरणी','कृत्तिका','रोहिणी','मृगशिरा','आर्द्रा','पुनर्वसु','पुष्य','आश्लेषा','मघा','पूर्वा फाल्गुनी','उत्तरा फाल्गुनी','हस्त','चित्रा','स्वाती','विशाखा','अनुराधा','ज्येष्ठा','मूल','पूर्वाषाढ़ा','उत्तराषाढ़ा','श्रवण','धनिष्ठा','शतभिषा','पूर्वाभाद्रपदा','उत्तराभाद्रपदा','रेवती'];
  const signs=['मेष','वृषभ','मिथुन','कर्क','सिंह','कन्या','तुला','वृश्चिक','धनु','मकर','कुंभ','मीन'];
  const $=id=>document.getElementById(id);
  const form=$('koota-preview');
  if(!form)return;
  const detail=$('koota-result'),saveButton=$('save-koota');
  const submitButton=form.querySelector('button[type="submit"]');
  let lastReport=null,client=null;
  function resetResult(){
    lastReport=null;
    saveButton.hidden=true;
    saveButton.disabled=false;
    saveButton.textContent='रिपोर्ट अपने अकाउंट में सेव करें';
    detail.hidden=true;
    detail.replaceChildren();
  }
  const possibleSigns=i=>{
    const start=i*40/3,end=(i+1)*40/3;
    return Array.from({length:12},(_,s)=>s)
      .filter(s=>start<((s+1)*30-1e-7)&&end>(s*30+1e-7));
  };
  const choose=(el,entries)=>{
    el.replaceChildren(...entries.map(([text,value])=>{
      const option=document.createElement('option');
      option.textContent=text;
      option.value=value;
      return option;
    }));
  };
  for(const id of ['a','b']){
    const n=$('nak-'+id),s=$('sign-'+id);
    choose(n,[['जन्म नक्षत्र चुनें',''],...nak.map((name,i)=>[name,String(i)])]);
    const update=()=>{
      const allowed=n.value===''?signs.map((_,i)=>i):possibleSigns(Number(n.value));
      const old=s.value;
      choose(s,[['चंद्र राशि चुनें',''],...allowed.map(i=>[signs[i],String(i)])]);
      if(allowed.map(String).includes(old))s.value=old;
      resetResult();
    };
    n.addEventListener('change',update);
    s.addEventListener('change',resetResult);
    update();
  }
  const message=(txt,login=false)=>{
    detail.replaceChildren();
    const p=document.createElement('p');p.textContent=txt;detail.append(p);
    if(login){
      const a=document.createElement('a');a.href='/mera-account/';
      a.className='heritage-button';a.textContent='लॉगिन करें ↗';detail.append(a);
    }
    detail.hidden=false;
  };
  function showReport(data,inputs){
    const scores=data?.scores;
    const koots=[['varna','वर्ण',1],['vasya','वश्य',2],['tara','तारा',3],['yoni','योनि',4],['graha_maitri','ग्रह मैत्री',5],['gana','गण',6],['bhakoot','भकूट',7],['nadi','नाड़ी',8]];
    if(data?.maximum!==36||!Number.isFinite(data.total)||!scores||
      koots.some(([key,,max])=>!Number.isFinite(scores[key])||scores[key]<0||scores[key]>max)){
      message('सर्वर से सही गणना नहीं मिली। दोबारा प्रयास करें।');return;
    }
    lastReport={...inputs,scores,total:data.total,maximum:36,
      methodology:'ashtakoota-v1-directional-bride-first',complete_36:true};
    detail.replaceChildren();
    const h=document.createElement('h3');h.textContent='अष्टकूट मिलान: '+data.total+' / 36 अंक';detail.append(h);
    const note=document.createElement('p');
    note.textContent='यह वर-वधू क्रम पर आधारित आठ कूटों का पारंपरिक स्कोर है; स्थानीय नियम, दोष-अपवाद और विस्तृत ग्रह विश्लेषण अलग हो सकते हैं।';
    detail.append(note);
    const table=document.createElement('table');table.className='koota-result-table';
    const tbody=document.createElement('tbody');
    for(const [key,label,max] of koots){
      const tr=document.createElement('tr');
      for(const txt of [label,String(scores[key])+' / '+max]){
        const td=document.createElement('td');td.textContent=txt;tr.append(td);
      }
      tbody.append(tr);
    }
    table.append(tbody);detail.append(table);
    const privacy=document.createElement('p');privacy.className='astro-small';
    privacy.textContent='जन्मतिथि या जन्मस्थान नहीं लिया गया। गणना के लिए चुने नक्षत्र और राशि Supabase के सुरक्षित फ़ंक्शन को भेजे जाते हैं; रिपोर्ट सिर्फ आपके सेव करने पर निजी डेटाबेस में रखी जाएगी।';
    detail.append(privacy);detail.hidden=false;saveButton.hidden=false;
  }
  if(window.supabase?.createClient){
    client=window.supabase.createClient('https://ipqejplvpmznhhtcmozz.supabase.co',
      'sb_publishable_y1vGfmJdnj9V9vc7KSWvqw_agNwvhW-');
  }
  form.addEventListener('submit',async ev=>{
    ev.preventDefault();
    resetResult();
    if(!client){message('सुरक्षित लॉगिन सेवा लोड नहीं हुई। पेज रीफ्रेश करें।');return;}
    const fields=['nak-a','sign-a','nak-b','sign-b'].map(id=>$(id).value);
    if(fields.some(x=>x==='')){message('दोनों व्यक्तियों के जन्म नक्षत्र और चंद्र राशि चुनें।');return;}
    const [na,sa,nb,sb]=fields.map(Number);
    if(!possibleSigns(na).includes(sa)||!possibleSigns(nb).includes(sb)){
      message('जन्म नक्षत्र और चुनी हुई चंद्र राशि आपस में मेल नहीं खाते।');return;
    }
    submitButton.disabled=true;
    message('सुरक्षित गणना शुरू की जा रही है…');
    try{
      const {data:{user},error:authError}=await client.auth.getUser();
      if(authError||!user){message('कुंडली मिलान के लिए पहले अपने अकाउंट में लॉगिन करना जरूरी है।',true);return;}
      const inputs={nakshatra_a:na,moon_sign_a:sa,nakshatra_b:nb,moon_sign_b:sb};
      const {data,error}=await client.functions.invoke('kundli-match',{body:inputs});
      if(error)throw error;
      showReport(data,inputs);
    }catch(err){
      message('गणना अभी उपलब्ध नहीं है। लॉगिन की पुष्टि करके फिर कोशिश करें।');
    }finally{submitButton.disabled=false;}
  });
  saveButton.addEventListener('click',async()=>{
    if(!lastReport||!client)return;
    saveButton.disabled=true;
    const {data:{user},error:authError}=await client.auth.getUser();
    if(authError||!user){saveButton.disabled=false;message('रिपोर्ट सेव करने के लिए लॉगिन करें।',true);return;}
    const title='मिलान: '+nak[lastReport.nakshatra_a]+' · '+nak[lastReport.nakshatra_b];
    const {error}=await client.from('saved_kundli_reports').insert({
      user_id:user.id,report_title:title,report_data:lastReport,rule_version:lastReport.methodology
    });
    if(error){saveButton.disabled=false;message('रिपोर्ट सेव नहीं हुई। फिर प्रयास करें।');return;}
    saveButton.textContent='✓ निजी अकाउंट में सेव हो गया';
  });
})();