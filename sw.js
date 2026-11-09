'use strict';
const CACHE_NAME='mathe-november-v4-20261109';
const ASSETS=['./','./index.html','./styles.css','./app.js','./learning_content.js','./learning_extension.js','./mixed_mode.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./flags/de.svg','./flags/fr.svg','./flags/it.svg','./flags/nl.svg','./flags/at.svg','./flags/pl.svg','./flags/be.svg','./flags/ua.svg','./flags/ie.svg','./flags/jp.svg','./flags/se.svg','./flags/ch.svg','./flags/dk.svg','./flags/fi.svg','./flags/lu.svg','./flags/ee.svg'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('mathe-november-')&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin) return;
  event.respondWith(fetch(request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));}
    return response;
  }).catch(()=>caches.match(request).then(cached=>cached||caches.match('./index.html'))));
});
