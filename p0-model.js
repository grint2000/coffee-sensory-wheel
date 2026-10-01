(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.P0Model=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const SCORES=['scoreFragranceAroma','scoreFlavor','scoreAftertaste','scoreAcidity','scoreBody','scoreBalance','scoreOverall'];
 const SCHEMA='noel-explicit-v1',LEGACY='legacy-noel-v1',CALC='noel-30-plus-seven-v1';
 const clone=x=>JSON.parse(JSON.stringify(x));
 const valid=v=>typeof v==='number'&&Number.isFinite(v)&&v>=6&&v<=10&&Number.isInteger(v*4);
 const legacyValid=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=10&&Number.isInteger(v*4);
 function preservedScore(d,k){return legacyValid(d[k])&&(d.schema_id===undefined||d.schema_id===LEGACY||(d.schema_id===SCHEMA&&d.assessed_fields?.[k]===false&&d.legacy_original?.scores?.[k]===d[k]));}
 function fresh(){return {...Object.fromEntries(SCORES.map(k=>[k,null])),schema_id:SCHEMA,schema_version:1,calculation_version:CALC,assessed_fields:Object.fromEntries(SCORES.map(k=>[k,false]))};}
 function validate(d){
  if(d.schema_id!==undefined&&!([SCHEMA,LEGACY].includes(d.schema_id)))throw Error('지원하지 않는 평가 양식입니다. 다른 양식을 섞어 복구하지 않습니다');
  if(d.schema_id!==undefined&&(d.schema_version!==1||d.calculation_version!==CALC))throw Error('지원하지 않는 평가 또는 산식 버전입니다');
  if(d.schema_id===SCHEMA){
   if(!d.assessed_fields||typeof d.assessed_fields!=='object'||Array.isArray(d.assessed_fields))throw Error('항목별 평가 확인 정보가 필요합니다');
   for(const k of SCORES){if(typeof d.assessed_fields[k]!=='boolean')throw Error('평가 확인은 true/false여야 합니다');if(d.assessed_fields[k]&&!valid(d[k]))throw Error('평가한 항목에 유효한 점수가 필요합니다');}
  }
  if(d.legacy_original){const o=d.legacy_original;if(!o.scores||typeof o.scores!=='object'||Array.isArray(o.scores)||!Number.isFinite(o.display_total)||o.display_total!==legacyTotal(o.scores))throw Error('기존 원점수와 보존 합계가 일치하지 않습니다');for(const k of SCORES)if(o.scores[k]!==undefined&&o.scores[k]!==null&&!legacyValid(o.scores[k]))throw Error('기존 원점수 형식이 올바르지 않습니다');}
 }
 function legacyTotal(d){return 30+SCORES.reduce((sum,k)=>{const v=Number.parseFloat(d[k]);return sum+(Number.isNaN(v)?7:Math.min(10,Math.max(6,Math.round(v*4)/4)));},0);}
 function hydrate(input){
  const d=clone(input);validate(d);
  if(d.schema_id===undefined){
   d.schema_id=LEGACY;d.schema_version=1;d.calculation_version=CALC;
   d.legacy_original={scores:Object.fromEntries(SCORES.filter(k=>Object.hasOwn(input,k)).map(k=>[k,input[k]])),display_total:legacyTotal(input)};
  }
  if(d.schema_id===LEGACY&&!d.legacy_original)d.legacy_original={scores:Object.fromEntries(SCORES.filter(k=>Object.hasOwn(d,k)).map(k=>[k,d[k]])),display_total:legacyTotal(d)};
  return d;
 }
 function assess(d,k,value){
  if(!SCORES.includes(k))throw Error('알 수 없는 점수 항목');
  if(value!==null&&!valid(value))throw Error('점수는 6~10, 0.25 단위입니다');
  if(d.schema_id===LEGACY){d.schema_id=SCHEMA;d.assessed_fields=Object.fromEntries(SCORES.map(key=>[key,false]));}
  d[k]=value;d.assessed_fields[k]=value!==null;
 }
 function summary(d){
  if(d.schema_id===LEGACY||d.schema_id===undefined)return {status:'legacy-unknown',count:0,total:null,legacyTotal:d.legacy_original?.display_total??legacyTotal(d)};
  const count=SCORES.filter(k=>d.assessed_fields?.[k]===true&&valid(d[k])).length;
  return {status:count===7?'complete':count?'partial':'unassessed',count,total:count===7?30+SCORES.reduce((a,k)=>a+d[k],0):null};
 }
 function display(d){const s=summary(d||{});return s.status==='legacy-unknown'?`${s.legacyTotal.toFixed(2)} · 기존 기록 / 평가 여부 미확인`:s.total===null?`미평가 (${s.count}/7)`:s.total.toFixed(2);}
 function aggregates(samples){const values=samples.map(x=>summary(x.sampleData)).filter(s=>s.status==='complete').map(s=>s.total);return {count:values.length,excluded:samples.length-values.length,average:values.length?values.reduce((a,b)=>a+b,0)/values.length:null};}
 function writeState(storage,key,state){const raw=JSON.stringify(state);storage.setItem(key,raw);return raw;}
 return {SCORES,SCHEMA,LEGACY,CALC,fresh,validate,hydrate,assess,summary,display,aggregates,valid,preservedScore,writeState,clone};
});
