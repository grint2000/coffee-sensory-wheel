const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');
const scope={};vm.createContext(scope);
if(fs.existsSync(__dirname+'/explore.js'))vm.runInContext(fs.readFileSync(__dirname+'/explore.js','utf8'),scope);
const E=scope.ArchiveExplore;
// Regression fixture: unchanged original public dataset. Integrated additions: honduras.test.cjs.
const a=JSON.parse(fs.readFileSync(__dirname+'/data/snapshots/2026-11-11.ethiopia-profile-review-1.json'));
const plain=x=>JSON.parse(JSON.stringify(x));
test('GT/HN North America, PE South America, ET Africa; unknown preserved',()=>{
 assert.equal(E?.continent({iso2:'GT'}),'north');assert.equal(E.continent({iso2:'HN'}),'north');assert.equal(E.continent({iso2:'PE'}),'south');assert.equal(E.continent({iso2:'ET'}),'africa');assert.equal(E.continent({iso2:'ZZ'}),'unclassified');assert.equal(E.continent(), 'unclassified');
});
test('real public country/continent counts: no missing or duplicated farms',()=>{
 assert.equal(E.farms(a).length,49);
 for(const [key,count] of [['north',5],['south',39],['africa',5],['asia',0]])assert.equal(E.farms(a,key).length,count);
 assert.equal(new Set(['north','south','africa','unclassified'].flatMap(k=>E.farms(a,k).map(f=>f.id))).size,49);
});
test('country combination cannot leak another continent',()=>{
 for(const c of a.countries)for(const [key] of E.continents){const farms=E.farms(a,key,c.id);assert.ok(farms.every(f=>f.country_id===c.id));if(key!==E.continent(c))assert.equal(farms.length,0)}
});
test('unmapped ISO and missing country entity remain visible',()=>{
 const copy=structuredClone(a);copy.countries.push({id:'country-new',iso2:'ZZ'});copy.farms.push({id:'unmapped',country_id:'country-new'},{id:'orphan',country_id:'missing'});
 assert.deepEqual(plain(E.farms(copy,'unclassified').map(f=>f.id)),['unmapped','orphan']);assert.equal(E.farms(copy).length,51);
});
test('real exact raw variety counts, mixtures not split, all lots conserved',()=>{
 const rows=E.varieties(a);assert.deepEqual(Object.fromEntries(rows.map(r=>[r.raw,r.lotIds.length])),{'':1,'Bourbon, Geisha':1,'Geisha':32,'Geisha, Caturra':1,'Gesha':2,'Pacamára':1,'SL-09':12});assert.equal(rows.flatMap(r=>r.lotIds).length,50);
 assert.equal(rows.some(r=>r.raw==='Bourbon'),false);
});
test('North America summary excludes Peru and Ethiopian narrative claims',()=>{
 const rows=E.varieties(a,'north');assert.equal(rows.flatMap(r=>r.lotIds).length,11);assert.equal(rows.find(r=>r.raw==='Geisha').lotIds.length,7);assert.equal(E.varieties(a,'africa').length,0);
});
test('every raw group has unique farm counts and exact lot source links',()=>{
 for(const row of E.varieties(a)){
 const lots=a.lots.filter(l=>(l.variety||'')===row.raw);assert.deepEqual(new Set(row.farmIds),new Set(lots.map(l=>l.farm_id)));assert.deepEqual(new Set(row.sourceIds),new Set(lots.flatMap(l=>l.source_ids)));assert.ok(row.sourceIds.every(id=>a.sources.some(s=>s.id===id)));
 }
});
test('duplicate lots count as records but unique targets; Heirloom stays literal',()=>{
 const copy=structuredClone(a);copy.lots=[{id:'one',farm_id:a.farms[0].id,variety:'Heirloom',source_ids:[]},{id:'two',farm_id:a.farms[0].id,variety:'Heirloom',source_ids:[]}];
 const row=E.varieties(copy)[0];assert.equal(row.raw,'Heirloom');assert.equal(row.farmIds.length,1);assert.equal(row.lotIds.length,2);
});
test('summarizing does not mutate archive and empty data yields no guesses',()=>{
 const before=JSON.stringify(a);E.varieties(a);E.farms(a,'north');assert.equal(JSON.stringify(a),before);assert.equal(E.varieties({countries:[],farms:[],lots:[]}).length,0);
});
