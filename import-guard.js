(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CuppingImportGuard=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const M=typeof P0Model!=='undefined'?P0Model:require('./p0-model.js');
 const R=typeof RecordModel!=='undefined'?RecordModel:require('./record-model.js');
 const A=typeof AssessmentContextModel!=='undefined'?AssessmentContextModel:require('./assessment-context-model.js');
 const AR=typeof ArchiveReference!=='undefined'?ArchiveReference:require('./archive-reference.js');
 const MAX_BYTES=1048576,MAX_SESSIONS=50,MAX_SAMPLES=500;
 const SCORES=['scoreFragranceAroma','scoreFlavor','scoreAftertaste','scoreAcidity','scoreBody','scoreBalance','scoreOverall'];
 const plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
 function checkTree(value,depth=0,parentKey=''){
  if(depth>8)throw Error('데이터 중첩이 너무 깊습니다');
  if(typeof value==='string'&&value.length>5000)throw Error('문자열은 5000자 이하여야 합니다');
  if(typeof value==='number'&&!Number.isFinite(value))throw Error('유한한 숫자만 허용합니다');
  if(value&&typeof value==='object'){
   if(Array.isArray(value)&&value.length>500)throw Error('배열 항목이 너무 많습니다');
   for(const [key,v] of Object.entries(value)){if(['__proto__','constructor','prototype','toString','valueOf','toJSON'].includes(key)||key.length>80)throw Error('허용하지 않는 속성 이름입니다');
    if(parentKey==='sampleData'&&key==='archive_reference'){AR.validateSnapshot(v);continue;}
    if(parentKey==='sampleData'&&key==='archive_reference_history'){AR.validateRecord({archive_reference_history:v});continue;}
    checkTree(v,depth+1,key);}
  }
 }
 function id(value,label){if(typeof value!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(value))throw Error(label+' ID 형식이 올바르지 않습니다');return value;}
 function optionalText(x,key){if(x[key]!==undefined&&(typeof x[key]!=='string'||x[key].length>500))throw Error(key+'는 500자 이하 문자열이어야 합니다');}
 function sample(x,ids){
  if(!plain(x)||!plain(x.sampleData))throw Error('각 샘플에는 sampleData 객체가 있어야 합니다');
  const key=id(x.id,'샘플');if(ids.has(key))throw Error('중복 샘플 ID입니다');ids.add(key);optionalText(x,'title');
  for(const key of ['title','coffeeName','origin','variety','process','roastDate','roastLevel','tastingNotes'])if(x.sampleData[key]!==undefined&&typeof x.sampleData[key]!=='string')throw Error(key+'는 문자열이어야 합니다');
  for(const key of ['acidityLevel','sweetnessLevel','bodyLevel'])if(x.sampleData[key]!==undefined&&!['','Low','Med-Low','Medium','Med-High','High'].includes(x.sampleData[key]))throw Error('강도 선택값이 올바르지 않습니다');
  for(const key of ['defectUnderdevelopment','defectOverdevelopment','defectBaked','defectScorching'])if(x.sampleData[key]!==undefined&&!['none','very_weak','weak','moderate','strong','very_strong'].includes(x.sampleData[key]))throw Error('결점 선택값이 올바르지 않습니다');
  M.validate(x.sampleData);
  R.validate(x.sampleData.record_identity);
  A.validateAssessment(x.sampleData.assessment_context);
  A.validateBrewing(x.sampleData.brewing_context);
  AR.validateRecord(x.sampleData);
  for(const key of SCORES)if(x.sampleData[key]!==undefined&&x.sampleData[key]!==null){const v=x.sampleData[key];if(!M.valid(v)&&!M.preservedScore(x.sampleData,key))throw Error('새 평가 점수는 6~10 사이의 0.25 단위이며, 기존 0~10 원점수는 미확인 상태로만 보존합니다');}
  if(x.sampleData.flavorSelections!==undefined){if(!plain(x.sampleData.flavorSelections))throw Error('flavorSelections는 객체여야 합니다');for(const a of Object.values(x.sampleData.flavorSelections))if(!Array.isArray(a)||a.length>200||a.some(v=>typeof v!=='string'))throw Error('향미 선택은 문자열 배열이어야 합니다');}
  if(x.sampleData.bodyDescriptors!==undefined&&(!Array.isArray(x.sampleData.bodyDescriptors)||x.sampleData.bodyDescriptors.some(v=>typeof v!=='string')))throw Error('bodyDescriptors는 문자열 배열이어야 합니다');
 }
 function parse(raw){
  if(typeof raw!=='string'||new TextEncoder().encode(raw).length>MAX_BYTES)throw Error('파일은 1MB 이하여야 합니다');
  let data;try{data=JSON.parse(raw);}catch{throw Error('JSON 문법이 올바르지 않습니다');}
  if(plain(data)&&data.format==='noel-cupping-report')throw Error('리포트 JSON은 복구용 백업이 아닙니다. 전체 또는 선택 세션 복구용 JSON 백업을 선택하세요.');
  let selection=null;if(plain(data)&&data.format==='noel-cupping-review-backup'){if(data.version!==1||!plain(data.state))throw Error('지원하지 않는 백업 버전입니다');selection={currentSessionId:data.state.currentSessionId,currentSampleId:data.state.currentSampleId};data=data.state.sessions;}
  checkTree(data);if(!Array.isArray(data)||!data.length)throw Error('세션 또는 샘플의 비어 있지 않은 배열을 선택하세요');
  const sessionForm=plain(data[0])&&Object.hasOwn(data[0],'samples'),sampleIds=new Set(),sessionIds=new Set();let count=0;
  if(sessionForm){if(data.length>MAX_SESSIONS)throw Error('세션은 최대 50개입니다');for(const s of data){if(!plain(s)||!Array.isArray(s.samples)||!s.samples.length)throw Error('세션마다 샘플이 1개 이상 있어야 합니다');const key=id(s.id,'세션');if(sessionIds.has(key))throw Error('중복 세션 ID입니다');sessionIds.add(key);A.validateSession(s);for(const field of ['title','date','time','purpose','location','cupper','grindSize'])optionalText(s,field);for(const x of s.samples)sample(x,sampleIds);count+=s.samples.length;}}
  else{for(const x of data){if(Object.hasOwn(x,'samples'))throw Error('세션과 샘플 형식을 섞을 수 없습니다');sample(x,sampleIds);}count=data.length;}
  if(count>MAX_SAMPLES)throw Error('전체 샘플은 최대 500개입니다');
  const evaluations=new Set();for(const x of sessionForm?data.flatMap(s=>s.samples):data){const id=x.sampleData.record_identity?.evaluation_id;if(id){if(evaluations.has(id))throw Error('중복 평가 ID입니다. 원기록을 보존하고 복구 범위를 확인하세요.');evaluations.add(id);}}
  return {kind:sessionForm?'sessions':'samples',data,selection,sessionCount:sessionForm?data.length:1,sampleCount:count};
 }
 function atomicWrite(storage,entries){
  const before=entries.map(([key])=>[key,storage.getItem(key)]);let attempted=0;
  try{for(const [key,value] of entries){attempted++;storage.setItem(key,value);}}
  catch(error){let rollbackFailed=false;for(const [key,value] of before.slice(0,attempted)){try{if(value===null)storage.removeItem(key);else storage.setItem(key,value);}catch{rollbackFailed=true;}}throw Error(rollbackFailed?'저장과 일부 복원에 실패했습니다. 내보낸 백업을 보존하고 도움을 요청하세요':'저장에 실패해 기존 저장값으로 복원했습니다');}
 }
 return {MAX_BYTES,MAX_SESSIONS,MAX_SAMPLES,parse,atomicWrite};
});
