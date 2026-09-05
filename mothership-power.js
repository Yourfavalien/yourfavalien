(() => {
  if (window.__YFA_MOTHERSHIP_POWER__) return;
  window.__YFA_MOTHERSHIP_POWER__ = true;

  const cfg = window.YFA_MOTHERSHIP;
  if (!cfg || !window.YFA_CLOUDFLARE_CLIENT) return;

  const client = window.YFA_CLOUDFLARE_CLIENT;
  const CONTENT_PATH = 'system/site-content.json';
  const DRAFT_KEY = 'yfa-site-content-draft';
  const publicBase = cfg.assetBase;
  const publicUrl = path => `${publicBase}${path}`;
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const safe = value => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60);

  const defaults = () => ({
    version: 1,
    updatedAt: null,
    navigation: { scrollBehavior: 'hide-up-show-down', customLinks: [] },
    home: { showIntro: false, eyebrow: '', title: '', body: '', sections: [] },
    pages: [],
    seo: { homeTitle: 'YourFavAlien | Official Website', homeDescription: 'Welcome to the official YourFavAlien website.' }
  });

  let data = defaults();
  let dirty = false;

  function css() {
    if (document.getElementById('yfa-power-admin-css')) return;
    const style = document.createElement('style');
    style.id = 'yfa-power-admin-css';
    style.textContent = `
      .power-view{display:grid;gap:28px}.power-view.hidden{display:none!important}.power-section{border:1px solid var(--line);background:#0a060a;border-radius:18px;padding:18px}.power-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;margin-bottom:15px}.power-head h3{margin:0;font:400 17px 'Major Mono Display',monospace}.power-copy{margin-top:6px;color:var(--muted);font-size:10px;line-height:1.6;max-width:720px}.power-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.power-field{display:grid;gap:6px}.power-field.full{grid-column:1/-1}.power-field label{color:var(--muted);font-size:9px}.power-field input,.power-field textarea,.power-field select{width:100%;border:1px solid var(--line);border-radius:11px;background:#050305;color:var(--ink);padding:11px;font:11px 'Space Mono',monospace;outline:none}.power-field textarea{min-height:110px;resize:vertical}.power-field input:focus,.power-field textarea:focus,.power-field select:focus{border-color:#d65f96}.power-row{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.power-card{border:1px solid rgba(255,255,255,.09);background:#090509;border-radius:14px;padding:14px}.power-card + .power-card{margin-top:10px}.power-card-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}.power-card-title{font-size:11px;font-weight:700}.power-muted{color:var(--muted);font-size:9px;line-height:1.55}.power-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.power-mini{border:1px solid var(--line);background:transparent;color:var(--ink);border-radius:999px;padding:8px 10px;font:700 9px 'Space Mono',monospace;cursor:pointer}.power-mini:hover{background:rgba(255,255,255,.05)}.power-mini.danger{color:#ffacba;border-color:rgba(255,143,159,.3)}.power-status-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.power-status-card{border:1px solid var(--line);background:#090509;border-radius:13px;padding:12px}.power-status-card strong{display:block;font-size:13px;margin-top:5px}.power-badge{display:inline-flex;padding:4px 7px;border-radius:999px;background:rgba(158,209,182,.1);color:var(--ok);font-size:8px}.power-badge.draft{background:rgba(245,197,24,.1);color:#f5c518}.power-media-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:9px;margin-top:10px}.power-media{border:1px solid var(--line);border-radius:12px;overflow:hidden;background:#050305}.power-media img,.power-media video{display:block;width:100%;aspect-ratio:1/1;object-fit:cover}.power-media-body{padding:8px}.power-media input{width:100%;border:1px solid var(--line);background:#0a060a;color:#fff;border-radius:7px;padding:6px;font-size:8px}.power-sticky{position:sticky;bottom:12px;z-index:30;border:1px solid var(--line);background:rgba(9,5,9,.94);backdrop-filter:blur(16px);border-radius:16px;padding:11px;display:flex;justify-content:space-between;align-items:center;gap:12px;box-shadow:0 16px 40px rgba(0,0,0,.35)}.power-link{color:#4de8d8;text-decoration:none;font-size:10px}.power-empty{border:1px dashed var(--line);border-radius:12px;padding:18px;color:var(--muted);font-size:10px;text-align:center}.power-check{display:flex;align-items:center;gap:8px;color:var(--ink);font-size:10px}.power-check input{width:auto}.power-code{font-size:9px;color:#d38cad;overflow-wrap:anywhere}.power-divider{height:1px;background:var(--line);margin:16px 0}@media(max-width:760px){.power-grid,.power-status-grid{grid-template-columns:1fr}.power-field.full{grid-column:auto}.power-sticky{align-items:flex-start;flex-direction:column}}
    `;
    document.head.appendChild(style);
  }

  function el(tag, attrs={}, html='') {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([key,val]) => {
      if (key === 'class') node.className = val;
      else if (key.startsWith('data-')) node.setAttribute(key,val);
      else node[key] = val;
    });
    if (html) node.innerHTML = html;
    return node;
  }

  function markDirty() {
    dirty = true;
    const badge = document.getElementById('powerSaveState');
    if (badge) { badge.textContent = 'UNSAVED CHANGES'; badge.className = 'power-badge draft'; }
  }

  function bindChange(root=document) {
    root.querySelectorAll('[data-power-bind]').forEach(input => {
      input.addEventListener('input', () => { readForm(); markDirty(); });
      input.addEventListener('change', () => { readForm(); markDirty(); });
    });
  }

  async function session() {
    const { data: result } = await client.auth.getSession();
    return result?.session || null;
  }

  async function loadPublished() {
    try {
      const response = await fetch(`${publicUrl(CONTENT_PATH)}?v=${Date.now()}`, {cache:'no-store'});
      if (!response.ok) return defaults();
      const parsed = await response.json();
      return { ...defaults(), ...parsed, navigation:{...defaults().navigation,...(parsed.navigation||{})}, home:{...defaults().home,...(parsed.home||{})}, seo:{...defaults().seo,...(parsed.seo||{})}, pages:Array.isArray(parsed.pages)?parsed.pages:[] };
    } catch { return defaults(); }
  }

  function loadDraft() {
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch { return null; }
  }

  function saveDraft() {
    readForm();
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    dirty = false;
    const badge = document.getElementById('powerSaveState');
    if (badge) { badge.textContent = 'DRAFT SAVED'; badge.className = 'power-badge draft'; }
  }

  function readForm() {
    const get = id => document.getElementById(id);
    if (!get('powerView')) return;
    data.home.showIntro = !!get('powerHomeShowIntro')?.checked;
    data.home.eyebrow = get('powerHomeEyebrow')?.value || '';
    data.home.title = get('powerHomeTitle')?.value || '';
    data.home.body = get('powerHomeBody')?.value || '';
    data.navigation.scrollBehavior = get('powerScrollBehavior')?.value || 'hide-up-show-down';
    data.seo.homeTitle = get('powerSeoTitle')?.value || '';
    data.seo.homeDescription = get('powerSeoDescription')?.value || '';
  }

  async function uploadMedia(file, folder) {
    const s = await session();
    if (!s) throw new Error('Log in to the Mothership first.');
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${folder}/${Date.now()}-${uid().slice(0,8)}.${ext}`;
    const { error } = await client.storage.from(cfg.storageNamespace).upload(path, file, { upsert:false, contentType:file.type || undefined, cacheControl:'3600' });
    if (error) throw error;
    return { url: publicUrl(path), path, alt: '' };
  }

  async function removeStoredMedia(item) {
    if (!item?.path) return;
    await client.storage.from(cfg.storageNamespace).remove([item.path]);
  }

  function homeSectionCard(section, index) {
    const card = el('div',{class:'power-card'});
    card.innerHTML = `
      <div class="power-card-head"><div><div class="power-card-title">PHOTO SECTION ${index+1}</div><div class="power-muted">A vertical homepage section — not a carousel.</div></div><div class="power-row"><button class="power-mini" type="button" data-up>↑</button><button class="power-mini" type="button" data-down>↓</button><button class="power-mini danger" type="button" data-remove>Remove</button></div></div>
      <div class="power-grid">
        <div class="power-field"><label>SECTION TITLE</label><input data-title value="${(section.title||'').replace(/"/g,'&quot;')}"></div>
        <div class="power-field"><label>LAYOUT</label><select data-layout><option value="editorial">Editorial mix</option><option value="two">Two columns</option><option value="full">Full-width images</option></select></div>
        <div class="power-field full"><label>CAPTION / DESCRIPTION</label><textarea data-caption>${section.caption||''}</textarea></div>
        <label class="power-check"><input type="checkbox" data-enabled ${section.enabled!==false?'checked':''}> Show this section</label>
      </div>
      <div class="power-actions"><label class="btn secondary upload-label">Add pictures / video<input data-upload type="file" accept="image/*,video/mp4,video/webm" multiple></label></div>
      <div class="power-media-list" data-media></div>
    `;
    card.querySelector('[data-layout]').value = section.layout || 'editorial';
    const sync = () => { section.title=card.querySelector('[data-title]').value; section.caption=card.querySelector('[data-caption]').value; section.layout=card.querySelector('[data-layout]').value; section.enabled=card.querySelector('[data-enabled]').checked; markDirty(); };
    card.querySelectorAll('[data-title],[data-caption],[data-layout],[data-enabled]').forEach(n => { n.addEventListener('input',sync); n.addEventListener('change',sync); });
    card.querySelector('[data-up]').onclick=()=>{ if(index>0){ [data.home.sections[index-1],data.home.sections[index]]=[data.home.sections[index],data.home.sections[index-1]]; markDirty(); renderHomeSections(); } };
    card.querySelector('[data-down]').onclick=()=>{ if(index<data.home.sections.length-1){ [data.home.sections[index+1],data.home.sections[index]]=[data.home.sections[index],data.home.sections[index+1]]; markDirty(); renderHomeSections(); } };
    card.querySelector('[data-remove]').onclick=()=>{ if(confirm('Remove this homepage photo section?')){ data.home.sections.splice(index,1); markDirty(); renderHomeSections(); } };
    card.querySelector('[data-upload]').onchange=async event=>{
      const input=event.currentTarget; const files=[...input.files]; if(!files.length)return;
      input.disabled=true;
      try { for(const file of files){ section.images.push(await uploadMedia(file,'homepage-gallery')); } markDirty(); renderHomeSections(); }
      catch(error){ alert(error.message||'Upload failed.'); } finally { input.disabled=false; }
    };
    renderMedia(card.querySelector('[data-media]'), section.images, () => { markDirty(); renderHomeSections(); });
    return card;
  }

  function renderMedia(container, images, rerender) {
    container.innerHTML='';
    (images||[]).forEach((item,index)=>{
      const box=el('div',{class:'power-media'});
      const media=/\.(mp4|webm)(\?|$)/i.test(item.url||'')?`<video src="${item.url}" muted playsinline></video>`:`<img src="${item.url}" alt="">`;
      box.innerHTML=`${media}<div class="power-media-body"><input placeholder="Alt text" value="${(item.alt||'').replace(/"/g,'&quot;')}" data-alt><div class="power-actions"><button class="power-mini danger" type="button" data-delete>Delete</button></div></div>`;
      box.querySelector('[data-alt]').oninput=e=>{item.alt=e.target.value;markDirty();};
      box.querySelector('[data-delete]').onclick=async()=>{ if(!confirm('Delete this image from the section?'))return; try{await removeStoredMedia(item);}catch{} images.splice(index,1);markDirty();rerender(); };
      container.appendChild(box);
    });
  }

  function renderHomeSections() {
    const host=document.getElementById('powerHomeSections'); if(!host)return;
    host.innerHTML='';
    if(!data.home.sections.length) host.innerHTML='<div class="power-empty">No photo sections yet. Add one, upload your pictures, and it will become a normal scroll-down section on the homepage.</div>';
    data.home.sections.forEach((section,index)=>host.appendChild(homeSectionCard(section,index)));
  }

  function pageCard(page,index) {
    const card=el('div',{class:'power-card'});
    card.innerHTML=`
      <div class="power-card-head"><div><div class="power-card-title">${page.title||'NEW PAGE'}</div><div class="power-code">/page.html?slug=${page.slug||''}</div></div><button class="power-mini danger" type="button" data-remove>Remove</button></div>
      <div class="power-grid">
        <div class="power-field"><label>PAGE TITLE</label><input data-title value="${(page.title||'').replace(/"/g,'&quot;')}"></div>
        <div class="power-field"><label>URL SLUG</label><input data-slug value="${(page.slug||'').replace(/"/g,'&quot;')}" placeholder="photos"></div>
        <div class="power-field full"><label>PAGE TEXT</label><textarea data-body>${page.body||''}</textarea></div>
        <div class="power-field"><label>PHOTO LAYOUT</label><select data-layout><option value="editorial">Editorial mix</option><option value="two">Two columns</option><option value="full">Full width</option></select></div>
        <div class="power-field"><label>META DESCRIPTION</label><input data-description value="${(page.description||'').replace(/"/g,'&quot;')}"></div>
        <label class="power-check"><input type="checkbox" data-enabled ${page.enabled!==false?'checked':''}> Publish this page</label>
      </div>
      <div class="power-actions"><label class="btn secondary upload-label">Add pictures / video<input data-upload type="file" accept="image/*,video/mp4,video/webm" multiple></label><a class="power-mini" data-open target="_blank" rel="noopener">Open page</a></div>
      <div class="power-media-list" data-media></div>`;
    card.querySelector('[data-layout]').value=page.layout||'editorial';
    const sync=()=>{page.title=card.querySelector('[data-title]').value;page.slug=safe(card.querySelector('[data-slug]').value);card.querySelector('[data-slug]').value=page.slug;page.body=card.querySelector('[data-body]').value;page.layout=card.querySelector('[data-layout]').value;page.description=card.querySelector('[data-description]').value;page.enabled=card.querySelector('[data-enabled]').checked;card.querySelector('[data-open]').href=`/page.html?slug=${encodeURIComponent(page.slug)}`;markDirty();};
    card.querySelectorAll('[data-title],[data-slug],[data-body],[data-layout],[data-description],[data-enabled]').forEach(n=>{n.addEventListener('input',sync);n.addEventListener('change',sync);});
    card.querySelector('[data-open]').href=`/page.html?slug=${encodeURIComponent(page.slug||'')}`;
    card.querySelector('[data-remove]').onclick=()=>{if(confirm('Remove this page?')){data.pages.splice(index,1);markDirty();renderPages();}};
    card.querySelector('[data-upload]').onchange=async e=>{const files=[...e.currentTarget.files];e.currentTarget.disabled=true;try{for(const file of files){page.images.push(await uploadMedia(file,`pages/${page.slug||'page'}`));}markDirty();renderPages();}catch(error){alert(error.message||'Upload failed.');}finally{e.currentTarget.disabled=false;}};
    renderMedia(card.querySelector('[data-media]'),page.images,()=>{markDirty();renderPages();});
    return card;
  }

  function renderPages(){const host=document.getElementById('powerPages');if(!host)return;host.innerHTML='';if(!data.pages.length)host.innerHTML='<div class="power-empty">No extra pages yet. Create one whenever you want a photo journal, project page, lookbook, or anything else.</div>';data.pages.forEach((page,index)=>host.appendChild(pageCard(page,index)));}

  function renderLinks(){const host=document.getElementById('powerLinks');if(!host)return;host.innerHTML='';const links=data.navigation.customLinks||[];if(!links.length)host.innerHTML='<div class="power-empty">No extra menu links.</div>';links.forEach((link,index)=>{const card=el('div',{class:'power-card'});card.innerHTML=`<div class="power-grid"><div class="power-field"><label>MENU LABEL</label><input data-label value="${(link.label||'').replace(/"/g,'&quot;')}"></div><div class="power-field"><label>URL</label><input data-url value="${(link.url||'').replace(/"/g,'&quot;')}"></div><label class="power-check"><input data-enabled type="checkbox" ${link.enabled!==false?'checked':''}> Show link</label></div><div class="power-actions"><button class="power-mini danger" data-remove type="button">Remove</button></div>`;const sync=()=>{link.label=card.querySelector('[data-label]').value;link.url=card.querySelector('[data-url]').value;link.enabled=card.querySelector('[data-enabled]').checked;markDirty();};card.querySelectorAll('input').forEach(n=>{n.oninput=sync;n.onchange=sync;});card.querySelector('[data-remove]').onclick=()=>{links.splice(index,1);markDirty();renderLinks();};host.appendChild(card);});}

  async function publish() {
    readForm();
    const s=await session(); if(!s) throw new Error('Log in to the Mothership first.');
    const status=document.getElementById('powerPublishStatus'); status.textContent='Publishing…'; status.className='status';
    try {
      const current=await loadPublished();
      if(current && current.updatedAt){
        const stamp=new Date().toISOString().replace(/[:.]/g,'-');
        await client.storage.from(cfg.storageNamespace).upload(`revisions/site-content-${stamp}.json`,new Blob([JSON.stringify(current,null,2)],{type:'application/json'}),{upsert:false,contentType:'application/json'});
      }
      data.updatedAt=new Date().toISOString();
      const {error}=await client.storage.from(cfg.storageNamespace).upload(CONTENT_PATH,new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),{upsert:true,contentType:'application/json',cacheControl:'60'});
      if(error)throw error;
      localStorage.setItem(DRAFT_KEY,JSON.stringify(data)); dirty=false;
      status.textContent='Published. Your website controls are live.';status.className='status ok';
      const badge=document.getElementById('powerSaveState');if(badge){badge.textContent='PUBLISHED';badge.className='power-badge';}
    } catch(error){status.textContent=error.message||'Publish failed.';status.className='status error';throw error;}
  }

  async function listRevisions(){const host=document.getElementById('powerRevisions');if(!host)return;host.innerHTML='Loading revisions…';const s=await session();if(!s){host.innerHTML='Log in first.';return;}const {data:items,error}=await client.storage.from(cfg.storageNamespace).list('revisions',{limit:12,sortBy:{column:'created_at',order:'desc'}});if(error){host.innerHTML='Could not load revisions.';return;}host.innerHTML='';if(!items?.length){host.innerHTML='<div class="power-empty">Revision history will appear after your next publish.</div>';return;}items.forEach(item=>{const row=el('div',{class:'power-card'});row.innerHTML=`<div class="power-card-head"><div><div class="power-card-title">${item.name}</div><div class="power-muted">Previous published website settings</div></div><button class="power-mini" type="button">Restore to editor</button></div>`;row.querySelector('button').onclick=async()=>{try{const {data:blob,error:e}=await client.storage.from(cfg.storageNamespace).download(`revisions/${item.name}`);if(e)throw e;data=JSON.parse(await blob.text());localStorage.setItem(DRAFT_KEY,JSON.stringify(data));renderAll();markDirty();}catch(error){alert(error.message||'Could not restore revision.');}};host.appendChild(row);});}

  function renderAll(){
    document.getElementById('powerHomeShowIntro').checked=!!data.home.showIntro;
    document.getElementById('powerHomeEyebrow').value=data.home.eyebrow||'';
    document.getElementById('powerHomeTitle').value=data.home.title||'';
    document.getElementById('powerHomeBody').value=data.home.body||'';
    document.getElementById('powerScrollBehavior').value=data.navigation.scrollBehavior||'hide-up-show-down';
    document.getElementById('powerSeoTitle').value=data.seo.homeTitle||'';
    document.getElementById('powerSeoDescription').value=data.seo.homeDescription||'';
    renderHomeSections();renderPages();renderLinks();
  }

  function makeView(){
    const view=el('section',{id:'powerView',class:'dashboard-view power-view hidden',role:'tabpanel'});
    view.innerHTML=`
      <section class="power-section"><div class="power-head"><div><div class="eyebrow">Mothership 2.0</div><h3>Control center</h3><div class="power-copy">This is the no-code layer for the parts of the website you should be able to change without opening GitHub.</div></div><span id="powerSaveState" class="power-badge">LOADING</span></div><div class="power-status-grid"><div class="power-status-card"><span class="power-muted">WEBSITE</span><strong>Live</strong></div><div class="power-status-card"><span class="power-muted">ORBIT POPUP</span><strong>Existing control</strong></div><div class="power-status-card"><span class="power-muted">XILO</span><strong>Existing control</strong></div><div class="power-status-card"><span class="power-muted">CONTENT SYSTEM</span><strong>Connected</strong></div></div></section>

      <section class="power-section"><div class="power-head"><div><h3>Homepage content</h3><div class="power-copy">Add a text intro below the current hero if you want one. You can leave it off and use only pictures.</div></div></div><div class="power-grid"><label class="power-check"><input id="powerHomeShowIntro" data-power-bind type="checkbox"> Show homepage intro</label><div></div><div class="power-field"><label>SMALL EYEBROW</label><input id="powerHomeEyebrow" data-power-bind placeholder="LATEST TRANSMISSION"></div><div class="power-field"><label>HEADING</label><input id="powerHomeTitle" data-power-bind placeholder="A little more of my world."></div><div class="power-field full"><label>PARAGRAPH</label><textarea id="powerHomeBody" data-power-bind></textarea></div></div></section>

      <section class="power-section"><div class="power-head"><div><h3>Homepage photo sections</h3><div class="power-copy">This is the exact scroll-down picture system you asked for. These sections sit below the homepage hero and visitors naturally scroll through them — no carousel.</div></div><button id="powerAddHomeSection" class="btn" type="button">Add photo section</button></div><div id="powerHomeSections"></div></section>

      <section class="power-section"><div class="power-head"><div><h3>Pages</h3><div class="power-copy">Create extra photo journals, lookbooks, projects, or other pages from the Mothership. Every page gets its own title, text, pictures, and URL slug.</div></div><button id="powerAddPage" class="btn" type="button">Create page</button></div><div id="powerPages"></div></section>

      <section class="power-section"><div class="power-head"><div><h3>Navigation</h3><div class="power-copy">Control how the fixed menu behaves while visitors scroll and add extra links without touching HTML.</div></div></div><div class="power-grid"><div class="power-field"><label>MENU SCROLL BEHAVIOR</label><select id="powerScrollBehavior" data-power-bind><option value="hide-up-show-down">Hide scrolling up / return scrolling down</option><option value="hide-down-show-up">Hide scrolling down / return scrolling up</option><option value="always">Always visible</option></select></div></div><div class="power-divider"></div><div class="power-head"><div><div class="power-card-title">Extra menu links</div></div><button id="powerAddLink" class="power-mini" type="button">Add link</button></div><div id="powerLinks"></div></section>

      <section class="power-section"><div class="power-head"><div><h3>SEO</h3><div class="power-copy">Edit the homepage browser/search title and description here. Your existing static SEO stays as the fallback.</div></div></div><div class="power-grid"><div class="power-field full"><label>HOMEPAGE TITLE</label><input id="powerSeoTitle" data-power-bind></div><div class="power-field full"><label>HOMEPAGE DESCRIPTION</label><textarea id="powerSeoDescription" data-power-bind></textarea></div></div></section>

      <section class="power-section"><div class="power-head"><div><h3>Email center</h3><div class="power-copy">Kit is your subscriber/newsletter system, while your Resend + Worker setup keeps handling the automatic welcome email. Subscriber totals are intentionally not pulled directly into this browser dashboard because that would require exposing a private Kit credential.</div></div></div><div class="power-actions"><a class="btn secondary" href="https://app.kit.com/subscribers" target="_blank" rel="noopener">Open Kit</a><a class="btn secondary" href="https://resend.com/" target="_blank" rel="noopener">Open Resend</a></div></section>

      <section class="power-section"><div class="power-head"><div><h3>Revision history</h3><div class="power-copy">Every publish stores the previous configuration first, so you can bring an older setup back into the editor.</div></div><button id="powerRefreshRevisions" class="power-mini" type="button">Refresh</button></div><div id="powerRevisions"></div></section>

      <div class="power-sticky"><div><div class="power-card-title">Publishing</div><div class="power-muted">Save Draft stays private in this browser. Publish pushes the settings live.</div><div id="powerPublishStatus" class="status"></div></div><div class="power-row"><button id="powerSaveDraft" class="btn secondary" type="button">Save Draft</button><a id="powerPreview" class="btn secondary" href="/?yfa-preview=1" target="_blank" rel="noopener">Preview Draft</a><button id="powerPublish" class="btn" type="button">Publish</button></div></div>
    `;
    return view;
  }

  async function init(){
    css();
    const tabs=document.querySelector('.dashboard-tabs');const controlsView=document.getElementById('controlsView');const chatsView=document.getElementById('chatsView');if(!tabs||!controlsView)return;
    const powerTab=el('button',{id:'powerTab',class:'dashboard-tab',type:'button',role:'tab'},'Power Tools');powerTab.setAttribute('aria-selected','false');tabs.appendChild(powerTab);
    const view=makeView();controlsView.parentNode.insertBefore(view,chatsView||controlsView.nextSibling);

    const showPower=()=>{document.querySelectorAll('.dashboard-tab').forEach(t=>t.setAttribute('aria-selected',String(t===powerTab)));controlsView.classList.add('hidden');if(chatsView)chatsView.classList.add('hidden');document.getElementById('completeView')?.classList.add('hidden');view.classList.remove('hidden');};
    powerTab.onclick=showPower;
    document.getElementById('controlsTab')?.addEventListener('click',()=>{view.classList.add('hidden');powerTab.setAttribute('aria-selected','false');});
    document.getElementById('chatsTab')?.addEventListener('click',()=>{view.classList.add('hidden');powerTab.setAttribute('aria-selected','false');});

    const published=await loadPublished();const draft=loadDraft();data=draft||published||defaults();if(!Array.isArray(data.home.sections))data.home.sections=[];if(!Array.isArray(data.pages))data.pages=[];if(!Array.isArray(data.navigation.customLinks))data.navigation.customLinks=[];
    renderAll();bindChange(view);document.getElementById('powerSaveState').textContent=draft?'DRAFT LOADED':'PUBLISHED';document.getElementById('powerSaveState').className=draft?'power-badge draft':'power-badge';
    document.getElementById('powerAddHomeSection').onclick=()=>{data.home.sections.push({id:uid(),title:'',caption:'',layout:'editorial',enabled:true,images:[]});markDirty();renderHomeSections();};
    document.getElementById('powerAddPage').onclick=()=>{data.pages.push({id:uid(),title:'New Page',slug:`page-${data.pages.length+1}`,body:'',description:'',layout:'editorial',enabled:true,images:[]});markDirty();renderPages();};
    document.getElementById('powerAddLink').onclick=()=>{data.navigation.customLinks.push({id:uid(),label:'New link',url:'/',enabled:true});markDirty();renderLinks();};
    document.getElementById('powerSaveDraft').onclick=saveDraft;
    document.getElementById('powerPreview').onclick=()=>saveDraft();
    document.getElementById('powerPublish').onclick=async e=>{e.currentTarget.disabled=true;try{await publish();await listRevisions();}catch{}finally{e.currentTarget.disabled=false;}};
    document.getElementById('powerRefreshRevisions').onclick=listRevisions;
    await listRevisions();
    window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

