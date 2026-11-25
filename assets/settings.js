(() => {
  'use strict';
  const form=document.getElementById('website-settings');
  const prefs=window.TithiPrefs;
  if(!form||!prefs)return;
  const message=document.getElementById('sync-status');
  const syncButton=document.getElementById('sync-prefs');
  const setMessage=text=>{if(message)message.textContent=text;};
  const project='https://ipqejplvpmznhhtcmozz.supabase.co';
  const key='sb_publishable_y1vGfmJdnj9V9vc7KSWvqw_agNwvhW-';
  let client=null;
  if(window.supabase?.createClient){
    client=window.supabase.createClient(project,key);
  }
  for(const element of form.querySelectorAll('input[name],select[name]')){
    element.addEventListener('change',()=>{
      const value=element.type==='checkbox'?element.checked:
        element.name==='font_scale'?Number(element.value):element.value;
      prefs.set({[element.name]:value});
      setMessage('सेटिंग्स इस डिवाइस पर सुरक्षित हैं। अकाउंट सिंक के लिए नीचे बटन दबाएँ।');
    });
  }
  document.getElementById('reset-prefs')?.addEventListener('click',()=>{
    if(!confirm('इस डिवाइस की सभी वेबसाइट सेटिंग्स रीसेट करनी हैं?'))return;
    prefs.reset();
    setMessage('इस डिवाइस की सेटिंग्स डिफ़ॉल्ट पर लौट आईं। अकाउंट सेटिंग्स नहीं बदली गईं।');
  });
  async function getAuthedUser(){
    if(!client)return null;
    const {data,error}=await client.auth.getUser();
    return error?null:data?.user||null;
  }
  syncButton?.addEventListener('click',async()=>{
    if(!client){setMessage('अकाउंट सर्विस नहीं मिली। इंटरनेट जाँचें।');return;}
    syncButton.disabled=true;
    setMessage('अकाउंट के साथ सेटिंग्स सिंक हो रही हैं…');
    try{
      const user=await getAuthedUser();
      if(!user){setMessage('अकाउंट में सेव करने के लिए पहले Google Login करें।');return;}
      const {error}=await client.from('user_preferences').upsert({
        user_id:user.id,...prefs.get(),updated_at:new Date().toISOString()
      },{onConflict:'user_id'});
      if(error)throw error;
      setMessage('✓ सेटिंग्स आपके निजी अकाउंट में सुरक्षित हो गईं।');
    }catch(err){setMessage('सिंक सफल नहीं हुआ: '+(err.message||'दोबारा प्रयास करें।'));}
    finally{syncButton.disabled=false;}
  });
  // Account settings only load if the user deliberately visits Settings signed in.
  // Local preferences are the fallback when offline or unauthenticated.
  if(client)void getAuthedUser().then(async user=>{
    if(!user)return;
    const {data,error}=await client.from('user_preferences').select(
      'theme,font_scale,high_contrast,reduced_motion,preferred_city,time_format,nav_language'
    ).eq('user_id',user.id).maybeSingle();
    if(error){setMessage('डिवाइस सेटिंग्स सक्रिय हैं। अकाउंट सेटिंग्स नहीं पढ़ पाए।');return;}
    if(data){prefs.set({...data,font_scale:Number(data.font_scale)});setMessage('✓ आपके अकाउंट की सेव की हुई सेटिंग्स लोड हो गई हैं।');}
  }).catch(()=>setMessage('डिवाइस सेटिंग्स सक्रिय हैं। अकाउंट सिंक की जाँच नहीं हो पाई।'));
})();