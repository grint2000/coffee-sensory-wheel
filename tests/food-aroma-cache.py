"""Verify the literature asset is installed, obsolete caches retire, and offline reloads work."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path(os.environ.get('FOOD_AROMA_OUTPUT','/workspace/aroma-expansion-validation'))
BASE=os.environ.get('FOOD_AROMA_URL','http://127.0.0.1:8000/')
with sync_playwright() as pw:
    launch={'executable_path':'/usr/bin/chromium','headless':True}
    if os.environ.get('HTTPS_PROXY'):launch['proxy']={'server':os.environ['HTTPS_PROXY'],'bypass':'127.0.0.1,localhost'}
    browser=pw.chromium.launch(**launch)
    context=browser.new_context(service_workers='allow',viewport={'width':1440,'height':1100})
    page=context.new_page()
    # Seed obsolete cache names as a returning installation would have.
    page.goto(BASE+'offline.html')
    page.evaluate('''async()=>{await caches.open('noel-sca-app-v19-food-aroma');await caches.open('noel-sca-runtime-v19-food-aroma');}''')
    page.goto(BASE,wait_until='networkidle')
    page.evaluate('navigator.serviceWorker.ready')
    page.wait_for_function('navigator.serviceWorker.controller!==null')
    page.wait_for_function('''async()=>{const keys=await caches.keys();return keys.includes('noel-sca-app-v20-aroma-literature')&&!keys.some(k=>k.includes('v19'));}''')
    page.reload(wait_until='networkidle')
    assets=['aroma-literature-data.js','food-aroma-data.js','food-aroma.css','flavor-evidence.js']
    shell=page.evaluate('''async(files)=>{const c=await caches.open('noel-sca-app-v20-aroma-literature');return Promise.all(files.map(async file=>({file,status:(await c.match(new URL(file,location.href)))?.status})));}''',assets)
    assert all(x['status']==200 for x in shell),shell
    before=page.evaluate('''()=>FLAVOR_DATA.map(r=>{const e=getFlavorEvidence(r.slice(0,3).join('|'));return[e.key,e.status,e.entries.map(c=>c.nameOriginal)];})''')
    context.set_offline(True)
    offline=page.evaluate('''async(files)=>Promise.all(files.map(async file=>{const r=await fetch(file);return{file,status:r.status,bytes:(await r.text()).length};}))''',assets)
    assert all(x['status']==200 and x['bytes']>300 for x in offline),offline
    page.reload(wait_until='networkidle')
    page.wait_for_function('window.AromaLiteratureData && window.getFlavorEvidence')
    after=page.evaluate('''()=>FLAVOR_DATA.map(r=>{const e=getFlavorEvidence(r.slice(0,3).join('|'));return[e.key,e.status,e.entries.map(c=>c.nameOriginal)];})''')
    assert before==after and len(after)==420
    result={'cache_names':page.evaluate('caches.keys()'),'shell':shell,'offline':offline,'offline_all_420_equal':True}
    OUT.mkdir(parents=True,exist_ok=True)
    (OUT/'cache-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
    print(json.dumps(result,ensure_ascii=False,indent=2))
    browser.close()
