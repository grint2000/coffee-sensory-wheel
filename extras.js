function notifyMessage(msg) {
  if (typeof window.showToast === 'function') {
    window.showToast(msg);
  } else {
    alert(msg);
  }
}

function safeStorageGet(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch (e) {
    return fallback;
  }
}

function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    return false;
  }
}

function safeStorageRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {}
}

function migrateLegacyUserKey() {
  const current = safeStorageGet('noel_sca_current_user');
  if (current) return current;
  const legacy = safeStorageGet('mollis_current_user');
  if (legacy) {
    safeStorageSet('noel_sca_current_user', legacy);
    safeStorageRemove('mollis_current_user');
    return legacy;
  }
  return 'default';
}

// Extra features: undo, login, service worker registration
let undoStack = [];
window.currentUser = migrateLegacyUserKey();
let deferredPrompt;

function pushUndoState() {
  if (window.samples) {
    undoStack.push({ samples: JSON.stringify(window.samples), currentSampleId: window.currentSampleId });
    if (undoStack.length > 20) undoStack.shift();
  }
}

function undoLastAction() {
  if (!undoStack.length) {
    notifyMessage('실행 취소할 내용이 없습니다.');
    return;
  }
  const state = undoStack.pop();
  if (!safeStorageSet(`noel_sca_samples2_${window.currentUser}`, state.samples)) {
    notifyMessage('저장소 접근에 실패했습니다. 저장 공간을 확인해 주세요.');
    return;
  }
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
  safeStorageSet('noel_sca_current_user', window.currentUser);
  location.reload();
}

function logoutUser() {
  if (typeof logoutFirebase === 'function') {
    logoutFirebase();
    return;
  }

  if (confirm('로그아웃하시겠습니까?')) {
    window.currentUser = 'default';
    safeStorageSet('noel_sca_current_user', window.currentUser);
    safeStorageRemove('noel_sca_current_team');
    location.reload();
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const installBtn = document.getElementById('installBtn');
  if (installBtn) installBtn.classList.remove('hidden');
});

document.addEventListener('DOMContentLoaded', () => {
  const dom = {
    loginBtn: document.getElementById('loginBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    installBtn: document.getElementById('installBtn'),
    display: document.getElementById('currentUserDisplay'),
    undoBtn: document.getElementById('undoBtn'),
    addBtn: document.getElementById('addSampleBtn'),
    removeBtn: document.getElementById('removeSampleBtn'),
    cloneBtn: document.getElementById('cloneSampleBtn')
  };

  if (dom.display) dom.display.textContent = window.currentUser;
  if (dom.loginBtn) {
    dom.loginBtn.addEventListener('click', loginUser);
    if (window.currentUser !== 'default') dom.loginBtn.classList.add('hidden');
  }
  if (dom.logoutBtn) {
    dom.logoutBtn.addEventListener('click', logoutUser);
    if (window.currentUser !== 'default') dom.logoutBtn.classList.remove('hidden');
  }
  if (dom.installBtn) {
    const hideInstall = () => dom.installBtn.classList.add('hidden');
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) hideInstall();
    dom.installBtn.addEventListener('click', () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        deferredPrompt = null;
        hideInstall();
      });
    });
  }

  if (dom.undoBtn) dom.undoBtn.addEventListener('click', undoLastAction);
  if (dom.addBtn) dom.addBtn.addEventListener('click', pushUndoState);
  if (dom.removeBtn) dom.removeBtn.addEventListener('click', pushUndoState);
  if (dom.cloneBtn) dom.cloneBtn.addEventListener('click', pushUndoState);
});
