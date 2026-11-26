(() => {
  'use strict';
  const url = 'https://ipqejplvpmznhhtcmozz.supabase.co';
  // Supabase publishable key is expressly public; never place secret/service_role keys here.
  const publishableKey = 'sb_publishable_y1vGfmJdnj9V9vc7KSWvqw_agNwvhW-';
  const $ = id => document.getElementById(id);
  const authPanel = $('auth-panel'), profilePanel = $('profile-panel');
  if (!authPanel || !profilePanel) return;
  const authMessage = $('auth-message'), profileMessage = $('profile-message');
  const msg = (node, text) => {node.textContent = text;};
  let client, mode = 'signin', currentUser = null, userLoadVersion = 0;
  if (!window.supabase?.createClient) {
    msg(authMessage, 'लॉगिन लाइब्रेरी अभी लोड नहीं हुई। इंटरनेट कनेक्शन जाँचकर पेज रीफ्रेश करें।');
    $('auth-submit').disabled = true;
    return;
  }
  client = window.supabase.createClient(url, publishableKey, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
  });
  window.TithiSupabaseClient=client;
  // Password reveal controls are explicit, keyboard-accessible and never log values.
  for(const [passwordId,buttonId] of [
    ['auth-password','toggle-auth-password'],
    ['reset-new-password','toggle-reset-password']
  ]){
    const field=$(passwordId),button=$(buttonId);
    if(!field||!button)continue;
    button.addEventListener('click',()=>{
      const showing=field.type==='password';
      field.type=showing?'text':'password';
      button.textContent=showing?'पासवर्ड छिपाएँ':'पासवर्ड दिखाएँ';
      button.setAttribute('aria-pressed',String(showing));
    });
  }
  const googleButton = $('google-signin');
  const googleStatus = $('google-provider-status');
  if (googleButton) {
    googleButton.disabled = true;
    // Auth settings are public and queried with the publishable key only.
    // A disabled Google provider must not redirect visitors into a dead login.
    void fetch(url + '/auth/v1/settings', {
      headers: { apikey: publishableKey, accept: 'application/json' }
    }).then(async response=>{
      if(!response.ok) throw new Error('Settings unavailable');
      const settings=await response.json();
      const enabled=settings.external?.google === true;
      googleButton.disabled=!enabled;
      if(googleStatus)googleStatus.textContent=enabled
        ? 'Google Login उपलब्ध है। ऊपर क्लिक करके सुरक्षित साइन इन करें।'
        : 'Google Login अभी Supabase में चालू नहीं किया गया है। वेबसाइट संचालक के सक्रिय करते ही यह बटन काम करने लगेगा।';
    }).catch(()=>{
      googleButton.disabled=false;
      if(googleStatus)googleStatus.textContent='Google Login की स्थिति सत्यापित नहीं हुई। कोशिश करने पर त्रुटि मिले तो बाद में पुनः प्रयास करें।';
    });
    googleButton.addEventListener('click', async () => {
      googleButton.disabled = true;
      msg(authMessage, 'Google Login खोला जा रहा है…');
      try {
        const { error } = await client.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: location.origin + '/mera-account/' }
        });
        if (error) throw error;
      } catch (error) {
        msg(authMessage, 'Google Login शुरू नहीं हो सका: ' + (error.message || 'कृपया फिर प्रयास करें।'));
        googleButton.disabled = false;
      }
    });
  }
  const loadReports = async (user, seq) => {
    const box=$('reports-list');
    if(!box)return;
    const {data,error}=await client.from('saved_kundli_reports')
      .select('id,report_title,report_data,rule_version,created_at')
      .eq('user_id',user.id).order('created_at',{ascending:false}).limit(30);
    if(seq!==userLoadVersion||currentUser?.id!==user.id)return;
    box.replaceChildren();
    if(error){box.textContent='रिपोर्ट अभी लोड नहीं हुई: '+error.message;return;}
    if(!data?.length){box.classList.add('td-dashboard-empty');box.textContent='अभी कोई मिलान रिपोर्ट सेव नहीं है। ऊपर 36 गुण मिलान से नई रिपोर्ट बना सकते हैं।';return;}
    for(const report of data){
      const item=document.createElement('div');item.className='saved-report-item';
      const txt=document.createElement('span');
      const score=report.report_data?.total;
      txt.textContent=report.report_title+' — '+(Number.isFinite(score)?score+' / '+(report.report_data?.maximum||18):'स्कोर उपलब्ध नहीं')+' ('+(report.report_data?.complete_36?'8-कूट मिलान':'आंशिक मिलान')+')';
      const del=document.createElement('button');del.type='button';del.textContent='हटाएँ';del.className='auth-link';
      del.addEventListener('click',async()=>{
        if(!confirm('क्या इस निजी रिपोर्ट को हटाना चाहते हैं?'))return;
        del.disabled=true;
        const {error:deleteError}=await client.from('saved_kundli_reports').delete().eq('id',report.id).eq('user_id',user.id);
        if(deleteError){del.disabled=false;alert(deleteError.message);}else item.remove();
      });
      item.append(txt,del);box.append(item);
    }
  };
  const loadBookmarks = async (user, seq) => {
    const box=$('bookmarks-list');
    if(!box)return;
    const {data,error}=await client.from('user_bookmarks').select('article_slug,created_at')
      .eq('user_id',user.id).order('created_at',{ascending:false}).limit(100);
    if(seq!==userLoadVersion||currentUser?.id!==user.id)return;
    box.replaceChildren();
    if(error){box.textContent='बुकमार्क नहीं लोड हुए: '+error.message;return;}
    const total=$('dashboard-bookmark-count');
    if(total)total.textContent=String(data?.length||0)+' लेख';
    if(!data?.length){box.classList.add('td-dashboard-empty');box.textContent='अभी कोई लेख सेव नहीं है। पसंदीदा लेख खोलकर बुकमार्क करें।';return;}
    for(const entry of data){
      if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.article_slug))continue;
      const item=document.createElement('div');item.className='saved-report-item';
      const link=document.createElement('a');link.href='/lekh/'+entry.article_slug+'/';
      link.textContent=entry.article_slug.replaceAll('-',' ')+' ↗';link.className='auth-link';
      const del=document.createElement('button');del.type='button';del.textContent='हटाएँ';del.className='auth-link';
      del.addEventListener('click',async()=>{
        del.disabled=true;
        const {error:removeError}=await client.from('user_bookmarks').delete()
          .eq('user_id',user.id).eq('article_slug',entry.article_slug);
        if(removeError){del.disabled=false;del.textContent='फिर प्रयास करें';}
        else item.remove();
      });
      item.append(link,del);box.append(item);
    }
  };
  const showUser = async user => {
    const seq = ++userLoadVersion;
    currentUser = user;
    const loginStage=$('auth-stage'),dashboardStage=$('dashboard-stage');
    if (!user) {
      profilePanel.hidden=true;
      if(dashboardStage)dashboardStage.hidden=true;
      if(loginStage)loginStage.hidden=false;
      authPanel.hidden=false;
      document.dispatchEvent(new Event('tithi:auth-changed'));
      return;
    }
    authPanel.hidden=true;
    if(loginStage)loginStage.hidden=true;
    if(dashboardStage)dashboardStage.hidden=false;
    profilePanel.hidden=false;
    $('account-email').textContent = user.email || '';
    $('account-name').textContent = '';
    const initial=$('account-initial');
    const avatar=$('account-avatar');
    const identity=String(user.user_metadata?.full_name||user.email||'ॐ').trim();
    if(initial)initial.textContent=(identity[0]||'ॐ').toLocaleUpperCase('hi-IN');
    if(avatar){
      avatar.querySelector('img')?.remove();
      // Only use Google's returned OAuth avatar, not arbitrary profile URLs.
      const raw=user.user_metadata?.avatar_url||user.user_metadata?.picture;
      try{
        const u=new URL(String(raw||''));
        if(u.protocol==='https:' && /(^|\.)googleusercontent\.com$/.test(u.hostname)){
          const image=document.createElement('img');
          image.src=u.href;image.alt='Google प्रोफाइल फोटो';
          image.loading='lazy';image.referrerPolicy='no-referrer';
          avatar.prepend(image);
          image.addEventListener('load',()=>{if(initial)initial.hidden=true;});
          image.addEventListener('error',()=>{image.remove();if(initial)initial.hidden=false;});
        }
      }catch{/* Initial avatar remains available. */}
      if(initial)initial.hidden=false;
    }
    const {data,error} = await client.from('profiles')
      .select('display_name,preferred_rashi').eq('user_id',user.id).maybeSingle();
    if (seq !== userLoadVersion || currentUser?.id !== user.id) return;
    if (error) {
      msg(profileMessage,'प्रोफाइल अभी लोड नहीं हुई: '+error.message);
      return;
    }
    $('profile-name').value = data?.display_name || '';
    $('profile-rashi').value = data?.preferred_rashi || '';
    $('account-name').textContent = data?.display_name || '';
    const welcome=$('dashboard-welcome-name');
    if(welcome)welcome.textContent=data?.display_name||
      user.user_metadata?.full_name||user.email?.split('@')[0]||'मित्र';
    const fav=$('dashboard-rashi');
    const rashiNames={mesh:'मेष',vrishabh:'वृषभ',mithun:'मिथुन',kark:'कर्क',
      singh:'सिंह',kanya:'कन्या',tula:'तुला',vrishchik:'वृश्चिक',
      dhanu:'धनु',makar:'मकर',kumbh:'कुंभ',meen:'मीन'};
    if(fav)fav.textContent=rashiNames[data?.preferred_rashi]||'राशि नहीं चुनी';
    await Promise.all([loadReports(user,seq),loadBookmarks(user,seq)]);
    document.dispatchEvent(new Event('tithi:auth-changed'));
  };
  const setMode = next => {
    mode = next;
    const isSignup = mode === 'signup';
    $('auth-title').textContent = isSignup ? 'नया अकाउंट बनाएँ' : 'ईमेल से लॉगिन';
    $('auth-submit').textContent = isSignup ? 'अकाउंट बनाएँ' : 'लॉगिन करें';
    $('auth-password').setAttribute('autocomplete',isSignup?'new-password':'current-password');
    document.querySelectorAll('[data-auth-mode]').forEach(b => {
      b.classList.toggle('active',b.dataset.authMode===next);
      b.setAttribute('aria-pressed',String(b.dataset.authMode===next));
    });
    msg(authMessage,isSignup?'ईमेल पर पुष्टि लिंक आएगा; अपना इनबॉक्स जाँचें।':'अपना ईमेल और पासवर्ड भरें।');
  };
  document.querySelectorAll('[data-auth-mode]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.authMode)));
  $('auth-form').addEventListener('submit',async event => {
    event.preventDefault();
    const email = $('auth-email').value.trim();
    const password = $('auth-password').value;
    const button = $('auth-submit');
    if (!email || password.length < 8 || password.length > 128) {msg(authMessage,'सही ईमेल और कम से कम 8 अक्षरों का पासवर्ड लिखें।');return;}
    button.disabled = true;
    msg(authMessage,'कृपया प्रतीक्षा करें…');
    try {
      const {data,error} = mode === 'signup'
        ? await client.auth.signUp({email,password,options:{emailRedirectTo:location.origin+'/mera-account/'}})
        : await client.auth.signInWithPassword({email,password});
      if (error) throw error;
      if (mode === 'signup' && !data.session) {
        msg(authMessage,'यदि यह ईमेल रजिस्टर हो सकता है, तो पुष्टि लिंक भेजा गया है। इनबॉक्स और स्पैम फोल्डर जाँचें।');
      } else if (data.user) {
        await showUser(data.user);
        msg(authMessage,'लॉगिन सफल।');
      }
    } catch(e) {msg(authMessage,'लॉगिन में समस्या: '+(e.message||'दोबारा प्रयास करें।'));}
    finally {button.disabled=false;}
  });
  $('profile-form').addEventListener('submit',async event => {
    event.preventDefault();
    if (!currentUser) return;
    const name = $('profile-name').value.trim();
    if (name.length > 80) {msg(profileMessage,'नाम 80 अक्षरों से कम रखें।');return;}
    const rashi = $('profile-rashi').value || null;
    const button = $('profile-submit');
    button.disabled = true;
    msg(profileMessage,'प्रोफाइल सेव की जा रही है…');
    const {error}=await client.from('profiles').upsert({
      user_id:currentUser.id,display_name:name||null,preferred_rashi:rashi,updated_at:new Date().toISOString()
    },{onConflict:'user_id'});
    button.disabled=false;
    if(error)msg(profileMessage,'प्रोफाइल सेव नहीं हुई: '+error.message);
    else {
      $('account-name').textContent=name;
      const welcome=$('dashboard-welcome-name');
      if(welcome)welcome.textContent=name||currentUser?.user_metadata?.full_name||currentUser?.email?.split('@')[0]||'मित्र';
      const fav=$('dashboard-rashi');
      if(fav)fav.textContent=rashi?$('profile-rashi').selectedOptions[0]?.textContent:'राशि नहीं चुनी';
      msg(profileMessage,'प्रोफाइल सुरक्षित रूप से सेव हो गई।');
    }
  });
  $('forgot-password').addEventListener('click',async()=>{
    const email=$('auth-email').value.trim();
    if(!email||!$('auth-email').checkValidity()){msg(authMessage,'पासवर्ड रीसेट लिंक के लिए ऊपर अपना सही ईमेल भरें।');return;}
    const button=$('forgot-password');button.disabled=true;
    const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/mera-account/'});
    button.disabled=false;
    if(error)msg(authMessage,'रीसेट ईमेल नहीं भेजा जा सका: '+error.message);
    else msg(authMessage,'यदि यह ईमेल रजिस्टर है, तो पासवर्ड रीसेट लिंक भेज दिया गया है।');
  });
  $('reset-password-form').addEventListener('submit',async ev=>{
    ev.preventDefault();
    const pass=$('reset-new-password').value;
    if(pass.length<8){msg(authMessage,'कम से कम 8 अक्षरों का नया पासवर्ड चुनें।');return;}
    const {error}=await client.auth.updateUser({password:pass});
    if(error)msg(authMessage,'पासवर्ड नहीं बदला: '+error.message);
    else {msg(authMessage,'पासवर्ड बदल गया। अब अपने अकाउंट में लॉगिन कर सकते हैं।');$('reset-password-form').hidden=true;$('reset-new-password').value='';}
  });
  const dataStatus=$('account-data-status');
  $('account-export').addEventListener('click',async()=>{
    if(!currentUser)return;
    const button=$('account-export');button.disabled=true;
    msg(dataStatus,'प्रोफाइल और रिपोर्ट डाउनलोड के लिए तैयार की जा रही हैं…');
    try{
      const userId=currentUser.id;
      const {data:profile,error:profileError}=await client.from('profiles')
        .select('display_name,preferred_rashi,created_at,updated_at')
        .eq('user_id',userId).maybeSingle();
      if(profileError)throw profileError;
      const reports=[];
      for(let offset=0;offset<10000;offset+=500){
        const {data,error}=await client.from('saved_kundli_reports')
          .select('report_title,report_data,rule_version,created_at')
          .eq('user_id',userId).order('created_at',{ascending:false})
          .range(offset,offset+499);
        if(error)throw error;
        if(!data?.length)break;
        reports.push(...data);
        if(data.length<500)break;
      }
      const {data:accountPrefs,error:prefsError}=await client.from('user_preferences')
        .select('theme,font_scale,high_contrast,reduced_motion,preferred_city,time_format,nav_language,updated_at')
        .eq('user_id',userId).maybeSingle();
      if(prefsError)throw prefsError;
      const allBookmarks=[];
      for(let offset=0;offset<10000;offset+=500){
        const {data,error}=await client.from('user_bookmarks')
          .select('article_slug,created_at').eq('user_id',userId)
          .order('created_at',{ascending:false}).range(offset,offset+499);
        if(error)throw error;
        if(!data?.length)break;
        allBookmarks.push(...data);
        if(data.length<500)break;
      }
      const payload={
        service:'Tithi Darshan',
        exported_at:new Date().toISOString(),
        account:{email:currentUser.email,profile,preferences:accountPrefs},
        bookmarks:allBookmarks,
        saved_kundli_reports:reports
      };
      const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});
      const target=URL.createObjectURL(blob);
      try{
        const link=document.createElement('a');
        link.href=target;link.download='tithi-darshan-my-data.json';
        link.style.display='none';document.body.append(link);link.click();link.remove();
      }finally{setTimeout(()=>URL.revokeObjectURL(target),2000);}
      msg(dataStatus,'निजी डेटा डाउनलोड के लिए तैयार है। फाइल अपने डिवाइस में सुरक्षित रखें।');
    }catch(error){
      msg(dataStatus,'डेटा डाउनलोड नहीं हुआ: '+(error.message||'कृपया फिर प्रयास करें।'));
    }finally{button.disabled=false;}
  });
  $('account-delete').addEventListener('click',async()=>{
    if(!currentUser?.email)return;
    const requested=prompt('अकाउंट स्थायी रूप से हटाने के लिए अपना पूरा ईमेल लिखें। यह कदम वापस नहीं होगा।');
    if(requested===null)return;
    if(requested.trim().toLowerCase()!==currentUser.email.trim().toLowerCase()){
      msg(dataStatus,'ईमेल मेल नहीं खाता। अकाउंट सुरक्षित है।');return;
    }
    if(!confirm('क्या आप सचमुच अपना तिथि दर्शन अकाउंट, प्रोफाइल और सारी सेव रिपोर्ट स्थायी रूप से हटाना चाहते हैं?'))return;
    const button=$('account-delete');button.disabled=true;
    msg(dataStatus,'अकाउंट हटाने के अनुरोध की पुष्टि की जा रही है…');
    try{
      const {data,error}=await client.functions.invoke('delete-account',{
        body:{confirmation:'DELETE MY ACCOUNT',email:currentUser.email}
      });
      if(error||data?.deleted!==true)throw error||new Error(data?.error||'Deletion failed');
      try{await client.auth.signOut({scope:'local'});}catch{}
      location.assign('/mera-account/?account_deleted=1');
    }catch(error){
      msg(dataStatus,'अकाउंट नहीं हटाया जा सका। कृपया फिर प्रयास करें या संपर्क पेज से बताएं।');
      button.disabled=false;
    }
  });
  $('auth-signout').addEventListener('click',async () => {
    const {error}=await client.auth.signOut();
    if(error)msg(profileMessage,'लॉगआउट में समस्या: '+error.message);
    else {await showUser(null);msg(authMessage,'आप लॉगआउट हो चुके हैं।');}
  });
  client.auth.onAuthStateChange((event, session) => {
    // Avoid asynchronous Supabase API calls in this callback; it runs under a lock.
    if(event==='PASSWORD_RECOVERY'){
      $('reset-password-form').hidden=false;
      authPanel.hidden=false;
      profilePanel.hidden=true;
      if($('auth-stage'))$('auth-stage').hidden=false;
      if($('dashboard-stage'))$('dashboard-stage').hidden=true;
      msg(authMessage,'अपना नया पासवर्ड भरकर सेव करें।');
      return;
    }
    if(!$('reset-password-form').hidden)return;
    setTimeout(() => {void showUser(session?.user||null);},0);
  });
  void client.auth.getSession().then(async ({data,error})=>{
    if(error) {msg(authMessage,'कनेक्शन में समस्या: '+error.message);return;}
    if (!data.session) {await showUser(null);return;}
    const result=await client.auth.getUser();
    if (result.error) {msg(authMessage,'सत्र की पुष्टि नहीं हुई: '+result.error.message);return;}
    await showUser(result.data.user||null);
  }).catch(e=>msg(authMessage,'लॉगिन सेवा उपलब्ध नहीं: '+e.message));
  if(new URLSearchParams(location.search).get('account_deleted')==='1')
    msg(authMessage,'आपका तिथि दर्शन अकाउंट और उससे जुड़ी निजी रिपोर्ट स्थायी रूप से हटा दी गई हैं।');
})();
