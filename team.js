import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, setDoc, updateDoc, arrayUnion, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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
    alert('로그인에 실패했습니다');
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
    members: [{ uid: auth.currentUser.uid, name: window.currentUser }]
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
  await updateDoc(teamRef, { members: arrayUnion({ uid: auth.currentUser.uid, name: window.currentUser }) });
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
      li.textContent = m.name || m.uid;
      listEl.appendChild(li);
    });
  }
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
      if (data.samples) {
        const key = `mollis_sca_samples2_${window.currentUser || 'default'}`;
        const localStr = JSON.stringify(data.samples);
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
  if (!teamName) return;
  try {
    const teamRef = doc(db, 'teams', teamName);
    await updateDoc(teamRef, { samples, updatedAt: Date.now() });
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
      if (data.samples) {
        const key = `mollis_sca_samples2_${window.currentUser || 'default'}`;
        const newStr = JSON.stringify(data.samples);
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

document.addEventListener('DOMContentLoaded', () => {
  updateTeamHeader();
  fetchTeamSamples().then(startTeamSamplesListener);
});
