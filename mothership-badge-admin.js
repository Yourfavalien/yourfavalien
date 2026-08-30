(() => {
  if (window.__YFA_MOTHERSHIP_BADGE_ADMIN__) return;
  window.__YFA_MOTHERSHIP_BADGE_ADMIN__ = true;

  const cfg = window.YFA_MOTHERSHIP;
  if (!cfg || !window.supabase || !window.supabase.createClient) return;
  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.publishableKey);
  const PATH = 'system/brand-badge.json';
  const base = `${cfg.supabaseUrl}/storage/v1/object/public/${cfg.bucket}/`;
  const publicUrl = () => `${base}${PATH}?v=${Date.now()}`;
  let state = { enabled: true, label: 'Official YourFavAlien site', color: '#1d9bf0' };

  function addCss(){
    if(document.getElementById('yfa-badge-admin-css')) return;
    const s=document.createElement('style');
    s.id='yfa-badge-admin-css';
    s.textContent=`#yfaBadgeControl{margin:0 0 30px;padding:18px;border:1px solid var(--line);border-radius:18px;background:#0a060a}.yfa-badge-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;flex-wrap:wrap}.yfa-badge-title{margin:4px 0 5px!important}.yfa-badge-copy{color:var(--muted);font-size:10px;line-height:1.65;max-width:680px}.yfa-badge-preview{display:inline-flex;align-items:center;gap:8px;padding:8px 11px;border:1px solid var(--line);border-radius:999px;font-size:10px}.yfa-badge-icon{display:inline-grid;place-items:center;width:19px;height:19px;border-radius:50%;background:#1d9bf0;color:#fff;font:700 13px/1 Arial,sans-serif}.yfa-badge-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:15px}.yfa-badge-field{display:grid;gap:6px}.yfa-badge-field label{color:var(--muted);font-size:9px}.yfa-badge-field input{width:100%;padding:10px;border:1px solid var(--line);border-radius:10px;background:#050305;color:var(--ink);font:11px 'Space Mono',monospace}.yfa-badge-check{display:flex;gap:8px;align-items:center;font-size:10px;margin-top:14px}.yfa-badge-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}@media(max-width:650px){.yfa-badge-grid{grid-template-columns:1fr}}`;
    document.head.appendChild(s);
  }

  function render(){
    const panel=document.getElementById('yfaBadgeControl');
    if(!panel)return;
    panel.querySelector('#yfaBadgeEnabled').checked=state.enabled!==false;
    panel.querySelector('#yfaBadgeLabel').value=state.label||'Official YourFavAlien site';
    panel.querySelector('#yfaBadgeColor').value=/^#[0-9a-f]{6}$/i.test(state.color||'')?state.color:'#1d9bf0';
    const icon=panel.querySelector('.yfa-badge-icon');
    icon.style.background=panel.querySelector('#yfaBadgeColor').value;
    panel.querySelector('#yfaBadgePreviewText').textContent=state.label||'Official YourFavAlien site';
  }

  async function load(){
    try{const r=await fetch(publicUrl(),{cache:'no-store'});if(r.ok)state={...state,...await r.json()};}catch{}
    render();
  }

  async function save(){
    const panel=document.getElementById('yfaBadgeControl');
    const status=panel.querySelector('#yfaBadgeStatus');
    state={enabled:panel.querySelector('#yfaBadgeEnabled').checked,label:panel.querySelector('#yfaBadgeLabel').value.trim()||'Official YourFavAlien site',color:panel.querySelector('#yfaBadgeColor').value,updatedAt:new Date().toISOString()};
    status.textContent='Saving badge…';status.className='status';
    try{
      const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
      await client.storage.from(cfg.bucket).remove([PATH]);
      const {error}=await client.storage.from(cfg.bucket).upload(PATH,blob,{cacheControl:'60',contentType:'application/json',upsert:false});
      if(error)throw error;
      status.textContent='Official-site badge saved.';status.className='status ok';render();
    }catch(error){status.textContent=error.message||'Could not save badge.';status.className='status error';}
  }

  function init(){
    addCss();
    const dashboard=document.getElementById('dashboard');
    if(!dashboard||document.getElementById('yfaBadgeControl'))return;
    const panel=document.createElement('section');
    panel.id='yfaBadgeControl';
    panel.innerHTML=`<div class="yfa-badge-head"><div><div class="eyebrow">Brand identity</div><h2 class="yfa-badge-title">Official-site badge</h2><div class="yfa-badge-copy">Adds a blue check beside YourFavAlien branding on your own website. It means “official YourFavAlien site” — it does not claim verification from Instagram, TikTok, X, or another platform.</div></div><div class="yfa-badge-preview"><span class="yfa-badge-icon">✓</span><span id="yfaBadgePreviewText">Official YourFavAlien site</span></div></div><label class="yfa-badge-check"><input id="yfaBadgeEnabled" type="checkbox" checked> Show official-site check badge</label><div class="yfa-badge-grid"><div class="yfa-badge-field"><label>BADGE TOOLTIP / ACCESSIBLE LABEL</label><input id="yfaBadgeLabel" value="Official YourFavAlien site"></div><div class="yfa-badge-field"><label>CHECK COLOR</label><input id="yfaBadgeColor" type="color" value="#1d9bf0"></div></div><div class="yfa-badge-actions"><button id="yfaBadgeSave" class="btn" type="button">Save badge</button></div><div id="yfaBadgeStatus" class="status" aria-live="polite"></div>`;
    const anchor=document.getElementById('yfaPopupControl');
    if(anchor)anchor.insertAdjacentElement('afterend',panel);else dashboard.querySelector('.topbar')?.insertAdjacentElement('afterend',panel);
    panel.querySelector('#yfaBadgeSave').onclick=save;
    panel.querySelector('#yfaBadgeColor').oninput=e=>panel.querySelector('.yfa-badge-icon').style.background=e.target.value;
    panel.querySelector('#yfaBadgeLabel').oninput=e=>panel.querySelector('#yfaBadgePreviewText').textContent=e.target.value||'Official YourFavAlien site';
    client.auth.getSession().then(({data})=>{if(data?.session?.user)load();});
    client.auth.onAuthStateChange((_e,s)=>{if(s?.user)load();});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();