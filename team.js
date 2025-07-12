import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, setDoc, updateDoc, arrayUnion, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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
  }
});

window.createTeam = async function(teamName) {
  if (!auth.currentUser) {
    alert('먼저 로그인하세요');
    return;
  }
  const teamRef = doc(db, 'teams', teamName);
  await setDoc(teamRef, { owner: auth.currentUser.uid, members: [auth.currentUser.uid] }, { merge: true });
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
  await updateDoc(teamRef, { members: arrayUnion(auth.currentUser.uid) });
  alert('팀에 가입했습니다');
};
