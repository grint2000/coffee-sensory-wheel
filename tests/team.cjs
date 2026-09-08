const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('team.js','utf8').replace(/^import .*;$/gm,'');
let callback,record=null,writes=[],confirmResult=true,conflict=false;
const auth={currentUser:{uid:'u1',displayName:'Same name'}};
const storage=new Map();const elements=new Map();
function element(){return {textContent:'',classList:{toggle(){},add(){},remove(){}},appendChild(){},setAttribute(){},addEventListener(){},parentElement:{appendChild(){}}};}
const box={console,JSON,Date,Error,Array,Promise,initializeApp:()=>({}),getAuth:()=>auth,getFirestore:()=>({}),GoogleAuthProvider:function(){},signInWithPopup:async()=>{},signOut:async()=>{auth.currentUser=null;await callback(null)},onAuthStateChanged:(_,cb)=>callback=cb,
 doc:(_,collection,name)=>name,localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
 document:{readyState:'complete',getElementById:id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id)},createElement:element,addEventListener(){}},
 alert(){},confirm:()=>confirmResult,arrayUnion:x=>[x],deleteField:()=>null,
 getDoc:async()=>({exists:()=>!!record,data:()=>JSON.parse(JSON.stringify(record))}),
 runTransaction:async(_,fn)=>{if(conflict){record.memberSamples.u1=[{changed:true}];conflict=false;}return fn({get:async()=>({exists:()=>!!record,data:()=>record}),set:(ref,v)=>{writes.push(v);record=v},update:(ref,v)=>{writes.push(v);Object.assign(record,v);}})},
 onSnapshot:()=>()=>{},updateDoc:async()=>{},setDoc:async()=>{},};
box.window=box;box.currentUser='default';box.activateLocalUser=user=>{box.currentUser=user;return true};box.getTeamShareSamples=()=>[{id:'sample',sampleData:{}}];box.importTeamSamples=()=>true;
vm.createContext(box);vm.runInContext(source,box);
(async()=>{
 await callback(auth.currentUser);assert.equal(box.currentUser,'firebase_u1');
 await box.createTeam('Test');assert.equal(record.owner,'u1');assert.equal(Object.keys(record.memberSamples).length,0);
 const count=writes.length;await box.createTeam('Test');assert.equal(writes.length,count,'existing team must not be overwritten');
 record.memberSamples.u1=[{id:'preserved'}];await box.joinTeam('Test');assert.equal(record.memberSamples.u1[0].id,'preserved');
 await box.syncSamplesToTeam([{secret:true}]);assert.equal(writes.length,count,'autosave must not transmit');
 confirmResult=false;await box.publishTeamSamples();assert.equal(writes.length,count);
 confirmResult=true;conflict=true;await box.publishTeamSamples();assert.equal(writes.length,count,'concurrent change must reject');
 await box.publishTeamSamples();assert.equal(writes.length,count+1);assert.ok(writes.at(-1)['memberSamples.u1']);
 auth.currentUser={uid:'u2',displayName:'Same name'};await callback(auth.currentUser);assert.equal(box.currentUser,'firebase_u2');
 await box.publishTeamSamples();assert.equal(writes.length,count+1,'other user must not inherit team');
 await box.logoutFirebase();assert.equal(box.currentUser,'default');
 console.log('PASS: UID profile isolation, create collision, rejoin preservation, no automatic upload, cancellation, concurrent conflict, explicit publish and logout. Mock Firebase only.');
})().catch(err=>{console.error(err);process.exitCode=1});
