# Coffee Sensory Wheel

## Overview

This project provides a web-based interface for managing and evaluating coffee cupping sessions. It offers features for organizing multiple samples, comparing tasting results, and exporting data in several formats. The page is optimized for both desktop and mobile browsers so you can comfortably record and review cupping notes on any device.

## Getting Started

1. Clone or download this repository.
2. Serve the files from an HTTPS static host. Google login requires an origin authorized in Firebase; service workers require a secure context. Opening `index.html` directly as a local file does not verify those features.

## Major Features

- **Sample Management** – Add, clone, and remove cupping samples. Data is automatically saved locally and can be exported or restored using JSON files.
- **Comparison Tools** – Select two or more samples to generate charts comparing SCA scores, flavor notes, and defects.
- **Export Options** – Save your results as images, SNS-ready images, Excel spreadsheets, or JSON files for backup and sharing. The exported images now include the coffee's origin, processing method, roast date, and roast level so you have full context when sharing.

## Reference aroma dictionary (draft)

Select the flask button or hold a flavor label to see up to three key odorants of the named reference itself. The default view contains names and short odor descriptions. Study conditions, analytical methods, measurements, limitations and primary-paper citations are collapsed under “자세히 보기”.

`flavor-reference.js` keeps sources, sample-specific profiles and exact note mappings separate from the renderer. No parent-category inheritance is used. Unranked key odorants remain useful and are displayed without numbers. Sample-scoped rankings are available for pineapple (OAV, 12 quantified compounds), ripe Haden mango (OAV, 34 quantified compounds) and shade-dried basil (AEDA FD, two confirmed leading compounds). Concentration, OAV, AEDA FD and sensory contribution are distinct. Current coverage is 28 of 420 notes with molecules: 5 ranked and 23 unranked; 387 remain pending and 5 are excluded. Some profiles currently rely on primary abstracts and explicitly say so.

The historical `flavor-evidence.js` is retained for recovery but is not loaded or used as a UI fallback. Notes awaiting a reference-specific literature review show no guessed compounds. See `REFERENCE_REVIEW.md` and `flavor-reference-audit.csv` for coverage and limitations. Run `node scripts/audit-reference.cjs` to regenerate the inventory from the actual flavor list.

Run `node tests/service-worker.cjs` for mocked offline-cache checks. `tests/reference-preview.html` provides isolated responsive/pointer checks using the actual modal code. Physical mobile and installed-PWA migration remain unverified.

## Local operation and recovery (draft)

See [운영 수정·검증 기록](OPERATIONAL_REVIEW.md) for the exact changes and limitations. Local saves now report failure honestly; current-session JSON can be imported; replacement first creates a user-scoped backup; unreadable originals are protected. Undo restores the complete session structure. Records remain browser-specific: export JSON before moving devices or clearing browser storage.

Run `node tests/data-store.cjs` for storage/recovery regression checks. `tests/operations-preview.html` runs the real app with a separate test storage prefix and excludes live team connections and PWA registration. Google/Firestore round-trip and physical mobile/PWA behavior are not certified by these tests. No production data was edited.

## Browser Compatibility

The page is designed with responsive layouts and touch-friendly controls. It works in modern browsers on Windows, macOS, Android, and iOS. For the best experience, keep your browser up to date.

## Dark Mode

Click the moon icon in the header to switch between light and dark themes. Your choice is saved in the browser so the page remembers your preference the next time you open it. The dark theme now automatically adjusts text colors for better readability on any screen. Both themes work on desktop and mobile devices.

## Offline and PWA Installation

This app is a Progressive Web App. When you visit on a mobile device or supported desktop browser, you can install it like a native app. Click the **앱설치** button that appears in the header to add it to your home screen. When offline, the app shows a simple page letting you know the connection is lost.

## Managing Users

Click **로그인** to use Google authentication. Local records and selected teams are scoped by Firebase UID. Historical display-name records are preserved; export them before login and import the JSON into the signed-in profile when needed. Device-local records are not shared by simply signing in.

## Team Features

After Google login, use **팀관리** to create or join a team. **현재 세션 공유** explicitly replaces only your shared sample list after confirmation; concurrent changes abort the write. **내 팀 기록 불러오기** adds your shared records as a new local session, with backup and validation. Automatic local saving does not upload; offline team operations fail visibly and need retry. **팀 결과 보기** groups records by evaluator and includes recorded totals, descriptors and notes. It does not infer that matching sample names represent the same coffee or compute unverified team averages. Firebase domain authorization, security rules and real device-to-device behavior still need live validation.

## Cupping workflow additions (draft)

- **전체 기록 검색·비교**: search this profile's sessions by sample, lot, producer, coffee information or selected flavor; filter by evaluation date; select 2–4 historical samples for comparison. Open returns to the exact session/sample without copying it.
- **같은 조건 새 세션**: reuse saved purpose, location, evaluator, water temperature and grind. Date/time and sample identity are new; scores and descriptors use the app's blank defaults. A default score is not proof the sample was evaluated.
- **세션 타이머**: elapsed time with start/pause/reset; state is local and separated by user/session. Reload resumes from wall-clock timestamps. Changing the device clock can affect elapsed time; no mandatory cupping protocol or alarm is implied.
- Existing stored session selection is restored correctly. Save failure prevents session switching. New session creation keeps the prior data when storage fails.

See [다른 앱 조사·반영·검증](APP_WORKFLOW_REVIEW.md). `workflow-tools.js` and `workflow-tools.css` contain the added logic/UI, with an explicit bridge in the page. `node tests/workflow-tools.cjs` checks model behavior. `tests/workflow-integration.cjs` uses jsdom 26.1.0 with synthetic records and no live network; its header documents the temporary test dependency setup. It tests application DOM events, not real mobile layout, native dialogs, downloads or Firebase.

## Customizing the Header Logo

1. Replace the file `icons/header-logo.png` with your own image (recommended size around 192×192 pixels).
2. Open `index.html` and reload the page. Your image will appear next to the **Noel** text at the top.

This update applies both on desktop and mobile views and is cached for offline use by the PWA service worker.

### Exporting Images

1. Fill in the sample details including **원산지**, **가공 방식**, **로스팅 날짜**, and **로스팅 정도**.
2. Click **SNS형 이미지** for the compact image export.
3. The image includes the coffee's origin and roasting information. The current page has no separate full-report image button.
