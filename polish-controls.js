(()=>{
'use strict';
const style=document.createElement('style');style.textContent=`
.yfa-header,.yfa-header.is-solid,.yfa-header.is-scrolled{background:transparent!important;backdrop-filter:none!important}
html[data-yfa-redesign-shell] body,html[data-yfa-redesign-shell] main{font-family:YFAInter,Arial,sans-serif!important}
.yfa-nav a{border:0!important;border-radius:0!important;box-shadow:none!important;background:transparent!important;font-family:YFAInter,Arial,sans-serif!important}
.yfa-nav a:focus-visible,button:focus-visible,a:focus-visible{outline:2px solid #fff!important;outline-offset:5px}
.yfa-footer{position:fixed!important;bottom:0;left:0;right:0;z-index:90;width:100%!important;min-height:0!important;height:auto!important;padding:12px 24px!important;background:#000!important;display:block!important;font:9px/1.5 YFAInter,Arial,sans-serif!important}
.yfa-footer>img,.yfa-footer>a{display:none!important}.yfa-footer__links{justify-content:center!important;gap:12px!important}.yfa-footer__copyright{font-size:8px!important}
.yfa-more{position:fixed;bottom:12px;left:50%;transform:translateX(-50%);z-index:100;background:#000c;color:white;border:0;padding:9px 16px;font:10px Arial;letter-spacing:.18em}
.yfa-a11y{position:fixed;bottom:12px;left:12px;z-index:110;background:#000c;color:white;border:1px solid #ffffff55;padding:6px;font:10px Arial}.yfa-options{position:fixed;bottom:48px;left:12px;z-index:111;background:#111;color:#fff;padding:18px;max-width:280px}.yfa-options label{display:block;margin:12px 0}
html.yfa-readable body{font-family:Arial,sans-serif!important;letter-spacing:.025em;line-height:1.6}html.yfa-contrast{--white:#fff;--black:#000}html.yfa-contrast p,html.yfa-contrast a{opacity:1!important;color:#fff!important}html.yfa-reduce *,html.yfa-reduce *:before,html.yfa-reduce *:after{animation:none!important;transition:none!important;scroll-behavior:auto!important}
@media(max-width:700px){.yfa-footer{padding:20px 40px!important;max-height:45vh;overflow:auto}.yfa-footer:not(.is-open){display:none!important}.yfa-more:not(:focus-visible):not(.is-visible){opacity:0;pointer-events:none}.yfa-footer__links{justify-content:flex-start!important}}
`;document.head.append(style);
const footer=document.querySelector('.yfa-footer');
if(footer){
 const host=footer.querySelector('.yfa-footer__links');if(host&&!host.querySelector('a[href="/contact.html"]')){const contact=document.createElement('a');contact.href='/contact.html';contact.textContent='Contact';host.append(contact);}

 const more=document.createElement('button');more.className='yfa-more';more.textContent='MORE';more.setAttribute('aria-expanded','false');more.setAttribute('aria-controls','yfa-utility-footer');footer.id='yfa-utility-footer';
 const mobile=matchMedia('(max-width:700px)');more.hidden=!mobile.matches;mobile.addEventListener('change',()=>more.hidden=!mobile.matches);
 let open=false,timer;const toggle=()=>{open=!open;footer.classList.toggle('is-open',open);more.textContent=open?'CLOSE':'MORE';more.setAttribute('aria-expanded',String(open));if(open)footer.querySelector('a,button')?.focus();};more.onclick=toggle;document.body.append(more);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&open){toggle();more.focus();}});
 let movement=0,last=0;const direction=delta=>{if(open||!mobile.matches)return;if(Math.sign(delta)!==Math.sign(last))movement=0;last=delta;movement+=delta;if(movement<-60){more.classList.add('is-visible');clearTimeout(timer);timer=setTimeout(()=>more.classList.remove('is-visible'),3500);movement=0;}else if(movement>30){more.classList.remove('is-visible');movement=0;}};
 addEventListener('wheel',e=>direction(e.deltaY||e.deltaX),{passive:true});let touchY,touchX;addEventListener('touchstart',e=>{touchY=e.touches[0].clientY;touchX=e.touches[0].clientX;},{passive:true});addEventListener('touchmove',e=>{const y=e.touches[0].clientY,x=e.touches[0].clientX;direction(Math.abs(touchY-y)>Math.abs(touchX-x)?touchY-y:touchX-x);touchY=y;touchX=x;},{passive:true});
}
const trigger=document.createElement('button');trigger.className='yfa-a11y';trigger.textContent='Accessibility';trigger.setAttribute('aria-expanded','false');const panel=document.createElement('section');panel.className='yfa-options';panel.hidden=true;panel.setAttribute('aria-label','Accessibility preferences');
for(const [key,label] of [['readable','Readable text'],['contrast','Higher contrast'],['reduce','Reduce motion']]){const row=document.createElement('label'),input=document.createElement('input');input.type='checkbox';try{input.checked=localStorage.getItem('yfa-access-'+key)==='1';}catch{};const apply=()=>{document.documentElement.classList.toggle('yfa-'+key,input.checked);try{localStorage.setItem('yfa-access-'+key,input.checked?'1':'0');}catch{}};input.onchange=()=>{apply();if(key==='reduce')document.querySelectorAll('[data-home-gallery] video,[data-full-gallery] video').forEach(v=>{v.controls=input.checked;if(input.checked)v.pause();});};apply();row.append(input,document.createTextNode(' '+label));panel.append(row);}
trigger.onclick=()=>{panel.hidden=!panel.hidden;trigger.setAttribute('aria-expanded',String(!panel.hidden));};document.body.append(trigger,panel);const utility=document.createElement('button');utility.type='button';utility.textContent='Accessibility';utility.onclick=()=>{panel.hidden=false;trigger.setAttribute('aria-expanded','true');panel.querySelector('input')?.focus();};footer?.querySelector('.yfa-footer__links')?.append(utility);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){panel.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.focus();}});
})();
