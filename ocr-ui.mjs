import './ocr-lifecycle.js';
import {FIELD_KEYS,createLabelReview,chooseField,clearFieldChoice,chooseCatalog,requiredWarnings,confirmLabelReview,describeReviewText} from './ocr-label-review.mjs';
const labels={name:'품명',lot:'로트',crop:'크롭',process:'가공',code:'품목코드'};
const applyMap={name:'coffeeName',lot:'lotNumber',crop:'harvestYear',process:'process'};
let runtimePromise=null;
function runtime(base){
 if(!runtimePromise)runtimePromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=new URL('ocr-vendor/tesseract.min.js',base).href;script.onload=()=>resolve(window.Tesseract);script.onerror=()=>{script.remove();runtimePromise=null;reject(Error('인식 실행 파일을 읽지 못했습니다. 연결 상태를 확인하세요.'));};document.head.append(script);});
 return runtimePromise;
}
export function install(panel,base){
 const P=window.P0Production;
 const node=(tag,text,id)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(id)el.id=id;return el;};
 const button=(text,id)=>{const el=node('button',text,id);el.type='button';return el;};
 const notice=node('p','사진과 인식 원문은 이 검토 화면의 메모리에만 둡니다. 인식 버튼을 누르면 언어·실행 파일 약 8.61MB를 처음 내려받으며, 사진을 외부로 보내지 않습니다.');panel.append(notice);
 const fileLabel=node('label','라벨 이미지 · PNG/JPG/WebP, 8MiB·1,200만 화소 이하'),file=node('input',undefined,'ocrPhoto');file.type='file';file.accept='image/png,image/jpeg,image/webp';fileLabel.htmlFor=file.id;fileLabel.append(file);panel.append(fileLabel);
 const image=node('img',undefined,'ocrImagePreview');image.alt='선택한 라벨 이미지';image.hidden=true;panel.append(image);
 const langLabel=node('label','인식 언어'),language=node('select',undefined,'ocrLanguage');for(const [value,text]of [['eng+kor','영어 + 한국어'],['eng','영어'],['kor','한국어']]){const option=node('option',text);option.value=value;language.append(option);}langLabel.htmlFor=language.id;langLabel.append(language);panel.append(langLabel);
 const actions=node('div');actions.className='ocr-actions';const run=button('글자 인식하기','ocrRun'),stop=button('인식 취소','ocrStop'),release=button('사진·검토 원문 해제','ocrRelease');actions.append(run,stop,release);panel.append(actions);
 const progress=node('progress',undefined,'ocrProgress');progress.max=1;progress.value=0;progress.hidden=true;panel.append(progress);
 const status=node('p','이미지를 선택하고 인식을 시작하세요','ocrStatus');status.setAttribute('role','status');panel.append(status);
 const originalDetails=node('details');originalDetails.append(node('summary','처음 인식한 원문'));const originalView=node('pre','아직 인식한 원문이 없습니다','ocrOriginalText');originalDetails.append(originalView);panel.append(originalDetails);
 const rawLabel=node('label','검토 텍스트 · 수정하면 후보 확인과 적용 미리보기가 초기화됩니다'),raw=node('textarea',undefined,'ocrReviewText');raw.rows=7;raw.disabled=true;rawLabel.htmlFor=raw.id;rawLabel.append(raw);panel.append(rawLabel);
 const extract=button('라벨 후보 추출하기','ocrExtract');extract.disabled=true;panel.append(extract);
 const candidates=node('section',undefined,'ocrCandidates');candidates.hidden=true;candidates.append(node('h4','각 항목을 선택하고 확인하세요'),node('p','미확인 값은 기존 값을 유지합니다. 품목코드는 검토에만 남으며 연결 자료가 없어 코드 매칭을 하지 않습니다.'));const cards=node('div');candidates.append(cards);
 const warnings=node('div',undefined,'ocrWarnings');candidates.append(warnings);
 const reviewActions=node('div');reviewActions.className='ocr-actions';const preview=button('선택한 항목 적용 미리보기','ocrPrepare'),cancelReview=button('후보 확인 취소','ocrCancelReview');preview.disabled=true;reviewActions.append(preview,cancelReview);candidates.append(reviewActions);panel.append(candidates);
 const previewBox=node('section',undefined,'ocrApplyPreview');previewBox.hidden=true;previewBox.append(node('h4','현재 평가에 적용할 변경'));const target=node('p',undefined,'ocrApplyTarget'),changes=node('div',undefined,'ocrApplyChanges'),identity=node('p',undefined,'ocrIdentityNotice');previewBox.append(target,changes,identity,node('p','선택해 적용한 항목은 기존 저장·팀 동기화 흐름을 따릅니다. 사진·인식 원문·코드 검토 내용은 평가에 저장하거나 서버로 보내지 않습니다.'));
 const details=node('details');details.append(node('summary','원문·수정·확인 근거 전체'));const evidence=node('pre',undefined,'ocrReviewEvidence');details.append(evidence);previewBox.append(details);
 const beforeLink=node('a','적용 전 전체 평가 백업 받기','ocrBeforeBackup'),originalLink=node('a','저장소 JSON 원문 백업 받기','ocrOriginalBackup');beforeLink.hidden=originalLink.hidden=true;previewBox.append(beforeLink,originalLink);
  const apply=button('검토한 변경을 현재 평가에 적용','ocrApply'),cancelPreview=button('적용 미리보기 취소','ocrCancelPreview');apply.disabled=true;previewBox.append(apply,cancelPreview);panel.append(previewBox);
 const savedBackup=node('a','최근 라벨 적용 전 평가 백업 받기','ocrLatestBackup');savedBackup.hidden=true;panel.append(savedBackup);
 let selected=null,imageUrl=null,originalText=null,context=null,review=null,pending=null,ticket=0,applying=false,busy=false;
 const confirmed=new Set(),acknowledged=new Set(),applyFields=new Set(),fieldNodes=new Map(),backupUrls=[];
 let savedBackupUrl=null;
 const lifecycle=new window.OcrWorkerLifecycle(state=>{busy=state!=='idle';update();});
 function dropUrls(){for(const url of backupUrls)URL.revokeObjectURL(url);backupUrls.length=0;for(const link of [beforeLink,originalLink]){link.hidden=true;link.removeAttribute('href');link.removeAttribute('download');}}
 function clearPreview(){P.cancelOcrLabelPatch();pending=null;previewBox.hidden=true;apply.disabled=true;changes.replaceChildren();evidence.textContent='';dropUrls();}
 function clearReview(){clearPreview();review=null;confirmed.clear();acknowledged.clear();applyFields.clear();fieldNodes.clear();cards.replaceChildren();warnings.replaceChildren();candidates.hidden=true;preview.disabled=true;}
 function forget(){ticket++;clearReview();selected=null;context=null;originalText=null;raw.value='';raw.disabled=true;file.value='';originalView.textContent='아직 인식한 원문이 없습니다';image.hidden=true;image.removeAttribute('src');if(imageUrl)URL.revokeObjectURL(imageUrl);imageUrl=null;}
 function ready(){return !!context&&!!review&&!busy&&FIELD_KEYS.every(f=>review.decisions[f].kind!=='pending'&&confirmed.has(f))&&requiredWarnings(review).every(w=>acknowledged.has(w.id))&&applyFields.size>0;}
 function update(){file.disabled=busy;language.disabled=busy;run.disabled=busy||!selected;stop.hidden=!busy;stop.disabled=lifecycle.state==='stopping';progress.hidden=!busy;release.disabled=busy;extract.disabled=busy||raw.disabled||!raw.value.trim()||!context;preview.disabled=!ready();}
 function backupLink(link,rawText,name){const url=URL.createObjectURL(new Blob([rawText],{type:'application/json;charset=utf-8'}));backupUrls.push(url);link.href=url;link.download=name;link.hidden=false;}
 function refreshSavedBackup(){if(savedBackupUrl)URL.revokeObjectURL(savedBackupUrl);savedBackupUrl=null;savedBackup.hidden=true;savedBackup.removeAttribute('href');try{const record=P.getOcrLabelBackup();if(!record)return;savedBackupUrl=URL.createObjectURL(new Blob([record.before],{type:'application/json;charset=utf-8'}));savedBackup.href=savedBackupUrl;savedBackup.download='before-latest-ocr-label.json';savedBackup.hidden=false;}catch(_){}}
 async function cancel(message='인식을 취소했습니다'){
  const seq=++ticket;clearReview();raw.value='';raw.disabled=true;originalText=null;originalView.textContent='아직 인식한 원문이 없습니다';
  if(lifecycle.state!=='idle'){const done=lifecycle.cancel();status.textContent='취소 처리 중 · 준비가 끝나면 종료합니다. 준비가 멈추면 페이지 새로고침이 필요합니다';try{await done;}catch(_){}if(seq!==ticket)return;}
  status.textContent=message;update();
 }
 function invalidate(event){
  if(applying&&event?.type==='cupping:history-changed')return;
  const account=['cupping:account-changed','cupping:auth-ready','storage'].includes(event?.type);
  if(!account&&!context)return;
  if(!account){try{P.assertOcrContext(context);return;}catch(_){}}
  forget();if(lifecycle.state!=='idle')lifecycle.cancel().catch(()=>{});status.textContent=busy?'계정·샘플·입력이 바뀌어 취소 처리 중입니다. 준비가 멈추면 페이지를 새로고침해 주세요.':'계정·샘플·입력이 바뀌어 라벨 검토를 해제했습니다. 현재 샘플에서 다시 시작하세요.';update();refreshSavedBackup();
 }
 file.addEventListener('change',async()=>{
  const chosen=file.files?.[0];if(!chosen)return;forget();const seq=++ticket;
  try{const guard=P.captureOcrContext();if(!['image/png','image/jpeg','image/webp'].includes(chosen.type)||chosen.size>8*1024*1024)throw Error('8MiB 이하 PNG/JPG/WebP 라벨을 선택하세요.');const bitmap=await createImageBitmap(chosen);const pixels=bitmap.width*bitmap.height;bitmap.close();if(seq!==ticket)return;if(pixels>12000000)throw Error('1,200만 화소 이하 이미지를 선택하세요.');P.assertOcrContext(guard);context=guard;selected=chosen;imageUrl=URL.createObjectURL(chosen);image.src=imageUrl;image.hidden=false;status.textContent='이미지를 확인하고 글자 인식을 시작하세요';}
  catch(error){if(seq===ticket)status.textContent='사진을 읽지 않았습니다: '+error.message;}update();
 });
 language.addEventListener('change',()=>{ticket++;clearReview();raw.value='';raw.disabled=true;originalText=null;originalView.textContent='언어를 바꿔 새 인식이 필요합니다';status.textContent='선택한 언어로 다시 인식해 주세요';update();});
 run.addEventListener('click',async()=>{
  if(busy||!selected)return;let guard;try{guard=context||P.captureOcrContext();P.assertOcrContext(guard);context=guard;}catch(error){status.textContent=error.message;return;}
  clearReview();raw.value='';raw.disabled=true;originalText=null;originalView.textContent='인식 중';const seq=++ticket;status.textContent='인식 실행 파일을 준비합니다';const started=performance.now();
  const timeout=setTimeout(()=>{if(seq===ticket)cancel('90초를 넘어 인식을 중지했습니다. 더 작은 이미지로 다시 시도하세요');},90000);
  try{
   const result=await lifecycle.run(async()=>{const T=await runtime(base);if(seq!==ticket)throw Error('cancelled');P.assertOcrContext(guard);return T.createWorker(language.value,1,{workerPath:new URL('ocr-vendor/worker.min.js',base).href,corePath:new URL('ocr-vendor/core/',base).href,langPath:new URL('ocr-vendor/lang',base).href,workerBlobURL:false,cacheMethod:'none',gzip:true,errorHandler:()=>{},logger:message=>{if(seq===ticket){progress.value=message.progress||0;status.textContent=message.status==='recognizing text'?'글자를 읽는 중':'인식 엔진과 언어 파일 준비 중';}}});},async worker=>{await worker.setParameters({tessedit_pageseg_mode:window.Tesseract.PSM.SINGLE_BLOCK,user_defined_dpi:'300'});return worker.recognize(selected);});
   if(seq!==ticket||result.cancelled)return;P.assertOcrContext(guard);originalText=result.data.data.text;raw.value=originalText;raw.disabled=false;originalView.textContent=originalText;status.textContent=`인식 ${(performance.now()-started)/1000<1?'완료':((performance.now()-started)/1000).toFixed(1)+'초'} · 원본과 대조하고 후보를 추출하세요. 숫자·단위는 틀릴 수 있습니다.`;
  }catch(error){if(seq===ticket){raw.value='';raw.disabled=true;originalView.textContent='인식 결과 없음';status.textContent='인식하지 않았습니다: '+error.message;}}
  finally{clearTimeout(timeout);update();}
 });
 stop.addEventListener('click',()=>cancel());release.addEventListener('click',()=>{forget();status.textContent='사진과 검토 원문을 메모리에서 해제했습니다';update();});
 raw.addEventListener('input',()=>{clearReview();status.textContent='검토 텍스트가 바뀌었습니다. 후보부터 다시 확인하세요';update();});
 function showWarnings(){warnings.replaceChildren(node('h4','불확실한 내용 확인'));const list=requiredWarnings(review);if(!list.length)warnings.append(node('p','감지한 경고는 없습니다. 각 항목은 원본과 직접 대조하세요.'));for(const warning of list){const label=node('label'),check=node('input');check.type='checkbox';check.checked=acknowledged.has(warning.id);label.className='ocr-check ocr-warning';label.append(check,node('span',labels[warning.field]+' · '+warning.message));check.addEventListener('change',()=>{clearPreview();if(check.checked)acknowledged.add(warning.id);else acknowledged.delete(warning.id);update();});warnings.append(label);}}
 function option(value,text){const opt=node('option',text);opt.value=value;return opt;}
 function renderFields(){cards.replaceChildren();fieldNodes.clear();for(const field of FIELD_KEYS){
  const card=node('section');card.className='ocr-field';card.append(node('h4',labels[field]+(field==='code'?' · 연결 자료 없음':'')));const select=node('select',undefined,'ocrChoice_'+field);select.setAttribute('aria-label',labels[field]+' 선택');select.append(option('','선택 필요'));for(const c of review.extraction.candidates[field])select.append(option(c.id,'후보: '+c.value));select.append(option('manual','직접 수정'),option('unknown','미확인 · 기존 값 유지'));card.append(select);
  const manual=node('input',undefined,'ocrManual_'+field);manual.type='text';manual.maxLength=2000;manual.hidden=true;manual.setAttribute('aria-label',labels[field]+' 직접 수정');card.append(manual);
  const evidenceDetails=node('details');evidenceDetails.append(node('summary','근거 원문'));if(!review.extraction.candidates[field].length)evidenceDetails.append(node('p','명시된 라벨을 찾지 못했습니다.'));for(const c of review.extraction.candidates[field])evidenceDetails.append(node('p',c.source.line+'줄 · '+c.source.label),node('pre',c.source.text));card.append(evidenceDetails);
  const check=node('input',undefined,'ocrChecked_'+field);check.type='checkbox';check.disabled=true;const cl=node('label');cl.className='ocr-check';cl.append(check,node('span',labels[field]+' 값을 원본과 대조했습니다'));card.append(cl);
  let include=null;if(applyMap[field]){include=node('input',undefined,'ocrInclude_'+field);include.type='checkbox';include.disabled=true;const il=node('label');il.className='ocr-check';il.append(include,node('span','이 값을 현재 평가에 적용'));card.append(il);include.addEventListener('change',()=>{clearPreview();if(include.checked)applyFields.add(field);else applyFields.delete(field);update();});}else card.append(node('p','코드는 원문 확인 결과에만 남습니다. 실제 상품 연결 자료가 없어 매칭하지 않습니다.'));
  const changed=()=>{clearPreview();confirmed.delete(field);acknowledged.clear();applyFields.delete(field);check.checked=false;if(include){include.checked=false;include.disabled=true;}review=select.value==='manual'?(manual.value.trim()?chooseField(review,field,{kind:'manual',value:manual.value}):clearFieldChoice(review,field)):select.value==='unknown'?chooseField(review,field,{kind:'unknown'}):select.value?chooseField(review,field,{kind:'candidate',candidateId:select.value}):clearFieldChoice(review,field);review=chooseCatalog(review,{kind:'unlinked'});check.disabled=review.decisions[field].kind==='pending';showWarnings();update();};
  select.addEventListener('change',()=>{manual.hidden=select.value!=='manual';changed();if(!manual.hidden)manual.focus();});manual.addEventListener('input',changed);check.addEventListener('change',()=>{clearPreview();if(check.checked)confirmed.add(field);else confirmed.delete(field);if(include){include.disabled=!check.checked||review.decisions[field].value===null;if(include.disabled){include.checked=false;applyFields.delete(field);}}update();});fieldNodes.set(field,{select,manual,check,include});cards.append(card);
 }}
 extract.addEventListener('click',()=>{if(extract.disabled)return;try{P.assertOcrContext(context);clearReview();review=chooseCatalog(createLabelReview(raw.value,{catalog:[],catalogVersion:'no-linked-catalog'}),{kind:'unlinked'});renderFields();showWarnings();candidates.hidden=false;status.textContent='각 항목·불확실성을 확인하고 실제로 적용할 4개 항목만 선택하세요';update();}catch(error){status.textContent=error.message;}});
 function reviewStamp(){return JSON.stringify({originalText,reviewText:raw.value,decisions:review?.decisions,confirmed:[...confirmed].sort(),warnings:[...acknowledged].sort(),applyFields:[...applyFields].sort()});}
 preview.addEventListener('click',()=>{if(!ready())return;clearPreview();try{P.assertOcrContext(context);const final=confirmLabelReview(review,{expectedRevision:review.revision,confirmed:true,acknowledgedWarningIds:[...acknowledged]}).staging;const patch=window.OcrApplyModel.buildPatch(final.fields,[...applyFields]);const stamp=reviewStamp();pending={...P.prepareOcrLabelPatch(patch,stamp,context),stamp};target.textContent='적용 대상: '+pending.sampleTitle;changes.replaceChildren();for(const change of pending.changes)changes.append(node('p',change.label+' · '+String(change.before??'미입력')+' → '+change.after));identity.textContent=pending.identityNotice+(pending.hasPreservedArchive?' 기존 농장 참조와 이력은 보존됩니다. 현재 라벨의 확정 출처로 사용하기 전에 다시 확인하세요.':'');evidence.textContent=JSON.stringify({...final,originalOcrText:originalText,reviewText:raw.value,...describeReviewText(originalText,raw.value),codeLinkStatus:'연결 자료 없음',selectedApplyFields:[...applyFields]},null,2);backupLink(beforeLink,pending.before,'before-ocr-label.json');backupLink(originalLink,pending.original,'before-ocr-storage-original.json');previewBox.hidden=false;apply.disabled=false;status.textContent='변경 전·후와 백업을 검토한 뒤 명시적으로 적용하세요';}catch(error){clearPreview();status.textContent='미리보기를 만들지 않았습니다: '+error.message;}});
 apply.addEventListener('click',()=>{if(!pending||!ready())return;try{applying=true;P.applyOcrLabelPatch(pending.token,reviewStamp());pending=null;context=null;apply.disabled=true;preview.disabled=true;status.textContent='검토한 항목을 저장했습니다. 원문 백업을 보관했고 기존 팀 동기화 상태는 앱 표시를 확인하세요.';refreshSavedBackup();}catch(error){status.textContent=String(error.message).includes('일부 복원')?'저장과 일부 복원에 실패했습니다. 위의 적용 전 백업을 내려받아 복구를 검토하세요: '+error.message:'적용하지 않았습니다. 기존 자료와 검토 내용을 유지합니다: '+error.message;}finally{applying=false;update();}});
 cancelPreview.addEventListener('click',()=>{clearPreview();status.textContent='적용 미리보기를 취소했습니다. 현재 평가를 바꾸지 않았습니다.';update();});cancelReview.addEventListener('click',()=>{clearReview();status.textContent='후보 확인을 취소했습니다. 처음 인식한 원문과 검토 텍스트는 유지합니다';update();});
 for(const type of ['input','change'])document.addEventListener(type,event=>{if(!panel.contains(event.target))invalidate(event);},true);
 for(const type of ['cupping:history-changed','cupping:account-changed','cupping:auth-ready'])window.addEventListener(type,invalidate);
 window.addEventListener('storage',event=>{if(!event.key||event.key.startsWith('noel_sca_'))invalidate(event);});
 window.addEventListener('pagehide',()=>{ticket++;lifecycle.cancel().catch(()=>{});if(imageUrl)URL.revokeObjectURL(imageUrl);dropUrls();if(savedBackupUrl)URL.revokeObjectURL(savedBackupUrl);});
 update();refreshSavedBackup();
}
