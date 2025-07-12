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

window.firebaseLogin = async function() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    window.currentUser = result.user.displayName || result.user.email;
    document.getElementById('currentUserDisplay').textContent = window.currentUser;
    localStorage.setItem('mollis_sca_current_user', window.currentUser);
    document.getElementById('logoutBtn').classList.remove('hidden');
    document.getElementById('loginBtn').classList.add('hidden');
  } catch (err) {
    console.error(err);
  }
};

window.logoutFirebase = async function() {
  await signOut(auth);
  window.currentUser = 'default';
  localStorage.setItem('mollis_sca_current_user', window.currentUser);
  localStorage.removeItem('mollis_sca_current_team');
  if (window._teamSamplesUnsub) window._teamSamplesUnsub();
  location.reload();
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

window.createTeam = async function(teamName) {
  if (!auth.currentUser) {
    alert('먼저 로그인하세요');
    return;
  }
  const teamRef = doc(db, 'teams', teamName);
  await setDoc(teamRef, {
    owner: auth.currentUser.uid,
    members: [{ uid: auth.currentUser.uid, name: window.currentUser }],
    memberSamples: { [auth.currentUser.uid]: window.samples || [] }
  }, { merge: true });
  localStorage.setItem('mollis_sca_current_team', teamName);
  updateTeamHeader();
  await syncSamplesToTeam(window.samples || []);
  fetchTeamSamples().then(startTeamSamplesListener);
  alert('팀이 생성되었습니다');
};

window.joinTeam = async function(teamName) {
  if (!auth.currentUser) {
    alert('먼저 로그인하세요');
    return;
  }
  const teamRef = doc(db, 'teams', teamName);
  const snap = await getDoc(teamRef);
  if (!snap.exists()) {
    alert('팀이 존재하지 않습니다');
    return;
  }
  await updateDoc(teamRef, {
    members: arrayUnion({ uid: auth.currentUser.uid, name: window.currentUser }),
    [`memberSamples.${auth.currentUser.uid}`]: window.samples || []
  });
  localStorage.setItem('mollis_sca_current_team', teamName);
  updateTeamHeader();
  await fetchTeamSamples();
  startTeamSamplesListener();
  alert('팀에 가입했습니다');
};

window.loadTeamInfoToModal = async function() {
  const teamName = localStorage.getItem('mollis_sca_current_team');
  const nameEl = document.getElementById('currentTeamDisplay');
  const listEl = document.getElementById('teamMembersList');
  if (nameEl) nameEl.textContent = teamName || '없음';
  if (!teamName || !listEl) return;
  listEl.innerHTML = '';
  const snap = await getDoc(doc(db, 'teams', teamName));
  if (snap.exists()) {
    const data = snap.data();
    (data.members || []).forEach(m => {
      const li = document.createElement('li');
      li.className = 'flex justify-between items-center';
      const span = document.createElement('span');
      span.textContent = m.name || m.uid;
      li.appendChild(span);
      if (data.owner === auth.currentUser.uid && m.uid !== data.owner) {
        const btn = document.createElement('button');
        btn.textContent = '탈퇴';
        btn.className = 'text-red-600 text-xs border px-1 rounded';
        btn.addEventListener('click', () => removeMemberFromTeam(m.uid));
        li.appendChild(btn);
      }
      listEl.appendChild(li);
    });
  }
};

window.removeMemberFromTeam = async function(memberUid) {
  const teamName = localStorage.getItem('mollis_sca_current_team');
  if (!teamName) return;
  const teamRef = doc(db, 'teams', teamName);
  const snap = await getDoc(teamRef);
  if (!snap.exists()) return;
  const data = snap.data();
  if (data.owner !== auth.currentUser.uid) {
    alert('팀장만 팀원을 탈퇴시킬 수 있습니다');
    return;
  }
  const newMembers = (data.members || []).filter(m => m.uid !== memberUid);
  const updateObj = { members: newMembers };
  updateObj[`memberSamples.${memberUid}`] = deleteField();
  await updateDoc(teamRef, updateObj);
  loadTeamInfoToModal();
  alert('팀원이 탈퇴되었습니다');
};

function updateTeamHeader() {
  const headerEl = document.getElementById('currentTeamHeader');
  if (headerEl) {
    const name = localStorage.getItem('mollis_sca_current_team');
    headerEl.textContent = name ? `팀: ${name}` : '';
  }
}

// === Team sample sync functions ===

async function fetchTeamSamples() {
  const teamName = localStorage.getItem('mollis_sca_current_team');
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
        const key = `mollis_sca_samples2_${window.currentUser || 'default'}`;
        const localStr = JSON.stringify(samplesData);
        localStorage.setItem(key, localStr);
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
  const teamName = localStorage.getItem('mollis_sca_current_team');
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
  const teamName = localStorage.getItem('mollis_sca_current_team');
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
        const key = `mollis_sca_samples2_${window.currentUser || 'default'}`;
        const newStr = JSON.stringify(samplesData);
        if (localStorage.getItem(key) !== newStr) {
          localStorage.setItem(key, newStr);
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
  const teamName = localStorage.getItem('mollis_sca_current_team');
  if (!teamName) return;
  const snap = await getDoc(doc(db, 'teams', teamName));
  if (!snap.exists()) return;
  const data = snap.data();
  const bodyEl = document.getElementById('teamReportBody');
  if (!bodyEl) return;
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
      title.textContent = sample.title;
      div.appendChild(title);
      const summary = buildFlavorSummaryHtml(sample.sampleData);
      div.insertAdjacentHTML('beforeend', summary);
      wrapper.appendChild(div);
    });
    bodyEl.appendChild(wrapper);
  });
  document.getElementById('teamReportModal').classList.add('show');
};

document.addEventListener('DOMContentLoaded', () => {
  updateTeamHeader();
  fetchTeamSamples().then(startTeamSamplesListener);
});
