/* Conservative public-only offline enhancement. Never cache Supabase/Auth or private pages. */
const CACHE='tithi-public-v2';
const SHELL=['/offline/','/assets/style.css','/assets/premium.css','/assets/site.js','/assets/preferences.js','/assets/favicon.svg'];
const PRIVATE=['/mera-account/','/settings/','/kundli-milan/','/api/','/admin/'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(
    keys.filter(key=>key.startsWith('tithi-public-')&&key!==CACHE).map(key=>caches.delete(key))
  )).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return; // Supabase, Google, CDN always go straight to network
  if(PRIVATE.some(prefix=>url.pathname.startsWith(prefix)))return;
  if(url.pathname.includes('login')||url.pathname.includes('callback')||url.pathname.includes('token'))return;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(response=>{
      if(response.ok&&!url.pathname.startsWith('/panchang/')&&url.pathname!=='/')
        caches.open(CACHE).then(cache=>cache.put(req,response.clone())).catch(()=>{});
      return response;
    }).catch(async()=>{
      const cached=await caches.match(req);
      return cached||await caches.match('/offline/');
    }));
    return;
  }
  if(url.pathname.startsWith('/assets/')&&/\.(css|js|svg|webp|png)$/.test(url.pathname)){
    event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(response=>{
      if(response.ok)caches.open(CACHE).then(cache=>cache.put(req,response.clone())).catch(()=>{});
      return response;
    })));
  }
});
