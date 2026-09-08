const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const match = html.match(/const FLAVOR_DATA = (\[[\s\S]*?\n\]);/);
assert(match, 'Flavor data must remain extractable');
const rows = vm.runInNewContext(match[1]);
const context = {};
vm.runInNewContext(fs.readFileSync(path.join(root, 'flavor-reference.js'), 'utf8'), context);
const api = context.FLAVOR_REFERENCE;
const keys = rows.map(r => r.slice(0, 3).join('|'));
assert.equal(new Set(keys).size, keys.length);
for (const key of Object.keys(api.mapping)) assert(keys.includes(key), `Unknown note: ${key}`);
const counts = {};
const csv = [['key', 'label_ko', 'status', 'molecules', 'source', 'scope_or_reason']];
for (let i = 0; i < rows.length; i++) {
  const data = api.get(keys[i]);
  assert(data.molecules.length <= 3);
  if (data.status === 'ranked') {
    assert(data.rankBasis && data.rankValues.length === data.molecules.length);
    assert(data.rankValues.every((v, j, a) => j === 0 || a[j - 1] >= v));
  }
  if (data.molecules.length) assert(data.study?.url.startsWith('https://doi.org/') && data.sample && data.limit);
  counts[data.status] = (counts[data.status] || 0) + 1;
  csv.push([keys[i], rows[i][6], data.status, data.molecules.map(x => x.name).join('; '), data.study?.url || '', data.limit || data.reason]);
}
// No legacy evidence API or coffee tiers may enter the new renderer.
assert(!html.includes('window.getFlavorEvidence'));
assert(!/1단계[^\n]*(커피|근거)/.test(html));
assert(html.includes('src="flavor-reference.js"'));
for (const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
  if (script[1].trim()) new vm.Script(script[1]);
}
fs.writeFileSync(path.join(root, 'flavor-reference-audit.csv'), '\uFEFF' + csv.map(row => row.map(v => '"' + String(v ?? '').replaceAll('"', '""') + '"').join(',')).join('\n') + '\n');
console.log(JSON.stringify({ total: rows.length, ...counts }, null, 2));
