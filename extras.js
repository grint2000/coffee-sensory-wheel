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
  const name = prompt('사용자 이름을 입력하세요', window.currentUser);
  if (!name) return;
  window.currentUser = name.trim();
  localStorage.setItem('mollis_sca_current_user', window.currentUser);
  location.reload();
}

function logoutUser() {
  if (confirm('로그아웃하시겠습니까?')) {
    window.currentUser = 'default';
    localStorage.setItem('mollis_sca_current_user', window.currentUser);
    location.reload();
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(e => console.error('SW registration failed:', e));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  const display = document.getElementById('currentUserDisplay');
  if (display) display.textContent = currentUser;
  if (loginBtn) loginBtn.addEventListener('click', loginUser);
  const undoBtn = document.getElementById('undoBtn');
  if (undoBtn) undoBtn.addEventListener('click', undoLastAction);
  const addBtn = document.getElementById('addSampleBtn');
  if (addBtn) addBtn.addEventListener('click', pushUndoState);
  const removeBtn = document.getElementById('removeSampleBtn');
  if (removeBtn) removeBtn.addEventListener('click', pushUndoState);
  const cloneBtn = document.getElementById('cloneSampleBtn');
  if (cloneBtn) cloneBtn.addEventListener('click', pushUndoState);
});
