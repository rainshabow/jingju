# 🎭 戏韵万象 — 京剧数据可视分析系统

> 基于自然语言处理与可视分析的京剧剧本角色关系、主题结构与叙事模式研究

## 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 配置密钥
cp .env.example .env
# 编辑 .env，填入 PADDLEOCR_TOKEN 和 LLM_API_KEY

# 3. 一键全流程（seed → OCR → LLM 分析，默认 5 个剧本）
pnpm --filter server exec tsx scripts/pipeline-full.ts

# 4. 启动
pnpm dev
# 前端 http://localhost:5173  |  后端 http://localhost:3000
```

## 项目结构

```
jingju-vis/
├── packages/
│   ├── shared/          # 共享类型定义
│   ├── server/          # 后端 (Fastify 5 + SQLite)
│   │   ├── src/
│   │   │   ├── db/          # 数据库 Schema & 初始化
│   │   │   ├── routes/      # API 路由
│   │   │   └── services/    # OCR / LLM / Analyzer
│   │   └── scripts/         # 种子/批量/演示脚本
│   └── web/             # 前端 (React 19 + D3.js + Zustand)
│       └── src/
│           ├── pages/       # Dashboard / PlayDetail
│           ├── components/  # 图表 / 布局 / 详情
│           ├── stores/      # Zustand 联动 + 主题
│           └── api/         # HTTP 客户端
├── data/                 # 数据集（不纳入版本控制）
└── docs/                 # 设计文档 & 课程报告
```

## 技术栈

| 层 | 技术 |
|:---|:---|
| 文本提取 | PaddleOCR API |
| 数据结构化 | DeepSeek / OpenAI-compatible LLM |
| 数据容错 | jsonrepair |
| 存储 | SQLite + Drizzle ORM |
| API | Fastify 5 |
| 前端 | React 19 + Vite 6 + Tailwind CSS 3 |
| 可视化 | D3.js（Sankey / Force / Stack / Area / Line） |
| 状态管理 | Zustand |
| 语言 | TypeScript（全栈） |

## 数据管线

```
PDF 剧本 → PaddleOCR → LLM 分析 → SQLite → REST API → D3 可视化
         (文本提取)   (角色/关系/主题/叙事)
```

- `scripts/pipeline-full.ts` — 一键全流程
- `scripts/seed-plays.ts` — 扫描 PDF 写入元数据
- `scripts/batch-ocr.ts` — 批量 OCR 文本提取
- `scripts/batch-analyze.ts` — 批量 LLM 分析
- `scripts/demo-pipeline.ts` — 单剧本演示（控制台输出）

`MAX_PLAYS=10` 可控制每次处理数量，默认 5。

## 可视化功能

### 单剧本三视图联动
- **行当桑基图**：角色身份 → 行当流向
- **力导向关系网络**：角色互动拓扑，节点大小=中心性
- **主题河流图/柱状图**：主题随叙事阶段的强度演变

### 跨剧本宏观比较
- **堆叠面积图**：不同年代生旦净丑占比变迁
- **主题共现网络**：高频主题组合识别

### 交互特性
- 三视图 Linking & Brushing（点击联动高亮）
- 侧滑详情面板（角色证据卡片）
- 单剧本全屏详情页（原文预览 + 审计脚注）
- 暗色主题（宣纸浅 / 戏台深）
- 上传 PDF 自动 OCR + LLM 分析（实时进度）

## API 端点

| 端点 | 说明 |
|:---|:---|
| `GET /api/plays` | 剧本列表 |
| `GET /api/plays/:id` | 单剧本详情 |
| `GET /api/plays/:id/characters` | 角色列表 |
| `GET /api/plays/:id/relations` | 关系网络 |
| `GET /api/plays/:id/themes` | 主题分布 |
| `GET /api/plays/:id/narrative` | 叙事阶段 |
| `GET /api/stats/role-types` | 跨剧本行当统计 |
| `GET /api/stats/themes` | 主题共现网络 |
| `POST /api/upload` | 上传 PDF 自动分析 |
| `POST /api/analyze/:id` | 触发 AI 分析 |
| `GET /api/analyze/:id/status` | 查询分析进度 |

## 环境变量

```bash
# PaddleOCR
PADDLEOCR_TOKEN=xxx

# LLM（兼容 OpenAI API 的服务）
LLM_BASE_URL=https://api.deepseek.com
LLM_API_KEY=sk-xxx
LLM_MODEL=deepseek-chat
LLM_TEMPERATURE=0.1
LLM_MAX_TOKENS=4096

# 可选
DB_PATH=data/jingju.db
PORT=3000
```

## 许可

MIT
