/*
 * Coffee Sensory Wheel — evidence resolver
 *
 * The resolver deliberately does not assign a food-reference molecule as a
 * coffee molecule. The three arrays are evidence stages, not a universal
 * concentration/OAV ranking. Stage 1 requires evidence that is specific to the
 * displayed coffee descriptor or defect. Stage 2 means the compound is found
 * in coffee or supports only the broader aroma family. Stage 3 is reserved for
 * a reference-food matrix and must never be read as direct coffee evidence.
 */
(function () {
  'use strict';

  const SOURCES = {
    coffeeKeyOdorants: {
      short: 'Semmelroch & Grosch, J. Agric. Food Chem. 1996; 44:537–543',
      url: 'https://doi.org/10.1021/jf9505988',
      method: 'Coffee brew · GC-O/AEDA, stable-isotope quantification, OAV'
    },
    coffeePotentOdorants: {
      short: 'Czerny, Mayer & Grosch, J. Agric. Food Chem. 1999; 47:695–699',
      url: 'https://doi.org/10.1021/jf980759i',
      method: 'Roasted Arabica · recombination and omission tests'
    },
    coffeeModel: {
      short: 'Czerny, Mayer & Grosch, J. Agric. Food Chem. 1999; 47:695–699',
      url: 'https://doi.org/10.1021/jf980759i',
      method: 'Roasted Arabica · recombination and omission tests'
    },
    rawCoffee: {
      short: 'Czerny & Grosch, J. Agric. Food Chem. 2000; 48:868–872',
      url: 'https://doi.org/10.1021/jf990609n',
      method: 'Green Arabica · aroma extract dilution analysis'
    },
    espressoReview: {
      short: 'Angeloni et al., Molecules 2021; 26:3856',
      url: 'https://doi.org/10.3390/molecules26133856',
      method: 'Review · broad coffee/espresso volatile evidence'
    },
    geisha: {
      short: 'Koyner et al., J. Sci. Food Agric. 2025; 105:6177–6189',
      url: 'https://doi.org/10.1002/jsfa.14410',
      method: 'Panama Geisha · sensory analysis and GC-MS association'
    },
    coffeeCitrus: {
      short: 'Marie et al., BMC Plant Biol. 2024; 24:238',
      url: 'https://doi.org/10.1186/s12870-024-04890-3',
      method: 'Four Arabica genotypes · sensory, volatilome, transcriptome'
    },
    acids: {
      short: 'Birke Rune et al., Curr. Res. Food Sci. 2023; 6:100485',
      url: 'https://doi.org/10.1016/j.crfs.2023.100485',
      method: 'Five brewed coffees · quantification, detection and recognition thresholds'
    },
    potato: {
      short: 'Cain et al., J. Agric. Food Chem. 2021; 69:2253–2261',
      url: 'https://doi.org/10.1021/acs.jafc.1c00605',
      method: 'Roasted East African coffee · targeted GC-MS and defect-severity correlation'
    },
    mouldy: {
      short: 'Cantergiani et al., Eur. Food Res. Technol. 2001; 212:648–657',
      url: 'https://doi.org/10.1007/s002170100305',
      method: 'Mouldy/earthy green coffee · GC-O and multidimensional GC-MS'
    },
    rio: {
      short: 'Romano et al., J. Agric. Food Chem. 2022; 70:11412–11418',
      url: 'https://doi.org/10.1021/acs.jafc.2c03899',
      method: '22 green coffees · cup panel, Vocus CI-MS and SPME-GC-MS'
    },
    fruitReference: {
      short: 'Advances in Fruit Aroma Volatile Research, PMCID: PMC6270112',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6270112/',
      method: 'Review · broad fruit volatile reference'
    },
    strawberryKey: {
      short: 'Jetti et al., J. Food Sci. 2007; 72:S487–S496',
      url: 'https://doi.org/10.1111/j.1750-3841.2007.00445.x',
      method: 'Ten strawberry cultivars · quantification, OAV and sensory correlation'
    },
    peachKey: {
      short: 'Zhu & Xiao, Eur. Food Res. Technol. 2019; 245:129–141',
      url: 'https://doi.org/10.1007/s00217-018-3145-x',
      method: 'Five peach cultivars · GC-O, quantification and OAV'
    },
    roseKey: {
      short: 'Zhao et al., J. Food Drug Anal. 2016; 24:471–476',
      url: 'https://doi.org/10.1016/j.jfda.2016.02.013',
      method: 'Rose products · HS-SPME-GC-MS, GC-O and OAV'
    },
    floralReference: {
      short: 'Mostafa et al., Frontiers in Plant Science 2022; 13:860157',
      url: 'https://doi.org/10.3389/fpls.2022.860157',
      method: 'Review · broad floral volatile reference'
    },
    spiceReference: {
      short: 'Molecules 2022; 27:6403, Spices Volatilomic Fingerprinting',
      url: 'https://doi.org/10.3390/molecules27196403',
      method: 'Review · broad spice volatile reference'
    },
    cinnamonKey: {
      short: 'Xing et al., Food Res. Int. 2025; 200:115446',
      url: 'https://doi.org/10.1016/j.foodres.2024.115446',
      method: 'Cinnamon bark oil extract · GC-O and OAV'
    },
    teaReference: {
      short: 'Recent Advances in Volatiles of Teas, PMCID: PMC6273888',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6273888/',
      method: 'Review · broad tea volatile reference'
    },
    teaKeyOdorants: {
      short: 'Identification of Key Flavor Compounds and Color Substances in Tea, 2025',
      url: 'https://doi.org/10.1007/s44187-025-00545-w',
      method: 'Tea review · broad key-compound reference'
    },
    oolongKey: {
      short: 'Zhu et al., J. Agric. Food Chem. 2015; 63:7499–7510',
      url: 'https://doi.org/10.1021/acs.jafc.5b02358',
      method: 'Three oolong infusions · GC-O, GC-MS/FPD and OAV'
    }
  };

  const rank = (name, reason, sources, level) => ({ name, reason, sources, level });
  const profile = (status, note, primary, secondary = [], tertiary = []) => ({
    status, note, primary, secondary, tertiary
  });

  const NONE = () => profile(
    'not-established',
    '이 세부 레퍼런스와 특정 분자의 직접 인과관계는 커피 문헌에서 확인되지 않았습니다. 식품명만으로 단일 향미분자를 단정하지 않습니다.',
    []
  );

  const EXACT = {
    'Sweet|Caramelized|Caramel': profile(
      'key-coffee-evidence',
      '커피의 캐러멜형 향은 여러 푸라논의 혼합 지각입니다. 아래 1단계는 커피에서 향기활성 분자로 정량·감각 검증된 항목입니다.',
      [
        rank('4-Hydroxy-2,5-dimethyl-3(2H)-furanone (furaneol)', 'sweet/caramel-like key odorant in coffee brews', ['coffeeKeyOdorants', 'coffeePotentOdorants'], 1),
        rank('2(5)-Ethyl-4-hydroxy-5(2)-methyl-3(2H)-furanone', 'sweet/caramel-like key odorant in coffee aroma models', ['coffeeKeyOdorants', 'coffeeModel'], 1)
      ],
      [rank('3-Hydroxy-4,5-dimethyl-2(5H)-furanone (sotolon)', 'potent seasoning/caramel-like coffee odorant; intensity depends on matrix and roast', ['coffeePotentOdorants', 'espressoReview'], 2)]
    ),
    'Sweet|Caramelized|Toffee': profile(
      'limited-coffee-evidence',
      'Toffee는 단일 화합물이 아니라 캐러멜화·로스팅 향의 조합입니다. 커피의 caramel-like 핵심 성분은 확인됐지만 ‘toffee’ 세부 노트의 직접 원인 실험은 아닙니다.',
      [],
      [rank('4-Hydroxy-2,5-dimethyl-3(2H)-furanone (furaneol)', 'coffee key odorant with sweet/caramel-like quality; not direct proof of a toffee descriptor', ['coffeeKeyOdorants', 'coffeePotentOdorants'], 2), rank('2(5)-Ethyl-4-hydroxy-5(2)-methyl-3(2H)-furanone', 'caramel-like coffee odorant; descriptor-level link remains indirect', ['coffeeKeyOdorants', 'coffeeModel'], 2)]
    ),
    'Sweet|Caramelized|Burnt Sugar': profile(
      'limited-coffee-evidence',
      '탄 설탕은 감각 묘사이며 단일 분자명은 아닙니다. 아래 성분은 커피의 caramel/seasoning-like 계열 근거입니다.',
      [],
      [rank('3-Hydroxy-4,5-dimethyl-2(5H)-furanone (sotolon)', 'potent caramel/seasoning-like coffee odorant; not direct proof of burnt sugar', ['coffeePotentOdorants', 'espressoReview'], 2), rank('4-Hydroxy-2,5-dimethyl-3(2H)-furanone (furaneol)', 'sweet/caramel-like coffee odorant', ['coffeeKeyOdorants'], 2)]
    ),
    'Roasted|Smoky|Smoky': profile(
      'key-coffee-evidence',
      '훈연은 여러 페놀·황화합물의 복합 지각입니다.',
      [rank('Guaiacol', 'potent phenolic/smoky coffee odorant', ['coffeeKeyOdorants', 'espressoReview'], 1), rank('4-Vinylguaiacol', 'potent spicy/phenolic coffee odorant formed during roasting', ['coffeePotentOdorants', 'espressoReview'], 1)],
      [rank('4-Ethylguaiacol', 'important roasted phenolic coffee odorant', ['espressoReview'], 2)]
    ),
    'Roasted|Smoky|Wood Smoke': profile(
      'limited-coffee-evidence',
      '나무연기는 훈연 계열의 상위 감각 레퍼런스입니다. 페놀계 커피 성분이 보조할 수 있지만 특정 목재 연기와의 직접 인과는 확정하지 않습니다.',
      [],
      [rank('Guaiacol', 'potent phenolic/smoky coffee odorant; wood-smoke specificity is not established', ['coffeeKeyOdorants', 'espressoReview'], 2), rank('4-Vinylguaiacol', 'spicy/phenolic roasted-coffee odorant', ['coffeePotentOdorants'], 2)]
    ),
    'Roasted|Dark Roast|Burnt': profile(
      'limited-coffee-evidence',
      '탄 향은 배전도·과다로스팅 맥락을 포함하는 복합 감각입니다. 일반 로스팅 커피의 핵심 성분을 그대로 ‘burnt’의 직접 원인으로 보지 않습니다.',
      [],
      [rank('2-Furfurylthiol', 'key roasty/sulfurous coffee odorant; burnt-note specificity is not established', ['coffeePotentOdorants', 'espressoReview'], 2), rank('3-Mercapto-3-methylbutyl formate', 'potent roasty coffee odorant', ['coffeePotentOdorants', 'coffeeModel'], 2), rank('Guaiacol', 'potent phenolic roasted-coffee odorant', ['coffeeKeyOdorants'], 2)]
    ),
    'Roasted|Dark Roast|Ashy': profile(
      'limited-coffee-evidence',
      'Ashy는 감각 묘사이며 단일 분자에 직접 대응하지 않습니다. 페놀계 성분은 광범위한 smoky/roasted 계열 근거입니다.',
      [],
      [rank('Guaiacol', 'potent phenolic/smoky coffee odorant; ashy-note specificity is not established', ['coffeeKeyOdorants', 'espressoReview'], 2), rank('4-Vinylguaiacol', 'roasted phenolic coffee odorant', ['coffeePotentOdorants'], 2)]
    ),
    'Green/Vegetative|Fresh Green|Green Bell Pepper': profile(
      'limited-coffee-evidence',
      '커피에서 methoxypyrazine류는 pea-like/green 계열의 강한 향기활성 성분입니다. 다만 피망이라는 세부 레퍼런스의 직접 인과로 확정하지 않습니다.',
      [],
      [rank('3-Isobutyl-2-methoxypyrazine (IBMP)', 'potent pea-like/green odorant identified in coffee; bell-pepper specificity remains indirect', ['rawCoffee', 'espressoReview'], 2), rank('2-Isopropyl-3-methoxypyrazine (IPMP)', 'PTD-associated methoxypyrazine; not evidence for a clean bell-pepper note', ['potato'], 2)]
    ),
    'Sour/Fermented|Clean Acidity|Citric Acid': profile('limited-coffee-evidence', '산은 휘발성 향기분자가 아니라 맛·산미에 관여하는 비휘발성 화합물입니다. 해당 연구에서 구연산은 감지는 가능했지만 전문가들이 구연산으로 식별하지 못했습니다.', [], [rank('Citric acid', '0.23–0.60 g/L in the studied brews; detection threshold was lower, but experts did not correctly recognize the acid in coffee', ['acids'], 2)]),
    'Sour/Fermented|Clean Acidity|Malic Acid': profile('limited-coffee-evidence', '산은 휘발성 향기분자가 아니라 맛·산미에 관여하는 비휘발성 화합물입니다.', [], [rank('Malic acid', 'quantified in the studied brews, but its average concentration was below the sensory detection threshold', ['acids'], 2)]),
    'Sour/Fermented|Clean Acidity|Phosphoric Acid': profile('limited-coffee-evidence', '산은 휘발성 향기분자가 아니라 맛·산미에 관여하는 비휘발성 화합물입니다.', [], [rank('Phosphoric acid', 'average concentration was just above its detection threshold, but experts did not correctly recognize it in coffee', ['acids'], 2)]),
    'Sour/Fermented|Clean Acidity|Lactic Acid': profile('limited-coffee-evidence', '산은 휘발성 향기분자가 아니라 맛·산미에 관여하는 비휘발성 화합물입니다.', [], [rank('Lactic acid', 'quantified in the studied brews, but its average concentration was below the sensory detection threshold', ['acids'], 2)]),
    'Sour/Fermented|Sour|Acetic Acid': profile('limited-coffee-evidence', '산은 휘발성 향기분자가 아니라 맛·산미에 관여하는 화합물입니다.', [], [rank('Acetic acid', 'quantified in the studied brews, but its average concentration was below the sensory detection threshold', ['acids'], 2)]),
    'Sour/Fermented|Aged/Funky|Earthy': profile('key-coffee-evidence', '곰팡이/흙 결점 시료에서 주요 오프플레이버 기여 성분이 GC-O와 다차원 GC-MS로 확인됐습니다. 긍정적 terroir 묘사와는 별개입니다.', [rank('Geosmin', 'principal mouldy/earthy off-flavour contributor identified in defective green coffee', ['mouldy'], 1), rank('2-Methylisoborneol', 'principal mouldy/earthy off-flavour contributor identified in defective green coffee', ['mouldy'], 1)], [rank('2,4,6-Trichloroanisole', 'mouldy/earthy off-flavour contributor in defective green coffee', ['mouldy'], 2)]),
    'Sour/Fermented|Aged/Funky|Musty': profile('limited-coffee-evidence', 'Musty는 mouldy/earthy 결점 계열과 가까운 감각 묘사이지만, 해당 영문 노트에 대한 개별 재구성·생략 실험은 아닙니다.', [], [rank('Geosmin / 2-Methylisoborneol / 2,4,6-Trichloroanisole', 'identified in mouldy/earthy defective green coffee; descriptor transfer to musty is indirect', ['mouldy'], 2)]),
    'Sour/Fermented|Aged/Funky|Mildew': profile('limited-coffee-evidence', 'Mildew는 곰팡이 계열 레퍼런스이며 연구의 mouldy/earthy 결점과 완전히 같은 항목으로 단정하지 않습니다.', [], [rank('Geosmin / 2-Methylisoborneol / 2,4,6-Trichloroanisole', 'identified in mouldy/earthy defective green coffee; descriptor transfer to mildew is indirect', ['mouldy'], 2)]),
    'Other|Defect|Potato': profile('key-coffee-evidence', 'Potato taste defect(PTD)의 강도는 분석 시료에서 IPMP 농도와 유의하게 관련됐으며, IPMP는 정상과 결점 시료를 구별했습니다.', [rank('2-Isopropyl-3-methoxypyrazine (IPMP)', 'discriminated clean from PTD samples and varied significantly with judged defect severity', ['potato'], 1)]),
    'Other|Defect|Rio': profile('key-coffee-evidence', 'Rio off-flavor는 medicinal·phenolic·iodine-like 결점으로, 녹두에서 2,4,6-TCA 오염과 연관된 직접 분석 근거가 있습니다.', [rank('2,4,6-Trichloroanisole (TCA)', 'target analyte associated with Rio off-flavor in green coffee', ['rio'], 1)]),
    'Other|Defect|Phenol': profile('not-established', 'Phenolic은 화학군·감각 범주입니다. Guaiacol과 4-vinylguaiacol은 정상 로스팅 커피의 향기활성 성분일 수 있으므로 그 자체를 결점 원인으로 배정하지 않습니다.', []),
    'Other|Earthy|Mushroom': profile('limited-coffee-evidence', '버섯은 고유의 복합 식품 레퍼런스입니다. 커피 결점의 mouldy/earthy 성분을 정상 커피의 긍정적 버섯 노트와 동일시하지 않습니다.', [], [rank('Geosmin / 2-Methylisoborneol', 'direct evidence exists only in mouldy/earthy defective green coffee, not for a positive mushroom note', ['mouldy'], 2)]),
    'Other|Earthy|Soil': profile('limited-coffee-evidence', '토양향은 결점과 긍정적 terroir 묘사 모두에 쓰일 수 있습니다. 결점 연구의 분자를 이 세부 노트의 직접 원인으로 배정하지 않습니다.', [], [rank('Geosmin / 2-Methylisoborneol', 'principal mouldy/earthy contributors in defective green coffee; soil-note specificity is not established', ['mouldy'], 2)]),
    'Other|Mineral|Sulfur': profile('limited-coffee-evidence', '황향은 여러 저역치 황화합물의 복합 지각입니다. 이 성분들은 커피에서 핵심 향기활성을 가질 수 있지만 ‘sulfur’ 세부 노트의 항상적 순위는 아닙니다.', [], [rank('2-Furfurylthiol', 'key roasty/sulfurous coffee odorant', ['coffeePotentOdorants', 'espressoReview'], 2), rank('Methanethiol', 'important sulfurous coffee odorant', ['coffeePotentOdorants', 'espressoReview'], 2), rank('3-Methyl-2-butene-1-thiol', 'key sulfur-containing coffee odorant', ['coffeeModel'], 2)])
  };

  const citrusReference = {
    Lemon: ['Citral (neral + geranial)', 'Limonene'], Orange: ['Limonene', 'Myrcene'], Grapefruit: ['Nootkatone', 'Linalool'], Lime: ['Limonene', 'Citral (neral + geranial)'],
    Tangerine: ['Limonene', 'γ-Terpinene'], Yuzu: ['Limonene', 'γ-Terpinene'], Bergamot: ['Linalyl acetate', 'Linalool'], Mandarin: ['Limonene', 'γ-Terpinene'],
    Kumquat: ['Limonene'], Citron: ['Limonene', 'Citral (neral + geranial)'], 'Blood Orange': ['Limonene', 'Linalool'], Pomelo: ['Nootkatone', 'Linalool'], 'Key Lime': ['Limonene', 'Citral (neral + geranial)']
  };

  // Tier 3 mapping is intentionally a reference-food library. It never claims
  // that the listed molecule is the direct cause of the same note in coffee.
  const REFERENCE_BY_NOTE = {
    'Fruity|Other Fruit|Apple': [['Hexyl acetate', 'Butyl acetate'], 'fruitReference'],
    'Fruity|Other Fruit|Green Apple': [['Hexyl acetate', '(E)-2-Hexenal'], 'fruitReference'],
    'Fruity|Other Fruit|Red Apple': [['Hexyl acetate', '2-Methylbutyl acetate'], 'fruitReference'],
    'Fruity|Other Fruit|Pear': [['Ethyl (2E,4Z)-deca-2,4-dienoate', 'Hexyl acetate'], 'fruitReference'],
    'Fruity|Other Fruit|Asian Pear': [['Ethyl (2E,4Z)-deca-2,4-dienoate', 'Hexyl acetate'], 'fruitReference'],
    'Fruity|Other Fruit|Grape': [['Linalool', 'Geraniol'], 'fruitReference'],
    'Fruity|Other Fruit|White Grape': [['Linalool', 'Geraniol'], 'fruitReference'],
    'Fruity|Other Fruit|Red Grape': [['Linalool', '(E)-β-Damascenone'], 'fruitReference'],
    'Fruity|Other Fruit|Melon': [['(Z)-6-Nonenal', '(E,Z)-2,6-Nonadienal'], 'fruitReference'],
    'Fruity|Other Fruit|Cantaloupe': [['(Z)-6-Nonenal', '(E,Z)-2,6-Nonadienal'], 'fruitReference'],
    'Fruity|Other Fruit|Honeydew': [['(Z)-6-Nonenal', '(E,Z)-2,6-Nonadienal'], 'fruitReference'],
    'Fruity|Other Fruit|Watermelon': [['(Z)-3-Nonenal', '(E,Z)-2,6-Nonadienal'], 'fruitReference'],
    'Fruity|Berry|Strawberry': [['Ethyl butanoate', 'Mesifurane', 'Ethyl hexanoate'], 'strawberryKey'],
    'Fruity|Berry|Wild Strawberry': [['Furaneol', 'Mesifurane'], 'fruitReference'],
    'Fruity|Berry|Raspberry': [['4-(4-Hydroxyphenyl)-2-butanone (raspberry ketone)', 'α-Ionone'], 'fruitReference'],
    'Fruity|Berry|Black Currant': [['4-Mercapto-4-methylpentan-2-one', '3-Mercaptohexanol'], 'fruitReference'],
    'Fruity|Stone Fruit|Peach': [['γ-Decalactone', 'δ-Decalactone', '(R)-(−)-Linalool'], 'peachKey'],
    'Fruity|Stone Fruit|White Peach': [['γ-Decalactone', 'δ-Decalactone', '(R)-(−)-Linalool'], 'peachKey'],
    'Fruity|Stone Fruit|Yellow Peach': [['γ-Decalactone', 'δ-Decalactone', '(R)-(−)-Linalool'], 'peachKey'],
    'Fruity|Stone Fruit|Nectarine': [['γ-Decalactone', 'γ-Dodecalactone'], 'fruitReference'],
    'Fruity|Stone Fruit|Apricot': [['γ-Decalactone', 'β-Ionone'], 'fruitReference'],
    'Fruity|Stone Fruit|Cherry': [['Benzaldehyde', '(E)-2-Hexenal'], 'fruitReference'],
    'Fruity|Stone Fruit|Plum': [['γ-Decalactone', 'Linalool'], 'fruitReference'],
    'Fruity|Tropical Fruit|Pineapple': [['Ethyl butyrate', 'Methyl butyrate', 'Ethyl hexanoate'], 'fruitReference'],
    'Fruity|Tropical Fruit|Fresh Pineapple': [['Ethyl butyrate', 'Methyl butyrate', 'Ethyl hexanoate'], 'fruitReference'],
    'Fruity|Tropical Fruit|Grilled Pineapple': [['Ethyl butyrate', 'Furaneol'], 'fruitReference'],
    'Fruity|Tropical Fruit|Coconut': [['δ-Decalactone', 'γ-Nonalactone'], 'fruitReference'],
    'Fruity|Tropical Fruit|Young Coconut': [['δ-Decalactone', 'γ-Nonalactone'], 'fruitReference'],
    'Fruity|Tropical Fruit|Passion Fruit': [['Ethyl butyrate', '3-Mercaptohexyl acetate'], 'fruitReference'],
    'Fruity|Tropical Fruit|Banana': [['3-Methylbutyl acetate (isoamyl acetate)', 'Butyl acetate'], 'fruitReference'],
    'Fruity|Tropical Fruit|Ripe Banana': [['3-Methylbutyl acetate (isoamyl acetate)', 'Butyl acetate'], 'fruitReference'],
    'Fruity|Tropical Fruit|Mango': [['δ-3-Carene', 'Myrcene'], 'fruitReference'],
    'Fruity|Tropical Fruit|Lychee': [['Linalool', 'Rose oxide'], 'fruitReference'],
    'Fruity|Tropical Fruit|Papaya': [['Linalool', 'Benzyl isothiocyanate'], 'fruitReference'],
    'Fruity|Tropical Fruit|Durian': [['Ethanethiol', 'Diethyl disulfide'], 'fruitReference'],
    'Sweet|Vanilla|Vanilla': [['Vanillin', 'p-Hydroxybenzaldehyde'], 'spiceReference'],
    'Sweet|Vanilla|Vanilla Bean': [['Vanillin', 'p-Hydroxybenzaldehyde'], 'spiceReference'],
    'Sweet|Molasses|Maple Syrup': [['Sotolon', 'Vanillin'], 'fruitReference'],
    'Sweet|Molasses|Molasses': [['Furaneol', 'Maltol'], 'fruitReference'],
    'Sweet|Caramelized|Butterscotch': [['Diacetyl', 'Furaneol'], 'fruitReference'],
    'Sweet|Vanilla|Cream': [['Diacetyl', 'δ-Decalactone'], 'fruitReference'],
    'Floral|White Flowers|Jasmine': [['Benzyl acetate', 'Linalool', 'Indole'], 'floralReference'],
    'Floral|White Flowers|Orange Blossom': [['Linalool', 'Methyl anthranilate', 'Indole'], 'floralReference'],
    'Floral|White Flowers|Gardenia': [['Linalool', 'Methyl benzoate'], 'floralReference'],
    'Floral|Colored Flowers|Rose': [['2-Phenylethanol', 'Eugenol', 'Geraniol', 'Linalool'], 'roseKey'],
    'Floral|Colored Flowers|Red Rose': [['2-Phenylethanol', 'Eugenol', 'Geraniol', 'Linalool'], 'roseKey'],
    'Floral|Colored Flowers|Pink Rose': [['2-Phenylethanol', 'Eugenol', 'Geraniol', 'Linalool'], 'roseKey'],
    'Floral|Colored Flowers|Lavender': [['Linalool', 'Linalyl acetate'], 'floralReference'],
    'Floral|Colored Flowers|Violet': [['β-Ionone', 'α-Ionone'], 'floralReference'],
    'Floral|Colored Flowers|Geranium': [['Citronellol', 'Geraniol'], 'floralReference'],
    'Floral|Herbal Flowers|Chamomile': [['α-Bisabolol', 'Chamazulene'], 'floralReference'],
    'Floral|Herbal Flowers|Osmanthus': [['β-Ionone', 'Dihydro-β-ionone'], 'floralReference'],
    'Spices|Warm Spices|Cinnamon': [['trans-Cinnamaldehyde', 'Coumarin', 'Benzaldehyde'], 'cinnamonKey'],
    'Spices|Warm Spices|Ceylon Cinnamon': [['(E)-Cinnamaldehyde', 'Eugenol'], 'spiceReference'],
    'Spices|Warm Spices|Cassia': [['(E)-Cinnamaldehyde', 'Coumarin'], 'spiceReference'],
    'Spices|Warm Spices|Clove': [['Eugenol', 'Eugenyl acetate'], 'spiceReference'],
    'Spices|Warm Spices|Cardamom': [['α-Terpinyl acetate', '1,8-Cineole'], 'spiceReference'],
    'Spices|Warm Spices|Nutmeg': [['Sabinene', 'Myristicin'], 'spiceReference'],
    'Spices|Warm Spices|Mace': [['Sabinene', 'Myristicin'], 'spiceReference'],
    'Spices|Hot Spices|Black Pepper': [['Rotundone', 'β-Caryophyllene'], 'spiceReference'],
    'Spices|Aromatic Spices|Ginger': [['Zingiberene', 'Citral'], 'spiceReference'],
    'Spices|Aromatic Spices|Star Anise': [['(E)-Anethole'], 'spiceReference'],
    'Spices|Aromatic Spices|Anise': [['(E)-Anethole'], 'spiceReference'],
    'Spices|Aromatic Spices|Fennel': [['(E)-Anethole', 'Fenchone'], 'spiceReference'],
    'Spices|Aromatic Spices|Cumin': [['Cuminaldehyde', 'p-Cymene'], 'spiceReference'],
    'Spices|Aromatic Spices|Coriander Seed': [['Linalool', 'α-Pinene'], 'spiceReference'],
    'Spices|Aromatic Spices|Turmeric': [['ar-Turmerone', 'α-Turmerone'], 'spiceReference'],
    'Spices|Aromatic Spices|Saffron': [['Safranal'], 'spiceReference'],
    'Spices|Aromatic Spices|Juniper Berries': [['α-Pinene', 'Sabinene'], 'spiceReference'],
    'Spices|Aromatic Spices|Fenugreek': [['Sotolon'], 'spiceReference'],
    'Tea|Black Tea|Earl Grey': [['Linalyl acetate', 'Linalool'], 'teaReference'],
    'Tea|Green Tea|Matcha': [['Linalool', 'Geraniol', 'Indole'], 'teaKeyOdorants'],
    'Tea|Green Tea|Sencha': [['Linalool', 'Geraniol', 'Indole'], 'teaKeyOdorants'],
    'Tea|Oolong|Oolong': [['Nerolidol', '(R)-(−)-Linalool', 'β-Damascenone', 'Dimethyl sulfide'], 'oolongKey'],
    'Tea|Herbal Tea|Peppermint': [['Menthol', 'Menthone'], 'spiceReference'],
    'Tea|Herbal Tea|Lemongrass': [['Citral (neral + geranial)', 'Myrcene'], 'spiceReference'],
    'Cereal/Grain|Baked|Toast': [['2-Acetyl-1-pyrroline', '2-Furfurylthiol'], 'spiceReference'],
    'Cereal/Grain|Baked|Brioche': [['2-Acetyl-1-pyrroline', 'Diacetyl'], 'spiceReference'],
    'Green/Vegetative|Fresh Green|Grass': [['(Z)-3-Hexenal', '(Z)-3-Hexenol'], 'fruitReference'],
    'Green/Vegetative|Fresh Green|Fresh Cut Grass': [['(Z)-3-Hexenal', '(Z)-3-Hexenol'], 'fruitReference'],
    'Green/Vegetative|Herbaceous|Mint': [['Menthol', 'Menthone'], 'spiceReference'],
    'Green/Vegetative|Herbaceous|Spearmint': [['(−)-Carvone', 'Limonene'], 'spiceReference'],
    'Green/Vegetative|Herbaceous|Peppermint': [['Menthol', 'Menthone'], 'spiceReference'],
    'Green/Vegetative|Herbaceous|Basil': [['Linalool', 'Estragole'], 'spiceReference'],
    'Green/Vegetative|Herbaceous|Rosemary': [['1,8-Cineole', 'α-Pinene'], 'spiceReference'],
    'Green/Vegetative|Herbaceous|Thyme': [['Thymol', 'p-Cymene'], 'spiceReference'],
    'Green/Vegetative|Herbaceous|Oregano': [['Carvacrol', 'Thymol'], 'spiceReference'],
    'Other|Woody|Oak': [['cis-Whisky lactone', 'trans-Whisky lactone', 'Eugenol'], 'spiceReference'],
    'Other|Woody|Cedar': [['Cedrol', 'Thujopsene'], 'floralReference'],
    'Other|Woody|Pine': [['α-Pinene', 'β-Pinene'], 'floralReference'],
    'Other|Woody|Sandalwood': [['α-Santalol', 'β-Santalol'], 'floralReference'],
    'Other|Woody|Eucalyptus': [['1,8-Cineole'], 'floralReference']
  };

  const REFERENCE_BY_GROUP = {
    'Fruity|Other Fruit': [['Ethyl butyrate', 'Hexyl acetate'], 'fruitReference'],
    'Fruity|Berry': [['Linalool', 'β-Ionone'], 'fruitReference'],
    'Fruity|Stone Fruit': [['γ-Decalactone', 'β-Ionone'], 'fruitReference'],
    'Fruity|Tropical Fruit': [['Ethyl butyrate', 'Ethyl hexanoate'], 'fruitReference'],
    'Fruity|Dried Fruit': [['Furaneol', 'Sotolon'], 'fruitReference'],
    'Sweet|Brown Sugar': [['Furaneol', 'Maltol'], 'fruitReference'],
    'Sweet|Caramelized': [['Furaneol', 'Sotolon'], 'fruitReference'],
    'Sweet|Vanilla': [['Vanillin', 'Diacetyl'], 'spiceReference'],
    'Sweet|Molasses': [['Sotolon', 'Furaneol'], 'fruitReference'],
    'Sweet|Confectionery': [['Vanillin', 'Furaneol'], 'fruitReference'],
    'Floral|White Flowers': [['Linalool', 'Benzyl acetate'], 'floralReference'],
    'Floral|Colored Flowers': [['Linalool', 'Geraniol', 'β-Ionone'], 'floralReference'],
    'Floral|Herbal Flowers': [['Linalool', 'Benzyl acetate'], 'floralReference'],
    'Nutty/Cocoa|Tree Nuts': [['2,5-Dimethylpyrazine', '2-Ethyl-3,5-dimethylpyrazine'], 'spiceReference'],
    'Nutty/Cocoa|Other Nuts': [['2,5-Dimethylpyrazine', '2-Ethyl-3,5-dimethylpyrazine'], 'spiceReference'],
    'Nutty/Cocoa|Cocoa': [['2,3,5-Trimethylpyrazine', '2-Ethyl-3,5-dimethylpyrazine'], 'spiceReference'],
    'Spices|Warm Spices': [['(E)-Cinnamaldehyde', 'Eugenol'], 'spiceReference'],
    'Spices|Hot Spices': [['Rotundone', 'β-Caryophyllene'], 'spiceReference'],
    'Spices|Aromatic Spices': [['Linalool', '1,8-Cineole'], 'spiceReference'],
    'Tea|Black Tea': [['Linalool', '(E)-β-Damascenone', 'Benzyl alcohol'], 'teaReference'],
    'Tea|Green Tea': [['Linalool', 'Geraniol', 'Indole'], 'teaKeyOdorants'],
    'Tea|Oolong': [['Linalool', 'Geraniol', 'Nerolidol'], 'teaReference'],
    'Tea|White Tea': [['Linalool', 'Benzyl alcohol'], 'teaReference'],
    'Tea|Herbal Tea': [['Linalool', '1,8-Cineole'], 'spiceReference'],
    'Tea|Puer': [['Geosmin', '(E)-β-Damascenone'], 'teaReference'],
    'Cereal/Grain|Baked': [['2-Acetyl-1-pyrroline', '2-Furfurylthiol'], 'spiceReference'],
    'Cereal/Grain|Malted': [['Maltol', '2-Acetyl-1-pyrroline'], 'spiceReference'],
    'Cereal/Grain|Raw Grains': [['(Z)-3-Hexanal', '2-Acetyl-1-pyrroline'], 'fruitReference'],
    'Cereal/Grain|Processed': [['Maltol', '2-Acetyl-1-pyrroline'], 'spiceReference'],
    'Green/Vegetative|Fresh Green': [['(Z)-3-Hexenal', '(Z)-3-Hexenol'], 'fruitReference'],
    'Green/Vegetative|Herbaceous': [['Linalool', '1,8-Cineole'], 'spiceReference'],
    'Green/Vegetative|Vegetal': [['(Z)-3-Hexenal', 'Dimethyl sulfide'], 'fruitReference'],
    'Sour/Fermented|Clean Acidity': [['Citric acid', 'Malic acid'], 'fruitReference'],
    'Sour/Fermented|Sour': [['Acetic acid', 'Ethyl acetate'], 'fruitReference'],
    'Sour/Fermented|Fermented': [['Ethyl acetate', 'Diacetyl', 'Lactic acid'], 'fruitReference'],
    'Sour/Fermented|Aged/Funky': [['Geosmin', '2-Methylisoborneol'], 'mouldy'],
    'Other|Woody': [['α-Pinene', '1,8-Cineole'], 'floralReference']
  };

  function foodReference(names, sources = []) {
    return names.map(name => rank(name, '레퍼런스 식품 문헌의 대표 휘발성 성분입니다. 커피에서 이 세부 노트의 직접 원인으로 입증된 것은 아닙니다.', sources, 3));
  }

  function referenceFoodForKey(key, fallback = []) {
    const [tier1, tier2] = String(key || '').split('|');
    const entry = REFERENCE_BY_NOTE[key] || REFERENCE_BY_GROUP[`${tier1}|${tier2}`];
    if (!entry) return foodReference(fallback);
    return foodReference(entry[0], [entry[1]]);
  }

  function getFlavorEvidence(key) {
    if (EXACT[key]) return EXACT[key];
    const [tier1, tier2, tier3] = String(key || '').split('|');

    if (tier1 === 'Fruity' && tier2 === 'Citrus Fruit') {
      const ref = citrusReference[tier3] || ['Limonene'];
      return profile(
        'limited-coffee-evidence',
        'Arabica 품종 비교에서 limonene과 citrus 감각의 관련성이 보고됐지만, 로스팅·매트릭스·혼합 효과 때문에 개별 감귤 종의 단일 원인으로 확정할 수 없습니다. 3단계 분자는 해당 과일 레퍼런스입니다.',
        [],
        [rank('Limonene', '특정 Arabica 유전형에서 높은 함량과 citrus 감각의 관련성이 보고됐으나 모든 커피·감귤 노트에 일반화할 수 없습니다.', ['coffeeCitrus'], 2), rank('Linalool', 'Panama Geisha 시료에서 floral/bergamot 관련 차이가 보고됐으나, 세부 감귤 노트의 직접 원인으로 확정되지 않았습니다.', ['geisha'], 2), rank('Geraniol', 'Panama Geisha 시료에서 floral/bergamot 관련 차이가 보고됐으나, 세부 감귤 노트의 직접 원인으로 확정되지 않았습니다.', ['geisha'], 2)],
        referenceFoodForKey(key, ref)
      );
    }

    if (tier1 === 'Fruity') {
      return profile(
        'limited-coffee-evidence',
        '세부 과일명은 인간의 연상 레퍼런스입니다. 커피에서 해당 과일을 단일 분자로 재현했다는 직접 증거는 확인되지 않았습니다.',
        [],
        [rank('(E)-β-Damascenone', 'potent fruity/honey-like odorant identified in roasted coffee', ['coffeePotentOdorants', 'espressoReview'], 2), rank('Phenylacetaldehyde', 'floral/honey-like aroma-active compound reported in coffee studies', ['espressoReview'], 2)],
        referenceFoodForKey(key)
      );
    }

    if (tier1 === 'Floral') {
      return profile(
        'limited-coffee-evidence',
        '꽃의 종(자스민·장미 등)을 단일 커피분자로 특정할 수 없습니다. 커피에서 확인된 floral 계열 후보만 2순위로 표시합니다.',
        [],
        [rank('Linalool', 'reported in coffee and associated with floral/bergamot differences, not a single-flower proof', ['geisha', 'espressoReview'], 2), rank('Geraniol', 'reported in coffee and associated with floral/bergamot differences, not a single-flower proof', ['geisha'], 2), rank('Phenylacetaldehyde', 'floral/honey-like aroma-active compound reported in coffee studies', ['espressoReview'], 2)],
        referenceFoodForKey(key)
      );
    }

    if (tier1 === 'Sweet') {
      return profile(
        'limited-coffee-evidence',
        '설탕·꿀·바닐라·제과명은 단일 향미분자가 아닌 복합 레퍼런스입니다. 커피에서 확인된 sweet/caramel 계열 성분만 보조 근거로 표시합니다.',
        [],
        [rank('4-Hydroxy-2,5-dimethyl-3(2H)-furanone (furaneol)', 'sweet/caramel-like key odorant in coffee; this does not establish a specific confectionery note', ['coffeeKeyOdorants', 'coffeePotentOdorants'], 2), rank('Vanillin', 'reported as a potent coffee odorant; it does not establish “vanilla bean” as a single-note cause', ['coffeePotentOdorants', 'espressoReview'], 2)],
        referenceFoodForKey(key)
      );
    }

    if (tier1 === 'Nutty/Cocoa') {
      return profile(
        'limited-coffee-evidence',
        '견과·코코아는 로스팅 유래 pyrazine·furanone 등의 복합 지각입니다. 커피의 nutty/roasty 계열 근거를 특정 견과종·코코아 노트의 직접 원인으로 승격시키지 않습니다.',
        [],
        [rank('2-Ethyl-3,5-dimethylpyrazine', 'potent nutty/roasty coffee odorant; specific nut/cocoa identity is not established', ['coffeePotentOdorants', 'espressoReview'], 2), rank('2,3-Diethyl-5-methylpyrazine', 'potent nutty/roasty coffee odorant; specific note identity is not established', ['coffeePotentOdorants'], 2), rank('4-Hydroxy-2,5-dimethyl-3(2H)-furanone (furaneol)', 'sweet/caramel-like coffee key odorant that may support the broad impression', ['coffeeKeyOdorants'], 2)],
        referenceFoodForKey(key)
      );
    }

    if (tier1 === 'Spices') {
      return profile(
        'limited-coffee-evidence',
        '향신료 종명은 레퍼런스입니다. 커피에서 확인된 phenolic/spicy 계열 성분을 계피·클로브·샤프란 등 개별 향신료의 직접 원인으로 표시하지 않습니다.',
        [],
        [rank('Guaiacol', 'potent phenolic/spicy coffee odorant; spice-species identity is not established', ['coffeeKeyOdorants', 'espressoReview'], 2), rank('4-Vinylguaiacol', 'potent spicy/phenolic coffee odorant; spice-species identity is not established', ['coffeePotentOdorants', 'espressoReview'], 2), rank('4-Ethylguaiacol', 'roasted phenolic coffee odorant', ['espressoReview'], 2)],
        referenceFoodForKey(key)
      );
    }

    if (tier1 === 'Cereal/Grain') {
      return profile(
        'limited-coffee-evidence',
        '곡물·토스트는 Maillard/로스팅 향의 복합 지각입니다. 커피의 roasty/nutty 성분을 빵·곡물 제품명의 직접 원인으로 표시하지 않습니다.',
        [],
        [rank('2-Ethyl-3,5-dimethylpyrazine', 'potent roasty/nutty coffee odorant; specific cereal identity is not established', ['coffeePotentOdorants', 'espressoReview'], 2), rank('2-Furfurylthiol', 'key roasty coffee odorant; specific baked-product identity is not established', ['coffeePotentOdorants'], 2), rank('4-Hydroxy-2,5-dimethyl-3(2H)-furanone (furaneol)', 'sweet/caramel-like coffee odorant', ['coffeeKeyOdorants'], 2)],
        referenceFoodForKey(key)
      );
    }

    if (tier1 === 'Roasted') {
      return profile(
        'limited-coffee-evidence',
        '로스팅 명칭은 배전도·공정 표현이며 단일 향미분자가 아닙니다. 아래는 일반 로스팅 커피의 핵심 성분이지, 각 배전 세부 노트의 직접 순위가 아닙니다.',
        [],
        [rank('2-Furfurylthiol', 'key roasty/sulfurous coffee odorant; descriptor-specific contribution is not established', ['coffeePotentOdorants', 'espressoReview'], 2), rank('3-Mercapto-3-methylbutyl formate', 'potent roasty coffee odorant', ['coffeePotentOdorants', 'coffeeModel'], 2), rank('Guaiacol', 'potent phenolic roasted-coffee odorant', ['coffeeKeyOdorants'], 2), rank('4-Vinylguaiacol', 'roasted phenolic coffee odorant', ['coffeePotentOdorants'], 2)],
        referenceFoodForKey(key)
      );
    }

    if (tier1 === 'Green/Vegetative') {
      return profile(
        'limited-coffee-evidence',
        'green/pea-like 커피 향에는 methoxypyrazine류가 기여할 수 있습니다. 이 계열 근거를 특정 허브·채소 종명의 직접 원인으로 확장하지 않습니다.',
        [],
        [rank('3-Isobutyl-2-methoxypyrazine (IBMP)', 'potent pea-like/green coffee odorant; specific herb/vegetable identity is not established', ['rawCoffee', 'espressoReview'], 2), rank('2-Isopropyl-3-methoxypyrazine (IPMP)', 'PTD-associated methoxypyrazine; use as a defect warning, not a generic green-note cause', ['potato'], 2)],
        referenceFoodForKey(key)
      );
    }

    if (tier1 === 'Sour/Fermented' && tier2 === 'Clean Acidity') {
      return profile(
        'limited-coffee-evidence',
        '이 항목은 향기분자가 아니라 산미를 만드는 유기·무기산입니다. Tartaric acid는 이 기준 연구의 5개 정량 대상에 포함되지 않았으므로 직접 근거 부족으로 표시합니다.',
        [],
        [rank('Citric / malic / acetic / lactic / phosphoric acid', '각 산은 brewed coffee에서 정량됐으나, 특정 레퍼런스의 산미를 단독으로 결정하지는 않습니다.', ['acids'], 2)],
        referenceFoodForKey(key)
      );
    }

    if (tier1 === 'Sour/Fermented') {
      return profile(
        'limited-coffee-evidence',
        '발효 식품·주류명은 다성분 레퍼런스입니다. 커피에서 해당 제품과 동일한 분자 조합이 증명된 것은 아닙니다.',
        [],
        [rank('Acetic acid', 'quantified in brewed coffee; roast-dependent concentration change', ['acids'], 2), rank('Ethyl 2-methylbutyrate / ethyl 3-methylbutyrate', 'reported as fermentation-associated coffee volatiles; not a specific wine/beer proof', ['espressoReview'], 2)],
        referenceFoodForKey(key)
      );
    }

    if (tier1 === 'Tea') {
      return profile(
        'reference-only',
        '차의 종류·블렌드는 다성분 레퍼런스입니다. 해당 차의 향기분자를 커피의 직접 원인으로 이식하지 않습니다.',
        [],
        [rank('Linalool / phenylacetaldehyde / (E)-β-damascenone', '차에서도 중요할 수 있는 향기물질이나, 이 차 노트의 커피 직접 근거는 아닙니다.', ['geisha', 'espressoReview'], 2)],
        referenceFoodForKey(key)
      );
    }

    if (tier1 === 'Other' && tier2 === 'Earthy') {
      return profile(
        'limited-coffee-evidence',
        'mouldy/earthy 결점에는 직접 분석 근거가 있지만, 토양·이끼·트러플 등 개별 레퍼런스와 자동으로 동일시하지 않습니다.',
        [],
        [rank('Geosmin', 'principal mouldy/earthy off-flavour contributor in defective green coffee; specific positive-note identity is not established', ['mouldy'], 2), rank('2-Methylisoborneol', 'principal mouldy/earthy off-flavour contributor in defective green coffee', ['mouldy'], 2), rank('2,4,6-Trichloroanisole', 'mouldy/earthy off-flavour contributor in defective green coffee', ['mouldy'], 2)],
        referenceFoodForKey(key)
      );
    }

    if (tier1 === 'Other' && tier2 === 'Woody') {
      return profile(
        'limited-coffee-evidence',
        '수종은 레퍼런스입니다. 커피에는 phenolic 계열이 woody/phenolic 인상에 기여할 수 있지만 특정 목재종을 확정하지 않습니다.',
        [],
        [rank('Guaiacol', 'potent phenolic coffee odorant', ['coffeeKeyOdorants'], 2), rank('4-Ethylguaiacol', 'roasted phenolic coffee odorant', ['espressoReview'], 2)],
        referenceFoodForKey(key)
      );
    }

    if (tier1 === 'Other' && tier2 === 'Defect') {
      return profile(
        'limited-coffee-evidence',
        '이 결점명에 대한 특정 분자 원인은 현재 데이터셋의 검증 기준을 충족하지 않았습니다. 임의로 분자를 배정하지 않습니다.',
        []
      );
    }

    if (tier1 === 'Other' && tier2 === 'Chemical') {
      return profile(
        'not-established',
        'Chemical·medicinal·rubber·plastic·tar·solvent는 서로 다른 원인(오염, 포장재, 로스팅, 결점)을 가질 수 있는 경고성 감각 레퍼런스입니다. 이 데이터셋의 엄격한 기준에서는 특정 분자를 임의로 지정하지 않습니다.',
        []
      );
    }

    if (tier1 === 'Other' && tier2 === 'Animal') {
      return profile(
        'not-established',
        '동물성·밀랍 레퍼런스는 복합 감각 표현입니다. 커피에서 이 세부 노트의 단일 원인 분자는 확인되지 않았습니다.',
        []
      );
    }

    if (tier1 === 'Other' && tier2 === 'Mineral') {
      return profile(
        'not-established',
        '미네랄·돌·소금은 대개 향기분자가 아닌 맛·촉감·연상 표현입니다. 단일 휘발성 향미분자로 환원하지 않습니다.',
        []
      );
    }

    return NONE();
  }

  window.FLAVOR_EVIDENCE_SOURCES = SOURCES;
  window.getFlavorEvidence = getFlavorEvidence;
})();
