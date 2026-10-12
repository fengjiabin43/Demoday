const SCOPE = self.registration.scope;
const CACHE = `glint-content-v3:${SCOPE}`;
const ASSETS=['./','./icon.svg',...['V01','V02','V03'].flatMap(id=>[`./media/${id}.mp4`,`./media/${id}.vtt`,`./media/${id}.png`])].map(url=>new URL(url,SCOPE).href);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(async cache=>{await Promise.allSettled(ASSETS.map(url=>cache.add(url)));await self.skipWaiting();})));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',event=>{if(event.data?.type==='CACHE_URLS')event.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled(event.data.urls.map(url=>cache.add(url)))));});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||!event.request.url.startsWith(SCOPE))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  // Native video controls request byte ranges; offline cached full videos support them too.
  const range=event.request.headers.get('range');
  if(range){const cached=await cache.match(event.request.url,{ignoreVary:true});if(cached){const data=await cached.arrayBuffer();const match=range.match(/^bytes=(\d+)-(\d*)$/);if(match){const start=Number(match[1]),end=match[2]?Math.min(Number(match[2]),data.byteLength-1):data.byteLength-1;if(start>=data.byteLength||start>end)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${data.byteLength}`}});return new Response(data.slice(start,end+1),{status:206,headers:{'Content-Type':'video/mp4','Content-Length':String(end-start+1),'Content-Range':`bytes ${start}-${end}/${data.byteLength}`,'Accept-Ranges':'bytes'}});}}}
  try{const response=await fetch(event.request);if(response.status===200)await cache.put(event.request,response.clone());return response;}
  catch{const cached=await cache.match(event.request,{ignoreVary:true});if(cached)return cached;if(event.request.mode==='navigate'){const shell=await cache.match(SCOPE,{ignoreVary:true});if(shell)return shell;}return new Response('当前内容尚未缓存，请联网后重试。',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});}
 })());
});
