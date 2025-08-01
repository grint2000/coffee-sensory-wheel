const STORAGE_KEY = 'mollis_sca_price_cache';
const LB_TO_KG = 0.453592;

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
  if (cEl) cEl.textContent = data.cPriceUsdPerLb ? `${data.cPriceUsdPerLb.toFixed(2)} USD/lb` : '-';
  if (lEl) lEl.textContent = data.londonPriceUsdPerLb ? `${data.londonPriceUsdPerLb.toFixed(2)} USD/lb` : '-';
  if (kEl) kEl.textContent = data.krwPerKg ? `${Math.round(data.krwPerKg).toLocaleString()}원/kg` : '-';
  if (lkEl) lkEl.textContent = data.londonKrwPerKg ? `${Math.round(data.londonKrwPerKg).toLocaleString()}원/kg` : '-';
}

function setMessage(msg) {
  const el = document.getElementById('priceMessage');
  if (el) el.textContent = msg || '';
}

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

async function fetchJson(url) {
  const res = await fetch(CORS_PROXY + encodeURIComponent(url));
  return res.json();
}

async function fetchPrices() {
  const [cJson, lJson, fxJson] = await Promise.all([
    fetchJson('https://query1.finance.yahoo.com/v7/finance/quote?symbols=KC%3DF'),
    fetchJson('https://query1.finance.yahoo.com/v7/finance/quote?symbols=RC%3DF'),
    fetchJson('https://api.exchangerate.host/latest?base=USD&symbols=KRW')
  ]);

  const cCents = cJson.quoteResponse?.result?.[0]?.regularMarketPrice;
  const lUsdLb = lJson.quoteResponse?.result?.[0]?.regularMarketPrice;
  const usdKrw = fxJson.rates?.KRW;

  const cUsdLb = cCents ? cCents / 100 : null;
  const krwPerKg = cUsdLb && usdKrw ? cUsdLb * usdKrw / LB_TO_KG : null;
  const londonKrwKg = lUsdLb && usdKrw ? lUsdLb * usdKrw / LB_TO_KG : null;

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
    setMessage('');
  } catch (e) {
    console.error('Failed to fetch prices', e);
    setMessage('데이터 갱신 실패');
    displayPrices(loadCachedPrices());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const cached = loadCachedPrices();
  if (cached) displayPrices(cached);
  const btn = document.getElementById('refreshPricesBtn');
  if (btn) btn.addEventListener('click', refreshPrices);
  if (!cached) refreshPrices();
});
