(() => {
  if (window.__YFA_SITE_BADGE__) return;
  window.__YFA_SITE_BADGE__ = true;
  const cfg=window.YFA_MOTHERSHIP;if(!cfg)return;
  const base=`${cfg.supabaseUrl}/storage/v1/object/public/${cfg.bucket}/`;
  const url=`${base}system/brand-badge.json?v=${Math.floor(Date.now()/60000)}`;
  const defaults={enabled:true,label:'Official YourFavAlien site',color:'#1d9bf0'};

  function css(color){
    if(document.getElementById('yfa-site-badge-css'))return;
    const s=document.createElement('style');s.id='yfa-site-badge-css';
    s.textContent=`.yfa-official-wrap{display:inline-flex!important;align-items:center!important;gap:.18em!important}.yfa-official-badge{display:inline-grid;place-items:center;flex:0 0 auto;width:.72em;height:.72em;min-width:15px;min-height:15px;max-width:23px;max-height:23px;border-radius:50%;background:${color};color:#fff;font-family:Arial,sans-serif;font-size:.48em;font-weight:900;line-height:1;vertical-align:middle;box-shadow:0 0 0 1px rgba(255,255,255,.15);transform:translateY(.02em)}.yfa-official-badge::before{content:'✓'} .yfa-official-badge[data-small='1']{width:17px;height:17px;font-size:10px}`;
    document.head.appendChild(s);
  }

  function score(el){
    const text=(el.textContent||'').trim().toLowerCase().replace(/^@/,'').replace(/\s+/g,' ');
    if(!text)return 0;
    if(text==='yourfavalien'||text==='yourrfavalien'||text==='your fav alien')return 100;
    if(text.includes('yourfavalien')||text.includes('yourrfavalien')||text.includes('your fav alien'))return 70;
    return 0;
  }

  function apply(data){
    if(data.enabled===false)return;
    const color=/^#[0-9a-f]{6}$/i.test(data.color||'')?data.color:defaults.color;
    css(color);
    if(/^\/mothership(?:\/|$)/i.test(location.pathname))return;
    const candidates=[...document.querySelectorAll('h1,h2,.brand,.logo,.wordmark,[class*="brand"],[class*="logo"]')]
      .filter(el=>!el.closest('#yfa-orbit-popup-host'));
    const ranked=candidates.map(el=>({el,s:score(el)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s);
    const seen=new Set();
    ranked.slice(0,3).forEach(({el})=>{
      if(seen.has(el)||el.querySelector('.yfa-official-badge'))return;seen.add(el);
      el.classList.add('yfa-official-wrap');
      const badge=document.createElement('span');badge.className='yfa-official-badge';badge.setAttribute('role','img');badge.setAttribute('aria-label',data.label||defaults.label);badge.title=data.label||defaults.label;
      if(getComputedStyle(el).fontSize&&parseFloat(getComputedStyle(el).fontSize)<22)badge.dataset.small='1';
      el.appendChild(badge);
    });
  }

  fetch(url).then(r=>r.ok?r.json():defaults).then(d=>apply({...defaults,...d})).catch(()=>apply(defaults));
})();
