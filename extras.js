function notifyMessage(msg) {
  if (typeof window.showToast === 'function') {
    window.showToast(msg);
  } else {
    alert(msg);
  }
}

const STORAGE_KEYS = {
  currentUser: 'noel_sca_current_user',
  currentTeam: 'noel_sca_current_team'
};

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
    notifyMessage('브라우저 저장소에 접근할 수 없어 일부 기능이 제한됩니다.');
    return false;
  }
}

function safeRemoveStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (_) {
    notifyMessage('브라우저 저장소 정리 중 오류가 발생했습니다.');
  }
}

function migrateLegacyCurrentUser() {
  const current = safeGetStorage(STORAGE_KEYS.currentUser);
  if (current) return current;

  const legacy = safeGetStorage('mollis_sca_current_user');
  if (legacy) {
    safeSetStorage(STORAGE_KEYS.currentUser, legacy);
    return legacy;
  }
  return 'default';
}

// Extra features: undo, login, service worker registration
let undoStack = [];
window.currentUser = migrateLegacyCurrentUser();
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
  safeSetStorage(`noel_sca_samples2_${window.currentUser}`, state.samples);
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
  if (!window.currentUser) return;
  safeSetStorage(STORAGE_KEYS.currentUser, window.currentUser);
  location.reload();
}

function logoutUser() {
  if (typeof logoutFirebase === 'function') {
    logoutFirebase();
    return;
  }

  if (confirm('로그아웃하시겠습니까?')) {
    window.currentUser = 'default';
    safeSetStorage(STORAGE_KEYS.currentUser, window.currentUser);
    safeRemoveStorage(STORAGE_KEYS.currentTeam);
    location.reload();
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {
      notifyMessage('오프라인 기능 등록에 실패했습니다. 네트워크 상태를 확인해 주세요.');
    });
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

  if (loginBtn && window.currentUser !== 'default') {
    loginBtn.classList.add('hidden');
  }
  if (logoutBtn && window.currentUser !== 'default') {
    logoutBtn.classList.remove('hidden');
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

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.id === 'loginBtn') {
      loginUser();
      return;
    }
    if (target.id === 'logoutBtn') {
      logoutUser();
      return;
    }
    if (target.id === 'undoBtn') {
      undoLastAction();
      return;
    }

    if (target.id === 'addSampleBtn' || target.id === 'removeSampleBtn' || target.id === 'cloneSampleBtn') {
      pushUndoState();
    }
  });
});
