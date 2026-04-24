function notifyMessage(msg) {
  if (typeof window.showToast === 'function') {
    window.showToast(msg);
  } else {
    alert(msg);
  }
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, setDoc, updateDoc, arrayUnion, getDoc, onSnapshot, deleteField } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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

function getCurrentTeamName() {
  const current = safeGetStorage(TEAM_STORAGE_KEYS.currentTeam);
  if (current) return current;
  return safeGetStorage('mollis_sca_current_team', '');
}

function normalizeTeamName(rawName) {
  const teamName = (rawName || '').trim();
  if (!TEAM_NAME_REGEX.test(teamName)) {
    notifyMessage('팀 이름은 2~40자의 한글/영문/숫자/밑줄/하이픈만 사용할 수 있습니다.');
    return '';
  }
  return teamName;
}

window.firebaseLogin = async function() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    window.currentUser = result.user.displayName || result.user.email;

    const display = document.getElementById('currentUserDisplay');
    if (display) display.textContent = window.currentUser;

    safeSetStorage(TEAM_STORAGE_KEYS.currentUser, window.currentUser);

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.classList.remove('hidden');

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.classList.add('hidden');
  } catch (err) {
    console.error(err);
    notifyMessage('Google 로그인에 실패했습니다. 팝업 차단 여부를 확인해 주세요.');
  }
};

window.logoutFirebase = async function() {
  try {
    await signOut(auth);
    window.currentUser = 'default';
    safeSetStorage(TEAM_STORAGE_KEYS.currentUser, window.currentUser);
    safeRemoveStorage(TEAM_STORAGE_KEYS.currentTeam);
    if (window._teamSamplesUnsub) window._teamSamplesUnsub();
    location.reload();
  } catch (err) {
    console.error(err);
    notifyMessage('로그아웃에 실패했습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.');
  }
};

onAuthStateChanged(auth, user => {
  if (user) {
    window.currentUser = user.displayName || user.email;
    const display = document.getElementById('currentUserDisplay');
    if (display) display.textContent = window.currentUser;
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    if (loginBtn) loginBtn.classList.add('hidden');
    if (logoutBtn) logoutBtn.classList.remove('hidden');
    fetchTeamSamples().then(startTeamSamplesListener);
  }
});

window.createTeam = async function(rawName) {
  if (!auth.currentUser) {
    notifyMessage('먼저 로그인하세요');
    return;
  }
  const teamName = normalizeTeamName(rawName);
  if (!teamName) return;

  const teamRef = doc(db, 'teams', teamName);
  await setDoc(teamRef, {
    owner: auth.currentUser.uid,
    members: [{ uid: auth.currentUser.uid, name: window.currentUser }],
    memberSamples: { [auth.currentUser.uid]: window.samples || [] }
  }, { merge: true });
  safeSetStorage(TEAM_STORAGE_KEYS.currentTeam, teamName);
  updateTeamHeader();
  await syncSamplesToTeam(window.samples || []);
  fetchTeamSamples().then(startTeamSamplesListener);
  notifyMessage('팀이 생성되었습니다');
};

window.joinTeam = async function(rawName) {
  if (!auth.currentUser) {
    notifyMessage('먼저 로그인하세요');
    return;
  }
  const teamName = normalizeTeamName(rawName);
  if (!teamName) return;

  const teamRef = doc(db, 'teams', teamName);
  const snap = await getDoc(teamRef);
  if (!snap.exists()) {
    notifyMessage('팀이 존재하지 않습니다');
    return;
  }
  await updateDoc(teamRef, {
    members: arrayUnion({ uid: auth.currentUser.uid, name: window.currentUser }),
    [`memberSamples.${auth.currentUser.uid}`]: window.samples || []
  });
  safeSetStorage(TEAM_STORAGE_KEYS.currentTeam, teamName);
  updateTeamHeader();
  await fetchTeamSamples();
  startTeamSamplesListener();
  notifyMessage('팀에 가입했습니다');
};

window.loadTeamInfoToModal = async function() {
  const teamName = getCurrentTeamName();
  const nameEl = document.getElementById('currentTeamDisplay');
  const listEl = document.getElementById('teamMembersList');
  if (nameEl) nameEl.textContent = teamName || '없음';
  if (!teamName || !listEl) return;
  listEl.innerHTML = '';

  const snap = await getDoc(doc(db, 'teams', teamName));
  if (!snap.exists()) return;

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
};

