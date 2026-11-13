'use strict';
globalThis.KnowledgeModel=Object.freeze({
 raw(data,kind,value){
  if(value==null||value==='')return null;
  const key=kind==='variety'?'variety_dictionary':kind==='process'?'process_value_links':'claim_term_dictionary';
  return (data?.[key]||[]).find(row=>row.raw===value)||null;
 },
 guide(data,continent){return (data?.regional_guides||[]).filter(g=>!continent||g.continent_key===continent)},
 related(row){return {farms:row?.related_farm_ids||row?.farm_ids||row?.archive_farm_ids||[],lots:row?.related_lot_ids||row?.lot_ids||row?.archive_lot_ids||[]}},
 scopes(claim){return claim?.applies_to?.evidence_scopes||[]},
 valid(data,sources,revision){
  const arrays=['regional_guides','process_dictionary','process_value_links','variety_dictionary','variety_reference_profiles','claim_term_dictionary','sensory_explanations','flavor_examples','processing_case_examples','sensory_attribute_definitions','conflicts','boundaries_ko'];
  const records=arrays.slice(0,9),objects=rows=>rows.every(row=>row&&typeof row==='object'&&!Array.isArray(row)&&typeof row.id==='string');
  return !!(data&&sources&&data.namespace==='coffee-t8cdf6031'&&sources.namespace===data.namespace&&data.baseline_revision===revision&&data.claim_scope_contract?.version==='evidence_scopes_v1'&&arrays.every(key=>Array.isArray(data[key]))&&records.every(key=>objects(data[key]))&&data.regional_guides.every(row=>Array.isArray(row.reference_guide)&&Array.isArray(row.country_examples))&&data.process_dictionary.every(row=>row.axes&&Array.isArray(row.claims))&&data.variety_reference_profiles.every(row=>row.fields&&typeof row.fields==='object')&&data.sensory_explanations.every(row=>Array.isArray(row.claims))&&Array.isArray(sources.sources)&&objects(sources.sources)&&sources.sources.every(row=>Array.isArray(row.evidence_quotes)&&objects(row.evidence_quotes)));
 }
});
