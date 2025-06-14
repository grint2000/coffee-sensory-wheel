// Extra features: undo, login, service worker registration
 추가 기능: 실행 취소, 로그인, 서비스 워커 등록
let undoStack = [];
let currentUser = localStorage.getItem('mollis_sca_current_user') || 'default';
let currentUser = localStorage를 사용합니다.getItem('mollis_sca_current_user') || '기본값';

function pushUndoState() {
함수pushUndoState() {
  if (window.samples) {
if(창.샘플) {
    undoStack.push({ samples: JSON.stringify(window.samples), currentSampleId: window.currentSampleId });
 실행 취소Stack.push({ samples: JSON입니다.stringify(창.samples), currentSampleId: window를 사용합니다.currentSampleId });
    if (undoStack.length > 20) undoStack.shift();
if(undoStack.길이 > 20) undoStack.시프트();
  }
}

function undoLastAction() {
  if (!undoStack.length) {
if (!undoStack.길이) {
    alert('실행 취소할 내용이 없습니다.');
    return;
  }
  const state = undoStack.pop();
const 상태 = undoStack.팝();
  localStorage.setItem(`mollis_sca_samples2_${currentUser}`, state.samples);
localStorage입니다.setItem('mollis_sca_samples2_${currentUser}', 상태.샘플);
  location.reload();
 위치.재장전();
}

function loginUser() {
함수loginUser() {
  const name = prompt('사용자 이름을 입력하세요', currentUser);
  if (!name) return;
if (!name) 반환;
  currentUser = name.trim();
 currentUser = 이름.트림();
  localStorage.setItem('mollis_sca_current_user', currentUser);
localStorage입니다.setItem('mollis_sca_current_user', 현재 사용자);
  location.reload();
 위치.재장전();
}

if ('serviceWorker' in navigator) {
if ('serviceWorker', 탐색기에서) {
  window.addEventListener('load', () => {
창.addEventListener('로드', () => {
    navigator.serviceWorker.register('service-worker.js').catch(e => console.error('SW registration failed:', e));
 네비게이터.serviceWorker입니다.register('service-worker.js')입니다.catch(e =>console입니다.error('SW 등록 실패:', e));
  });
}

document.addEventListener('DOMContentLoaded', () => {
문서를 탭합니다.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
const loginBtn = 문서.getElementById('로그인Btn');
  const display = document.getElementById('currentUserDisplay');
const display = 문서.getElementById('현재 사용자 디스플레이');
  if (display) display.textContent = currentUser;
if(표시) 표시.textContent = 현재 사용자;
  if (loginBtn) loginBtn.addEventListener('click', loginUser);
if (loginBtn) loginBtn입니다.addEventListener('클릭', loginUser);
  const undoBtn = document.getElementById('undoBtn');
const undoBtn = 문서.getElementById('undoBtn');
  if (undoBtn) undoBtn.addEventListener('click', undoLastAction);
if(undoBtn) undoBtn.addEventListener('클릭', undoLastAction);
  const addBtn = document.getElementById('addSampleBtn');
const addBtn = 문서.getElementById('추가 샘플Btn');
  if (addBtn) addBtn.addEventListener('click', pushUndoState);
  const removeBtn = document.getElementById('removeSampleBtn');
const removeBtn = 문서.getElementById('removeSampleBtn');
  if (removeBtn) removeBtn.addEventListener('click', pushUndoState);
  const cloneBtn = document.getElementById('cloneSampleBtn');
const cloneBtn = 문서.getElementById('클론샘플Btn');
  if (cloneBtn) cloneBtn.addEventListener('click', pushUndoState);
if (cloneBtn) cloneBtn입니다.addEventListener('클릭', pushUndoState);
});
