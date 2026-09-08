/* Local record interchange and recovery. No network or implicit data writes. */
(function (root) {
  'use strict';
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const clone = value => JSON.parse(JSON.stringify(value));
  function normalize(input, factories) {
    let values = clone(input);
    if (object(values) && values.kind === 'noel-recovery') values = values.sessions;
    if (object(values) && Array.isArray(values.samples)) values = [values];
    if (!Array.isArray(values) || !values.length) throw Error('세션 또는 샘플이 포함된 JSON이 아닙니다.');
    if (values.every(value => object(value) && object(value.sampleData) && !('samples' in value))) {
      values = [factories.session({title: '가져온 데이터', samples: values})];
    }
    const sessionIds = new Set();
    const sampleIds = new Set();
    function identifier(value, fallback, seen) {
      const id = value === undefined ? fallback : value;
      if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,160}$/.test(id) || seen.has(id)) {
        throw Error('식별자가 잘못되었거나 중복됐습니다. 원본 파일을 확인해 주세요.');
      }
      seen.add(id); return id;
    }
    return values.map(value => {
      if (!object(value) || !Array.isArray(value.samples)) throw Error('세션 안의 샘플 목록이 올바르지 않습니다.');
      const base = factories.session();
      const session = {...base, ...value, id: identifier(value.id, base.id, sessionIds)};
      for (const key of ['title','date','time','purpose','location','cupper','grindSize']) {
        if (session[key] != null && typeof session[key] !== 'string') throw Error('세션의 '+key+' 값은 문자열이어야 합니다.');
      }
      if (!('time' in value)) session.time = '';
      session.samples = value.samples.map((sample, i) => {
        if (!object(sample) || !object(sample.sampleData)) throw Error('샘플의 평가 데이터가 올바르지 않습니다.');
        if (sample.title != null && typeof sample.title !== 'string') throw Error('샘플 이름이 올바르지 않습니다.');
        const defaults = factories.sample('샘플 #'+(i+1));
        const data = {...defaults.sampleData, ...sample.sampleData};
        if (!object(data.flavorSelections) || Object.values(data.flavorSelections).some(v => !Array.isArray(v) || v.some(x => typeof x !== 'string'))) {
          throw Error('향미 선택 목록이 올바르지 않습니다.');
        }
        if (!Array.isArray(data.bodyDescriptors) || data.bodyDescriptors.some(x => typeof x !== 'string')) throw Error('바디감 목록이 올바르지 않습니다.');
        if (factories.validate && !factories.validate(data)) throw Error('샘플 평가값을 확인해 주세요.');
        return {...defaults, ...sample, id: identifier(sample.id, defaults.id, sampleIds), sampleData:data};
      });
      if (!session.samples.length) session.samples = [factories.sample('샘플 #1')];
      return session;
    });
  }
  const backupPrefix = user => 'noel_sca_recovery_'+encodeURIComponent(user)+'_';
  function backup(storage, user, sessions, reason, previousStoredRaw = null) {
    const key = backupPrefix(user)+Date.now()+'_'+Math.random().toString(36).slice(2,8);
    const payload = {kind:'noel-recovery',version:1,user,createdAt:new Date().toISOString(),reason,sessions,previousStoredRaw};
    // Never prune existing recovery copies to make space for a failed write.
    storage.setItem(key, JSON.stringify(payload));
    return key;
  }
  function listBackups(storage, user) {
    const rows = [];
    for (let i=0; i<storage.length; i++) {
      const key = storage.key(i);
      if (key.startsWith(backupPrefix(user))) {
        try {
          const value = JSON.parse(storage.getItem(key));
          if (value.user === user && value.kind === 'noel-recovery') rows.push({key,date:value.createdAt,reason:value.reason});
        } catch (_) { /* Preserve unreadable backup; do not automatically use it. */ }
      } else if (/^noel_sca_backup_\d{4}-\d{2}-\d{2}$/.test(key)) {
        rows.push({key,date:key.slice('noel_sca_backup_'.length),reason:'이전 버전 공용 백업 · 사용자 미확인'});
      }
    }
    return rows.sort((a,b)=>b.date.localeCompare(a.date));
  }
  function commit(storage, user, sessions) {
    // The complete sessions array is the sole authoritative record, written atomically.
    storage.setItem('noel_sca_sessions_'+user, JSON.stringify(sessions));
  }
  root.NOEL_DATA = {normalize,backup,listBackups,commit,backupPrefix};
})(typeof window !== 'undefined' ? window : globalThis);