window.removeMemberFromTeam = async function(memberUid) {
  if (!auth.currentUser) {
    notifyMessage('로그인 후 이용해 주세요');
    return;
  }

  const teamName = getCurrentTeamName();
  if (!teamName) return;
  const teamRef = doc(db, 'teams', teamName);
  const snap = await getDoc(teamRef);
  if (!snap.exists()) return;

  const data = snap.data();
  if (data.owner !== auth.currentUser.uid) {
    notifyMessage('팀장만 팀원을 탈퇴시킬 수 있습니다');
    return;
  }

  const newMembers = (data.members || []).filter(m => m.uid !== memberUid);
  const updateObj = { members: newMembers };
  updateObj[`memberSamples.${memberUid}`] = deleteField();
  await updateDoc(teamRef, updateObj);
  loadTeamInfoToModal();
  notifyMessage('팀원이 탈퇴되었습니다');
};

function updateTeamHeader() {
  const headerEl = document.getElementById('currentTeamHeader');
  if (headerEl) {
    const name = getCurrentTeamName();
    headerEl.textContent = name ? `팀: ${name}` : '';
  }
}

// === Team sample sync functions ===

async function fetchTeamSamples() {
  const teamName = getCurrentTeamName();
  if (!teamName) return;
  try {
    const snap = await getDoc(doc(db, 'teams', teamName));
    if (snap.exists()) {
      const data = snap.data();
      const uid = auth.currentUser ? auth.currentUser.uid : null;
      let samplesData = null;
      if (uid && data.memberSamples && data.memberSamples[uid]) {
        samplesData = data.memberSamples[uid];
      } else if (data.samples) {
        samplesData = data.samples; // backward compatibility
      }
      if (samplesData) {
        const key = `noel_sca_samples2_${window.currentUser || 'default'}`;
        const localStr = JSON.stringify(samplesData);
        safeSetStorage(key, localStr);
        if (typeof loadSamplesFromStorage === 'function') {
          loadSamplesFromStorage();
          if (typeof renderSampleList === 'function') renderSampleList();
        }
      }
    }
  } catch (err) {
    console.error('팀 샘플 불러오기 실패', err);
  }
}

window.syncSamplesToTeam = async function(samples) {
  const teamName = getCurrentTeamName();
  if (!teamName || !auth.currentUser) return;
  try {
    const teamRef = doc(db, 'teams', teamName);
    const updateObj = {};
    updateObj[`memberSamples.${auth.currentUser.uid}`] = samples;
    updateObj.updatedAt = Date.now();
    await updateDoc(teamRef, updateObj);
  } catch (err) {
    console.error('팀 샘플 동기화 실패', err);
  }
};

window.startTeamSamplesListener = function() {
  const teamName = getCurrentTeamName();
  if (!teamName) return;
  const teamRef = doc(db, 'teams', teamName);
  if (window._teamSamplesUnsub) window._teamSamplesUnsub();
  window._teamSamplesUnsub = onSnapshot(teamRef, snap => {
    if (snap.exists()) {
      const data = snap.data();
      const uid = auth.currentUser ? auth.currentUser.uid : null;
      let samplesData = null;
      if (uid && data.memberSamples && data.memberSamples[uid]) {
        samplesData = data.memberSamples[uid];
      } else if (data.samples) {
        samplesData = data.samples; // backward compatibility
      }
      if (samplesData) {
        const key = `noel_sca_samples2_${window.currentUser || 'default'}`;
        const newStr = JSON.stringify(samplesData);
        if (safeGetStorage(key) !== newStr) {
          safeSetStorage(key, newStr);
          if (typeof loadSamplesFromStorage === 'function') {
            loadSamplesFromStorage();
            if (typeof renderSampleList === 'function') renderSampleList();
          } else {
            location.reload();
          }
        }
      }
    }
  });
};

window.showTeamReport = async function() {
  const teamName = getCurrentTeamName();
  if (!teamName) return;

  const snap = await getDoc(doc(db, 'teams', teamName));
  if (!snap.exists()) return;

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

    memberSamples.forEach(sample => {
      const div = document.createElement('div');
      div.className = 'border rounded p-2 my-2';

      const title = document.createElement('div');
      title.className = 'font-medium mb-1';
      title.textContent = sample.title || '제목 없는 샘플';
      div.appendChild(title);

      const summary = buildFlavorSummaryHtml(sample.sampleData);
      div.insertAdjacentHTML('beforeend', summary);
      wrapper.appendChild(div);
    });

    bodyEl.appendChild(wrapper);
  });

  reportModal.classList.add('show');
};

document.addEventListener('DOMContentLoaded', () => {
  updateTeamHeader();
  fetchTeamSamples().then(startTeamSamplesListener);
});
