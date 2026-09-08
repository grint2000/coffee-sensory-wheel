function notifyMessage(msg) {
  if (typeof window.showToast === 'function') {
    window.showToast(msg);
  } else {
    alert(msg);
  }
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, setDoc, updateDoc, arrayUnion, getDoc, onSnapshot, deleteField, runTransaction } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD-rwtilsBrdQ9JDJYFwXb57ebD6DsSqGg",
  authDomain: "coffee-sensory-app.firebaseapp.com",
  projectId: "coffee-sensory-app",
  storageBucket: "coffee-sensory-app.firebasestorage.app",
  messagingSenderId: "201184721721",
  appId: "1:201184721721:web:9dbf49df9d399a5ef0c6e8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const TEAM_STORAGE_KEYS = {
  currentUser: 'noel_sca_current_user',
  currentTeam: 'noel_sca_current_team'
};

const TEAM_NAME_REGEX = /^[0-9A-Za-z가-힣_-]{2,40}$/;

function safeGetStorage(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch (_) {
    return fallback;
  }
}

function safeSetStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (_) {
    notifyMessage('로컬 저장소 저장에 실패했습니다. 브라우저 설정을 확인해 주세요.');
    return false;
  }
}

function safeRemoveStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (_) {
    notifyMessage('로컬 저장소 정리에 실패했습니다.');
  }
}

function teamKey() { return TEAM_STORAGE_KEYS.currentTeam+'_'+(auth.currentUser?.uid || 'guest'); }
function getCurrentTeamName() { return auth.currentUser ? safeGetStorage(teamKey(),'') : ''; }
let authReady=false;
let generation=0;
function context() {
  if (!authReady || !auth.currentUser || window.currentUser !== 'firebase_'+auth.currentUser.uid)
    throw new Error('로그인 상태와 기기 기록을 먼저 확인해 주세요.');
  return {uid:auth.currentUser.uid,team:getCurrentTeamName(),generation};
}
function assertContext(c) {
  const now=context();
  if (now.uid!==c.uid || now.team!==c.team || now.generation!==c.generation)
    throw new Error('사용자 또는 팀이 변경되어 작업을 중단했습니다.');
}
function cloudStatus(message) {
  let el=document.getElementById('teamSyncStatus');
  if (!el) { el=document.createElement('p'); el.id='teamSyncStatus'; el.setAttribute('role','status');
    document.getElementById('currentTeamHeader')?.parentElement.appendChild(el); }
  el.textContent=message;
}
function stopListener() { generation++; if(window._teamSamplesUnsub) window._teamSamplesUnsub(); window._teamSamplesUnsub=null; }
function member(data,uid) { return Array.isArray(data.members) && data.members.some(m=>m.uid===uid); }
function fail(err) { console.error(err); cloudStatus('팀 작업 실패 · 기기 기록은 유지됩니다.'); notifyMessage(err.message || '팀 작업에 실패했습니다.'); }

function normalizeTeamName(rawName) {
  const teamName = (rawName || '').trim();
  if (!TEAM_NAME_REGEX.test(teamName)) {
    notifyMessage('팀 이름은 2~40자의 한글/영문/숫자/밑줄/하이픈만 사용할 수 있습니다.');
    return '';
  }
  return teamName;
}

window.firebaseLogin = async function() {
  try { await signInWithPopup(auth,new GoogleAuthProvider()); } catch(err) { fail(err); }
};
window.logoutFirebase = async function() {
  try {
    // Save the old profile before changing Firebase identity.
    window.getTeamShareSamples();
    await signOut(auth);
  } catch(err) { fail(err); }
};
onAuthStateChanged(auth, async user => {
  stopListener(); authReady=false;
  if(document.readyState==='loading') await new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true}));
  if(auth.currentUser !== user) return;
  const key=user ? 'firebase_'+user.uid : 'default';
  if (!window.activateLocalUser(key)) {
    cloudStatus('사용자 기록을 전환하지 못했습니다. JSON 내보내기로 보관한 뒤 다시 시도해 주세요.'); return;
  }
  authReady=!!user;
  const display=document.getElementById('currentUserDisplay');
  if(display) display.textContent=user ? (user.displayName || user.email || '로그인 사용자') : 'default';
  document.getElementById('loginBtn')?.classList.toggle('hidden',!!user);
  document.getElementById('logoutBtn')?.classList.toggle('hidden',!user);
  updateTeamHeader();
  if(user) startTeamSamplesListener();
});
window.createTeam = async function(rawName) {
  try {
    const c=context(), name=normalizeTeamName(rawName); if(!name) return;
    await runTransaction(db,async tx=>{
      const ref=doc(db,'teams',name), snap=await tx.get(ref); assertContext(c);
      if(snap.exists()) throw new Error('이미 존재하는 팀입니다. 팀 가입을 이용하세요.');
      tx.set(ref,{owner:c.uid,members:[{uid:c.uid,name:auth.currentUser.displayName || '사용자'}],memberSamples:{}});
    });
    assertContext(c); if(!safeSetStorage(teamKey(),name)) return;
    stopListener(); updateTeamHeader(); startTeamSamplesListener(); notifyMessage('팀 생성 완료 · 현재 세션 공유 버튼으로 기록을 올려 주세요.');
  } catch(err) { fail(err); }
};
window.joinTeam = async function(rawName) {
  try {
    const c=context(), name=normalizeTeamName(rawName); if(!name) return;
    await runTransaction(db,async tx=>{
      const ref=doc(db,'teams',name),snap=await tx.get(ref); assertContext(c);
      if(!snap.exists()) throw new Error('팀이 존재하지 않습니다.');
      const data=snap.data();
      if(!member(data,c.uid)) tx.update(ref,{members:arrayUnion({uid:c.uid,name:auth.currentUser.displayName || '사용자'})});
    });
    assertContext(c); if(!safeSetStorage(teamKey(),name)) return;
    stopListener(); updateTeamHeader(); startTeamSamplesListener(); notifyMessage('팀 가입 완료 · 기존 팀 기록은 유지됩니다.');
  } catch(err) { fail(err); }
};

