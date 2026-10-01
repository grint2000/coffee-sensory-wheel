/* CP-03 view adapter. Existing form nodes and handlers remain the source of truth. */
(function (global) {
  'use strict';
  global.installQuickEntry = function installQuickEntry(options = {}) {
    if (global.QuickEntry) return global.QuickEntry;
    const doc = global.document, byId = id => doc.getElementById(id);
    const form = byId('cuppingForm'), sessionSelect = byId('sessionSelect');
    const notes = byId('tastingNotes'), flavorArea = byId('flavorWheelMultiSelectArea');
    if (!form || !sessionSelect || !notes || !flavorArea) return null;
    const main = form.parentElement;
    const manager = sessionSelect.closest('section');
    const sessionBox = sessionSelect.parentElement.parentElement;
    const sessionRow = sessionSelect.parentElement;
    const sampleListBox = byId('sampleList')?.parentElement;
    const sampleSearch = byId('sampleSearchInput')?.parentElement;
    const sampleNav = byId('currentSampleIndicator')?.parentElement;
    const titleRow = byId('sampleTitleInput')?.parentElement;
    const notesSection = notes.closest('section'), flavorSection = flavorArea.closest('section');
    const storagePanel = byId('p0StoragePanel'), saveButton = byId('saveSamplesBtn');
    if (!manager || !sampleListBox || !sampleSearch || !sampleNav || !titleRow || !saveButton) return null;
    const media = global.matchMedia?.('(max-width: 767px)');
    const mobile = () => media ? media.matches : global.innerWidth < 768;
    const defaultMode = () => mobile() ? 'quick' : 'detail';
    const moves = [], cleanups = [];
    let mode = null, explicitMode = false, accountId = null;
    let accountMarker = global.currentUser || null, positions = { quick: 0, detail: 0 };
    let restoring = false, printMode = null, destroyed = false, positionRequest = 0;
    function element(tag, id, className, text) {
      const el = doc.createElement(tag);
      if (id) el.id = id;
      if (className) el.className = className;
      if (text) el.textContent = text;
      return el;
    }
    function on(node, event, fn, opts) {
      if (!node) return;
      node.addEventListener(event, fn, opts);
      cleanups.push(() => node.removeEventListener(event, fn, opts));
    }
    function card(id, label) {
      const el = element('section', id, 'quick-entry-card');
      el.append(element('h3', null, 'quick-entry-heading', label));
      return el;
    }
    function details(id, label) {
      const el = element('details', id, 'quick-entry-details');
      el.append(element('summary', null, null, label));
      return el;
    }
    function move(node, target) {
      if (!node) return;
      const marker = doc.createComment('quick-entry original location');
      node.before(marker); moves.push({ node, marker }); target.append(node);
    }
    function restoreNodes() {
      for (const { node, marker } of moves.reverse()) { marker.replaceWith(node); }
      moves.length = 0;
    }
    const toolbar = element('div', 'quickEntryToolbar', 'quick-entry-toolbar');
    toolbar.setAttribute('role', 'group'); toolbar.setAttribute('aria-label', '입력 보기');
    const quickButton = element('button', 'quickEntryModeBtn', 'quick-entry-mode-btn', '빠른 입력');
    const detailButton = element('button', 'detailedEntryModeBtn', 'quick-entry-mode-btn', '상세 입력');
    for (const button of [quickButton, detailButton]) { button.type = 'button'; toolbar.append(button); }
    manager.before(toolbar);
    const navigation = element('div', 'quickEntryNavigation', 'quick-entry-navigation');
    navigation.hidden = true; toolbar.after(navigation);
    const sessionCard = card('quickEntrySession', '1. 세션');
    const sessionDetails = details('quickEntrySessionDetails', '세션 정보 확인·수정');
    const sampleCard = card('quickEntrySamples', '2. 샘플');
    const sampleActions = element('div', null, 'quick-entry-sample-actions');
    navigation.append(sessionCard, sampleCard);
    const core = element('div', 'quickEntryCore', 'quick-entry-core');
    const memoHeading = element('h3', null, 'quick-entry-heading', '3. 핵심 메모·향미');
    const hint = element('p', 'quickEntryAssessmentHint', 'quick-entry-hint', '메모 저장만으로 평가가 완료되지는 않습니다. 미평가 점수는 그대로 유지하며 평가 평균에서 제외합니다.');
    const flavorDetails = details('quickEntryFlavorDetails', '향미 선택 · 선택 사항');
    const detailFields = details('quickEntryDetailedFields', '상세 입력 펼치기 · 커피·생두·점수·평가 이력');
    const detailContent = element('div', 'quickEntryDetailedContent', 'quick-entry-detailed-content');
    detailFields.append(detailContent);
    const saveCard = card('quickEntrySave', '4. 저장');
    saveCard.hidden = true; form.after(saveCard);
    const sessionLabel = element('label', 'quickEntrySessionLabel', 'quick-entry-visually-hidden', '현재 세션');
    sessionLabel.htmlFor = 'sessionSelect'; sessionCard.append(sessionLabel);
    // Labels do not replace original values or handlers.
    const titleLabel = element('label', null, 'quick-entry-visually-hidden', '현재 샘플명'); titleLabel.htmlFor = 'sampleTitleInput';
    const noteLabel = element('label', null, 'quick-entry-visually-hidden', '핵심 메모'); noteLabel.htmlFor = 'tastingNotes';
    const originalSaveType = saveButton.getAttribute('type'); saveButton.type = 'button';
    main.classList.add('quick-entry-main');

    function readAccountId() {
      // A display name is not an account ID. Persistence is opt-in with a stable UID.
      try { const value = options.getAccountId?.(); return typeof value === 'string' && value.length > 0 && value.length <= 200 ? value : null; }
      catch (_) { return null; }
    }
    const storageKey = id => 'noel_sca_quick_view_v1_' + encodeURIComponent(id);
    function scrollPosition() { return Math.max(0, Math.min(10000000, Number(global.scrollY) || 0)); }
    function writePreference() {
      if (!accountId || accountId !== readAccountId()) return;
      try { global.localStorage.setItem(storageKey(accountId), JSON.stringify({ version: 1, accountId, mode, explicitMode, positions })); }
      catch (_) { /* View preferences must never block editing or record saves. */ }
    }
    function readPreference(id) {
      if (!id) return null;
      try {
        const value = JSON.parse(global.localStorage.getItem(storageKey(id)) || 'null');
        if (value?.version !== 1 || value.accountId !== id || !['quick', 'detail'].includes(value.mode)) return null;
        const pos = value.positions;
        if (!pos || !['quick', 'detail'].every(k => Number.isFinite(pos[k]) && pos[k] >= 0 && pos[k] <= 10000000)) return null;
        return value;
      } catch (_) { return null; }
    }
    function applyMode(next) {
      if (next === mode) return;
      restoreNodes();
      core.remove(); detailFields.remove();
      if (next === 'quick') {
        const detailNodes = [...form.children].filter(el => ![titleRow, notesSection, flavorSection].includes(el));
        move(sessionRow, sessionCard);
        for (const child of [...sessionBox.children]) move(child, sessionDetails);
        sessionCard.append(sessionDetails);
        move(byId('addSampleBtn'), sampleActions); sampleCard.append(sampleActions);
        move(sampleSearch, sampleCard); move(byId('sampleMetaCount'), sampleCard); move(sampleListBox, sampleCard); move(sampleNav, sampleCard);
        form.prepend(core);
        move(titleRow, core); core.append(titleLabel, memoHeading, hint, noteLabel);
        move(notesSection, core); core.append(flavorDetails); move(flavorSection, flavorDetails);
        form.append(detailFields); for (const child of detailNodes) move(child, detailContent);
        move(saveButton, saveCard);
        // Keep live draft/save/recovery warnings visible, including future P0 status nodes.
        move(storagePanel, saveCard);
      }
      mode = next;
      doc.body.classList.toggle('quick-entry-active', next === 'quick');
      manager.classList.toggle('quick-entry-manager-hidden', next === 'quick');
      navigation.hidden = saveCard.hidden = next !== 'quick';
      quickButton.setAttribute('aria-pressed', String(next === 'quick'));
      detailButton.setAttribute('aria-pressed', String(next === 'detail'));
      doc.dispatchEvent(new global.CustomEvent('cupping:view-changed', { detail: { mode } }));
    }
    function restorePosition(expectedMode, expectedAccount) {
      restoring = true;
      const request = ++positionRequest;
      global.requestAnimationFrame(() => {
        if (request !== positionRequest) return;
        if (!destroyed && mode === expectedMode && accountId === expectedAccount) global.scrollTo({ top: positions[mode], left: 0, behavior: 'instant' });
        restoring = false;
      });
    }
    function refreshAccount() {
      const nextId = readAccountId(), nextMarker = global.currentUser || null;
      if (nextId === accountId && nextMarker === accountMarker) return false;
      // Do not save a departing view under a newly selected account.
      accountId = nextId; accountMarker = nextMarker;
      const stored = readPreference(accountId);
      positions = stored ? { ...stored.positions } : { quick: 0, detail: 0 };
      explicitMode = !!stored?.explicitMode;
      detailFields.open = flavorDetails.open = sessionDetails.open = false;
      applyMode(stored && explicitMode ? stored.mode : defaultMode());
      restorePosition(mode, accountId);
      return true;
    }
    function setMode(next, settings = {}) {
      if (!['quick', 'detail'].includes(next)) return;
      refreshAccount();
      if (mode) positions[mode] = scrollPosition();
      if (settings.explicit !== false) explicitMode = true;
      applyMode(next);
      if (settings.persist !== false) writePreference();
      if (settings.restore !== false) restorePosition(mode, accountId);
    }
    function savePosition() {
      if (destroyed || restoring || refreshAccount()) return;
      positions[mode] = scrollPosition(); writePreference();
    }
    function reveal(target) {
      if (!target) return;
      for (let node = target.parentElement; node; node = node.parentElement) if (node.tagName === 'DETAILS') node.open = true;
    }
    on(quickButton, 'click', () => setMode('quick'));
    on(detailButton, 'click', () => setMode('detail'));
    // Existing bottom actions still execute their original handlers exactly once.
    on(byId('mobileQuickCompareBtn'), 'click', () => {
      if (mode === 'quick') { setMode('detail', { restore: false }); byId('compareListBox')?.scrollIntoView({ block: 'start' }); }
    }, true);
    on(global, 'cupping:draft-restored', event => {
      refreshAccount();
      const target = typeof event.detail?.focusId === 'string' ? byId(event.detail.focusId) : null;
      if (target && form.contains(target) && typeof target.focus === 'function') {
        positionRequest++; restoring = false;
        reveal(target); target.focus({ preventScroll: false });
      }
    });
    on(doc, 'focusin', event => { refreshAccount(); if (mode === 'quick' && form.contains(event.target)) reveal(event.target); });
    on(global, 'pagehide', savePosition);
    on(doc, 'visibilitychange', () => { if (doc.visibilityState === 'hidden') savePosition(); });
    on(global, 'storage', event => { if (event.key === 'noel_sca_current_user') refreshAccount(); });
    on(global, 'cupping:account-changed', refreshAccount);
    on(global, 'cupping:auth-ready', refreshAccount);
    on(global, 'beforeprint', () => { printMode = mode; applyMode('detail'); });
    on(global, 'afterprint', () => { if (printMode) { applyMode(printMode); printMode = null; } });
    const resize = () => { refreshAccount(); if (!explicitMode) setMode(defaultMode(), { explicit: false, persist: false }); };
    if (media?.addEventListener) on(media, 'change', resize); else on(global, 'resize', resize);
    const accountDisplay = byId('currentUserDisplay');
    const observer = accountDisplay && new global.MutationObserver(refreshAccount);
    if (observer) observer.observe(accountDisplay, { childList: true, characterData: true, subtree: true });
    accountId = readAccountId();
    const stored = readPreference(accountId);
    if (stored) { positions = { ...stored.positions }; explicitMode = !!stored.explicitMode; }
    applyMode(stored && explicitMode ? stored.mode : defaultMode());
    if (stored) restorePosition(mode, accountId);
    const api = {
      setMode,
      refreshAccount,
      getState: () => ({ mode, persisted: !!accountId, explicitMode }),
      destroy() {
        savePosition(); destroyed = true; observer?.disconnect(); cleanups.forEach(fn => fn());
        restoreNodes(); core.remove(); detailFields.remove(); toolbar.remove(); navigation.remove(); saveCard.remove();
        manager.classList.remove('quick-entry-manager-hidden'); main.classList.remove('quick-entry-main'); doc.body.classList.remove('quick-entry-active');
        if (originalSaveType === null) saveButton.removeAttribute('type'); else saveButton.setAttribute('type', originalSaveType);
        delete global.QuickEntry;
      }
    };
    global.QuickEntry = api;
    return api;
  };
})(window);
