import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, collection, getDoc, getDocs, updateDoc, deleteDoc, onSnapshot, runTransaction, serverTimestamp, FieldPath } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD-rwtilsBrdQ9JDJYFwXb57ebD6DsSqGg",
  authDomain: "coffee-sensory-app.firebaseapp.com",
  projectId: "coffee-sensory-app",
  storageBucket: "coffee-sensory-app.firebasestorage.app",
  messagingSenderId: "201184721721",
  appId: "1:201184721721:web:9dbf49df9d399a5ef0c6e8"
};

const app = initializeApp(firebaseConfig), auth = getAuth(app), db = getFirestore(app);
const TEAM_STORAGE_KEYS = { currentUser: 'noel_sca_current_user', currentTeam: 'noel_sca_current_team' };
const TEAM_NAME_REGEX = /^[0-9A-Za-z가-힣_-]{2,40}$/;
let authEpoch = 0, teamVersion = 0, activeTeam = null, teamBusy = false, lastProfileUid = null, lastProfileName = null, blockedProfileTransfer = false, authReady = false;
window.getCuppingAccountId = () => !authReady ? null : auth.currentUser ? 'firebase:'+auth.currentUser.uid : 'local:default';
const $ = id => document.getElementById(id);
function notifyMessage(msg) { if (typeof window.showToast === 'function') window.showToast(msg); else alert(msg); }
function status(msg) { if ($('teamAccessStatus')) $('teamAccessStatus').textContent = msg; }
function safeGetStorage(key, fallback = null) { try { return localStorage.getItem(key) ?? fallback; } catch (_) { return fallback; } }
function safeSetStorage(key, value) { try { localStorage.setItem(key, value); return true; } catch (_) { notifyMessage('이 기기에 팀 선택을 저장하지 못했습니다. 평가 자료는 유지됩니다.'); return false; } }
function safeRemoveStorage(key) { try { localStorage.removeItem(key); } catch (_) { status('팀 선택 기록을 정리하지 못했습니다. 다시 로그인하면 권한을 재확인합니다.'); } }
function getCurrentTeamName() { return activeTeam?.name || safeGetStorage(TEAM_STORAGE_KEYS.currentTeam) || safeGetStorage('mollis_sca_current_team', ''); }
function normalizeTeamName(raw) { const name = (raw || '').trim(); if (!TEAM_NAME_REGEX.test(name)) { notifyMessage('팀 이름은 2~40자의 한글/영문/숫자/밑줄/하이픈만 사용할 수 있습니다.'); return ''; } return name; }
function session(silent=false) { if (!auth.currentUser) { if(!silent)notifyMessage('먼저 Google 계정으로 로그인하세요.'); return null; } return { uid: auth.currentUser.uid, epoch: authEpoch }; }
function current(s) { return !!s && auth.currentUser?.uid === s.uid && authEpoch === s.epoch; }
function assertCurrent(s) { if (!current(s)) throw Error('account-changed'); }
function member(data, uid) { return Array.isArray(data?.memberUids) && data.memberUids.includes(uid); }
function displayName() { return String(auth.currentUser?.displayName || auth.currentUser?.email || window.currentUser || '회원').slice(0, 100); }
function stopListener() { if (window._teamSamplesUnsub) window._teamSamplesUnsub(); window._teamSamplesUnsub = null; }
function updateTeamHeader() { if ($('currentTeamHeader')) $('currentTeamHeader').textContent = activeTeam ? `팀: ${activeTeam.name}` : ''; if ($('currentTeamDisplay')) $('currentTeamDisplay').textContent = activeTeam?.name || '없음'; }
function clearTeamAccess(message) {
  teamVersion++; stopListener(); activeTeam = null; safeRemoveStorage(TEAM_STORAGE_KEYS.currentTeam); safeRemoveStorage('mollis_sca_current_team');
  if ($('teamMembersList')) $('teamMembersList').replaceChildren(); if ($('teamJoinRequests')) $('teamJoinRequests').replaceChildren();
  if ($('teamReportBody')) $('teamReportBody').replaceChildren(); $('teamReportModal')?.classList.remove('show'); updateTeamHeader(); if (message) status(message);
}
function failure(error, message, s) {
  if ((s && !current(s)) || error?.message === 'team-changed') return;
  if (error?.code === 'permission-denied') clearTeamAccess('이 팀의 접근 권한을 확인할 수 없습니다. 선택을 해제했으며 이 기기 평가 기록은 유지됩니다. 팀장 승인 또는 권한 설정을 확인하세요.');
  else status(error?.message === 'account-changed' ? '계정이 바뀌어 작업을 중단했습니다.' : message);
}
function setBusy(on) { teamBusy = on; for (const id of ['createTeamBtn','joinTeamBtn','checkTeamApprovalBtn']) if ($(id)) $(id).disabled = on; }
async function guarded(action) { if (teamBusy) return; setBusy(true); try { return await action(); } finally { setBusy(false); } }
function pendingKey(uid) { return 'noel_sca_pending_team_' + uid; }
function refreshPending() { const uid=auth.currentUser?.uid, name=uid?safeGetStorage(pendingKey(uid),''):''; if ($('teamPendingStatus')) $('teamPendingStatus').textContent=name?`${name}: 가입 요청을 보냈습니다. 아래에서 승인 상태를 확인하세요.`:''; if ($('checkTeamApprovalBtn')) $('checkTeamApprovalBtn').hidden=!name; if ($('cancelTeamRequestBtn')) $('cancelTeamRequestBtn').hidden=!name; }
function prepareTransition() {
  if (blockedProfileTransfer) throw Error('로그인 계정이 바뀌었습니다. 이전 평가를 JSON으로 보관하고 계정별 자료를 확인한 뒤 다시 시작하세요.');
  if (!window.P0Production?.prepareTeamTransition) throw Error('앱 준비가 끝난 뒤 다시 시도하세요.');
  return window.P0Production.prepareTeamTransition();
}
function acceptSamples(data, s) {
  if (!current(s) || !member(data,s.uid)) return false;
  const rows=data.memberSamples?.[s.uid];
  if (!Array.isArray(rows)) { status('서버의 본인 평가 형식을 확인할 수 없습니다. 이 기기 자료는 유지됩니다.'); return false; }
  if (!rows.length) { status('팀의 본인 평가가 비어 있습니다. 이 기기 기록은 유지했습니다. 저장하면 본인 평가만 서버에 반영됩니다.'); return true; }
  return window.P0Production?.receiveTeamSamples(rows) !== false;
}
async function activateTeam(name, s, seedEmpty = false, preserveDraft = false) {
  const version=++teamVersion, check=()=>{assertCurrent(s);if(version!==teamVersion)throw Error('team-changed');};
  check(); const ref=doc(db,'teams',name);let snap;
  try{snap=await getDoc(ref);}catch(e){check();throw e;}check();
  if (!snap.exists() || !member(snap.data(),s.uid)) throw Error('membership-required');
  if(preserveDraft&&window.P0Production?.getState().dirty){
    check();stopListener();activeTeam={name,uid:s.uid,epoch:s.epoch};safeSetStorage(TEAM_STORAGE_KEYS.currentTeam,name);updateTeamHeader();startTeamSamplesListener();
    status('팀 권한을 확인했습니다. 복원한 초안을 보호하며 서버 자료로 자동 교체하지 않습니다. 확인 후 저장하세요.');return;
  }
  // Preserve the current draft before another team's values can replace this session.
  const localRows=prepareTransition(); let data=snap.data();
  if (seedEmpty) data=await runTransaction(db,async tx=>{
    check(); const latest=await tx.get(ref); check();
    if (!latest.exists() || !member(latest.data(),s.uid)) throw Error('membership-required');
    const before=latest.data(); if (!Array.isArray(before.memberSamples?.[s.uid])) throw Error('invalid-member-samples');
    if (!before.memberSamples[s.uid].length && localRows.length) { tx.update(ref,new FieldPath('memberSamples',s.uid),localRows,'updatedAt',Date.now()); return {...before,memberSamples:{...before.memberSamples,[s.uid]:localRows}}; }
    return before;
  });
  check(); stopListener(); $('teamMembersList')?.replaceChildren();$('teamJoinRequests')?.replaceChildren();$('teamReportBody')?.replaceChildren();$('teamReportModal')?.classList.remove('show');if($('teamOwnerOnly'))$('teamOwnerOnly').hidden=true;
  activeTeam={name,uid:s.uid,epoch:s.epoch}; safeSetStorage(TEAM_STORAGE_KEYS.currentTeam,name); safeRemoveStorage(pendingKey(s.uid)); refreshPending(); updateTeamHeader();
  acceptSamples(data,s); startTeamSamplesListener(); status('팀 접근 권한을 확인했습니다. 평가 저장은 본인 자료에만 적용됩니다.');
}
window.firebaseLogin=async function(){ try { await signInWithPopup(auth,new GoogleAuthProvider()); } catch (_) { notifyMessage('Google 로그인에 실패했습니다. 팝업과 연결 상태를 확인하세요.'); } };
window.logoutFirebase=async function(){ try { await signOut(auth); } catch (_) { status('로그아웃에 실패했습니다. 로그인 상태를 확인하세요.'); } };
onAuthStateChanged(auth, async user=>{
  authReady = true;
  const nextName=user?(user.displayName||user.email||user.uid):'default';
  if(user&&lastProfileUid&&lastProfileUid!==user.uid&&(window.P0Production?.getState().dirty||lastProfileName===nextName)) blockedProfileTransfer=true;
  if(user){lastProfileUid=user.uid;lastProfileName=nextName;}
  const saved=getCurrentTeamName(); authEpoch++; stopListener(); activeTeam=null;
  window.currentUser=nextName; safeSetStorage(TEAM_STORAGE_KEYS.currentUser,window.currentUser);
  if ($('currentUserDisplay')) $('currentUserDisplay').textContent=window.currentUser;
  $('loginBtn')?.classList.toggle('hidden',!!user); $('logoutBtn')?.classList.toggle('hidden',!user);
  if (window.P0Production) window.P0Production.accountChanged();
  window.dispatchEvent(new CustomEvent('cupping:auth-ready'));
  clearTeamAccess(user?'로그인 계정의 팀 권한을 다시 확인합니다.':'로그아웃했습니다. 이 기기 평가 기록은 유지됩니다.'); refreshPending();
  if(blockedProfileTransfer){status('로그인 계정 전환 중 이전 평가를 보호하고 있습니다. JSON으로 보관한 뒤 계정별 자료를 확인하세요. 팀 전송은 중단했습니다.');return;}
  if (!user || !saved) return;
  const s=session();try { await activateTeam(saved,s,false,true); } catch(e){ failure(e,'기존 팀을 열지 못했습니다. 이름을 입력해 접근 또는 가입 상태를 확인하세요.',s); }
});
window.createTeam=async raw=>guarded(async()=>{
  const s=session(),name=normalizeTeamName(raw); if(!s||!name)return;
  try { const rows=prepareTransition(); const ref=doc(db,'teams',name); await runTransaction(db,async tx=>{
    assertCurrent(s);const snap=await tx.get(ref);assertCurrent(s);if(snap.exists())throw Error('team-name-taken');
    tx.set(ref,{owner:s.uid,members:[{uid:s.uid,name:displayName()}],memberUids:[s.uid],memberSamples:{[s.uid]:rows},updatedAt:Date.now()});
  }); assertCurrent(s);await activateTeam(name,s,false);status('팀을 만들었습니다. 새 회원은 가입 요청을 팀장이 승인해야 접근할 수 있습니다.'); }
  catch(e){ if(current(s))status(e?.code==='permission-denied'||e.message==='team-name-taken'?'이 이름으로 팀을 만들 수 없습니다. 기존 팀을 덮어쓰지 않았습니다. 다른 이름 또는 가입 요청을 사용하세요.':'팀 생성에 실패했습니다. 평가 기록은 유지됩니다. 연결 상태를 확인하세요.'); }
});
window.joinTeam=async raw=>guarded(async()=>{
  const s=session(),name=normalizeTeamName(raw);if(!s||!name)return;
  try {
    let snap;try{snap=await getDoc(doc(db,'teams',name));}catch(e){if(e.code!=='permission-denied')throw e;}
    assertCurrent(s);
    if(snap?.exists()&&member(snap.data(),s.uid)){await activateTeam(name,s,true);return;}
    if(snap&&!snap.exists()){status('해당 팀을 찾지 못했습니다. 팀 이름을 확인하세요.');return;}
    const ref=doc(db,'teams',name,'joinRequests',s.uid);
    await runTransaction(db,async tx=>{assertCurrent(s);const prior=await tx.get(ref);assertCurrent(s);if(!prior.exists())tx.set(ref,{uid:s.uid,name:displayName(),createdAt:serverTimestamp()});});
    assertCurrent(s);safeSetStorage(pendingKey(s.uid),name);refreshPending();status('가입 요청을 보냈습니다. 팀장 승인 전에는 팀 자료를 열거나 변경할 수 없습니다.');
  }catch(e){failure(e,'가입 요청에 실패했습니다. 팀 이름과 연결 상태를 확인하세요. 기존 평가 자료는 유지됩니다.',s);}
});
window.checkTeamApproval=async()=>guarded(async()=>{
  const s=session();if(!s)return;const name=safeGetStorage(pendingKey(s.uid),'');if(!name)return;
  try{await activateTeam(name,s,true);}
  catch(e){if(!current(s))return; if(e.code==='permission-denied'||e.message==='membership-required'){
    try{const request=await getDoc(doc(db,'teams',name,'joinRequests',s.uid));assertCurrent(s);if(request.exists())status('아직 팀장 승인을 기다리고 있습니다.');else{safeRemoveStorage(pendingKey(s.uid));refreshPending();status('요청이 종료됐지만 팀 접근은 승인되지 않았습니다. 필요하면 팀장에게 확인 후 다시 요청하세요.');}}catch(_){status('가입 상태를 확인하지 못했습니다. 연결 후 다시 확인하세요.');}
  }else failure(e,'가입 상태를 확인하지 못했습니다. 이 기기 자료는 유지됩니다.',s);}
});
window.cancelTeamRequest=async()=>{
 const s=session();if(!s)return;const name=safeGetStorage(pendingKey(s.uid),'');if(!name)return;
 try{await deleteDoc(doc(db,'teams',name,'joinRequests',s.uid));assertCurrent(s);safeRemoveStorage(pendingKey(s.uid));refreshPending();status('가입 요청을 취소했습니다.');}catch(e){failure(e,'요청 취소에 실패했습니다. 다시 상태를 확인하세요.',s);}
};
window.loadTeamInfoToModal=async function(){
  const s=session(),name=getCurrentTeamName();if(!s||!name)return;const list=$('teamMembersList'),requests=$('teamJoinRequests');list?.replaceChildren();requests?.replaceChildren();
  try{const snap=await getDoc(doc(db,'teams',name));assertCurrent(s);if(!snap.exists()||!member(snap.data(),s.uid)){clearTeamAccess('팀 접근 권한이 없습니다. 이 기기 자료는 유지됩니다.');return;}const data=snap.data();
    if(getCurrentTeamName()!==name)return;
    for(const m of data.members||[]){const li=document.createElement('li'),span=document.createElement('span');span.textContent=(m.name||m.uid)+(m.uid===data.owner?' (팀장)':'');li.appendChild(span);if(data.owner===s.uid&&m.uid!==data.owner){const button=document.createElement('button');button.textContent='접근 권한 회수';button.type='button';button.addEventListener('click',()=>removeMemberFromTeam(m.uid,name));li.appendChild(button);}list?.appendChild(li);}
    if($('teamOwnerOnly'))$('teamOwnerOnly').hidden=data.owner!==s.uid;
    if(data.owner!==s.uid){status('팀원 목록을 확인했습니다. 탈퇴는 팀장에게 접근 권한 회수를 요청하세요.');return;}
    const pending=await getDocs(collection(db,'teams',name,'joinRequests'));assertCurrent(s);if(getCurrentTeamName()!==name)return;
    pending.forEach(item=>{const request=item.data(),li=document.createElement('li'),label=document.createElement('span');label.textContent=request.name+' · 가입 요청';li.appendChild(label);for(const [text,approve]of [['승인',true],['거절',false]]){const button=document.createElement('button');button.type='button';button.textContent=text;button.addEventListener('click',()=>reviewTeamRequest(item.id,approve,name));li.appendChild(button);}requests?.appendChild(li);});
    if(pending.empty&&requests)requests.textContent='대기 중인 가입 요청이 없습니다.';
  }catch(e){failure(e,'팀 정보를 확인하지 못했습니다. 연결 후 다시 열어 주세요.',s);}
};
window.reviewTeamRequest=async function(uid,approve,expectedTeam){
 const s=session(),name=getCurrentTeamName();if(!s||!name)return;
 if(expectedTeam&&expectedTeam!==name){status('팀 선택이 바뀌었습니다. 현재 팀의 요청 목록을 다시 확인하세요.');return;}
 try{const teamRef=doc(db,'teams',name),requestRef=doc(db,'teams',name,'joinRequests',uid);await runTransaction(db,async tx=>{
   assertCurrent(s);const [teamSnap,requestSnap]=await Promise.all([tx.get(teamRef),tx.get(requestRef)]);assertCurrent(s);
   if(!teamSnap.exists()||teamSnap.data().owner!==s.uid)throw Error('owner-required');if(!requestSnap.exists())throw Error('request-ended');
   const before=teamSnap.data(),request=requestSnap.data();if(request.uid!==uid)throw Error('invalid-request');
   if(approve&&!member(before,uid)){if(before.memberUids.length>=100)throw Error('team-full');tx.update(teamRef,{members:[...before.members,{uid,name:request.name}],memberUids:[...before.memberUids,uid],memberSamples:{...before.memberSamples,[uid]:[]},updatedAt:Date.now()});}
   tx.delete(requestRef);
 });assertCurrent(s);status(approve?'가입을 승인했습니다. 신청자는 승인 상태를 확인한 뒤 본인 기록을 저장할 수 있습니다.':'가입 요청을 거절했습니다.');await loadTeamInfoToModal();}
 catch(e){failure(e,'요청 처리에 실패했습니다. 승인 상태를 다시 확인하세요. 다른 회원 기록은 변경하지 않았습니다.',s);}
};
window.removeMemberFromTeam=async function(uid,expectedTeam){
 const s=session(),name=getCurrentTeamName();if(!s||!name)return;if(uid===s.uid){status('팀장 본인의 권한은 회수할 수 없습니다.');return;}
 if(expectedTeam&&expectedTeam!==name){status('팀 선택이 바뀌었습니다. 현재 팀원 목록을 다시 확인하세요.');return;}
 if(!window.confirm('이 회원의 팀 접근 권한과 팀에 저장된 해당 회원 평가를 제거합니다. 필요한 기록을 먼저 보관했는지 확인하세요. 계속할까요?'))return;
 try{const ref=doc(db,'teams',name);await runTransaction(db,async tx=>{assertCurrent(s);const snap=await tx.get(ref);assertCurrent(s);if(!snap.exists()||snap.data().owner!==s.uid)throw Error('owner-required');const before=snap.data();if(!member(before,uid))throw Error('not-member');const nextSamples={...before.memberSamples};delete nextSamples[uid];tx.update(ref,{members:before.members.filter(m=>m.uid!==uid),memberUids:before.memberUids.filter(x=>x!==uid),memberSamples:nextSamples,updatedAt:Date.now()});});assertCurrent(s);status('팀 접근 권한을 회수했습니다. 해당 회원의 기기 안 기록은 변경하지 않았습니다.');await loadTeamInfoToModal();}
 catch(e){failure(e,'권한 회수에 실패했습니다. 회원이 남아 있을 수 있으므로 목록을 다시 확인하세요.',s);}
};
window.syncSamplesToTeam=async function(samples){
 const s=session(true),target=activeTeam;if(!s||!target||target.uid!==s.uid||target.epoch!==s.epoch)return{status:'not-configured'};
 try{await updateDoc(doc(db,'teams',target.name),new FieldPath('memberSamples',s.uid),samples,'updatedAt',Date.now());return{status:'saved'};}
 catch(e){failure(e,'팀 동기화에 실패했습니다. 이 기기 저장은 유지됩니다.',s);return{status:'failed'};}
};
window.startTeamSamplesListener=function(){
 const s=session(true),target=activeTeam;stopListener();if(!s||!target||target.uid!==s.uid)return;
 window._teamSamplesUnsub=onSnapshot(doc(db,'teams',target.name),snap=>{
   if(!current(s)||activeTeam?.name!==target.name)return;
   if(!snap.exists()||!member(snap.data(),s.uid)){clearTeamAccess('팀 권한이 회수되었습니다. 이 기기 평가 기록은 유지됩니다.');return;}
   acceptSamples(snap.data(),s);
 },e=>{if(activeTeam?.name===target.name)failure(e,'팀 자료 수신에 실패했습니다. 이 기기 평가 기록은 유지됩니다.',s);});
};
window.showTeamReport=async function(){
 const s=session(),name=getCurrentTeamName();if(!s||!name)return;
 try{const snap=await getDoc(doc(db,'teams',name));assertCurrent(s);if(!snap.exists()||!member(snap.data(),s.uid))throw Error('membership-required');const data=snap.data(),body=$('teamReportBody'),modal=$('teamReportModal');if(!body||!modal)return;body.replaceChildren();
 for(const m of data.members||[]){const wrapper=document.createElement('div'),heading=document.createElement('h4');heading.textContent=m.name||m.uid;wrapper.appendChild(heading);for(const sample of data.memberSamples?.[m.uid]||[]){const div=document.createElement('div'),title=document.createElement('div');title.textContent=sample.title||'제목 없는 샘플';div.appendChild(title);div.insertAdjacentHTML('beforeend',buildFlavorSummaryHtml(sample.sampleData));wrapper.appendChild(div);}body.appendChild(wrapper);}modal.classList.add('show');}
 catch(e){failure(e,'팀 결과를 읽지 못했습니다. 접근 권한과 연결 상태를 확인하세요.',s);}
};
document.addEventListener('DOMContentLoaded',()=>{updateTeamHeader();refreshPending();$('checkTeamApprovalBtn')?.addEventListener('click',checkTeamApproval);$('cancelTeamRequestBtn')?.addEventListener('click',cancelTeamRequest);});
