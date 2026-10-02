/* CP-09/10 view adapter. No persistence or inferred evaluator attribution. */
function installHistoryTools(options = {}) {
  if (window.HistoryTools) return window.HistoryTools;
  const $ = id => document.getElementById(id);
  const model = CompareSearchModel.create({ scoreModel: P0Model, identityModel: RecordModel,
    contextModel: AssessmentContextModel, flavorData: FLAVOR_DATA, flavorPhases: FLAVOR_PHASES });
  const phaseLabels = Object.fromEntries(FLAVOR_PHASES.map(phase => [phase.id, phase.label]));
  const fieldLabels = { waterTemp:'수온', grindSize:'분쇄도', water_info:'물 정보', grinder:'분쇄기', ratio:'추출비', time:'시간', roastDate:'로스팅일', roastLevel:'로스팅 정도',
    lot_id:'로트', roast_batch_id:'로스팅 배치', farm_id:'농장 ID', producer_id:'생산자 ID', crop_year:'확인 크롭', process:'가공', 'record_identity.crop_year':'확인 크롭',
    'record_identity.farm_id':'농장 ID', 'farmName/aliases':'농장명·원문 별칭', 'session.purpose':'세션 목적', schema_id:'평가 양식', schema_version:'양식 버전', calculation_version:'산식 버전', scores:'점수', flavors:'향미' };
  for (const field of SCORE_FIELD_CONFIG) fieldLabels[field.id] = field.label;
  const sourceLabels = { manual:'직접 입력', 'instrument-transcribed':'기기 표시값 수동 전사', 'record-declared':'기록된 값' };
  const reasonLabels = { 'legacy-unconfirmed':'기존 기록 · 실제 평가 여부 미확인', 'unsupported-schema':'다른 평가 양식', 'unsupported-schema-version':'지원하지 않는 양식 버전', 'unsupported-calculation':'다른 산식',
    'invalid-score-contract':'점수 형식 확인 필요', 'incomplete-assessment':'명시 평가 미완료', 'invalid-identity':'식별 정보 확인 필요', 'unconfirmed-identity':'로트 식별 미확정', 'unknown-lot':'로트 ID 미확인',
    'unknown-roast-batch':'로스팅 배치 ID 미확인', 'unknown-evaluation':'평가 ID 미확인', 'stale-confirmed-context':'로트 확인 후 원문 변경', 'stale-confirmed-process':'확인한 가공과 원문 불일치',
    'missing-confirmed-context':'로트 확인 당시 원문 없음', 'session-mismatch':'세션 식별 불일치', 'invalid-condition-contract':'조건 값·단위·출처 확인 필요', 'duplicate-evaluation-id':'중복된 평가 ID',
    'unknown-condition':'값 또는 확인된 출처 없음', 'ineligible-anchor':'현재 기준 기록이 비교 조건을 충족하지 않음', 'different-schema':'평가 양식·산식 다름', 'different-cohort':'기준 기록과 다름',
    'different-lot-metadata':'같은 로트 ID의 농장·크롭·가공 정보 불일치', 'different-condition':'조건·단위·입력 출처 다름', 'unresolved-flavor-filter':'확인할 수 없는 향미',
    'missing-flavor':'선택한 향미가 없음', 'matched-flavor':'일치한 향미', 'matched-filter':'일치', 'unknown-filter-value':'확인한 값 없음', 'different-filter-value':'필터와 다름' };
  let terms = [], latest = null, viewVersion = 0;
  const node = (tag, text, id) => { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (id) e.id = id; return e; };
  const button = (text, id, action) => { const e=node('button',text,id);e.type='button';if(action)e.addEventListener('click',action);return e; };
  const paragraph = (parent,text,id) => { const e=node('p',text,id);parent.append(e);return e; };
  function panel(parent,id,title) { const e=node('details',undefined,id);e.className='history-panel';e.append(node('summary',title));parent.append(e);return e; }
  function select(parent,id,label,values=[]) { const l=node('label',label),e=node('select',undefined,id);l.htmlFor=id;l.append(e);parent.append(l);setOptions(e,values);return e; }
  function setOptions(select, values) {
    const previous=select.value;select.replaceChildren();
    for(const [value,label] of [['','전체'],...values]){const o=node('option',label);o.value=value;select.append(o);}
    if(previous&&!Array.from(select.options).some(o=>o.value===previous)){const o=node('option','이전 선택 · '+previous);o.value=previous;select.append(o);}
    select.value=previous||'';
  }
  const manager=$('sessionSelect').closest('section'),tools=node('section',undefined,'historyTools');tools.className='history-tools';manager.after(tools);
  const searchPanel=panel(tools,'historySearchPanel','향미로 전체 세션 이력 찾기');
  paragraph(searchPanel,'저장된 선택 향미를 검색합니다. 농장 설명·공급자 설명·문헌 사전은 관측 향미로 추가하지 않습니다. 작성자 출처가 확인되지 않은 기록은 그대로 표시합니다.');
  const form=node('div');form.className='history-filter-grid';searchPanel.append(form);
  const flavorLabel=node('label','향미 추가 · 여러 개 선택 가능');flavorLabel.htmlFor='historyFlavorInput';
  const flavorInput=node('input',undefined,'historyFlavorInput');flavorInput.type='text';flavorInput.setAttribute('list','historyFlavorOptions');flavorInput.placeholder='자스민 / 재스민 / 레몬';flavorLabel.append(flavorInput);form.append(flavorLabel);
  const datalist=node('datalist',undefined,'historyFlavorOptions');
  for(const label of [...new Set([...FLAVOR_DATA.flatMap(row=>[row[6]||row[2],row[2]]),'재스민'])]){const o=node('option');o.value=label;datalist.append(o);}form.append(datalist);
  const addFlavor=button('향미 추가','historyAddFlavor',()=>{const raw=flavorInput.value.trim();if(!raw)return;const resolved=model.resolveFlavor(raw);if(!resolved.id){searchStatus.textContent=resolved.status==='ambiguous'?'이 이름에 여러 향미가 있습니다. 향미의 전체 ID로 선택하세요.':'기존 향미 목록에서 정확한 이름을 선택하세요.';return;}if(!terms.some(term=>term.id===resolved.id))terms.push({raw,id:resolved.id});flavorInput.value='';renderTerms();runSearch();});form.append(addFlavor);
  flavorInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addFlavor.click();}});
  const chips=node('div',undefined,'historyFlavorChips');chips.className='history-chips';searchPanel.append(chips);
  const mode=select(form,'historyFlavorMode','향미 일치 방식',[['all','모두 일치'],['any','하나 이상 일치']]);mode.firstElementChild.remove();mode.value='all';
  const phase=select(form,'historyPhase','향미 단계',FLAVOR_PHASES.map(p=>[p.id,p.label]));
  const farm=select(form,'historyFarm','농장'),crop=select(form,'historyCrop','확인 크롭'),process=select(form,'historyProcess','가공'),purpose=select(form,'historyPurpose','세션 목적');
  const actions=node('div');actions.className='history-actions';searchPanel.append(actions);
  actions.append(button('이력 검색·새로고침','historySearchBtn',runSearch),button('필터 초기화','historyResetBtn',()=>{terms=[];for(const e of [phase,farm,crop,process,purpose])e.value='';mode.value='all';flavorInput.value='';renderTerms();runSearch();}));
  const searchStatus=paragraph(searchPanel,'패널을 열어 전체 세션 이력을 확인하세요.','historySearchStatus');searchStatus.setAttribute('role','status');
  const searchResults=node('div',undefined,'historySearchResults');searchPanel.append(searchResults);
  const excludedPanel=panel(searchPanel,'historySearchExcludedPanel','검색에서 제외된 기록');const searchExcluded=node('div',undefined,'historySearchExcluded');excludedPanel.append(searchExcluded);
  const comparePanel=panel(tools,'historyComparePanel','현재 기록과 조건을 맞춰 비교');
  paragraph(comparePanel,'같은 평가 양식·산식·로트·로스팅 배치와 확인된 조건만 비교합니다. 미확인 조건은 서로 같다고 보지 않습니다. 다른 기록의 원점수는 기존 비교에서 계속 열람할 수 있습니다.');
  paragraph(comparePanel,'확인할 조건: '+model.conditionKeys.map(key=>fieldLabels[key]).join(' · ')+'. 값·단위·입력 출처와 기기 이름도 맞춰 확인합니다. 시간 단위는 자동 변환하지 않습니다.');
  comparePanel.append(button('현재 기록을 기준으로 비교','historyCompareBtn',runCompare));
  const compareStatus=paragraph(comparePanel,'현재 선택한 샘플이 비교 기준입니다.','historyCompareStatus');compareStatus.setAttribute('role','status');
  const compareResults=node('div',undefined,'historyCompareResults');comparePanel.append(compareResults);
  const launchSearch=button('전체 이력·향미','openHistorySearch',()=>{searchPanel.open=true;runSearch();searchPanel.scrollIntoView({block:'start'});});$('sampleSearchClearBtn').after(launchSearch);
  const launchCompare=button('조건 맞춤 비교','openHistoryCompare',()=>{comparePanel.open=true;runCompare();comparePanel.scrollIntoView({block:'start'});});$('compareBtn').before(launchCompare);
  function renderTerms(){chips.replaceChildren();for(const term of terms){const e=button(term.raw+' ×',undefined,()=>{terms=terms.filter(t=>t.id!==term.id);renderTerms();runSearch();});e.setAttribute('aria-label',term.raw+' 검색 조건 제거');chips.append(e);}}
  function build(){const snapshot=P0Production.historySnapshot();const index=model.buildIndex(model.fromSessions(snapshot.sessions),{getAttribution:options.getAttribution});return {snapshot,index};}
  function fillFilters(index){
    const farms=new Map();for(const entry of index.entries){const s=entry.search;if(s.farmId)farms.set('id:'+s.farmId,(s.farmNames[0]||s.farmId)+' · '+s.farmId);for(const name of s.farmNames)farms.set('name:'+name,name+' · 원문 이름');}
    setOptions(farm,[...farms]);setOptions(crop,[...new Set(index.entries.map(e=>e.search.cropYear).filter(v=>v!==null))].sort().map(v=>[String(v),String(v)]));
    for(const [el,key]of [[process,'process'],[purpose,'purpose']])setOptions(el,[...new Set(index.entries.map(e=>e.search[key]).filter(v=>typeof v==='string'&&v.trim()))].map(v=>[v,v]));
  }
  function query(){return {flavors:terms.map(term=>term.id),flavorMode:mode.value,phaseIds:phase.value?[phase.value]:[],farmIds:farm.value.startsWith('id:')?[farm.value.slice(3)]:[],farmNames:farm.value.startsWith('name:')?[farm.value.slice(5)]:[],cropYears:crop.value?[Number(crop.value)]:[],processes:process.value?[process.value]:[],purposes:purpose.value?[purpose.value]:[]};}
  function reasonText(r){
    if(r.code==='matched-flavor')return '일치한 향미: '+r.detail.tags.map(tag=>{const label=getFlavorTextByKey(tag.id);return (phaseLabels[tag.phase]||'단계 미확인')+' · '+(tag.raw===tag.id||tag.raw===label?label:String(tag.raw)+' ('+label+')');}).join(', ');
    if(r.code==='missing-flavor')return '없는 향미: '+r.detail.missingIds.map(id=>getFlavorTextByKey(id)).join(', ');
    if(r.code==='incomplete-assessment')return '명시 평가 미완료: '+r.detail.missing.map(key=>fieldLabels[key]).join(', ');
    const field=fieldLabels[r.field]||'';return (field?field+' · ':'')+(reasonLabels[r.code]||'조건 확인 필요');
  }
  function reasons(parent,items){const list=node('ul');for(const r of items)list.append(node('li',reasonText(r)));parent.append(list);}
  function title(entry){return `${entry.raw.session.title||'세션'} / ${entry.raw.sample.title||entry.raw.sample.sampleData.coffeeName||'샘플'}`;}
  function card(entry){const e=node('article');e.className='history-result';e.append(node('h4',title(entry)));paragraph(e,P0Model.display(entry.raw.sample.sampleData));paragraph(e,'관측 출처: 저장된 선택 향미 · '+(entry.evaluator.status==='proven'?'작성자 UID 근거 확인':'작성자 미확인'),'');return e;}
  function navigation(entry,snapshot){
    const version=viewVersion;
    const target={sessionId:entry.raw.session.id,sampleId:entry.raw.sample.id,loadedUser:snapshot.loadedUser,accountScope:snapshot.accountScope,sampleRaw:JSON.stringify(entry.raw.sample),sessionRaw:JSON.stringify(Object.fromEntries(Object.entries(entry.raw.session).filter(([key])=>key!=='samples')))};
    return button('이 기록 열기',undefined,()=>{try{if(version!==viewVersion)throw Error('검색 결과가 바뀌었습니다. 다시 검색한 결과를 선택하세요.');P0Production.openHistoricalRecord(target);searchStatus.textContent='선택한 기록을 열었습니다. 수정 중이던 유효한 입력은 기존 저장 흐름으로 보관했습니다.';compareStatus.textContent='기준 기록이 바뀌었습니다. 조건 비교를 다시 실행하세요.';}catch(e){searchStatus.textContent='이동하지 않았습니다: '+e.message;}});
  }
  function runSearch(){try{
    viewVersion++;
    const built=build();latest=built;fillFilters(built.index);const result=model.search(built.index,query());searchResults.replaceChildren();searchExcluded.replaceChildren();
    for(const row of result.matched){const e=card(row.entry);if(row.matched.length)reasons(e,row.matched);else paragraph(e,'선택한 필터 없음 · 전체 이력');e.append(navigation(row.entry,built.snapshot));searchResults.append(e);}
    for(const row of result.excluded){const e=card(row.entry);reasons(e,row.excluded);e.append(navigation(row.entry,built.snapshot));searchExcluded.append(e);}
    excludedPanel.querySelector('summary').textContent=`검색에서 제외된 기록 ${result.excluded.length}개`;
    searchStatus.textContent=`일치 ${result.matched.length}개 / 전체 ${built.index.entries.length}개 · 제외 ${result.excluded.length}개. `+(result.matched.length?'':'일치하는 기록이 없습니다. 필터를 확인하세요. ')+(built.snapshot.dirty?'현재 미저장 입력은 일부만 반영될 수 있습니다. 입력을 저장한 뒤 새로 검색하세요.':'현재 앱에 불러온 전체 세션 기준입니다.');
  }catch(e){latest=null;searchResults.replaceChildren();searchExcluded.replaceChildren();searchStatus.textContent='검색하지 않았습니다: '+e.message;}}
  const number=value=>value===null?'없음':value.toFixed(2);
  function runCompare(){try{
    const {snapshot,index}=build();compareResults.replaceChildren();
    if(snapshot.dirty){compareStatus.textContent='미저장 입력이 있습니다. 현재 입력을 저장한 뒤 조건 비교를 실행하세요.';return;}
    const anchor=index.entries.find(e=>e.raw.session.id===snapshot.currentSessionId&&e.raw.sample.id===snapshot.currentSampleId);if(!anchor)throw Error('현재 기준 기록을 찾을 수 없습니다.');
    const result=model.compare(index,anchor.key);compareStatus.textContent=`기준: ${title(anchor)} · 포함 ${result.recordCount}개 / 제외 ${result.excluded.length}개`;
    paragraph(compareResults,`${result.nLabel} · 확인된 평가자의 반복 ${result.repeatCount}회 · 작성자 미확인 ${result.unknownAttributionCount}개`,'historyEvaluatorSummary');
    paragraph(compareResults,result.n===0?'평가별 작성자 UID를 입증하는 근거가 없어 확인된 평가자 n=0입니다. 로그인·이름·팀 저장 위치로 작성자를 추정하지 않습니다.':result.interpretation.note);
    if(result.unknownAttributionCount)paragraph(compareResults,'작성자 미확인 기록의 반복 여부는 알 수 없습니다.');
    paragraph(compareResults,`평가 이벤트 ${result.recordCount}개 · 평균 ${number(result.recordTotals.mean)} · 최솟값 ${number(result.recordTotals.min)} · 최댓값 ${number(result.recordTotals.max)} · 범위 ${number(result.recordTotals.range)} · 분산 ${number(result.recordTotals.populationVariance)}`,'historyDistribution');
    paragraph(compareResults,'범위·분산·개인 편차는 관측된 기록의 기술 통계입니다. 팀 합의의 신뢰도나 평가자 자격 순위가 아니며, 같은 사람의 반복 기록은 독립 참여자가 아닙니다.');
    if(result.n)paragraph(compareResults,'확인된 평가자별 평균에 동일 가중치를 준 평균: '+number(result.evaluatorMeans.mean)+' · 작성자 미확인 기록 제외');
    for(const evaluator of result.evaluators)paragraph(compareResults,`${evaluator.uid} · 기록 ${evaluator.recordCount}개 · 평균 ${number(evaluator.totals.mean)} · 확인된 평가자 평균과의 차이 ${number(evaluator.deviationFromEvaluatorMean)}`);
    const conditionList=panel(compareResults,'historyAnchorConditions','기준 기록의 조건 확인');conditionList.open=!!result.anchorReasons.length;
    for(const key of model.conditionKeys){const c=anchor.conditions[key];paragraph(conditionList,fieldLabels[key]+': '+(c.known?String(c.value)+(c.unit?' '+c.unit:'')+' · '+sourceLabels[c.source]+(c.instrument?' · '+c.instrument:''):'값 또는 확인된 출처 없음'));}
    if(result.anchorReasons.length){paragraph(compareResults,'현재 기준 기록이 엄격한 비교 조건을 충족하지 않아 집계하지 않았습니다.');reasons(compareResults,result.anchorReasons);}
    paragraph(compareResults,'전체 이력의 점수 결측·미확인 항목: '+Object.entries(result.missingByField).map(([key,count])=>fieldLabels[key]+' '+count+'개').join(' · '));
    const included=panel(compareResults,'historyIncludedRecords',`조건이 맞는 기록 ${result.included.length}개`),excluded=panel(compareResults,'historyComparisonExcluded',`비교에서 제외된 기록 ${result.excluded.length}개`);
    for(const row of result.included)included.append(card(row.entry));
    for(const row of result.excluded){const e=card(row.entry);reasons(e,row.excluded);excluded.append(e);}
  }catch(e){compareResults.replaceChildren();compareStatus.textContent='비교하지 않았습니다: '+e.message;}}
  function invalidate(event){viewVersion++;latest=null;searchResults.replaceChildren();searchExcluded.replaceChildren();compareResults.replaceChildren();excludedPanel.querySelector('summary').textContent='검색에서 제외된 기록';
    if(event?.detail?.reason==='account'||['cupping:account-changed','cupping:auth-ready'].includes(event?.type)){
      terms=[];renderTerms();flavorInput.value='';phase.value='';mode.value='all';for(const select of [farm,crop,process,purpose]){select.value='';setOptions(select,[]);}searchPanel.open=comparePanel.open=excludedPanel.open=false;
    }
    searchStatus.textContent='기록·입력·선택 상태가 바뀌었습니다. 이력을 다시 검색하세요.';compareStatus.textContent='기록·입력·선택 상태가 바뀌었습니다. 조건 비교를 다시 실행하세요.';
  }
  for(const el of [mode,phase,farm,crop,process,purpose])el.addEventListener('change',runSearch);
  searchPanel.addEventListener('toggle',()=>{if(searchPanel.open&&!latest)runSearch();});
  comparePanel.addEventListener('toggle',()=>{if(comparePanel.open&&!compareResults.children.length)runCompare();});
  for(const event of ['cupping:history-changed','cupping:account-changed','cupping:auth-ready'])window.addEventListener(event,invalidate);
  window.addEventListener('storage',event=>{if(!event.key||event.key.startsWith('noel_sca_'))invalidate({type:'cupping:account-changed'});});
  window.HistoryTools={runSearch,runCompare,invalidate,model};return window.HistoryTools;
}
