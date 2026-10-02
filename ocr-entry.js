/* Small entry point only. OCR modules/runtime are requested after explicit clicks. */
(function(){
 const base=new URL('./',document.currentScript.src);
 window.installOcrLabelInput=function(){
  if(document.getElementById('ocrLabelPanel'))return;
  const panel=document.createElement('details');panel.id='ocrLabelPanel';panel.className='ocr-label-panel';
  const title=document.createElement('summary');title.textContent='라벨 사진에서 입력 · 선택';panel.append(title);
  const help=document.createElement('p');help.textContent='사진의 글자를 이 기기에서 읽고, 확인한 품명·로트·크롭·가공만 미리보기 후 적용합니다.';panel.append(help);
  const open=document.createElement('button');open.type='button';open.id='ocrOpen';open.textContent='라벨 검토 열기';panel.append(open);
  const status=document.createElement('p');status.setAttribute('role','status');panel.append(status);
  document.getElementById('recordIdentitySummary').closest('section').after(panel);
  open.addEventListener('click',async()=>{open.disabled=true;status.textContent='검토 화면을 준비합니다';try{const ui=await import(new URL('ocr-ui.mjs',base).href);ui.install(panel,base);open.hidden=true;status.textContent='';}catch(_){open.disabled=false;status.textContent='검토 화면을 읽지 못했습니다. 연결 상태를 확인하고 다시 열어 주세요';}});
 };
})();
