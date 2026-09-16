# 🎤 Train Singer (智慧練唱大師)

> 專為歌唱愛好者與聲樂練習者設計的現代化 Web 練唱應用。透過低延遲人聲音高辨識演算法（YIN Algorithm）與流暢 60 FPS 鋼琴捲軸，提供自由音準監控、發聲音階訓練及歌曲卡拉 OK 跟唱評分功能。

---

## ✨ 核心特色 (Features)

1. **🎙️ 自由音準監控 (Free Pitch Monitor)**
   - **實時音高辨識**：捕捉歌聲基頻 $F_0$，即時顯示音名（如 A4, C#4）、精確頻率 (Hz) 與 ±50 音分 (Cents) 偏差。
   - **60 FPS 鋼琴捲軸畫布**：高幀率平滑繪製歌聲流動軌跡，具備黑白鍵對位線與發光效果。
   - **個人音域測量**：動態記錄演唱時的最低音、最高音與總音域跨度（八度 / 半音）。

2. **🎹 發聲音階教練 (Vocal Scale Coach)**
   - **專業開嗓課表**：
     - 單音長音呼吸穩定度維持 (Sustained Pitch Hold)
     - 大三度音程跳音 (Major Thirds: Do - Mi - Do)
     - 五度連音開嗓音階 (5-Tone Legato Scale: Do-Re-Mi-Fa-Sol-Fa-Mi-Re-Do)
     - 八度大琶音 (Octave Arpeggio: Do-Mi-Sol-Do'-Sol-Mi-Do)
   - **多音域基準鍵切換**：男低音 (A2)、男中音 (C3)、男高音 (E3)、女低音 (G3)、女中音 (A3)、女高音 (E4) 一鍵切換。
   - **鋼琴引導示範音**：內建 Procedural 鋼琴合成音色試聽。
   - **節拍倒數與即時命中判定**：3-2-1 倒數進唱，即時 Perfect / Great / Miss 視覺回饋。

3. **🎵 歌曲跟唱挑戰 (Karaoke Song Mode)**
   - **預置經典示範曲**：
     - 田馥甄《小幸運》副歌精華
     - Elvis Presley《Can't Help Falling in Love》
     - 《小星星》流行改編練唱版
   - **動態歌詞同步**：即時高亮正在發聲唱出的歌詞字詞。
   - **移調功能 (Key Shift)**：支援 -6 至 +6 半音自由升降調。
   - **和弦伴奏**：自動依節奏演奏背景和弦與拍子。
   - **連擊 (Combo) 與總分結算**：結算頒發 S / A / B / C 評級，附帶專業聲樂教練診斷建議。

4. **📺 YouTube 音源匯入跟唱 (YouTube Sing Along)**
   - **支援自訂任意連結**：貼上任何 YouTube 歌曲、MV 或 KTV 伴奏網址（或 11 碼 Video ID）。
   - **精選伴奏推薦**：周杰倫《晴天》、田馥甄《小幸運》、鄧紫棋《光年之外》、Adele《Someone Like You》伴奏一鍵載入。
   - **毫秒級時間同步**：透過 YouTube IFrame API 同步播放器進度，音高軌跡即時精準繪製於歌曲對應秒數。
   - **A-B 段落循環練唱 (Loop)**：自選標記起點 A 與終點 B，自動無縫循環練習特定副歌或困難樂句。
   - **多段變速與畫面切換**：提供 0.75x、1.0x、1.25x 播放速率切換，並可自由顯示或隱藏影片畫面。

---

## 🛠️ 技術架構 (Tech Stack)

- **前端框架**：[React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **建置工具**：[Vite 8](https://vite.dev/)
- **樣式庫**：[Tailwind CSS v4](https://tailwindcss.com/)
- **圖示庫**：[Lucide React](https://lucide.dev/)
- **音訊引擎**：[Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- **音高偵測演算法**：優化版 **YIN Algorithm** (含拋物線插值與 RMS 動態抗噪門檻)
- **視覺渲染**：HTML5 Canvas (60 FPS `requestAnimationFrame` 自適應 DPR 渲染)
- **慶祝特效**：Canvas Confetti

---

## 🚀 快速開始 (Quick Start)

### 1. 安裝依賴
```bash
npm install
```

### 2. 本地開發啟動
```bash
npm run dev
```
啟動後在瀏覽器開啟 `http://localhost:5173`，允許麥克風權限即可開始練唱！

### 3. 生產環境打包
```bash
npm run build
```

---

## 🎧 建議使用環境

- 建議佩戴**有線或低延遲藍牙耳機**進行歌曲跟唱與練習，可避免麥克風重複收錄電腦喇叭播出的伴奏聲，獲得最精準的判定效果。
- 支援 Chrome、Edge、Safari、Firefox 等主流現代瀏覽器。

---

## 📄 License
MIT License
