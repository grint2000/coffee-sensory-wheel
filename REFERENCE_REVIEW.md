# Reference aroma draft review — 2026-09-08

## Recovery points

- Main baseline: `984f907235a1e63cb3782bf40a2244194042c43d`
- Draft baseline: `a401cf87a12295bf7a669f7ccd9db26161005876`
- Main backup: `backup/main-before-reference-20260908`
- Draft backup: `backup/flavor-rank-before-reference-20260908`
- Work branch: `codex/flavor-molecule-rank-v2`; no main publication authorized.

## Coverage and limits

The actual `FLAVOR_DATA` contains 420 unique notes. All keys are inventoried in `flavor-reference-audit.csv`. This is **not a completed literature review of 420 targets**.

- 2 ranked notes: Pineapple and Fresh Pineapple share the explicitly labelled fresh F-2000 sample, ranked by OAV among 12 quantified odorants (one study, not two independent validations).
- 5 unranked notes with selected major odorants: Strawberry, Raspberry, Peach, Rose, Cinnamon. Strawberry, Raspberry and Rose use primary full text; Peach and Cinnamon currently use primary abstracts with the access limitation disclosed in the dialog.
- 5 excluded notes: Citric Acid, Malic Acid, Tartaric Acid, Phosphoric Acid, Lactic Acid. These describe taste rather than the reference aroma covered here.
- 408 pending notes: exact-target primary-source linkage is unfinished. This does not mean key odorants are scientifically unknown. Cultivar, processing, blend/product identity and abstract sensory labels require target-specific review. No compounds are inherited from a parent category.

Unranked lists are non-exhaustive key-odorant examples, not asserted top-three contributions. Strawberry's cited samples were frozen; Rose refers to a 25°C extract; Cinnamon refers to edible-oil bark extracts. These conditions are retained prominently in details. Previous strawberry and rose numerical panels are no longer used: the feature now prioritizes reference aroma characterization and avoids mechanically equating OAV with sensory contribution.

## Scope of code change

The flavor inventory, login, team synchronization, sample handling, scoring, persistence and export logic are unchanged. Only the molecule dialog, its data source, documentation and cache version are updated. Historical evidence remains in `flavor-evidence.js`, unloaded by the page. No user data is migrated.

## Verification

- `node scripts/audit-reference.cjs`: 420 unique keys, all explicit mappings exist, maximum three compounds, valid source fields, descending values for ranked profiles, inline JavaScript syntax, no legacy coffee-evidence API in renderer.
- Cache identifiers increased from v8 to v9 and the new reference file added to the app shell.
- Live desktop preview: Strawberry opens with three unnumbered names; details start collapsed; Tab reaches summary; Enter expands study information; Escape closes and restores focus to the originating button. Close button works. Molecule-button clicks leave the strawberry checkbox unchecked. Pineapple shows the OAV scope; Blueberry shows the pending state without guessed molecules.
- Screenshot review found global list-reset CSS hiding ranked markers; explicit decimal styling was added.
- Source anchor text and DOI target are generated from reviewed primary-source records. Publication access varies; all link destinations were not clicked again in browser QA.
- Not directly tested: actual mobile viewport/device, physical long-press and scroll cancellation, full checkbox selection/deselection workflow, offline v8-to-v9 cache migration. Existing pointer handlers are retained. These remain release QA gates rather than claimed passes.
