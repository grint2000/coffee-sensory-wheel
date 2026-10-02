(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.OcrApplyModel=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const FIELDS=Object.freeze({coffeeName:'품명',lotNumber:'로트',harvestYear:'크롭',process:'가공'});
 const clone=value=>JSON.parse(JSON.stringify(value));
 function buildPatch(fields,selectedFields){
  const map={name:'coffeeName',lot:'lotNumber',crop:'harvestYear',process:'process'},patch={};
  if(!fields||!Array.isArray(selectedFields))throw Error('확인한 후보와 직접 선택한 항목이 필요합니다.');
  for(const field of selectedFields){if(!Object.hasOwn(map,field))throw Error('코드·가격·점수는 라벨 적용 대상이 아닙니다.');if(fields[field]!==null&&fields[field]!==undefined)patch[map[field]]=fields[field];}
  return patch;
 }
 function prepare(data,patch){
  if(!data||typeof data!=='object'||Array.isArray(data))throw Error('현재 평가 원문을 읽지 못했습니다.');
  if(!patch||typeof patch!=='object'||Array.isArray(patch)||!Object.keys(patch).length)throw Error('적용할 라벨 항목을 직접 선택하세요.');
  for(const [key,value]of Object.entries(patch)){
   if(!Object.hasOwn(FIELDS,key))throw Error('라벨 적용 범위는 품명·로트·크롭·가공 4개 항목입니다.');
   if(typeof value!=='string'||!value.trim()||value.length>(key==='process'?500:5000))throw Error(FIELDS[key]+'는 확인한 원문 문자열이어야 합니다. 미확인 값은 기존 값을 유지하세요.');
  }
  const next=clone(data),changes=[];
  for(const [key,value]of Object.entries(patch))if(data[key]!==value){changes.push({key,label:FIELDS[key],before:Object.hasOwn(data,key)?clone(data[key]):null,after:value});next[key]=value;}
  if(!changes.length)throw Error('현재 값과 달라지는 항목이 없습니다. 저장하지 않았습니다.');
  const identityInvalidated=next.record_identity?.status==='confirmed';
  if(identityInvalidated)next.record_identity.status='draft';
  return {data:next,changes,identityInvalidated,identityNotice:identityInvalidated?'라벨 값이 바뀌어 로트 확인을 해제합니다. 이전 ID와 확인 당시 원문은 보존하며 기존 로트 재확정 절차를 사용하세요.':'기존 로트 식별은 새로 확정하지 않습니다.'};
 }
 return {FIELDS,buildPatch,prepare};
});
