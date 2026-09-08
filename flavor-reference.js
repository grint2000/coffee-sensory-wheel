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
  // Expansion records are explicit reference samples, never category defaults.
  function add(id, keys, study, sample, conditions, method, findings, limit, molecules, ranking) {
    sources[id] = { ...study, access: study.access || '논문 초록 확인; 원문 세부조건 추가 확인 필요' };
    profiles[id] = { status: ranking ? 'ranked' : 'identified', source: id, sample, conditions, method, findings, limit, molecules, ...ranking };
    keys.forEach(key => { if (mapping[key]) throw new Error('Duplicate reference: ' + key); mapping[key] = id; });
  }
  const study = (title, authors, year, doi, access) => ({title, authors, year, url: 'https://doi.org/' + doi, access});
  add('vanilla', ['Sweet|Vanilla|Vanilla', 'Sweet|Vanilla|Vanilla Bean'],
    study('Key Odorants in Cured Madagascar Vanilla Beans (Vanilla planiforia) of Differing Bean Quality', 'Makoto Takahashi, Yoko Inai, Norio Miyazawa, Yoshiko Kurobayashi, Akira Fujita', 2013, '10.1271/bbb.120842'),
    '마다가스카르 큐어링 바닐라빈: red whole과 cuts 등급 비교', '큐어링된 빈의 연구이며 생꼬투리·바닐라향 제품에 일반화하지 않습니다.',
    '향기성분 정량·관능 비교·향 재구성', 'Vanillin과 β-damascenone은 달콤함·건과일 향의 등급 간 차이에 기여했습니다. 전체 재구성 향과 원시료도 비교했습니다.',
    '두 주요 성분을 제시합니다. 세 번째 성분이나 보편적 순위를 추정하지 않습니다.',
    [molecule('Vanillin', '달콤한 바닐라 향'), molecule('β-Damascenone', '건과일 같은 향')]);
  add('hazelnutRaw', ['Nutty/Cocoa|Tree Nuts|Hazelnut'],
    study('Characterization of the Key Odorants in Raw Italian Hazelnuts (Corylus avellana L. var. Tonda Romana) and Roasted Hazelnut Paste by Means of Molecular Sensory Science', 'Andrea Burdack-Freitag, Peter Schieberle', 2012, '10.1021/jf300908d'),
    '이탈리아 Tonda Romana 생헤이즐넛', '구운 페이스트와 별도로 분석한 생견과 시료입니다.',
    'GC-O·AEDA 선별, 19성분 SIDA 정량, 기름 역치 기반 OAV, 해바라기유 모델 재구성',
    '높은 OAV로 보고된 성분 중 3개입니다. OAV > 1인 13성분 재구성 향이 생견과의 향과 유사했습니다.',
    '한 품종의 생견과 결과로 로스팅 헤이즐넛에 적용하지 않습니다. 개별 OAV 순서는 미확정입니다.',
    [molecule('Linalool', '꽃 향'), molecule('5-Methyl-4-heptanone', '견과·과일 계열 향'), molecule('2-Methoxy-3,5-dimethylpyrazine', '흙 계열 향')]);
  add('hazelnutRoasted', ['Nutty/Cocoa|Tree Nuts|Roasted Hazelnut'], sources.hazelnutRaw,
    '이탈리아 헤이즐넛의 구운 페이스트', '로스팅 시간·온도는 확인한 초록에서 확인되지 않았습니다.',
    '25성분 SIDA 정량, OAV, 19성분 향 재구성',
    '높은 OAV로 보고된 성분 중 맥아·버터·팝콘 향을 대표하는 3개입니다. 재구성 향은 페이스트와 매우 유사했습니다.',
    '페이스트 시료의 결과이며 모든 로스팅 강도를 대표하지 않습니다. 순위는 미확정입니다.',
    [molecule('3-Methylbutanal', '맥아 향'), molecule('2,3-Pentanedione', '버터 향'), molecule('2-Acetyl-1-pyrroline', '팝콘 향')]);
  add('oolong', ['Tea|Oolong|Oolong', 'Tea|Oolong|Ti Kuan Yin', 'Tea|Oolong|Da Hong Pao'],
    study('Comparison of Aroma-Active Volatiles in Oolong Tea Infusions Using GC-Olfactometry, GC-FPD, and GC-MS', 'JianCai Zhu, Feng Chen, LingYing Wang, YunWei Niu, Dan Yu, Chang Shu, HeXing Chen, HongLin Wang, ZuoBing Xiao', 2015, '10.1021/acs.jafc.5b02358'),
    'Dongdingwulong·Tieguanyin·Dahongpao 우롱차 침출액 비교', '세 차종의 범위값입니다. 개별 상품·수확·우림 조건별 값은 원문 추가 확인이 필요합니다.',
    'GC-O 향강도, SPME GC-MS·GC-FPD 정량, OAV',
    '높은 OAV 성분 중 꽃·과일 계열 3개의 예시입니다. 다른 알데하이드·황 성분도 중요하며 이 세 가지가 전체 TOP3라는 뜻은 아닙니다.',
    '철관음·대홍포는 연구에 실제 포함된 대상입니다. 아래 값은 세 시료 범위로, 해당 차종 단독 수치나 순위가 아닙니다. 밀크우롱에는 적용하지 않습니다.',
    [molecule('Nerolidol', '꽃·우디 계열 향', '세 시료 OAV 108–184'), molecule('(R)-(−)-Linalool', '꽃 향', '세 시료 OAV 63–87'), molecule('β-Damascenone', '달콤한 과일 향', '세 시료 OAV 29–59')]);
  add('blueberry', ['Fruity|Berry|Blueberry'],
    study('Characterization of Changes in Key Odorants in Blueberries During Simulated Commercial Storage and Marketing by Sensory-Directed Flavor Analysis and Determination of Differences in Overall Perceived Aroma', 'Fareeya Kulapichitr, Keith Cadwallader, David Obenland', 2025, '10.3390/foods14071244', '저자 소속 USDA의 기술 초록 확인; 출판사 원문 접근 제한'),
    '유통 보관을 모사한 블루베리 시료', '1°C 3주 → 10°C 1주 → 20°C 2일. 품종은 확인한 기술 초록에 제시되지 않았습니다.',
    'GC-O·AEDA, 동위원소 희석 GC-MS 정량, OAV와 관능 평가',
    '보관에 따라 달라진 주요 향기성분 중 꽃·풋풀·버섯 계열의 예시입니다.',
    '보관 단계별 함량 변화 연구입니다. 세 성분의 보편적 순위나 건조 블루베리의 조성을 뜻하지 않습니다.',
    [molecule('Linalool', '꽃 향'), molecule('(Z)-3-Hexenal', '풋풀 향'), molecule('1-Octen-3-ol', '버섯 같은 향')]);
  add('blackPepper', ['Spices|Hot Spices|Black Pepper'],
    study('Flavour and off-flavour compounds of black and white pepper (Piper nigrum L.) II. Odour activity values of desirable and undesirable odorants of black pepper', 'T. Jagella, W. Grosch', 1999, '10.1007/s002170050450'),
    '흑후추 및 분쇄 흑후추의 저장 비교', '실온 30일 저장 비교 포함. 산지·품종은 초록에 충분히 제시되지 않았습니다.',
    '14성분 정량·OAV, 향 재구성·생략 시험',
    '생략 시험에서 확인된 주요 성분 중 저장 중 손실과 향 변화가 연결된 3개입니다.',
    '향기 정보입니다. 매운 자극의 강도·피페린 함량 순위가 아니며 백후추에 자동 적용하지 않습니다.',
    [molecule('α-Pinene', '테르펜·솔 계열 향'), molecule('Limonene', '시트러스 향'), molecule('3-Methylbutanal', '맥아 향')]);
  add('pinkGuava', ['Fruity|Tropical Fruit|Guava', 'Fruity|Tropical Fruit|Pink Guava'],
    study('Characterization of the Key Aroma Compounds in Pink Guava (Psidium guajava L.) by Means of Aroma Re-engineering Experiments and Omission Tests', 'Martin Steinhaus, Diana Sinuco, Johannes Polster, Coralia Osorio, Peter Schieberle', 2009, '10.1021/jf803728n', '저자 소속 Leibniz-LSB의 논문 초록 확인'),
    '콜롬비아 생 핑크 구아바의 큐브·퓌레', '절단·분쇄 후 (Z)-3-hexenal이 빠르게 생성됩니다. 온전한 과일의 방출 향과 구분해야 합니다.',
    '17성분 SIDA 정량, 물 역치 기반 OAV, 13성분 재구성·생략 시험',
    '생략 시험에서 핵심으로 확인된 여러 성분 중 3개입니다.',
    '일반 Guava 노트에는 핑크 구아바 연구 시료를 명시해 참고 예시로 사용합니다. White Guava에는 적용하지 않습니다.',
    [molecule('(Z)-3-Hexenal', '풋풀 향'), molecule('3-Sulfanyl-1-hexanol', '자몽 같은 향'), molecule('Furaneol', '달콤한 캐러멜 향')]);
  add('apricot', ['Fruity|Stone Fruit|Apricot'],
    study('Characterization of the Key Aroma Compounds in Apricots (Prunus armeniaca) by Application of the Molecular Sensory Science Concept', 'Veronika Greger, Peter Schieberle', 2007, '10.1021/jf0705015'),
    '생살구의 향 증류물 및 향 재구성 모델', '품종·숙도·추출 세부조건은 초록만으로 확정하지 않았습니다.',
    'AEDA, SIDA 정량·OAV, 18성분 재구성·생략 시험',
    '높은 OAV 및 향기활성을 보인 성분의 예시입니다. 일부 다른 락톤은 OAV < 5로, 락톤 계열 전체를 동일하게 취급할 수 없습니다.',
    '향 재구성 전체와 개별 성분 간 순위는 구분합니다. 건살구에는 적용하지 않습니다.',
    [molecule('γ-Decalactone', '달콤한 핵과류 향', 'OAV > 100'), molecule('Linalool', '꽃 향', 'OAV > 100'), molecule('β-Ionone', '제비꽃 같은 꽃 향', 'OAV > 100')]);
  add('mangoHaden', ['Fruity|Tropical Fruit|Mango', 'Fruity|Tropical Fruit|Ripe Mango'],
    study('Insights into the Key Aroma Compounds in Mango (Mangifera indica L. Haden) Fruits by Stable Isotope Dilution Quantitation and Aroma Simulation Experiments', 'John P. Munafo Jr., John Didzbalis, Raymond J. Schnell, Martin Steinhaus', 2016, '10.1021/acs.jafc.6b00822', '저자 소속 Leibniz-LSB의 논문 초록에서 시료·OAV 상위값 확인; 원문 표 추가 확인 필요'),
    '나무에서 익힌 Haden 망고', '수상 완숙 과실입니다. Green Mango에는 적용하지 않습니다.',
    'AEDA 선별 34성분 정량, 물의 후각 역치 기준 OAV, 향 재현 실험',
    '연구 초록에 제시된 같은 Haden 시료의 OAV 상위 3개입니다. 함량이나 실제 감각 기여도 순위는 아닙니다.',
    '정량한 34성분 내 OAV 순서이며 다른 망고 품종·숙도에 보편화하지 않습니다.',
    [molecule('Ethyl 2-methylbutanoate', '과일 향', 'OAV 2100'), molecule('(3E,5Z)-Undeca-1,3,5-triene', '파인애플 같은 향', 'OAV 1900'), molecule('Ethyl 3-methylbutanoate', '과일 향', 'OAV 1600')],
    {rankBasis:'OAV 기준 · 완숙 Haden 시료의 정량 34성분 중', rankValues:[2100,1900,1600]});
  add('basilDried', ['Green/Vegetative|Herbaceous|Basil'],
    study('The most aroma-active compounds in shade-dried aerial parts of basil obtained from Iran and Turkey', 'Ahmet Salih Sonmezdag, Asghar Amanpour, Hasim Kelebek, Serkan Selli', 2018, '10.1016/j.indcrop.2018.08.053', '저자 연구정보 시스템의 논문 초록 확인'),
    '이란·튀르키예산 Ocimum basilicum의 그늘 건조 지상부', '생잎이 아닌 건조 시료 두 종류입니다. Sweet Basil·Thai Basil 품종에 자동 적용하지 않습니다.',
    'Purge-and-trap 추출, GC-O, AEDA',
    '두 시료 모두 향기활성 18성분 중 linalool과 methyl chavicol의 FD가 가장 높았습니다. 확인된 두 성분만 표시합니다.',
    'FD는 추출물을 희석해 냄새를 감지한 지표입니다. 함량·OAV·감각 기여도 순위와 다르며 생바질 전체의 보편적 순위가 아닙니다.',
    [molecule('Linalool', '꽃·시트러스 계열 향', 'FD 2048'), molecule('Methyl chavicol (Estragole)', '달콤한 아니스 계열 향', 'FD 1024')],
    {rankBasis:'AEDA FD 기준 · 두 건조 바질 시료에서 같은 순서', rankValues:[2048,1024]});
  add('bayLeaf', ['Green/Vegetative|Herbaceous|Bay Leaf'],
    study('Volatile Constituents and Key Odorants in Leaves, Buds, Flowers, and Fruits of Laurus nobilis L.', 'Ayben Kilic, Harzemsah Hafizoglu, Hubert Kollmannsberger, Siegfried Nitz', 2004, '10.1021/jf0306237'),
    'Laurus nobilis의 신선한 잎 용매 추출물', '같은 논문이 분석한 꽃·열매·눈의 결과와 구분한 잎의 결과입니다.',
    'GC-MS, HRGC-O-MS, AEDA',
    '잎에서 냄새가 확인된 21성분 중 높은 FD로 보고된 성분의 예시입니다. 함량이 많은 성분 목록과 별도로 선정했습니다.',
    '높은 FD 성분은 이 세 가지 외에도 있습니다. 순위는 확정하지 않았으며 건조 월계수잎과 동일하다고 단정하지 않습니다.',
    [molecule('(Z)-3-Hexenal', '신선한 풋풀 향'), molecule('1,8-Cineole', '유칼립투스 같은 향'), molecule('Linalool', '꽃 향')]);
  add('lemonOil', ['Fruity|Citrus Fruit|Lemon'],
    study('Potent odorants resulting from the peroxidation of lemon oil', 'Peter Schieberle, Werner Grosch', 1989, '10.1007/BF01120443'),
    '신선한 레몬 오일과 빛·실온에서 120시간 산화한 오일 비교', '표시 성분은 논문에서 신선한 오일의 향기성분으로 명시한 성분입니다. 산화 시료의 주요 결점 성분과 구분합니다.',
    'AEDA, 저장 시간별 정량, odour unit 계산',
    'Neral·geranial·linalool을 신선한 레몬 오일의 향기성분으로 확인했습니다. 초록만으로 수치와 순위를 확정하지 않았습니다.',
    '레몬 오일 연구에 한정됩니다. 과육·주스의 대표 3위 또는 모든 레몬 품종의 공통 순위를 뜻하지 않습니다.',
    [molecule('Neral', '레몬 같은 향'), molecule('Geranial', '레몬 같은 향'), molecule('Linalool', '꽃·시트러스 계열 향')]);
  add('peanutRaw', ['Nutty/Cocoa|Other Nuts|Peanut'],
    study('Quantitation of Key Peanut Aroma Compounds in Raw Peanuts and Pan-Roasted Peanut Meal. Aroma Reconstitution and Comparison with Commercial Peanut Products', 'Irene Chetschik, Michael Granvogl, Peter Schieberle', 2010, '10.1021/jf1026636', '저자 소속 TUM의 논문 초록 확인'),
    '생땅콩', '같은 연구의 팬 로스팅 분말과 구분합니다. 품종·산지는 초록에서 확정하지 않았습니다.',
    'GC-O 선별 26성분 SIDA 정량, 식물유 역치 기반 OAV',
    '생땅콩에서 높은 OAV를 보인 세 성분입니다. 개별 수치를 확인하지 않아 순위는 표시하지 않습니다.',
    '생땅콩 연구의 참고 성분이며 볶은 땅콩·땅콩버터의 순위로 사용하지 않습니다.',
    [molecule('3-Isopropyl-2-methoxypyrazine', '흙·콩 계열 향'), molecule('Acetic acid', '식초 같은 향'), molecule('Methional', '익힌 감자 같은 향')]);
  add('peanutRoasted', ['Nutty/Cocoa|Other Nuts|Roasted Peanut'], sources.peanutRaw,
    '팬에서 볶은 땅콩 분말', '통땅콩이 아닌 분말 연구입니다. 로스팅 온도·시간은 초록에서 확정하지 않았습니다.',
    '38성분 SIDA 정량, 식물유 역치 기반 OAV, 향 재구성·첨가 비교',
    '높은 OAV 성분 중 세 가지 예시입니다. 향 재구성에서는 특히 methanethiol의 중요성이 확인됐습니다.',
    'GC-O에서 중요하지 않았던 일부 피라진의 첨가는 재구성 향을 바꾸지 않았습니다. 피라진이라는 계열명만으로 대표 성분을 선정하지 않았습니다.',
    [molecule('Methanethiol', '황·익힌 채소 계열 향'), molecule('2,3-Pentanedione', '버터 향'), molecule('2-Acetyl-1-pyrroline', '팝콘 향')]);
  add('walnut', ['Nutty/Cocoa|Tree Nuts|Walnut'],
    study('Sotolon and (2E,4E,6Z)-Nona-2,4,6-trienal Are the Key Compounds in the Aroma of Walnuts', 'Christine A. Stübner, Martin Steinhaus', 2023, '10.1021/acs.jafc.3c01002', '저자 소속 Leibniz-LSB의 논문 초록 확인'),
    'Juglans regia의 신선한 호두 알맹이', '흑호두 등 다른 종·로스팅 제품에는 자동 적용하지 않습니다.',
    'AEDA, 정량·역치 비교, 향 재구성·생략 시험',
    '50개 향기활성 성분을 조사했으며 역치를 넘는 성분은 17개였습니다. 두 분자의 혼합으로 특징적인 호두 향을 가장 잘 재현했습니다.',
    '함량은 둘 다 약 10 μg/kg로 보고됐으나 두 분자 간 순위는 주장하지 않습니다. 다른 주요 성분을 억지로 추가하지 않습니다.',
    [molecule('Sotolon', '호로파 같은 향', '약 10 μg/kg'), molecule('(2E,4E,6Z)-Nona-2,4,6-trienal', '오트밀 같은 향', '약 10 μg/kg')]);
  add('greenBeans', ['Green/Vegetative|Fresh Green|Green Beans'],
    study('Identification of the key odorants in raw French beans and changes during cooking', 'Andrea Hinterholzer, Teresa Lemos, Peter Schieberle', 1998, '10.1007/s002170050322'),
    '생 프렌치빈 추출물', '조리한 시료와 비교한 연구 중 생채소의 결과만 연결합니다.',
    'AEDA·향기활성 성분 동정',
    '25개 향기활성 성분 중 높은 FD를 보인 성분의 예시입니다. (Z)-3-hexenal 감소 등 조리 변화도 별도로 관찰했습니다.',
    '세 분자의 수치 순서는 초록에서 확인되지 않았습니다. 볶거나 삶은 콩의 대표 분자로 일반화하지 않습니다.',
    [molecule('(Z)-3-Hexenal', '초록 잎·풋풀 향'), molecule('1-Octen-3-one', '버섯 향'), molecule('3-Isobutyl-2-methoxypyrazine', '흙·콩 향')]);
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
