const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../report-profiles-model.js');
const adapters={
 phases:[{id:'fragrance',label:'프래그런스'}],
 flavors:[['Fruit','Berry','Strawberry','#FF99AA','과일','베리','딸기']],
 attributes:{acidityLevel:{label:'산미',color:'#FF6B6B'}},
 intensities:{'Med-High':{kr:'중간-높음'}},
 bodyDescriptors:[{id:'smooth',korean:'부드러운',color:'#F5F5DC'}],
 internalRows:()=>[[],[],['커피명','프래그런스','산미','바디 디스크립터'],['커피','딸기','Med-High','부드러운']]
};
function fixture(){return {currentSessionId:'s',currentSampleId:'a',sessions:[{id:'s',date:'2026-10-02',samples:[{id:'a',sampleData:{coffeeName:'커피',origin:'Ethiopia',process:'Natural',roastDate:'2026-09-22',roastLevel:'medium-light',lotNumber:'비공개 로트',supplierName:'비공개 공급자',tastingNotes:'비공개 메모',flavorSelections:{fragrance:['Fruit|Berry|Strawberry']},acidityLevel:'Med-High',bodyDescriptors:['smooth']}}]}]};}

test('reviewed projection restores SNS fields, preserves scalar metadata and excludes unchecked values',()=>{
 const snapshot=fixture(),c=M.candidates(snapshot,'sample','customer',adapters);
 const fields=c.records[0].fields,chosen=fields.filter(f=>f.kind);
 assert.deepEqual(chosen.map(f=>f.kind),['name','coffee','coffee','coffee','coffee','flavor','attribute','body']);
 assert.equal(chosen.find(f=>f.kind==='attribute').value,'중간-높음');
 const p=M.project(c,chosen.map(f=>f.key));
 snapshot.sessions[0].samples[0].sampleData.origin='CHANGED';
 assert.equal(p.records[0].fields.find(f=>f.label==='원산지').value,'Ethiopia');
 assert.ok(Object.isFrozen(p.records[0].fields[0]));
 for(const f of p.records[0].fields)for(const v of Object.values(f))assert.ok(M.scalar(v));
 assert.doesNotMatch(JSON.stringify(p),/비공개|CHANGED/);
 assert.deepEqual(M.rows(p).slice(6).map(r=>r.slice(1)),p.records[0].fields.map(f=>[f.label,f.value]));
 assert.throws(()=>M.project(c,[]));
});

test('unknown notes remain literal, with neutral badges; empty attributes are not invented',()=>{
 const snapshot=fixture(),d=snapshot.sessions[0].samples[0].sampleData;
 d.flavorSelections.fragrance=['<img src=x onerror=alert(1)>'];d.bodyDescriptors=['unknown'];d.acidityLevel='';
 const fields=M.candidates(snapshot,'sample','customer',adapters).records[0].fields;
 assert.equal(fields.find(f=>f.kind==='flavor').value,d.flavorSelections.fragrance[0]);
 assert.equal(fields.find(f=>f.kind==='flavor').color,'#B8B2A5');
 assert.equal(fields.find(f=>f.kind==='body').value,'unknown');
 assert.ok(!fields.some(f=>f.kind==='attribute'));
});

test('internal records retain their reviewed values and get card roles too',()=>{
 const c=M.candidates(fixture(),'sample','internal',adapters),fields=c.records[0].fields;
 assert.deepEqual(fields.map(f=>f.kind),['name','flavor-list','attribute','body-list']);
 const p=M.project(c,fields.map(f=>f.key));
 assert.deepEqual(p.records[0].fields.map(f=>f.value),['커피','딸기','Med-High','부드러운']);
});
