// Runs the existing 420-note pointer fixture in jsdom; no real browser, layout or touch device.
const fs=require('fs'),assert=require('assert/strict'),{JSDOM,VirtualConsole}=require('jsdom');
let html=fs.readFileSync('tests/reference-frame.html','utf8');
html=html.replace('<script src="../flavor-reference.js"></script>',()=>'<script>'+fs.readFileSync('flavor-reference.js','utf8').replaceAll('</script','<\\/script')+'</script>');
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(html,{url:'https://test.invalid/tests/reference-frame.html',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){
 w.fetch=async()=>({text:async()=>fs.readFileSync('index.html','utf8')});
 w.PointerEvent=class extends w.MouseEvent{constructor(type,options){super(type,options);Object.defineProperty(this,'pointerType',{value:options.pointerType});}};
}});
const w=dom.window,pause=()=>new Promise(resolve=>setTimeout(resolve,20));
(async()=>{
 const run=w.document.getElementById('run');for(let i=0;i<200&&run.disabled;i++)await pause();assert(!run.disabled,'fixture initialized');
 run.click();for(let i=0;i<600&&run.disabled;i++)await pause();assert(!run.disabled,'fixture finished');
 const result=w.document.getElementById('result').textContent;assert(!/FAIL|ERROR/.test(result),result);assert(result.includes('420개 실제 모달 렌더'),result);assert.equal(errors.length,0,errors.join('\n'));
 console.log(result+'\nSimulated DOM/pointer events only; visual layout/native touch remain separate.');w.close();
})().catch(error=>{console.error(error);w.close();process.exitCode=1});
