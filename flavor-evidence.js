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
      short: 'Czerny, Mayer & Grosch, J. Agric. Food Chem. 1999; 47:695–699',
      url: 'https://doi.org/10.1021/jf980759i'
    },
    coffeeModel: {
      short: 'Czerny, Mayer & Grosch, J. Agric. Food Chem. 1999; 47:695–699',
      url: 'https://doi.org/10.1021/jf980759i'
    },
    rawCoffee: {
      short: 'Czerny & Grosch, J. Agric. Food Chem. 2000; 48:868–872',
      url: 'https://doi.org/10.1021/jf990609n'
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
    },
    fruitReference: {
      short: 'Advances in Fruit Aroma Volatile Research, PMCID: PMC6270112',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6270112/'
    },
    floralReference: {
      short: 'Mostafa et al., Frontiers in Plant Science 2022; 13:860157',
      url: 'https://doi.org/10.3389/fpls.2022.860157'
    },
    spiceReference: {
      short: 'Molecules 2022; 27:6403, Spices Volatilomic Fingerprinting',
      url: 'https://doi.org/10.3390/molecules27196403'
    },
    teaReference: {
      short: 'Recent Advances in Volatiles of Teas, PMCID: PMC6273888',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6273888/'
    },
    teaKeyOdorants: {
      short: 'Identification of Key Flavor Compounds and Color Substances in Tea, 2025',
      url: 'https://doi.org/10.1007/s44187-025-00545-w'
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
      [rank('3-Isobutyl-2-methoxypyrazine (IBMP)', 'potent pea-like/green odorant identified in coffee', ['rawCoffee', 'espressoReview'], 1)],
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
    'Fruity|Berry|Strawberry': [['4-Hydroxy-2,5-dimethyl-3(2H)-furanone (furaneol)', 'Methyl butyrate'], 'fruitReference'],
    'Fruity|Berry|Wild Strawberry': [['4-Hydroxy-2,5-dimethyl-3(2H)-furanone (furaneol)', 'Methyl butyrate'], 'fruitReference'],
    'Fruity|Berry|Raspberry': [['4-(4-Hydroxyphenyl)-2-butanone (raspberry ketone)', 'α-Ionone'], 'fruitReference'],
    'Fruity|Berry|Black Currant': [['4-Mercapto-4-methylpentan-2-one', '3-Mercaptohexanol'], 'fruitReference'],
    'Fruity|Stone Fruit|Peach': [['γ-Decalactone', 'γ-Dodecalactone'], 'fruitReference'],
    'Fruity|Stone Fruit|White Peach': [['γ-Decalactone', 'γ-Dodecalactone'], 'fruitReference'],
    'Fruity|Stone Fruit|Yellow Peach': [['γ-Decalactone', 'γ-Dodecalactone'], 'fruitReference'],
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
    'Floral|Colored Flowers|Rose': [['2-Phenylethanol', 'Citronellol', 'Geraniol'], 'floralReference'],
    'Floral|Colored Flowers|Red Rose': [['2-Phenylethanol', 'Citronellol', 'Geraniol'], 'floralReference'],
    'Floral|Colored Flowers|Pink Rose': [['2-Phenylethanol', 'Citronellol', 'Geraniol'], 'floralReference'],
    'Floral|Colored Flowers|Lavender': [['Linalool', 'Linalyl acetate'], 'floralReference'],
    'Floral|Colored Flowers|Violet': [['β-Ionone', 'α-Ionone'], 'floralReference'],
    'Floral|Colored Flowers|Geranium': [['Citronellol', 'Geraniol'], 'floralReference'],
    'Floral|Herbal Flowers|Chamomile': [['α-Bisabolol', 'Chamazulene'], 'floralReference'],
    'Floral|Herbal Flowers|Osmanthus': [['β-Ionone', 'Dihydro-β-ionone'], 'floralReference'],
    'Spices|Warm Spices|Cinnamon': [['(E)-Cinnamaldehyde', 'Eugenol'], 'spiceReference'],
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
    'Tea|Oolong|Oolong': [['Linalool', 'Geraniol', 'Nerolidol'], 'teaReference'],
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
        '2025년 Panama Geisha 연구는 citrus/bergamot 감각 특성과 terpene 사이의 선형 인과를 확정하지 못했습니다. 따라서 아래 과일 기준 분자는 3순위 레퍼런스용이며 커피의 직접 원인으로 표기하지 않습니다.',
        [],
        [rank('Linalool', '커피에서 검출되며 floral/bergamot 관련 차이가 보고됐으나, 이 세부 감귤 노트의 직접 원인으로 확정되지 않았습니다.', ['geisha'], 2), rank('Geraniol', '커피에서 검출되며 floral/bergamot 관련 차이가 보고됐으나, 이 세부 감귤 노트의 직접 원인으로 확정되지 않았습니다.', ['geisha'], 2)],
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
        'key-coffee-evidence',
        '견과·코코아는 단일 식품 종이 아니라 로스팅 유래 pyrazine·furanone 등의 복합 지각입니다. 특정 견과종까지의 직접 인과는 입증되지 않았습니다.',
        [rank('2-Ethyl-3,5-dimethylpyrazine', 'potent nutty/roasty coffee odorant', ['coffeePotentOdorants', 'espressoReview'], 1), rank('2,3-Diethyl-5-methylpyrazine', 'potent nutty/roasty coffee odorant', ['coffeePotentOdorants'], 1)],
        [rank('4-Hydroxy-2,5-dimethyl-3(2H)-furanone (furaneol)', 'sweet/caramel-like coffee key odorant that can support cocoa-like impressions', ['coffeeKeyOdorants'], 2)],
        referenceFoodForKey(key)
      );
    }

    if (tier1 === 'Spices') {
      return profile(
        'key-coffee-evidence',
        '향신료 종명은 레퍼런스입니다. 커피에서 직접 확인된 것은 phenolic/spicy 계열의 향기활성 성분입니다.',
        [rank('Guaiacol', 'potent phenolic/spicy coffee odorant', ['coffeeKeyOdorants', 'espressoReview'], 1), rank('4-Vinylguaiacol', 'potent spicy/phenolic coffee odorant', ['coffeePotentOdorants', 'espressoReview'], 1)],
        [rank('4-Ethylguaiacol', 'roasted phenolic coffee odorant', ['espressoReview'], 2)],
        referenceFoodForKey(key)
      );
    }

    if (tier1 === 'Cereal/Grain') {
      return profile(
        'key-coffee-evidence',
        '곡물·토스트는 Maillard/로스팅 향의 복합 지각입니다. 브랜드·제품명까지의 분자 대응은 과학적으로 확정할 수 없습니다.',
        [rank('2-Ethyl-3,5-dimethylpyrazine', 'potent roasty/nutty coffee odorant', ['coffeePotentOdorants', 'espressoReview'], 1), rank('2-Furfurylthiol', 'key roasty coffee odorant', ['coffeePotentOdorants'], 1)],
        [rank('4-Hydroxy-2,5-dimethyl-3(2H)-furanone (furaneol)', 'sweet/caramel-like coffee odorant', ['coffeeKeyOdorants'], 2)],
        referenceFoodForKey(key)
      );
    }

    if (tier1 === 'Roasted') {
      return profile(
        'key-coffee-evidence',
        '로스팅 명칭은 배전도·공정 표현이며 단일 향미분자가 아닙니다. 아래는 로스팅 커피의 핵심 향기활성 성분입니다.',
        [rank('2-Furfurylthiol', 'key roasty/sulfurous coffee odorant', ['coffeePotentOdorants', 'espressoReview'], 1), rank('3-Mercapto-3-methylbutyl formate', 'potent roasty coffee odorant', ['coffeePotentOdorants', 'coffeeModel'], 1)],
        [rank('Guaiacol', 'potent phenolic roasted-coffee odorant', ['coffeeKeyOdorants'], 2), rank('4-Vinylguaiacol', 'roasted phenolic coffee odorant', ['coffeePotentOdorants'], 2)],
        referenceFoodForKey(key)
      );
    }

    if (tier1 === 'Green/Vegetative') {
      return profile(
        'key-coffee-evidence',
        'green/pea-like 커피 향에는 methoxypyrazine류가 강하게 기여할 수 있습니다. 특정 허브·채소 종명의 직접 인과는 확인되지 않았습니다.',
        [rank('3-Isobutyl-2-methoxypyrazine (IBMP)', 'potent pea-like/green coffee odorant', ['rawCoffee', 'espressoReview'], 1)],
        [rank('2-Isopropyl-3-methoxypyrazine (IPMP)', 'green/potato-like methoxypyrazine associated with defective coffee', ['potato'], 2)],
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
        'key-coffee-evidence',
        'earthy/mouldy는 결점 맥락에서의 강한 과학 근거가 있습니다. 긍정적 토양·트러플 레퍼런스와 자동으로 동일시하지 않습니다.',
        [rank('Geosmin', 'principal mouldy/earthy coffee off-flavour contributor', ['mouldy'], 1), rank('2-Methylisoborneol', 'principal mouldy/earthy coffee off-flavour contributor', ['mouldy'], 1)],
        [rank('2,4,6-Trichloroanisole', 'mouldy/earthy coffee off-flavour contributor', ['mouldy'], 2)],
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
