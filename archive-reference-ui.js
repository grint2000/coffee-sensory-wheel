/* CP-12 explicit local-file reference selection. Whole archives stay in memory only. */
function installArchiveReference(){
 if(window.ArchiveReferenceUI)return window.ArchiveReferenceUI;
 const A=ArchiveReference,$=id=>document.getElementById(id),node=(tag,text,id)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(id)e.id=id;return e;};
 let index=null,fileHash=null,ticket=0,pending=null,backupURL=null;const browseFarms=new Map();
 const panel=node('details',undefined,'archiveReferencePanel');panel.className='archive-reference-panel';panel.append(node('summary','농장 아카이브 참조 · 선택'));
 panel.append(node('p','농장 아카이브에서 자료 내보내기 → 전체 자료 JSON으로 받은 파일을 선택하세요. 읽기용 Markdown은 이 입력에 사용할 수 없습니다.','archiveFileHelp'));
 panel.append(node('p','직접 선택한 로컬 JSON 파일만 이 창의 메모리에서 읽습니다. 전체 아카이브는 저장하거나 서버로 보내지 않습니다. 선택한 농장·로트의 공개 참조 사본(읽을 당시 판본)만 검토 후 현재 평가에 연결합니다.'));
 const fileLabel=node('label','아카이브 JSON · 최대 4MiB'),fileInput=node('input',undefined,'archiveFileInput');fileInput.type='file';fileInput.accept='.json,application/json';fileLabel.htmlFor=fileInput.id;fileLabel.append(fileInput);panel.append(fileLabel);
 const fileInfo=node('p','불러온 파일 없음','archiveFileInfo');panel.append(fileInfo);
 const release=node('button','불러온 파일을 메모리에서 해제','archiveRelease');release.type='button';panel.append(release);
 const grid=node('div');grid.className='archive-reference-grid';panel.append(grid);
 function select(id,label){const l=node('label',label),s=node('select',undefined,id);l.htmlFor=id;l.append(s);grid.append(l);return s;}
 const country=select('archiveCountry','1. 국가'),region=select('archiveRegion','2. 지역 경로'),farm=select('archiveFarm','3. 농장'),lot=select('archiveLot','4. 로트 · 선택 사항');
 function options(select,rows,placeholder='직접 선택하세요'){select.replaceChildren();const empty=node('option',placeholder);empty.value='';select.append(empty);for(const [value,label]of rows){const option=node('option',label);option.value=value;select.append(option);}select.value='';select.disabled=!rows.length;}
 const label=x=>x.name_ko&&x.name&&x.name_ko!==x.name?x.name_ko+' / '+x.name:x.name_ko||x.name||x.label||x.id;
 function resetSelections(){browseFarms.clear();for(const s of [country,region,farm])options(s,[]);options(lot,[],'농장만 참조 · 수상 로트 선택 안 함');}
 resetSelections();
 panel.append(node('p','지역의 대·중·소 단계가 없으면 미확인으로 유지합니다. 같은 경로의 대·중·소 조상은 하나의 경로로 표시합니다. 형제·별개 경로가 있으면 모두 참조 사본에 남깁니다. 농장 수상을 현재 커피의 수상으로 복사하지 않으며 수상·크롭·판매 연도는 서로 구분합니다.'));
 const previewBtn=node('button','선택한 참조 전체 미리보기','archivePreviewBtn');previewBtn.type='button';panel.append(previewBtn);
 const status=node('p','파일을 직접 선택한 뒤 농장과 필요할 경우 정확한 로트를 선택하세요.','archiveStatus');status.setAttribute('role','status');panel.append(status);
 const preview=node('section',undefined,'archivePreview');preview.hidden=true;panel.append(preview);
 preview.append(node('h4','현재 평가에 붙일 참조 전체'));
 const target=node('p',undefined,'archivePreviewTarget');preview.append(target);
 preview.append(node('p','파일 SHA-256은 읽은 원본 바이트를 식별합니다. 발행자 진위나 기재 내용의 사실 여부를 검증하지 않습니다. 이 참조는 평가의 농장·로트 식별을 자동 확정하지 않습니다.','archiveHashNotice'));
 preview.append(node('p','적용하면 선택한 참조와 이전 참조 이력을 이 기기에 저장합니다. 현재 팀 설정으로 평가를 저장하면 이 선택 참조도 기존 샘플과 함께 동기화됩니다. 아래 실제 내용을 모두 검토한 뒤 적용하세요.','archiveSyncNotice'));
 const referenceBody=node('div',undefined,'archivePreviewReference');preview.append(referenceBody);
 const beforeLink=node('a','미리보기 당시 적용 전 전체 기록 백업 받기','archiveBeforeBackup');beforeLink.hidden=true;preview.append(beforeLink);
 const applyBtn=node('button','검토한 농장·로트 참조를 현재 평가에 적용','archiveApplyBtn');applyBtn.type='button';applyBtn.disabled=true;preview.append(applyBtn);
 const cancelBtn=node('button','미리보기 취소','archiveCancelBtn');cancelBtn.type='button';preview.append(cancelBtn);
 const stored=node('details',undefined,'archiveStoredReference');stored.append(node('summary','현재 평가에 보존된 참조'));const storedBody=node('div',undefined,'archiveStoredBody');stored.append(storedBody);panel.append(stored);
 $('recordIdentitySummary').closest('section').after(panel);
 function clearPreview(){pending=null;P0Production.cancelArchiveReference();preview.hidden=true;applyBtn.disabled=true;referenceBody.replaceChildren();target.textContent='';if(backupURL)URL.revokeObjectURL(backupURL);backupURL=null;beforeLink.hidden=true;beforeLink.removeAttribute('href');beforeLink.removeAttribute('download');}
 function clearFile(){index=null;fileHash=null;fileInput.value='';fileInfo.textContent='불러온 파일 없음';resetSelections();}
 function invalidate(event){ticket++;clearPreview();const account=event?.detail?.reason==='account'||['cupping:auth-ready','cupping:account-changed','storage'].includes(event?.type);if(account){clearFile();panel.open=false;}status.textContent='입력·계정·선택 상태가 바뀌었습니다. 참조를 다시 미리보세요.';renderStored();}
 function externalStamp(){const state=P0Production.historySnapshot();const fields=Array.from(document.querySelectorAll('input,textarea,select')).filter(e=>e.id&&!panel.contains(e)&&e.id!=='importSamplesInput'&&!e.closest('#flavorWheelMultiSelectArea')).map(e=>[e.id,e.value,e.checked]);const stored=['noel_sca_sessions_','noel_sca_samples2_','noel_sca_current_sample_'].map(prefix=>localStorage.getItem(prefix+state.loadedUser));return JSON.stringify({state,fields,stored});}
 async function loadFile(file){const request=++ticket;clearPreview();clearFile();if(!file)return;let stamp;try{
  stamp=externalStamp();if(!Number.isFinite(file.size)||file.size>A.MAX_BYTES)throw Error('아카이브는 4MiB 이하여야 합니다. 파일을 읽지 않았습니다.');status.textContent='선택한 파일을 메모리에서 검증하고 원본 바이트 SHA-256을 계산합니다.';
  const buffer=await file.arrayBuffer();if(request!==ticket)return;if(buffer.byteLength>A.MAX_BYTES)throw Error('읽은 파일이 4MiB를 넘습니다.');
  const raw=new TextDecoder('utf-8',{fatal:true}).decode(buffer),parsed=A.parse(raw);
  if(!window.crypto?.subtle)throw Error('이 브라우저에서 원본 파일 SHA-256을 계산할 수 없습니다. 참조를 적용하지 않았습니다.');
  const digest=await window.crypto.subtle.digest('SHA-256',buffer);if(request!==ticket)return;
  if(stamp!==externalStamp())throw Error('파일을 읽는 동안 입력·계정·선택·저장값이 바뀌었습니다. 파일을 다시 선택하세요.');
  index=parsed;fileHash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');options(country,[...index.countries.values()].map(c=>[c.id,label(c)]));
  fileInfo.textContent=`${file.name||'선택한 JSON'} · 원본 ${buffer.byteLength.toLocaleString()}바이트 · SHA-256 ${fileHash} · 파일 식별이며 발행자 진위검증 아님`;
  status.textContent='파일을 메모리에만 불러왔습니다. 국가·지역 경로·농장을 직접 선택하세요.';renderStored();
 }catch(e){if(request===ticket){clearFile();status.textContent='파일을 연결하지 않았습니다: '+e.message;}}
 }
 fileInput.addEventListener('change',()=>loadFile(fileInput.files?.[0]));
 function selectionChanged(){ticket++;clearPreview();status.textContent='선택이 바뀌었습니다. 전체 참조를 다시 미리보세요.';}
 country.addEventListener('change',()=>{selectionChanged();browseFarms.clear();options(region,[]);options(farm,[]);options(lot,[],'농장만 참조 · 수상 로트 선택 안 함');if(!index||!country.value)return;const paths=new Map();function addPath(key,text,farmId){paths.set(key,text);if(!browseFarms.has(key))browseFarms.set(key,new Set());browseFarms.get(key).add(farmId);}for(const f of index.farms.values()){if(f.country_id!==country.value)continue;try{const normalized=A.regionPaths(index,Array.isArray(f.region_ids)?f.region_ids:[],country.value,[]);if(!normalized.length)addPath('__unknown__','지역 경로 미확인',f.id);for(const path of normalized){const unknown=path.chain.filter(r=>r.browse_level===null);addPath(path.chain[path.chain.length-1].id,['large','middle','small'].map((key,i)=>['대','중','소'][i]+': '+(path.levels[key]?label(path.levels[key]):'미확인')).join(' → ')+(unknown.length?' · 단계 미확인 원문: '+unknown.map(r=>label(r)+(r.native_level?' ('+r.native_level+')':'')).join(' → '):''),f.id);}}catch{addPath('__invalid__'+f.id,'지역 연결 확인 필요 · '+f.id,f.id);}}options(region,[...paths]);});
 region.addEventListener('change',()=>{selectionChanged();options(farm,[]);options(lot,[],'농장만 참조 · 수상 로트 선택 안 함');if(!index||!country.value||!region.value)return;options(farm,[...index.farms.values()].filter(f=>f.country_id===country.value&&browseFarms.get(region.value)?.has(f.id)).map(f=>[f.id,label(f)+' · '+f.id]));});
 farm.addEventListener('change',()=>{selectionChanged();options(lot,index?[...index.lots.values()].filter(l=>l.farm_id===farm.value).map(l=>[l.id,l.label||l.id]):[],'농장만 참조 · 수상 로트 선택 안 함');});
 lot.addEventListener('change',selectionChanged);
 previewBtn.addEventListener('click',()=>{clearPreview();try{
  if(!index||!fileHash||!country.value||!region.value||!farm.value)throw Error('파일·국가·지역 경로·농장을 직접 선택하세요.');
  const reference=A.prepare(index,{farmId:farm.value,lotId:lot.value||null,archiveSha256:fileHash,referencedAt:new Date().toISOString()});
  pending=P0Production.prepareArchiveReference(reference);target.textContent=`적용 대상: ${pending.sampleTitle} · 이전 참조 이력 ${pending.previousCount}건 보존 · 현재 샘플명·농장명·점수·평가 상태는 변경하지 않음`;
  renderReference(referenceBody,pending.reference,'archivePreviewText');backupURL=URL.createObjectURL(new Blob([pending.before],{type:'application/json;charset=utf-8'}));beforeLink.href=backupURL;beforeLink.download='before-archive-reference.json';beforeLink.hidden=false;preview.hidden=false;applyBtn.disabled=false;
  status.textContent='아래 선택 참조 전체와 저장·동기화 안내를 검토하세요. 기존 참조의 판본은 자동 갱신하지 않습니다.';
 }catch(e){clearPreview();status.textContent='미리보기를 만들지 않았습니다: '+e.message;}});
 applyBtn.addEventListener('click',()=>{if(!pending)return;try{const token=pending.token;P0Production.applyArchiveReference(token);clearPreview();renderStored();status.textContent='검토한 선택 참조를 저장했습니다. 전체 아카이브는 메모리에만 남아 있습니다. 서버 저장 여부는 기존 동기화 표시를 확인하세요.';}catch(e){status.textContent='적용하지 않았습니다. 기존 참조를 유지합니다: '+e.message;}});
 cancelBtn.addEventListener('click',()=>{ticket++;clearPreview();status.textContent='미리보기를 취소했습니다. 현재 평가와 이전 참조를 바꾸지 않았습니다.';});
 release.addEventListener('click',()=>{ticket++;clearPreview();clearFile();renderStored();status.textContent='파일을 메모리에서 해제했습니다. 평가에 이미 저장한 참조 사본(읽을 당시 판본)은 그대로입니다.';});
 function renderReference(container,ref,rawId){
  const summary=node('div');summary.className='archive-reference-summary';container.append(summary);
  function row(title,value){const p=node('p');p.append(node('strong',title+' · '),node('span',String(value)));summary.append(p);}
  row('국가',label(ref.country));
  if(!ref.region_paths.length)row('지역 경로','대: 미확인 → 중: 미확인 → 소: 미확인');
  ref.region_paths.forEach((path,i)=>{const known=['large','middle','small'].map((key,j)=>['대','중','소'][j]+': '+(path.levels[key]?label(path.levels[key]):'미확인')).join(' → '),unknown=path.chain.filter(r=>r.browse_level===null).map(r=>label(r)+(r.native_level?' ('+r.native_level+')':''));row('지역 경로 '+(i+1),known+(unknown.length?' · 단계 미확인 원문: '+unknown.join(' → '):''));});
  row('농장',label(ref.farm)+' · ID: '+ref.farm.id);
  const selectedLot=ref.selected_lot;
  row('선택 로트',selectedLot?(selectedLot.label||selectedLot.id)+' · ID: '+selectedLot.id:'농장만 참조 · 선택한 로트 없음');
  row('크롭 연도',selectedLot?.crop_year??'미확인');row('대회 연도',selectedLot?.competition_year??'미확인');row('판매 연도',selectedLot?.sale_year??'미확인');
  if(!selectedLot)row('수상','선택한 수상 로트 없음 · 농장 수상은 현재 평가에 자동 상속하지 않습니다.');
  else if(!ref.linked_awards.length)row('수상','이 선택 로트에 정확히 연결된 수상 없음 · 다른 로트나 농장의 수상을 자동 상속하지 않습니다.');
  ref.linked_awards.forEach(award=>row('정확히 연결된 수상',award.event+' · 수상 대회 연도: '+award.event_year+' · 로트 ID: '+award.lot_id+(award.category?' · 부문: '+award.category:'')+(award.rank!==null?' · 순위: '+award.rank:'')+(award.score!==null?' · 원점수: '+award.score:'')));
  row('아카이브 판본',ref.archive.id+' · '+ref.archive.revision);row('참조 시각',ref.referenced_at);
  if(!ref.sources.length)row('공개 출처','이 참조 사본에 포함된 공개 출처 없음');
  ref.sources.forEach((source,i)=>{row('출처 '+(i+1),(source.title||'제목 미기록')+' · ID: '+source.id+' · 판본: '+(source.revision??'미기록'));row('출처 URL',source.url);});
  ref.warnings.forEach(warning=>row('참조 주의',warning));
  summary.append(node('p','읽을 당시 판본의 참조 사본입니다. 현재 커피의 사실 여부나 출처 진위를 보증하지 않습니다.'));
  const detail=node('details');detail.append(node('summary','전체 참조 데이터 보기'),node('pre',JSON.stringify(ref,null,2),rawId));container.append(detail);
 }
 function renderStored(){storedBody.replaceChildren();try{const state=P0Production.historySnapshot(),data=state.sessions.find(s=>s.id===state.currentSessionId)?.samples.find(s=>s.id===state.currentSampleId)?.sampleData;if(!data?.archive_reference){storedBody.append(node('p','이 평가에 연결된 아카이브 참조 없음'));return;}const ref=data.archive_reference;A.validateRecord(data);storedBody.append(node('p','기존에 연결해 보존한 참조입니다. 현재 라벨과 일치하는지는 별도로 확인하세요.'));if(data.record_identity?.status==='draft'&&data.record_identity?.confirmed_context)storedBody.append(node('p','라벨 값 변경으로 로트 확인이 해제되었습니다. 이 보존 참조를 새 라벨의 확정 출처로 사용하기 전에 농장·로트를 다시 확인하세요.'));if(data.record_identity?.status==='copy-draft')storedBody.append(node('p','복제 초안: 이전 평가의 참조를 원래 시각·판본 그대로 복사했습니다. 새 출처 확인이나 새 평가를 뜻하지 않습니다.'));if(index)storedBody.append(node('p',({ 'same-source':'불러온 파일과 같은 출처 판본·SHA입니다.','different-archive':'다른 아카이브 파일입니다. 저장된 참조는 그대로 유지합니다.','source-changed-snapshot-preserved':'불러온 판본 또는 파일 SHA가 다릅니다. 과거 참조 사본(읽을 당시 판본)은 자동 갱신하지 않았습니다.' })[A.freshness(ref,index,fileHash)]||'참조 출처 확인 필요'));renderReference(storedBody,ref);for(const old of data.archive_reference_history||[]){const item=node('details');item.append(node('summary',`이전 참조 · ${old.archive.id} · ${old.archive.revision} · ${old.referenced_at}`));renderReference(item,old);storedBody.append(item);}}catch(e){storedBody.append(node('p','보존 참조를 표시하지 않았습니다: '+e.message));}}
 for(const type of ['input','change'])document.addEventListener(type,event=>{if(!panel.contains(event.target))invalidate(event);},true);
 for(const type of ['cupping:history-changed','cupping:account-changed','cupping:auth-ready'])window.addEventListener(type,invalidate);
 window.addEventListener('storage',event=>{if(!event.key||event.key.startsWith('noel_sca_'))invalidate(event);});
 renderStored();window.ArchiveReferenceUI={renderStored};return window.ArchiveReferenceUI;
}
