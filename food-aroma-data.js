/* Reference-food composition data. No coffee-detection gate or category fallback. */
(function(root,factory){const node=typeof module==='object'&&module.exports;const api=factory(node?require('./aroma-literature-data.js'):root.AromaLiteratureData);if(node)module.exports=api;else root.FoodAromaData=api;})(typeof globalThis!=='undefined'?globalThis:this,function(literature){
  'use strict';
  const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
  const sources={
    bozova2025:{
      short:'Bozova et al. (2025) · AIMS Agriculture and Food 10(1), 40–57',
      title:'The physico-chemical characteristics of peel essential oils of sweet orange with respect to cultivars, harvesting times and isolation methods',
      url:'https://doi.org/10.3934/agrfood.2025003',
      pdfUrl:'https://www.aimspress.com/aimspress-data/aimsagri/2025/1/PDF/agrfood-10-01-003.pdf#page=9',
      locator:'Table 7, p.48 (PDF p.9) · Navelina · 1. Harvest · CP; Methods §§2.1, 2.3, 2.5–2.6, pp.42–44',
      method:'GC-MS 동정 · FID 크로마토그램으로 상대 조성(%) 계산',verifiedOn:'2026-10-31'
    },
    fruitReview2013:{
      short:'El Hadi et al. (2013) · Molecules 18(7), 8200–8229',title:'Advances in Fruit Aroma Volatile Research',
      url:'https://doi.org/10.3390/molecules18078200',fullTextUrl:'https://pmc.ncbi.nlm.nih.gov/articles/PMC6270112/',
      locator:'§2.2 · 식품별 문단',method:'과일 향기 성분 종설 · 비교 가능한 정량값은 채택하지 않음',verifiedOn:'2026-10-31'
    }
  };
  const compound=(id,nameKo,nameOriginal,aliases=[])=>({id,nameKo,nameOriginal,aliases});
  const compounds={
    limonene:compound('limonene','리모넨','Limonene'),
    myrcene:compound('myrcene','베타-미르센','β-Myrcene',['beta-Myrcene']),
    pinene:compound('pinene','알파-피넨','α-Pinene',['alpha-Pinene']),
    sabinene:compound('sabinene','사비넨','Sabinene'),carene:compound('carene','델타-3-카렌','δ-3-Carene'),
    phellandrene:compound('phellandrene','베타-펠란드렌','β-Phellandrene'),
    terpinolene:compound('terpinolene','테르피놀렌','Terpinolene',['Terpinolen']),
    octanal:compound('octanal','옥탄알','Octanal'),decanal:compound('decanal','데칸알','Decanal'),
    linalool:compound('linalool','리날룰','Linalool'),geraniol:compound('geraniol','게라니올','Geraniol'),
    hexylAcetate:compound('hexylAcetate','아세트산 헥실','Hexyl acetate'),
    methylbutylAcetate:compound('methylbutylAcetate','아세트산 2-메틸부틸','2-Methylbutyl acetate'),
    ethylMethylbutanoate:compound('ethylMethylbutanoate','2-메틸부탄산 에틸','Ethyl 2-methylbutanoate'),
    isoamylAcetate:compound('isoamylAcetate','아세트산 이소아밀','Isoamyl acetate',['3-Methylbutyl acetate']),
    isobutylAcetate:compound('isobutylAcetate','아세트산 이소부틸','Isobutyl acetate',['2-Methylpropyl acetate']),
    furaneol:compound('furaneol','푸라네올','Furaneol',['2,5-Dimethyl-4-hydroxy-3(2H)-furanone']),
    mesifurane:compound('mesifurane','메시푸란','Mesifurane',['2,5-Dimethyl-4-methoxy-3(2H)-furanone']),
    hexenylAcetate:compound('hexenylAcetate','아세트산 (Z)-3-헥세닐','(Z)-3-Hexenyl acetate'),
    raspberryKetone:compound('raspberryKetone','라즈베리 케톤','Raspberry ketone',['4-(4-Hydroxyphenyl)-2-butanone']),
    alphaIonone:compound('alphaIonone','알파-이오논','α-Ionone'),betaIonone:compound('betaIonone','베타-이오논','β-Ionone'),
    ethylOctanoate:compound('ethylOctanoate','옥탄산 에틸','Ethyl octanoate'),ethylOctenoate:compound('ethylOctenoate','(E)-2-옥텐산 에틸','Ethyl (E)-2-octenoate')
  };
  const bases={
    'gc-fid-relative-composition':{label:'GC-FID 상대 조성순',units:['%'],note:'FID 크로마토그램의 상대 조성입니다. 실제 질량 함량이나 향 기여율이 아닙니다.'},
    'gc-ms-relative-area':{label:'GC-MS 피크 상대 면적순',units:['%'],note:'GC-MS 상대 피크 면적입니다. 실제 질량 함량이나 향 기여율이 아닙니다.'},
    'mass-concentration':{label:'농도순',units:['mg/kg','µg/kg','g/kg','mg/L','µg/L','g/L'],note:'같은 시료군·분석 기준·단위에서 보고된 농도를 비교합니다.'}
  };
  // Complete Table 7 column, not a preordered Top 3. Undefined is not a molecule.
  const orangeStudy={
    id:'bozova2025-navelina-harvest1-cp',sourceId:'bozova2025',verified:true,
    reference:{sourceId:'bozova2025',food:'스위트 오렌지 (Citrus sinensis)',cultivar:'Navelina',part:'껍질의 플라베도(flavedo)',state:'냉압착 정유 (CP)',harvest:'1차 수확 · 11월 10일',sampleGroup:'BATEM Kayaburnu · 2021–2022 및 2022–2023 생산 시즌의 해당 열 평균',column:'Table 7 · Navelina · 1. Harvest · CP',unit:'%',basis:'gc-fid-relative-composition',method:'Bozova2025-Methods2.5'},
    measurements:[
      {compoundId:'pinene',value:0.5,reported:'0.5'},{compoundId:'sabinene',value:0.2,reported:'0.2'},
      {compoundId:'carene',value:0.2,reported:'0.2'},{compoundId:'myrcene',value:2.0,reported:'2.0'},
      {compoundId:'limonene',value:96.4,reported:'96.4'},{compoundId:'phellandrene',value:0.3,reported:'0.3'},
      {compoundId:'terpinolene',value:0.1,reported:'0.1',originalLabel:'Terpinolen'},
      {compoundId:'octanal',value:0.1,reported:'0.1'},{compoundId:'decanal',value:0.1,reported:'0.1'},
      {compoundId:'linalool',value:0.1,reported:'0.1'},{originalLabel:'Undefined',kind:'unidentified',value:0.0,reported:'0.0'}
    ],
    conditions:[
      '시료: 같은 나무의 네 방향에서 수확한 과실, 당일 실험실 이송. 품종별 4개 수확 시기 중 1차만 사용합니다.',
      'CP: 플라베도를 갈아 수동 압착한 뒤 15,294 × g, 20 °C, 20분 원심분리해 정유를 분리합니다 (§2.3).',
      '정유를 헥산에 1:50 희석. Agilent 7890A GC / 5975C MS / FID; HP Innowax 60 m × 0.25 mm × 0.25 µm.',
      '헬륨 0.8 mL/min, 주입량 1 µL, split 50:1, 주입구 250 °C. EI 70 eV, m/z 35–500; WILEY/OIL ADAMS 및 C8–C40 기준 RRI로 동정.',
      '원문 온도 프로그램: 60 °C 10분 → 20 °C/min으로 250 °C → 250 °C 10.5분. 원문 총 분석시간은 60분으로 기재돼 프로그램과 산술상 일치하지 않으며 임의 보정하지 않았습니다.',
      '연구는 3반복, 분석은 2병행(§2.6). Table 7의 반올림된 보고값으로 계산하며 피크별 불확도·유의차 순위는 제시하지 않습니다.',
      '과즙·생과 전체·가열 주스·헤드스페이스와 다른 시료입니다. 모든 오렌지나 다른 감귤의 고정 순위로 일반화하지 않습니다.'
    ]
  };
  const representative=(reference,ids,locator)=>({reference,compoundIds:ids,sourceId:'fruitReview2013',locator,conditions:['종설에 명시된 해당 식품의 대표 향기 성분만 옮겼습니다. 비교 가능한 동일 시료군의 정량값은 채택하지 않았습니다.','품종·부위·성숙도·분석법에 따라 달라지며, 나열 순서는 함량 순위가 아닙니다.']});
  // Exact keys only: no copying Fuji to green/red apples or fruit families to children.
  const representatives={
    'Fruity|Other Fruit|Apple':representative({food:'사과',cultivar:'Fuji',part:'과실 · 부위 구분 미채택',state:'생과 향기 · 세부 처리 미채택'},['ethylMethylbutanoate','methylbutylAcetate','hexylAcetate'],'§2.2 사과 문단 · Fuji 및 [27]'),
    'Fruity|Other Fruit|Pear':representative({food:'배',cultivar:'단일 품종 미지정',part:'과실',state:'생과 향기 · 세부 처리 미지정'},['ethylOctanoate','ethylOctenoate'],'§2.2 배 문단 · sweet/fruity 성분 및 [34]'),
    'Fruity|Berry|Strawberry':representative({food:'딸기',cultivar:'단일 품종 미지정',part:'과실',state:'종설의 딸기 향기 자료'},['furaneol','mesifurane'],'§2.2 딸기 문단 · furanones 및 [47]'),
    'Fruity|Tropical Fruit|Banana':representative({food:'바나나',cultivar:'단일 품종 미지정',part:'과실',state:'종설의 fruity top-note 자료'},['isoamylAcetate','isobutylAcetate'],'§2.2 바나나 문단 · fruity top notes 및 [50]'),
    'Fruity|Stone Fruit|Peach':representative({food:'복숭아',cultivar:'단일 품종 미지정',part:'과실',state:'종설의 복숭아 향기 자료'},['hexylAcetate','hexenylAcetate'],'§2.2 복숭아 문단 · key odorants 및 [65]'),
    'Fruity|Other Fruit|Grape':representative({food:'포도 (Vitis vinifera)',cultivar:'적·백포도 자료 · 단일 품종 미지정',part:'과실',state:'종설의 유리 테르펜올 자료'},['linalool','geraniol'],'§2.2 포도 문단 · free terpenols 및 [72]'),
    'Fruity|Berry|Raspberry':representative({food:'라즈베리',cultivar:'red raspberry · 단일 품종 미지정',part:'과실',state:'종설의 라즈베리 향기 자료'},['raspberryKetone','alphaIonone','betaIonone'],'§2.2 라즈베리 문단 · important compounds 및 [76]')
  };
  Object.assign(sources,literature?.sources||{});
  const contextKeys=['sourceId','food','cultivar','part','state','harvest','sampleGroup','column','unit','basis','method'];
  function identify(row){
    if(row.compoundId)return compounds[row.compoundId]||null;
    const name=String(row.originalLabel||'').trim().toLowerCase();
    return Object.values(compounds).find(c=>[c.nameOriginal,...c.aliases].some(n=>n.toLowerCase()===name))||null;
  }
  function analyseStudy(study){
    const ref=study?.reference||{},basis=bases[ref.basis],issues=[];
    if(!study?.verified||!sources[study.sourceId]||ref.sourceId!==study.sourceId||!basis||!basis.units.includes(ref.unit)||contextKeys.some(k=>typeof ref[k]!=='string'||!ref[k].trim()))return {status:'unverified',entries:[],issues:['검증된 출처와 동일 시료군·단위·분석 기준이 필요합니다.']};
    const selected=new Map(),conflicts=new Set();let missing=false,incomparable=false;
    for(const row of study.measurements||[]){
      const context={...ref,...row.context};
      if(contextKeys.some(k=>context[k]!==ref[k])){incomparable=true;issues.push('시료군·부위·상태·단위·분석 기준이 다른 행은 비교하지 않습니다.');continue;}
      if(row.kind==='unidentified'||row.kind==='mixture'){issues.push(row.kind==='mixture'?'혼합·동시 용출 피크는 개별 분자로 분할하거나 순위에 넣지 않습니다.':'미동정 성분은 개별 분자 순위에 넣지 않습니다.');continue;}
      const c=identify(row);if(!c){missing=true;issues.push('성분명이 확인되지 않은 행이 있습니다.');continue;}
      const numeric=typeof row.value==='number'&&Number.isFinite(row.value)&&row.value>=0&&(ref.unit!=='%'||row.value<=100)&&(!row.qualifier||row.qualifier==='exact');if(!numeric)missing=true;
      const value=numeric?row.value:null,old=selected.get(c.id);
      if(old){if(old.value!==value){conflicts.add(c.id);issues.push('같은 성분의 중복 보고값이 달라 순위를 확정하지 않습니다.');}else issues.push('동의어로 중복된 같은 성분·값은 한 번만 표시합니다.');continue;}
      selected.set(c.id,{...c,value,reported:numeric&&typeof row.reported==='string'&&Number(row.reported)===value?row.reported:numeric?String(value):null,unit:ref.unit,rank:null,tied:false});
    }
    if(incomparable)return {status:'unverified',entries:[],issues:[...new Set(issues)]};
    const entries=[...selected.values()].map(e=>conflicts.has(e.id)?{...e,value:null,reported:null}:e);
    if(!entries.length)return {status:'unverified',entries:[],issues:[...new Set(issues)]};
    if(missing||conflicts.size)return {status:'representative',entries:entries.slice(0,3),issues:[...new Set([...issues,'결측·검출한계·충돌값 때문에 전체 성분량 순위는 미확정입니다.'])],basisLabel:basis.label,basisNote:basis.note};
    entries.sort((a,b)=>b.value-a.value||a.nameOriginal.localeCompare(b.nameOriginal));
    entries.forEach((e,i)=>{e.rank=i&&e.value===entries[i-1].value?entries[i-1].rank:i+1;e.tied=entries.filter(other=>other.value===e.value).length>1;});
    if(entries.filter(e=>e.rank<=3).length>3)issues.push('공동 순위가 있어 최대 3개까지만 표시합니다. 같은 순위의 다른 성분도 있습니다.');
    return {status:'verified-ranking',entries:entries.filter(e=>e.rank<=3).slice(0,3),issues:[...new Set(issues)],basisLabel:basis.label,basisNote:basis.note};
  }
  const orderingBases={
    composition:{label:'조성 순위',note:'원문의 조성·농도 기준 순서입니다. GC 상대 조성은 실제 질량 함량이나 향 기여율이 아닙니다.'},
    'odor-activity':{label:'향활성도(OAV) 순위',note:'OAV는 농도를 냄새 역치로 나눈 값입니다. 함량·조성 비율이나 향 기여율(%)이 아닙니다.'},
    'flavor-dilution':{label:'향 희석 분석(FD) 순위',note:'FD는 GC-O에서 냄새가 감지된 최종 희석배수입니다. 함량·농도 순위가 아닙니다.'}
  };
  // Source order must be explicit. Neither array position nor a representative list creates a rank.
  function analyseLiterature(profile){
    const order=profile.ordering,basis=orderingBases[order?.basis];
    const entries=(profile.entries||[]).slice(0,3).map(e=>({
      ...e,reference:e.reference||profile.reference,value:e.value??null,
      reported:e.reported??null,unit:e.unit??null,rank:null,tied:false
    }));
    const reference=profile.reference||{};
    const sameContext=entries.every(e=>{
      if(!e.reference||!e.citations?.length)return false;
      const fields=new Set([...Object.keys(reference),...Object.keys(e.reference)]);
      if([...fields].some(k=>e.reference[k]!==reference[k]))return false;
      if(!e.citations.every(c=>c.sourceId===profile.sourceId&&sources[c.sourceId]))return false;
      if(e.value===null)return true; // A verified source order does not require amounts.
      const unitMatches=order?.basis==='odor-activity'?e.unit==='OAV':order?.basis==='flavor-dilution'?e.unit==='FD':!!e.unit;
      return typeof e.value==='number'&&Number.isFinite(e.value)&&e.value>=0&&
        e.reported!==null&&Number(e.reported)===e.value&&unitMatches;
    });
    const units=new Set(entries.map(e=>e.unit).filter(Boolean));
    const identities=new Set(entries.map(e=>e.id));
    const ranked=!!(entries.length&&units.size<=1&&identities.size===entries.length&&
      sameContext&&basis&&order.verified===true&&order.contextId&&order.evidence&&
      entries.every(e=>e.kind!=='mixture'&&Number.isInteger(e.sourceRank)&&e.sourceRank>=1&&e.sourceRank<=3));
    if(ranked){entries.sort((a,b)=>a.sourceRank-b.sourceRank);entries.forEach(e=>{e.rank=e.sourceRank;e.tied=entries.some(other=>other!==e&&other.sourceRank===e.sourceRank);});}
    return {status:ranked?'verified-ranking':'representative',entries,basisLabel:ranked?(order.label||basis.label):'대표 향기 성분 · 순위 미확정',basisNote:ranked?basis.note:'문헌에서 주요 성분임을 확인했습니다. 나열 순서는 순위가 아닙니다.',issues:[]};
  }
  function annotated(entries,ref,sourceId,locator){return entries.slice(0,3).map(e=>({...e,kind:e.kind||'compound',reference:ref,description:e.description||`${ref.food}의 ${ref.part} · ${ref.state} 자료에서 확인된 주요 향기 성분입니다.`,citations:[{sourceId,locator}]}));}
  function resolve(key,record){
    key=String(key||'');
    const base={key,foodName:record?.[6]||record?.[2]||key.split('|').pop(),note:'참고 재료의 분석 자료이며 현재 커피의 측정 결과는 아닙니다.',entries:[],sources:[],conditions:[],issues:[]};
    if(!record||record.slice(0,3).join('|')!==key)return {...base,status:'unverified',reason:'등록된 향미 항목을 확인하지 못했습니다.'};
    if(key==='Fruity|Citrus Fruit|Orange'){
      const analysis=analyseStudy(orangeStudy);
      return {...base,...analysis,entries:annotated(analysis.entries,orangeStudy.reference,orangeStudy.sourceId,sources[orangeStudy.sourceId].locator),reference:orangeStudy.reference,datasetId:orangeStudy.id,sources:[sources[orangeStudy.sourceId]],conditions:orangeStudy.conditions,scopeNote:analysis.status==='verified-ranking'?'Navelina·1차 수확·CP 시료에서 동정된 개별 성분 내 순위입니다. 오렌지 전체의 고정 순위가 아닙니다.':'Navelina·1차 수확·CP 자료의 순위를 확정하지 못했습니다.'};
    }
    const profile=literature?.profiles?.[key];
    if(profile){const analysis=analyseLiterature(profile);return {...base,...analysis,reference:profile.reference,sources:[{...sources[profile.sourceId],locator:profile.locator}],conditions:[profile.reviewNote,'품종·부위·가공·분석법에 따라 조성과 향활성은 달라집니다.'].filter(Boolean)};}
    const rep=representatives[key];
    if(rep)return {...base,status:'representative',reference:rep.reference,entries:annotated(rep.compoundIds.map(id=>({...compounds[id],value:null,reported:null,unit:null,rank:null,tied:false})),rep.reference,rep.sourceId,rep.locator),basisLabel:'대표 향기 성분 · 순위 미확정',reason:'문헌에서 주요 성분을 확인했으며 순서는 입증되지 않았습니다.',sources:[{...sources[rep.sourceId],locator:rep.locator}],conditions:rep.conditions};
    return {...base,status:'pending',reason:'업데이트 예정 · 이 참고 재료에 맞는 신뢰할 수 있는 문헌 자료를 검토하고 있습니다.',basisLabel:'아직 확인되지 않음'};
  }
  freeze(sources);freeze(compounds);freeze(orangeStudy);freeze(representatives);freeze(bases);freeze(literature);freeze(orderingBases);
  return {sources,compounds,orangeStudy,representatives,analyseStudy,analyseLiterature,resolve};
});
