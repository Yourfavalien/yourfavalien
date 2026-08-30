(function () {
  'use strict';
  const cfg = window.YFA_MOTHERSHIP;
  if (!cfg) return;

  // Preview mode keeps drafts private: the public loaders receive this browser's
  // local Mothership drafts instead of the published JSON configuration.
  if (new URLSearchParams(location.search).get('yfa-preview') === '1' && !window.__YFA_PREVIEW_FETCH__) {
    window.__YFA_PREVIEW_FETCH__ = true;
    const nativeFetch = window.fetch.bind(window);
    window.fetch = function(input, init) {
      const requestUrl = typeof input === 'string' ? input : (input && input.url) || '';
      let key = '';
      if (requestUrl.includes('/system/site-content.json')) key = 'yfa-site-content-draft';
      if (requestUrl.includes('/system/site-advanced.json')) key = 'yfa-site-advanced-draft';
      if (key) {
        try {
          const draft = localStorage.getItem(key);
          if (draft) return Promise.resolve(new Response(draft, { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }));
        } catch (error) {}
      }
      return nativeFetch(input, init);
    };
    const badge=document.createElement('div');badge.textContent='MOTHERSHIP DRAFT PREVIEW';badge.style.cssText='position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:2147483646;background:#090509;color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:999px;padding:8px 12px;font:700 9px Space Mono,monospace;letter-spacing:.1em;box-shadow:0 8px 28px rgba(0,0,0,.35)';document.addEventListener('DOMContentLoaded',()=>document.body.appendChild(badge),{once:true});
  }

  function loadScript(src, dataKey) {
    if (document.querySelector(`script[data-${dataKey}]`)) return;
    const script=document.createElement('script');script.src=src;script.defer=true;script.setAttribute(`data-${dataKey}`,'true');document.head.appendChild(script);
  }
  loadScript('/site-enhancements.js?v=20260830-1','yfa-site-enhancements');
  loadScript('/site-complete.js?v=20260830-3','yfa-site-complete');
  loadScript('/site-badge.js?v=20260830-2','yfa-site-badge');

  const publicBase = `${cfg.supabaseUrl}/storage/v1/object/public/${cfg.bucket}/`;
  const popupPath = cfg.popupPath || 'system/orbit-popup.json';
  const statusUrl = `${publicBase}${popupPath}?v=${Date.now()}`;
  const advancedUrl = `${publicBase}system/site-advanced.json?v=${Date.now()}`;

  function pageKey(){const p=(location.pathname||'/').replace(/\/+$/,'').toLowerCase()||'/';if(p==='/'||p.endsWith('/index.html'))return'home';for(const k of ['about','contact','privacy','socials'])if(p.endsWith('/'+k)||p.endsWith('/'+k+'.html'))return k;return'';}
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
