/*
 * Coffee Sensory Wheel — evidence resolver
 *
 * The resolver deliberately does not assign a food-reference molecule as a
 * coffee molecule. A compound is shown in rank 1 only when a coffee study
 * reports it as a potent/key odorant (GC-O/AEDA/OAV, and where available
 * recombination or omission work). Rank 2 means it is reported in coffee or
 * has a coffee sensory correlation, but does not prove the exact Tier 3 note.
 * Rank 3 is reserved for a reference-food compound and must never be read as
 * direct evidence for that compound in coffee.
 */
(function () {
  'use strict';

  const SOURCES = {
    coffeeKeyOdorants: {
      short: 'Semmelroch & Grosch, J. Agric. Food Chem. 1996; 44:537–543',
      url: 'https://doi.org/10.1021/jf9505988'
    },
    coffeePotentOdorants: {
      short: 'Czerny & Grosch, Z. Lebensm. Unters. Forsch. 2000; 211:272–276',
      url: 'https://doi.org/10.1007/s002170000158'
    },
    coffeeModel: {
      short: 'Mayer, Czerny & Grosch, Eur. Food Res. Technol. 2000; 211:272–276',
      url: 'https://doi.org/10.1007/s002170000158'
    },
    espressoReview: {
      short: 'Angeloni et al., Molecules 2021; 26:3856',
      url: 'https://doi.org/10.3390/molecules26133856'
    },
    geisha: {
      short: 'Koyner et al., J. Sci. Food Agric. 2025; 105:6177–6189',
      url: 'https://doi.org/10.1002/jsfa.14410'
    },
    acids: {
      short: 'Gloess et al., Food Chemistry 2023; 415:135718',
      url: 'https://doi.org/10.1016/j.foodchem.2023.135718'
    },
    potato: {
      short: 'Frato et al., J. Agric. Food Chem. 2019; 68:128–136',
      url: 'https://doi.org/10.1021/acs.jafc.9b06242'
    },
    mouldy: {
      short: 'Cantergiani et al., Eur. Food Res. Technol. 2001; 212:648–657',
      url: 'https://doi.org/10.1007/s002170100305'
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
      '커피의 캐러멜형 향은 여러 푸라논의 혼합 지각입니다. 아래 1순위는 커피에서 향기활성 분자로 정량·감각 검증된 항목입니다.',
      [
        rank('4-Hydroxy-2,5-dimethyl-3(2H)-furanone (furaneol)', 'sweet/caramel-like key odorant in coffee brews', ['coffeeKeyOdorants', 'coffeePotentOdorants'], 1),
        rank('2(5)-Ethyl-4-hydroxy-5(2)-methyl-3(2H)-furanone', 'sweet/caramel-like key odorant in coffee aroma models', ['coffeeKeyOdorants', 'coffeeModel'], 1)
      ],
      [rank('3-Hydroxy-4,5-dimethyl-2(5H)-furanone (sotolon)', 'potent seasoning/caramel-like coffee odorant; intensity depends on matrix and roast', ['coffeePotentOdorants', 'espressoReview'], 2)]
    ),
    'Sweet|Caramelized|Toffee': profile(
      'key-coffee-evidence',
      'Toffee는 단일 화합물이 아니라 캐러멜화·로스팅 향의 조합입니다.',
      [rank('4-Hydroxy-2,5-dimethyl-3(2H)-furanone (furaneol)', 'coffee key odorant with sweet/caramel-like quality', ['coffeeKeyOdorants', 'coffeePotentOdorants'], 1)],
      [rank('2(5)-Ethyl-4-hydroxy-5(2)-methyl-3(2H)-furanone', 'caramel-like coffee odorant', ['coffeeKeyOdorants', 'coffeeModel'], 2)]
    ),
    'Sweet|Caramelized|Burnt Sugar': profile(
      'key-coffee-evidence',
      '탄 설탕은 로스팅에서 생성되는 푸라논류의 감각 묘사이며, 단일 분자명은 아닙니다.',
      [rank('3-Hydroxy-4,5-dimethyl-2(5H)-furanone (sotolon)', 'potent caramel/seasoning-like coffee odorant', ['coffeePotentOdorants', 'espressoReview'], 1)],
      [rank('4-Hydroxy-2,5-dimethyl-3(2H)-furanone (furaneol)', 'sweet/caramel-like coffee odorant', ['coffeeKeyOdorants'], 2)]
    ),
    'Roasted|Smoky|Smoky': profile(
      'key-coffee-evidence',
      '훈연은 여러 페놀·황화합물의 복합 지각입니다.',
      [rank('Guaiacol', 'potent phenolic/smoky coffee odorant', ['coffeeKeyOdorants', 'espressoReview'], 1), rank('4-Vinylguaiacol', 'potent spicy/phenolic coffee odorant formed during roasting', ['coffeePotentOdorants', 'espressoReview'], 1)],
      [rank('4-Ethylguaiacol', 'important roasted phenolic coffee odorant', ['espressoReview'], 2)]
    ),
    'Roasted|Smoky|Wood Smoke': profile(
      'key-coffee-evidence',
      '나무연기는 훈연과 같은 페놀계 복합 지각입니다.',
      [rank('Guaiacol', 'potent phenolic/smoky coffee odorant', ['coffeeKeyOdorants', 'espressoReview'], 1)],
      [rank('4-Vinylguaiacol', 'spicy/phenolic roasted-coffee odorant', ['coffeePotentOdorants'], 2)]
    ),
    'Roasted|Dark Roast|Burnt': profile(
      'key-coffee-evidence',
      '탄 향은 특정 단일 화합물보다 고배전에서 증가하는 황화합물·페놀류의 조합으로 해석해야 합니다.',
      [rank('2-Furfurylthiol', 'key roasty/sulfurous coffee odorant', ['coffeePotentOdorants', 'espressoReview'], 1), rank('3-Mercapto-3-methylbutyl formate', 'potent roasty coffee odorant; roast-dependent contribution', ['coffeePotentOdorants', 'coffeeModel'], 1)],
      [rank('Guaiacol', 'potent phenolic roasted coffee odorant', ['coffeeKeyOdorants'], 2)]
    ),
    'Roasted|Dark Roast|Ashy': profile(
      'key-coffee-evidence',
      'Ashy는 감각 묘사이며 단일 분자에 직접 대응하지 않습니다.',
      [rank('Guaiacol', 'potent phenolic/smoky coffee odorant', ['coffeeKeyOdorants', 'espressoReview'], 1)],
      [rank('4-Vinylguaiacol', 'roasted phenolic coffee odorant', ['coffeePotentOdorants'], 2)]
    ),
    'Green/Vegetative|Fresh Green|Green Bell Pepper': profile(
      'key-coffee-evidence',
      '커피에서 methoxypyrazine류는 pea-like/green 계열의 강한 향기활성 성분으로 보고되었습니다. 피망이라는 세부 레퍼런스까지의 직접 인과는 별도입니다.',
      [rank('3-Isobutyl-2-methoxypyrazine (IBMP)', 'potent pea-like/green odorant identified in coffee', ['coffeePotentOdorants', 'espressoReview'], 1)],
      [rank('2-Isopropyl-3-methoxypyrazine (IPMP)', 'green/potato-like methoxypyrazine; especially relevant to defective coffee', ['potato'], 2)]
    ),
    'Sour/Fermented|Clean Acidity|Citric Acid': profile('key-coffee-evidence', '산은 휘발성 향미분자가 아니라 맛·산미에 기여하는 비휘발성 화합물입니다.', [rank('Citric acid', 'quantified in brewed coffee; concentration changes systematically with roast', ['acids'], 1)]),
    'Sour/Fermented|Clean Acidity|Malic Acid': profile('key-coffee-evidence', '산은 휘발성 향미분자가 아니라 맛·산미에 기여하는 비휘발성 화합물입니다.', [rank('Malic acid', 'quantified in brewed coffee; concentration changes systematically with roast', ['acids'], 1)]),
    'Sour/Fermented|Clean Acidity|Phosphoric Acid': profile('key-coffee-evidence', '산은 휘발성 향미분자가 아니라 맛·산미에 기여하는 비휘발성 화합물입니다.', [rank('Phosphoric acid', 'quantified in brewed coffee; concentration changes systematically with roast', ['acids'], 1)]),
    'Sour/Fermented|Clean Acidity|Lactic Acid': profile('key-coffee-evidence', '산은 휘발성 향미분자가 아니라 맛·산미에 기여하는 비휘발성 화합물입니다.', [rank('Lactic acid', 'quantified in brewed coffee; concentration changes systematically with roast', ['acids'], 1)]),
    'Sour/Fermented|Sour|Acetic Acid': profile('key-coffee-evidence', '산은 휘발성 향미분자가 아니라 맛·산미에 기여하는 비휘발성 화합물입니다.', [rank('Acetic acid', 'quantified in brewed coffee; concentration changes systematically with roast', ['acids'], 1)]),
    'Other|Defect|Potato': profile('key-coffee-evidence', 'Potato taste defect(PTD)는 특정 methoxypyrazine과 연관된 커피 결점으로 연구되었습니다.', [rank('2-Isopropyl-3-methoxypyrazine (IPMP)', 'associated with potato taste defect in green and roasted coffee', ['potato'], 1)]),
    'Other|Defect|Rio': profile('key-coffee-evidence', 'Rio/곰팡이·흙 결점은 여러 오염·미생물 유래 물질의 복합 문제입니다.', [rank('Geosmin', 'identified as a principal mouldy/earthy coffee off-flavour contributor', ['mouldy'], 1), rank('2-Methylisoborneol', 'identified as a principal mouldy/earthy coffee off-flavour contributor', ['mouldy'], 1), rank('2,4,6-Trichloroanisole', 'identified as a principal mouldy/earthy coffee off-flavour contributor', ['mouldy'], 1)]),
    'Other|Defect|Phenol': profile('key-coffee-evidence', 'Phenolic은 화학군·감각 범주이며 단일 분자명이 아닙니다.', [rank('4-Vinylguaiacol', 'potent spicy/phenolic coffee odorant', ['coffeePotentOdorants', 'espressoReview'], 1), rank('Guaiacol', 'potent phenolic coffee odorant', ['coffeeKeyOdorants'], 1)]),
    'Other|Earthy|Mushroom': profile('key-coffee-evidence', '버섯/흙은 결점 맥락에서 geosmin·2-MIB 등으로 확인되었으며, 정상 커피의 긍정적 ‘버섯’ 노트와 동일시할 수 없습니다.', [rank('Geosmin', 'principal mouldy/earthy off-flavour contributor in green coffee', ['mouldy'], 1), rank('2-Methylisoborneol', 'principal mouldy/earthy off-flavour contributor in green coffee', ['mouldy'], 1)]),
    'Other|Earthy|Soil': profile('key-coffee-evidence', '토양향은 결점 맥락에서 해석합니다.', [rank('Geosmin', 'principal mouldy/earthy coffee off-flavour contributor', ['mouldy'], 1)]),
    'Other|Mineral|Sulfur': profile('key-coffee-evidence', '황향은 여러 저역치 황화합물의 복합 지각입니다.', [rank('2-Furfurylthiol', 'key roasty/sulfurous coffee odorant', ['coffeePotentOdorants', 'espressoReview'], 1), rank('Methanethiol', 'important sulfurous coffee odorant', ['coffeePotentOdorants', 'espressoReview'], 1), rank('3-Methyl-2-butene-1-thiol', 'key sulfur-containing coffee odorant', ['coffeeModel'], 1)])
  };

  const citrusReference = {
    Lemon: ['Citral (neral + geranial)', 'Limonene'], Orange: ['Limonene', 'Myrcene'], Grapefruit: ['Nootkatone', 'Linalool'], Lime: ['Limonene', 'Citral (neral + geranial)'],
    Tangerine: ['Limonene', 'γ-Terpinene'], Yuzu: ['Limonene', 'γ-Terpinene'], Bergamot: ['Linalyl acetate', 'Linalool'], Mandarin: ['Limonene', 'γ-Terpinene'],
    Kumquat: ['Limonene'], Citron: ['Limonene', 'Citral (neral + geranial)'], 'Blood Orange': ['Limonene', 'Linalool'], Pomelo: ['Nootkatone', 'Linalool'], 'Key Lime': ['Limonene', 'Citral (neral + geranial)']
  };

  function foodReference(names) {
    return names.map(name => rank(name, '레퍼런스 식품의 대표 향기 성분. 커피에서 이 세부 노트의 직접 원인으로 입증된 것은 아닙니다.', [], 3));
  }

  function getFlavorEvidence(key) {
    if (EXACT[key]) return EXACT[key];
    const [tier1, tier2, tier3] = String(key || '').split('|');

    if (tier1 === 'Fruity' && tier2 === 'Citrus Fruit') {
      const ref = citrusReference[tier3] || ['Limonene'];
      return profile(
        'limited-coffee-evidence',
        '2025년 Panama Geisha 연구는 citrus/bergamot 감각 특성과 terpene 사이의 선형 인과를 확정하지 못했습니다. 따라서 아래 과일 기준 분자는 3순위 레퍼런스용이며 커피의 직접 원인으로 표기하지 않습니다.',
        [],
        [rank('Linalool', '커피에서 검출되며 floral/bergamot 관련 차이가 보고됐으나, 이 세부 감귤 노트의 직접 원인으로 확정되지 않았습니다.', ['geisha'], 2), rank('Geraniol', '커피에서 검출되며 floral/bergamot 관련 차이가 보고됐으나, 이 세부 감귤 노트의 직접 원인으로 확정되지 않았습니다.', ['geisha'], 2)],
        foodReference(ref)
      );
    }

    if (tier1 === 'Fruity') {
      return profile(
        'limited-coffee-evidence',
        '세부 과일명은 인간의 연상 레퍼런스입니다. 커피에서 해당 과일을 단일 분자로 재현했다는 직접 증거는 확인되지 않았습니다.',
        [],
        [rank('(E)-β-Damascenone', 'potent fruity/honey-like odorant identified in roasted coffee', ['coffeePotentOdorants', 'espressoReview'], 2), rank('Phenylacetaldehyde', 'floral/honey-like aroma-active compound reported in coffee studies', ['espressoReview'], 2)]
      );
    }

    if (tier1 === 'Floral') {
      return profile(
        'limited-coffee-evidence',
        '꽃의 종(자스민·장미 등)을 단일 커피분자로 특정할 수 없습니다. 커피에서 확인된 floral 계열 후보만 2순위로 표시합니다.',
        [],
        [rank('Linalool', 'reported in coffee and associated with floral/bergamot differences, not a single-flower proof', ['geisha', 'espressoReview'], 2), rank('Geraniol', 'reported in coffee and associated with floral/bergamot differences, not a single-flower proof', ['geisha'], 2), rank('Phenylacetaldehyde', 'floral/honey-like aroma-active compound reported in coffee studies', ['espressoReview'], 2)]
      );
    }

    if (tier1 === 'Nutty/Cocoa') {
      return profile(
        'key-coffee-evidence',
        '견과·코코아는 단일 식품 종이 아니라 로스팅 유래 pyrazine·furanone 등의 복합 지각입니다. 특정 견과종까지의 직접 인과는 입증되지 않았습니다.',
        [rank('2-Ethyl-3,5-dimethylpyrazine', 'potent nutty/roasty coffee odorant', ['coffeePotentOdorants', 'espressoReview'], 1), rank('2,3-Diethyl-5-methylpyrazine', 'potent nutty/roasty coffee odorant', ['coffeePotentOdorants'], 1)],
        [rank('4-Hydroxy-2,5-dimethyl-3(2H)-furanone (furaneol)', 'sweet/caramel-like coffee key odorant that can support cocoa-like impressions', ['coffeeKeyOdorants'], 2)]
      );
    }

    if (tier1 === 'Spices') {
      return profile(
        'key-coffee-evidence',
        '향신료 종명은 레퍼런스입니다. 커피에서 직접 확인된 것은 phenolic/spicy 계열의 향기활성 성분입니다.',
        [rank('Guaiacol', 'potent phenolic/spicy coffee odorant', ['coffeeKeyOdorants', 'espressoReview'], 1), rank('4-Vinylguaiacol', 'potent spicy/phenolic coffee odorant', ['coffeePotentOdorants', 'espressoReview'], 1)],
        [rank('4-Ethylguaiacol', 'roasted phenolic coffee odorant', ['espressoReview'], 2)]
      );
    }

    if (tier1 === 'Cereal/Grain') {
      return profile(
        'key-coffee-evidence',
        '곡물·토스트는 Maillard/로스팅 향의 복합 지각입니다. 브랜드·제품명까지의 분자 대응은 과학적으로 확정할 수 없습니다.',
        [rank('2-Ethyl-3,5-dimethylpyrazine', 'potent roasty/nutty coffee odorant', ['coffeePotentOdorants', 'espressoReview'], 1), rank('2-Furfurylthiol', 'key roasty coffee odorant', ['coffeePotentOdorants'], 1)],
        [rank('4-Hydroxy-2,5-dimethyl-3(2H)-furanone (furaneol)', 'sweet/caramel-like coffee odorant', ['coffeeKeyOdorants'], 2)]
      );
    }

    if (tier1 === 'Roasted') {
      return profile(
        'key-coffee-evidence',
        '로스팅 명칭은 배전도·공정 표현이며 단일 향미분자가 아닙니다. 아래는 로스팅 커피의 핵심 향기활성 성분입니다.',
        [rank('2-Furfurylthiol', 'key roasty/sulfurous coffee odorant', ['coffeePotentOdorants', 'espressoReview'], 1), rank('3-Mercapto-3-methylbutyl formate', 'potent roasty coffee odorant', ['coffeePotentOdorants', 'coffeeModel'], 1)],
        [rank('Guaiacol', 'potent phenolic roasted-coffee odorant', ['coffeeKeyOdorants'], 2), rank('4-Vinylguaiacol', 'roasted phenolic coffee odorant', ['coffeePotentOdorants'], 2)]
      );
    }

    if (tier1 === 'Green/Vegetative') {
      return profile(
        'key-coffee-evidence',
        'green/pea-like 커피 향에는 methoxypyrazine류가 강하게 기여할 수 있습니다. 특정 허브·채소 종명의 직접 인과는 확인되지 않았습니다.',
        [rank('3-Isobutyl-2-methoxypyrazine (IBMP)', 'potent pea-like/green coffee odorant', ['coffeePotentOdorants', 'espressoReview'], 1)],
        [rank('2-Isopropyl-3-methoxypyrazine (IPMP)', 'green/potato-like methoxypyrazine associated with defective coffee', ['potato'], 2)]
      );
    }

    if (tier1 === 'Sour/Fermented' && tier2 === 'Clean Acidity') {
      return profile(
        'limited-coffee-evidence',
        '이 항목은 향기분자가 아니라 산미를 만드는 유기·무기산입니다. Tartaric acid는 이 기준 연구의 5개 정량 대상에 포함되지 않았으므로 직접 근거 부족으로 표시합니다.',
        [],
        [rank('Citric / malic / acetic / lactic / phosphoric acid', '각 산은 brewed coffee에서 정량됐으나, 특정 레퍼런스의 산미를 단독으로 결정하지는 않습니다.', ['acids'], 2)]
      );
    }

    if (tier1 === 'Sour/Fermented') {
      return profile(
        'limited-coffee-evidence',
        '발효 식품·주류명은 다성분 레퍼런스입니다. 커피에서 해당 제품과 동일한 분자 조합이 증명된 것은 아닙니다.',
        [],
        [rank('Acetic acid', 'quantified in brewed coffee; roast-dependent concentration change', ['acids'], 2), rank('Ethyl 2-methylbutyrate / ethyl 3-methylbutyrate', 'reported as fermentation-associated coffee volatiles; not a specific wine/beer proof', ['espressoReview'], 2)]
      );
    }

    if (tier1 === 'Tea') {
      return profile(
        'reference-only',
        '차의 종류·블렌드는 다성분 레퍼런스입니다. 해당 차의 향기분자를 커피의 직접 원인으로 이식하지 않습니다.',
        [],
        [rank('Linalool / phenylacetaldehyde / (E)-β-damascenone', '차에서도 중요할 수 있는 향기물질이나, 이 차 노트의 커피 직접 근거는 아닙니다.', ['geisha', 'espressoReview'], 2)]
      );
    }

    if (tier1 === 'Other' && tier2 === 'Earthy') {
      return profile(
        'key-coffee-evidence',
        'earthy/mouldy는 결점 맥락에서의 강한 과학 근거가 있습니다. 긍정적 토양·트러플 레퍼런스와 자동으로 동일시하지 않습니다.',
        [rank('Geosmin', 'principal mouldy/earthy coffee off-flavour contributor', ['mouldy'], 1), rank('2-Methylisoborneol', 'principal mouldy/earthy coffee off-flavour contributor', ['mouldy'], 1)],
        [rank('2,4,6-Trichloroanisole', 'mouldy/earthy coffee off-flavour contributor', ['mouldy'], 2)]
      );
    }

    if (tier1 === 'Other' && tier2 === 'Woody') {
      return profile(
        'limited-coffee-evidence',
        '수종은 레퍼런스입니다. 커피에는 phenolic 계열이 woody/phenolic 인상에 기여할 수 있지만 특정 목재종을 확정하지 않습니다.',
        [],
        [rank('Guaiacol', 'potent phenolic coffee odorant', ['coffeeKeyOdorants'], 2), rank('4-Ethylguaiacol', 'roasted phenolic coffee odorant', ['espressoReview'], 2)]
      );
    }

    if (tier1 === 'Other' && tier2 === 'Defect') {
      return profile(
        'limited-coffee-evidence',
        '이 결점명에 대한 특정 분자 원인은 현재 데이터셋의 검증 기준을 충족하지 않았습니다. 임의로 분자를 배정하지 않습니다.',
        []
      );
    }

    return NONE();
  }

  window.FLAVOR_EVIDENCE_SOURCES = SOURCES;
  window.getFlavorEvidence = getFlavorEvidence;
})();
