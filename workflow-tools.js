/* Optional cupping workflow helpers. Record access goes through NOEL_WORKFLOW_API. */
(function(root) {
  'use strict';
  const MAX_COMPARE=4;
  function flatten(sessions, flavorLabel=key=>key) {
    return sessions.flatMap(session=>(session.samples || []).map(sample=>{
      const d=sample.sampleData || {};
      const flavors=Object.values(d.flavorSelections || {}).flat().map(flavorLabel).join(' ');
      return {key:JSON.stringify([session.id,sample.id]),sessionId:session.id,sampleId:sample.id,
        sessionTitle:session.title || '세션',date:session.date || '',title:sample.title || d.coffeeName || '샘플',
        origin:d.origin || '',process:d.process || '',lot:d.lotNumber || '',sample,
        search:[session.title,session.date,session.cupper,sample.title,d.coffeeName,d.origin,d.variety,d.process,d.farmName,d.harvestYear,d.lotNumber,d.supplier,d.tastingNotes,flavors].filter(Boolean).join(' ').toLocaleLowerCase()};
    }));
  }
  function search(rows, query='',order='recent',from='',to='') {
    const terms=query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return rows.filter(row=>terms.every(term=>row.search.includes(term)) && (!from || row.date>=from) && (!to || row.date<=to))
      .sort((a,b)=>order==='name' ? a.title.localeCompare(b.title,'ko') : b.date.localeCompare(a.date) || a.title.localeCompare(b.title,'ko'));
  }
  function timerValue(state,now) { return state.elapsed + (state.startedAt===null ? 0 : Math.max(0,now-state.startedAt)); }
  function timerAction(state,action,now) {
    if(action==='reset') return {elapsed:0,startedAt:null};
    if(action==='pause') return {elapsed:timerValue(state,now),startedAt:null};
    return state.startedAt===null ? {...state,startedAt:now} : {...state};
  }
  function parseTimer(raw) {
    if(!raw) return {elapsed:0,startedAt:null};
    const s=JSON.parse(raw);
    if(!Number.isFinite(s.elapsed) || s.elapsed<0 || (s.startedAt!==null && (!Number.isFinite(s.startedAt) || s.startedAt<0))) throw Error('타이머 기록을 읽지 못했습니다.');
    return {elapsed:s.elapsed,startedAt:s.startedAt};
  }
  function timerKey(context) { return 'noel_sca_timer_'+encodeURIComponent(context.user)+'_'+encodeURIComponent(context.sessionId); }
  function formatTime(milliseconds) {
    const seconds=Math.floor(milliseconds/1000);
    return [Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(v=>String(v).padStart(2,'0')).join(':');
  }
  root.NOEL_WORKFLOW={flatten,search,timerValue,timerAction,parseTimer,timerKey,formatTime,MAX_COMPARE};
  if(!root.document) return;
  function init() {
    const api=root.NOEL_WORKFLOW_API, host=document.getElementById('workflowTools');
    if(!api || !host) return;
    host.innerHTML='<div class="workflow-actions"><button type="button" id="historyOpen">전체 기록 검색·비교</button><button type="button" id="repeatSession" title="저장한 목적·장소·평가자·수온·분쇄도를 재사용합니다. 점수와 향미는 복사하지 않습니다.">같은 조건 새 세션</button></div><div class="workflow-timer"><span>세션 타이머</span><output id="cuppingTimer" aria-label="세션 경과 시간" aria-live="off">00:00:00</output><button type="button" id="timerToggle">시작</button><button type="button" id="timerReset">초기화</button></div><p id="workflowStatus" role="status"></p>';
    const byId=id=>document.getElementById(id), status=msg=>byId('workflowStatus').textContent=msg;
    let activeKey='', timer={elapsed:0,startedAt:null}, timerReadable=true, owner='', rows=[], selected=new Set();
    const dialog=document.createElement('dialog');dialog.id='historyDialog';dialog.className='workflow-dialog';dialog.setAttribute('aria-labelledby','historyHeading');
    dialog.innerHTML='<div class="workflow-actions"><h2 id="historyHeading">전체 커핑 기록</h2><button type="button" id="historyClose">닫기</button></div><label>기록 검색<input id="historyQuery" type="search" placeholder="커피명·로트·생산자·향미"></label><div class="workflow-filters"><label>시작일<input type="date" id="historyFrom"></label><label>종료일<input type="date" id="historyTo"></label><label>정렬<select id="historyOrder"><option value="recent">최근 평가일</option><option value="name">샘플명</option></select></label></div><p id="historyCount" role="status"></p><div class="workflow-actions"><button type="button" id="historyCompare">선택 기록 비교</button><button type="button" id="historyClear">선택 해제</button></div><p>2~4개를 선택하세요. 다른 세션의 기록도 함께 비교할 수 있습니다.</p><div class="workflow-table"><table><thead><tr><th>선택</th><th>샘플 / 세션</th><th>평가일</th><th>원산지 / 가공</th><th>기록</th></tr></thead><tbody id="historyRows"></tbody></table></div><div id="historyComparison" tabindex="-1"></div>';
    document.body.appendChild(dialog);
    function currentOwner() { return api.context()?.user || ''; }
    function guard() { if(owner!==currentOwner()) { dialog.close(); selected.clear(); throw Error('계정이 변경되었습니다. 기록 검색을 다시 열어 주세요.'); } }
    function safely(fn) { return ()=>{ try { fn(); } catch(error) { status(error.message); } }; }
    function refreshRows() {
      guard(); rows=flatten(api.snapshot().sessions,api.flavorLabel);
      const keys=new Set(rows.map(row=>row.key));selected.forEach(key=>{if(!keys.has(key))selected.delete(key);});
    }
    function render() {
      guard(); const from=byId('historyFrom').value,to=byId('historyTo').value;
      const visible=from && to && from>to ? [] : search(rows,byId('historyQuery').value,byId('historyOrder').value,from,to);
      byId('historyCount').textContent=from && to && from>to ? '종료일은 시작일 이후로 지정하세요.' : `검색 ${visible.length}개 / 전체 ${rows.length}개 · 선택 ${selected.size}개`;
      const tbody=byId('historyRows');tbody.replaceChildren();
      visible.forEach(row=>{
        const tr=document.createElement('tr'),td=document.createElement('td'),check=document.createElement('input');
        check.type='checkbox';check.checked=selected.has(row.key);check.setAttribute('aria-label',row.title+' · '+row.sessionTitle+' 비교 선택');
        check.addEventListener('change',()=>{
          if(check.checked && selected.size>=MAX_COMPARE) { check.checked=false;byId('historyCount').textContent='최대 4개까지 비교할 수 있습니다.';return; }
          if(check.checked)selected.add(row.key);else selected.delete(row.key);
          byId('historyCount').textContent=`검색 ${visible.length}개 / 전체 ${rows.length}개 · 선택 ${selected.size}개`;
        });td.appendChild(check);tr.appendChild(td);
        for(const value of [row.title+' / '+row.sessionTitle,row.date || '-',row.origin+' / '+row.process]) { const cell=document.createElement('td');cell.textContent=value;tr.appendChild(cell); }
        const action=document.createElement('td'),open=document.createElement('button');open.type='button';open.textContent='열기';
        open.addEventListener('click',safely(()=>{guard(); if(api.open(row.sessionId,row.sampleId)) dialog.close();else throw Error('기록을 열지 못했습니다. 기기 저장 상태를 확인하세요.');}));
        action.appendChild(open);tr.appendChild(action);tbody.appendChild(tr);
      });
      if(!visible.length) { const tr=document.createElement('tr'),cell=document.createElement('td');cell.colSpan=5;cell.textContent='해당 기록이 없습니다.';tr.appendChild(cell);tbody.appendChild(tr); }
    }
    byId('historyOpen').addEventListener('click',safely(()=>{
      owner=currentOwner();selected.clear();byId('historyComparison').replaceChildren();refreshRows();render();dialog.showModal();byId('historyQuery').focus();
    }));
    byId('historyClose').onclick=()=>dialog.close();
    dialog.addEventListener('close',()=>byId('historyOpen').focus());
    for(const id of ['historyQuery','historyFrom','historyTo','historyOrder']) byId(id).addEventListener('input',safely(render));
    byId('historyClear').onclick=safely(()=>{selected.clear();byId('historyComparison').replaceChildren();render();});
    byId('historyCompare').onclick=safely(()=>{
      refreshRows();const chosen=rows.filter(row=>selected.has(row.key));
      if(chosen.length<2 || chosen.length>4) { byId('historyCount').textContent='비교할 기록을 2~4개 선택하세요.';return; }
      api.compare(chosen.map(row=>({...row.sample,title:row.title+' · '+row.date+' · '+row.sessionTitle})),byId('historyComparison'));
      byId('historyComparison').focus();
    });
    byId('repeatSession').onclick=safely(()=>{if(api.repeat())status('평가 조건으로 새 세션을 만들었습니다. 점수와 향미는 새로 입력하세요.');else status('새 세션을 저장하지 못했습니다. 기존 기록은 유지됩니다.');});
    function tick() {
      const context=api.context();if(!context){activeKey='';return;}
      const key=timerKey(context);
      if(key!==activeKey) {
        activeKey=key;timerReadable=true;
        try { timer=parseTimer(localStorage.getItem(key)); }
        catch(error) { timer={elapsed:0,startedAt:null};timerReadable=false;status(error.message+' 초기화하면 새 타이머를 사용할 수 있습니다.'); }
        if(dialog.open && owner!==context.user)dialog.close();
      }
      byId('cuppingTimer').textContent=formatTime(timerValue(timer,Date.now()));
      byId('timerToggle').textContent=timer.startedAt===null ? '시작' : '일시정지';
    }
    function act(action) {
      tick(); if(!activeKey)return;
      if(!timerReadable && action!=='reset') { status('기존 타이머 기록을 읽지 못했습니다. 초기화를 눌러 주세요.');return; }
      const next=timerAction(timer,action,Date.now());
      try { localStorage.setItem(activeKey,JSON.stringify(next));timer=next;timerReadable=true;status(action==='reset' ? '타이머를 초기화했습니다.' : action==='pause' ? '타이머를 멈췄습니다.' : '타이머를 시작했습니다.'); }
      catch(_) { status('타이머 상태를 저장하지 못해 변경을 중단했습니다.'); }
      tick();
    }
    byId('timerToggle').onclick=()=>{tick();act(timer.startedAt===null?'start':'pause');};
    byId('timerReset').onclick=()=>act('reset');
    root.addEventListener('storage',event=>{if(event.key===activeKey)activeKey='';});
    tick();setInterval(tick,500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(typeof window==='undefined' ? globalThis : window);
