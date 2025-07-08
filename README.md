# 交通管理系统（Traffic Management System）

本项目是一个基于 **Next.js 13+（App Router）**、**TypeScript** 和 **Tailwind CSS** 构建的现代化交通管理系统前端应用，模块化设计，包含交通流量监控、违法行为检测、人脸识别、道路危险提示与地图可视化等多个核心功能。

---

## 📌 项目简介

该系统旨在为交通管理部门提供一套可视化、模块化、智能化的前端控制台，帮助实现：

- 实时交通流量监测
- 非法行为检测与告警
- 高速人脸识别与行为分析
- 道路危险自动识别
- 与地图系统集成的交通状态可视化

---

## 🚀 技术栈

| 技术 | 描述 |
|------|------|
| **Next.js 13+** | 基于 App Router 的现代 React 框架 |
| **TypeScript** | 类型安全的 JavaScript 超集 |
| **Tailwind CSS** | 实用工具优先的 CSS 框架 |
| **PostCSS** | 用于处理 Tailwind 的 CSS |
| **PNPM** | 高性能的包管理器 |
| **ES Modules (.mjs)** | 使用现代模块语法配置 Next.js |
| **Shadcn/UI**（推测）| 高质量的 UI 组件库（若使用）|

---

## 📦 安装与运行

### 🔧 环境要求

- Node.js >= 18
- PNPM >= 8（建议使用 PNPM）

### 🛠️ 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/your-name/traffic-management-system.git
cd traffic-management-system

# 2. 安装依赖
pnpm install

# 3. 启动开发服务器
pnpm dev

# 4. 打开浏览器访问
http://localhost:3000

traffic-management-system/
├── app/                         # Next.js 路由与页面组件
│   ├── globals.css              # 全局样式定义（Tailwind + 自定义）
│   ├── layout.tsx               # 根布局组件，应用全局主题或导航结构
│   ├── page.tsx                 # 网站首页（默认跳转或入口页）
│   └── dashboard/               # 仪表盘模块
│       ├── page.tsx             # 仪表盘主页面，整合各个功能模块
│       └── loading.tsx          # 仪表盘加载过渡组件
│
├── components/                  # 所有功能模块组件（可复用）
│   ├── theme-provider.tsx       # 主题提供器，可能用于浅/深色切换
│   ├── integrated-map-dashboard.tsx # 地图集成功能模块，展示全局交通地图
│   ├── traffic-flow-module.tsx  # 交通流量模块（实时车流数据分析）
│   ├── violation-module.tsx     # 违法行为检测模块（违章事件展示）
│   ├── face-recognition-module.tsx  # 人脸识别模块（抓拍/身份分析）
│   ├── traffic-monitor-module.tsx   # 交通监控视频/传感器数据模块
│   └── road-hazard-module.tsx  # 道路危险检测模块（障碍物/施工警示）
│
├── public/                      # 静态资源（如图片、图标等）可放于此
│
├── .gitignore                   # Git 忽略配置文件
├── components.json              # 组件配置，可能为 UI 自动导入或 Shadcn 配置
├── next.config.mjs              # Next.js 配置文件（使用 ESModule）
├── package.json                 # 项目信息与脚本入口
├── pnpm-lock.yaml               # PNPM 锁定依赖版本
├── postcss.config.mjs           # PostCSS 配置（用于 Tailwind 插件）
├── tailwind.config.ts           # Tailwind 配置文件（主题、颜色、插件等）
└── tsconfig.json                # TypeScript 配置文件
