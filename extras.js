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
  if (typeof window.getLocalCuppingState !== 'function') return;
  undoStack.push({user:window.currentUser,state:window.getLocalCuppingState()});
  if (undoStack.length > 20) undoStack.shift();
}

function undoLastAction() {
  if (!undoStack.length) { notifyMessage('실행 취소할 내용이 없습니다.'); return; }
  try {
    const entry=undoStack[undoStack.length-1];
    if(entry.user!==window.currentUser) { undoStack=[]; notifyMessage('계정이 변경되어 이전 실행 취소 기록을 비웠습니다.'); return; }
    if(!window.restoreLocalCuppingState(entry.state)) { notifyMessage('실행 취소 실패: 저장 공간을 확인한 뒤 다시 시도하세요.'); return; }
    undoStack.pop();
    notifyMessage('직전 샘플 작업을 취소했습니다.');
  } catch (error) { notifyMessage('실행 취소 실패: '+error.message); }
}

function loginUser() {
  if (typeof firebaseLogin === 'function') {
    firebaseLogin();
    return;
  }
  notifyMessage('로그인 서비스를 불러오지 못했습니다. 인터넷 연결을 확인하고 새로고침하세요. 기기 기록은 유지됩니다.');
}

function logoutUser() {
  if (typeof logoutFirebase === 'function') {
    logoutFirebase();
    return;
  }

  notifyMessage('로그아웃 서비스를 불러오지 못했습니다. 연결을 확인한 뒤 다시 시도하세요.');
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

    const button = target.closest('button');
    if (!button) return;

    if (button.id === 'addSampleBtn' || button.id === 'removeSampleBtn' || button.id === 'cloneSampleBtn') {
      pushUndoState();
      return;
    }

    if (button.id === 'loginBtn') {
      loginUser();
      return;
    }
    if (button.id === 'logoutBtn') {
      logoutUser();
      return;
    }
    if (button.id === 'undoBtn') {
      undoLastAction();
    }
  }, true);
});
