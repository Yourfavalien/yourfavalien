import test from 'node:test';
import assert from 'node:assert/strict';
import {publicRedirect} from '../share-preview-worker/worker.mjs';
for (const [old,clean] of Object.entries({'/index.html':'/','/contact.html':'/contact','/socials.html':'/socials','/contact/':'/contact','/socials/':'/socials','/about.html':'/','/redesign-gallery.html':'/'})) {
 test(`${old} redirects once and keeps the query`,()=>{
  const result=publicRedirect(new Request('https://yourfavalien.com'+old+'?source=a'));
  assert.equal(result.status,301);assert.equal(result.headers.get('location'),'https://yourfavalien.com'+clean+'?source=a');
  assert.equal(publicRedirect(new Request(result.headers.get('location'))),null);
 });
}
for(const route of ['/','/contact','/socials','/mothership/admin.html','/mothership/login.html','/mothership/api/settings/theme','/api/settings/theme','/help','/privacy.html','/assets/example.png'])test(`${route} is not redirected`,()=>assert.equal(publicRedirect(new Request('https://yourfavalien.com'+route)),null));
test('POSTs and private www routes remain unchanged',()=>{
 assert.equal(publicRedirect(new Request('https://yourfavalien.com/contact.html',{method:'POST'})),null);
 assert.equal(publicRedirect(new Request('https://www.yourfavalien.com/mothership/admin.html')),null);
});
test('www public URLs have one canonical destination',()=>assert.equal(publicRedirect(new Request('https://www.yourfavalien.com/contact.html?q=1')).headers.get('location'),'https://yourfavalien.com/contact?q=1'));
