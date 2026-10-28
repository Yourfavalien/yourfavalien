(()=>{
if(new URLSearchParams(location.search).get('editor-preview')!=='1')return;
document.body.classList.add('yfa-editor-preview');document.body.dataset.workspaceArea='dashboard';
const css=document.createElement('link');css.rel='stylesheet';css.href='editor-workspace.css?v=20261028-1';document.head.append(css);
function mount(){
 const nav=document.querySelector('.yfa-app-nav');if(!nav||nav.dataset.organized)return;nav.dataset.organized='1';
 for(const area of ['dashboard','editor','pages','media','design','socials','campaign','maintenance','popup','settings']){const button=nav.querySelector(`[data-area="${area}"]`);if(button)nav.append(button);}
 for(const [area,label] of [['dashboard','WORKSPACE'],['editor','WEBSITE'],['campaign','SITE OPERATIONS'],['settings','CONFIGURATION']]){const node=nav.querySelector(`[data-area="${area}"]`);if(node){const heading=document.createElement('span');heading.className='yfa-nav-group';heading.textContent=label;node.before(heading);}}
 nav.addEventListener('click',event=>{const button=event.target.closest('[data-area]');if(button)document.body.dataset.workspaceArea=button.dataset.area;});
 const main=document.querySelector('.yfa-app-main');const search=document.createElement('input');search.className='yfa-workspace-search';search.type='search';search.placeholder='Find a control…';search.setAttribute('aria-label','Find a website control');main.prepend(search);
 const controls=document.getElementById('controlsView');if(controls){let group;for(const node of [...controls.children]){if(node.matches('.section-head')){group=document.createElement('details');group.className='yfa-control-section';group.open=true;const summary=document.createElement('summary');summary.textContent=node.querySelector('h2')?.textContent||'Website controls';group.append(summary);node.before(group);}if(group)group.append(node);}}
 search.addEventListener('input',()=>{const term=search.value.trim().toLowerCase();if(term){nav.querySelector('[data-area="design"]')?.click();}document.querySelectorAll('.yfa-control-section').forEach(group=>{group.hidden=!!term&&!group.textContent.toLowerCase().includes(term);if(term&&!group.hidden)group.open=true;});});
}
const observer=new MutationObserver(mount);observer.observe(document.body,{childList:true,subtree:true});mount();
})();
