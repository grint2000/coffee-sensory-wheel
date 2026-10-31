# Coffee Sensory Wheel

## Overview

This project provides a web-based interface for managing and evaluating coffee cupping sessions. It offers features for organizing multiple samples, comparing tasting results, and exporting data in several formats. The page is optimized for both desktop and mobile browsers so you can comfortably record and review cupping notes on any device.

## Getting Started

1. Clone or download this repository.
2. Open the `index.html` file in your preferred web browser. No additional setup is required.

The application runs entirely in the browser, so you can simply double-click `index.html` on your computer or open it from your mobile device.

## Major Features

- **Sample Management** – Add, clone, and remove cupping samples. Data is automatically saved locally and can be exported or restored using JSON files.
- **Comparison Tools** – Select two or more samples to generate charts comparing SCA scores, flavor notes, and defects.
- **Export Options** – Save your results as images, SNS-ready images, Excel spreadsheets, or JSON files for backup and sharing. The exported images now include the coffee's origin, processing method, roast date, and roast level so you have full context when sharing.

## Reference-Food Aroma Components

Press and hold a flavor chip, or select its flask button, to view Korean/original molecule names and explanations for the reference food, flower, herb, spice or wood. Every component links its material, known cultivar/species, part, processing state, paper and verification location. This is reference-material analysis, not a measurement of the current coffee; coffee detection is not an inclusion requirement.

**Amounts are optional.** Up to three scientifically supported components are shown as **대표 향기 성분** when order has not been established. One or two confirmed components are sufficient. Ranks appear only when a reviewed source establishes the order in a comparable sample context, with **composition/concentration**, **odor activity (OAV)** or **flavor dilution (FD)** explicitly distinguished. OAV/FD are not relabeled as abundance; GC relative areas are not mass percentages or aroma contribution percentages. Source order without numerical values is supported (Oolong). Ties share a rank, with any additional tied components disclosed when the three-component cap applies. Missing/ambiguous evidence never creates invented ranks.

The original Orange example remains **Navelina, first harvest, cold-pressed flavedo oil**, [Bozova et al. (2025)](https://doi.org/10.3934/agrfood.2025003), Table 7: Limonene 96.4%, β-Myrcene 2.0%, α-Pinene 0.5% (GC-FID relative composition). This is one sample context, not a universal orange ranking.

All **420 original keys, classifications, colors and selection values remain unchanged**. Coverage is **130 supported flavors**: 118 representative-only and 12 source-ranked; **122 newly enriched**, including 11 new ranked flavors. **290 show 업데이트 예정**. Unverified or previously excluded entries are not described as lacking aroma molecules. No family-wide Top 3 inheritance is used. Exact aliases in different original categories may reference the same explicitly identified material. Coverage counts use original flavor keys, not unique ingredient names.

Data: `aroma-literature-data.js` (reviewed exact-material records), `food-aroma-data.js` (resolution/rank guards and the preserved Orange study), `flavor-evidence.js` (existing exact-key adapter). New assets load locally before the adapter and are included in app cache **v20-aroma-literature**. No stored-record migration was added.

See [data rules, backup/recovery and review limits](docs/reference-food-aroma.md), [all 420 coverage rows](docs/aroma-coverage.csv), and [source/rank audit](docs/aroma-source-audit.md).

Verification: `node tests/food-aroma.test.js`; with a local HTTP server and Playwright/Chromium installed, `python tests/food-aroma-browser.py` and `python tests/food-aroma-cache.py`. Browser checks save actual screenshots and an SNS PNG download outside the repository (override with `FOOD_AROMA_OUTPUT`). Production deployment requires separate approval.

## Browser Compatibility

The page is designed with responsive layouts and touch-friendly controls. It works in modern browsers on Windows, macOS, Android, and iOS. For the best experience, keep your browser up to date.

## Dark Mode

Click the moon icon in the header to switch between light and dark themes. Your choice is saved in the browser so the page remembers your preference the next time you open it. The dark theme now automatically adjusts text colors for better readability on any screen. Both themes work on desktop and mobile devices.

## Offline and PWA Installation

This app is a Progressive Web App. When you visit on a mobile device or supported desktop browser, you can install it like a native app. Click the **앱설치** button that appears in the header to add it to your home screen. When offline, the app shows a simple page letting you know the connection is lost.

## Managing Users

Click the **로그인** button at the top of the page to set a user name. Data is saved separately for each name, so multiple people can use the same device without mixing their cupping records. Use the **로그아웃** button to switch back to the default profile. Each profile maintains its own samples.

## Team Features

To collaborate with others, click **팀관리** and sign in with a Google account. You can create a new team or join an existing one. Once a team is selected the name appears in the header so you always know which team you belong to.

When the team owner (or any member) adds or edits samples, the changes are saved to Firestore and automatically synced to everyone in the team. If you are online you will see new samples appear instantly. Offline mode still works, and any changes will sync the next time you connect.

## Customizing the Header Logo

1. Replace the file `icons/header-logo.png` with your own image (recommended size around 192×192 pixels).
2. Open `index.html` and reload the page. Your image will appear next to the **Noel** text at the top.

This update applies both on desktop and mobile views and is cached for offline use by the PWA service worker.

### Exporting Images

1. Fill in the sample details including **원산지**, **가공 방식**, **로스팅 날짜**, and **로스팅 정도**.
2. Click **SNS형 이미지** to open **출력 전 필드 검토**. Customer reports start with every field excluded; read and select the values you want to share.
3. Select coffee information, flavor notes, taste attributes, and body descriptors, then click **선택한 값으로 미리보기 확정**. The preview shows a card with the selected coffee details and colored sensory badges.
4. Click **미리본 이미지 생성**, then **PNG 파일 받기** to download the card. Preview and PNG use the same reviewed values and layout, including on mobile and in dark mode. Unselected fields stay excluded. Excel and report JSON use the same selected fields.
