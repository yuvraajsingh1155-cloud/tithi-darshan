(() => {
  'use strict';
  const button=document.querySelector('[data-bookmark-article]');
  if(!button)return;
  const slug=button.dataset.bookmarkArticle;
  const status=document.getElementById('bookmark-status');
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return;
  const say=s=>{if(status)status.textContent=s;};
  const cfg={url:'https://ipqejplvpmznhhtcmozz.supabase.co',
    publishable:'sb_publishable_y1vGfmJdnj9V9vc7KSWvqw_agNwvhW-'};
  if(!window.supabase?.createClient){button.disabled=true;say('बुकमार्क सर्विस लोड नहीं हुई।');return;}
  const client=window.supabase.createClient(cfg.url,cfg.publishable);
  let user=null,bookmarked=false;
  const update=()=>{
    button.textContent=bookmarked?'★ बुकमार्क हटाएँ':'☆ लेख सेव करें';
    button.setAttribute('aria-pressed',String(bookmarked));
  };
  update();
  void client.auth.getUser().then(async({data,error})=>{
    if(error||!data?.user){say('लेख सेव करने के लिए लॉगिन करें।');return;}
    user=data.user;
    const {data:row,error:fetchError}=await client.from('user_bookmarks')
      .select('article_slug').eq('user_id',user.id).eq('article_slug',slug).maybeSingle();
    if(fetchError){say('बुकमार्क की स्थिति नहीं मिली।');return;}
    bookmarked=Boolean(row);update();say('');
  }).catch(()=>say('अभी बुकमार्क की स्थिति नहीं मिली।'));
  button.addEventListener('click',async()=>{
    if(!user){location.assign('/mera-account/');return;}
    button.disabled=true;
    try{
      if(bookmarked){
        const {error}=await client.from('user_bookmarks').delete().eq('user_id',user.id).eq('article_slug',slug);
        if(error)throw error;
        bookmarked=false;say('लेख बुकमार्क से हटा दिया गया।');
      }else{
        const {error}=await client.from('user_bookmarks').insert({user_id:user.id,article_slug:slug});
        if(error)throw error;
        bookmarked=true;say('लेख आपके निजी बुकमार्क में सेव हो गया।');
      }
      update();
    }catch(error){say('बुकमार्क नहीं बदल सका। बाद में कोशिश करें।');}
    finally{button.disabled=false;}
  });
})();