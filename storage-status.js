/* Read-only status presentation. No record, authentication, or storage writes. */
(function (global) {
  'use strict';
  global.installStorageStatus = function installStorageStatus() {
    if (global.CuppingStorageStatus) return global.CuppingStorageStatus;
    const doc = global.document, $ = id => doc.getElementById(id);
    if (!$('p0StoragePanel') || !$('storageDeviceSummary')) return null;
    const importDefault = 'JSON 복구는 검증 → 미리보기 → 적용 순서입니다.';
    let team = global.getCuppingTeamStatus?.() || null;
    let sync = global.getCuppingSyncStatus?.() || null;
    const review = doc.body.dataset.cuppingReview === 'true';
    const saveButton = $('saveSamplesBtn'), saveFeedback = doc.createElement('p');
    saveFeedback.id = 'storageSaveFeedback'; saveFeedback.className = 'storage-save-feedback';
    saveFeedback.setAttribute('role', 'alert'); saveFeedback.tabIndex = -1; saveFeedback.hidden = true;
    function placeSaveFeedback() {
      if (saveButton && saveButton.nextElementSibling !== saveFeedback) saveButton.after(saveFeedback);
    }
    function text(node, value) { if (node && node.textContent !== value) node.textContent = value; }
    function sameContext(a, b) {
      return !!a && !!b && a.account === b.account && a.team === b.team && a.version === b.version;
    }
    function render() {
      const local = $('p0SaveStatus'), state = local?.dataset.state || 'checking';
      placeSaveFeedback();
      const failureText = state === 'error' ? local.textContent : '';
      text(saveFeedback, failureText); saveFeedback.hidden = !failureText;
      const deviceLabels = { saved: '기기 · 저장됨', dirty: '기기 · 저장 전', error: '기기 · 저장 확인 필요' };
      text($('storageDeviceSummary'), deviceLabels[state] || '기기 · 저장 상태 확인 중');
      $('storageDeviceSummary').dataset.state = state;
      const currentSync = sameContext(sync?.context, team?.context) ? sync : null;
      let teamText = '팀 동기화 · 로그인 상태 확인 중', tone = 'neutral';
      const warnings = state === 'error' ? [local.textContent] : [];
      if (review) teamText = '가상 자료 검토 · 서버 저장 사용 안 함';
      else if (team?.authReady && !team.signedIn) teamText = '로그아웃 · 팀 동기화 사용 안 함';
      else if (team?.authReady && team.signedIn) {
        if (team.state === 'denied') {
          teamText = '팀 동기화 · 접근 권한 없음'; tone = 'error';
          warnings.push('팀 접근 권한을 확인할 수 없습니다. 팀관리에서 권한을 확인하세요. 이 기기 기록은 유지됩니다.');
        } else if (team.state === 'blocked') {
          teamText = '팀 동기화 · 계정 확인 필요'; tone = 'warning';
          warnings.push('계정이 바뀌어 이전 기록을 보호 중입니다. JSON으로 보관한 뒤 계정별 자료를 확인하세요.');
        } else if (team.state === 'failed' && !['saving', 'saved', 'failed'].includes(currentSync?.state)) {
          teamText = '팀 동기화 · 확인 실패'; tone = 'error';
          warnings.push('팀 작업을 확인하지 못했습니다. 팀관리에서 상태를 확인하세요. 이 기기 저장과는 별개입니다.');
        } else if (team.state === 'connecting') teamText = '팀 동기화 · 연결 확인 중';
        else if (!team.teamName) teamText = '로그인됨 · 동기화할 팀 미선택';
        else {
          const labels = { saving: '팀 동기화 · 저장 중', saved: '팀 동기화 · 현재 세션 저장 완료', failed: '팀 동기화 · 저장 실패', received: '팀 동기화 · 자료 수신됨', blocked: '팀 동기화 · 새 자료 적용 보류' };
          teamText = labels[currentSync?.state] || '팀 선택됨 · 서버 저장 결과 없음';
          if (currentSync?.state === 'saved') tone = 'success';
          if (['failed', 'blocked'].includes(currentSync?.state)) { tone = currentSync.state === 'failed' ? 'error' : 'warning'; warnings.push(currentSync.text); }
        }
      }
      text($('storageTeamSummary'), teamText); $('storageTeamSummary').dataset.state = tone;
      const urgent = $('storageUrgentStatus'); text(urgent, warnings.filter(Boolean).join(' ')); urgent.hidden = warnings.length === 0;
      // Active recovery tools stay outside the collapsed details, and are never hidden here.
      const importStatus = $('courseImportStatus');
      if (importStatus) { const hidden = !importStatus.textContent.trim() || importStatus.textContent === importDefault; if (importStatus.hidden !== hidden) importStatus.hidden = hidden; }
      const user = $('currentUserDisplay');
      text(user, review ? '가상 자료' : !team?.authReady ? '로그인 확인 중' : team.signedIn ? (team.displayName || '로그인됨') : '이 기기 기록');
    }
    function teamChanged(event) { team = event.detail || global.getCuppingTeamStatus?.() || null; if (['failed', 'denied', 'blocked'].includes(team?.state)) sync = null; render(); }
    function syncChanged(event) { sync = event.detail || global.getCuppingSyncStatus?.() || null; render(); }
    function authChanged() { team = global.getCuppingTeamStatus?.() || null; render(); }
    function showSaveFailure() {
      // Installed after the existing save handler: observe its result, never save again.
      render();
      if (saveFeedback.hidden) return;
      saveFeedback.focus({ preventScroll: true });
      saveFeedback.scrollIntoView({ block: 'center', behavior: 'instant' });
      // A just-selected input mode may still have a queued position restore.
      global.requestAnimationFrame(() => {
        if (!saveFeedback.hidden && doc.activeElement === saveFeedback) saveFeedback.scrollIntoView({ block: 'center', behavior: 'instant' });
      });
      if (typeof global.showToast === 'function') {
        const safe = doc.createElement('span'); safe.textContent = saveFeedback.textContent;
        global.showToast(safe.innerHTML);
      }
    }
    global.addEventListener('cupping:team-status', teamChanged);
    global.addEventListener('cupping:sync-status', syncChanged);
    global.addEventListener('cupping:auth-ready', authChanged);
    saveButton?.addEventListener('click', showSaveFailure);
    doc.addEventListener('cupping:view-changed', placeSaveFeedback);
    const observer = new global.MutationObserver(render);
    for (const id of ['p0SaveStatus', 'p0DraftStatus', 'courseImportStatus', 'currentUserDisplay']) {
      if ($(id)) observer.observe($(id), { childList: true, characterData: true, subtree: true, attributes: id === 'p0SaveStatus', attributeFilter: id === 'p0SaveStatus' ? ['data-state'] : undefined });
    }
    if (review) {
      const notice = doc.createElement('p'); notice.id = 'storageReviewNotice';
      notice.textContent = '이 화면은 가상 자료용 검토본입니다. 운영 계정·운영 저장소에 연결하지 않으며, 서버 저장 기능을 사용하지 않습니다.';
      $('p0StorageDetails').append(notice);
    }
    render();
    const api = { refresh: authChanged, destroy() { observer.disconnect(); global.removeEventListener('cupping:team-status', teamChanged); global.removeEventListener('cupping:sync-status', syncChanged); global.removeEventListener('cupping:auth-ready', authChanged); saveButton?.removeEventListener('click', showSaveFailure); doc.removeEventListener('cupping:view-changed', placeSaveFeedback); saveFeedback.remove(); delete global.CuppingStorageStatus; } };
    global.CuppingStorageStatus = api;
    return api;
  };
})(window);
