"""Local browser checks; run with a local HTTP server and Chromium/Playwright.

Writes evidence outside the repository to FOOD_AROMA_OUTPUT.
"""
import hashlib
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('FOOD_AROMA_URL', 'http://127.0.0.1:8000/')
OUT = Path(os.environ.get('FOOD_AROMA_OUTPUT', '/workspace/food-aroma-validation'))
OUT.mkdir(parents=True, exist_ok=True)
ORANGE = 'Fruity|Citrus Fruit|Orange'
class Results(list):
    def append(self, value):
        super().append(value)
        print('PASS:', value, flush=True)

results = Results()

with sync_playwright() as pw:
    launch = {'executable_path':'/usr/bin/chromium','headless':True}
    if os.environ.get('HTTPS_PROXY'):
        launch['proxy'] = {'server':os.environ['HTTPS_PROXY'],'bypass':'127.0.0.1,localhost'}
    browser = pw.chromium.launch(**launch)
    context = browser.new_context(viewport={'width':1440,'height':1100}, timezone_id='Asia/Seoul', accept_downloads=True, service_workers='block')
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(BASE, wait_until='networkidle')
    page.wait_for_function('window.P0Production && window.FoodAromaData && typeof window.getFlavorEvidence === "function"')
    data = page.evaluate('FLAVOR_DATA')
    digest = hashlib.sha256(json.dumps(data,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
    assert len(data) == 420 and digest == '80df1b444271f6387b77a4aab50c887624651599e6dbff62420b01e3f0dda936'
    results.append('420 original flavor rows, stored keys, labels and colors unchanged')

    page.locator('#coffeeName').fill('참고 식품 성분 회귀 확인')
    page.locator('#saveSamplesBtn').click()
    page.locator('#flavorSearchInput').fill('오렌지')
    trigger = page.locator(f'.flavor-evidence-trigger[data-evidence-key="{ORANGE}"]').first
    check = page.locator(f'.flavorSelectBox[data-key="{ORANGE}"]').first
    expect(trigger).to_be_visible()
    before = page.evaluate('JSON.stringify(getCurrentSampleObj().sampleData.flavorSelections)')
    trigger.click()
    modal = page.locator('#flavorEvidenceModal')
    expect(modal).to_be_visible()
    expect(modal.locator('.food-aroma-rank')).to_have_text(['1위','2위','3위'])
    expect(modal.locator('.food-aroma-original')).to_have_text(['Limonene','β-Myrcene','α-Pinene'])
    expect(modal.locator('.food-aroma-value')).to_have_text(['96.4 %','2.0 %','0.5 %'])
    expect(modal.locator('.food-aroma-reference')).to_contain_text('Navelina')
    expect(modal.locator('.food-aroma-reference')).to_contain_text('플라베도')
    expect(modal.locator('.food-aroma-reference')).to_contain_text('냉압착 정유 (CP)')
    assert '1단계' not in modal.inner_text() and '커피 직접 근거' not in modal.inner_text()
    assert page.evaluate('JSON.stringify(getCurrentSampleObj().sampleData.flavorSelections)') == before
    hrefs = modal.locator('a').evaluate_all('(nodes)=>nodes.map(n=>({href:n.href,rel:n.rel}))')
    assert any(x['href']=='https://doi.org/10.3934/agrfood.2025003' for x in hrefs)
    assert any(x['href'].endswith('agrfood-10-01-003.pdf#page=9') for x in hrefs)
    assert all('noopener' in x['rel'] and 'noreferrer' in x['rel'] for x in hrefs)
    assert modal.evaluate('''m=>{const nodes=['.flavor-evidence-head','.food-aroma-reference','.food-aroma-basis','.food-aroma-entries','.food-aroma-sources'].map(s=>m.querySelector(s));return nodes.every((n,i)=>!i||!!(nodes[i-1].compareDocumentPosition(n)&Node.DOCUMENT_POSITION_FOLLOWING));}''')
    page.evaluate('document.fonts.ready')
    modal.screenshot(path=str(OUT/'orange-desktop.png'))
    results.append('Actual orange popup: bilingual Top 3, exact values/units, matrix, source links and required section order')
    close = modal.locator('.flavor-evidence-close')
    expect(close).to_be_focused()
    page.keyboard.press('Shift+Tab')
    expect(modal.locator('summary')).to_be_focused()
    page.keyboard.press('Tab')
    expect(close).to_be_focused()
    page.keyboard.press('Escape')
    expect(modal).to_be_hidden()
    expect(trigger).to_be_focused()
    assert page.evaluate('document.body.style.overflow') != 'hidden'
    results.append('Keyboard focus trap includes analysis summary; Escape restores focus and scrolling')

    for key, status, count in [('Fruity|Tropical Fruit|Banana','representative',2),('Fruity|Citrus Fruit|Blood Orange','unverified',0),('Other|Mineral|Salt','not-applicable',0)]:
        page.evaluate('(key)=>openFlavorEvidenceModal(key)',key)
        expect(modal.locator('.food-aroma-status')).to_have_attribute('data-status',status)
        expect(modal.locator('.food-aroma-entry')).to_have_count(count)
        expect(modal.locator('.food-aroma-rank')).to_have_count(0)
        if count: expect(modal.locator('.food-aroma-value')).to_have_text(['값 미확인']*count)
        modal.screenshot(path=str(OUT/(status+'-desktop.png')))
        page.keyboard.press('Escape')
    results.append('Representative-only, unverified and not-applicable states do not fabricate ranks')

    # Exercise actual formatting of tied and missing data, then restore the real resolver.
    page.evaluate('''() => {
      window.testOriginalFoodResolver=window.getFlavorEvidence;
      const s=JSON.parse(JSON.stringify(FoodAromaData.orangeStudy));
      s.measurements=[{compoundId:'limonene',value:10},{compoundId:'myrcene',value:10},{compoundId:'pinene',value:5}];
      window.getFlavorEvidence=key=>({...testOriginalFoodResolver(key),...FoodAromaData.analyseStudy(s)});
      openFlavorEvidenceModal('Fruity|Citrus Fruit|Orange');
    }''')
    expect(modal.locator('.food-aroma-rank')).to_have_text(['공동 1위','공동 1위','3위'])
    page.keyboard.press('Escape')
    page.evaluate('''() => {
      const s=JSON.parse(JSON.stringify(FoodAromaData.orangeStudy));s.measurements[0].value=null;
      window.getFlavorEvidence=key=>({...testOriginalFoodResolver(key),...FoodAromaData.analyseStudy(s)});
      openFlavorEvidenceModal('Fruity|Citrus Fruit|Orange');
    }''')
    expect(modal.locator('.food-aroma-rank')).to_have_count(0)
    expect(modal.locator('.food-aroma-status')).to_contain_text('순위 미확정')
    assert '값 미확인' in modal.inner_text()
    page.keyboard.press('Escape')
    page.evaluate('window.getFlavorEvidence=window.testOriginalFoodResolver; delete window.testOriginalFoodResolver')
    results.append('Actual renderer handles ties and missing values without inventing ranks')

    check.locator('..').locator('.checkbox-custom').click()
    expect(check).to_be_checked()
    page.locator('#saveSamplesBtn').click()
    page.reload(wait_until='networkidle')
    expect(page.locator('#coffeeName')).to_have_value('참고 식품 성분 회귀 확인')
    saved = page.evaluate('getCurrentSampleObj().sampleData.flavorSelections.fragrance')
    assert saved == [ORANGE], saved
    results.append('Select → save → reload preserves the exact original Orange flavor key')

    mobile = browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,timezone_id='Asia/Seoul',storage_state=context.storage_state(),service_workers='block')
    mpage = mobile.new_page()
    mpage.on('pageerror', lambda e: errors.append(str(e)))
    mpage.goto(BASE,wait_until='networkidle')
    mpage.wait_for_function('window.getCuppingAccountId?.() === "local:default" && window.QuickEntry')
    # Prepare the folded, unchanged quick-entry area; test the new popup's touch controls below.
    mpage.locator('#quickEntryFlavorDetails').evaluate('(element)=>element.open=true')
    expect(mpage.locator('#flavorSearchInput')).to_be_visible()
    mpage.locator('#flavorSearchInput').fill('오렌지')
    mtrigger=mpage.locator(f'.flavor-evidence-trigger[data-evidence-key="{ORANGE}"]').first
    mtrigger.tap()
    mmodal=mpage.locator('#flavorEvidenceModal')
    expect(mmodal).to_be_visible()
    mpage.evaluate('document.fonts.ready')
    mmodal.screenshot(path=str(OUT/'orange-mobile.png'))
    assert mmodal.locator('.flavor-evidence-panel').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
    mmodal.locator('summary').tap()
    expect(mmodal.locator('.food-aroma-details')).to_have_attribute('open','')
    panel=mmodal.locator('.flavor-evidence-panel')
    scroll_y=mpage.evaluate('window.scrollY')
    panel.evaluate('(e)=>e.scrollTop=0')
    panel_scroll=panel.evaluate('(e)=>e.scrollTop')
    cdp=mobile.new_cdp_session(mpage)
    box=panel.bounding_box()
    x=box['x']+box['width']/2
    y=box['y']+box['height']*.8
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y,'id':0}]})
    for step in range(1,10):
        cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x,'y':y-step*35,'id':0}]})
        mpage.wait_for_timeout(30)
    cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
    mpage.wait_for_function('(before)=>document.querySelector(".flavor-evidence-panel").scrollTop>before',arg=panel_scroll,timeout=5000)
    assert mpage.evaluate('window.scrollY') == scroll_y
    assert mpage.evaluate('document.body.style.overflow') == 'hidden'
    mmodal.screenshot(path=str(OUT/'orange-mobile-analysis.png'))
    mpage.mouse.click(4,4)
    expect(mmodal).to_be_hidden()
    results.append('Mobile tap, detailed-analysis expansion, touch scrolling, backdrop close and no horizontal overflow')

    label=mpage.locator(f'.flavorSelectBox[data-key="{ORANGE}"]').first.locator('..')
    before=mpage.evaluate('JSON.stringify(getCurrentSampleObj().sampleData.flavorSelections)')
    label.dispatch_event('pointerdown',{'pointerType':'touch','clientX':100,'clientY':300})
    expect(mmodal).to_be_visible(timeout=3000)
    label.dispatch_event('pointerup',{'pointerType':'touch'})
    label.dispatch_event('click')
    assert mpage.evaluate('JSON.stringify(getCurrentSampleObj().sampleData.flavorSelections)') == before
    mpage.keyboard.press('Escape')
    label.dispatch_event('pointerdown',{'pointerType':'touch','clientX':100,'clientY':300})
    label.dispatch_event('pointermove',{'pointerType':'touch','clientX':100,'clientY':340})
    label.dispatch_event('pointerup',{'pointerType':'touch'})
    label.dispatch_event('click')
    mpage.wait_for_timeout(700)
    expect(mmodal).to_be_hidden()
    assert mpage.evaluate('JSON.stringify(getCurrentSampleObj().sampleData.flavorSelections)') == before
    results.append('Mobile long press opens without selecting; moved/cancelled presses preserve selection')

    # Existing report controls and SNS card remain the production implementation.
    page.locator('#exportSnsImgBtn').click()
    for key in ['1.name','1.flavor-fragrance-0']:
        page.locator(f'#reportFieldChoices input[value="{key}"]').check()
    page.locator('#reportFreeze').click()
    expect(page.locator('#reportPreview .sns-title')).to_have_text('참고 식품 성분 회귀 확인')
    expect(page.locator('#reportPreview .sns-badge')).to_have_text(['오렌지'])
    page.locator('#reportExportimage').click()
    expect(page.locator('#reportDownload')).to_be_visible(timeout=30000)
    with page.expect_download() as event:
        page.locator('#reportDownload').click()
    event.value.save_as(OUT/'sns-regression.png')
    assert (OUT/'sns-regression.png').read_bytes().startswith(b'\x89PNG\r\n\x1a\n')
    results.append('Reviewed SNS card and actual PNG download retain the saved flavor selection')
    assert not errors,errors
    (OUT/'browser-results.json').write_text(json.dumps({'passed':results,'page_errors':errors},ensure_ascii=False,indent=2))
    print(json.dumps({'passed':results,'page_errors':errors},ensure_ascii=False,indent=2))
    browser.close()
