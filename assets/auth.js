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
  const googleButton = $('google-signin');
  if (googleButton) {
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
    if(!data?.length){box.textContent='अभी कोई रिपोर्ट नहीं है।';return;}
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
  const showUser = async user => {
    const seq = ++userLoadVersion;
    currentUser = user;
    if (!user) {
      profilePanel.hidden = true;
      authPanel.hidden = false;
      return;
    }
    authPanel.hidden = true;
    profilePanel.hidden = false;
    $('account-email').textContent = user.email || '';
    $('account-name').textContent = '';
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
    await loadReports(user,seq);
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
    else {$('account-name').textContent=name;msg(profileMessage,'प्रोफाइल सुरक्षित रूप से सेव हो गई।');}
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
})();
