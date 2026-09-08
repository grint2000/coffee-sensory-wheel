/* Reference aromas only. Exact note keys; never inherit a parent profile.
 * Values and ordering are local to the cited sample, not universal sensory ranks.
 * Historical coffee evidence is preserved separately in flavor-evidence.js.
 */
(function (root) {
  'use strict';
  const sources = {
    strawberry: { title: 'Quantification of Selected Aroma-Active Compounds in Strawberries by Headspace Solid-Phase Microextraction Gas Chromatography and Correlation with Sensory Descriptive Analysis', authors: 'R. R. Jetti, E. Yang, A. Kurnianta, C. Finn, M. C. Qian', year: 2007, url: 'https://doi.org/10.1111/j.1750-3841.2007.00445.x', access: '원문 확인' },
    pineapple: { title: 'Odor-Active Constituents in Fresh Pineapple (Ananas comosus [L.] Merr.) by Quantitative and Sensory Evaluation', authors: 'Yukiko Tokitomo, Martin Steinhaus, Andrea Büttner, Peter Schieberle', year: 2005, url: 'https://doi.org/10.1271/bbb.69.1323', access: '원문 확인' },
    rose: { title: 'Assessment of the key aroma compounds in rose-based products', authors: 'Cai-Yun Zhao, Jie Xue, Xu-Dong Cai, Jing Guo, Biao Li, Shun Wu', year: 2016, url: 'https://doi.org/10.1016/j.jfda.2016.02.013', access: '원문 확인' },
    peach: { title: 'Characterization of the key aroma compounds in peach by gas chromatography–olfactometry, quantitative measurements and sensory analysis', authors: 'JianCai Zhu, ZuoBing Xiao', year: 2019, url: 'https://doi.org/10.1007/s00217-018-3145-x', access: '출판사 초록 확인; 세부 실험조건은 원문 추가 확인 필요' },
    cinnamon: { title: 'Characterization of key flavor compounds in cinnamon bark oil extracts using principal component analysis', authors: 'Jiahao Xing, Cheng Yang, Lianfu Zhang', year: 2025, url: 'https://doi.org/10.1016/j.foodres.2024.115446', access: '논문 초록 확인; 세부 실험조건은 원문 추가 확인 필요' },
    raspberry: { title: 'Aroma extract dilution analysis of cv. Meeker (Rubus idaeus L.) red raspberries from Oregon and Washington', authors: 'K. Klesk, M. Qian, R. R. Martin', year: 2004, url: 'https://doi.org/10.1021/jf0498721', access: '원문 확인' }
  };
  const molecule = (name, odor, measurement = '') => ({ name, odor, measurement });
  const profiles = {
    strawberry: {
      status: 'identified', source: 'strawberry',
      sample: 'California·Oregon산 완숙 딸기 10품종, 2004년 수확',
      conditions: '개별 급속냉동 −37°C, −23°C 보관 후 9개월 이내 분석. 생과일 전체를 대표하는 보편적 조성표가 아닙니다.',
      method: 'HS-SPME GC 정량·내부표준, OAV 계산, 훈련 패널의 묘사분석과 상관 비교',
      findings: '연구에서 대체로 높은 OAV를 보인 여러 성분 중 에스터와 푸라논 계열의 예시 3개를 선택했습니다. 품종을 통합한 1·2·3위가 아닙니다.',
      limit: '선택 정량 성분과 냉동 시료 범위의 결과입니다. 다른 주요 성분도 있으며, 품종별 OAV 및 함량 순서는 다릅니다.',
      molecules: [molecule('Ethyl butanoate', '과일 같은 달콤한 향'), molecule('Mesifurane', '달콤한 캐러멜·과일 향'), molecule('Ethyl hexanoate', '과일 향')]
    },
    pineapple: {
      status: 'ranked', source: 'pineapple', rankBasis: 'OAV 기준 · 해당 시료의 정량 성분 12종 중',
      sample: '완숙 Dole Super Sweet (F-2000) 생파인애플',
      conditions: '독일 Garching에서 구입한 시료; 관능 비교에 일본 Yamanashi에서 구입한 같은 품종도 사용.',
      method: 'SAFE·AEDA, 안정동위원소 희석 정량(SIDA), 물에서의 후각 역치, 향 재구성·생략 실험',
      findings: 'OAV = 정량 농도 / 물에서의 후각 역치. OAV는 무차원이며 실제 혼합 향의 감각 기여도 순위와 동일하지 않습니다.',
      limit: '이 품종·시료의 선택 정량 12종 내 순서입니다. 모든 파인애플이나 건조·구운 파인애플에 적용하지 않습니다.',
      molecules: [molecule('Furaneol (HDF)', '달콤한 파인애플·캐러멜 향', 'OAV 2680; 농도 26800 µg/kg'), molecule('Ethyl 2-methylpropanoate', '달콤한 과일 향', 'OAV 2400; 농도 48 µg/kg'), molecule('Ethyl 2-methylbutanoate', '과일 향', 'OAV 1050; 농도 157 µg/kg')],
      rankValues: [2680, 2400, 1050]
    },
    rose: {
      status: 'identified', source: 'rose', sample: '장미의 저온 추출물(LTE)',
      conditions: '25°C 추출물. 고온 추출물 및 장미 음료와 비교한 연구이며 생화의 헤드스페이스 측정과 다릅니다.',
      method: 'GC-MS·GC-O, 정량 및 물의 후각 역치 기반 OAV 비교',
      findings: '저온 추출물의 핵심 향기성분으로 보고된 성분 중 3개를 제시합니다. Eugenol도 보고됐습니다. 높은 OAV와 GC-O 결과가 일치하지 않는 성분이 있어 숫자 순위를 사용하지 않습니다.',
      limit: '추출물에 한정된 주요 성분 예시입니다. 장미 색상·품종별 보편적인 상위 3종을 뜻하지 않습니다.',
      molecules: [molecule('2-Phenylethanol', '장미 같은 꽃 향'), molecule('Citronellol', '장미·시트러스 계열 향'), molecule('Geraniol', '장미 같은 달콤한 꽃 향')]
    },
    peach: {
      status: 'identified', source: 'peach', sample: '복숭아 5품종: Chongyanghong, Ruiguang 19, Zaohongxia, Zaohong 2, Wuyuehuo',
      conditions: '숙도·보관·추출 세부조건은 확인한 초록에 충분히 제시되지 않았습니다.',
      method: 'GC-O·GC-MS·GC-FPD, 정량, OAV 및 관능분석',
      findings: '초록에 높은 OAV로 보고된 여러 성분 중 3개를 제시합니다. 수치는 품종 간 범위이며 같은 시료의 순위가 아닙니다.',
      limit: '해당 5품종 범위의 결과입니다. 백도·황도·납작복숭아에 자동 적용하지 않습니다. 원문 세부조건 추가 확인이 필요합니다.',
      molecules: [molecule('γ-Decalactone', '복숭아 같은 달콤한 과일 향', 'OAV 13–34'), molecule('Hexanal', '풋풀·초록 잎 향', 'OAV 28–89'), molecule('(R)-(−)-Linalool', '꽃 향', 'OAV 29–76')]
    },
    cinnamon: {
      status: 'identified', source: 'cinnamon', sample: 'Cinnamomum verum 및 C. cassia 수피의 식용유 추출물',
      conditions: '수피 자체의 공기 중 향과 동일한 시료가 아닙니다. 세부 추출조건은 원문 추가 확인이 필요합니다.',
      method: 'HS-SPME GC-MS, PCA, GC-O·OAV',
      findings: '초록에서 확인된 핵심 성분 중 trans-cinnamaldehyde를 표시합니다. 종별·시료별 정량 순서를 확인하지 못해 순위를 붙이지 않습니다.',
      limit: '식용유 추출물 연구 범위이며 모든 시나몬 제품의 조성 또는 함량 비율을 뜻하지 않습니다.',
      molecules: [molecule('trans-Cinnamaldehyde', '시나몬 특유의 따뜻하고 매운 향')]
    },
    raspberry: {
      status: 'identified', source: 'raspberry', sample: '미국 Oregon·Washington산 Meeker 레드 라즈베리 추출물',
      conditions: '산지별 같은 품종 비교. 다른 라즈베리 품종이나 가공품을 대표하지 않습니다.',
      method: 'GC-O·GC-MS, 향 추출물 희석분석(AEDA)',
      findings: '두 산지에서 향기활성이 높게 관찰된 성분의 예시입니다. FD와 함량·OAV·실제 감각 기여도를 동일하게 취급하지 않습니다.',
      limit: 'AEDA 결과에서 선택한 주요 성분이며 세 분자 사이의 보편적 기여도 순서는 미확정입니다.',
      molecules: [molecule('β-Ionone', '제비꽃 같은 꽃 향'), molecule('Linalool', '꽃 향'), molecule('Geraniol', '장미 같은 꽃 향')]
    }
  };
  const mapping = {
    'Fruity|Berry|Strawberry': 'strawberry',
    'Fruity|Berry|Raspberry': 'raspberry',
    'Fruity|Stone Fruit|Peach': 'peach',
    'Fruity|Tropical Fruit|Pineapple': 'pineapple',
    'Fruity|Tropical Fruit|Fresh Pineapple': 'pineapple',
    'Floral|Colored Flowers|Rose': 'rose',
    'Spices|Warm Spices|Cinnamon': 'cinnamon'
  };
  // Exact reference equivalence only: generic Pineapple uses the explicitly labelled fresh sample.
  const excludedNames = new Set(['Citric Acid', 'Malic Acid', 'Tartaric Acid', 'Phosphoric Acid', 'Lactic Acid']);
  function getFlavorReference(key) {
    if (mapping[key]) return { ...profiles[mapping[key]], study: sources[profiles[mapping[key]].source] };
    if (excludedNames.has(key.split('|')[2])) return { status: 'excluded', molecules: [], reason: '맛(산미)을 나타내는 항목으로, 이번 향기분자 사전의 적용 대상에서 제외합니다.' };
    return { status: 'pending', molecules: [], reason: '이 세부 대상의 주요 향기분자를 뒷받침하는 원문 연결이 아직 완료되지 않았습니다. 가공 상태·품종·제품 범위를 확인한 뒤 추가합니다.' };
  }
  root.FLAVOR_REFERENCE = { sources, profiles, mapping, get: getFlavorReference };
  root.getFlavorReference = getFlavorReference;
})(typeof window !== 'undefined' ? window : globalThis);
