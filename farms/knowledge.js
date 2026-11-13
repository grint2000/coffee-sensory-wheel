'use strict';
/* Separate reference layer: never mutates archive or infers lot identities. */
globalThis.Knowledge=(()=>{
 const M=KnowledgeModel,esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let data=null,sources=null,archive=null,navigate=null,state='loading',pending=null,continent='',history=[],opener=null;
 const label={verified:'참고 설명 확인 · 로트 검증 아님',partial:'부분 근거 · 동일성 미확인',unknown:'미확인 · 자료 미제공/추가 확인 필요'};
 const names={skin_pulp:'과피·과육',mucilage:'점액질',oxygen:'산소 조건',inoculation:'접종',washing:'세척',drying:'건조',hulling:'탈각',time_temperature:'시간·온도',stature:'수형',bean_size:'종자 크기',yield_potential:'수량 잠재력',quality_potential_high_altitude:'고지대 품질 잠재력',leaf_rust:'녹병 반응',nematodes:'선충 반응',coffee_berry_disease:'커피베리병 반응',nutrition:'영양 요구',genetic_group:'유전 그룹',lineage:'계통',history_original:'역사·유래 원문',agronomic_notes_original:'재배 관련 원문',altitude_original:'고도 범례 원문',altitude_selected:'선택된 고도 분류',value_original:'원문값',note:'참고·한계',species:'종',classification:'명칭 분류',identity_note:'동일성 범위',candidate_only:'후보 연결만',unverified_fields:'미확인 항목',registered_processing_examples:'등록 가공 공존 예시 · 인과 아님',process_raw:'가공 원문',crop_year:'수확연도',competition_year:'대회연도',source_ids:'기존 출처 IDs',country:'국가',subject:'적용대상',year:'연도·원문 맥락',method:'평가·시험 방법',evaluator:'평가자',evaluation_date:'평가일',acidity:'산미',sweetness:'단맛',body:'바디',aftertaste:'후미',harvest_period_reported:'판매자 표기 수확기간',study_harvest_period:'연구 수확기간',crop_year_note:'연도 해석 제한',fermentation_hours:'발효시간(시간)',fermentation_temperature_c:'발효온도(°C)',drying_days:'건조기간(일)',moisture_target_percent:'목표 수분(%)',measurement_type:'자료 유형',harvest:'원문 수확기간',steps_ko:'보고된 공정 순서',scope_warning:'적용 제한',resistance_caution:'저항성 한계',summary_ko:'한국어 요약',terms_original:'향미 원문',translation_ko:'한국어 표현',definition_original:'정의 원문',interpretation_ko:'해석·한계',term_original:'속성 원문',practical_characteristics_type:'해석 유형',numbers_are_global_sop:'공통 SOP 수치 여부',lot_quality_pass:'로트 합격 판정 여부',lot_identity_verified:'로트 동일성 검증 여부',processing_is_genetic_trait:'가공의 유전형질 여부'};
 const text=v=>v==null||v===''?'미확인 · 미상':Array.isArray(v)?v.map(text).join(' · '):typeof v==='boolean'?(v?'예':'아니요'):String(v);
 const find=id=>{
  for(const key of ['regional_guides','process_dictionary','process_value_links','variety_dictionary','variety_reference_profiles','claim_term_dictionary','sensory_explanations','flavor_examples','processing_case_examples']){
   const row=data?.[key]?.find(x=>x.id===id);if(row)return {key,row};
  }
  const source=sources?.sources.find(x=>x.id===id);if(source)return {key:'source',row:source};
  for(const source of sources?.sources||[]){const row=source.evidence_quotes.find(x=>x.id===id);if(row)return {key:'evidence',row,source};}
  return null;
 };
 const title=row=>row.title_ko||row.raw||row.catalog_subject||row.subject||row.title||'원문값 미확인';
 const button=(id,name)=>`<button class="knowledge-link" data-knowledge-id="${esc(id)}">${esc(name)}</button>`;
 const evidence=ids=>(ids||[]).map(id=>button(id,'근거 · '+id.replace('coffee-t8cdf6031-ev-',''))).join(' ');
 const limits=items=>(Array.isArray(items)?items:[items]).filter(Boolean).map(x=>`<p class="knowledge-warning">${esc(x)}</p>`).join('');
 function fields(obj){return `<dl class="knowledge-fields">${Object.entries(obj).map(([key,value])=>`<dt>${esc(names[key]||key)}</dt><dd>${value&&typeof value==='object'&&!Array.isArray(value)?fields(value):Array.isArray(value)&&value.some(x=>x&&typeof x==='object')?value.map(x=>fields(x)).join(''):esc(text(value))}</dd>`).join('')}</dl>`}
 function related(row){
  const rel=M.related(row),farms=new Set(rel.farms);
  for(const match of row.matches||[])farms.add(match.entity_id);
  return `<section class="knowledge-related"><h3>관련 실제 등록대상·로트</h3><p class="small">연결은 원문 출현·등록 관계일 뿐 품종 유전자/가공/관능 검증이 아닙니다.</p>${[...farms].map(id=>{const f=archive?.farms.find(f=>f.id===id);return f?`<a href="#farm=${esc(id)}" data-knowledge-farm="${esc(id)}">${esc(f.name)} · ${esc(id)}</a>`:''}).join(' ')}${rel.lots.map(id=>{const lot=archive?.lots.find(l=>l.id===id);return lot?`<a href="#farm=${esc(lot.farm_id)}&lot=${esc(id)}" data-knowledge-farm="${esc(lot.farm_id)}" data-knowledge-lot="${esc(id)}">${esc(lot.label||id)} · ${esc(id)}</a>`:''}).join(' ')}${!farms.size&&!rel.lots.length?'<p>연결된 실제 등록자료 없음 · 새 농장/로트를 만들지 않습니다.</p>':''}</section>`;
 }
 function statement(claim){return `<article class="knowledge-statement" data-statement="${esc(claim.id||'')}"><p>${esc(claim.text_ko)}</p><p class="knowledge-type">근거 유형: ${esc(claim.evidence_type||'참고 설명')}</p>${limits(claim.limitations||claim.limits||[])}<p>주장 연도: ${esc(text(claim.applies_to?.year))} · 발행/수확/대회연도로 대체하지 않음</p><details><summary>근거별 국가·대상·연도와 출처 보기</summary>${M.scopes(claim).map(scope=>`<div class="knowledge-scope">${fields(scope.applies_to)}${evidence([scope.evidence_ref])}</div>`).join('')||evidence(claim.evidence_refs)}<p class="small">국가/대상 합집합의 교차 적용 금지. 각 근거의 짝과 한계를 따릅니다.</p></details></article>`}
 function sourceView(source,quote){
  const scope=quote||source;
  return `<h3>${esc(source.title)}</h3><p>${esc(source.publisher)} · ${esc(source.evidence_type)}</p><p><a href="${safeURL(source.url)}" target="_blank" rel="noopener noreferrer">근거 URL · 원문 열기 ↗</a></p>${fields({발행연도:source.publication_year,확인시각:source.checked_at,읽기범위:scope.read_scope,적용범위:scope.applies_to})}${limits(source.limitations)}${limits(scope===source?[]:scope.limitations)}${limits(source.conflicts)}${quote?`<blockquote>${esc(quote.quote)}${quote.quote_truncated?' … [짧은 발췌 · 나머지는 원문 URL에서 확인]':''}</blockquote>${fields(quote.location)}`:`<details><summary>검토한 짧은 발췌 ${source.evidence_quotes.length}개</summary>${source.evidence_quotes.map(q=>button(q.id,q.read_scope)).join(' ')}</details>`}<p class="small">외부 원문 전체·내부 스냅샷은 공개 재호스팅하지 않습니다. 출처 설명은 로트 합격 증명이 아닙니다.</p>`;
 }
 function safeURL(url){try{const u=new URL(url);return /^https?:$/.test(u.protocol)?esc(u.href):'#'}catch{return '#'}}
 function rawButton(kind,value){const row=M.raw(data,kind,value);return `<button class="knowledge-link" data-knowledge-kind="${kind}" data-knowledge-raw="${esc(value??'')}">${esc(value||(kind==='variety'?'품종 미확인':'가공 미확인'))}</button><small class="knowledge-raw-status">${esc(row?label[row.status]:'미확인 · 설명 자료 확인 필요')}</small>`}
 function claimPart(claim,field='text'){
  const value=claim[field]||'';if(!data)return esc(value);
  const matches=data.claim_term_dictionary.flatMap(row=>(row.matches||[]).filter(m=>m.claim_id===claim.id&&m.field===field).map(m=>({...m,row}))).sort((a,b)=>a.start-b.start||b.end-a.end);
  let cursor=0,out='';for(const m of matches){if(m.start<cursor||value.slice(m.start,m.end)!==m.row.raw)continue;out+=esc(value.slice(cursor,m.start))+button(m.row.id,value.slice(m.start,m.end));cursor=m.end;}return out+esc(value.slice(cursor));
 }
 function recordView(key,row){
  if(key==='regional_guides')return `${limits('지역 참고가이드 · 외부 일반자료, 등록 농장/로트와 별도')}${row.reference_guide.map(statement).join('')}<h3>국가별 참고 사례</h3>${row.country_examples.map(c=>`<article class="knowledge-statement"><h4>${esc(c.country)}</h4><p>${esc(c.text_ko)}</p>${limits(c.limits||c.status)}${evidence(c.evidence_refs)}</article>`).join('')}`;
  if(key==='process_dictionary')return `${limits(row.unknowns)}${fields(row.axes)}${row.claims.map(statement).join('')}<details><summary>실무 확인사항 · 공통 SOP/합격규격 아님</summary><p>${esc(row.practical_characteristics_ko)}</p>${fields({practical_characteristics_type:row.practical_characteristics_type,numbers_are_global_sop:row.numbers_are_global_sop,lot_quality_pass:row.lot_quality_pass})}</details>${evidence(row.evidence_refs)}${relatedProcess(row.id)}`;
  if(key==='variety_reference_profiles')return `${limits('공식 품종 참고 · 해당 로트 유전적 동일성 미확인')}${limits(row.resistance_caution)}<p>${esc(row.summary_ko)}</p>${fields({species:row.species})}${Object.entries(row.fields).map(([key,value])=>`<details class="knowledge-field"><summary>${esc(names[key]||key)}: ${esc(text(value.value_original).slice(0,110))}${text(value.value_original).length>110?'…':''}</summary><p class="knowledge-original">${esc(text(value.value_original))}</p>${limits(value.note)}${evidence([value.evidence_ref])}</details>`).join('')}${relatedProfile(row.id)}`;
  if(['variety_dictionary','process_value_links','claim_term_dictionary'].includes(key)){
   const profiles=[row.reference_profile_id,...row.component_reference_ids||[],row.dictionary_ref].filter(Boolean);
   return `${limits(label[row.status]||'미확인')}${limits(row.identity_note||row.note)}${fields({classification:row.classification,candidate_only:row.candidate_only,unverified_fields:row.unverified_fields||['실제 가공 조건·관능 미확인']})}${profiles.map(id=>button(id,(row.candidate_only?'후보만 · 동일성 미확인: ':'참고 상세: ')+title(find(id)?.row||{}))).join(' ')}${related(row)}${evidence(row.evidence_refs)}${row.registered_processing_examples?`<details><summary>등록 가공 공존 예시 · 최적 가공/인과 아님</summary>${row.registered_processing_examples.map(x=>fields(x)).join('')}</details>`:''}`;
  }
  if(key==='sensory_explanations')return row.claims.map(statement).join('');
  if(key==='flavor_examples'){
   const type={seller_cupping_note:'생산자/판매자 설명 · 당사 직접 관능/실측 아님',experimental_sensory_result:'연구 결과 · 시험 조건/표본 범위 한정',industry_regional_tendency:'일반 업계 경향 · 개별 로트 보장 아님'}[row.type]||row.type;
   const keep=['country','subject','terms_original','translation_ko','crop_year','competition_year','harvest_period_reported','study_harvest_period','crop_year_note','method','evaluator','evaluation_date','acidity','sweetness','body','aftertaste'];
   return `${limits(type)}${limits(row.identity_status)}<p>발행처: ${esc(row.publisher)}</p><p>로스트/추출/평가자/평가일은 아래 원자료·근거의 명시 범위만 적용합니다. 미기재 조건은 미확인입니다.</p>${fields(Object.fromEntries(keep.map(k=>[k,row[k]])))}${evidence(row.evidence_refs)}${related(row)}`;
  }
  if(key==='processing_case_examples')return `${limits(row.scope_warning)}${fields(Object.fromEntries(Object.entries(row).filter(([k])=>!['id','evidence_refs','scope_warning'].includes(k))))}${evidence(row.evidence_refs)}`;
  return '<p>설명 자료 미확인 · 원문값을 그대로 보존합니다.</p>';
 }
 function relatedProcess(id){return `<h3>관련 등록 가공 원문</h3>${data.process_value_links.filter(x=>x.dictionary_ref===id).map(x=>button(x.id,x.raw||'가공 미확인')).join(' ')||'<p>연결된 등록 가공 원문 없음</p>'}`}
 function relatedProfile(id){return `<h3>관련 등록 품종 원문 · 동일성 확정 아님</h3>${data.variety_dictionary.filter(x=>x.reference_profile_id===id||x.component_reference_ids?.includes(id)).map(x=>button(x.id,x.raw)).join(' ')||'<p>연결된 등록 로트 없음</p>'}`}
 function dialog(){return document.querySelector('#knowledgeDialog')}
 function open(id,push=true){
  if(push)history.push(id);const found=find(id);
  document.querySelector('#knowledgeTitle').textContent=found?(found.key==='evidence'?'근거 발췌 · '+found.source.title:title(found.row)):'상세사전 · 자료 미확인';
  document.querySelector('#knowledgeBody').innerHTML=found?(found.key==='source'?sourceView(found.row):found.key==='evidence'?sourceView(found.source,found.row):recordView(found.key,found.row)):'<p class="knowledge-warning">설명 자료를 찾지 못했습니다. 원문/빈값은 그대로 보존하며 품종·공정·향미를 추정하지 않습니다.</p>';
  document.querySelector('#knowledgeBack').disabled=history.length<2;
  if(!dialog().open){opener=document.activeElement;dialog().showModal()}
  dialog().scrollTop=0;document.querySelector('#knowledgeTitle').focus();
 }
 function render(current=continent){
  continent=current;const panel=document.querySelector('#knowledgePanel');if(!panel)return;
  if(state!=='ready'){panel.innerHTML=`<h2>상세사전·지역 참고가이드</h2><p role="status">${state==='loading'?'설명 자료를 불러오고 있습니다.':'설명 자료를 불러오지 못했습니다. 기존 농장 탐색은 계속 사용할 수 있습니다.'}</p>${state==='error'?'<button id="retryKnowledge">설명 자료 다시 불러오기</button>':''}`;return;}
  const farms=ArchiveExplore.farms(archive,continent),ids=new Set(farms.map(f=>f.id)),lots=archive.lots.filter(l=>ids.has(l.farm_id));
  panel.innerHTML=`<h2>등록자료와 외부 참고를 나누어 읽기</h2><p class="knowledge-warning">등록자료 요약 · 국가 생산통계 아님 · 사용자 제공 미검증 포함<br>실제 등록대상 ${farms.length}곳 · 로트 ${lots.length}건 · 국가 ${new Set(farms.map(f=>f.country_id)).size}개</p>${!farms.length?'<p>선택 대륙의 등록자료 없음 · 외부 참고가이드만 제공하며 농장을 생성하지 않습니다.</p>':''}<div class="knowledge-guides">${M.guide(data,continent).map(g=>`<article><h3>${esc(g.title_ko)}</h3><p class="small">지역 참고가이드 · 외부 일반자료, 등록 농장/로트와 별도</p>${button(g.id,'지역 참고가이드 읽기')}</article>`).join('')||'<p>이 대륙의 외부 참고가이드 미확보</p>'}</div><details id="knowledgeCatalog"><summary>품종·가공 상세사전 전체 보기</summary><p class="knowledge-warning">참고사전 verified는 로트검증이 아닙니다. 기존 138개 주장 전체 재검증이 아니며 원문 표기를 자동 교정하지 않습니다.</p>${catalog('가공 개념',data.process_dictionary)}${catalog('등록 가공 원문',data.process_value_links)}${catalog('공식 품종 참고 · 단일 공식출처',data.variety_reference_profiles)}${catalog('등록 품종 원문',data.variety_dictionary)}${catalog('농장 소개 원문 명칭 · 미확인/부분 근거 포함',data.claim_term_dictionary)}</details><details id="knowledgeSensory"><summary>향미의 유형·조건·한계 읽기</summary><p class="knowledge-warning">필터만으로 향미를 만들지 않습니다. 새 시음·실측 없음 · 로트/수확·로스트/추출/평가자/평가일 조건을 따로 확인하세요.</p>${catalog('조건별 설명',data.sensory_explanations)}${catalog('유형별 향미 사례',data.flavor_examples)}${catalog('가공 사례 · 공통 SOP 아님',data.processing_case_examples)}${data.sensory_attribute_definitions.map(x=>`<details><summary>${esc(x.term_original)}</summary>${fields({definition_original:x.definition_original,interpretation_ko:x.interpretation_ko})}${evidence(x.evidence_refs)}</details>`).join('')}</details><details><summary>자료 차이·충돌과 해석 범위</summary>${data.conflicts.map(c=>fields(c)).join('')}${limits(data.boundaries_ko)}<p>${esc(data.claim_scope_contract.rule_ko)}</p></details><p class="small">설명 판본 ${esc(data.content_revision)} · ${sources.sources.length}개 공개 출처 카드</p>`;
 }
 function catalog(name,rows){return `<section class="knowledge-catalog-group"><h3>${esc(name)} ${rows.length}개</h3><div>${rows.map(row=>button(row.id,title(row))).join(' ')}</div></section>`}
 async function load(){
  if(pending)return pending;state='loading';render();
  pending=(async()=>{try{
   const responses=await Promise.all(['data/knowledge.json','data/knowledge-sources.json'].map(url=>fetch(url,{cache:'no-cache'})));
   if(responses.some(r=>!r.ok))throw Error('설명 자료 응답 실패');
   const [next,nextSources]=await Promise.all(responses.map(r=>r.json()));
   if(!M.valid(next,nextSources,archive.revision))throw Error('설명 자료 형식/기준 불일치');
   data=next;sources=nextSources;state='ready';render();document.dispatchEvent(new Event('knowledge-ready'));
  }catch(error){data=null;sources=null;state='error';render();}finally{pending=null}})();return pending;
 }
 function setup(a,go){archive=a;navigate=go;return load()}
 document.addEventListener('click',event=>{
  const raw=event.target.closest('[data-knowledge-kind]'),target=event.target.closest('[data-knowledge-id]'),link=event.target.closest('[data-knowledge-farm]');
  if(raw){history=[];const row=M.raw(data,raw.dataset.knowledgeKind,raw.dataset.knowledgeRaw);open(row?.id||'missing');return}
  if(target){if(!dialog().open)history=[];open(target.dataset.knowledgeId);return}
  if(link){event.preventDefault();dialog().close();navigate?.(link.dataset.knowledgeFarm,link.dataset.knowledgeLot);globalThis.history.replaceState(null,'',link.getAttribute('href'));return}
  if(event.target.id==='closeKnowledge')dialog().close();
  if(event.target.id==='knowledgeBack'&&history.length>1){history.pop();open(history.at(-1),false)}
  if(event.target.id==='retryKnowledge')load();
 });
 document.addEventListener('DOMContentLoaded',()=>{
  dialog().addEventListener('close',()=>{if(opener?.isConnected)opener.focus()});
  dialog().addEventListener('keydown',event=>{
   if(event.key!=='Tab')return;
   const focusable=[...dialog().querySelectorAll('button:not(:disabled),a[href],summary,[tabindex="0"]')].filter(el=>el.getClientRects().length);
   const first=focusable[0],last=focusable.at(-1),active=document.activeElement;
   if(!first){event.preventDefault();document.querySelector('#knowledgeTitle').focus();return;}
   if(active.id==='knowledgeTitle'||(!event.shiftKey&&active===last)||(event.shiftKey&&active===first)){
    event.preventDefault();(event.shiftKey?last:first).focus();
   }
  });
 });
 return Object.freeze({setup,render,rawButton,claimPart});
})();
