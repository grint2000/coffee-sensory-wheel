// npm ci --ignore-scripts && npm test
// In-memory DOM, synthetic records, no Firebase/network; not a real-browser or layout test.
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs'),assert=require('assert/strict');
const html=fs.readFileSync('index.html','utf8'),errors=[];
const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));vc.on('error',e=>errors.push(String(e)));
const dom=new JSDOM(html,{url:'https://noel-test.invalid/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});const w=dom.window;
w.matchMedia=()=>({matches:false,addListener(){},removeListener(){}});w.confirm=()=>true;w.alert=()=>{};w.scrollTo=()=>{};
w.HTMLElement.prototype.scrollIntoView=function(){};
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){};
const byId=id=>w.document.getElementById(id),click=id=>{assert(byId(id),'missing '+id);byId(id).click();};
const input=(id,value)=>{byId(id).value=value;byId(id).dispatchEvent(new w.Event('input',{bubbles:true}));};
const saved=()=>JSON.parse(w.localStorage.getItem('noel_sca_sessions_default'));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 for(const node of [...w.document.scripts]) {
   const src=node.getAttribute('src');
   if(node.type==='module' || (src && /^https?:/.test(src)))continue;
   w.eval(src ? fs.readFileSync(src,'utf8') : node.textContent);
 }
 await new Promise(resolve=>w.document.addEventListener('DOMContentLoaded',resolve,{once:true}));
 assert(byId('historyOpen'));assert.equal(errors.length,0,errors.join('\n'));
 input('sampleTitleInput','입고 LOT-A');input('scoreFlavorInput','8.5');click('saveSamplesBtn');
 const first=w.getLocalCuppingState(),firstId=first.currentSessionId,firstSample=first.currentSampleId;
 assert.equal(saved()[0].samples[0].title,'입고 LOT-A');assert.equal(saved()[0].samples[0].sampleData.scoreFlavor,8.5);
 input('sampleTitleInput','최신 편집');click('cloneSampleBtn');assert.equal(w.getLocalCuppingState().sessions[0].samples.length,2);
 assert.equal(w.getLocalCuppingState().sessions[0].samples[0].title,'최신 편집 (복사본)');click('undoBtn');assert.equal(w.getLocalCuppingState().sessions[0].samples.length,1);
 byId('sessionLocationInline').value='QC실';byId('sessionWaterTempInline').value='94';click('saveSessionMetaBtn');
 click('timerToggle');const oldKey=w.NOEL_WORKFLOW.timerKey(w.NOEL_WORKFLOW_API.context());assert(JSON.parse(w.localStorage.getItem(oldKey)).startedAt);
 click('timerToggle');assert.equal(JSON.parse(w.localStorage.getItem(oldKey)).startedAt,null);
 click('repeatSession');const next=w.getLocalCuppingState();assert.equal(next.sessions.length,2);assert.notEqual(next.currentSessionId,firstId);
 const fresh=next.sessions.find(s=>s.id===next.currentSessionId);assert.equal(fresh.location,'QC실');assert.equal(fresh.waterTemp,94);assert.equal(fresh.samples.length,1);assert.equal(fresh.samples[0].sampleData.scoreFlavor,7);
 assert(Object.values(fresh.samples[0].sampleData.flavorSelections).every(v=>v.length===0));
 assert.notEqual(w.NOEL_WORKFLOW.timerKey(w.NOEL_WORKFLOW_API.context()),oldKey);
 input('sampleTitleInput','두번째 평가');click('saveSamplesBtn');
 click('historyOpen');assert(byId('historyDialog').open);assert.equal(byId('historyRows').children.length,2);
 input('historyQuery','최신');assert.equal(byId('historyRows').children.length,1);assert.match(byId('historyRows').textContent,/최신 편집/);
 input('historyQuery','');for(const checkbox of byId('historyRows').querySelectorAll('input'))checkbox.click();click('historyCompare');
 assert.match(byId('historyComparison').textContent,/두번째 평가/);assert.match(byId('historyComparison').textContent,/최신 편집/);
 input('historyQuery','최신');byId('historyRows').querySelector('button').click();assert(!byId('historyDialog').open);
 assert.equal(w.getLocalCuppingState().currentSessionId,firstId);assert.equal(w.getLocalCuppingState().currentSampleId,firstSample);
 assert.equal(w.localStorage.getItem('noel_sca_current_session_default'),firstId);
 // Exercise the image export's real DOM preparation and cleanup, with the rasterizer mocked.
 const imageNodes=w.document.body.children.length;let finishCanvas,prepared;
 w.html2canvas=root=>{prepared=root;return new Promise(resolve=>finishCanvas=resolve);};
 const exportJob=w.exportSnsImage();assert(byId('exportSnsImgBtn').disabled);
 assert.match(prepared.textContent,/최신 편집/);assert.equal(w.document.body.children.length,imageNodes+1);
 await w.exportSnsImage();assert.equal(w.document.body.children.length,imageNodes+1,'duplicate export suppressed');
 finishCanvas({toDataURL:()=> 'data:image/png;base64,test'});await exportJob;
 assert(!byId('exportSnsImgBtn').disabled);assert.equal(w.document.body.children.length,imageNodes);
 for(const errorStage of ['render','encode']) {
   w.html2canvas=errorStage==='render' ? ()=>{throw Error('image-test');} : async()=>({toDataURL(){throw Error('image-test');}});
   await w.exportSnsImage();assert(!byId('exportSnsImgBtn').disabled);assert.equal(w.document.body.children.length,imageNodes);
 }
 if(process.env.NOEL_TEST_XLSX==='1') {
   const codec=require('xlsx');let bytes;
   w.XLSX={...codec,writeFile:(book)=>{bytes=codec.write(book,{type:'buffer',bookType:'xlsx'});}};
   click('exportCurrentSessionXlsxBtn');assert(bytes && bytes.subarray(0,2).toString()==='PK');
   const book=codec.read(bytes,{type:'buffer'}),sheet=book.Sheets[book.SheetNames[0]],grid=codec.utils.sheet_to_json(sheet,{header:1});
   assert.equal(grid[3][0],'최신 편집');assert.equal(grid[3][26],80.5);
   const source=w.getLocalCuppingState().sessions.find(s=>s.id===firstId);
   source.samples[0].sampleData.defectCount=0;source.title='특수문자 : [A/B]';w.exportSessionToExcel(source);
   const roundtrip=codec.read(bytes,{type:'buffer'});assert.equal(codec.utils.sheet_to_json(roundtrip.Sheets[roundtrip.SheetNames[0]],{header:1})[3][13],0);
   console.log('PASS: actual XLSX binary generation/readback, Korean sample text, numeric total, zero defects and legal worksheet name. Native browser download not covered.');
 }
 // Score calculation and actual FileReader import path (confirmation simulated).
 assert.equal(byId('totalScore').textContent,'80.50');
 const upload=new w.File([JSON.stringify({id:'import_session',title:'파일 복원 시험',samples:[{id:'import_sample',title:'가져온 커피',sampleData:{flavorSelections:{},bodyDescriptors:[],scoreFlavor:9}}]})],'test.json',{type:'application/json'});
 Object.defineProperty(byId('importSamplesInput'),'files',{configurable:true,value:[upload]});
 byId('importSamplesInput').dispatchEvent(new w.Event('change',{bubbles:true}));
 for(let attempt=0;attempt<100 && w.getLocalCuppingState().sessions[0].id!=='import_session';attempt++) await new Promise(resolve=>setTimeout(resolve,20));
 assert.equal(w.getLocalCuppingState().sessions[0].id,'import_session');assert.equal(byId('sampleTitleInput').value,'가져온 커피');
 assert.equal(w.getLocalCuppingState().sessions[0].samples[0].sampleData.scoreFlavor,9);
 // Restore the prior in-memory test snapshot through the real backup-first path.
 assert(w.restoreLocalCuppingState(next));
 assert(w.NOEL_WORKFLOW_API.open(firstId,firstSample));
 // Storage failure must leave selection and record set intact when preparing another session.
 const originalCommit=w.NOEL_DATA.commit;w.NOEL_DATA.commit=()=>{throw Error('quota-test');};
 click('repeatSession');assert.equal(w.getLocalCuppingState().sessions.length,2);assert.match(byId('workflowStatus').textContent,/quota-test/);
 byId('sessionSelect').value=fresh.id;byId('sessionSelect').dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(w.getLocalCuppingState().currentSessionId,firstId);
 w.NOEL_DATA.commit=originalCommit;
 click('themeToggle');assert(w.document.body.classList.contains('dark'));
 assert.equal(errors.filter(e=>!e.includes('quota-test') && !e.includes('기록 저장 실패') && !e.includes('SNS 이미지 생성 중 오류')).length,0,errors.join('\n'));
 console.log('PASS: real app scripts in simulated DOM: edit/save, clone latest text/undo, repeated conditions without old scores, timer controls, history filter/comparison/open, selection persistence, storage failure, score calculation, FileReader JSON import, snapshot restore, theme. Browser layout/native dialog/Firebase not covered.');
 dom.window.close();
})().catch(err=>{console.error(err);dom.window.close();process.exitCode=1;});
