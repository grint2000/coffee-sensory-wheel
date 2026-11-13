const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const scope={};vm.createContext(scope);vm.runInContext(fs.readFileSync(__dirname+'/knowledge-model.js','utf8'),scope);const M=scope.KnowledgeModel;
const data=JSON.parse(fs.readFileSync(__dirname+'/data/knowledge.json')),src=JSON.parse(fs.readFileSync(__dirname+'/data/knowledge-sources.json')),a=JSON.parse(fs.readFileSync(__dirname+'/data/archive.json'));
const quotes=new Map(src.sources.flatMap(s=>s.evidence_quotes.map(q=>[q.id,q])));
function walk(v,fn){if(v&&typeof v==='object'){fn(v);for(const x of Object.values(v))walk(x,fn)}}
test('원자료 전체 배열: 가이드5/가공10/공식품종12/원문품종13/가공8/소개명칭35/향미5 보존',()=>{
 for(const [key,count] of Object.entries({regional_guides:5,process_dictionary:10,variety_reference_profiles:12,variety_dictionary:13,process_value_links:8,claim_term_dictionary:35,flavor_examples:5}))assert.equal(data[key].length,count,key);
 assert.equal(data.namespace,'coffee-t8cdf6031');assert.equal(src.sources.length,38);assert.equal(quotes.size,192);
});
test('모든 근거별 scope는 출처의 국가·대상·원문연도와 정확히 짝지음; 상위 연도 null',()=>{
 let n=0;walk(data,row=>{if(row.applies_to?.scope_rule==='evidence_scopes_v1'){
  assert.equal(row.applies_to.year,null);assert.equal(row.applies_to.not_cartesian_product,true);
  assert.deepEqual(JSON.parse(JSON.stringify(M.scopes(row))),row.applies_to.evidence_scopes);
  for(const x of row.applies_to.evidence_scopes){const q=quotes.get(x.evidence_ref);assert.ok(q);assert.equal(x.source_id,q.source_id);assert.deepEqual(x.applies_to,q.applies_to);n++}
 }});assert.ok(n>50);
});
test('참고용 JSON 모든 근거/사전/실제 farm/lot 참조 해소 및 원문값 전수 대응',()=>{
 const ids=new Set();walk(data,r=>{if(r.id)ids.add(r.id)});for(const [key,field] of [['variety_dictionary','variety'],['process_value_links','process']]){
  const raws=new Set(data[key].map(x=>x.raw));assert.deepEqual(raws,new Set(a.lots.map(l=>l[field])));
  for(const row of data[key]){const rel=M.related(row);for(const id of rel.farms)assert.ok(a.farms.some(f=>f.id===id));for(const id of rel.lots){const l=a.lots.find(l=>l.id===id);assert.ok(l);assert.equal(l[field],row.raw)}}
 }
 walk(data,row=>{for(const id of row.evidence_refs||[])assert.ok(quotes.has(id),id);if(row.evidence_ref)assert.ok(quotes.has(row.evidence_ref));for(const key of ['dictionary_ref','reference_profile_id'])if(row[key])assert.ok(ids.has(row[key]));});
});
test('Caturra Amarillo 문맥/Heirloom·SL-09·IH-90 unknown과 후보 상태 유지',()=>{
 assert.equal(data.claim_term_dictionary.find(x=>x.raw==='Caturra Amarillo').classification,'variety_related_name_unconfirmed_selection');
 assert.equal(data.claim_term_dictionary.find(x=>x.raw==='Heirloom').classification,'group_unspecified_not_single_variety');
 for(const raw of ['SL-09','IH-90'])assert.equal(M.raw(data,'variety',raw).status,'unknown');assert.equal(M.raw(data,'variety','IH-90').candidate_only,true);
 for(const p of data.variety_reference_profiles)assert.equal(p.lot_identity_verified,false);
 assert.equal(data.claim_scope_contract.lot_identity_verified,false);
});
test('공개 출처는 HTTPS 메타·192개 짧은 발췌만, 내부 경로/전체 스냅샷 제외',()=>{
 for(const s of src.sources){assert.match(s.url,/^https?:\/\//);assert.equal(s.snapshot_path,undefined);assert.ok(Object.hasOwn(s,'publication_year'));for(const q of s.evidence_quotes){assert.ok(q.quote.length<=360);assert.equal(q.location.file,undefined)}}
 walk(src,r=>{for(const key of Object.keys(r))assert.ok(!['snapshot_path','raw_response','html','pdf','file'].includes(key),key)});
 assert.ok(!JSON.stringify(src).includes('/home/'));
});
test('등록자료 없는 Asia/Oceania는 가이드만, 기존 엔티티/향미 생성 없음',()=>{
 for(const key of ['asia','oceania']){const rows=M.guide(data,key);assert.equal(rows.length,1);assert.equal(rows[0].registered_summary.farm_entity_count,0);assert.equal(rows[0].no_new_archive_entities,true)}
 assert.equal(M.guide(data,'europe').length,0);assert.equal(a.farms.length,67);assert.equal(a.lots.length,70);assert.equal(a.claims.length,138);
 for(const f of data.flavor_examples){assert.equal(f.crop_year,null);assert.equal(f.competition_year,null);assert.ok(f.type);assert.ok(Object.hasOwn(f,'method'));assert.ok(Object.hasOwn(f,'evaluation_date'))}
});
test('손상된 설명/출처 형식은 안전한 실패 경계로 거부, 정상 빈배열은 허용',()=>{
 assert.equal(M.valid(data,src,a.revision),true);
 for(const next of [null,{}, {...data,process_value_links:null}, {...data,process_dictionary:[null]}, {...data,baseline_revision:'wrong'}])assert.equal(M.valid(next,src,a.revision),false);
 for(const next of [null,{}, {...src,namespace:'wrong'}, {...src,sources:[{id:'x'}]}])assert.equal(M.valid(data,next,a.revision),false);
 assert.equal(M.valid({...data,regional_guides:[]},src,a.revision),true);
});
test('원문 exact lookup: IH-90과 SL-09는 자동 정규화하지 않음; null과 미등록은 안전 안내',()=>{
 const data={variety_dictionary:[{raw:'IH-90',status:'unknown',candidate_only:true},{raw:'SL-09',status:'unknown'}],process_value_links:[],claim_term_dictionary:[]};
 assert.equal(M.raw(data,'variety','IH-90').status,'unknown');assert.equal(M.raw(data,'variety','SL-09').status,'unknown');
 assert.equal(M.raw(data,'variety','SL28'),null);assert.equal(M.raw(data,'variety','ih-90'),null);assert.equal(M.raw(data,'variety',null),null);
});
