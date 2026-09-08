const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const scope='https://example.test/draft/',prefix='noel-sca:%2Fdraft%2F:',normalize=x=>typeof x==='string'?new URL(x,scope).href:x.url;
async function run(fail=false){
 const handlers={},buckets=new Map();let skip=false,claim=false,mode='offline',calls=0;
 const caches={async open(name){if(!buckets.has(name))buckets.set(name,new Map());const entries=buckets.get(name);return {async addAll(urls){if(fail)throw Error('required library failed');urls.forEach(url=>entries.set(normalize(url),new Response('cached:'+url)));},async match(url){return entries.get(normalize(url))?.clone();}};},async keys(){return [...buckets.keys()]},async delete(key){return buckets.delete(key)}};
 const context={URL,Response,Set,AbortController,Promise,setTimeout:fn=>setTimeout(fn,1),clearTimeout,caches,fetch:async()=>{calls++;if(mode==='hang')return new Promise(()=>{});if(mode==='server')return new Response('bad',{status:503});throw Error('offline');},self:{registration:{scope},addEventListener:(key,fn)=>handlers[key]=fn,skipWaiting:async()=>skip=true,clients:{claim:async()=>claim=true}}};
 vm.runInNewContext(fs.readFileSync('service-worker.js','utf8'),context);
 const lifecycle=key=>new Promise((res,rej)=>handlers[key]({waitUntil:p=>p.then(res,rej)}));
 await caches.open('noel-sca-app-v17');await caches.open('unrelated');await caches.open('noel-sca:%2Fmain%2F:app-v18');await caches.open(prefix+'app-v17');
 if(fail){await assert.rejects(lifecycle('install'));assert(!skip);assert(buckets.has(prefix+'app-v17'));return;}
 await lifecycle('install');await lifecycle('activate');assert(skip&&claim);assert(!buckets.has(prefix+'app-v17'));assert(buckets.has('noel-sca-app-v17'));assert(buckets.has('noel-sca:%2Fmain%2F:app-v18'));
 function request(url,requestMode='cors',method='GET'){let response;handlers.fetch({request:{url:new URL(url,scope).href,mode:requestMode,method},respondWith:p=>response=p});return response;}
 assert.match(await (await request('./','navigate')).text(),/index.html/);assert.equal(calls,0,'offline shell never waits for network');
 assert.match(await (await request('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js')).text(),/cached:/);
 assert.equal(request('https://firestore.googleapis.com/v1/private'),undefined);assert.equal(request('https://identitytoolkit.googleapis.com/v1/projects'),undefined);assert.equal(request('./api/private'),undefined);assert.equal(request('./index.html','cors','POST'),undefined);
 mode='hang';assert.match(await (await request('./unknown','navigate')).text(),/offline.html/);
 mode='server';assert.match(await (await request('./unknown','navigate')).text(),/offline.html/);
 const shell=buckets.get(prefix+'app-v18');shell.delete(new URL('index.html',scope).href);mode='hang';assert.equal((await request('./index.html')).status,503);
}
(async()=>{await run();await run(true);console.log('PASS: complete library/shell install, offline cache-first, scoped cleanup, API exclusion, hung/5xx navigation fallback, failed-install retention. Mock Cache API.');})().catch(e=>{console.error(e);process.exitCode=1});
