// Extra features: undo, login, service worker registration
let undoStack = [];
window.currentUser = localStorage.getItem('mollis_sca_current_user') || 'default';
let deferredPrompt;

function pushUndoState() {
  if (window.samples) {
    undoStack.push({ samples: JSON.stringify(window.samples), currentSampleId: window.currentSampleId });
    if (undoStack.length > 20) undoStack.shift();
  }
}

function undoLastAction() {
  if (!undoStack.length) {
    alert('실행 취소할 내용이 없습니다.');
    return;
  }
  const state = undoStack.pop();
  localStorage.setItem(`mollis_sca_samples2_${window.currentUser}`, state.samples);
  location.reload();
}

function loginUser() {
  if (typeof firebaseLogin === 'function') {
    firebaseLogin();
    return;
  }
  const name = prompt('사용자 이름을 입력하세요', window.currentUser);
  if (!name) return;
  window.currentUser = name.trim();
  localStorage.setItem('mollis_sca_current_user', window.currentUser);
  location.reload();
}

function logoutUser() {
  if (typeof logoutFirebase === 'function') {
    logoutFirebase();
    return;
  }

  if (confirm('로그아웃하시겠습니까?')) {
    window.currentUser = 'default';
    localStorage.setItem('mollis_sca_current_user', window.currentUser);
    localStorage.removeItem('mollis_sca_current_team');
    location.reload();
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(e => console.error('SW registration failed:', e));
  });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const installBtn = document.getElementById('installBtn');
  if (installBtn) installBtn.classList.remove('hidden');
});


document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const installBtn = document.getElementById('installBtn');
  const display = document.getElementById('currentUserDisplay');
  if (display) display.textContent = window.currentUser;
  if (loginBtn) {
    loginBtn.addEventListener('click', loginUser);
    if (window.currentUser !== 'default') {
      loginBtn.classList.add('hidden');
    }
  }
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logoutUser);
    if (window.currentUser !== 'default') {
      logoutBtn.classList.remove('hidden');
    }
  }
  if (installBtn) {
    const hideInstall = () => installBtn.classList.add('hidden');
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      hideInstall();
    }
    installBtn.addEventListener('click', () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => {
          deferredPrompt = null;
          hideInstall();
        });
      }
    });
  }
  const undoBtn = document.getElementById('undoBtn');
  if (undoBtn) undoBtn.addEventListener('click', undoLastAction);
  const addBtn = document.getElementById('addSampleBtn');
  if (addBtn) addBtn.addEventListener('click', pushUndoState);
  const removeBtn = document.getElementById('removeSampleBtn');
  if (removeBtn) removeBtn.addEventListener('click', pushUndoState);
  const cloneBtn = document.getElementById('cloneSampleBtn');
  if (cloneBtn) cloneBtn.addEventListener('click', pushUndoState);
});
