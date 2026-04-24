<div align="center">

<!-- Inline SVG logo: a small network glyph -->
<img src="https://raw.githubusercontent.com/zshleon/home-topology-mapper/main/docs/images/brand.svg" alt="HomeWeb" width="72" height="72" onerror="this.style.display='none'" />

# HomeWeb · 看见你家的网

**一个好看、好用、自托管的家庭网络拓扑工具。**
A self-hosted home-network topology mapper that is easy to use and easy on the eyes.

[![CI](https://github.com/zshleon/home-topology-mapper/actions/workflows/ci.yml/badge.svg)](https://github.com/zshleon/home-topology-mapper/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[中文 README](#中文) · [English README](#english)

</div>

---

## 中文

> 用一次 nmap，看清你家每一台联网设备；拖两下鼠标，把拓扑固定下来。

HomeWeb（仓库名仍为 `home-topology-mapper`）是一个面向家庭 / Homelab 的轻量拓扑工具。
不是企业级 NMS，目标很克制：

- 自动扫描并识别局域网里的设备
- 给出一张可以自动更新、也能手动调整的拓扑图
- 新设备高亮、离线设备淡出；你手动确认过的连接不会被扫描结果覆盖
- 支持浅色 / 深色 / 跟随系统主题，原生中文、英文双语

### 一、效果预览

<div align="center">

| 仪表盘 | 拓扑 | 设备清单 |
|---|---|---|
| <img src="docs/images/screenshot-dashboard.png" alt="仪表盘" width="320" onerror="this.style.display='none'" /> | <img src="docs/images/screenshot-topology.png" alt="拓扑" width="320" onerror="this.style.display='none'" /> | <img src="docs/images/screenshot-devices.png" alt="设备" width="320" onerror="this.style.display='none'" /> |

</div>

> 截图占位：`docs/images/screenshot-*.png` 会在首个 beta release 之前补齐。

### 二、快速开始（Docker Compose）

```bash
git clone https://github.com/zshleon/home-topology-mapper.git
cd home-topology-mapper
cp .env.example .env
# 至少改一个：把 HTM_SCAN_SUBNETS 改成你家的网段
# 比如 HTM_SCAN_SUBNETS=10.0.0.0/24
docker compose up -d --build
```

浏览器打开：

```
http://<你家部署这台机器的 IP>:8080
```

第一次进来 UI 是中文的。顶栏右上角可以切换语言和深浅主题。

### 三、Proxmox / LXC 部署要点

- **主机网络**：`network_mode: host`（docker-compose.yml 已是这个配置）。nmap 需要广播域可见。
- **NET_RAW 能力**：非特权 LXC 请在 `.conf` 里加：

  ```
  lxc.cap.keep: net_raw
  ```

- 不想折腾能力集，可以直接用特权容器。
- 数据目录挂载到主机以便持久化：`./data:/data`。

### 四、常见配置（`.env`）

| 变量 | 默认 | 说明 |
|---|---|---|
| `HTM_SCAN_SUBNETS` | `192.168.1.0/24` | 要扫描的子网，多个用逗号 |
| `HTM_SCAN_MODE` | `quick` | `quick` / `full` |
| `HTM_OFFLINE_RETENTION_DAYS` | `30` | 离线设备多少天后变暗 |
| `HTM_DEFAULT_LOCALE` | `zh-CN` | `zh-CN` / `en` |
| `HTM_CORS_ORIGINS` | `*` | 生产建议写具体地址 |
| `HTM_UI_BRAND_NAME` | `HomeWeb` | 顶栏品牌名，可自定义 |

完整变量见 `.env.example`。

### 五、Roadmap（下一阶段）

- [ ] 异步扫描 + SSE 进度条（全扫描不再卡住 UI）
- [ ] mDNS / SSDP / UPnP 二次识别
- [ ] YAML 驱动的设备指纹库
- [ ] 力导向自动布局（首次加载更像样）
- [ ] 导出拓扑为 PNG / SVG
- [ ] PWA：手机打开当 App 用

具体进度在 [`SPRINT_STATUS.md`](SPRINT_STATUS.md)、长期规划在 [`docs/IMPROVEMENT_PLAN.md`](docs/IMPROVEMENT_PLAN.md)。

### 六、参与贡献

- 欢迎 issue / PR。请看 [`CONTRIBUTING.md`](CONTRIBUTING.md)。
- 安全问题请走 [`SECURITY.md`](SECURITY.md)，不要发 public issue。

### 七、协议

MIT。

---

## English

> One `nmap` sweep, one drag-and-drop canvas, one honest picture of your home LAN.

HomeWeb (repo is still `home-topology-mapper`) is a small, self-hosted topology tool for homelabs.
It's deliberately not an enterprise NMS. It:

- Scans your LAN and identifies devices
- Draws a first-cut topology you can drag around and save
- Highlights new devices, dims offline ones
- Preserves your manual edits across future scans
- Ships with light / dark / system themes and zh-CN + English out of the box

### Quick start

```bash
git clone https://github.com/zshleon/home-topology-mapper.git
cd home-topology-mapper
cp .env.example .env
# Set HTM_SCAN_SUBNETS to your LAN
docker compose up -d --build
```

Open `http://<host>:8080`. Use the top-right controls to switch language or theme.

### Proxmox / LXC notes

- Host networking (`network_mode: host`) so `nmap` sees the broadcast domain.
- On unprivileged LXCs add `lxc.cap.keep: net_raw` to the container config, or run privileged.
- Mount `./data:/data` so SQLite persists.

### Configuration

See `.env.example`. Most deployments only need `HTM_SCAN_SUBNETS` and `HTM_CORS_ORIGINS`.

### Roadmap

- Async scanning with SSE progress (no more blocked UI)
- mDNS / SSDP / UPnP second-pass identification
- YAML-driven device fingerprints
- Force-directed auto-layout on first load
- PNG / SVG topology export
- PWA support

### Development

```bash
# backend
cd backend
python -m venv .venv && . .venv/bin/activate
pip install -e ".[dev]"
pytest
uvicorn app.main:app --reload

# frontend
cd frontend
npm install
npm run dev
```

### License

MIT.
