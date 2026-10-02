(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CuppingBackupMerge=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const clone=value=>JSON.parse(JSON.stringify(value));
 const canonical=value=>JSON.stringify(sort(value));
 function sort(value){if(Array.isArray(value))return value.map(sort);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,sort(value[key])]));return value;}
 const metadata=session=>Object.fromEntries(Object.entries(session).filter(([key])=>key!=='samples'));
 // Callers validate both inputs and the final size/schema. Names are never identity keys.
 function plan(current,incoming){
  const next=clone(current),sessions=new Map(next.map(session=>[session.id,session]));
  const sampleIds=new Map(),evaluationIds=new Map(),conflicts=[];
  let addedSessions=0,addedSamples=0,skippedSamples=0,legacyAdded=0;
  for(const session of next)for(const sample of session.samples){const ref={sessionId:session.id,sample};sampleIds.set(sample.id,ref);const id=sample.sampleData.record_identity?.evaluation_id;if(id)evaluationIds.set(id,ref);}
  for(const source of incoming){
   const target=sessions.get(source.id);
   if(target&&canonical(metadata(target))!==canonical(metadata(source))){conflicts.push({kind:'session-metadata',sessionId:source.id,message:'같은 세션 ID의 제목·조건·메타데이터가 다릅니다'});continue;}
   const additions=[];
   for(const sample of source.samples){
    const evaluationId=sample.sampleData.record_identity?.evaluation_id;
    const bySample=sampleIds.get(sample.id),byEvaluation=evaluationId?evaluationIds.get(evaluationId):null;
    if(bySample||byEvaluation){
     const same=bySample&&bySample.sessionId===source.id&&canonical(bySample.sample)===canonical(sample)&&(!byEvaluation||byEvaluation.sample.id===sample.id);
     if(same){skippedSamples++;continue;}
     conflicts.push({kind:byEvaluation?'evaluation':'sample',sessionId:source.id,sampleId:sample.id,evaluationId:evaluationId||null,message:'같은 샘플 또는 평가 ID에 다른 원문·위치가 있습니다'});continue;
    }
    const item=clone(sample),ref={sessionId:source.id,sample:item};additions.push(item);sampleIds.set(item.id,ref);if(evaluationId)evaluationIds.set(evaluationId,ref);else legacyAdded++;addedSamples++;
   }
   if(target)target.samples.push(...additions);
   else if(additions.length){const session={...clone(source),samples:additions};next.push(session);sessions.set(session.id,session);addedSessions++;}
  }
  return {ok:conflicts.length===0,next:conflicts.length?null:next,addedSessions,addedSamples,skippedSamples,legacyAdded,conflicts};
 }
 return {plan,same:(a,b)=>canonical(a)===canonical(b)};
});
