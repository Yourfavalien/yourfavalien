const fs=require('node:fs'),vm=require('node:vm'),{test}=require('node:test'),assert=require('node:assert/strict');
const source=fs.readFileSync('mothership-maintenance.js','utf8');
for(const mode of ['maintenance','campaign'])test('late '+mode+' settings still redirect after the display timeout',async()=>{
let settle;const redirects=[],timers=[];const window={location:{pathname:'/',search:'',hash:'',replace:u=>redirects.push(u)},setTimeout:fn=>{timers.push(fn);return 1},clearTimeout(){},setInterval(){}};
vm.runInNewContext(source,{window,document:{addEventListener(){}},localStorage:{getItem:()=>0},URLSearchParams,fetch:()=>new Promise(r=>settle=r)});
timers[0]();assert.equal(redirects.length,0);settle({ok:true,json:async()=>({enabled:mode==='maintenance',campaignEnabled:mode==='campaign'})});await new Promise(setImmediate);assert.deepEqual(redirects,[mode==='maintenance'?'/maintenance.html?from=%2F':'/dont-look-away.html?from=%2F']);
});
test('protected request times out and returns an actionable error',async()=>{
const source=fs.readFileSync('mothership-config.js','utf8').split('// Load the Orbit popup switch')[0];let abort;
const window={location:{hostname:'yourfavalien.com',pathname:'/mothership/admin.html'},fetch:(_u,o)=>new Promise((_r,reject)=>{o.signal.addEventListener('abort',()=>reject(Object.assign(new Error(),{name:'AbortError'})));})};
vm.runInNewContext(source,{window,AbortController,Response,setTimeout:fn=>{abort=fn;return 1},clearTimeout,Error});
const request=window.YFA_MOTHERSHIP_REQUEST('/test');abort();await assert.rejects(request,/timed out/);
});
test('expired dashboard session produces a sign-in error',async()=>{
const source=fs.readFileSync('mothership-config.js','utf8').split('// Load the Orbit popup switch')[0];const window={location:{hostname:'yourfavalien.com',pathname:'/mothership/admin.html'},fetch:async()=>({status:401})};
vm.runInNewContext(source,{window,AbortController,Response,setTimeout,clearTimeout,Error});await assert.rejects(window.YFA_MOTHERSHIP_REQUEST('/test'),/session has expired/);
});

test('upload adapter preserves the path and reports provider errors',async()=>{
const source=fs.readFileSync('mothership-config.js','utf8').split('// Load the Orbit popup switch')[0];const calls=[];let status=200;
const window={location:{hostname:'yourfavalien.com',pathname:'/mothership/admin.html'},fetch:async(u,o)=>{calls.push({url:u,method:o.method,body:o.body});return new Response(JSON.stringify(status===200?{ok:true}:{error:'Storage is temporarily unavailable.'}),{status,headers:{'Content-Type':'application/json'}});}};
vm.runInNewContext(source,{window,AbortController,Response,setTimeout,clearTimeout,Error});const storage=window.YFA_CLOUDFLARE_CLIENT.storage.from();
const success=await storage.upload('pages/gallery/test.png','test',{contentType:'image/png'});assert.equal(success.error,null);assert.equal(success.data.path,'pages/gallery/test.png');assert.equal(calls[0].method,'PUT');assert.equal(calls[0].url,'/mothership/api/assets/pages/gallery/test.png');
status=503;const failure=await storage.upload('pages/gallery/test.png','test');assert.match(failure.error.message,/Storage is temporarily unavailable/);assert.equal(failure.data,null);
});
