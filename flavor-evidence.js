/* Exact-key reference-food resolver; stored flavor keys and selections are unchanged. */
(function(){
  'use strict';
  window.FLAVOR_EVIDENCE_SOURCES=FoodAromaData.sources;
  window.getFlavorEvidence=function(key){
    const record=FLAVOR_DATA.find(f=>f.slice(0,3).join('|')===key);
    return FoodAromaData.resolve(key,record);
  };
})();
