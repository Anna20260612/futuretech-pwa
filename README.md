# FutureTech 3C 科技採購網（RWD + PWA 版）

此版本在原本的 `3c.html` 基礎上，補上了 **RWD 響應式體驗優化** 與 **PWA（漸進式網頁應用）** 功能，讓網站可以「加到主畫面 / 安裝為 App」、支援離線開啟外殼頁面。

## 📁 檔案結構

```
futuretech-pwa/
├── index.html          # 主頁面（原 3c.html，已加入 PWA 相關標籤與腳本）
├── manifest.json        # PWA 應用程式資訊（名稱、圖示、主題色…）
├── sw.js                 # Service Worker（快取策略、離線支援）
├── offline.html          # 離線時的備用頁面
└── icons/
    ├── icon-192.png
    ├── icon-512.png
    ├── icon-maskable-512.png
    ├── apple-touch-icon.png
    └── favicon-32.png
```

## ✨ 這次調整了什麼

### RWD（響應式設計）
- 原本手機版的漢堡選單按鈕沒有作用，這次補上了完整的**手機導覽側邊選單**（滑出式面板 + 遮罩），小螢幕使用者可以正常導覽。
- 保留原有 Tailwind 的斷點設計（`sm:` / `lg:`），商品格線、主視覺、購物車側欄在手機、平板、桌機都能正常顯示。
- `viewport-fit=cover`，讓 iPhone 瀏海/圓角螢幕的安全區域顯示更佳。

### PWA（漸進式網頁應用）
- **`manifest.json`**：定義 App 名稱、圖示、主題色、啟動網址、顯示模式（`standalone`），使用者可以「加到主畫面」，開啟後會像原生 App 一樣沒有瀏覽器網址列。
- **`sw.js`（Service Worker）**：
  - 安裝時預先快取 App 外殼（HTML、manifest、icons）。
  - 頁面導覽採 **Network First**，斷網時自動退回快取版本或 `offline.html`。
  - 站內靜態資源採 **Cache First**。
  - CDN 資源（Tailwind、字型、圖片）採 **Stale-While-Revalidate**（先顯示快取，背景更新）。
  - Supabase API 與 GA4 追蹤請求 **不做快取**，確保訂單送出與數據追蹤永遠走即時網路請求，避免離線送出假訂單。
- **安裝提示按鈕**：導覽列與手機選單中新增「安裝應用程式」按鈕，瀏覽器支援時會自動出現，點擊即可觸發安裝流程。
- 加入 Apple / Android 的圖示、`theme-color`、`apple-mobile-web-app-capable` 等 meta 標籤，支援 iOS 加入主畫面。

## 🚀 如何在本機測試

PWA（Service Worker）**必須透過 HTTP(S) 伺服器開啟**，不能直接用瀏覽器打開本機檔案（`file://`）測試安裝與離線功能。

```bash
# 進入專案資料夾後，啟動一個簡單的本機伺服器
python3 -m http.server 8080
# 或使用 Node.js
npx serve .
```

接著在瀏覽器開啟 `http://localhost:8080`，即可看到安裝提示、Service Worker 註冊成功的訊息（開發者工具 Console）。

## 🌐 正式部署注意事項

1. **務必部署在 HTTPS 網域**（PWA 安裝與 Service Worker 在正式環境要求 HTTPS，localhost 除外）。
2. 若部署在子路徑（例如 `https://example.com/shop/`），請確認：
   - `manifest.json` 內的 `start_url`、`scope` 為相對路徑（目前已使用 `./`，可直接沿用）。
   - `index.html` 中 `<link rel="manifest">`、圖示與 `sw.js` 的路徑也都是相對路徑，會自動跟著部署路徑走。
3. 資料庫（Supabase）金鑰與 GA4 追蹤代碼沿用原始設定，若要更換請至 `index.html` 底部的 `<script type="module">` 區塊調整。
4. 若之後更新 `index.html` / `sw.js` 內容，記得修改 `sw.js` 開頭的 `CACHE_VERSION`（例如 `v1.0.1`），才能讓使用者端的舊快取自動更新。

## ✅ PWA 檢查清單（可用 Chrome DevTools → Application → Manifest / Service Workers 確認）

- [x] `manifest.json` 可正常解析，含至少一個 192px 與一個 512px 圖示
- [x] Service Worker 成功註冊並進入 `activated` 狀態
- [x] 支援離線開啟（斷網重新整理仍可看到頁面外殼）
- [x] 手機瀏覽器可「加到主畫面」，桌機瀏覽器網址列會出現安裝圖示
