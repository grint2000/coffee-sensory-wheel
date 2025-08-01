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
- **Market Prices** – View the latest C‑Price and London Coffee Exchange index with a one-click refresh. Prices are converted to KRW per kilogram using the current USD exchange rate and stored locally for offline viewing.

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

## Market Prices

Below the header you can view real-time coffee prices. The widget displays the ICE C‑Price and the London Coffee Exchange index. Click **가격 새로고침** to fetch the latest data. Prices are converted to KRW per kilogram using the current USD exchange rate. The most recent values are cached locally so they remain visible even when offline.

## Customizing the Header Logo

1. Replace the file `icons/header-logo.png` with your own image (recommended size around 192×192 pixels).
2. Open `index.html` and reload the page. Your image will appear next to the **mollis** text at the top.

This update applies both on desktop and mobile views and is cached for offline use by the PWA service worker.

### Exporting Images

1. Fill in the sample details including **원산지**, **가공 방식**, **로스팅 날짜**, and **로스팅 정도**.
2. Click **이미지로 내보내기** to download a full report with the radar chart and tasting notes.
3. Click **SNS형 이미지** for a compact version that is easy to share on social networks.
4. Both image types will display the coffee's origin and roasting information in the header.
