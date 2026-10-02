/* Every report format consumes one reviewed, immutable scalar-only projection. */
function installReportProfiles(){
 const M=CuppingReportModel,$=id=>document.getElementById(id);
 let snapshot=null,candidate=null,projection=null,stamp=null,request=0,lastUrl=null;
 const node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
 const panel=node('section');panel.id='reportProfiles';panel.className='report-profiles';panel.hidden=true;panel.setAttribute('aria-label','출력 필드 검토');
 panel.append(node('h2','출력 전 필드 검토'));
 const note=node('p','고객용은 기본적으로 모든 값이 제외됩니다. 원가·평가자·개인 선호·업무 판단·비공개 메모는 고객용 선택 목록에도 넣지 않습니다. 이름·로트·크롭·자유 향미 원문에 민감한 내용이 적혀 있는지는 자동 판별할 수 없습니다. 실제 값을 읽고 공개할 항목만 직접 선택하세요.');panel.append(note);
 const controls=node('div');controls.className='report-controls';panel.append(controls);
 function select(id,label,items){const l=node('label',label),s=node('select');s.id=id;for(const[value,text]of items){const o=node('option',text);o.value=value;s.append(o);}l.append(s);controls.append(l);return s;}
 const profile=select('reportProfile','출력 프로필',[['customer','고객용 · 기본 제외'],['internal','내부용 · 비공개 정보 포함']]);
 const scope=select('reportScope','출력 범위',[['sample','현재 샘플'],['session','현재 세션'],['all','전체 세션']]);
 const choices=node('div');choices.id='reportFieldChoices';panel.append(choices);
 const review=node('button','선택한 값으로 미리보기 확정');review.type='button';review.id='reportFreeze';panel.append(review);
 const status=node('p');status.id='reportStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');panel.append(status);
 const preview=node('div');preview.id='reportPreview';panel.append(preview);
 const actions=node('div');actions.className='report-actions';panel.append(actions);
 const outputs={};for(const[format,label]of [['image','미리본 이미지 생성'],['excel','미리본 Excel 내보내기'],['json','미리본 리포트 JSON 생성']]){const b=node('button',label);b.type='button';b.id='reportExport'+format;b.disabled=true;b.addEventListener('click',()=>exportReport(format));actions.append(b);outputs[format]=b;}
 const download=node('a');download.id='reportDownload';download.hidden=true;download.setAttribute('download','');panel.append(download);
 panel.append(node('p','세 형식은 확정한 같은 항목·값으로 만들어집니다. 다운로드 요청 뒤 실제 파일 수신·Excel 앱 표시·기기 화면은 직접 확인하세요. 이 리포트 JSON은 복구 입력으로 사용할 수 없습니다. 전체 원문은 별도의 복구용 백업을 사용하세요.'));
 const close=node('button','검토 닫기');close.type='button';close.id='reportClose';panel.append(close);$('p0StoragePanel').after(panel);
 const existingRows=buildSessionExcelRows;
 buildSessionExcelRows=session=>M.sanitizeRows(existingRows(session));
 function sourceStamp(){
  const current=P0Production.historySnapshot();
  const fields=Array.from(document.querySelectorAll('input,textarea,select')).filter(e=>!panel.contains(e)&&e.id!=='importSamplesInput').map(e=>[e.id,e.value,e.checked]);
  const stored=['noel_sca_sessions_','noel_sca_samples2_','noel_sca_current_sample_'].map(prefix=>localStorage.getItem(prefix+current.loadedUser));
  return JSON.stringify({sessions:current.sessions,session:current.currentSessionId,sample:current.currentSampleId,user:current.loadedUser,scope:current.accountScope,stored,fields});
 }
 function clearDownload(){if(lastUrl){URL.revokeObjectURL(lastUrl);lastUrl=null;}download.removeAttribute('href');download.removeAttribute('download');download.hidden=true;}
 function invalidate(message){request++;projection=null;preview.replaceChildren();for(const b of Object.values(outputs))b.disabled=true;clearDownload();if(message)status.textContent=message;}
 function current(){if(!snapshot||!stamp||stamp!==sourceStamp())throw Error('미리보기 후 입력·계정·선택이 바뀌었습니다. 출력 창을 다시 열어 최신 값을 검토하세요.');}
 function renderCandidates(){
  invalidate();try{current();candidate=M.candidates(snapshot,scope.value,profile.value,{internalRows:buildSessionExcelRows,phases:FLAVOR_PHASES,flavors:FLAVOR_DATA});choices.replaceChildren();
   for(const record of candidate.records){const group=node('fieldset'),legend=node('legend',`기록 ${record.number}`);group.append(legend);
    for(const field of record.fields){const label=node('label'),check=node('input');check.type='checkbox';check.value=field.key;check.checked=profile.value==='internal';check.addEventListener('change',()=>invalidate('필드 선택이 바뀌었습니다. 미리보기를 다시 확정하세요.'));label.append(check,node('span',field.label+' : '+field.value));group.append(label);}choices.append(group);
   }
   status.textContent=profile.value==='customer'?'값을 읽고 공개할 필드만 선택한 뒤 미리보기를 확정하세요.':'내부용에는 평가자·기존 메모·개인 판단 등 비공개 정보가 포함될 수 있습니다. 필요 없는 필드를 해제한 뒤 확정하세요.';
  }catch(e){candidate=null;choices.replaceChildren();status.textContent=e.message;}
 }
 function render(target,p){target.replaceChildren();target.append(node('h2',p.title),node('p',p.notice),node('p','출력 시점: '+p.createdAt));
  for(const record of p.records){const section=node('section');section.append(node('h3',`기록 ${record.number}`));const list=node('dl');for(const field of record.fields){list.append(node('dt',field.label),node('dd',String(field.value)));}section.append(list);target.append(section);}
 }
 function open(requestedScope='sample',format='image'){
  invalidate();try{snapshot=P0Production.reportSnapshot();stamp=sourceStamp();profile.value='customer';scope.value=requestedScope;panel.hidden=false;renderCandidates();status.textContent+=' '+({image:'이미지',excel:'Excel',json:'리포트 JSON'}[format]||'출력')+'도 이 미리보기를 사용합니다.';panel.scrollIntoView({block:'start'});return true;}catch(e){snapshot=null;stamp=null;panel.hidden=false;choices.replaceChildren();status.textContent=e.message;return false;}
 }
 review.addEventListener('click',()=>{try{current();if(!candidate)throw Error('출력 필드를 다시 확인하세요.');const keys=Array.from(choices.querySelectorAll('input:checked')).map(e=>e.value);projection=M.project(candidate,keys);clearDownload();render(preview,projection);for(const b of Object.values(outputs))b.disabled=false;status.textContent='이 미리보기의 항목·값을 확정했습니다. 원하는 형식으로 내보내세요.';}catch(e){invalidate(e.message);}});
 profile.addEventListener('change',renderCandidates);scope.addEventListener('change',renderCandidates);
 close.addEventListener('click',()=>{invalidate();snapshot=null;stamp=null;candidate=null;choices.replaceChildren();panel.hidden=true;});
 function link(blob,p,ext){clearDownload();lastUrl=URL.createObjectURL(blob);download.href=lastUrl;download.download=M.filename(p,ext);download.textContent=ext.toUpperCase()+' 파일 받기 · 실제 수신 여부를 확인하세요';download.hidden=false;}
 download.addEventListener('click',event=>{try{current();if(!projection)throw Error('미리보기를 다시 확정하세요.');}catch(e){event.preventDefault();invalidate(e.message);}});
 async function exportReport(format){let capture=null,ticket=null,expected=null;try{
  current();if(!projection)throw Error('필드를 선택하고 미리보기를 먼저 확정하세요.');const p=projection;expected=p;ticket=++request;
  if(format==='json'){link(new Blob([JSON.stringify(p,null,2)],{type:'application/json;charset=utf-8'}),p,'json');status.textContent='리포트 JSON을 생성했습니다. 복구용 백업이 아닙니다. 파일 받기를 눌러 실제 수신을 확인하세요.';return p;}
  if(format==='excel'){if(!window.XLSX?.writeFile)throw Error('Excel 모듈을 불러오지 못했습니다. 연결을 확인하고 다시 시도하세요.');const wb=M.workbook(p);current();XLSX.writeFile(wb,M.filename(p,'xlsx'));status.textContent='Excel 다운로드를 요청했습니다. 실제 수신·Excel 앱 표시는 확인되지 않았습니다.';return wb;}
  if(format!=='image'||typeof html2canvas!=='function')throw Error('이미지 모듈을 불러오지 못했습니다. 연결을 확인하고 다시 시도하세요.');
  const captureId='reportCapture_'+ticket;capture=node('div');capture.id=captureId;capture.className='report-capture';render(capture,p);document.body.append(capture);
  const canvas=await html2canvas(capture,{backgroundColor:'#ffffff',scale:2,logging:false,useCORS:false,onclone:doc=>{const only=doc.getElementById(captureId);if(!only)throw Error('리포트 화면을 복사하지 못했습니다.');doc.body.replaceChildren(only);}});
  current();if(ticket!==request||p!==projection)throw Error('이미지 생성 중 미리보기가 바뀌었습니다. 최신 내용을 다시 검토하세요.');
  const png=canvas.toDataURL('image/png');if(!/^data:image\/png;base64,.+/.test(png))throw Error('브라우저가 유효한 PNG를 만들지 못했습니다. 범위를 줄여 다시 검토하세요.');
  clearDownload();download.href=png;download.download=M.filename(p,'png');download.textContent='PNG 파일 받기 · 실제 수신 여부를 확인하세요';download.hidden=false;status.textContent='미리본 이미지가 생성되었습니다. 파일 받기를 눌러 실제 수신을 확인하세요.';return p;
 }catch(e){if(ticket===null||(ticket===request&&expected===projection))invalidate(e.message);return null;}finally{capture?.remove();}}
 for(const event of ['input','change'])document.addEventListener(event,e=>{if(snapshot&&!panel.contains(e.target)&&e.target.id!=='importSamplesInput')invalidate('입력이 바뀌었습니다. 출력 창을 다시 열어 최신 값을 검토하세요.');},true);
 window.addEventListener('storage',event=>{if(snapshot&&(event.key===null||['noel_sca_sessions_','noel_sca_samples2_','noel_sca_current_sample_'].some(prefix=>event.key===prefix+snapshot.loadedUser)))invalidate('저장본이 바뀌었습니다. 출력 창을 다시 열어 최신 값을 검토하세요.');});
 window.addEventListener('cupping:auth-ready',()=>{if(snapshot)try{current();}catch(e){invalidate(e.message);}});
 exportSnsImage=()=>open('sample','image');
 exportCurrentSessionExcel=()=>open('session','excel');
 exportToExcel=()=>open('session','excel');
 exportSessionToExcel=()=>open('session','excel');
 window.CuppingReports={open,exportReport,getProjection:()=>projection};
}