window.loadTeamInfoToModal = async function() {
  try {
  const c=context();
  const teamName = getCurrentTeamName();
  const nameEl = document.getElementById('currentTeamDisplay');
  const listEl = document.getElementById('teamMembersList');
  if (nameEl) nameEl.textContent = teamName || '없음';
  if (!teamName || !listEl) return;
  listEl.innerHTML = '';

  const snap = await getDoc(doc(db, 'teams', teamName));
  assertContext(c);
  if (!snap.exists() || !member(snap.data(),c.uid)) return;

  const data = snap.data();
  (data.members || []).forEach(m => {
    const li = document.createElement('li');
    li.className = 'flex justify-between items-center';

    const span = document.createElement('span');
    span.textContent = m.name || m.uid;
    li.appendChild(span);

    if (auth.currentUser && data.owner === auth.currentUser.uid && m.uid !== data.owner) {
      const btn = document.createElement('button');
      btn.textContent = '탈퇴';
      btn.className = 'text-red-600 text-xs border px-1 rounded';
      btn.addEventListener('click', () => removeMemberFromTeam(m.uid));
      li.appendChild(btn);
    }
    listEl.appendChild(li);
  });
  } catch(err) { fail(err); }
};

window.removeMemberFromTeam = async function(memberUid) {
  try {
    const c=context(); if(!c.team) return;
    if(!confirm('이 팀원을 탈퇴시키고 해당 팀 공유 기록을 삭제할까요?')) return;
    await runTransaction(db,async tx=>{
      const ref=doc(db,'teams',c.team),snap=await tx.get(ref); assertContext(c);
      if(!snap.exists() || snap.data().owner!==c.uid || memberUid===c.uid)
        throw new Error('팀장만 다른 팀원을 탈퇴시킬 수 있습니다.');
      const data=snap.data();
      tx.update(ref,{members:(data.members || []).filter(m=>m.uid!==memberUid),['memberSamples.'+memberUid]:deleteField()});
    });
    assertContext(c); await window.loadTeamInfoToModal(); notifyMessage('팀원이 탈퇴되었습니다.');
  } catch(err) { fail(err); }
};

function updateTeamHeader() {
  const headerEl = document.getElementById('currentTeamHeader');
  if (headerEl) {
    const name = getCurrentTeamName();
    headerEl.textContent = name ? `팀: ${name}` : '';
  }
}

