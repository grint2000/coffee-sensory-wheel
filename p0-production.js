function setP0SelectValue(id, value) {
  const select = document.getElementById(id), text = String(value || '');
  if (text && !Array.from(select.options).some(o => o.value === text)) {
    const option = document.createElement('option'); option.value = text; option.textContent = text + ' (기존 값)'; select.append(option);
  }
  select.value = text;
}
/* P0 integration: preserve the existing account keys and team document mapping. */
function installP0Production() {
  const M = P0Model;
  const $ = id => document.getElementById(id);
  let loadedUser = null, locked = false, dirty = false, previewActive = false;
  let editVersion = 0, request = 0, pending = null, history = [];
  let mergeSources = [];
  let lastImportRaw = null, previousBackup = null, syncRequest = 0, syncInFlight = false;
  let recoveryText = null, recoveryOffset = 0, displayedTitle = null, displayingStoredScores = false;
  let draftBaseCache = null, draftPending = null, draftRestoreAttempt = null, draftOwnedScope = null, restoredDraftFocus = null;
  const user = () => window.currentUser || 'default';
  const keys = name => ({ sessions: `noel_sca_sessions_${name}`, samples: `noel_sca_samples2_${name}`, selected: `noel_sca_current_sample_${name}`, meta: `noel_sca_p0_meta_${name}`, original: `noel_sca_pre_p0_${name}` });
  const setStatus = (text, state) => { $('p0SaveStatus').textContent = text; $('p0SaveStatus').dataset.state = state; };
  const setSync = text => { $('p0SyncStatus').textContent = text; };
  function downloadLink(id, text, raw, filename) {
    const a = $(id);
    if (a.dataset.objectUrl) URL.revokeObjectURL(a.dataset.objectUrl);
    a.href = URL.createObjectURL(new Blob([raw], { type: 'application/json;charset=utf-8' }));
    a.dataset.objectUrl = a.href; a.download = filename; a.textContent = text; a.hidden = false;
  }
  function renderRecovery() {
    if (recoveryText === null) return;
    const end = Math.min(recoveryText.length, recoveryOffset + 50000);
    $('p0RecoveryText').value = recoveryText.slice(recoveryOffset, end);
    $('p0RecoveryRange').textContent = `원문 ${recoveryOffset + 1}~${end}자 / 전체 ${recoveryText.length}자 · 입력을 바꾸지 않는 읽기 전용 화면`;
    $('p0RecoveryPrev').disabled = recoveryOffset === 0;
    $('p0RecoveryNext').disabled = end >= recoveryText.length;
  }
  function setRecoveryRaw(raw) {
    recoveryText = raw; recoveryOffset = 0; $('p0Recovery').hidden = raw === null;
    const form = $('cuppingForm'); if (form) form.style.display = raw === null ? '' : 'none';
    for (const id of ['newSessionBtn','addSampleBtn','removeSampleBtn','cloneSampleBtn','saveSessionMetaBtn','saveSamplesBtn','undoBtn']) { if ($(id)) $(id).disabled = raw !== null; }
    if (raw !== null) {
      $('p0RecoverySize').textContent = `기존 저장 원문 ${new TextEncoder().encode(raw).length.toLocaleString()}바이트. 일반 편집·검증 가져오기는 1MiB 이하이며, 이 원문 열람·내보내기에는 해당 한도를 적용하지 않습니다.`;
      downloadLink('p0RecoveryRawLink', '기존 저장 JSON 원문 그대로 받기', raw, 'existing-local-records-original.json'); renderRecovery();
    }
  }
  $('p0RecoveryPrev').addEventListener('click', () => { recoveryOffset = Math.max(0, recoveryOffset - 50000); renderRecovery(); });
  $('p0RecoveryNext').addEventListener('click', () => { recoveryOffset = Math.min(Math.max(0, recoveryText.length - 1), recoveryOffset + 50000); renderRecovery(); });
  function backup(next = sessions, sessionId = currentSessionId, sampleId = currentSampleId) {
    return JSON.stringify({ format: 'noel-cupping-review-backup', version: 1, exportedAt: new Date().toISOString(), state: { sessions: next, currentSessionId: sessionId, currentSampleId: sampleId } }, null, 2);
  }
  function checkedBackup(next = sessions, sessionId = currentSessionId, sampleId = currentSampleId) {
    const raw = backup(next, sessionId, sampleId); CuppingImportGuard.parse(raw); return raw;
  }
  function hydrateSample(sample) {
    const result = { ...sample, sampleData: { ...getEmptySampleData(), ...M.hydrate(sample.sampleData) } };
    validateSampleData(result.sampleData); return result;
  }
  function parseBackup(raw) {
    const parsed = CuppingImportGuard.parse(raw);
    const next = parsed.kind === 'sessions'
      ? parsed.data.map(s => { const result = { ...createNewSessionObj(), ...s, samples: s.samples.map(hydrateSample) }; if (!Object.hasOwn(s, 'condition_provenance')) delete result.condition_provenance; if (!Object.hasOwn(s, 'waterTemp')) delete result.waterTemp; return result; })
      : [createNewSessionObj({ title: '기존 평가 기록', samples: parsed.data.map(hydrateSample) })];
    const sessionId = parsed.selection?.currentSessionId || next[0].id;
    const session = next.find(s => s.id === sessionId);
    if (!session) throw Error('선택 세션이 자료에 없습니다');
    const sampleId = parsed.selection?.currentSampleId || session.samples[0].id;
    if (!session.samples.some(s => s.id === sampleId)) throw Error('선택 샘플이 해당 세션에 없습니다');
    return { ...parsed, next, sessionId, sampleId };
  }
  function originalBytes(name = loadedUser) {
    const k = keys(name);
    return { user: name, sessions: localStorage.getItem(k.sessions), samples: localStorage.getItem(k.samples), selected: localStorage.getItem(k.selected) };
  }
  function ensureOriginalBackup() {
    const k = keys(loadedUser);
    if (localStorage.getItem(k.original) === null) {
      localStorage.setItem(k.original, JSON.stringify({ version: 1, savedAt: new Date().toISOString(), ...originalBytes() }));
    }
  }
  function draftScope() { return window.getCuppingAccountId?.() || null; }
  function draftStatus(message) { if($('p0DraftStatus')) $('p0DraftStatus').textContent=message; }
  function pendingIdentityInputs(data, committing = false) {
    const fields={identityFarmId:'farm_id',identityProducerId:'producer_id',identityCropYear:'crop_year',identityRoastBatchId:'roast_batch_id'},result={};
    for(const[id,key]of Object.entries(fields)){const value=$(id)?.value||'';if(value.trim()!==String(data.record_identity?.[key]??''))result[id]=value;}return {...result,...(window.AssessmentContextUI?.pendingInputs(committing)||{})};
  }
  function sessionContextRaw(session) { return session ? JSON.stringify(Object.fromEntries(['waterTemp','grindSize','condition_provenance'].filter(k=>Object.hasOwn(session,k)).map(k=>[k,session[k]]))) : null; }
  function storedSessionContextRaw(sampleId) { const raw=originalBytes().sessions;if(!raw)return null;const rows=JSON.parse(raw);return sessionContextRaw(Array.isArray(rows)?rows.find(s=>s.samples?.some(x=>x.id===sampleId)):null); }
  function draftRecord(scope,session,selected,baseSampleRaw,pendingInputs,baseSessionContextRaw=storedSessionContextRaw(selected.id)) {
    const focused=document.activeElement?.id||'',single=M.clone(session);single.samples=[M.clone(selected)];
    return {version:1,scope,user:loadedUser,session:single,sampleId:selected.id,baseSampleRaw,baseSessionContextRaw,pendingInputs,focusId:/^[A-Za-z0-9_-]{0,100}$/.test(focused)?focused:'',savedAt:Date.now()};
  }
  function storedSampleRaw(sampleId) {
    const old=originalBytes(),raw=old.sessions||old.samples;if(!raw)return null;
    const parsed=JSON.parse(raw),rows=Array.isArray(parsed)&&parsed[0]?.samples?parsed.flatMap(s=>s.samples):parsed;
    const found=Array.isArray(rows)?rows.find(s=>s.id===sampleId):null;return found?JSON.stringify(found):null;
  }
  function persistDraft() {
    if(!dirty||locked||previewActive||draftPending||loadedUser!==user())return false;
    const scope=draftScope();if(!scope){draftStatus('계정 확인 전입니다. 입력은 화면에 유지되며, 인증 확인 후 계정별 초안 보관을 시작합니다.');return false;}
    try{
      const previous=localStorage.getItem(CuppingDraftStore.key(scope));
      if(previous&&draftOwnedScope!==scope){const record=CuppingDraftStore.decode(previous,scope);draftPending={record,raw:previous,scope};$('p0DraftRecovery').hidden=false;draftStatus('계정에 보관된 이전 초안과 방금 입력한 화면이 있습니다. 먼저 사용할 내용을 선택하세요.');downloadLink('p0DraftFile','계정에 보관된 이전 초안 받기',previous,'previous-input-draft.json');return false;}
      flushDraft();const selected=getCurrentSampleObj();if(!selected)return false;
      if(previous){const prior=CuppingDraftStore.decode(previous,scope);if(prior.sampleId!==selected.id&&Object.keys(prior.pendingInputs||{}).length){localStorage.setItem(CuppingDraftStore.archiveKey(scope),previous);downloadLink('p0DraftFile','이전 샘플의 미확정 참조 입력 받기',previous,'previous-sample-reference-draft.json');}}
      if(!draftBaseCache||draftBaseCache.sampleId!==selected.id||draftBaseCache.scope!==scope)draftBaseCache={scope,sampleId:selected.id,raw:storedSampleRaw(selected.id),sessionRaw:storedSessionContextRaw(selected.id)};
      const raw=CuppingDraftStore.encode(draftRecord(scope,getCurrentSessionObj(),selected,draftBaseCache.raw,pendingIdentityInputs(selected.sampleData),draftBaseCache.sessionRaw));
      localStorage.setItem(CuppingDraftStore.key(scope),raw);draftOwnedScope=scope;draftStatus('입력 초안을 이 기기에 보관했습니다. 평가 완료·서버 저장과는 별개입니다.');return true;
    }catch(e){draftStatus('초안 보관 실패 · 화면을 닫기 전에 JSON 백업을 확인하세요. '+e.message);return false;}
  }
  function applyDraft(record) {
    if(loadedUser!==user()||record.scope!==draftScope()||record.user!==loadedUser||locked||previewActive)throw Error('초안의 계정과 현재 계정이 다르거나 자료를 보호 중입니다.');
    const next=M.clone(sessions),target=next.find(s=>s.samples.some(x=>x.id===record.sampleId));let sessionId;
    if(target){target.samples=target.samples.map(x=>x.id===record.sampleId?M.clone(record.session.samples[0]):x);sessionId=target.id;}
    else if(!originalBytes().sessions&&!originalBytes().samples){next.splice(0,next.length,M.clone(record.session));sessionId=record.session.id;}
    else {const container=next.find(s=>s.id===record.session.id);if(container){container.samples.push(M.clone(record.session.samples[0]));sessionId=container.id;}else{next.push(M.clone(record.session));sessionId=record.session.id;}}
    checkedBackup(next,sessionId,record.sampleId);sessions=next;currentSessionId=sessionId;currentSampleId=record.sampleId;dirty=true;draftPending=null;draftOwnedScope=record.scope;clearTimeout(sampleSaveTimeout);renderState();
    for(const[id,value]of Object.entries(record.pendingInputs||{}))if($(id))$(id).value=value;
    $('p0DraftRecovery').hidden=true;setStatus('이전 입력 초안을 복원했습니다 · 확인 후 저장하세요','dirty');draftStatus('초안 복원 완료 · 정식 저장값과 서버 자료는 아직 바꾸지 않았습니다.');
    restoredDraftFocus={scope:record.scope,sampleId:record.sampleId,focusId:record.focusId,pendingInputs:record.pendingInputs||{}};resumeDraftFocus();
  }
  function resumeDraftFocus(){if(restoredDraftFocus?.scope===draftScope()&&restoredDraftFocus.sampleId===currentSampleId){for(const[id,value]of Object.entries(restoredDraftFocus.pendingInputs))if($(id))$(id).value=value;window.dispatchEvent(new CustomEvent('cupping:draft-restored',{detail:{focusId:restoredDraftFocus.focusId}}));}}
  function restoreSavedDraft() {
    const scope=draftScope();if(!scope||loadedUser!==user()||locked||dirty)return;
    const key=CuppingDraftStore.key(scope);let raw;try{raw=localStorage.getItem(key);}catch{return;}if(!raw||draftRestoreAttempt===scope+'|'+raw)return;draftRestoreAttempt=scope+'|'+raw;
    try{
      const record=CuppingDraftStore.decode(raw,scope);if(record.user!==loadedUser)throw Error('현재 로컬 프로필과 초안의 프로필이 다릅니다.');
      const actual=storedSampleRaw(record.sampleId),sessionInputs=Object.keys(record.pendingInputs||{}).some(k=>['sessionWaterTempInline','sessionWaterSource','sessionWaterInstrument','sessionGrindSizeInline'].includes(k)),sessionUnchanged=!sessionInputs||record.baseSessionContextRaw===storedSessionContextRaw(record.sampleId),noCanonical=!originalBytes().sessions&&!originalBytes().samples;
      if(sessionUnchanged&&((record.baseSampleRaw!==null&&actual===record.baseSampleRaw)||(record.baseSampleRaw===null&&noCanonical))){applyDraft(record);return;}
      draftPending={record,raw,scope};$('p0DraftRecovery').hidden=false;draftStatus('이전 초안과 현재 저장본이 다릅니다. 자동으로 덮어쓰지 않았습니다.');downloadLink('p0DraftFile','보관 초안 JSON 받기',raw,'saved-input-draft.json');
    }catch(e){draftStatus('보관 초안을 자동 복원하지 않았습니다: '+e.message);downloadLink('p0DraftFile','읽지 못한 초안 원문 받기',raw,'unreadable-input-draft.json');}
  }
  $('p0DraftRestoreBtn').addEventListener('click',()=>{if(!draftPending)return;try{const p=draftPending;if(p.scope!==draftScope())throw Error('계정이 바뀌었습니다.');const before=checkedBackup();localStorage.setItem('noel_sca_before_draft_restore_'+encodeURIComponent(p.scope),before);downloadLink('p0BeforeDraftFile','초안 복원 전 현재 자료 받기',before,'before-draft-restore.json');applyDraft(p.record);}catch(e){draftStatus('초안을 적용하지 않았습니다: '+e.message);}});
  $('p0DraftKeepBtn').addEventListener('click',()=>{if(!draftPending)return;try{const p=draftPending;if(p.scope!==draftScope())throw Error('계정이 바뀌었습니다.');localStorage.setItem(CuppingDraftStore.archiveKey(p.scope),p.raw);localStorage.removeItem(CuppingDraftStore.key(p.scope));downloadLink('p0DraftFile','별도 보관한 이전 초안 받기',p.raw,'previous-input-draft.json');draftPending=null;$('p0DraftRecovery').hidden=true;draftBaseCache=null;draftStatus('현재 저장본을 사용합니다. 이전 초안은 이 기기에 별도로 보관했습니다.');if(dirty)scheduleAutoSave();}catch(e){draftStatus('이전 초안을 보관하지 못해 선택을 유지했습니다: '+e.message);}});
  window.addEventListener('pagehide',persistDraft);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')persistDraft();});
  window.addEventListener('cupping:auth-ready',()=>{if(dirty)persistDraft();else restoreSavedDraft();});
  for(const id of ['identityFarmId','identityProducerId','identityCropYear','identityRoastBatchId'])$(id)?.addEventListener('input',()=>{dirty=true;editVersion++;clearTimeout(sampleSaveTimeout);persistDraft();setStatus('로트 참조 입력을 임시 보관했습니다. 로트 정보 확인을 눌러 연결하세요.','dirty');});
  function refreshLinks() {
    if (lastImportRaw) downloadLink('p0OriginalLink', '가져온 원본 JSON 그대로 받기', lastImportRaw, 'imported-original.json');
    if (previousBackup) downloadLink('p0PreviousLink', '직전 복구 전 백업 받기', previousBackup, 'before-restore.json');
    try {
      const original = localStorage.getItem(keys(loadedUser).original);
      if (original) downloadLink('p0MigrationLink', 'P0 전환 전 저장 원문 보관', original, 'pre-p0-local-original.json');
      const transition = localStorage.getItem(`noel_sca_team_transition_${loadedUser}`);
      if (transition) downloadLink('p0TeamTransitionLink', '최근 팀 전환 전 평가 백업', transition, 'before-team-transition.json');
    } catch (_) {}
    $('p0RestoreHistory').textContent = history.length ? history.map(h => h.mode ? `${h.at} · ${h.mode === 'merge' ? '추가 병합' : '전체 교체'} · ${h.beforeSessions ?? '확인 불가'}세션 / ${h.beforeSamples ?? '확인 불가'}샘플 → ${h.sessions}세션 / ${h.samples}샘플${h.mode === 'merge' ? ` · 추가 ${h.addedSamples} / 중복 제외 ${h.skippedSamples}` : ''}` : `${h.at} · ${h.sessions}세션 / ${h.samples}샘플 복구`).join('\n') : '이 기기에서 적용한 복구 이력이 없습니다';
  }
  function renderState() {
    samples = getCurrentSessionObj().samples;
    const selected = samples.find(s => s.id === currentSampleId) || samples[0]; currentSampleId = selected.id;
    setUIFromSample(selected.sampleData); renderSessionSelect(); renderSampleList(); refreshLinks();
  }
  function flushDraft() {
    const s = getCurrentSampleObj(); if (!s || !dirty) return;
    const previousTitle = s.sampleData.title, titleChanged = $('sampleTitleInput').value !== displayedTitle;
    saveUIToSample(s.sampleData);
    if (titleChanged) { s.title = $('sampleTitleInput').value.trim() || '샘플'; s.sampleData.title = s.title; }
    else s.sampleData.title = previousTitle;
    syncCurrentSessionSamples();
  }
  function startSync(nextSamples) {
    if (user() !== loadedUser) return;
    const token = ++syncRequest; syncInFlight = true;
    if (typeof window.syncSamplesToTeam !== 'function') { syncInFlight = false; setSync('팀 동기화 모듈 준비 전 · 이 기기 저장과 별개입니다'); return; }
    setSync('팀 동기화 결과 확인 중…');
    Promise.resolve(window.syncSamplesToTeam(M.clone(nextSamples))).then(result => {
      if (token !== syncRequest) return; syncInFlight = false;
      setSync(result?.status === 'saved' ? '현재 세션 샘플의 서버 저장 완료' : result?.status === 'failed' ? '팀 동기화 실패 · 이 기기 저장은 유지됩니다. 연결 후 저장을 다시 시도하세요' : '팀 동기화 대상 없음 · 로그인과 팀 선택 상태를 확인하세요');
    }).catch(() => { if (token === syncRequest) { syncInFlight = false; setSync('팀 동기화 실패 · 이 기기 저장은 유지됩니다'); } });
  }
  function commit(next, sessionId, sampleId, meta, sync = true) {
    checkedBackup(next, sessionId, sampleId);
    const k = keys(loadedUser), nextSamples = next.find(s => s.id === sessionId).samples;
    const originalEntry = localStorage.getItem(k.original) === null ? [[k.original, JSON.stringify({ version: 1, savedAt: new Date().toISOString(), ...originalBytes() })]] : [];
    const entries=[...originalEntry,
      [k.sessions, JSON.stringify(next)], [k.samples, JSON.stringify(nextSamples)], [k.selected, sampleId],
      [k.meta, JSON.stringify({ version: 1, currentSessionId: sessionId, history: meta.history, lastImportRaw: meta.lastImportRaw, previousBackup: meta.previousBackup })]
    ];const scope=draftScope(),selected=nextSamples.find(x=>x.id===sampleId),remaining=sampleId===currentSampleId?pendingIdentityInputs(selected.sampleData,true):{};
    if(scope){const oldDraft=localStorage.getItem(CuppingDraftStore.key(scope));if(oldDraft){try{CuppingDraftStore.decode(oldDraft,scope);}catch{entries.push([CuppingDraftStore.archiveKey(scope),oldDraft]);}}const retained=Object.keys(remaining).length?CuppingDraftStore.encode(draftRecord(scope,next.find(s=>s.id===sessionId),selected,JSON.stringify(selected),remaining,sessionContextRaw(next.find(s=>s.id===sessionId)))):'';entries.push([CuppingDraftStore.key(scope),retained]);}
    CuppingImportGuard.atomicWrite(localStorage, entries);window.AssessmentContextUI?.sessionCommitted();draftBaseCache=null;draftRestoreAttempt=null;draftOwnedScope=Object.keys(remaining).length?scope:null;draftStatus(Object.keys(remaining).length?'평가를 저장했고 미확정 로트 참조 입력은 초안으로 보관했습니다.':'현재 입력을 정식 저장했습니다.');
    if (sync) startSync(nextSamples);
  }
  function saveError(e) {
    const failedRollback = String(e.message).includes('일부 복원');
    setStatus(failedRollback ? '저장과 일부 복원에 실패했습니다. 전환 전 원문과 별도 JSON 백업을 보존하고 복구를 검토하세요' : '이 기기 저장 실패 · 이전 저장값을 유지했습니다. 현재 입력은 화면에 남습니다. ' + e.message, 'error');
  }
 const baseSetUI=setUIFromSample;
 setUIFromSample=function(d){displayingStoredScores=true;try{baseSetUI(d);}finally{displayingStoredScores=false;}displayedTitle=$('sampleTitleInput').value;const summary=M.summary(d);$('p0AssessmentState').textContent=summary.status==='legacy-unknown'?'기존 기록 · 실제 평가 여부 미확인. 원점수와 옛 합계를 보존하며 신규 확정 평균에서만 제외합니다.':summary.status==='complete'?'7개 항목을 명시적으로 평가했습니다. Noel 산식으로 계산합니다.':`미평가 항목이 있습니다 (${summary.count}/7). 확정 평균에서 제외합니다.`;
  const legacy=$('p0LegacyDetails');legacy.hidden=!d.legacy_original;if(d.legacy_original)$('p0LegacyValues').textContent=SCORE_FIELD_CONFIG.map(f=>`${f.label}: ${d.legacy_original.scores[f.id]??'원기록 미입력'}`).join('\n')+`\n이전 버전 산식 재계산 합계: ${d.legacy_original.display_total.toFixed(2)}\n기존 main 산식은 빈 항목을 7점, 6점 미만을 6점으로 계산했습니다. 원점수는 위에 그대로 보존하며, 이 재계산값은 당시 저장 총점이나 평가 완료 확인이 아닙니다.`;
 };
 normalizeScoreValue=function(v,fallback=null){if(v===null||v===undefined||v==='')return fallback;const n=Number(v);return Number.isFinite(n)?Math.min(10,Math.max(6,Math.round(n*4)/4)):fallback;};
 getScoreValueFromUI=k=>normalizeScoreValue($(`${k}Input`)?.value,null);
 setScoreValueToUI=function(k,v){const n=displayingStoredScores&&typeof v==='number'&&Number.isFinite(v)?v:normalizeScoreValue(v,null),input=$(`${k}Input`);if(input){input.value=n===null?'':n.toFixed(2);input.placeholder='미평가';}const fill=$(`${k}ProgressFill`);if(fill){fill.style.width=n===null?'0%':`${Math.min(100,Math.max(0,(n-6)*25))}%`;fill.style.backgroundColor='#65834e';}if($(`${k}MinusBtn`))$(`${k}MinusBtn`).disabled=n!==null&&n<=6;if($(`${k}PlusBtn`))$(`${k}PlusBtn`).disabled=n!==null&&n>=10;return n;};
 syncScoreRealtime=function(k,raw){const n=setScoreValueToUI(k,raw),d=getCurrentSampleObj()?.sampleData;if(d){M.assess(d,k,n);updateTotalScore(d);$('p0AssessmentState').textContent=M.summary(d).count===7?'7개 항목 명시 평가 완료':`명시 평가 ${M.summary(d).count}/7 · 미완료 자료는 확정 평균에서 제외`;}scheduleAutoSave();return n;};
 formatScoreTotal=d=>M.display(d);
 updateTotalScore=function(data){const d=data||getCurrentSampleObj()?.sampleData;if(!d)return;const s=M.summary(d);$('totalScore').textContent=M.display(d);const badge=$('scoreGrade');if(badge){badge.textContent=s.status==='legacy-unknown'?'기존 기록 · 평가 여부 미확인':s.total===null?'미평가':'명시 평가 완료';badge.style.backgroundColor=s.total===null?'#666':'#426344';}const agg=M.aggregates(samples);$('p0Aggregate').textContent=`명시 평가 완료 ${agg.count}개 · 평균 ${agg.average===null?'없음':agg.average.toFixed(2)} · 제외 ${agg.excluded}개 (미완료 또는 기존 평가 여부 미확인). 기존 원점수는 비교표에서 그대로 열람할 수 있습니다.`;if($('evalDate'))$('evalDate').textContent=new Date().toLocaleDateString();};
 validateSampleData=function(d){M.validate(d);if(!d.flavorSelections)d.flavorSelections={};FLAVOR_PHASES.forEach(p=>{if(!d.flavorSelections[p.id])d.flavorSelections[p.id]=[];});if(!d.bodyDescriptors)d.bodyDescriptors=[];return true;};
 const baseRadar=updateRadar;
 updateRadar=function(d){if(typeof Chart==='undefined')return;return baseRadar(d);};

  scheduleAutoSave = function() {
    dirty = true; editVersion++; clearTimeout(sampleSaveTimeout);
    setStatus('아직 이 기기에 저장하지 않은 변경이 있습니다', 'dirty');
    persistDraft();
    if (!previewActive && !locked && !draftPending) sampleSaveTimeout = setTimeout(() => saveCurrentSample(), 2000);
  };
  saveSessionsToStorage = function() {
    if(draftPending){draftStatus('보관된 초안과 현재 저장본 중 사용할 자료를 먼저 선택하세요.');return false;}
    if (locked || previewActive) { setStatus(locked ? '읽지 못한 저장 원문을 보호 중입니다. 검증 복구를 먼저 진행하세요' : '복구 미리보기 중입니다. 적용 또는 취소 뒤 저장하세요', 'error'); return false; }
    if (loadedUser !== user()) { setStatus('계정이 바뀌었습니다. 이전 계정 자료를 새 계정에 저장하지 않았습니다. 먼저 JSON으로 보관하세요', 'error'); return false; }
    try { window.AssessmentContextUI?.assertValid(); window.AssessmentContextUI?.applySession(); commit(sessions, currentSessionId, currentSampleId, { history, lastImportRaw, previousBackup }); dirty = false; setStatus('이 기기에 저장됨 · ' + new Date().toLocaleTimeString(), 'saved'); refreshLinks(); return true; }
    catch (e) { saveError(e); return false; }
  };
  saveSamplesToStorage = function() { syncCurrentSessionSamples(); return saveSessionsToStorage(); };
  saveCurrentSample = function(applyInput = true, explicit = false) {
    if (previewActive) { $('courseImportStatus').textContent = '복구 미리보기를 적용 또는 취소한 뒤 저장·샘플 추가를 진행하세요'; return false; }
    if (!getCurrentSampleObj()) return false;
    if (!dirty && !explicit) return true;
    if (applyInput) flushDraft(); renderSampleList(); updateTotalScore(); return saveSamplesToStorage();
  };
  loadSamplesFromStorage = function() {
    clearTimeout(sampleSaveTimeout); syncRequest++; syncInFlight = false; loadedUser = user(); locked = false; dirty = false; setRecoveryRaw(null);
    history = []; lastImportRaw = null; previousBackup = null; mergeSources = [];draftBaseCache=null;draftPending=null;draftRestoreAttempt=null;draftOwnedScope=null;restoredDraftFocus=null;draftStatus('');$('p0DraftRecovery').hidden=true;
    for(const id of ['p0DraftFile','p0BeforeDraftFile']){const link=$(id);if(link.dataset.objectUrl)URL.revokeObjectURL(link.dataset.objectUrl);link.hidden=true;link.removeAttribute('href');delete link.dataset.objectUrl;}
    for (const id of ['p0OriginalLink', 'p0PreviousLink', 'p0MigrationLink', 'p0TeamTransitionLink']) $(id).hidden = true;
    const k = keys(loadedUser);
    try {
      const sessionsRaw = localStorage.getItem(k.sessions), samplesRaw = localStorage.getItem(k.samples);
      const raw = sessionsRaw || samplesRaw;
      if (raw) {
        const parsed = parseBackup(raw); checkedBackup(parsed.next, parsed.sessionId, parsed.sampleId); sessions = parsed.next; rememberMergeSource(parsed.data, sessions, parsed.kind);
        const selectedId = localStorage.getItem(k.selected);
        let selectedSession = sessions.find(s => s.samples.some(x => x.id === selectedId)) || sessions[0];
        currentSessionId = selectedSession.id; currentSampleId = selectedSession.samples.some(s => s.id === selectedId) ? selectedId : selectedSession.samples[0].id;
        try { const meta = JSON.parse(localStorage.getItem(k.meta) || 'null'); if (meta?.version === 1) { history = Array.isArray(meta.history) ? meta.history.slice(-20) : []; lastImportRaw = meta.lastImportRaw || null; previousBackup = meta.previousBackup || null; } } catch (_) {}
        setStatus('기존 저장 기록을 불러왔습니다 · 원본 바이트는 아직 바꾸지 않았습니다', 'saved');
      } else { sessions = [createNewSessionObj()]; currentSessionId = sessions[0].id; currentSampleId = sessions[0].samples[0].id; setStatus('새 기록 · 아직 이 기기에 저장되지 않았습니다', 'dirty'); }
    } catch (e) {
      locked = true; sessions = [createNewSessionObj()]; currentSessionId = sessions[0].id; currentSampleId = sessions[0].samples[0].id;
      setStatus('기존 저장 자료를 읽지 못해 덮어쓰기를 막았습니다: ' + e.message, 'error');
      try { const old = originalBytes(); downloadLink('p0MigrationLink', '읽지 못한 저장 원문 보관', JSON.stringify(old, null, 2), 'unreadable-local-original.json'); const raw = old.sessions || old.samples; if (raw !== null) setRecoveryRaw(raw); } catch (_) {}
    }
    setSync('서버 저장 여부는 별도로 확인합니다'); renderState(); restoreSavedDraft();
  };
  loadSample = function(id) {
    if (previewActive) { $('courseImportStatus').textContent = '복구 미리보기를 적용 또는 취소한 뒤 샘플을 선택하세요'; return; }
    if (loadedUser !== user()) { accountChanged(); return; }
    if (dirty && !saveCurrentSample()) return;
    const selected = samples.find(s => s.id === id); if (!selected) return;
    currentSampleId = id; setUIFromSample(selected.sampleData); renderSampleList();
    try { localStorage.setItem(keys(loadedUser).selected, id); }
    catch (_) { setStatus('선택 위치를 저장하지 못했습니다. 평가 자료는 바꾸지 않았습니다', 'error'); }
  };
  const originalSwitch = switchSession;
  switchSession = function(id) { if (previewActive) { $('courseImportStatus').textContent = '복구 미리보기를 적용 또는 취소한 뒤 세션을 선택하세요'; return; } if (loadedUser !== user()) { accountChanged(); return; } if (dirty && !saveCurrentSample()) return; originalSwitch(id); };
  const originalBackupList = showBackupList;
  showBackupList = function() { refreshLinks(); $('p0BackupDetails').open = true; originalBackupList(); };
  restoreBackup = function(item) { try { preview(localStorage.getItem(item.key), item.date + ' 기존 백업'); $('backupRestoreModal')?.classList.remove('show'); } catch (e) { $('courseImportStatus').textContent = '복구하지 않았습니다: ' + e.message; } };
  setupErrorMonitoring = function() { window.addEventListener('error', () => setStatus('화면 오류가 발생했습니다. 자동 복구로 기록을 덮어쓰지 않습니다. 현재 입력을 JSON으로 보관하세요', 'error')); };
  const sameContent = (a,b) => CuppingBackupMerge.same(a,b);
  const sessionMetadata = session => Object.fromEntries(Object.entries(session).filter(([key]) => key !== 'samples'));
  function rememberMergeSource(rawRows, hydratedRows, kind = 'sessions') {
    if (kind !== 'sessions') return;
    for (const raw of rawRows) {
      const hydrated = hydratedRows.find(row => row.id === raw.id); if (!hydrated) continue;
      const origin = mergeSources.find(row => row.raw.id === raw.id);
      if (!origin) { mergeSources.push({raw:M.clone(raw),hydrated:M.clone(hydrated)}); continue; }
      const rawSamples = new Map(origin.raw.samples.map(row=>[row.id,row])), hydratedSamples = new Map(origin.hydrated.samples.map(row=>[row.id,row]));
      for (const sample of raw.samples) {
        const current = hydrated.samples.find(row=>row.id===sample.id);
        if (current && (!hydratedSamples.has(sample.id) || !sameContent(current,hydratedSamples.get(sample.id)))) { rawSamples.set(sample.id,M.clone(sample)); hydratedSamples.set(sample.id,M.clone(current)); }
      }
      const sameMetadata = sameContent(sessionMetadata(origin.hydrated),sessionMetadata(hydrated));
      origin.raw = {...M.clone(sameMetadata?sessionMetadata(origin.raw):sessionMetadata(raw)),samples:[...rawSamples.values()]};
      origin.hydrated = {...M.clone(sessionMetadata(hydrated)),samples:[...hydratedSamples.values()]};
    }
  }
  // Only exact original bytes/content paired with an unchanged loaded record may
  // match its hydrated display form. No absent field, name or author is inferred.
  function mergeInput(p) {
    return p.data.map(source => {
      const row = M.clone(source), current = p.current.find(s => s.id === source.id);
      if (!current) return row;
      for (const origin of mergeSources.filter(s => s.raw.id === source.id)) {
        if (sameContent(sessionMetadata(source), sessionMetadata(origin.raw)) && sameContent(sessionMetadata(current), sessionMetadata(origin.hydrated))) {
          for (const key of Object.keys(row)) if (key !== 'samples') delete row[key];
          Object.assign(row, M.clone(sessionMetadata(current))); break;
        }
      }
      row.samples = source.samples.map(sample => {
        const existing = current.samples.find(s => s.id === sample.id);
        if (existing && mergeSources.some(origin => origin.raw.id === source.id && origin.raw.samples.some(raw => raw.id === sample.id && sameContent(raw,sample)) && origin.hydrated.samples.some(old => old.id === sample.id && sameContent(old,existing)))) return M.clone(existing);
        return M.clone(sample);
      });
      return row;
    });
  }
  const counts = rows => ({ sessions: rows.length, samples: rows.reduce((total,s) => total+s.samples.length,0) });
  function formStamp() {
    return JSON.stringify(Array.from(document.querySelectorAll('input,textarea,select')).filter(e => e.id !== 'importSamplesInput' && e.name !== 'courseImportMode').map(e => [e.id,e.value,e.checked]));
  }
  function storageStamp() { const k=keys(loadedUser), scope=draftScope(); return JSON.stringify([...Object.values(k).map(key=>[key,localStorage.getItem(key)]),...(scope?[[CuppingDraftStore.key(scope),localStorage.getItem(CuppingDraftStore.key(scope))]]:[])]); }
  function previewIsCurrent(p) { return p.user === user() && p.user === loadedUser && p.scope === draftScope() && p.editVersion === editVersion && p.form === formStamp() && p.state === JSON.stringify({sessions,currentSessionId,currentSampleId}) && p.storage === storageStamp(); }
  function cancelImport(message) { request++; pending = null; previewActive = false; $('courseImportPreview').hidden = true; $('courseImportApply').disabled = false; $('importSamplesInput').value = ''; $('courseImportStatus').textContent = message || '취소했습니다. 기존 자료와 선택 상태를 유지합니다'; }
  function renderImportMode() {
    if (!pending) return;
    const p = pending, mode = document.querySelector('input[name="courseImportMode"]:checked').value;
    p.mode = mode; p.apply = null; $('courseImportConflict').hidden = true;
    const beforeText = p.beforeCounts ? `${p.beforeCounts.sessions}세션 / ${p.beforeCounts.samples}샘플` : '읽지 못한 저장 원문 (건수 확인 불가)';
    try {
      if (!previewIsCurrent(p)) throw Error('계정·입력·선택·저장값이 바뀌었습니다. 취소한 뒤 최신 상태에서 다시 미리보세요');
      let next = p.next, sessionId = p.sessionId, sampleId = p.sampleId, plan = null;
      if (mode === 'merge') {
        if (locked) throw Error('읽지 못한 원문은 병합할 수 없습니다. 원문을 보관하고 전체 교체를 검토하세요');
        if (p.kind !== 'sessions') throw Error('세션 ID가 없는 샘플 배열은 병합할 수 없습니다. 세션 백업을 사용하거나 전체 교체를 검토하세요');
        plan = CuppingBackupMerge.plan(p.current, mergeInput(p));
        if (!plan.ok) throw Error(plan.conflicts.slice(0,3).map(c => `${c.sessionId}${c.sampleId?' / '+c.sampleId:''}: ${c.message}`).join(' · ') + (plan.conflicts.length > 3 ? ` · 외 ${plan.conflicts.length-3}건` : '') + ' · 어느 쪽도 덮어쓰지 않았습니다');
        // The planner compares raw input first; only genuinely new rows use the
        // existing, validated display hydration. Existing rows remain exact.
        const existingIds = new Set(p.current.flatMap(s=>s.samples.map(x=>x.id)));
        next = plan.next.map(s => {
          const incoming = p.next.find(row=>row.id===s.id);
          return { ...(p.current.some(row=>row.id===s.id)?s:incoming), samples:s.samples.map(sample=>existingIds.has(sample.id)?sample:incoming.samples.find(row=>row.id===sample.id)) };
        });
        sessionId = p.currentSessionId; sampleId = p.currentSampleId;
      }
      checkedBackup(next,sessionId,sampleId);
      const after = counts(next), agg = M.aggregates(next.flatMap(s=>s.samples));
      p.apply = {next,sessionId,sampleId,after,plan};
      $('courseImportSummary').textContent = `${p.name} · ${p.sessionCount}세션 / ${p.sampleCount}샘플 입력 · ${mode==='merge'?'추가 병합':'전체 교체'}: ${beforeText} → ${after.sessions}세션 / ${after.samples}샘플. ${plan?`추가 ${plan.addedSessions}세션 / ${plan.addedSamples}샘플 · 동일 원문 제외 ${plan.skippedSamples}샘플. 현재 선택 유지. `:''}확정 ${agg.count}개 / 제외 ${agg.excluded}개.`;
      $('courseImportApply').textContent = plan?.addedSamples===0 ? '중복 확인 완료' : mode==='merge'?'검토한 자료 추가 병합':'검토한 자료로 교체';
      $('courseImportApply').disabled = false;
      $('courseImportStatus').textContent = plan?.addedSamples===0 ? '추가할 자료가 없습니다. 저장·서버 동기화·이력을 바꾸지 않습니다' : '검증 통과 · 아직 적용하지 않았습니다';
    } catch (e) {
      $('courseImportSummary').textContent = `${p.name} · ${p.sessionCount}세션 / ${p.sampleCount}샘플 입력 · ${mode==='merge'?'추가 병합':'전체 교체'}: ${beforeText} → 적용 불가. 기존 자료 유지.`;
      $('courseImportConflict').textContent = e.message; $('courseImportConflict').hidden = false; $('courseImportApply').disabled = true; $('courseImportStatus').textContent = '적용하지 않았습니다. 원본을 확인하거나 다른 복구 방식을 검토하세요';
    }
  }
  function preview(raw, name) {
    cancelImport('가져온 자료를 검증하고 있습니다');
    const parsed = parseBackup(raw); checkedBackup(parsed.next, parsed.sessionId, parsed.sampleId);
    if (loadedUser !== user() || draftPending || syncInFlight) throw Error('계정·보관 초안·진행 중인 서버 저장을 먼저 확인하세요');
    flushDraft(); if (!locked) { window.AssessmentContextUI?.assertValid(); window.AssessmentContextUI?.applySession(); } const before = locked ? JSON.stringify(originalBytes(), null, 2) : checkedBackup();
    pending = { ...parsed, raw, name, before, editVersion, user: loadedUser, scope:draftScope(), current:M.clone(sessions), currentSessionId,currentSampleId, beforeCounts:locked?null:counts(sessions), state:JSON.stringify({sessions,currentSessionId,currentSampleId}), form:formStamp(), storage:storageStamp() };
    previewActive = true; clearTimeout(sampleSaveTimeout);
    document.querySelector('input[name="courseImportMode"][value="replace"]').checked = true;
    $('courseImportPreview').hidden = false; renderImportMode();
    downloadLink('p0BeforeLink', '복구 전 현재 자료 백업 받기', before, 'before-restore.json'); $('courseImportPreview').scrollIntoView({ block: 'center' });
  }
  function bindImport() {
    document.addEventListener('click', event => {
      if (!previewActive || !event.target.closest?.('#removeSampleBtn')) return;
      event.preventDefault(); event.stopImmediatePropagation(); $('courseImportStatus').textContent = '복구 미리보기를 적용 또는 취소한 뒤 샘플을 삭제하세요';
    }, true);
    $('importSamplesInput').addEventListener('change', async e => {
      const file = e.target.files[0]; cancelImport('가져온 자료를 검증하고 있습니다'); const ticket = request;
      if (!file) return;
      const context = {user:loadedUser,scope:draftScope(),editVersion,state:JSON.stringify({sessions,currentSessionId,currentSampleId}),form:formStamp(),storage:storageStamp()};
      try { if (file.size > CuppingImportGuard.MAX_BYTES) throw Error('파일은 1MiB 이하여야 합니다'); const raw = await file.text(); if (ticket === request) { if (!previewIsCurrent(context)) throw Error('파일을 읽는 동안 계정·입력·선택·저장값이 바뀌었습니다. 파일을 다시 선택하세요'); preview(raw, file.name); } }
      catch (e) { if (ticket === request) $('courseImportStatus').textContent = '가져오지 않았습니다: ' + e.message; }
    });
    for (const radio of document.querySelectorAll('input[name="courseImportMode"]')) radio.addEventListener('change',renderImportMode);
    $('courseImportCancel').addEventListener('click', () => cancelImport());
    $('courseImportApply').addEventListener('click', () => {
      if (!pending) return;
      if (!previewIsCurrent(pending)) { cancelImport('계정 또는 입력·선택·저장값이 바뀌었습니다. 최신 상태에서 다시 미리보세요'); return; }
      try {
        const p = pending, result = p.apply; if (!result) return;
        if (p.mode === 'merge' && result.plan.addedSamples === 0) { cancelImport(`중복 ${result.plan.skippedSamples}샘플 확인 완료 · 자료·선택·저장·서버·이력을 그대로 유지했습니다`); return; }
        const {next,sessionId,sampleId,after,plan} = result;
        const nextHistory = [...history, { at: new Date().toISOString(), mode:p.mode, sessions:after.sessions, samples:after.samples, beforeSessions:p.beforeCounts?.sessions??null, beforeSamples:p.beforeCounts?.samples??null, inputSessions:p.sessionCount,inputSamples:p.sampleCount,addedSessions:plan?.addedSessions??null,addedSamples:plan?.addedSamples??null,skippedSamples:plan?.skippedSamples??null }].slice(-20);
        commit(next, sessionId, sampleId, { history: nextHistory, lastImportRaw: p.raw, previousBackup: p.before });
        if(p.mode==='replace')mergeSources=[]; rememberMergeSource(p.data,next,p.kind);
        sessions = next; currentSessionId = sessionId; currentSampleId = sampleId; history = nextHistory; lastImportRaw = p.raw; previousBackup = p.before;
        locked = false; dirty = false; setRecoveryRaw(null); cancelImport('복구 적용 완료 · 이 기기에 저장했습니다. 서버 상태는 별도 표시를 확인하세요'); renderState(); setStatus('복구 자료가 이 기기에 저장됨', 'saved');
      } catch (e) { saveError(e); $('courseImportStatus').textContent = '적용하지 못했습니다: ' + e.message; }
    });
  }
  function exportAll() {
    flushDraft(); try { window.AssessmentContextUI?.assertValid(); window.AssessmentContextUI?.applySession(); downloadLink('courseBackupLink', '전체 백업 JSON 저장', checkedBackup(), 'noel-cupping-backup.json'); $('courseBackupLink').scrollIntoView({ block: 'center' }); }
    catch (e) { $('courseBackupLink').hidden = true; setStatus('백업을 만들지 못했습니다: ' + e.message + ' · 선택 세션별 백업을 사용하거나 입력을 확인하세요', 'error'); }
  }
  exportCurrentSessionJson = function() { flushDraft(); const s = getCurrentSessionObj(); try { window.AssessmentContextUI?.assertValid(); window.AssessmentContextUI?.applySession(); downloadLink('courseBackupLink', '선택 세션 백업 JSON 저장', checkedBackup([s], s.id, currentSampleId), 'selected-session-backup.json'); } catch (e) { setStatus('백업을 만들지 못했습니다: ' + e.message, 'error'); } };
  function accountChanged() {
    if (loadedUser === user()) return;
    clearTimeout(sampleSaveTimeout); syncRequest++; syncInFlight = false; request++; pending = null; previewActive = false; $('courseImportPreview').hidden = true;
    if (dirty) { setStatus('로그인 계정이 바뀌었습니다. 이전 계정의 미저장 입력을 JSON으로 보관한 뒤 저장소를 불러오세요', 'error'); return; }
    loadSamplesFromStorage();
  }
  function receiveTeamSamples(incoming) {
    if (loadedUser !== user()) accountChanged();
    if (loadedUser !== user() || dirty || previewActive || locked || syncInFlight || draftPending) { setSync('팀의 새 자료가 있습니다. 미저장 입력 또는 진행 중인 서버 저장을 보호하기 위해 자동 교체하지 않았습니다'); return false; }
    try {
      const parsed = parseBackup(JSON.stringify(incoming)), next = M.clone(sessions);
      next.find(s => s.id === currentSessionId).samples = parsed.next[0].samples;
      const chosen = parsed.next[0].samples.some(s => s.id === currentSampleId) ? currentSampleId : parsed.next[0].samples[0].id;
      if (JSON.stringify(samples) === JSON.stringify(parsed.next[0].samples)) return true;
      commit(next, currentSessionId, chosen, { history, lastImportRaw, previousBackup }, false);
      sessions = next; currentSampleId = chosen; renderState(); setStatus('팀에서 받은 샘플을 이 기기에 저장했습니다', 'saved'); setSync('팀 자료 수신 완료 · 서버에 재전송하지 않았습니다'); return true;
    } catch (e) { saveError(e); setSync('팀 자료 검증 또는 로컬 저장 실패 · 현재 자료를 유지합니다'); return false; }
  }
  function undoSamples(incoming, selected) {
    const parsed = parseBackup(JSON.stringify(incoming)), next = M.clone(sessions);
    next.find(s => s.id === currentSessionId).samples = parsed.next[0].samples;
    const chosen = parsed.next[0].samples.some(s => s.id === selected) ? selected : parsed.next[0].samples[0].id;
    commit(next, currentSessionId, chosen, { history, lastImportRaw, previousBackup }); sessions = next; currentSampleId = chosen; dirty = false; renderState(); setStatus('실행 취소 결과를 이 기기에 저장했습니다', 'saved');
  }
  Object.defineProperty(window, 'samples', { configurable: true, get: () => samples });
  Object.defineProperty(window, 'currentSampleId', { configurable: true, get: () => currentSampleId });
  function prepareTeamTransition() {
    if (loadedUser !== user() || locked || previewActive || syncInFlight || draftPending) throw Error('계정·복구·저장 상태가 바뀌었습니다. 현재 입력을 보관한 뒤 다시 시도하세요.');
    flushDraft(); window.AssessmentContextUI?.assertValid(); window.AssessmentContextUI?.applySession(); const raw = checkedBackup();
    localStorage.setItem(`noel_sca_team_transition_${loadedUser}`, raw);
    commit(sessions, currentSessionId, currentSampleId, { history, lastImportRaw, previousBackup }, false);
    dirty = false; refreshLinks(); setStatus('팀 전환 전 평가를 이 기기에 저장하고 백업했습니다', 'saved');
    setSync('팀 전환 전 로컬 저장 완료 · 새 팀의 서버 상태는 별도로 확인합니다');
    return M.clone(samples);
  }
  function currentDraft() {
    if (loadedUser !== user() || locked || previewActive || syncInFlight || draftPending) throw Error('계정·복구·저장 상태를 먼저 확인하세요.');
    flushDraft(); window.AssessmentContextUI?.assertValid(); window.AssessmentContextUI?.applySession(); return M.clone({ sample: getCurrentSampleObj(), sessionId: currentSessionId });
  }
  function replaceCurrentData(data) {
    currentDraft(); const next=M.clone(sessions), selected=next.find(s=>s.id===currentSessionId).samples.find(s=>s.id===currentSampleId);
    selected.sampleData=M.clone(data); selected.lastEdit=Date.now();
    commit(next,currentSessionId,currentSampleId,{history,lastImportRaw,previousBackup});sessions=next;dirty=false;renderState();setStatus('평가 식별 정보를 이 기기에 저장했습니다','saved');
  }
  function appendEvaluation(data,title,restoreContext=null) {
    currentDraft(); const next=M.clone(sessions),id=RecordModel.newId('sample');
    if(restoreContext){const previous=next.find(s=>s.id===currentSessionId).samples.find(s=>s.id===currentSampleId);for(const key of ['coffeeName','origin','variety','farmName','harvestYear','process','lotNumber','supplierName'])if(Object.hasOwn(restoreContext,key))previous.sampleData[key]=restoreContext[key];}
    next.find(s=>s.id===currentSessionId).samples.unshift({id,title,sampleData:M.clone(data),lastEdit:Date.now()});
    commit(next,currentSessionId,id,{history,lastImportRaw,previousBackup});sessions=next;currentSampleId=id;dirty=false;renderState();setStatus('새 평가 기록을 이 기기에 저장했습니다','saved');
  }
  window.P0Production = { bindImport, exportAll, preview, parseBackup, accountChanged, receiveTeamSamples, undoSamples, prepareTeamTransition, currentDraft, replaceCurrentData, appendEvaluation, resumeDraftFocus, persistCurrentDraft:persistDraft, saveExplicit: () => saveCurrentSample(true, true), getState: () => M.clone({ sessions, currentSessionId, currentSampleId, loadedUser, locked, dirty, history, lastImportRaw, previousBackup }) };
}
