'use strict';
// Owns one public Tesseract worker handle. Cancellation during startup waits for
// createWorker to settle; no replacement may start until termination completes.
(function (root) {
  class OcrWorkerLifecycle {
    constructor(onState = () => {}) { this.state='idle';this.onState=onState;this.task=null;this.cancelled=false;this.cancelSignal=null; }
    setState(state) { this.state=state;this.onState(state); }
    run(create, execute) {
      if(this.state!=='idle') return Promise.reject(new Error('OCR_WORKER_BUSY'));
      this.cancelled=false;
      const cancelled=new Promise(resolve=>{this.cancelSignal=resolve;});
      this.setState('starting');
      this.task=(async()=>{
        let worker;
        try {
          worker=await create();
          if(this.cancelled)return {cancelled:true};
          this.setState('running');
          const outcome=await Promise.race([Promise.resolve().then(()=>execute(worker)).then(data=>({data})),cancelled.then(()=>({cancelled:true}))]);
          return this.cancelled?{cancelled:true}:outcome;
        }catch(error){if(this.cancelled)return {cancelled:true};throw error;}
        finally {
          try { if(worker)await worker.terminate(); }
          finally { this.task=null;this.cancelSignal=null;this.setState('idle'); }
        }
      })();
      return this.task;
    }
    cancel() {
      if(this.state==='idle')return Promise.resolve();
      this.cancelled=true;this.setState('stopping');this.cancelSignal();
      return this.task;
    }
  }
  if(typeof module==='object'&&module.exports)module.exports=OcrWorkerLifecycle;
  else root.OcrWorkerLifecycle=OcrWorkerLifecycle;
})(typeof window==='object'?window:globalThis);
