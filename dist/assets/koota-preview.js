(() => {
  'use strict';
  const nak = ['अश्विनी','भरणी','कृत्तिका','रोहिणी','मृगशिरा','आर्द्रा','पुनर्वसु','पुष्य','आश्लेषा','मघा','पूर्वा फाल्गुनी','उत्तरा फाल्गुनी','हस्त','चित्रा','स्वाती','विशाखा','अनुराधा','ज्येष्ठा','मूल','पूर्वाषाढ़ा','उत्तराषाढ़ा','श्रवण','धनिष्ठा','शतभिषा','पूर्वाभाद्रपदा','उत्तराभाद्रपदा','रेवती'];
  const signs = ['मेष','वृषभ','मिथुन','कर्क','सिंह','कन्या','तुला','वृश्चिक','धनु','मकर','कुंभ','मीन'];
  const $=id=>document.getElementById(id);
  const form=$('koota-preview');
  if(!form)return;
  const nadiIndex=i=>[0,1,2,2,1,0][i%6];
  const taraScore=(a,b)=>{
    const pass=(x,y)=>{
      const count=((y-x+27)%27)+1;
      return ![3,5,7].includes(((count-1)%9)+1);
    };
    return (pass(a,b)?1.5:0)+(pass(b,a)?1.5:0);
  };
  const bhakootScore=(a,b)=>{
    const distance=((b-a+12)%12)+1;
    return [2,5,6,8,9,12].includes(distance)?0:7;
  };
  // Nakshatra divisions of 13°20' across 12 rashi sectors of 30°.
  // A birth-nakshatra can cross a rashi boundary, so rashi must be selected separately.
  const possibleSigns=i=>{
    const start=i*40/3,end=(i+1)*40/3,opts=[];
    for(let s=0;s<12;s++)if(start<((s+1)*30-1e-7)&&end>(s*30+1e-7))opts.push(s);
    return opts;
  };
  const choose=(el,entries)=>{el.replaceChildren(...entries.map(([text,value])=>{const opt=document.createElement('option');opt.textContent=text;opt.value=value;return opt;}));};
  for(const id of ['a','b']){
    const n=$('nak-'+id),s=$('sign-'+id);
    choose(n,[['जन्म नक्षत्र चुनें',''],...nak.map((name,i)=>[name,String(i)])]);
    const update=()=>{
      const i=Number(n.value);
      const allowed=n.value===''?signs.map((_,i)=>i):possibleSigns(i);
      const old=s.value;
      choose(s,[['चंद्र राशि चुनें',''],...allowed.map(i=>[signs[i],String(i)])]);
      if(allowed.map(String).includes(old))s.value=old;
    };
    n.addEventListener('change',update);
    update();
  }
  const detail=$('koota-result'),saveButton=$('save-koota');
  let lastReport=null;
  const descriptions={
    tara:'जन्म नक्षत्रों की आपसी गणना से प्राप्त पारंपरिक स्कोर।',
    nadi:'एक ही नाड़ी होने पर इस सरल नियम में 0, अलग नाड़ी होने पर 8 अंक। विशेष अपवाद यहाँ शामिल नहीं।',
    bhakoot:'चंद्र राशियों का 2/12, 5/9 या 6/8 संबंध होने पर सरल भकूट नियम में 0 अंक। अपवाद शामिल नहीं।'
  };
  const makeRow=(label,score,max,key)=>{
    const tr=document.createElement('tr');
    for(const value of [label,String(score)+' / '+max,descriptions[key]]){
      const td=document.createElement('td');td.textContent=value;tr.append(td);
    }
    return tr;
  };
  form.addEventListener('submit',ev=>{
    ev.preventDefault();
    const fields=['nak-a','sign-a','nak-b','sign-b'].map(id=>$(id).value);
    if(fields.some(v=>v==='')){detail.hidden=false;detail.textContent='दोनों के जन्म नक्षत्र और चंद्र राशि चुनें।';return;}
    const [na,sa,nb,sb]=fields.map(Number);
    if(!possibleSigns(na).includes(sa)||!possibleSigns(nb).includes(sb)){
      detail.hidden=false;detail.textContent='चुनी हुई चंद्र राशि और नक्षत्र में मेल नहीं है। कृपया सही जानकारी चुनें।';return;
    }
    const tara=taraScore(na,nb),nadi=nadiIndex(na)===nadiIndex(nb)?0:8,bhakoot=bhakootScore(sa,sb);
    const total=tara+nadi+bhakoot;
    lastReport={nakshatra_a:na,nakshatra_b:nb,moon_sign_a:sa,moon_sign_b:sb,
      scores:{tara,nadi,bhakoot},total,maximum:18,
      methodology:'nadi-tara-bhakoot-v1',complete_36:false};
    detail.replaceChildren();
    const h=document.createElement('h3');h.textContent='3 कूटों के परिणाम: '+total+' / 18 अंक';detail.append(h);
    const note=document.createElement('p');note.textContent='ध्यान दें: यह पूरा 36 गुण मिलान नहीं है। शेष 5 कूट (कुल 18 अंक) अभी नहीं निकाले जाते।';detail.append(note);
    const table=document.createElement('table');table.className='koota-result-table';
    const tbody=document.createElement('tbody');
    tbody.append(makeRow('तारा',tara,3,'tara'),makeRow('नाड़ी',nadi,8,'nadi'),makeRow('भकूट',bhakoot,7,'bhakoot'));
    table.append(tbody);detail.append(table);
    const privacy=document.createElement('p');
    privacy.className='astro-small';privacy.textContent='जन्मतिथि या जन्मस्थान नहीं लिया गया। चुने गए नक्षत्र और चंद्र राशि ब्राउज़र में गिने गए हैं। सेव करने पर ही यह परिणाम आपके निजी अकाउंट में जाएगा।';
    detail.append(privacy);detail.hidden=false;
    saveButton.hidden=false;
  });
  saveButton.addEventListener('click',async()=>{
    if(!lastReport)return;
    if(!window.supabase?.createClient){alert('सेव करने की सेवा अभी उपलब्ध नहीं है।');return;}
    const client=window.supabase.createClient('https://ipqejplvpmznhhtcmozz.supabase.co','sb_publishable_y1vGfmJdnj9V9vc7KSWvqw_agNwvhW-');
    const {data:{user},error:authError}=await client.auth.getUser();
    if(authError||!user){location.assign('/mera-account/');return;}
    saveButton.disabled=true;
    const title='मिलान: '+nak[lastReport.nakshatra_a]+' · '+nak[lastReport.nakshatra_b];
    const {error}=await client.from('saved_kundli_reports').insert({
      user_id:user.id,report_title:title,report_data:lastReport,rule_version:'nadi-tara-bhakoot-v1'
    });
    saveButton.disabled=false;
    if(error){alert('रिपोर्ट सेव नहीं हुई: '+error.message);return;}
    saveButton.textContent='✓ निजी अकाउंट में सेव हो गया';
  });
})();