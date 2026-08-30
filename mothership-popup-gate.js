(function () {
  'use strict';
  const cfg = window.YFA_MOTHERSHIP;
  if (!cfg) return;

  function loadScript(src, dataKey) {
    if (document.querySelector(`script[data-${dataKey}]`)) return;
    const script=document.createElement('script');script.src=src;script.defer=true;script.setAttribute(`data-${dataKey}`,'true');document.head.appendChild(script);
  }
  loadScript('/site-enhancements.js?v=20260830-1','yfa-site-enhancements');
  loadScript('/site-complete.js?v=20260830-1','yfa-site-complete');

  const publicBase = `${cfg.supabaseUrl}/storage/v1/object/public/${cfg.bucket}/`;
  const popupPath = cfg.popupPath || 'system/orbit-popup.json';
  const statusUrl = `${publicBase}${popupPath}?v=${Date.now()}`;
  const advancedUrl = `${publicBase}system/site-advanced.json?v=${Date.now()}`;

  function pageKey(){const p=(location.pathname||'/').toLowerCase();if(p==='/'||p==='/index.html')return'home';for(const k of ['about','contact','privacy','socials'])if(p.endsWith('/'+k+'.html'))return k;return'';}
  function enablePopup(){if(document.querySelector('script[data-yfa-orbit-component]'))return;const script=document.createElement('script');script.src='/orbit-popup.js?v=20260830-4';script.defer=true;script.dataset.yfaOrbitComponent='true';document.head.appendChild(script);}

  Promise.all([
    fetch(statusUrl,{cache:'no-store'}).then(r=>r.ok?r.json():{enabled:true}).catch(()=>({enabled:true})),
    fetch(advancedUrl,{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null)
  ]).then(([status,advanced])=>{
    if(status?.enabled===false)return;
    const popup=advanced?.popup||{};
    if(popup.enabled===false)return;
    const allowed=Array.isArray(popup.pages)&&popup.pages.length?popup.pages:['home','about','contact'];
    if(!allowed.includes(pageKey()))return;
    const delay=Math.max(0,Math.min(300,Number(popup.delaySeconds ?? 10)))*1000;
    setTimeout(enablePopup,delay);
  }).catch(()=>setTimeout(enablePopup,10000));
})();