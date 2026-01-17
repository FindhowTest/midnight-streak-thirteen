# 十三支（朋友連線版）＋兩種電腦玩家

這個版本是 **朋友連線** 的十三支（十三水），並額外支援兩種 Bot：

- **一般電腦**：補位/流程測試（穩、快、不倒水）
- **競技電腦**：中上強度（會在多種分墩方案中挑較佳解）

> 房間 **2～4 人**都能開（房主可加入 Bot 補到 4 人）。
> 不需要資料庫（房間/局數狀態都在 Server 記憶體）。

---

## 本機啟動（開發）

### 1) 安裝

```bash
npm install
```

### 2) 只啟動 Server

```bash
npm run server
```

預設在：`http://localhost:3001/health`

### 3) 只啟動 Client

```bash
npm run client
```

Client 預設會連 `http://localhost:3001`。

### 4) 同時啟動（推薦）

```bash
npm run dev:all
```

---

## 線上部署（朋友拿網址就能玩）

這個專案需要 **兩個部署目標**：

1. **Server（Node.js + Socket.IO）**：建議部署到 Render/Fly.io/Railway（要能長時間跑 WebSocket）
2. **Client（Vite 靜態網站）**：建議部署到 Cloudflare Pages（免費快）

### A. 部署 Server（以 Render 為例）

1) Render → New → Web Service → 選 repo

2) 設定：

- **Root Directory**：`server`
- **Build Command**：`npm install`
- **Start Command**：`npm start`

3) 部署完成後會得到網址，例如：

`https://your-server.onrender.com`

> 注意：Render 會提供 `PORT` 環境變數，server 已支援 `process.env.PORT`。

### B. 部署 Client（Cloudflare Pages）

1) Cloudflare Pages → Create Project → 選 repo

2) 設定：

- **Root Directory**：`client`
- **Build Command**：`npm run build`
- **Output Directory**：`dist`

3) 設定環境變數（Pages → Settings → Environment Variables）：

- `VITE_GAME_SERVER_URL = https://your-server.onrender.com`

4) 重新部署，拿到網址例如：

`https://xxxx.pages.dev`

---

## 遊戲內操作（加入兩種電腦）

在 **等待開始** 的房間畫面，房主會看到：

- **加入一般電腦**
- **加入競技電腦**
- **移除一個電腦**

加入後直接開始即可。

---

## 重要限制（不使用 DB 的代價）

- 房間狀態存在 server 記憶體
- server 重啟/睡眠（免費方案常見）會導致房間消失，需要重新建房
