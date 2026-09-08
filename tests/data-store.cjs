const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname,'..');
class Storage {
  constructor() { this.data=new Map(); this.fail=()=>false; }
  get length(){return this.data.size;}
  key(i){return [...this.data.keys()][i];}
  getItem(key){return this.data.get(key) ?? null;}
  setItem(key,value){if(this.fail(key)) throw Error('QuotaExceededError');this.data.set(key,String(value));}
  removeItem(key){this.data.delete(key);}
}
let id=0;
const empty=()=>({flavorSelections:{aroma:[]},bodyDescriptors:[],scoreFlavor:7});
const sample=title=>({id:'sample_'+(++id),title:title||'샘플',sampleData:empty()});
const session=(o={})=>({id:'session_'+(++id),title:'커핑',time:'09:00',samples:[sample()],...o});
const context={console:{error(){}},setTimeout:()=>0,clearTimeout(){},URL,Blob,Date,Math};
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'data-store.js'),'utf8'),context);
const D=context.NOEL_DATA;
const factories={session,sample,validate:()=>true};
const original=session({id:'session_original',samples:[{...sample('원본'),id:'sample_original'}]});
for(const input of [[original], original, original.samples]) {
  const normalized=D.normalize(input,factories);
  assert.equal(normalized[0].samples[0].title,'원본');
}
assert.throws(()=>D.normalize([{samples:[{sampleData:null}]}],factories));
assert.throws(()=>D.normalize([original,original],factories),/중복/);
assert.throws(()=>D.normalize({...original,id:'" onclick="evil'},factories));
assert.throws(()=>D.normalize({...original,samples:[{...sample(),sampleData:{flavorSelections:{aroma:'bad'}}}]},factories));
assert.equal(original.samples[0].sampleData.scoreFlavor,7);
const storage=new Storage();
const a=D.backup(storage,'A', [original],'자동 백업');
const b=D.backup(storage,'B', [original],'자동 백업');
assert.deepEqual(Array.from(D.listBackups(storage,'A'),x=>x.key),[a]);
assert.deepEqual(Array.from(D.listBackups(storage,'B'),x=>x.key),[b]);
storage.fail=()=>true;
assert.throws(()=>D.backup(storage,'A',[original],'복원 전'));
assert(storage.getItem(a));assert(storage.getItem(b));
storage.fail=()=>false;
const nodes=new Map();
const node=id=>{if(!nodes.has(id)) nodes.set(id,{value:'원본',textContent:'',style:{},classList:{add(){},remove(){}}});return nodes.get(id);};
Object.assign(context,{
  window:{currentUser:'A'},document:{getElementById:node},localStorage:storage,
  sessions:[],samples:[],currentSessionId:null,currentSampleId:null,sampleSaveTimeout:null,
  createNewSessionObj:session,createNewSampleObj:sample,validateSampleData:()=>true,
  setUIFromSample(){},renderSessionSelect(){},renderSampleList(){},saveUIToSample(){},showToast(){},
  getCurrentSampleObj:()=>context.samples.find(s=>s.id===context.currentSampleId),
  syncCurrentSessionSamples:()=>{const current=context.sessions.find(s=>s.id===context.currentSessionId);if(current)current.samples=context.samples;},
  APP_STORAGE:{get:(k,f=null)=>storage.getItem(k)??f,set:(k,v)=>{try{storage.setItem(k,v);return true;}catch{return false;}}}
});
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
vm.runInContext(html.slice(html.indexOf('// Local persistence:'),html.indexOf('// 샘플 복제')),context);
const second=session({id:'session_second'});
storage.setItem('noel_sca_sessions_A',JSON.stringify([original,second]));
storage.setItem('noel_sca_current_session_A',second.id);
assert(context.loadSamplesFromStorage());assert.equal(context.currentSessionId,second.id);
const goodRaw=storage.getItem('noel_sca_sessions_A');
storage.fail=key=>key==='noel_sca_sessions_A';
assert.equal(context.saveSessionsToStorage(),false);
assert.equal(storage.getItem('noel_sca_sessions_A'),goodRaw);
assert.match(node('storageStatus').textContent,/저장 실패/);
storage.fail=()=>false;
const imported={...original,samples:[{...original.samples[0],title:'가져온 기록',sampleData:{...empty(),scoreFlavor:9}}]};
context.replaceSessionData(imported,'시험');
assert.equal(context.samples[0].title,'가져온 기록');assert.equal(context.samples[0].sampleData.scoreFlavor,9);
assert.equal(JSON.parse(storage.getItem('noel_sca_sessions_A'))[0].samples[0].title,'가져온 기록');
const before=context.sessions;
storage.fail=key=>key.startsWith(D.backupPrefix('A'));
assert.throws(()=>context.replaceSessionData(original,'백업 실패'));
assert.equal(context.sessions,before);
storage.fail=key=>key==='noel_sca_sessions_A';
assert.throws(()=>context.replaceSessionData(original,'저장 실패'));
assert.equal(context.sessions,before);
storage.fail=()=>false;
storage.setItem('noel_sca_sessions_A','{corrupt');
assert.equal(context.loadSamplesFromStorage(),false);
assert.equal(context.saveSessionsToStorage(),false);
assert.equal(storage.getItem('noel_sca_sessions_A'),'{corrupt');
context.replaceSessionData(original,'손상 후 복원');
assert(context.saveSessionsToStorage());
context.window.currentUser='B';
assert.equal(context.saveSessionsToStorage(),false);
assert.equal(storage.getItem('noel_sca_sessions_B'),null);
console.log('PASS: JSON formats, validation, profile backup isolation, write failures, same-ID replacement, unreadable-original protection, active-session restore and profile-switch guard.');
// Default session titles contain a colon; Excel rejects that in worksheet names.
let sheetName=null, exported=false;
context.XLSX={utils:{aoa_to_sheet:()=>({}),book_new:()=>({}),book_append_sheet:(_b,_s,name)=>{if(/[\\/?*\[\]:]/.test(name))throw Error('invalid sheet name');sheetName=name;}},writeFile:()=>exported=true};
context.buildSessionExcelRows=()=>[['test']];
vm.runInContext(html.slice(html.indexOf('function exportSessionToExcel('),html.indexOf('function exportToExcel()')),context);
context.exportSessionToExcel({...original,title:'커핑 2026-09-08 09:30 [A/B]*'},true);
assert(exported);assert(sheetName.length<=31);assert(!/[\\/?*\[\]:]/.test(sheetName));
context.XLSX=undefined;
assert.doesNotThrow(()=>context.exportSessionToExcel(original));
console.log('PASS: default/time/special-character worksheet names and unavailable Excel dependency.');
context.window.currentUser='A';
context.saveCurrentSample=()=>context.saveSamplesToStorage();
assert(context.window.activateLocalUser('C'));
assert.equal(context.window.currentUser,'C');
assert(context.window.canSyncLocalRecords());
assert.equal(storage.getItem('noel_sca_sessions_C'),null);
assert(context.saveSessionsToStorage());
storage.fail=key=>key==='noel_sca_sessions_C';
assert.equal(context.window.activateLocalUser('D'),false);
assert.equal(context.window.currentUser,'C');
assert.equal(storage.getItem('noel_sca_sessions_D'),null);
console.log('PASS: identity changes preserve previous profile, load the target profile and stop on failed save.');
