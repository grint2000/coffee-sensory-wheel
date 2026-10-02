/** CP-13 isolated review model. No OCR engine, storage, network or app writes. */
export const FIELD_KEYS = Object.freeze(['name', 'lot', 'crop', 'process', 'code']);
export const VERSION = 'cp13-explicit-label-review-v1';
export function describeReviewText(originalText,reviewText) {
  if(typeof originalText!=='string'||typeof reviewText!=='string')return {normalizedLineEndings:false,reviewTextEdited:null};
  const lf=text=>text.replace(/\r\n?/g,'\n');
  return {normalizedLineEndings:originalText.includes('\r')&&!reviewText.includes('\r'),reviewTextEdited:lf(originalText)!==lf(reviewText)};
}
const ALIASES = {
  name: ['품명', '제품명', '상품명', '커피명', '시료명', 'sample name', 'coffee name', 'product name', 'name', 'coffee', 'product'],
  lot: ['로트', '로트 번호', '로트번호', 'lot number', 'lot no.', 'lot no', 'lot id', 'lot'],
  crop: ['크롭', '크롭 연도', '크롭연도', '수확 연도', '수확연도', 'crop year', 'harvest year', 'crop'],
  process: ['가공', '가공 방식', '가공방식', '가공법', 'processing', 'process'],
  code: ['품목 코드', '품목코드', '제품 코드', '제품코드', '상품 코드', '상품코드', '코드', 'product code', 'item code', 'sku', 'code'],
};
const labelKey = value => value.toLowerCase().replace(/\s+/g, '');
const lookup = new Map(Object.entries(ALIASES).flatMap(([field, names]) => names.map(name => [labelKey(name), field])));
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '[\\t ]*').replace(/([가-힣])(?=[가-힣])/g, '$1[\\t ]*');
const labelPattern = new RegExp('^[\\t ]*(' + Object.values(ALIASES).flat().sort((a,b)=>b.length-a.length).map(escapeRegex).join('|') + ')[\\t ]*[:：=][\\t ]*', 'i');
const freeze = object => { if(object && typeof object==='object' && !Object.isFrozen(object)){Object.values(object).forEach(freeze);Object.freeze(object);}return object; };
const clone = object => JSON.parse(JSON.stringify(object));
const assert = (condition, message) => { if(!condition)throw new Error(message); };
function fieldWarnings(field, value, id) {
  const warnings=[];
  const add=(kind,message)=>warnings.push({id:`${id}:${kind}`,field,kind,message});
  // Identifier/year glyphs are never automatically corrected or case folded.
  const identifier=['lot','code','crop'].includes(field);
  if((identifier?/[0Oo]/:/[0O]/).test(value))add('zero-letter-o','0/O를 원본에서 확인하세요. 자동 치환하지 않았습니다.');
  if((identifier?/[1Il]/:/[1I]/).test(value))add('one-letter-i','1/I/l을 원본에서 확인하세요. 자동 치환하지 않았습니다.');
  if(field==='crop') {
    if(/202[56]/.test(value))add('year-2025-2026','2025/2026의 마지막 숫자를 원본에서 확인하세요. 연도를 추정하지 않았습니다.');
    const years=value.match(/\b\d{4}\b/g)||[];
    if(new Set(years).size>1 || /^\d{4}\s*[/-]\s*\d{2}$/.test(value))add('multiple-years','여러 연도 또는 크롭 구간이 보입니다. 하나의 연도로 임의 축약하지 않았습니다.');
    if(!/^\d{4}(?:\s*[/-]\s*(?:\d{4}|\d{2}))?$/.test(value))add('unverified-year-format','연도 표기가 확실하지 않습니다. 원문 확인 또는 직접 수정이 필요합니다.');
  }
  if(/[:：=]/.test(value))add('embedded-label','값 안에 다른 라벨이나 구분자가 있을 수 있습니다. 추출 범위를 확인하세요.');
  return warnings;
}
function sanitizeCatalog(catalog) {
  assert(Array.isArray(catalog),'INVALID_CATALOG');
  const ids=new Set();
  return catalog.map(entry=>{
    assert(entry && typeof entry.id==='string' && entry.id && typeof entry.code==='string','INVALID_CATALOG_ENTRY');
    assert(!ids.has(entry.id),'DUPLICATE_CATALOG_ID');ids.add(entry.id);
    const clean={id:entry.id,code:entry.code};
    for(const key of ['name','lot','crop','process'])clean[key]=typeof entry[key]==='string'?entry[key]:null;
    return clean;
  });
}
export function extractLabelCandidates(rawText) {
  assert(typeof rawText==='string','TEXT_REQUIRED');assert(rawText.length<=200000,'TEXT_TOO_LARGE');
  const candidates=Object.fromEntries(FIELD_KEYS.map(field=>[field,[]]));
  // Explicit field labels at line/semicolon/pipe boundaries only. Unlabelled
  // headings, dates, code substrings and catalogue metadata are not inferred.
  for(const line of rawText.matchAll(/[^\r\n]+/g)) {
    for(const segment of line[0].matchAll(/[^;|]+/g)) {
      const match=segment[0].match(labelPattern);if(!match)continue;
      const field=lookup.get(labelKey(match[1]));
      const remainder=segment[0].slice(match[0].length);const value=remainder.trim();if(!value)continue;
      const leftTrim=remainder.length-remainder.trimStart().length;
      const start=line.index+segment.index+match[0].length+leftTrim;const end=start+value.length;
      const id=`${field}:${start}:${end}`;
      candidates[field].push({id,field,value,source:{start,end,offsetUnit:'UTF-16-code-unit',text:rawText.slice(start,end),line:rawText.slice(0,start).split(/\r\n|\r|\n/).length,label:match[1]},uncertainties:fieldWarnings(field,value,id),status:'candidate'});
    }
  }
  for(const field of FIELD_KEYS)if(new Set(candidates[field].map(c=>c.value)).size>1) {
    for(const c of candidates[field])c.uncertainties.push({id:`${c.id}:conflicting-labels`,field,kind:'conflicting-labels',message:'같은 필드에 서로 다른 값이 있습니다. 사용할 값 또는 미확인을 직접 선택하세요.'});
  }
  return freeze({version:VERSION,rawText,candidates});
}
export function createLabelReview(rawText,{catalog=[],catalogVersion='unlinked'}={}) {
  assert(typeof catalogVersion==='string'&&catalogVersion,'CATALOG_VERSION_REQUIRED');
  return freeze({version:VERSION,revision:0,extraction:extractLabelCandidates(rawText),catalog:sanitizeCatalog(catalog),catalogVersion,decisions:Object.fromEntries(FIELD_KEYS.map(key=>[key,{kind:'pending'}])),catalogDecision:{kind:'pending'},staging:null});
}
export function chooseField(review,field,decision) {
  assert(FIELD_KEYS.includes(field),'UNKNOWN_FIELD');assert(decision&&typeof decision==='object','DECISION_REQUIRED');
  let selected;
  if(decision.kind==='candidate') {
    const candidate=review.extraction.candidates[field].find(c=>c.id===decision.candidateId);assert(candidate,'UNKNOWN_CANDIDATE');
    selected={kind:'candidate',candidateId:candidate.id,value:candidate.value,source:clone(candidate.source),uncertainties:clone(candidate.uncertainties)};
  }else if(decision.kind==='manual') {
    assert(typeof decision.value==='string'&&decision.value.trim()&&decision.value.length<=2000,'MANUAL_VALUE_REQUIRED');
    selected={kind:'manual',value:decision.value.trim(),source:{kind:'user-entered',originalCandidates:review.extraction.candidates[field].map(c=>c.id)},uncertainties:fieldWarnings(field,decision.value.trim(),`manual:${field}:${review.revision+1}`)};
  }else if(decision.kind==='unknown')selected={kind:'unknown',value:null,source:{kind:'user-kept-unknown'},uncertainties:[]};
  else throw new Error('INVALID_DECISION_KIND');
  return freeze({...review,revision:review.revision+1,decisions:{...review.decisions,[field]:selected},catalogDecision:{kind:'pending'},staging:null});
}
export function clearFieldChoice(review,field) {
  assert(FIELD_KEYS.includes(field),'UNKNOWN_FIELD');
  return freeze({...review,revision:review.revision+1,decisions:{...review.decisions,[field]:{kind:'pending'}},catalogDecision:{kind:'pending'},staging:null});
}
function decidedValues(review) { return Object.fromEntries(FIELD_KEYS.map(field=>[field,review.decisions[field].value??null])); }
function catalogConflicts(values,entry) {
  return ['name','lot','crop','process'].filter(field=>values[field]!==null&&entry[field]!==null&&values[field]!==entry[field]).map(field=>({field,labelValue:values[field],catalogValue:entry[field]}));
}
export function inspectCatalog(review) {
  const codeDecision=review.decisions.code;
  // Before the code is chosen, show exact proposals but keep selection disabled.
  const codes=codeDecision.kind==='pending'?review.extraction.candidates.code.map(c=>c.value):[codeDecision.value].filter(v=>v!==null);
  const values=decidedValues(review);
  const matches=review.catalog.filter(entry=>codes.includes(entry.code)).map(entry=>({...entry,matchReason:'exact-code',conflicts:catalogConflicts(values,entry)}));
  return freeze({status:matches.length>1?'selection-required':matches.length===1?'exact-code-candidate':'no-exact-code-match',codeChosen:codeDecision.kind!=='pending',matches,automaticSelection:false,automaticMerge:false});
}
export function chooseCatalog(review,decision) {
  assert(decision&&typeof decision==='object','CATALOG_DECISION_REQUIRED');
  let selected;
  if(decision.kind==='unlinked')selected={kind:'unlinked'};
  else if(decision.kind==='select') {
    assert(review.decisions.code.kind!=='pending','CHOOSE_CODE_FIRST');
    const entry=inspectCatalog(review).matches.find(e=>e.id===decision.id);assert(entry,'CATALOG_CODE_MUST_MATCH_EXACTLY');
    selected={kind:'select',id:entry.id,code:entry.code,conflicts:clone(entry.conflicts)};
  }else throw new Error('INVALID_CATALOG_DECISION');
  return freeze({...review,revision:review.revision+1,catalogDecision:selected,staging:null});
}
export function clearCatalogChoice(review) {
  return freeze({...review,revision:review.revision+1,catalogDecision:{kind:'pending'},staging:null});
}
export function requiredWarnings(review) {
  const warnings=FIELD_KEYS.flatMap(field=>review.decisions[field].uncertainties||[]);
  if(review.catalogDecision.kind==='select')for(const conflict of review.catalogDecision.conflicts)warnings.push({id:`catalog:${review.catalogDecision.id}:${conflict.field}`,kind:'catalog-conflict',field:conflict.field,message:'선택한 라벨 값과 카탈로그 값이 다릅니다. 자동 덮어쓰기/병합하지 않습니다.',...conflict});
  return freeze(warnings);
}
export function confirmLabelReview(review,{expectedRevision,confirmed=false,acknowledgedWarningIds=[]}={}) {
  assert(expectedRevision===review.revision,'STALE_REVIEW_REVISION');assert(confirmed===true,'EXPLICIT_CONFIRMATION_REQUIRED');
  assert(FIELD_KEYS.every(field=>review.decisions[field].kind!=='pending'),'CHOOSE_EACH_FIELD_OR_UNKNOWN');
  assert(review.catalogDecision.kind!=='pending','CHOOSE_CATALOG_OR_UNLINKED');
  assert(Array.isArray(acknowledgedWarningIds),'WARNING_ACKNOWLEDGEMENTS_REQUIRED');
  const warnings=requiredWarnings(review);const acknowledgements=new Set(acknowledgedWarningIds);
  assert(warnings.every(w=>acknowledgements.has(w.id)),'UNRESOLVED_UNCERTAINTIES');
  if(review.catalogDecision.kind==='select')assert(inspectCatalog(review).matches.some(e=>e.id===review.catalogDecision.id),'CATALOG_CODE_MUST_MATCH_EXACTLY');
  const staging={kind:'reviewed-label-staging-only',version:VERSION,reviewRevision:review.revision,originalText:review.extraction.rawText,fields:decidedValues(review),provenance:clone(review.decisions),catalogLink:review.catalogDecision.kind==='select'?{id:review.catalogDecision.id,code:review.catalogDecision.code,version:review.catalogVersion}:null,reviewedWarnings:clone(warnings),automaticMerge:false};
  return freeze({...review,staging});
}
export function replaceRawText(review,rawText) {
  return freeze({...createLabelReview(rawText,{catalog:review.catalog,catalogVersion:review.catalogVersion}),revision:review.revision+1});
}
