# Reference aroma draft review — 2026-09-08

## Recovery points

- Main baseline: `984f907235a1e63cb3782bf40a2244194042c43d`
- Draft baseline: `a401cf87a12295bf7a669f7ccd9db26161005876`
- Main backup: `backup/main-before-reference-20260908`
- Draft backup: `backup/flavor-rank-before-reference-20260908`
- Work branch: `codex/flavor-molecule-rank-v2`; no main publication authorized.

## Coverage and limits

The current `FLAVOR_DATA` contains 420 unique notes. Every key is inventoried in `flavor-reference-audit.csv`. This is **not a completed literature review of 420 targets**. No parent-category compounds are inherited.

| Status | Notes | Scope |
| --- | ---: | --- |
| Ranked | 5 | Pineapple / Fresh Pineapple: OAV within 12 quantified compounds, fresh F-2000 sample. Mango / Ripe Mango: OAV within 34 quantified compounds, tree-ripened Haden sample. Basil: two highest AEDA FD values in each of two shade-dried aerial-part samples. |
| Identified, unranked | 23 | Strawberry, Raspberry, Peach, Rose, Cinnamon, Vanilla, Vanilla Bean, Hazelnut, Roasted Hazelnut, Oolong, Ti Kuan Yin, Da Hong Pao, Blueberry, Black Pepper, Guava, Pink Guava, Apricot, Bay Leaf, Lemon, Peanut, Roasted Peanut, Walnut, Green Beans. |
| Pending | 387 | Exact-target primary-source linkage is unfinished. Missing linkage does not establish absence of known odorants. Processing, cultivar/species, plant part, blends and abstract labels still need individual examination. |
| Excluded | 5 | Citric Acid, Malic Acid, Tartaric Acid, Phosphoric Acid and Lactic Acid describe taste, outside this reference-aroma feature. |

The five ranked notes represent three study profiles, not five independent studies. FD, OAV, concentration and sensory contribution are different measures. Unranked selections are non-exhaustive key-odorant examples, not asserted top-three contributions. Only confirmed compounds are shown: Vanilla and Walnut have two; Cinnamon has one; Basil has two ranked compounds.

Study scope remains explicit: strawberry frozen samples; rose extract; cinnamon edible-oil bark extracts; lemon oil; vanilla cured beans; bay fresh leaves; basil shade-dried aerial parts; mango tree-ripened Haden fruit; guava pink Colombian fruit; raw versus roasted hazelnut and peanut samples. Oolong values span three named tea samples and are not falsely assigned to a single tea product. Black Walnut, White Guava, Green Mango and processed fruit variants do not inherit these findings.

Strawberry, Raspberry and Rose use primary full text. Most additions rely on publisher/PubMed/author-institution abstracts, with this access limitation disclosed in each profile. Full-text conditions and tables for those records remain unfinished. See `flavor-reference.js` for exact paper titles, authors, year, DOI, method and per-profile limitations.

## Scope of code change

The flavor inventory, login, team synchronization, sample handling, scoring, persistence and export logic are unchanged. `index.html` is unchanged in this expansion; its prior draft reference renderer is used. Historical evidence remains in `flavor-evidence.js`, unloaded by the page. No user data is migrated.

An additional recovery branch, `backup/reference-before-expansion-20260908`, preserves `eb348a88a2f8802de9e5a1e3161d3aefc17c8c03`. Main remains `984f907235a1e63cb3782bf40a2244194042c43d`.

The service worker now uses v11 caches. Installation must obtain both the page and reference dictionary before activation. Offline requests can use the installed app-shell dictionary, in addition to runtime responses. Cleanup is restricted to old Noel app/runtime cache names; unrelated caches are retained. Optional assets can fail without blocking the core installation. Actual browser update/offline behavior still requires device QA.

## Verification

- `node scripts/audit-reference.cjs`: PASS; 420 unique keys, exact mappings, at most three compounds, required source fields, descending ranked values, inline JavaScript syntax and no legacy coffee-evidence API in renderer.
- `node tests/service-worker.cjs`: PASS with mocked Cache API; install, v8/v9/v10 cleanup, unrelated-cache preservation, installed dictionary/page offline fallback, runtime fallback and failed core-update protection. This is not a physical browser migration test.
- `tests/reference-preview.html` embeds an isolated test page at selectable widths. It loads the actual data and actual modal/pointer functions without running login, scoring or persistence code.
- Browser synthetic-pointer checks: PASS for short tap selection, deselection, molecule-button non-interference, 600 ms long press suppressing checkbox toggle, movement cancellation, pointer cancellation and pointer leaving the target. Synthetic events do not establish native mobile behavior.
- Browser fixture rendered all 420 actual dialogs: PASS for title, molecule count, ordered versus unordered list, initially collapsed details, exact source href, absence of coffee evidence tiers, closing, focus restoration and body scroll restoration.
- Visual checks: Strawberry modal at 320 px and Mango ranked modal at 375 px fit their iframe viewport. This validates responsive layout, not a real phone browser or complete-page mobile layout.
- Keyboard checks: Tab to details, Enter expansion and Escape close passed. Close button and focus restoration passed. Source links render with the reviewed DOI target; every external destination was not opened in browser.
- Actual draft page smoke check at `6ce7b1c7c2d8caf3be517fdab60390dddbc1acf5`: Strawberry opens with three unnumbered molecules and collapsed details; closing returns focus to its button and leaves checkboxes unselected.
- Still unverified: physical iOS/Android touch/scroll behavior, actual installed PWA migration/offline reload, all external link availability, and operational login/team/save/export workflows. Those workflows were deliberately not changed or exercised against user data.

## Draft preview

Verified application snapshot: https://raw.githack.com/grint2000/coffee-sensory-wheel/6ce7b1c7c2d8caf3be517fdab60390dddbc1acf5/index.html

Verified isolated UI test snapshot: https://raw.githack.com/grint2000/coffee-sensory-wheel/50470aad38901d08fd2ba26a3f380ba6207982a0/tests/reference-preview.html

Working branch: `codex/flavor-molecule-rank-v2`. No merge or publication to main has been performed. Research coverage remains partial; do not describe this as all-note scientific completion.
