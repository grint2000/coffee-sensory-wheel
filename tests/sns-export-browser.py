"""Run against a local HTTP server: python tests/sns-export-browser.py.

Requires Playwright, Pillow and Chromium. Saves actual downloads and evidence
outside the repository in SNS_TEST_OUTPUT (default /workspace/sns-export-check).
"""
import json
import os
from pathlib import Path
from PIL import Image, ImageChops
from playwright.sync_api import sync_playwright, expect

OUT = Path(os.environ.get('SNS_TEST_OUTPUT', '/workspace/sns-export-check'))
OUT.mkdir(parents=True, exist_ok=True)
BASE = os.environ.get('SNS_TEST_URL', 'http://127.0.0.1:8000/')
results = []

with sync_playwright() as pw:
    launch = dict(executable_path='/usr/bin/chromium', headless=True)
    if os.environ.get('HTTPS_PROXY'):
        launch['proxy'] = {'server': os.environ['HTTPS_PROXY'], 'bypass': '127.0.0.1,localhost'}
    browser = pw.chromium.launch(**launch)
    context = browser.new_context(viewport={'width': 1440, 'height': 1100}, timezone_id='Asia/Seoul', accept_downloads=True, service_workers='block')
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(BASE, wait_until='networkidle')
    page.wait_for_function('window.CuppingReports && typeof html2canvas === "function"')
    page.evaluate('''() => {
      const d=getEmptySampleData();
      Object.assign(d,{coffeeName:'에티오피아 알로 무라고 아토테 내추럴',origin:'Ethiopia',process:'Natural',roastDate:'2026-09-22',roastLevel:'medium-light',acidityLevel:'Med-High',sweetnessLevel:'Med-High',bodyLevel:'Medium',bodyDescriptors:['smooth','medium','lingering'],lotNumber:'SECRET-LOT',tastingNotes:'SECRET-NOTE',supplierName:'SECRET-SUPPLIER'});
      const notes={fragrance:['딸기','블루베리','망고','파파야','멜론'],aroma:['망고','블루베리','오렌지','베르가못','복숭아','황도','딸기'],flavor:['망고','황도','오렌지','자두','라즈베리','레몬그라스','백도'],aftertaste:['베르가못','자두','복숭아']};
      for(const[phase,names]of Object.entries(notes))d.flavorSelections[phase]=names.map(name=>{const f=FLAVOR_DATA.find(f=>f[6]===name);if(!f)throw Error('Missing fixture note '+name);return f.slice(0,3).join('|');});
      P0Production.replaceCurrentData(d);
    }''')

    def review():
        page.locator('#exportSnsImgBtn' if page.viewport_size['width'] > 640 else '#mobileQuickExportBtn').click()
        expect(page.locator('#reportFieldChoices input:checked')).to_have_count(0)
        page.locator('#reportFreeze').click()
        expect(page.locator('#reportExportimage')).to_be_disabled()
        fields = page.locator('#reportFieldChoices input')
        for field in fields.all():
            key = field.get_attribute('value').split('.', 1)[1]
            if key in ['name','origin','process','roastDate','roastLevel','acidityLevel','sweetnessLevel','bodyLevel'] or key.startswith(('flavor-', 'body-')):
                field.check()
        page.locator('#reportFreeze').click()
        expect(page.locator('#reportPreview .sns-title')).to_have_text('에티오피아 알로 무라고 아토테 내추럴')
        expect(page.locator('#reportPreview .sns-badge')).to_have_count(28)
        assert 'SECRET' not in page.locator('#reportPreview').inner_text()
        projection = page.evaluate('CuppingReports.getProjection()')
        for field in projection['records'][0]['fields']:
            assert field['value'] in page.locator('#reportPreview').inner_text()
        return projection

    def png(name):
        page.locator('#reportExportimage').click()
        expect(page.locator('#reportDownload')).to_be_visible(timeout=30000)
        with page.expect_download() as event:
            page.locator('#reportDownload').click()
        event.value.save_as(OUT / name)
        assert event.value.failure() is None
        with Image.open(OUT / name) as im:
            assert im.format == 'PNG' and im.width == 1200 and im.height > 1200
            assert im.width * im.height <= 8_000_000
            pixels = im.convert('RGB').tobytes()
            for color in [(255, 151, 161), (255, 107, 107), (81, 207, 102), (51, 154, 240), (245, 245, 220)]:
                assert pixels.count(bytes(color)) > 100, (name, color)
            return im.size

    projection = review()
    (OUT / 'projection.json').write_text(json.dumps(projection,ensure_ascii=False,indent=2))
    (OUT / 'styles.json').write_text(json.dumps(page.locator('#reportPreview .sns-report').evaluate('''e=>[e,...e.querySelectorAll('.sns-title,.sns-badge')].map(x=>({tag:x.outerHTML,background:getComputedStyle(x).backgroundColor,color:getComputedStyle(x).color}))'''),ensure_ascii=False,indent=2))
    page.locator('#reportPreview .sns-report').screenshot(path=str(OUT / 'preview-desktop.png'))
    size = png('sns-desktop.png')
    results.append({'check':'Desktop SNS card and actual PNG download', 'pixels':size})
    # Same selected values also reach the other export formats.
    page.locator('#reportExportjson').click()
    with page.expect_download() as event:
        page.locator('#reportDownload').click()
    event.value.save_as(OUT / 'report.json')
    assert json.loads((OUT / 'report.json').read_text()) == projection
    with page.expect_download() as event:
        page.locator('#reportExportexcel').click()
    event.value.save_as(OUT / 'report.xlsx')
    results.append('JSON matches frozen projection; Excel downloaded')

    page.set_viewport_size({'width':390,'height':844})
    page.locator('#themeToggle').click()
    review()
    assert png('sns-mobile-dark.png') == size
    # Compare exact badge bounds; glyph antialiasing can differ with the viewport.
    def color_bounds(image, color):
        masks = [channel.point(lambda value, expected=value: 255 if value == expected else 0)
                 for channel, value in zip(image.convert('RGB').split(), color)]
        return ImageChops.multiply(ImageChops.multiply(masks[0], masks[1]), masks[2]).getbbox()

    with Image.open(OUT / 'sns-desktop.png') as a, Image.open(OUT / 'sns-mobile-dark.png') as b:
        for color in [(255,151,161),(112,153,218),(253,190,52),(255,107,107),(81,207,102),(51,154,240),(245,245,220),(205,133,63)]:
            assert color_bounds(a,color) == color_bounds(b,color), color
    results.append('Mobile/dark PNG matches desktop card layout and colors')

    # An unchecked note must disappear from preview and the real PNG, not just JSON.
    page.locator('#reportFieldChoices input[value="1.flavor-fragrance-0"]').uncheck()
    expect(page.locator('#reportExportimage')).to_be_disabled()
    expect(page.locator('#reportDownload')).to_be_hidden()
    page.locator('#reportFreeze').click()
    expect(page.locator('#reportPreview .sns-badge')).to_have_count(27)
    png('sns-note-excluded.png')
    results.append('Unchecking a note invalidates old output and removes its badge')
    page.set_viewport_size({'width':1440,'height':1100})
    page.locator('#coffeeName').fill('변경된 커피')
    expect(page.locator('#reportExportimage')).to_be_disabled()
    assert page.evaluate('CuppingReports.exportReport("image")') is None
    expect(page.locator('#reportDownload')).to_be_hidden()
    results.append('Changed input blocks stale output')
    assert not errors, errors
    (OUT / 'results.json').write_text(json.dumps({'passed':results,'page_errors':errors},ensure_ascii=False,indent=2))
    print(json.dumps(results,ensure_ascii=False,indent=2))
    browser.close()
