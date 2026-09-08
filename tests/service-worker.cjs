const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const origin = 'https://example.test';
const base = origin + '/draft/';
const normalize = key => new URL(typeof key === 'string' ? key : key.url, base).href;
async function scenario(failInstall = false) {
  const handlers = {}, buckets = new Map();
  const caches = {
    async open(name) { if (!buckets.has(name)) buckets.set(name, new Map()); const data = buckets.get(name); return {
      async add(key) { data.set(normalize(key), new Response('installed:' + key)); },
      async addAll(keys) { if (failInstall) throw Error('missing dictionary'); for (const key of keys) data.set(normalize(key), new Response('installed:' + key)); },
      async match(key) { return data.get(normalize(key))?.clone(); },
      async put(key, value) { data.set(normalize(key), value); }
    }; },
    async keys() { return [...buckets.keys()]; },
    async delete(key) { return buckets.delete(key); },
    async match(key) { for (const data of buckets.values()) if (data.has(normalize(key))) return data.get(normalize(key)).clone(); }
  };
  let skip = false, claim = false, network = false;
  const context = { URL, Response, Promise, caches, fetch: async () => {if(!network) throw Error('offline');return new Response('network');}, self:{location:{origin},addEventListener:(event,fn)=>handlers[event]=fn,skipWaiting:async()=>skip=true,clients:{claim:async()=>claim=true}} };
  vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../service-worker.js'),'utf8'),context);
  const wait = type => new Promise((resolve,reject)=>handlers[type]({waitUntil:p=>p.then(resolve,reject)}));
  const request = async (url,mode='cors') => {let response;handlers.fetch({request:{url:normalize(url),method:'GET',mode},respondWith:p=>response=p});return response;};
  if(failInstall){await assert.rejects(wait('install'));assert(!skip);return;}
  await caches.open('noel-sca-app-v8'); await caches.open('noel-sca-runtime-v9'); await caches.open('noel-sca-app-v10'); await caches.open('noel-sca-app-v11'); await caches.open('noel-sca-app-v12'); await caches.open('noel-sca-app-v13'); await caches.open('unrelated-user-cache');
  await wait('install'); assert(skip); await wait('activate'); assert(claim);
  assert.deepEqual((await caches.keys()).sort(),['noel-sca-app-v16','unrelated-user-cache'].sort());
  assert.equal(await (await request('./flavor-reference.js')).text(),'installed:./flavor-reference.js');
  assert.equal(await (await request('./index.html','navigate')).text(),'installed:./index.html');
  assert.equal(await (await request('./missing-page','navigate')).text(),'installed:./offline.html');
  assert.equal((await request('./missing.js')).status,503);
  network=true;assert.equal(await (await request('./flavor-reference.js')).text(),'network');
  network=false;assert.equal(await (await request('./flavor-reference.js')).text(),'network');
}
(async()=>{await scenario();await scenario(true);console.log('PASS: install, scoped v8–v13 cleanup, offline dictionary/page, runtime fallback, failed-update protection. Mock Cache API; physical browser migration remains separate.');})().catch(error=>{console.error(error);process.exitCode=1;});
