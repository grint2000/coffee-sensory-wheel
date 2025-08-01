const STORAGE_KEY = 'mollis_sca_price_cache';
const LBS_PER_KG = 2.2046;

function cachePrices(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadCachedPrices() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function displayPrices(data) {
  if (!data) return;
  const cEl = document.getElementById('cPrice');
  const lEl = document.getElementById('londonPrice');
  const lkEl = document.getElementById('londonKrwPerKg');
  const kEl = document.getElementById('krwPerKg');
  const tEl = document.getElementById('priceTime');
  if (cEl) cEl.textContent = data.cPriceUsdPerLb != null ? `${(data.cPriceUsdPerLb * 100).toFixed(2)}¢/lb` : '-';
  if (lEl) lEl.textContent = data.londonPriceUsdPerLb != null ? `${(data.londonPriceUsdPerLb * 100).toFixed(2)}¢/lb` : '-';
  if (kEl) kEl.textContent = data.krwPerKg ? `${Math.round(data.krwPerKg).toLocaleString()}원/kg` : '-';
  if (lkEl) lkEl.textContent = data.londonKrwPerKg ? `${Math.round(data.londonKrwPerKg).toLocaleString()}원/kg` : '-';
  if (tEl) tEl.textContent = data.timestamp ? new Date(data.timestamp).toLocaleString() : '';
}

function setInputValues(data) {
  if (!data) return;
  const cIn = document.getElementById('inputCPrice');
  const lIn = document.getElementById('inputLondon');
  const fxIn = document.getElementById('inputFx');
  if (cIn && data.cPriceUsdPerLb != null) cIn.value = (data.cPriceUsdPerLb * 100).toFixed(2);
  if (lIn && data.londonPriceUsdPerLb != null) lIn.value = (data.londonPriceUsdPerLb * 100).toFixed(2);
  if (fxIn && data.usdToKrw != null) fxIn.value = data.usdToKrw;
}

function setMessage(msg) {
  const el = document.getElementById('priceMessage');
  if (el) el.textContent = msg || '';
}

const PROXIES = [
  url => fetch(url),
  url => fetch('https://corsproxy.io/?' + encodeURIComponent(url)),
  url => fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(url)),
  url => fetch('https://thingproxy.freeboard.io/fetch/' + url)
];

async function fetchJson(url) {
  for (const fn of PROXIES) {
    try {
      const res = await fn(url);
      if (res.ok) return await res.json();
    } catch {
      continue;
    }
  }
  throw new Error('all proxies failed');
}

async function fetchPrices() {
  const [cJson, lJson, fxJson] = await Promise.all([
    fetchJson('https://query1.finance.yahoo.com/v7/finance/quote?symbols=KC%3DF').catch(() => null),
    fetchJson('https://query1.finance.yahoo.com/v7/finance/quote?symbols=RC%3DF').catch(() => null),
    fetchJson('https://api.exchangerate.host/latest?base=USD&symbols=KRW').catch(() => null)
  ]);
  if (!cJson || !lJson || !fxJson) {
    throw new Error('fetch failed');
  }

  const cCents = cJson.quoteResponse?.result?.[0]?.regularMarketPrice;
  const lUsdTon = lJson.quoteResponse?.result?.[0]?.regularMarketPrice;
  const usdKrw = fxJson.rates?.KRW;

  const cUsdLb = cCents ? cCents / 100 : null;
  const lUsdLb = lUsdTon ? lUsdTon / (LBS_PER_KG * 1000) : null;

  const krwPerKg = cCents && usdKrw ? cCents * usdKrw * LBS_PER_KG / 100 : null;
  const londonKrwKg = lUsdTon && usdKrw ? lUsdTon * usdKrw / 1000 : null;

  const data = {
    cPriceUsdPerLb: cUsdLb,
    londonPriceUsdPerLb: lUsdLb,
    usdToKrw: usdKrw,
    krwPerKg,
    londonKrwPerKg: londonKrwKg,
    timestamp: Date.now()
  };
  cachePrices(data);
  return data;
}

async function refreshPrices() {
  try {
    const data = await fetchPrices();
    displayPrices(data);
    setInputValues(data);
    setMessage('');
  } catch (e) {
    console.error('Failed to fetch prices', e);
    setMessage('데이터 갱신 실패');
    displayPrices(loadCachedPrices());
  }
}

function applyManualPrices() {
  const c = parseFloat(document.getElementById('inputCPrice').value);
  const l = parseFloat(document.getElementById('inputLondon').value);
  const fx = parseFloat(document.getElementById('inputFx').value);
  if (isNaN(fx) || (isNaN(c) && isNaN(l))) {
    setMessage('입력값을 확인하세요');
    return;
  }
  const data = {
    cPriceUsdPerLb: isNaN(c) ? null : c / 100,
    londonPriceUsdPerLb: isNaN(l) ? null : l / 100,
    usdToKrw: fx,
    krwPerKg: isNaN(c) ? null : c * fx * LBS_PER_KG / 100,
    londonKrwPerKg: isNaN(l) ? null : l * fx * LBS_PER_KG / 100,
    timestamp: Date.now()
  };
  cachePrices(data);
  displayPrices(data);
  setInputValues(data);
  setMessage('');
}

document.addEventListener('DOMContentLoaded', () => {
  const cached = loadCachedPrices();
  if (cached) {
    displayPrices(cached);
    setInputValues(cached);
  }
  const btn = document.getElementById('refreshPricesBtn');
  if (btn) btn.addEventListener('click', refreshPrices);
  const applyBtn = document.getElementById('applyPriceBtn');
  if (applyBtn) applyBtn.addEventListener('click', applyManualPrices);
  if (!cached) refreshPrices();
});
