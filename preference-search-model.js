/* CP15: explicit search conditions only. No recommendation scoring or inferred profile. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PreferenceSearchModel=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const fields=['audience','minPrice','maxPrice'];
 function amount(value){if(value===null||value===undefined||value==='')return null;if(typeof value!=='number'||!Number.isSafeInteger(value)||value<0)throw Error('희망 가격은 0 이상의 정수로 입력하세요.');return value;}
 function request(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!fields.includes(k)))throw Error('지원하지 않는 선호 조건입니다.');
  if(!['self','customer'].includes(input.audience))throw Error('이번 검색의 대상을 선택하세요.');
  const minPrice=amount(input.minPrice),maxPrice=amount(input.maxPrice);
  if(minPrice!==null&&maxPrice!==null&&minPrice>maxPrice)throw Error('최소 희망 가격이 최대 희망 가격보다 큽니다.');
  return {audience:input.audience,minPrice,maxPrice,currency:'KRW',unit:'kg',provenance:'explicit-this-search',persisted:false};
 }
 function search({model,index,query={},preferences}){
  if(!model||typeof model.search!=='function')throw Error('기존 이력 검색이 준비되지 않았습니다.');
  const intent=request(preferences),result=model.search(index,query);
  const supported=Object.entries(query).some(([key,value])=>key!=='flavorMode'&&Array.isArray(value)&&value.length>0);
  const priceRequested=intent.minPrice!==null||intent.maxPrice!==null;
  return {kind:supported?'history-search':'conditions-needed',request:intent,
   matched:supported?result.matched:[],excluded:supported?result.excluded:[],query:result.query,resolvedFlavors:result.resolvedFlavors,
   evaluatedRecords:index.entries.length,priceApplied:false,inventoryApplied:false,recommendation:false,
   unavailable:[{field:'inventory',reason:'현재 재고를 확인한 자료가 연결되지 않았습니다.',verifiedAt:null},{field:'price',reason:'현재 단가와 확인일이 있는 자료가 연결되지 않았습니다.',verifiedAt:null}],
   notice:supported?'선택한 조건에 맞는 과거 기록입니다. 구매 추천이나 현재 판매 가능 품목 목록은 아닙니다.':'향미·가공·농장·크롭·세션 목적 중 한 가지 이상을 선택해 주세요.',
   priceNotice:priceRequested?'현재 단가·재고 확인 자료가 없어 희망 가격은 적용하지 않았습니다.':'가격·재고는 미확인입니다.'};
 }
 return {request,search};
});
