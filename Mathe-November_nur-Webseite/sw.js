'use strict';
const CACHE_NAME='mathe-november-v8-20261117-100flaggen-110limit-divisor-max10';
const CORE=['./','./index.html','./styles.css','./app.js','./learning_content.js','./learning_extension.js','./mixed_mode.js','./einmaleins_5min.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
const FLAG_ASSETS=['./flags/de.svg','./flags/at.svg','./flags/ch.svg','./flags/fr.svg','./flags/it.svg','./flags/es.svg','./flags/gb.svg','./flags/us.svg','./flags/nl.svg','./flags/pl.svg','./flags/jp.svg','./flags/se.svg','./flags/be.svg','./flags/dk.svg','./flags/fi.svg','./flags/no.svg','./flags/ie.svg','./flags/pt.svg','./flags/gr.svg','./flags/tr.svg','./flags/ua.svg','./flags/cz.svg','./flags/hr.svg','./flags/hu.svg','./flags/ro.svg','./flags/ru.svg','./flags/cn.svg','./flags/in.svg','./flags/ca.svg','./flags/br.svg','./flags/au.svg','./flags/kr.svg','./flags/mx.svg','./flags/ar.svg','./flags/za.svg','./flags/eg.svg','./flags/ma.svg','./flags/sk.svg','./flags/si.svg','./flags/ee.svg','./flags/lv.svg','./flags/lt.svg','./flags/lu.svg','./flags/is.svg','./flags/rs.svg','./flags/bg.svg','./flags/cy.svg','./flags/mt.svg','./flags/il.svg','./flags/sa.svg','./flags/ae.svg','./flags/id.svg','./flags/th.svg','./flags/vn.svg','./flags/my.svg','./flags/sg.svg','./flags/ph.svg','./flags/pk.svg','./flags/bd.svg','./flags/tw.svg','./flags/nz.svg','./flags/cl.svg','./flags/pe.svg','./flags/co.svg','./flags/cu.svg','./flags/jm.svg','./flags/ng.svg','./flags/ke.svg','./flags/gh.svg','./flags/et.svg','./flags/tn.svg','./flags/dz.svg','./flags/sn.svg','./flags/ci.svg','./flags/cm.svg','./flags/tz.svg','./flags/ug.svg','./flags/zm.svg','./flags/zw.svg','./flags/bw.svg','./flags/na.svg','./flags/mz.svg','./flags/mg.svg','./flags/np.svg','./flags/lk.svg','./flags/mm.svg','./flags/kh.svg','./flags/la.svg','./flags/qa.svg','./flags/ir.svg','./flags/iq.svg','./flags/jo.svg','./flags/lb.svg','./flags/kz.svg','./flags/uz.svg','./flags/mn.svg','./flags/uy.svg','./flags/ec.svg','./flags/ve.svg','./flags/cr.svg'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(async cache=>{
    await cache.addAll(CORE);
    // Kleine Pakete sind auch bei instabilem Mobilnetz robuster.
    for(let i=0;i<FLAG_ASSETS.length;i+=12){
      try{await cache.addAll(FLAG_ASSETS.slice(i,i+12));}
      catch(e){/* Einzelne noch fehlende Flaggen werden beim Aufruf nachgeladen. */}
    }
  }).then(()=>self.skipWaiting()));
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
