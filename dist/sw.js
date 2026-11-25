/* Tithi Darshan PWA: public editorial content offline, never yesterday as today. */
const CACHE='tithi-public-v3';
const SHELL=['/offline/','/assets/style.css','/assets/premium.css',
  '/assets/site.js','/assets/preferences.js','/assets/favicon.svg'];
const PRIVATE=['/mera-account/','/settings/','/kundli-milan/','/api/','/admin/'];
const TIME_SENSITIVE=['/','/calendar/','/ekadashi/','/shehar/','/panchang/','/rashifal/'];
const isSensitive=pathname=>TIME_SENSITIVE.some(prefix=>prefix==='/'?pathname==='/':pathname.startsWith(prefix));
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
  if(url.origin!==self.location.origin)return; // Never intercept Google or Supabase
  if(PRIVATE.some(prefix=>url.pathname.startsWith(prefix)))return;
  if(url.pathname.includes('login')||url.pathname.includes('callback')||
      url.pathname.includes('token'))return;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req,{cache:'no-store'}).then(response=>{
      // Only public timeless editorial pages can be available offline.
      if(response.ok&&!isSensitive(url.pathname))
        caches.open(CACHE).then(cache=>cache.put(req,response.clone())).catch(()=>{});
      return response;
    }).catch(async()=>{
      if(!isSensitive(url.pathname)){
        const stored=await caches.match(req);
        if(stored)return stored;
      }
      return (await caches.match('/offline/'))||Response.error();
    }));
    return;
  }
  // Scripts and CSS use network-first caching, preventing old functionality
  // from silently persisting across Cloudflare deployments.
  if(url.pathname.startsWith('/assets/')&&/\.(css|js|svg|webp|png)$/.test(url.pathname)){
    event.respondWith(fetch(req).then(response=>{
      if(response.ok)caches.open(CACHE).then(cache=>cache.put(req,response.clone())).catch(()=>{});
      return response;
    }).catch(async()=>await caches.match(req)||Response.error()));
  }
});