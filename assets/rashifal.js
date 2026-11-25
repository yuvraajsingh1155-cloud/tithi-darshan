(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const panel=$('daily-rashi-panel'),select=$('daily-rashi');
  if(!panel||!select)return;
  const rashiNames={mesh:'मेष',vrishabh:'वृषभ',mithun:'मिथुन',kark:'कर्क',singh:'सिंह',kanya:'कन्या',tula:'तुला',vrishchik:'वृश्चिक',dhanu:'धनु',makar:'मकर',kumbh:'कुंभ',meen:'मीन'};
  const days=['रविवार','सोमवार','मंगलवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'];
  const practices=[
    'सूर्य को प्रणाम करके दिन के लिए एक सकारात्मक लक्ष्य चुनें।',
    'शांत मन से दिन की योजना बनाएँ और आराम का समय भी रखें।',
    'साहस के साथ जरूरी काम पूरा करें, लेकिन जल्दबाजी से बचें।',
    'सीखने और संवाद में ध्यान दें; किसी की बात पूरी सुनें।',
    'परिवार या मित्रों का धन्यवाद करें और दूसरों की सहायता करें।',
    'अपने काम और खर्च की समीक्षा कर संतुलन बनाए रखें।',
    'सेवा, सफाई या किसी जरूरतमंद के सहयोग के लिए समय निकालें।'
  ];
  const signPrompts={
    mesh:'अपने उत्साह को सोच-समझकर किसी रचनात्मक काम में लगाएँ।',
    vrishabh:'आर्थिक योजनाओं में संतुलन और धैर्य को प्राथमिकता दें।',
    mithun:'खुले संवाद और नई जानकारी को महत्व दें।',
    kark:'परिवार और अपने भावनात्मक स्वास्थ्य का ख्याल रखें।',
    singh:'नेतृत्व के साथ विनम्रता और सहयोग भी अपनाएँ।',
    kanya:'व्यवस्था और दिनचर्या के छोटे सुधारों पर ध्यान दें।',
    tula:'रिश्तों में न्याय और संतुलित संवाद रखें।',
    vrishchik:'अपने लक्ष्यों पर एकाग्र रहें और प्रतिक्रिया सोचकर दें।',
    dhanu:'अध्ययन और व्यापक दृष्टिकोण के लिए समय निकालें।',
    makar:'नियमित प्रयास और जिम्मेदारी से काम करें।',
    kumbh:'नई सोच के साथ दूसरों की उपयोगिता भी देखें।',
    meen:'कल्पनाशीलता और विश्राम में संतुलन बनाए रखें।'
  };
  const dateParts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const part=t=>dateParts.find(p=>p.type===t)?.value;
  const dateStr=part('year')+'-'+part('month')+'-'+part('day');
  const weekday=new Date(dateStr+'T12:00:00+05:30').getDay();
  const render=()=>{const key=select.value;
    if(!rashiNames[key]){panel.hidden=true;return;}
    panel.hidden=false;
    $('rashi-title').textContent=rashiNames[key]+' — '+days[weekday]+' का सकारात्मक विचार';
    $('rashi-date').textContent='दिनांक: '+dateStr+' (भारत)';
    $('rashi-message').textContent=signPrompts[key]+' '+practices[weekday];
  };
  select.addEventListener('change',render);
  const requested=new URLSearchParams(location.search).get('rashi');
  if(requested&&Object.hasOwn(rashiNames,requested)){
    select.value=requested;render();
  }

  // A stored rashi is only a preference. It is NOT an astronomical natal Moon sign.
  if(window.supabase?.createClient){
    const client=window.supabase.createClient('https://ipqejplvpmznhhtcmozz.supabase.co','sb_publishable_y1vGfmJdnj9V9vc7KSWvqw_agNwvhW-');
    void client.auth.getSession().then(async ({data})=>{
      if(!data.session)return;
      const {data:{user}}=await client.auth.getUser();if(!user)return;
      const {data:profile}=await client.from('profiles').select('preferred_rashi').eq('user_id',user.id).maybeSingle();
      if(!requested&&profile?.preferred_rashi&&rashiNames[profile.preferred_rashi]){select.value=profile.preferred_rashi;render();}
    }).catch(()=>{});
  }
})();