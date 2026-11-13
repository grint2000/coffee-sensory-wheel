'use strict';
// UI geography only: no change to archival country IDs or source records.
globalThis.ArchiveExplore=Object.freeze({
  mapping:Object.freeze({GT:'north',HN:'north',PE:'south',ET:'africa'}),
  continents:Object.freeze([['north','북아메리카 · 중앙아메리카 포함'],['south','남아메리카'],['africa','아프리카'],['asia','아시아'],['europe','유럽'],['oceania','오세아니아'],['antarctica','남극'],['unclassified','미분류']]),
  continent(country){return this.mapping[country?.iso2]||'unclassified'},
  farms(data,continent='',country=''){
    const countries=new Map(data.countries.map(c=>[c.id,c]));
    return data.farms.filter(f=>(!continent||this.continent(countries.get(f.country_id))===continent)&&(!country||f.country_id===country));
  },
  varieties(data,continent=''){
    const farms=new Map(this.farms(data,continent).map(f=>[f.id,f]));
    const groups=new Map();
    for(const lot of data.lots){
      const farm=farms.get(lot.farm_id);if(!farm)continue;
      // Exact structured value, never split mixtures or parse narrative claims.
      const raw=lot.variety||'';
      if(!groups.has(raw))groups.set(raw,{raw,farmIds:new Set(),countryIds:new Set(),lotIds:[],sourceIds:new Set()});
      const row=groups.get(raw);row.farmIds.add(farm.id);row.countryIds.add(farm.country_id);row.lotIds.push(lot.id);
      for(const id of lot.source_ids||[])row.sourceIds.add(id);
    }
    return [...groups.values()].map(r=>({...r,farmIds:[...r.farmIds],countryIds:[...r.countryIds],sourceIds:[...r.sourceIds]})).sort((a,b)=>a.raw.localeCompare(b.raw));
  }
});
