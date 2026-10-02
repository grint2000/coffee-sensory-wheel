/* CP-09/10 review preparation. Pure in-memory derivation; never writes source records. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CompareSearchModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const normalize = value => String(value ?? '').normalize('NFC').trim().toLocaleLowerCase('en');
  const present = value => typeof value === 'string' && value.trim() !== '';
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const CONDITION_KEYS = ['waterTemp', 'grindSize', 'water_info', 'grinder', 'ratio', 'time', 'roastDate', 'roastLevel'];
  const CONTEXT_KEYS = ['coffeeName', 'origin', 'variety', 'farmName', 'harvestYear', 'process', 'lotNumber', 'supplierName'];
  const SOURCE_KINDS = ['observed', 'supplier', 'my-note', 'team-aggregate', 'unknown'];
  function freeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.freeze(value);
      Object.values(value).forEach(freeze);
    }
    return value;
  }
  function reason(code, field, detail) { return { code, field, ...(detail === undefined ? {} : { detail }) }; }
  function stats(values) {
    if (!Array.isArray(values) || values.some(value => typeof value !== 'number' || !Number.isFinite(value))) throw Error('Statistics require explicit finite numbers; missing values are not zero.');
    if (!values.length) return { count: 0, mean: null, min: null, max: null, range: null, populationVariance: null, populationSD: null };
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
    const min = Math.min(...values), max = Math.max(...values);
    return { count: values.length, mean, min, max, range: max - min, populationVariance: variance, populationSD: Math.sqrt(variance) };
  }
  function create({ scoreModel: M, identityModel: R, contextModel: A, flavorData, flavorPhases }) {
    if (!M || !R || !A || !Array.isArray(flavorData) || !Array.isArray(flavorPhases)) throw Error('Provide the installed score, identity, assessment-context models and flavor dictionaries.');
    const phases = new Set(flavorPhases.map(phase => phase.id));
    const flavors = new Map(), aliases = new Map();
    function alias(term, id) {
      const key = normalize(term);
      if (!key) return;
      if (!aliases.has(key)) aliases.set(key, new Set());
      aliases.get(key).add(id);
    }
    for (const row of flavorData) {
      const id = row.slice(0, 3).join('|');
      flavors.set(id, { id, label: row[6] || row[2], english: row[2] });
      [id, row[2], row[6]].forEach(term => alias(term, id));
    }
    // A precise concept alias, not a substring rule (jasmine tea remains distinct).
    const jasmine = 'Floral|White Flowers|Jasmine';
    if (flavors.has(jasmine)) ['자스민', '재스민'].forEach(term => alias(term, jasmine));
    function resolveFlavor(raw) {
      const candidates = [...(aliases.get(normalize(raw)) || [])];
      return { raw, id: candidates.length === 1 ? candidates[0] : null, candidates,
        status: candidates.length === 1 ? 'resolved' : candidates.length ? 'ambiguous' : 'unknown' };
    }
    function attribution(proof, evaluationId) {
      // Only the external adapter can attest authorship. UID fields in imported JSON are ignored.
      const valid = proof && present(proof.uid) && present(proof.evidence_ref) &&
        present(evaluationId) && proof.evaluation_id === evaluationId &&
        ['authenticated-evaluation-write', 'verified-evaluation-author'].includes(proof.evidence);
      return valid ? { status: 'proven', uid: proof.uid, evidence: proof.evidence, evidence_ref: proof.evidence_ref }
        : { status: 'unknown', uid: null, evidence: null, evidence_ref: null };
    }
    function condition(value, source, unit = null, instrument = null) {
      return { known: value !== null && value !== undefined && (typeof value !== 'string' || present(value)), value, unit, source, instrument };
    }
    function conditions(data, session) {
      const result = Object.fromEntries(CONDITION_KEYS.map(key => [key, condition(null, 'unknown')]));
      const warnings = [];
      let sessionValid = true, brewingValid = true;
      try { A.validateSession(session); } catch (_) { sessionValid = false; warnings.push(reason('invalid-condition-contract', 'session')); }
      try { A.validateBrewing(data.brewing_context); } catch (_) { brewingValid = false; warnings.push(reason('invalid-condition-contract', 'brewing_context')); }
      const p = session.condition_provenance;
      if (sessionValid && p?.version === 1) {
        if (['manual', 'instrument-transcribed'].includes(p.waterTemp?.source) && typeof session.waterTemp === 'number' && Number.isFinite(session.waterTemp)) {
          result.waterTemp = condition(session.waterTemp, p.waterTemp.source, p.waterTemp.unit, p.waterTemp.instrument || null);
        }
        if (p.grindSize?.source === 'manual' && present(session.grindSize)) result.grindSize = condition(session.grindSize.trim(), 'manual');
      }
      const b = data.brewing_context;
      if (brewingValid && b?.version === 1 && b.provenance === 'manual') {
        for (const key of ['water_info', 'grinder']) if (present(b[key])) result[key] = condition(b[key].trim(), 'manual');
        for (const key of ['ratio', 'time']) {
          const q = b[key];
          if (q && q.value !== null && ['manual', 'instrument-transcribed'].includes(q.source)) result[key] = condition(q.value, q.source, q.unit, q.source === 'instrument-transcribed' ? b.instrument : null);
        }
      }
      // These existing fields are declarations, not instrument-verified measurements.
      for (const key of ['roastDate', 'roastLevel']) if (present(data[key])) result[key] = condition(data[key].trim(), 'record-declared');
      return { values: result, warnings };
    }
    function identity(data, session) {
      const ref = data.record_identity, reasons = [];
      try { R.validate(ref); } catch (_) { reasons.push(reason('invalid-identity', 'record_identity')); }
      if (!ref || ref.status !== 'confirmed') reasons.push(reason('unconfirmed-identity', 'record_identity'));
      if (!present(ref?.lot_id)) reasons.push(reason('unknown-lot', 'record_identity.lot_id'));
      if (!present(ref?.roast_batch_id)) reasons.push(reason('unknown-roast-batch', 'record_identity.roast_batch_id'));
      if (!present(ref?.evaluation_id)) reasons.push(reason('unknown-evaluation', 'record_identity.evaluation_id'));
      if (ref?.confirmed_context && !same(ref.confirmed_context, Object.fromEntries(CONTEXT_KEYS.map(key => [key, String(data[key] ?? '')])))) reasons.push(reason('stale-confirmed-context', 'record_identity.confirmed_context'));
      if (ref && ref.process !== (data.process || null)) reasons.push(reason('stale-confirmed-process', 'record_identity.process'));
      if (!ref?.confirmed_context) reasons.push(reason('missing-confirmed-context', 'record_identity.confirmed_context'));
      if (present(session.id) && ref?.session_id !== session.id) reasons.push(reason('session-mismatch', 'record_identity.session_id'));
      return { ref: ref || null, reasons };
    }
    function score(data) {
      const reasons = [];
      if (data.schema_id === undefined || data.schema_id === M.LEGACY) reasons.push(reason('legacy-unconfirmed', 'schema_id'));
      else if (data.schema_id !== M.SCHEMA) reasons.push(reason('unsupported-schema', 'schema_id'));
      if (data.schema_version !== 1) reasons.push(reason('unsupported-schema-version', 'schema_version'));
      if (data.calculation_version !== M.CALC) reasons.push(reason('unsupported-calculation', 'calculation_version'));
      try { M.validate(data); } catch (_) { reasons.push(reason('invalid-score-contract', 'scores')); }
      const missing = M.SCORES.filter(key => data.assessed_fields?.[key] !== true || !M.valid(data[key]));
      if (missing.length) reasons.push(reason('incomplete-assessment', 'scores', { missing }));
      return { total: reasons.length ? null : M.summary(data).total, missing, reasons };
    }
    function sourceNotes(extra) {
      if (extra === undefined) return [];
      if (!Array.isArray(extra)) throw Error('Additional note sources must be a separate array.');
      return extra.map(note => {
        if (!note || !['supplier', 'team-aggregate', 'unknown'].includes(note.kind) || typeof note.text !== 'string') throw Error('Additional notes need an explicit supplier/team-aggregate/unknown kind and text.');
        if (note.kind !== 'unknown' && !present(note.source_ref)) throw Error('A known note source needs source_ref.');
        if (note.flavorIds !== undefined && (!Array.isArray(note.flavorIds) || note.flavorIds.some(id => typeof id !== 'string'))) throw Error('Note flavor IDs must be strings.');
        return { ...note, provenance: note.kind === 'unknown' ? 'unknown' : 'caller-supplied-source',
          tags: (note.flavorIds || []).map(resolveFlavor) };
      });
    }
    function buildIndex(records, { getAttribution, getNoteSources, viewerUid = null } = {}) {
      if (!Array.isArray(records)) throw Error('Records must be an array of {key, sample, session}.');
      const keys = new Set();
      const rows = structuredClone(records);
      const entries = rows.map(row => {
        if (!present(row.key) || keys.has(row.key) || !row.sample?.sampleData || !row.session) throw Error('Each record needs a unique key, sample.sampleData and session.');
        keys.add(row.key);
        const data = row.sample.sampleData, id = identity(data, row.session), scoring = score(data), brewing = conditions(data, row.session);
        // Pass detached arguments so a caller cannot accidentally edit index snapshots.
        const proven = attribution(getAttribution?.(structuredClone(row)), id.ref?.evaluation_id);
        const notes = sourceNotes(structuredClone(getNoteSources?.(structuredClone(row))));
        const tags = [];
        for (const [phase, selections] of Object.entries(data.flavorSelections || {})) {
          if (!Array.isArray(selections)) continue;
          for (const raw of selections) {
            const resolved = typeof raw === 'string' ? resolveFlavor(raw) : { raw, id: null, status: 'invalid', candidates: [] };
            tags.push({ ...resolved, phase, knownPhase: phases.has(phase), sourceKind: 'observed', provenance: 'sample.flavorSelections', evaluator: proven });
          }
        }
        const personalKind = proven.status === 'proven' && present(viewerUid) && proven.uid === viewerUid ? 'my-note' : 'unknown';
        const ownNotes = [{ kind: personalKind, text: data.tastingNotes ?? '', field: 'sample.sampleData.tastingNotes', evaluator: proven, provenance: proven.status }];
        if (data.assessment_context?.sensory_description !== undefined) ownNotes.push({ kind: personalKind, text: data.assessment_context.sensory_description,
          field: 'sample.sampleData.assessment_context.sensory_description', evaluator: proven, provenance: data.assessment_context.provenance || 'unknown' });
        const confirmed = id.ref?.status === 'confirmed' && !id.reasons.some(r => ['invalid-identity', 'stale-confirmed-context', 'stale-confirmed-process', 'missing-confirmed-context'].includes(r.code));
        const crop = confirmed && Number.isInteger(id.ref.crop_year) ? id.ref.crop_year : null;
        const farmAliases = [data.farmName, ...(Array.isArray(id.ref?.aliases?.farm_name) ? id.ref.aliases.farm_name : [])].filter(present);
        return { key: row.key, raw: row, identity: id, score: scoring, conditions: brewing.values,
          warnings: brewing.warnings, evaluator: proven, tags, notes: [...ownNotes, ...notes],
          search: { farmId: confirmed ? id.ref.farm_id : null, farmNames: [...new Set(farmAliases)], cropYear: crop, process: data.process ?? null, purpose: row.session.purpose ?? null } };
      });
      return freeze({ entries, conditionKeys: [...CONDITION_KEYS], version: 1 });
    }
    function fromSessions(sessions) {
      return sessions.flatMap((session, sessionIndex) => (session.samples || []).map((sample, sampleIndex) => ({
        key: `${sessionIndex}:${sampleIndex}:${session.id || ''}:${sample.id || ''}`, sample, session
      })));
    }
    function search(index, query = {}) {
      const allowed = ['flavors', 'flavorMode', 'phaseIds', 'sourceKinds', 'farmIds', 'farmNames', 'cropYears', 'processes', 'purposes'];
      if (Object.keys(query).some(key => !allowed.includes(key))) throw Error('Unknown search filter.');
      for (const key of allowed.filter(key => key !== 'flavorMode')) if (query[key] !== undefined && !Array.isArray(query[key])) throw Error(`${key} must be an array.`);
      if (query.flavorMode !== undefined && !['all', 'any'].includes(query.flavorMode)) throw Error('flavorMode must be all or any.');
      if ((query.phaseIds || []).some(phase => !phases.has(phase))) throw Error('Unknown flavor phase.');
      if ((query.sourceKinds || []).some(kind => !SOURCE_KINDS.includes(kind))) throw Error('Unknown source kind.');
      if ((query.cropYears || []).some(year => !Number.isInteger(year))) throw Error('Crop-year filters need confirmed integer years.');
      const resolved = (query.flavors || []).map(resolveFlavor), sourceKinds = query.sourceKinds || ['observed'];
      const results = index.entries.map(entry => {
        const matched = [], excluded = [];
        const pool = [];
        if (sourceKinds.includes('observed') || sourceKinds.includes('my-note') && entry.notes.some(note => note.kind === 'my-note')) {
          pool.push(...entry.tags.filter(tag => tag.knownPhase && (!(query.phaseIds || []).length || query.phaseIds.includes(tag.phase))));
        }
        for (const note of entry.notes) if (sourceKinds.includes(note.kind) && !(query.phaseIds || []).length) {
          pool.push(...(note.tags || []).map(tag => ({ ...tag, phase: null, sourceKind: note.kind, provenance: note.provenance, source_ref: note.source_ref || null })));
        }
        const hitIds = new Set();
        for (const term of resolved) {
          if (!term.id) { excluded.push(reason('unresolved-flavor-filter', 'flavors', term)); continue; }
          const hits = pool.filter(tag => tag.id === term.id);
          if (hits.length) { hitIds.add(term.id); matched.push(reason('matched-flavor', 'flavors', { query: term.raw, id: term.id, tags: hits })); }
        }
        const expectedIds = [...new Set(resolved.filter(term => term.id).map(term => term.id))];
        if (expectedIds.length && (query.flavorMode === 'any' ? !hitIds.size : expectedIds.some(id => !hitIds.has(id)))) {
          excluded.push(reason('missing-flavor', 'flavors', { missingIds: expectedIds.filter(id => !hitIds.has(id)), mode: query.flavorMode || 'all' }));
        }
        for (const [filter, field, actual] of [
          ['farmIds', 'record_identity.farm_id', entry.search.farmId], ['farmNames', 'farmName/aliases', entry.search.farmNames],
          ['cropYears', 'record_identity.crop_year', entry.search.cropYear], ['processes', 'process', entry.search.process], ['purposes', 'session.purpose', entry.search.purpose]
        ]) {
          const requested = query[filter] || [];
          if (!requested.length) continue;
          const values = Array.isArray(actual) ? actual : [actual];
          const ok = values.some(value => value !== null && value !== undefined && requested.some(wanted => normalize(value) === normalize(wanted)));
          (ok ? matched : excluded).push(reason(ok ? 'matched-filter' : values.every(value => value === null || value === undefined || value === '') ? 'unknown-filter-value' : 'different-filter-value', field, { requested, actual }));
        }
        return { key: entry.key, matches: excluded.length === 0, matched, excluded, entry };
      });
      return { matched: results.filter(row => row.matches), excluded: results.filter(row => !row.matches), query: structuredClone(query), resolvedFlavors: resolved };
    }
    function compare(index, anchorKey) {
      const anchor = index.entries.find(entry => entry.key === anchorKey);
      if (!anchor) throw Error('Select an existing anchor record.');
      const evaluationCounts = new Map();
      for (const entry of index.entries) if (present(entry.identity.ref?.evaluation_id)) evaluationCounts.set(entry.identity.ref.evaluation_id, (evaluationCounts.get(entry.identity.ref.evaluation_id) || 0) + 1);
      function eligibility(entry) {
        const reasons = [...entry.score.reasons, ...entry.identity.reasons, ...entry.warnings];
        if (evaluationCounts.get(entry.identity.ref?.evaluation_id) > 1) reasons.push(reason('duplicate-evaluation-id', 'record_identity.evaluation_id'));
        for (const key of CONDITION_KEYS) if (!entry.conditions[key].known) reasons.push(reason('unknown-condition', key));
        return reasons;
      }
      const anchorReasons = eligibility(anchor);
      const rows = index.entries.map(entry => {
        const excluded = eligibility(entry);
        if (anchorReasons.length) excluded.push(reason('ineligible-anchor', 'anchor', { key: anchorKey }));
        for (const field of ['schema_id', 'schema_version', 'calculation_version']) if (entry.raw.sample.sampleData[field] !== anchor.raw.sample.sampleData[field]) excluded.push(reason('different-schema', field));
        for (const field of ['lot_id', 'roast_batch_id']) if (entry.identity.ref?.[field] !== anchor.identity.ref?.[field]) excluded.push(reason('different-cohort', field));
        // A reused/imported lot ID cannot override conflicting declared lot metadata.
        for (const field of ['farm_id', 'producer_id', 'crop_year', 'process']) if (entry.identity.ref?.lot_id === anchor.identity.ref?.lot_id && entry.identity.ref?.[field] !== anchor.identity.ref?.[field]) excluded.push(reason('different-lot-metadata', field));
        for (const field of CONDITION_KEYS) if (entry.conditions[field].known && anchor.conditions[field].known && !same(entry.conditions[field], anchor.conditions[field])) excluded.push(reason('different-condition', field));
        return { key: entry.key, entry, excluded };
      });
      const included = rows.filter(row => !row.excluded.length), excluded = rows.filter(row => row.excluded.length);
      const byEvaluator = new Map();
      for (const row of included) if (row.entry.evaluator.status === 'proven') {
        const uid = row.entry.evaluator.uid;
        if (!byEvaluator.has(uid)) byEvaluator.set(uid, []);
        byEvaluator.get(uid).push(row);
      }
      const evaluators = [...byEvaluator].map(([uid, records]) => ({ uid, recordCount: records.length, repeatCount: records.length - 1,
        totals: stats(records.map(row => row.entry.score.total)), fields: Object.fromEntries(M.SCORES.map(field => [field, stats(records.map(row => row.entry.raw.sample.sampleData[field]))])) }));
      const evaluatorMeans = stats(evaluators.map(evaluator => evaluator.totals.mean));
      for (const evaluator of evaluators) evaluator.deviationFromEvaluatorMean = evaluator.totals.mean - evaluatorMeans.mean;
      const unknownAttributionCount = included.filter(row => row.entry.evaluator.status !== 'proven').length;
      const n = evaluators.length;
      return { anchorKey, anchorReasons, included, excluded, conditionKeys: [...CONDITION_KEYS],
        recordCount: included.length, n, nLabel: `확인된 서로 다른 평가자 n=${n}`, unknownAttributionCount,
        repeatCount: evaluators.reduce((sum, evaluator) => sum + evaluator.repeatCount, 0), evaluators,
        recordTotals: stats(included.map(row => row.entry.score.total)), evaluatorMeans,
        scoreFields: Object.fromEntries(M.SCORES.map(field => [field, stats(included.map(row => row.entry.raw.sample.sampleData[field]))])),
        missingScope: 'all-index-records', missingByField: Object.fromEntries(M.SCORES.map(field => [field, index.entries.filter(entry => entry.score.missing.includes(field)).length])),
        interpretation: { descriptiveOnly: true, teamConsensusEstablished: false, qualificationRanking: false, nIsProvenUniqueEvaluators: true,
          note: n === 1 ? 'n=1: 한 명의 기록이며 팀 합의로 해석하지 않습니다.' : n === 0 ? '확인된 평가자 수는 0입니다. 미확인 기록으로 참여자 수를 추정하지 않습니다.' : '범위·분산·개인 편차는 기술 통계이며 합의의 신뢰도 또는 평가자 자격 순위가 아닙니다.',
          recordWeighting: '각 평가 이벤트를 1회로 집계', evaluatorWeighting: '확인된 평가자별 평균에 동일 가중치; 미확인 평가자는 제외',
          unknownRepeats: unknownAttributionCount ? '미확인 평가자 기록의 반복 여부는 알 수 없음' : null } };
    }
    return { buildIndex, fromSessions, search, compare, resolveFlavor, conditionKeys: [...CONDITION_KEYS] };
  }
  return { create, stats };
});
