(() => {
  if (window.__YFA_MOTHERSHIP_COMPLETE_ADMIN__) return;
  window.__YFA_MOTHERSHIP_COMPLETE_ADMIN__ = true;

  const cfg = window.YFA_MOTHERSHIP;
  if (!cfg || !window.supabase) return;
  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.publishableKey);
  const PATH = 'system/site-advanced.json';
  const DRAFT_KEY = 'yfa-site-advanced-draft';
  const base = `${cfg.supabaseUrl}/storage/v1/object/public/${cfg.bucket}/`;
  const url = p => `${base}${p}?v=${Date.now()}`;

  const defaults = () => ({
    version: 1,
    updatedAt: null,
    pages: {
      about: {enabled:true, heading:'', body:'', buttonLabel:'', buttonUrl:'', seoTitle:'', seoDescription:''},
      contact: {enabled:true, heading:'', body:'', buttonLabel:'', buttonUrl:'', seoTitle:'', seoDescription:''},
      privacy: {enabled:true, heading:'', body:'', buttonLabel:'', buttonUrl:'', seoTitle:'', seoDescription:''},
      socials: {enabled:true, heading:'', body:'', buttonLabel:'', buttonUrl:'', seoTitle:'', seoDescription:''}
    },
    navigation: {
      items: [
        {id:'home',label:'Home',url:'/',enabled:true},
        {id:'about',label:'About',url:'/about.html',enabled:true},
        {id:'socials',label:'Socials',url:'/socials.html',enabled:true},
        {id:'contact',label:'Contact',url:'/contact.html',enabled:true},
        {id:'privacy',label:'Privacy',url:'/privacy.html',enabled:false}
      ]
    },
    design: {headingFont:'Playfair Display',bodyFont:'Space Mono',contentWidth:1380,sectionSpacing:100,buttonRadius:999,cardRadius:18,motion:true},
    popup: {enabled:true,delaySeconds:10,pages:['home','about','contact'],title:'',copy:'',cta:'',skip:'',captureTitle:'',captureCopy:'',submit:'',successTitle:'',successCopy:'',successButton:'',reopenText:''},
    xilo: {enabled:true,displayName:'Xilo',greeting:'',handoffText:''},
    system: {siteEnabled:true}
  });

  let state = defaults();
  let dirty = false;
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function merge(src) {
    const d = defaults();
    return {
      ...d, ...src,
      pages: {...d.pages,...(src?.pages||{})},
      navigation: {...d.navigation,...(src?.navigation||{})},
      design: {...d.design,...(src?.design||{})},
      popup: {...d.popup,...(src?.popup||{})},
      xilo: {...d.xilo,...(src?.xilo||{})},
      system: {...d.system,...(src?.system||{})}
    };
  }

  async function session(){ const {data}=await client.auth.getSession(); return data?.session||null; }
  async function loadPublished(){ try{const r=await fetch(url(PATH),{cache:'no-store'}); return r.ok?merge(await r.json()):defaults();}catch{return defaults();} }
  function loadDraft(){ try{return JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');}catch{return null;} }

  function addCss(){
    if(document.getElementById('yfa-complete-admin-css')) return;
    const s=document.createElement('style'); s.id='yfa-complete-admin-css'; s.textContent=`
      .complete-view{display:grid;gap:26px}.complete-view.hidden{display:none!important}.c-section{border:1px solid var(--line);background:#0a060a;border-radius:18px;padding:18px}.c-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;flex-wrap:wrap;margin-bottom:14px}.c-head h3{margin:0;font:400 17px 'Major Mono Display',monospace}.c-copy,.c-muted{color:var(--muted);font-size:10px;line-height:1.6}.c-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.c-field{display:grid;gap:6px}.c-field.full{grid-column:1/-1}.c-field label{color:var(--muted);font-size:9px}.c-field input,.c-field textarea,.c-field select{width:100%;border:1px solid var(--line);border-radius:10px;background:#050305;color:var(--ink);padding:10px;font:11px 'Space Mono',monospace;outline:none}.c-field textarea{min-height:105px;resize:vertical}.c-check{display:flex;align-items:center;gap:8px;font-size:10px}.c-check input{width:auto}.c-card{border:1px solid rgba(255,255,255,.09);border-radius:14px;padding:13px;background:#090509}.c-card+.c-card{margin-top:9px}.c-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.c-mini{border:1px solid var(--line);background:transparent;color:var(--ink);border-radius:999px;padding:7px 9px;font:700 9px 'Space Mono',monospace;cursor:pointer}.c-mini.danger{color:#ffacba}.c-status-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.c-status{border:1px solid var(--line);border-radius:13px;padding:12px;background:#090509}.c-status strong{display:block;margin-top:5px;font-size:12px}.c-badge{display:inline-flex;padding:4px 7px;border-radius:999px;background:rgba(158,209,182,.1);color:var(--ok);font-size:8px}.c-badge.warn{background:rgba(245,197,24,.1);color:#f5c518}.c-sticky{position:sticky;bottom:12px;z-index:35;border:1px solid var(--line);background:rgba(9,5,9,.95);backdrop-filter:blur(14px);border-radius:16px;padding:11px;display:flex;justify-content:space-between;gap:12px;align-items:center}.c-page-tabs{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px}.c-page-tabs button[aria-pressed="true"]{background:var(--magenta);color:#fff}.c-nav-item{display:grid;grid-template-columns:auto 1fr 1.5fr auto auto;gap:8px;align-items:center}.c-nav-item input{min-width:0}.c-divider{height:1px;background:var(--line);margin:16px 0}@media(max-width:760px){.c-grid,.c-status-grid{grid-template-columns:1fr}.c-field.full{grid-column:auto}.c-nav-item{grid-template-columns:auto 1fr}.c-nav-item .url{grid-column:1/-1}.c-sticky{align-items:flex-start;flex-direction:column}}
    `; document.head.appendChild(s);
  }

  function mark(){ dirty=true; const b=document.getElementById('cSaveState'); if(b){b.textContent='UNSAVED';b.className='c-badge warn';} }
  function field(label,id,value='',type='input',full=false){return `<div class="c-field ${full?'full':''}"><label>${label}</label>${type==='textarea'?`<textarea id="${id}">${esc(value)}</textarea>`:`<input id="${id}" value="${esc(value)}">`}</div>`;}

  function pageEditor(key){
    const p=state.pages[key]||{};
    return `<div class="c-grid">
      <label class="c-check"><input id="cPageEnabled" type="checkbox" ${p.enabled!==false?'checked':''}> Page enabled</label><div></div>
      ${field('PAGE HEADING','cPageHeading',p.heading)}
      ${field('PRIMARY BUTTON LABEL','cPageButtonLabel',p.buttonLabel)}
      ${field('PAGE BODY / INTRO','cPageBody',p.body,'textarea',true)}
      ${field('PRIMARY BUTTON URL','cPageButtonUrl',p.buttonUrl)}
      ${field('SEO TITLE','cPageSeoTitle',p.seoTitle)}
      ${field('SEO DESCRIPTION','cPageSeoDescription',p.seoDescription,'textarea',true)}
    </div>`;
  }

  function makeView(){
    const v=document.createElement('section'); v.id='completeView'; v.className='dashboard-view complete-view hidden'; v.setAttribute('role','tabpanel');
    v.innerHTML=`
      <section class="c-section"><div class="c-head"><div><div class="eyebrow">Mothership full controls</div><h3>System dashboard</h3><div class="c-copy">Quick health checks and global switches for the website.</div></div><span id="cSaveState" class="c-badge">LOADING</span></div><div id="cStatusGrid" class="c-status-grid"></div><div class="c-divider"></div><label class="c-check"><input id="cSiteEnabled" type="checkbox"> Website enabled</label></section>

      <section class="c-section"><div class="c-head"><div><h3>Page content editor</h3><div class="c-copy">Change the main heading, intro/body, primary button and SEO for your existing pages without opening the HTML.</div></div></div><div id="cPageTabs" class="c-page-tabs"></div><div id="cPageEditor"></div></section>

      <section class="c-section"><div class="c-head"><div><h3>Navigation manager</h3><div class="c-copy">Rename, hide, reorder or redirect the existing menu items.</div></div></div><div id="cNavList"></div></section>

      <section class="c-section"><div class="c-head"><div><h3>Design system</h3><div class="c-copy">Global typography, spacing, corners and motion. Your existing color editor still handles the actual colors.</div></div></div><div class="c-grid">
        <div class="c-field"><label>HEADING FONT</label><select id="cHeadingFont"><option>Playfair Display</option><option>Space Mono</option><option>Courier Prime</option><option>Georgia</option><option>Arial</option></select></div>
        <div class="c-field"><label>BODY FONT</label><select id="cBodyFont"><option>Space Mono</option><option>Courier Prime</option><option>Arial</option><option>Georgia</option></select></div>
        <div class="c-field"><label>CONTENT MAX WIDTH (PX)</label><input id="cContentWidth" type="number" min="800" max="1800"></div>
        <div class="c-field"><label>SECTION SPACING (PX)</label><input id="cSectionSpacing" type="number" min="30" max="220"></div>
        <div class="c-field"><label>BUTTON ROUNDNESS (PX)</label><input id="cButtonRadius" type="number" min="0" max="999"></div>
        <div class="c-field"><label>CARD ROUNDNESS (PX)</label><input id="cCardRadius" type="number" min="0" max="80"></div>
        <label class="c-check"><input id="cMotion" type="checkbox"> Enable site motion / transitions</label>
      </div></section>

      <section class="c-section"><div class="c-head"><div><h3>Orbit popup editor</h3><div class="c-copy">Control where it appears, how long it waits, and the wording visitors see. The existing global on/off switch still works too.</div></div></div><div class="c-grid">
        <label class="c-check"><input id="cPopupEnabled" type="checkbox"> Popup enabled in advanced settings</label><div></div>
        <div class="c-field"><label>DELAY BEFORE POPUP (SECONDS)</label><input id="cPopupDelay" type="number" min="0" max="300"></div>
        <div class="c-field"><label>SHOW ON PAGES</label><div class="c-row" id="cPopupPages"></div></div>
        ${field('OFFER TITLE','cPopupTitle','')}${field('OFFER COPY','cPopupCopy','')}${field('FIRST BUTTON','cPopupCta','')}${field('NO THANKS TEXT','cPopupSkip','')}
        ${field('CAPTURE TITLE','cPopupCaptureTitle','')}${field('CAPTURE COPY','cPopupCaptureCopy','')}${field('SUBMIT BUTTON','cPopupSubmit','')}${field('SUCCESS TITLE','cPopupSuccessTitle','')}${field('SUCCESS COPY','cPopupSuccessCopy','textarea',true)}${field('SUCCESS BUTTON','cPopupSuccessButton','')}${field('REOPEN TEASER TEXT','cPopupReopenText','')}
      </div></section>

      <section class="c-section"><div class="c-head"><div><h3>Xilo controls</h3><div class="c-copy">Use this for high-level chatbot behavior. Your existing Xilo Training section remains the place for detailed knowledge and responses.</div></div></div><div class="c-grid"><label class="c-check"><input id="cXiloEnabled" type="checkbox"> Xilo enabled</label><div></div>${field('DISPLAY NAME','cXiloName','')}${field('GREETING','cXiloGreeting','')}${field('HUMAN HANDOFF MESSAGE','cXiloHandoff','textarea',true)}</div></section>

      <section class="c-section"><div class="c-head"><div><h3>System & advanced</h3><div class="c-copy">These controls are intentionally separated from normal content editing.</div></div><button id="cRunChecks" class="c-mini" type="button">Run checks</button></div><div id="cChecks" class="c-muted">Run checks to verify the public configuration files.</div></section>

      <div class="c-sticky"><div><div style="font-size:11px;font-weight:700">Save & publish</div><div class="c-muted">Draft stays only in this browser. Publish makes these advanced controls live.</div><div id="cPublishStatus" class="status"></div></div><div class="c-row"><button id="cSaveDraft" class="btn secondary" type="button">Save Draft</button><button id="cDiscardDraft" class="btn secondary" type="button">Discard Draft</button><button id="cPublish" class="btn" type="button">Publish Advanced</button></div></div>`;
    return v;
  }

  let selectedPage='about';
  function renderPages(){
    const tabs=document.getElementById('cPageTabs'), host=document.getElementById('cPageEditor'); if(!tabs||!host)return;
    tabs.innerHTML=''; ['about','contact','privacy','socials'].forEach(k=>{const b=document.createElement('button');b.className='c-mini';b.textContent=k[0].toUpperCase()+k.slice(1);b.setAttribute('aria-pressed',String(k===selectedPage));b.onclick=()=>{readPage();selectedPage=k;renderPages();};tabs.appendChild(b);});
    host.innerHTML=pageEditor(selectedPage);
    host.querySelectorAll('input,textarea').forEach(n=>{n.addEventListener('input',()=>{readPage();mark();});n.addEventListener('change',()=>{readPage();mark();});});
  }
  function readPage(){ const host=document.getElementById('cPageEditor'); if(!host||!host.querySelector('#cPageEnabled'))return; const p=state.pages[selectedPage]||(state.pages[selectedPage]={}); p.enabled=host.querySelector('#cPageEnabled').checked;p.heading=host.querySelector('#cPageHeading').value;p.body=host.querySelector('#cPageBody').value;p.buttonLabel=host.querySelector('#cPageButtonLabel').value;p.buttonUrl=host.querySelector('#cPageButtonUrl').value;p.seoTitle=host.querySelector('#cPageSeoTitle').value;p.seoDescription=host.querySelector('#cPageSeoDescription').value; }

  function renderNav(){
    const host=document.getElementById('cNavList'); if(!host)return; host.innerHTML='';
    (state.navigation.items||[]).forEach((item,i)=>{if(item.id==='privacy')return;const row=document.createElement('div');row.className='c-card c-nav-item';row.innerHTML=`<input data-enabled type="checkbox" ${item.enabled!==false?'checked':''}><input data-label value="${esc(item.label)}"><input class="url" data-url value="${esc(item.url)}"><button class="c-mini" data-up type="button">↑</button><button class="c-mini" data-down type="button">↓</button>`;const sync=()=>{item.enabled=row.querySelector('[data-enabled]').checked;item.label=row.querySelector('[data-label]').value;item.url=row.querySelector('[data-url]').value;mark();};row.querySelectorAll('input').forEach(x=>{x.oninput=sync;x.onchange=sync;});row.querySelector('[data-up]').onclick=()=>{if(i>0){[state.navigation.items[i-1],state.navigation.items[i]]=[state.navigation.items[i],state.navigation.items[i-1]];mark();renderNav();}};row.querySelector('[data-down]').onclick=()=>{if(i<state.navigation.items.length-1){[state.navigation.items[i+1],state.navigation.items[i]]=[state.navigation.items[i],state.navigation.items[i+1]];mark();renderNav();}};host.appendChild(row);});
  }

  function fill(){
    document.getElementById('cSiteEnabled').checked=state.system.siteEnabled!==false;
    document.getElementById('cHeadingFont').value=state.design.headingFont;document.getElementById('cBodyFont').value=state.design.bodyFont;document.getElementById('cContentWidth').value=state.design.contentWidth;document.getElementById('cSectionSpacing').value=state.design.sectionSpacing;document.getElementById('cButtonRadius').value=state.design.buttonRadius;document.getElementById('cCardRadius').value=state.design.cardRadius;document.getElementById('cMotion').checked=state.design.motion!==false;
    document.getElementById('cPopupEnabled').checked=state.popup.enabled!==false;document.getElementById('cPopupDelay').value=state.popup.delaySeconds;['Title','Copy','Cta','Skip','CaptureTitle','CaptureCopy','Submit','SuccessTitle','SuccessCopy','SuccessButton','ReopenText'].forEach(k=>{const el=document.getElementById('cPopup'+k);if(el)el.value=state.popup[k[0].toLowerCase()+k.slice(1)]||'';});
    const pp=document.getElementById('cPopupPages');pp.innerHTML='';['home','about','contact','privacy','socials'].forEach(k=>{const l=document.createElement('label');l.className='c-check';l.innerHTML=`<input type="checkbox" value="${k}" ${(state.popup.pages||[]).includes(k)?'checked':''}> ${k}`;pp.appendChild(l);});
    document.getElementById('cXiloEnabled').checked=state.xilo.enabled!==false;document.getElementById('cXiloName').value=state.xilo.displayName||'';document.getElementById('cXiloGreeting').value=state.xilo.greeting||'';document.getElementById('cXiloHandoff').value=state.xilo.handoffText||'';
    renderPages();renderNav();
  }

  function readAll(){
    readPage(); state.system.siteEnabled=document.getElementById('cSiteEnabled').checked;
    state.design.headingFont=document.getElementById('cHeadingFont').value;state.design.bodyFont=document.getElementById('cBodyFont').value;state.design.contentWidth=+document.getElementById('cContentWidth').value||1380;state.design.sectionSpacing=+document.getElementById('cSectionSpacing').value||100;state.design.buttonRadius=+document.getElementById('cButtonRadius').value||0;state.design.cardRadius=+document.getElementById('cCardRadius').value||0;state.design.motion=document.getElementById('cMotion').checked;
    state.popup.enabled=document.getElementById('cPopupEnabled').checked;state.popup.delaySeconds=Math.max(0,+document.getElementById('cPopupDelay').value||0);state.popup.pages=[...document.querySelectorAll('#cPopupPages input:checked')].map(x=>x.value);state.popup.title=document.getElementById('cPopupTitle').value;state.popup.copy=document.getElementById('cPopupCopy').value;state.popup.cta=document.getElementById('cPopupCta').value;state.popup.skip=document.getElementById('cPopupSkip').value;state.popup.captureTitle=document.getElementById('cPopupCaptureTitle').value;state.popup.captureCopy=document.getElementById('cPopupCaptureCopy').value;state.popup.submit=document.getElementById('cPopupSubmit').value;state.popup.successTitle=document.getElementById('cPopupSuccessTitle').value;state.popup.successCopy=document.getElementById('cPopupSuccessCopy').value;state.popup.successButton=document.getElementById('cPopupSuccessButton').value;state.popup.reopenText=document.getElementById('cPopupReopenText').value;
    state.xilo.enabled=document.getElementById('cXiloEnabled').checked;state.xilo.displayName=document.getElementById('cXiloName').value;state.xilo.greeting=document.getElementById('cXiloGreeting').value;state.xilo.handoffText=document.getElementById('cXiloHandoff').value;
  }

  async function publish(){
    readAll(); const s=await session(); if(!s)throw new Error('Log in first.'); const status=document.getElementById('cPublishStatus');status.textContent='Publishing…';
    try{state.updatedAt=new Date().toISOString();const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});await client.storage.from(cfg.bucket).remove([PATH]);const {error}=await client.storage.from(cfg.bucket).upload(PATH,blob,{upsert:false,contentType:'application/json',cacheControl:'30'});if(error)throw error;localStorage.setItem(DRAFT_KEY,JSON.stringify(state));dirty=false;status.textContent='Advanced controls published.';status.className='status ok';const b=document.getElementById('cSaveState');b.textContent='PUBLISHED';b.className='c-badge';await runChecks();}catch(e){status.textContent=e.message||'Publish failed.';status.className='status error';throw e;}
  }

  async function runChecks(){
    const host=document.getElementById('cChecks'); if(!host)return; host.textContent='Checking…';
    const checks=[['Advanced config',PATH],['Theme',cfg.themePath],['Maintenance',cfg.maintenancePath],['Orbit status',cfg.popupPath]];
    const results=await Promise.all(checks.map(async ([name,p])=>{try{const r=await fetch(url(p),{cache:'no-store'});return `${name}: ${r.ok?'OK':'not published yet'}`;}catch{return `${name}: unavailable`;}}));
    host.innerHTML=results.map(x=>`<div>${esc(x)}</div>`).join('');
    const grid=document.getElementById('cStatusGrid');if(grid)grid.innerHTML=`<div class="c-status"><span class="c-muted">WEBSITE</span><strong>${state.system.siteEnabled!==false?'Enabled':'Disabled'}</strong></div><div class="c-status"><span class="c-muted">ORBIT</span><strong>${state.popup.enabled!==false?'Enabled':'Disabled'}</strong></div><div class="c-status"><span class="c-muted">XILO</span><strong>${state.xilo.enabled!==false?'Enabled':'Disabled'}</strong></div><div class="c-status"><span class="c-muted">ADVANCED CONFIG</span><strong>${results[0].includes('OK')?'Connected':'Draft only'}</strong></div>`;
  }

  async function init(){
    addCss(); const tabs=document.querySelector('.dashboard-tabs');const controls=document.getElementById('controlsView');const chats=document.getElementById('chatsView');if(!tabs||!controls)return;
    if(document.getElementById('completeTab'))return;
    const tab=document.createElement('button');tab.id='completeTab';tab.className='dashboard-tab';tab.type='button';tab.setAttribute('role','tab');tab.setAttribute('aria-selected','false');tab.textContent='Full Controls';tabs.appendChild(tab);
    const view=makeView();controls.parentNode.insertBefore(view,chats||controls.nextSibling);
    const show=()=>{document.querySelectorAll('.dashboard-tab').forEach(t=>t.setAttribute('aria-selected',String(t===tab)));controls.classList.add('hidden');chats?.classList.add('hidden');document.getElementById('powerView')?.classList.add('hidden');view.classList.remove('hidden');};tab.onclick=show;
    document.getElementById('controlsTab')?.addEventListener('click',()=>view.classList.add('hidden'));document.getElementById('chatsTab')?.addEventListener('click',()=>view.classList.add('hidden'));document.getElementById('powerTab')?.addEventListener('click',()=>view.classList.add('hidden'));
    const published=await loadPublished();const draft=loadDraft();state=merge(draft||published);fill();const badge=document.getElementById('cSaveState');badge.textContent=draft?'DRAFT LOADED':'PUBLISHED';badge.className=draft?'c-badge warn':'c-badge';
    view.querySelectorAll('input,textarea,select').forEach(n=>{n.addEventListener('input',()=>{readAll();mark();});n.addEventListener('change',()=>{readAll();mark();});});
    document.getElementById('cSaveDraft').onclick=()=>{readAll();localStorage.setItem(DRAFT_KEY,JSON.stringify(state));dirty=false;badge.textContent='DRAFT SAVED';badge.className='c-badge warn';};
    document.getElementById('cDiscardDraft').onclick=async()=>{if(!confirm('Discard the local advanced draft and reload published settings?'))return;localStorage.removeItem(DRAFT_KEY);state=await loadPublished();fill();dirty=false;badge.textContent='PUBLISHED';badge.className='c-badge';};
    document.getElementById('cPublish').onclick=async e=>{e.currentTarget.disabled=true;try{await publish();}finally{e.currentTarget.disabled=false;}};document.getElementById('cRunChecks').onclick=runChecks;await runChecks();
    window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
