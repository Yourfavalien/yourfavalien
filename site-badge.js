(() => {
  if (window.__YFA_SITE_BADGE__) return;
  window.__YFA_SITE_BADGE__ = true;
  const cfg=window.YFA_MOTHERSHIP;if(!cfg)return;
  const base=cfg.assetBase;
  const url=`${base}system/brand-badge.json?v=${Math.floor(Date.now()/60000)}`;
  const defaults={enabled:true,label:'Official YourFavAlien site',color:'#1d9bf0'};

  function css(color){
    if(document.getElementById('yfa-site-badge-css'))return;
    const s=document.createElement('style');s.id='yfa-site-badge-css';
    s.textContent=`.yfa-official-wrap{display:inline-flex!important;align-items:center!important;gap:.2em!important}.yfa-official-badge{display:inline-block;flex:0 0 auto;width:.82em;height:.82em;min-width:20px;min-height:20px;max-width:28px;max-height:28px;color:${color};line-height:0;vertical-align:middle;filter:drop-shadow(0 1px 1px rgba(0,0,0,.22));transform:translateY(.02em)}.yfa-official-badge svg{display:block;width:100%;height:100%;overflow:visible}.yfa-official-badge[data-small='1']{width:19px;height:19px;min-width:19px;min-height:19px}`;
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
      badge.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 1.35l2.08 1.7 2.66-.35 1.2 2.4 2.4 1.2-.35 2.66 1.7 2.08-1.7 2.08.35 2.66-2.4 1.2-1.2 2.4-2.66-.35L12 22.65l-2.08-1.7-2.66.35-1.2-2.4-2.4-1.2.35-2.66L2.31 12l1.7-2.08-.35-2.66 2.4-1.2 1.2-2.4 2.66.35z"/><path d="m7.5 12.1 2.85 2.85 6.15-6.1" fill="none" stroke="#fff" stroke-width="2.15" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      if(getComputedStyle(el).fontSize&&parseFloat(getComputedStyle(el).fontSize)<22)badge.dataset.small='1';
      el.appendChild(badge);
    });
  }

  fetch(url).then(r=>r.ok?r.json():defaults).then(d=>apply({...defaults,...d})).catch(()=>apply(defaults));
})();