// Local autosaves never publish or replace a remote session implicitly.
window.syncSamplesToTeam = async function() {};
window.publishTeamSamples = async function() {
  try {
    const c=context(); if(!c.team) throw new Error('먼저 팀을 선택하세요.');
    const payload=window.getTeamShareSamples();
    const ref=doc(db,'teams',c.team), before=await getDoc(ref); assertContext(c);
    if(!before.exists() || !member(before.data(),c.uid)) throw new Error('팀 가입 상태를 확인하세요.');
    const previous=JSON.stringify(before.data().memberSamples?.[c.uid] ?? null);
    if(!confirm('현재 세션의 샘플 '+payload.length+'개를 팀에 공유합니다. 기존에 공유한 내 샘플을 교체할까요?')) return;
    cloudStatus('팀에 저장 중…');
    await runTransaction(db,async tx=>{
      const snap=await tx.get(ref); assertContext(c);
      if(!snap.exists() || !member(snap.data(),c.uid)) throw new Error('팀 가입 상태가 변경되었습니다.');
      if(JSON.stringify(snap.data().memberSamples?.[c.uid] ?? null)!==previous)
        throw new Error('다른 기기에서 팀 기록이 변경되었습니다. 먼저 불러와 확인해 주세요.');
      tx.update(ref,{['memberSamples.'+c.uid]:payload,updatedAt:Date.now()});
    });
    assertContext(c); cloudStatus('팀 저장 완료 · 이후 수정은 다시 공유해 주세요.');
  } catch(err) { fail(err); }
};
window.fetchTeamSamples = async function() {
  try {
    const c=context(); if(!c.team) throw new Error('먼저 팀을 선택하세요.');
    const snap=await getDoc(doc(db,'teams',c.team)); assertContext(c);
    if(!snap.exists() || !member(snap.data(),c.uid)) throw new Error('팀 가입 상태를 확인하세요.');
    const value=snap.data().memberSamples?.[c.uid];
    if(!Array.isArray(value) || !value.length) throw new Error('내가 공유한 팀 기록이 없습니다.');
    if(!confirm('내 팀 기록을 새로운 세션으로 불러올까요? 기존 세션은 유지됩니다.')) return;
    assertContext(c);
    if(!window.importTeamSamples(value,c.team)) throw new Error('기기 저장 실패로 불러오기를 중단했습니다.');
    cloudStatus('내 팀 기록을 새 세션으로 불러왔습니다.');
  } catch(err) { fail(err); }
};
window.startTeamSamplesListener = function() {
  if(window._teamSamplesUnsub) window._teamSamplesUnsub();
  if(!authReady || !getCurrentTeamName()) return;
  const c=context();
  window._teamSamplesUnsub=onSnapshot(doc(db,'teams',c.team),snap=>{
    try { assertContext(c); } catch(_) { return; }
    if(!snap.exists() || !member(snap.data(),c.uid)) {
      stopListener(); cloudStatus('팀 접근 권한이 없습니다. 가입 상태를 확인하세요.'); return;
    }
    cloudStatus('팀 연결됨 · 현재 세션을 공유하거나 내 팀 기록을 불러올 수 있습니다.');
  },err=>{ try { assertContext(c); fail(err); } catch(_) {} });
};

window.showTeamReport = async function() {
  try {
  const c=context();
  const teamName = getCurrentTeamName();
  if (!teamName) return;

  const snap = await getDoc(doc(db, 'teams', teamName));
  assertContext(c);
  if (!snap.exists() || !member(snap.data(),c.uid)) return;

  const data = snap.data();
  const bodyEl = document.getElementById('teamReportBody');
  const reportModal = document.getElementById('teamReportModal');
  if (!bodyEl || !reportModal) return;

  bodyEl.innerHTML = '';
  (data.members || []).forEach(m => {
    const memberSamples = (data.memberSamples && data.memberSamples[m.uid]) || [];
    const wrapper = document.createElement('div');
    wrapper.className = 'mb-4';

    const nameEl = document.createElement('h4');
    nameEl.className = 'font-semibold';
    nameEl.textContent = m.name || m.uid;
    wrapper.appendChild(nameEl);

    (Array.isArray(memberSamples) ? memberSamples : []).filter(sample=>sample && sample.sampleData && typeof sample.sampleData==='object').forEach(sample => {
      const div = document.createElement('div');
      div.className = 'border rounded p-2 my-2';

      const title = document.createElement('div');
      title.className = 'font-medium mb-1';
      title.textContent = sample.title || '제목 없는 샘플';
      div.appendChild(title);

      const score = document.createElement('p');
      score.className = 'font-semibold my-1';
      score.textContent = '기록 총점: ' + (window.NOEL_WORKFLOW_API?.score(sample.sampleData) || '계산 불가');
      div.appendChild(score);
      if (sample.sampleData.tastingNotes) {
        const memo = document.createElement('p');
        memo.className = 'text-sm whitespace-pre-wrap my-2';
        memo.textContent = String(sample.sampleData.tastingNotes);
        div.appendChild(memo);
      }
      const summary = buildFlavorSummaryHtml(sample.sampleData);
      div.insertAdjacentHTML('beforeend', summary);
      wrapper.appendChild(div);
    });

    bodyEl.appendChild(wrapper);
  });

  reportModal.classList.add('show');
  } catch(err) { fail(err); }
};

document.addEventListener('DOMContentLoaded', () => {
  updateTeamHeader();
  const anchor=document.getElementById('currentTeamHeader');
  if(anchor) {
    for(const [label,action] of [['현재 세션 공유',()=>window.publishTeamSamples()],['내 팀 기록 불러오기',()=>window.fetchTeamSamples()]]) {
      const button=document.createElement('button'); button.type='button'; button.textContent=label;
      button.className='text-xs border rounded px-2 py-1 m-1'; button.addEventListener('click',action); anchor.parentElement.appendChild(button);
    }
  }
});
