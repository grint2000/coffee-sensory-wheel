(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CuppingReportModel=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const FORMAT='noel-cupping-report',VERSION=1;
 const scalar=value=>typeof value==='string'||typeof value==='boolean'||(typeof value==='number'&&Number.isFinite(value));
 const cell=value=>value===null||value===undefined?'':scalar(value)?value:'[지원하지 않는 값 형식 · 원문은 복구 백업에 보존]';
 const sanitizeRows=rows=>Array.isArray(rows)?rows.map(row=>Array.isArray(row)?row.map(cell):[]):[];
 const plain=value=>value&&typeof value==='object'&&!Array.isArray(value);
 const text=value=>typeof value==='string'&&value.length<=5000?value:typeof value==='number'&&Number.isFinite(value)?String(value):null;
 function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
 function candidates(snapshot,scope,profile,adapters={}){
  if(!['sample','session','all'].includes(scope)||!['customer','internal'].includes(profile))throw Error('출력 범위·프로필을 확인하세요.');
  let sequence=0;const records=[];
  for(const session of snapshot.sessions){
   if(scope!=='all'&&session.id!==snapshot.currentSessionId)continue;
   const excel=profile==='internal'?sanitizeRows(adapters.internalRows(session)):null;
   session.samples.forEach((sample,index)=>{
    if(scope==='sample'&&sample.id!==snapshot.currentSampleId)return;
    const number=++sequence,fields=[],d=sample.sampleData;
    const add=(key,label,value)=>{const v=profile==='internal'&&typeof value==='boolean'?String(value):text(value);if(v!==null&&v!=='')fields.push({key:`${number}.${key}`,label,value:v});};
    if(profile==='customer'){
     add('name','커피명 · 원문 확인 필요',d.coffeeName);
     add('lot','로트 표기 · 원문 확인 필요',d.lotNumber);
     add('crop','수확연도·크롭 표기 · 원문 확인 필요',d.harvestYear);
     add('evaluation-date','개별 평가일','미기록 · 세션 날짜나 수정일로 추정하지 않음');
     add('session-date','세션 기록일 · 개별 평가일과 별개',typeof session.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(session.date)?session.date:null);
     add('verification','검증 출처','외부 검증 출처 미기록 · 앱 입력값이며 검증을 보증하지 않음');
     if(plain(d.flavorSelections))for(const phase of adapters.phases||[]){
      const selected=d.flavorSelections[phase.id];if(!Array.isArray(selected))continue;
      selected.forEach((key,i)=>{
       if(typeof key!=='string')return;
       const match=(adapters.flavors||[]).find(f=>`${f[0]}|${f[1]}|${f[2]}`===key);
       add(`flavor-${phase.id}-${i}`,`${phase.label} · ${match?'기록자가 선택한 향미':'미확인 자유 향미 · 원문 확인 필요'}`,match?match[6]||match[2]:key);
      });
     }
    }else{
     for(let i=0;i<excel[0].length;i+=2)if(excel[0][i])add(`session-${i}`,`세션 · ${cell(excel[0][i])}`,excel[0][i+1]);
     const headers=excel[2]||[],row=excel[index+3]||[];
     headers.forEach((label,i)=>add(`internal-${i}`,cell(label),row[i]));
    }
    records.push({number,fields});
   });
  }
  return freeze({profile,scope,records});
 }
 function project(candidates,selected,createdAt=new Date().toISOString()){
  if(!Array.isArray(selected))throw Error('출력할 필드를 직접 선택하세요.');
  const keys=new Set(selected),records=candidates.records.map(record=>({number:record.number,fields:record.fields.filter(field=>keys.has(field.key)).map(({label,value})=>({label,value}))})).filter(record=>record.fields.length);
  if(!records.length)throw Error('실제 값을 확인한 뒤 출력할 필드를 하나 이상 선택하세요.');
  return freeze({format:FORMAT,version:VERSION,profile:candidates.profile,scope:candidates.scope,createdAt,title:candidates.profile==='customer'?'고객용 커핑 리포트':'내부용 커핑 기록',notice:'선택 필드 리포트 · 복구용 JSON 백업 아님 · 외부 자동 전송 없음',records});
 }
 function rows(projection){
  const result=[['리포트',projection.title],['출력 시점',projection.createdAt],['안내',projection.notice],['프로필',projection.profile],[],['기록','항목','값']];
  for(const record of projection.records)for(const field of record.fields)result.push([record.number,field.label,field.value]);
  return sanitizeRows(result);
 }
 const col=index=>{let s='';for(let n=index+1;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;};
 function workbook(projection){
  const values=rows(projection),sheet={};let columns=1;
  values.forEach((row,r)=>{columns=Math.max(columns,row.length);row.forEach((value,c)=>{const v=cell(value);sheet[col(c)+(r+1)]={t:typeof v==='number'?'n':typeof v==='boolean'?'b':'s',v};});});
  sheet['!ref']=`A1:${col(columns-1)}${values.length}`;
  return {SheetNames:['Report'],Sheets:{Report:sheet}};
 }
 const filename=(projection,extension)=>`noel-${projection.profile==='customer'?'customer':'internal'}-report.${extension}`;
 return {FORMAT,VERSION,scalar,cell,sanitizeRows,candidates,project,rows,workbook,filename};
});
