const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const M=require('../food-aroma-data.js');
const html=fs.readFileSync(require.resolve('../index.html'),'utf8');
const rows=vm.runInNewContext(html.match(/const FLAVOR_DATA = (\[[\s\S]*?\n\]);/)[1]);
const clone=x=>JSON.parse(JSON.stringify(x));
const study=()=>clone(M.orangeStudy);
const resolve=key=>M.resolve(key,rows.find(f=>f.slice(0,3).join('|')===key));

test('420 original classifications, names, colors and stored keys are byte-equivalent data',()=>{
 assert.equal(rows.length,420);
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(rows)).digest('hex'),'80df1b444271f6387b77a4aab50c887624651599e6dbff62420b01e3f0dda936');
 assert.equal(new Set(rows.map(f=>f.slice(0,3).join('|'))).size,420);
});
test('Navelina CP ranks are calculated from the entire Table 7 column',()=>{
 const result=resolve('Fruity|Citrus Fruit|Orange');
 assert.equal(result.status,'verified-ranking');
 assert.deepEqual(result.entries.map(e=>[e.rank,e.nameOriginal,e.reported,e.unit]),[[1,'Limonene','96.4','%'],[2,'β-Myrcene','2.0','%'],[3,'α-Pinene','0.5','%']]);
 assert.equal(M.orangeStudy.measurements.length,11);
 assert.equal(M.orangeStudy.measurements.reduce((s,m)=>s+Math.round(m.value*10),0),1000);
 assert.match(result.reference.part,/플라베도/);assert.match(result.reference.state,/CP/);
 assert.match(result.basisLabel,/GC-FID/);assert.match(result.basisNote,/실제 질량 함량이나 향 기여율이 아닙니다/);
 assert.match(result.sources[0].url,/10\.3934\/agrfood\.2025003/);
});
test('array order is not evidence of rank and source data stays immutable',()=>{
 const s=study();s.measurements.reverse();const before=JSON.stringify(s);
 assert.deepEqual(M.analyseStudy(s).entries.map(e=>e.nameOriginal),['Limonene','β-Myrcene','α-Pinene']);
 assert.equal(JSON.stringify(s),before);assert.ok(Object.isFrozen(M.orangeStudy.measurements[0]));
});
test('two measured compounds produce exactly two ranks',()=>{
 const s=study();s.measurements=s.measurements.filter(m=>['limonene','myrcene'].includes(m.compoundId));
 assert.deepEqual(M.analyseStudy(s).entries.map(e=>e.rank),[1,2]);
});
test('ties use competition ranks and include everyone tied at the third rank',()=>{
 const s=study();s.measurements=[{compoundId:'limonene',value:10},{compoundId:'myrcene',value:10},{compoundId:'pinene',value:5}];
 let r=M.analyseStudy(s);assert.deepEqual(r.entries.map(e=>e.rank),[1,1,3]);assert.ok(r.entries[0].tied&&r.entries[1].tied);
 s.measurements=[{compoundId:'limonene',value:10},{compoundId:'myrcene',value:8},{compoundId:'pinene',value:5},{compoundId:'sabinene',value:5}];
 assert.deepEqual(M.analyseStudy(s).entries.map(e=>e.rank),[1,2,3,3]);
});
for(const [field,value]of Object.entries({sourceId:'another-paper',food:'lemon',cultivar:'Moro',part:'juice',state:'heated juice',harvest:'2',sampleGroup:'other group',column:'HD',unit:'mg/L',basis:'gc-ms-relative-area',method:'headspace'})){
 test('mixed '+field+' is rejected rather than silently ranked',()=>{
  const s=study();s.measurements[0].context={[field]:value};const r=M.analyseStudy(s);
  assert.equal(r.status,'unverified');assert.equal(r.entries.length,0);
 });
}
test('concentration is labeled with its own unit, without GC or unit conversion',()=>{
 const s=study();Object.assign(s.reference,{basis:'mass-concentration',unit:'mg/L'});s.measurements=s.measurements.slice(0,2);
 const r=M.analyseStudy(s);assert.equal(r.basisLabel,'농도순');assert.ok(r.entries.every(e=>e.unit==='mg/L'));
});
for(const basis of ['OAV','paper-count','evidence-level'])test(basis+' cannot substitute for abundance',()=>{
 const s=study();s.reference.basis=basis;assert.equal(M.analyseStudy(s).status,'unverified');
});
for(const value of [null,undefined,NaN,-1,Infinity,'96.4',[1,2],101])test('missing, invalid or ranged value '+String(value)+' never becomes zero or a numeric rank',()=>{
 const s=study();s.measurements[0].value=value;const r=M.analyseStudy(s);
 assert.equal(r.status,'representative');assert.ok(r.entries.every(e=>e.rank===null));
 assert.equal(r.entries.find(e=>e.id==='pinene').value,null);
});
test('detection limits are not treated as exact values',()=>{
 const s=study();s.measurements[0].qualifier='less-than';assert.equal(M.analyseStudy(s).status,'representative');
});
test('synonyms merge once; conflicting measurements do not choose the larger value',()=>{
 const s=study();s.measurements=[{compoundId:'isoamylAcetate',value:2},{originalLabel:'3-Methylbutyl acetate',value:2}];
 assert.equal(M.analyseStudy(s).entries.length,1);
 s.measurements[1].value=3;const r=M.analyseStudy(s);assert.equal(r.status,'representative');assert.equal(r.entries[0].value,null);
});
test('mixture and undefined peaks are never split into invented individual ranks',()=>{
 const s=study();s.measurements=[{kind:'mixture',originalLabel:'Citral (neral + geranial)',value:50},{compoundId:'limonene',value:10}];
 const r=M.analyseStudy(s);assert.equal(r.entries.length,1);assert.equal(r.entries[0].id,'limonene');assert.match(r.issues.join(' '),/혼합/);
});
test('unknown source, unsupported unit, or unverified transcription has no ranked data',()=>{
 for(const change of [s=>s.sourceId='unknown',s=>s.reference.unit='OAV',s=>s.verified=false,s=>delete s.reference.sampleGroup]){
  const s=study();change(s);assert.equal(M.analyseStudy(s).status,'unverified');
 }
});
test('all 420 entries have explicit statuses, exact-key mapping and bilingual supported names',()=>{
 const counts={};for(const row of rows){const key=row.slice(0,3).join('|'),r=resolve(key);counts[r.status]=(counts[r.status]||0)+1;
  assert.equal(r.key,key);assert.ok(['verified-ranking','representative','unverified','not-applicable'].includes(r.status));
  if(['unverified','not-applicable'].includes(r.status))assert.equal(r.entries.length,0);
  for(const e of r.entries){assert.ok(e.nameKo&&e.nameOriginal);if(r.status==='representative')assert.equal(e.rank,null);}
 }
 assert.equal(counts['verified-ranking'],1);assert.equal(counts.representative,7);assert.equal(counts.unverified,328);assert.equal(counts['not-applicable'],84);
});
test('representative names do not inherit rank or coffee evidence gates',()=>{
 const banana=resolve('Fruity|Tropical Fruit|Banana');assert.equal(banana.entries.length,2);assert.ok(banana.entries.every(e=>e.rank===null&&e.value===null));
 assert.ok(!('primary'in banana)&&!('secondary'in banana)&&!('tertiary'in banana));
 for(const key of ['Fruity|Other Fruit|Green Apple','Fruity|Other Fruit|Red Apple','Fruity|Tropical Fruit|Ripe Banana','Fruity|Citrus Fruit|Blood Orange','Fruity|Stone Fruit|White Peach'])assert.equal(resolve(key).status,'unverified');
 assert.equal(resolve('Other|Mineral|Salt').status,'not-applicable');
 assert.equal(resolve('Other|Defect|Potato').status,'unverified');
});
test('public getFlavorEvidence integrates with the original flavor keys',()=>{
 const context=vm.createContext({window:{},FoodAromaData:M,FLAVOR_DATA:rows});vm.runInContext(fs.readFileSync(require.resolve('../flavor-evidence.js'),'utf8'),context);
 assert.equal(context.window.getFlavorEvidence('Fruity|Citrus Fruit|Orange').entries[0].reported,'96.4');
 assert.equal(context.window.getFlavorEvidence('unknown').status,'unverified');
});
test('new local assets load before the resolver and are included in the bumped app cache',()=>{
 assert.ok(html.indexOf('src="food-aroma-data.js"')<html.indexOf('src="flavor-evidence.js"'));
 assert.ok(html.includes('href="food-aroma.css"'));
 const sw=fs.readFileSync(require.resolve('../service-worker.js'),'utf8');
 assert.ok(sw.includes("'./food-aroma-data.js'"));assert.ok(sw.includes("'./food-aroma.css'"));
 assert.ok(sw.includes('v19-food-aroma'));
});
