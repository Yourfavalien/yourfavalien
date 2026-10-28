(()=>{
'use strict';
let active=false;
function activate(){
if(active)return;active=true;document.getElementById('yfaEditorPreviewEntry')?.remove();

const css=document.createElement('link');css.rel='stylesheet';css.href='editor-workspace.css?v=20261028-integrated';document.head.append(css);document.body.classList.add('yfa-editor-preview');
let selected=null,mode='arrange',viewport='desktop',route='/',busy=false;
const api=()=>window.YFA_VISUAL_EDITOR;
function start(){
 const main=document.querySelector('.yfa-app-main'),nav=document.querySelector('.yfa-app-nav');if(!main||!nav||document.getElementById('visualBuilder'))return;
 const builder=document.createElement('section');builder.id='visualBuilder';builder.innerHTML=`<header class="builder-toolbar"><strong>MOTHERSHIP <small>Website editor</small></strong><select aria-label="Selected page" data-page><option value="/">Home / Gallery</option><option value="/socials.html">Socials</option><option value="/contact.html">Contact</option><option value="/privacy.html">Privacy</option></select><div class="builder-devices"><button data-device="desktop" aria-pressed="true">Desktop</button><button data-device="tablet" aria-pressed="false">Tablet</button><button data-device="mobile" aria-pressed="false">Phone</button></div><button data-undo>Undo</button><button data-redo>Redo</button><button data-save>Save draft</button><button data-preview>Preview draft</button><button data-publish class="primary">Publish</button></header><div class="builder-status" role="status" aria-live="polite">Loading your existing content…</div><div class="builder-workspace"><aside class="builder-library"><h2>Page content</h2><button data-arrange>Arrange gallery</button><label class="builder-upload">+ Add photos / videos<input data-files type="file" multiple accept="image/*,video/mp4,video/webm,video/quicktime"></label><p>Drag photographs to reorder. Drop files onto the canvas to upload. New media appears first.</p><h2>Add content block</h2><button draggable="true" data-add-block="text">Text</button><button draggable="true" data-add-block="button">Button</button><button draggable="true" data-add-block="divider">Divider</button><p>Content blocks join the homepage after the photography. Drag blocks to rearrange them.</p><h2>Website tools</h2><p>Use the sidebar for pages, colors, social links, forms, campaign mode, maintenance, and settings.</p><button data-controls>Open gallery controls</button><p class="builder-note">Draft changes stay private until you publish.</p></aside><section class="builder-canvas" aria-label="Website content canvas"><div data-board class="builder-board" aria-label="Gallery order"></div><div data-blocks class="builder-blocks"></div><div data-frame class="builder-frame" hidden><iframe title="Private website draft preview"></iframe></div></section><aside class="builder-inspector"><h2>Selected media</h2><div data-inspector>Select a photograph or video to edit it.</div></aside></div>`;
 const dashboard=document.getElementById('dashboard');if(!dashboard)return;dashboard.querySelector('.topbar')?.insertAdjacentElement('afterend',builder);if(!builder.isConnected)dashboard.prepend(builder);const status=builder.querySelector('.builder-status');
 const report=text=>status.textContent=text;
 const run=async(fn,success)=>{if(busy)return;busy=true;builder.querySelectorAll('button,input,select,textarea').forEach(e=>e.disabled=true);try{await fn();report(success);render();}catch(error){report(error.message||'The change could not be saved.');}finally{busy=false;builder.querySelectorAll('button,input,select,textarea').forEach(e=>e.disabled=false);render();}};
 const show=active=>{builder.hidden=!active;if(active){document.querySelectorAll('#dashboard > .dashboard-view').forEach(view=>view.classList.add('hidden'));document.body.dataset.workspaceArea='editor';nav.querySelectorAll('[data-area]').forEach(button=>{if(button.dataset.area==='editor')button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});}};
 window.addEventListener('yfa-open-editor',()=>show(true));
 nav.addEventListener('click',e=>{const button=e.target.closest('[data-area]');if(button){document.body.dataset.workspaceArea=button.dataset.area;show(button.dataset.area==='editor');}});
 const state=()=>api()?.state();
 function items(){const page=state()?.pages?.find(p=>p.slug==='gallery');const list=page?.images||[];if(page?.orderMode!=='manual')list.sort((a,b)=>time(b)-time(a));return list;}
 const time=item=>{const explicit=Date.parse(item.uploadedAt||item.createdAt||'');return Number.isFinite(explicit)?explicit:Number(String(item.path||item.url).match(/\/(\d{10,})-/)?.[1]||0);};
 function render(){
  if(!api())return;const list=items(),board=builder.querySelector('[data-board]');board.replaceChildren();
  list.forEach((item,index)=>{const card=document.createElement('button');card.type='button';card.className='builder-media';card.draggable=true;card.dataset.id=item.id;card.setAttribute('aria-pressed',String(item.id===selected));card.setAttribute('aria-label',`Select ${item.alt||'media '+(index+1)}`);if(item.visible===false)card.classList.add('is-hidden');const video=/\.(mov|mp4|webm)(\?|$)/i.test(item.url);const media=document.createElement(video?'video':'img');media.src=/1788944597025-7a50e954\.mov/.test(item.url)?'/assets/gallery-page-1-1788944597025.mp4':item.url;if(video){media.muted=true;media.preload='metadata';}else{media.alt=item.alt||'Gallery photograph';media.loading='lazy';}const number=document.createElement('span');number.textContent=String(index+1).padStart(2,'0')+(item.visible===false?' · Hidden':'');card.append(media,number);card.onclick=()=>{selected=item.id;render();};card.ondragstart=e=>{e.dataTransfer.setData('application/x-yfa-media',item.id);e.dataTransfer.effectAllowed='move';};card.ondragover=e=>{if([...e.dataTransfer.types].includes('application/x-yfa-media'))e.preventDefault();};card.ondrop=e=>{if(busy)return;const from=e.dataTransfer.getData('application/x-yfa-media');if(!from)return;e.preventDefault();e.stopPropagation();api().reorder(from,item.id);report('Gallery reordered. Save draft or publish when ready.');};board.append(card);});
  const blocks=state()?.home?.blocks||[],blockBoard=builder.querySelector('[data-blocks]');blockBoard.replaceChildren();
  blocks.forEach(block=>{const card=document.createElement('button');card.textContent=block.type.toUpperCase()+' · '+(block.title||'Divider');card.className='builder-block-card';card.draggable=true;card.onclick=()=>{selected='block:'+block.id;render();};card.ondragstart=e=>e.dataTransfer.setData('application/x-yfa-block-id',block.id);card.ondragover=e=>e.preventDefault();card.ondrop=e=>{const id=e.dataTransfer.getData('application/x-yfa-block-id');if(id){e.preventDefault();e.stopPropagation();api().reorderBlock(id,block.id);}};blockBoard.append(card);});
  const inspector=builder.querySelector('[data-inspector]');inspector.replaceChildren();const item=list.find(i=>i.id===selected);if(item){const label=document.createElement('label');label.textContent='Image description';const alt=document.createElement('textarea');alt.value=item.alt||'';label.append(alt);const visibility=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=item.visible!==false;visibility.append(check,document.createTextNode(' Visible on website'));const apply=document.createElement('button');apply.textContent='Apply to draft';apply.onclick=()=>{api().update(item.id,{alt:alt.value,visible:check.checked});report('Media updated in draft.');};inspector.append(label,visibility,apply);for(const [offset,text] of [[-1,'Move earlier'],[1,'Move later']]){const move=document.createElement('button');move.textContent=text;const at=list.findIndex(i=>i.id===selected);move.disabled=!list[at+offset];move.onclick=()=>api().reorder(item.id,list[at+offset].id);inspector.append(move);}}
  const block=blocks.find(b=>'block:'+b.id===selected);
  if(block){inspector.replaceChildren();const fields={};for(const name of (block.type==='button'?['title','url']:block.type==='text'?['title','body']:[])){const label=document.createElement('label');label.textContent=name==='url'?'Destination URL':name==='body'?'Text':'Heading / label';const input=document.createElement(name==='body'?'textarea':'input');input.value=block[name]||'';fields[name]=input;label.append(input);inspector.append(label);}const visibility=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=block.visible!==false;visibility.append(check,document.createTextNode(' Visible on website'));const apply=document.createElement('button');apply.textContent='Apply block to draft';apply.onclick=()=>{const values=Object.fromEntries(Object.entries(fields).map(([key,input])=>[key,input.value]));api().updateBlock(block.id,{...values,visible:check.checked});report('Block updated in draft.');};const remove=document.createElement('button');remove.textContent='Remove block from draft';remove.onclick=()=>{api().removeBlock(block.id);selected=null;render();};inspector.append(visibility,apply,remove);}
  const history=api().history();builder.querySelector('[data-undo]').disabled=!history.undo;builder.querySelector('[data-redo]').disabled=!history.redo;
 }
 const preview=()=>{api()?.save();mode='preview';builder.querySelector('[data-board]').hidden=true;builder.querySelector('[data-blocks]').hidden=true;const frame=builder.querySelector('[data-frame]');frame.hidden=false;frame.dataset.viewport=viewport;frame.querySelector('iframe').src=route+(route.includes('?')?'&':'?')+'yfa-preview=1&t='+Date.now();report('Private draft preview. Publishing is a separate action.');};
 builder.querySelector('[data-arrange]').onclick=()=>{mode='arrange';builder.querySelector('[data-board]').hidden=false;builder.querySelector('[data-blocks]').hidden=false;builder.querySelector('[data-frame]').hidden=true;render();};
 builder.querySelector('[data-save]').onclick=()=>run(()=>api().save(),'Draft saved in this browser.');
 builder.querySelector('[data-preview]').onclick=()=>preview();
 builder.querySelector('[data-publish]').onclick=()=>run(()=>api().publish(),'Published to your website.');
 builder.querySelector('[data-undo]').onclick=()=>api()?.undo();builder.querySelector('[data-redo]').onclick=()=>api()?.redo();
 builder.querySelector('[data-page]').onchange=e=>{route=e.target.value;preview();};
 builder.querySelectorAll('[data-device]').forEach(button=>button.onclick=()=>{viewport=button.dataset.device;builder.querySelector('[data-frame]').dataset.viewport=viewport;builder.querySelectorAll('[data-device]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));});
 builder.querySelectorAll('[data-add-block]').forEach(button=>{button.onclick=()=>{if(api()&&!busy){api().createBlock(button.dataset.addBlock);report('Block added to draft.');}};button.ondragstart=e=>e.dataTransfer.setData('application/x-yfa-new-block',button.dataset.addBlock);});
 const upload=files=>run(()=>api().upload(files),'Media uploaded to draft. Publish when ready.');builder.querySelector('[data-files]').onchange=e=>{if(e.target.files.length)upload(e.target.files);};const canvas=builder.querySelector('.builder-canvas');canvas.ondragover=e=>{if([...e.dataTransfer.types].some(type=>['Files','application/x-yfa-new-block'].includes(type)))e.preventDefault();};canvas.ondrop=e=>{if(busy||!api())return;const type=e.dataTransfer.getData('application/x-yfa-new-block');if(type){e.preventDefault();api().createBlock(type);return;}if(e.dataTransfer.files.length){e.preventDefault();upload(e.dataTransfer.files);}};
 builder.querySelector('[data-controls]').onclick=()=>nav.querySelector('[data-area="media"]')?.click();
 window.addEventListener('yfa-editor-change',render);
 const syncAvailability=()=>{
  builder.querySelectorAll('[data-save],[data-publish],[data-files],[data-add-block]').forEach(e=>e.disabled=busy||!api());
  builder.querySelectorAll('[data-add-block]').forEach(e=>e.draggable=!!api()&&!busy);
  if(!api()){builder.querySelector('[data-undo]').disabled=true;builder.querySelector('[data-redo]').disabled=true;}
 };
 let connected=false;
 const ready=()=>{
  syncAvailability();
  if(api()){render();if(!connected)report('Ready. Your existing gallery is loaded.');connected=true;return true;}
  return false;
 };
 window.addEventListener('yfa-editor-ready',ready);
 window.addEventListener('yfa-open-editor',ready);
 let attempts=0,watched;
 const check=()=>{
  if(ready())return;
  const promise=window.YFA_MOTHERSHIP_POWER_READY;
  if(promise&&promise!==watched){watched=promise;promise.then(()=>{if(!ready())report('Gallery connection could not load. Reload Mothership to retry; page previews remain available.');}).catch(()=>report('Gallery connection could not load. Reload Mothership to retry.'));}
  if(++attempts<120)setTimeout(check,500);
  else report('Gallery connection is taking longer than expected. Reload Mothership to retry; page previews remain available.');
 };
 syncAvailability();check();
 show(true);
}
const observer=new MutationObserver(start);observer.observe(document.body,{childList:true,subtree:true});start();
}
activate();
})();
