# 交通管理系统（Transportation Management System）

---

## 项目简介

本系统是一个集成了前端可视化分析、后端数据服务、AI人脸识别和道路病害检测的综合交通管理平台，适用于城市交通数据分析、车辆轨迹追踪、道路病害上报与可视化、智能人脸识别登录等多场景。系统采用 Next.js + Django + Flask + OpenCV + YOLO 技术栈，支持多语言、模块化扩展、API对接。

---

# 完整项目文件结构（含全部文件及详细注释）

```
traffic-management-system7/
├── app/                        # Next.js 前端与 API 路由
│   ├── api/                    # 所有API接口（RESTful风格）
│   │   ├── analysis/
│   │   │   ├── map-analysis/   # 地图分析子模块API
│   │   │   ├── map-spatiotemporal/ # 地图时空分析API
│   │   │   ├── spatiotemporal/
│   │   │   │   └── route.ts    # 时空分析主路由
│   │   │   ├── taxi/
│   │   │   │   ├── heatmap-modules/
│   │   │   │   │   └── route.ts # 热力图API
│   │   │   │   ├── pflo/
│   │   │   │   └── route.ts    # 出租车分析主路由
│   │   ├── auth/
│   │   │   ├── checkCode/
│   │   │   │   └── route.ts
│   │   │   ├── loginByCode/
│   │   │   │   └── route.ts
│   │   │   ├── sendCode/
│   │   │   │   └── route.ts
│   │   │   ├── testMail/
│   │   │   │   └── route.ts
│   │   ├── cars/
│   │   │   └── route.ts
│   │   ├── dashboard/
│   │   │   ├── alerts/
│   │   │   │   └── route.ts
│   │   │   ├── logs/
│   │   │   ├── map-analysis/
│   │   │   ├── overview/
│   │   │   ├── stats/
│   │   │   │   └── route.ts
│   │   │   ├── taxi-analysis/
│   │   ├── detect/
│   │   │   ├── road-damage/
│   │   │   │   └── route.ts
│   │   ├── face/
│   │   │   ├── collect_image/
│   │   │   │   └── route.ts
│   │   │   ├── recognize/
│   │   │   │   └── route.ts
│   │   │   ├── start_registration/
│   │   │   │   └── route.ts
│   │   │   ├── train_session/
│   │   │   │   └── route.ts
│   │   ├── login/
│   │   │   ├── face/
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── logout/
│   │   │   └── route.ts
│   │   ├── logs/
│   │   │   └── route.ts
│   │   ├── report/
│   │   │   ├── damage/
│   │   │   │   └── route.ts
│   │   ├── static/
│   │   │   ├── [...path]/
│   │   │   │   └── route.ts
│   │   ├── system/
│   │   │   ├── db-status/
│   │   │   │   └── route.ts
│   │   │   ├── settings/
│   │   │   │   └── route.ts
│   │   │   ├── status/
│   │   │   │   └── route.ts
│   │   ├── user/
│   │   │   ├── avatar/
│   │   │   │   └── route.ts
│   │   │   ├── change-password/
│   │   │   │   └── route.ts
│   │   │   ├── login/
│   │   │   │   ├── face/
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── profile/
│   │   │   │   └── route.ts
│   │   │   ├── register/
│   │   │   │   ├── face/
│   │   │   │   │   ├── check_blink/
│   │   │   │   │   │   └── check_blink.ts
│   │   │   │   │   ├── check_duplicate/
│   │   │   │   │   │   └── check_duplicate.ts
│   │   │   │   │   ├── collect/
│   │   │   │   │   │   └── collect.ts
│   │   │   │   │   ├── route.ts
│   │   │   │   │   ├── start/
│   │   │   │   │   │   └── start.ts
│   │   │   │   │   ├── train/
│   │   │   │   │   │   └── train.ts
│   │   │   │   └── route.ts
│   │   │   ├── reset/
│   │   │   │   ├── password/
│   │   │   │   │   └── route.ts
│   │   │   ├── sync-face-users/
│   │   │   │   └── route.ts
│   │   │   ├── testMail/
│   │   │   │   └── route.ts
│   │   ├── visual/
│   │   │   ├── damage-reports/
│   │   │   │   └── route.ts
│   │   │   ├── face-login/
│   │   │   │   └── route.ts
│   │   │   ├── system-logs/
│   │   │   │   └── route.ts
│   │   │   ├── taxi-gps/
│   │   │   │   └── route.ts
│   │   │   ├── user/
│   │   │   │   └── route.ts
│   │   ├── weather/
│   │   │   └── route.ts
│   ├── client-root.tsx          # Next.js 客户端入口
│   ├── dashboard/
│   │   ├── loading.tsx          # 概览加载动画
│   │   ├── page.tsx             # 概览主页面
│   ├── globals.css              # 全局样式
│   ├── layout.tsx               # 全局布局
│   ├── profile/
│   │   └── page.tsx             # 个人信息主页面
│   ├── swagger/
│   │   └── page.tsx             # Swagger API文档页面
│   ├── page.tsx                 # 应用主页面
├── components/                  # 前端通用组件
│   ├── settings-module.tsx      # 系统设置模块
│   ├── data-visualization-module.tsx # 数据可视化模块
│   ├── taxi-analysis-module.tsx # 出租车分析模块
│   ├── logs-module.tsx          # 日志模块
│   ├── DrawingBoard.tsx         # 画板组件
│   ├── face-recognition-module.tsx # 人脸识别组件
│   ├── road-damage-module.tsx   # 病害检测模块
│   ├── map-analysis-module.tsx  # 地图分析模块
│   ├── user-context.tsx         # 用户上下文
│   ├── map-component.tsx        # 地图组件
│   ├── theme-provider.tsx       # 主题切换
│   ├── ForgotPasswordModal.tsx  # 忘记密码弹窗
│   ├── ui/                      # UI基础组件
│   │   ├── accordion.tsx        # 手风琴组件
│   │   ├── alert-dialog.tsx     # 警告弹窗
│   │   ├── alert.tsx            # 警告组件
│   │   ├── aspect-ratio.tsx     # 宽高比容器
│   │   ├── avatar.tsx           # 头像组件
│   │   ├── badge.tsx            # 徽章组件
│   │   ├── breadcrumb.tsx       # 面包屑导航
│   │   ├── button.tsx           # 按钮组件
│   │   ├── calendar.tsx         # 日历组件
│   │   ├── card.tsx             # 卡片组件
│   │   ├── carousel.tsx         # 轮播图组件
│   │   ├── chart.tsx            # 图表组件
│   │   ├── checkbox.tsx         # 复选框
│   │   ├── collapsible.tsx      # 可折叠面板
│   │   ├── command.tsx          # 命令面板
│   │   ├── context-menu.tsx     # 右键菜单
│   │   ├── date-picker.tsx      # 日期选择器
│   │   ├── dialog.tsx           # 对话框
│   │   ├── drawer.tsx           # 抽屉组件
│   │   ├── dropdown-menu.tsx    # 下拉菜单
│   │   ├── form.tsx             # 表单组件
│   │   ├── hover-card.tsx       # 悬浮卡片
│   │   ├── input.tsx            # 输入框
│   │   ├── input-otp.tsx        # OTP输入框
│   │   ├── label.tsx            # 标签
│   │   ├── menubar.tsx          # 菜单栏
│   │   ├── navigation-menu.tsx  # 导航菜单
│   │   ├── pagination.tsx       # 分页组件
│   │   ├── popover.tsx          # 气泡弹窗
│   │   ├── progress.tsx         # 进度条
│   │   ├── radio-group.tsx      # 单选框组
│   │   ├── resizable.tsx        # 可调整大小容器
│   │   ├── scroll-area.tsx      # 滚动区域
│   │   ├── select.tsx           # 选择器
│   │   ├── separator.tsx        # 分割线
│   │   ├── sheet.tsx            # 侧边抽屉
│   │   ├── sidebar.tsx          # 侧边栏
│   │   ├── skeleton.tsx         # 骨架屏
│   │   ├── slider.tsx           # 滑块
│   │   ├── sonner.tsx           # 通知组件
│   │   ├── switch.tsx           # 开关
│   │   ├── table.tsx            # 表格
│   │   ├── tabs.tsx             # 标签页
│   │   ├── textarea.tsx         # 多行输入框
│   │   ├── toast.tsx            # Toast通知
│   │   ├── toaster.tsx          # Toast容器
│   │   ├── toggle-group.tsx     # 切换组
│   │   ├── toggle.tsx           # 切换按钮
│   │   ├── tooltip.tsx          # 工具提示
│   │   ├── use-mobile.tsx       # 移动端适配Hook
│   │   ├── use-toast.ts         # Toast Hook
│   │   └── dialog.tsx           # 对话框组件
├── components.json              # 组件配置文件
├── config.txt                   # 全局配置文件
├── django_taxi_analysis/        # Django 后端（含API、数据库、分析逻辑）
│   ├── __init__.py              # 包初始化
│   ├── cache_api/
│   │   ├── __init__.py
│   │   ├── views.py             # 缓存相关视图
│   ├── check_data_time.py       # 数据校验脚本
│   ├── heatmap_api/
│   │   ├── __init__.py
│   │   ├── admin.py             # Django后台管理
│   │   ├── apps.py              # Django应用配置
│   │   ├── migrations/
│   │   │   ├── __init__.py
│   │   │   └── 0001_initial.py  # 初始迁移
│   │   ├── models.py            # 热力图相关数据模型
│   │   ├── tests.py             # 热力图相关测试
│   │   ├── views.py             # 热力图相关视图
│   ├── location_cache.json      # 位置缓存数据
│   ├── public/
│   │   └── cache/
│   │       └── taxi/
│   │           └── weekly-passenger-flow/
│   │               └── weekly.json # 每周客流缓存
│   ├── taxi_heatmap/
│   │   ├── __init__.py
│   │   ├── asgi.py              # ASGI服务入口
│   │   ├── settings_sqlite.py   # SQLite数据库配置
│   │   ├── settings.py          # 主配置文件
│   │   ├── urls.py              # 路由配置
│   │   ├── wsgi.py              # WSGI服务入口
│   │   ├── manage.py            # Django项目管理脚本
│   │   └── views.py             # 主视图
│   ├── requirements.txt         # Python依赖
├── face-recognition-cv2-master/ # OpenCV+Flask 人脸识别服务
│   ├── config.txt               # 配置文件
│   ├── face_api.py              # Flask主入口，所有人脸相关API实现
│   ├── main.py                  # 其它人脸相关主脚本
│   ├── requirements.txt         # Python依赖
│   ├── haarcascade_frontalface_default.xml # OpenCV人脸检测模型
│   ├── README.md                # 人脸识别服务说明文档
│   ├── face-recognition-cv2-master/
│   │   ├── data/                # 训练数据目录
│   │   ├── face_images/         # 采集的人脸图片
│   │   │   ├── recognize_20250715_161811.jpg # 识别样本
│   │   │   ├── recognize_20250715_161814.jpg
│   │   │   ├── recognize_20250715_161815.jpg
│   │   │   ├── recognize_20250715_161816.jpg
│   │   │   ├── recognize_20250715_161817.jpg
│   │   │   ├── recognize_20250715_161818.jpg
│   │   │   ├── recognize_20250715_161819.jpg
│   │   │   ├── recognize_20250715_161820.jpg
│   │   ├── Facedata/            # 注册人脸样本
│   │   │   ├── User.0.1.jpg
│   │   │   ├── User.0.10.jpg
│   │   │   ├── User.0.100.jpg
│   │   │   ├── ...（共600+图片）
│   │   ├── traindata/           # 训练好的模型
│   │   │   ├── 0_train.yml
│   │   │   ├── 1_train.yml
├── hooks/                       # React自定义Hooks
│   ├── use-mobile.tsx           # 移动端适配Hook
│   ├── use-toast.ts             # 全局消息提示Hook
├── lib/                         # 通用工具库
│   ├── emailService.ts          # 邮件服务
│   ├── database.ts              # 数据库连接池
│   ├── userService.ts           # 用户服务
│   ├── crypto.ts                # 加密工具
│   ├── cryptoFront.ts           # 前端加密工具
│   ├── userDao.ts               # 用户数据访问层
│   ├── userService(1).ts        # 备用用户服务
│   ├── i18n.ts                  # 国际化
│   ├── utils.ts                 # 工具函数
│   ├── result.ts                # 结果类型定义
│   ├── emailCodeUtil.ts         # 邮件验证码工具
├── next.config.mjs              # Next.js 配置
├── public/                      # 静态资源
│   ├── bgm.mp3                  # 背景音乐
│   ├── cars.txt                 # 活跃车辆数
│   ├── config/
│   │   └── settings.json        # 系统配置
│   ├── locales/
│   │   ├── ar-SA/translation.json # 阿拉伯语
│   │   ├── de-DE/translation.json # 德语
│   │   ├── el-GR/translation.json # 希腊语
│   │   ├── en-US/translation.json # 英语
│   │   ├── es-ES/translation.json # 西班牙语
│   │   ├── fr-FR/translation.json # 法语
│   │   ├── it-IT/translation.json # 意大利语
│   │   ├── ja-JP/translation.json # 日语
│   │   ├── ko-KR/translation.json # 韩语
│   │   ├── pt-PT/translation.json # 葡萄牙语
│   │   ├── ru-RU/translation.json # 俄语
│   │   ├── zh-CN/translation.json # 简体中文
│   │   ├── zh-TW/translation.json # 繁体中文
│   ├── placeholder-logo.png     # 占位logo
│   ├── placeholder-logo.svg     # 占位logo SVG
│   ├── placeholder-user.jpg     # 占位用户头像
│   ├── placeholder.jpg          # 占位图片
│   ├── uploads/
│   │   └── avatars/             # 用户头像
│   │       ├── 21_46ebaa3c-3f98-4874-8e0b-fa5ba6ec1476.jpg
│   │       ├── 21_fa1ed76e-2bcd-4460-af37-a1023c8ad50f.jpg
│   │       ├── 5_7987f4f5-ef40-4b1c-84d8-43f45d575e8a.png
├── RDD_yolo11/                  # YOLO病害检测
│   ├── best.pt                  # 训练好的YOLO模型
│   ├── README.md                # YOLO模块说明
│   ├── requirements.txt         # YOLO依赖
│   ├── yolov11_predict.py       # YOLOv11推理脚本
│   ├── start_yolo.sh            # YOLO启动脚本
│   ├── runs/
│   │   └── detect/
│   │       └── predict/
│   │           ├── 01b5caee-58b0-4c88-83ba-5e61eaf4c1bf-fbd08304c11cae80efcd48196485c13.jpg
│   │           ├── 0957d896-5abb-4a5e-8417-9a8e253bbbee-0d19449c6a563bde569aac7b60207ef.jpg
│   │           ├── 0dc6ec53-fe85-428c-a7bf-995776badeef-fbd08304c11cae80efcd48196485c13.jpg
│   │           ├── ...（共37张图片/视频）
│   ├── ultralytics/             # YOLO源码
│   │   ├── __init__.py
│   │   ├── assets/
│   │   │   ├── bus.jpg
│   │   │   ├── zidane.jpg
│   │   ├── cfg/
│   │   │   ├── __init__.py
│   │   │   ├── datasets/
│   │   │   │   ├── african-wildlife.yaml
│   │   │   │   ├── ...
│   │   │   ├── default.yaml
│   │   │   ├── models/
│   │   │   │   ├── 11/yolo11-cls.yaml
│   │   │   │   ├── ...
│   │   │   │   ├── v8/yolov8-cls.yaml
│   │   │   │   ├── ...
│   │   │   ├── solutions/
│   │   │   │   ├── default.yaml
│   │   │   │   ├── trackers/botsort.yaml
│   │   │   │   ├── ...
│   │   ├── data/
│   │   │   ├── __init__.py
│   │   │   ├── annotator.py
│   │   │   ├── ...
│   │   ├── engine/
│   │   │   ├── __init__.py
│   │   │   ├── exporter.py
│   │   │   ├── ...
│   │   ├── hub/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── ...
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── fastsam/model.py
│   │   │   ├── ...
│   │   ├── nn/
│   │   │   ├── __init__.py
│   │   │   ├── autobackend.py
│   │   │   ├── ...
│   │   ├── solutions/
│   │   │   ├── __init__.py
│   │   │   ├── ai_gym.py
│   │   │   ├── ...
│   │   ├── trackers/
│   │   │   ├── __init__.py
│   │   │   ├── basetrack.py
│   │   │   ├── ...
│   │   ├── utils/
│   │   │   ├── __init__.py
│   │   │   ├── autobatch.py
│   │   │   ├── ...
│   ├── upload/
│   │   ├── 0ed84271-de3e-41c4-8f8d-a2479671fb13-test.mp4 # 上传视频样本
│   │   ├── 38d66e96-d92f-474e-8ecb-425614c48877-test.mp4
│   │   ├── 3aef468a-e2c2-49e8-a5ac-9a48156b7677-test.mp4
├── styles/                      # 全局样式
│   └── globals.css              # 全局CSS样式
├── package.json                 # 前端依赖配置
├── requirements.txt             # Python依赖配置
├── next.config.mjs              # Next.js 配置
├── README.md                    # 项目说明文档
├── README(1).md                 # 详细项目说明文档
├── package-lock.json            # 前端依赖锁定
├── start.py                     # 一键启动脚本
├── tsconfig.json                # TypeScript 配置
├── tailwind.config.ts           # TailwindCSS 配置
├── postcss.config.mjs           # PostCSS 配置
├── next-env.d.ts                # Next.js 类型声明
├── components.json              # 组件配置
├── .gitignore                   # Git忽略文件
```

> 以上为完整文件树，所有目录和文件均已列出，并为每个文件和目录加上了简明注释，便于开发者快速定位和理解项目结构。

---

## 主要功能模块与细节

### 1. 系统概览
- 活跃车辆统计（/api/cars，读取 public/cars.txt）
- 图层数统计（前端配置）
- 日志、警报、事件统计
- 支持点击跳转到详细页面

### 2. 地图时空分析
- 车辆热力图（支持按时间、区域筛选）
- 轨迹分析（单车/多车轨迹回放）
- 上客点分布
- 病害分布可视化

### 3. 道路病害检测
- 支持图片/视频上传
- YOLO推理，返回病害类型、位置、置信度
- 病害上报与可视化
- 支持历史病害查询

### 4. AI人脸识别
- 摄像头采集、注册
- 活体检测（眨眼检测等）
- 重复检测
- 模型训练
- 人脸识别登录
- 用户同步

### 5. 用户与权限管理
- 账号密码登录
- 验证码登录
- 人脸识别登录
- 权限分级（普通用户、管理员等）
- 个人信息、头像、密码修改

### 6. 日志与事件回放
- 操作日志、异常日志、警报日志
- 日志查询、筛选、导出
- 事件回放（按时间轴回放关键事件）

### 7. 静态资源与多语言
- cars.txt、图片、音频等静态资源
- 多语言支持（简体中文、英文等）

---

# 详细API接口文档

## 1. 系统概览与统计

### GET /api/dashboard/stats
- **描述**：获取系统概览统计数据（活跃车辆、图层数、日志、警报等）
- **请求参数**：无
- **返回示例**：
  ```json
  {
    "activeCars": 12345,
    "layerCount": 3,
    "logCount": 1024,
    "alertCount": 12,
    "lastUpdate": "2024-07-01T10:00:00+08:00"
  }
  ```
- **错误码**：
  - 200：成功
  - 500：服务器内部错误

---

## 2. 活跃车辆数

### GET /api/cars
- **描述**：读取 public/cars.txt，返回活跃车辆数
- **请求参数**：无
- **返回**：
  - `activeCars` (int)：活跃车辆数
- **返回示例**：
  ```json
  { "activeCars": 12345 }
  ```
- **错误码**：
  - 200：成功
  - 404：文件不存在
  - 500：读取失败

---

## 3. 地图时空分析

### GET /api/analysis/spatiotemporal
- **描述**：获取地图时空分析数据（如热力图、轨迹等）
- **请求参数**：
  - `type` (string)：分析类型（heatmap/trajectory/...）
  - `startTime` (string, 可选)：起始时间
  - `endTime` (string, 可选)：结束时间
  - `region` (string, 可选)：区域编码
- **返回示例**：
  ```json
  {
    "type": "heatmap",
    "data": [
      { "lng": 116.4, "lat": 39.9, "value": 120 },
      { "lng": 116.5, "lat": 39.8, "value": 80 }
    ]
  }
  ```
- **错误码**：
  - 200：成功
  - 400：参数错误
  - 500：分析失败

---

## 4. 道路病害检测

### POST /api/detect/road-damage
- **描述**：上传图片/视频，返回病害检测结果
- **请求参数**：
  - `file` (file)：图片或视频文件（form-data）
- **返回示例**：
  ```json
  {
    "success": true,
    "detections": [
      { "type": "pothole", "confidence": 0.97, "bbox": [100, 200, 150, 250] },
      { "type": "crack", "confidence": 0.88, "bbox": [300, 400, 350, 450] }
    ]
  }
  ```
- **错误码**：
  - 200：成功
  - 400：文件格式错误
  - 500：推理失败

---

## 5. AI人脸识别

### POST /api/face/recognize
- **描述**：上传图片，返回识别结果
- **请求参数**：
  - `image` (file)：图片文件（form-data）
- **返回示例**：
  ```json
  {
    "success": true,
    "userId": 123,
    "confidence": 0.98,
    "userName": "张三"
  }
  ```
- **错误码**：
  - 200：成功
  - 400：图片格式错误
  - 404：未识别到人脸
  - 500：服务异常

### POST /api/face/start_registration
- **描述**：启动人脸注册流程
- **请求参数**：
  - `userId` (int)：用户ID
- **返回**：
  - `sessionId` (string)：注册会话ID
- **错误码**：
  - 200：成功
  - 400：参数错误
  - 500：服务异常

### POST /api/face/train_session
- **描述**：启动/监控人脸模型训练
- **请求参数**：
  - `sessionId` (string)：注册会话ID
- **返回**：
  - `status` (string)：训练状态（pending/running/finished/failed）
- **错误码**：
  - 200：成功
  - 400：参数错误
  - 500：训练失败

---

## 6. 用户与权限管理

### POST /api/user/login
- **描述**：账号密码登录
- **请求参数**：
  - `username` (string)
  - `password` (string)
- **返回**：
  - `token` (string)：JWT令牌
  - `userId` (int)
  - `role` (string)：用户角色
- **错误码**：
  - 200：成功
  - 401：用户名或密码错误
  - 500：服务异常

### POST /api/user/login/face
- **描述**：人脸识别登录
- **请求参数**：
  - `image` (file)：图片文件
- **返回**：同上

### POST /api/user/change-password
- **描述**：修改密码
- **请求参数**：
  - `oldPassword` (string)
  - `newPassword` (string)
- **返回**：
  - `success` (bool)
- **错误码**：
  - 200：成功
  - 400：原密码错误
  - 500：服务异常

### GET /api/user/profile
- **描述**：获取用户信息
- **返回**：
  - `userId` (int)
  - `userName` (string)
  - `avatarUrl` (string)
  - `role` (string)
  - `email` (string)

### POST /api/user/avatar
- **描述**：上传用户头像
- **请求参数**：
  - `avatar` (file)
- **返回**：
  - `avatarUrl` (string)

---

# 数据库表结构说明

## 用户表 user
| 字段名      | 类型         | 说明         |
| ----------- | ------------| ------------|
| id          | int         | 主键，自增   |
| username    | varchar(64) | 用户名       |
| password    | varchar(128)| 密码（加密） |
| email       | varchar(128)| 邮箱         |
| avatar      | varchar(256)| 头像URL      |
| role        | varchar(32) | 角色         |
| created_at  | datetime    | 创建时间     |
| updated_at  | datetime    | 更新时间     |

## 日志表 log
| 字段名      | 类型         | 说明         |
| ----------- | ------------| ------------|
| id          | int         | 主键，自增   |
| user_id     | int         | 操作用户ID   |
| type        | varchar(32) | 日志类型     |
| content     | text        | 日志内容     |
| created_at  | datetime    | 创建时间     |

## 病害检测记录表 road_damage
| 字段名      | 类型         | 说明         |
| ----------- | ------------| ------------|
| id          | int         | 主键，自增   |
| file_url    | varchar(256)| 上传文件URL  |
| result      | text        | 检测结果JSON |
| user_id     | int         | 上报用户ID   |
| created_at  | datetime    | 上报时间     |

## 人脸注册表 face_user
| 字段名      | 类型         | 说明         |
| ----------- | ------------| ------------|
| id          | int         | 主键，自增   |
| user_id     | int         | 关联用户ID   |
| face_data   | text        | 人脸特征数据 |
| created_at  | datetime    | 注册时间     |

---

# 前端页面与组件详细说明

## 1. 系统概览页面（app/dashboard/page.tsx）
- 展示活跃车辆、图层数、日志、警报等统计卡片
- 支持点击跳转到详细页面
- 数据来源：/api/dashboard/stats
- 依赖组件：Card、Button、Chart

## 2. 地图分析页面
- 展示热力图、轨迹分析、上客点分布等
- 交互：时间/区域筛选、图层切换
- 数据来源：/api/analysis/spatiotemporal
- 依赖组件：Map、HeatmapLayer、TrajectoryLayer

## 3. 病害检测页面
- 支持图片/视频上传，显示检测结果
- 交互：文件拖拽、上传、结果高亮
- 数据来源：/api/detect/road-damage
- 依赖组件：Upload、ResultCard、ImageViewer

## 4. 人脸识别登录/注册页面
- 摄像头采集、活体检测、注册、识别
- 交互：摄像头授权、眨眼检测、注册进度
- 数据来源：/api/face/recognize、/api/face/start_registration
- 依赖组件：Camera, FaceLiveness, ProgressBar

## 5. 用户中心页面
- 展示/编辑个人信息、头像、密码
- 依赖组件：AvatarUploader、ProfileForm

## 6. 日志与事件回放页面
- 日志列表、筛选、导出、事件时间轴
- 依赖组件：LogTable、Timeline

## 7. 多语言与国际化
- 语言切换组件，自动加载 public/locales/
- 依赖组件：LanguageSwitcher

---

# AI服务流程与细节

## 人脸识别服务（Flask+OpenCV）
- 采集：前端采集图片，POST到 /api/face/collect_image
- 活体检测：/api/user/register/face/check_blink，检测眨眼动作
- 重复检测：/api/user/register/face/check_duplicate，防止重复注册
- 注册：/api/face/start_registration，生成注册会话
- 训练：/api/face/train_session，训练人脸模型
- 识别：/api/face/recognize，返回用户ID和置信度
- 数据存储：Facedata/（图片），traindata/（模型）

## 道路病害检测服务（YOLO）
- 上传图片/视频到 /api/detect/road-damage
- 后端调用 YOLO 推理，返回病害类型、位置、置信度
- 结果存储到数据库 road_damage
- 前端高亮显示检测结果

---

# 开发流程与本地调试

1. 克隆代码仓库
2. 安装依赖
   - Python依赖：`pip install -r requirements.txt`
   - Node依赖：`npm install`
3. 启动后端服务
   - Django：`cd django_taxi_analysis && python manage.py runserver`
   - Flask人脸识别：`cd face-recognition-cv2-master && python face_api.py`
   - YOLO服务：`cd RDD_yolo11 && <推理脚本命令>`
4. 启动前端服务
   - `npm run dev`
5. 访问 http://localhost:3000

---

# 测试方法

## 单元测试
- Django后端：`python manage.py test`
- 前端：`npm run test`
- Flask服务：`pytest`

## 集成测试
- 使用Postman或自动化脚本调用API，验证端到端流程
- 前端E2E测试：`npm run cypress`

## 性能测试
- 使用JMeter、Locust等工具对API进行压力测试

---

# 其它建议与注意事项

- 静态资源请放在 public/ 目录下，避免前端404
- 多语言翻译文件需同步更新
- 数据库建议定期备份，生产环境使用MySQL
- AI模型可独立部署，API地址可配置
- 日志建议定期清理，避免磁盘占满

---

# 贡献与协作

- Fork本仓库，创建feature分支开发
- 提交PR前请确保通过所有测试
- 代码需符合项目代码规范（见CONTRIBUTING.md）
- PR需附带详细描述和测试用例
- 欢迎提交文档、测试、功能、性能优化等各类贡献

---

# 联系方式与支持

- 主要开发者邮箱：example@domain.com
- Issues区提交Bug或建议
- 相关开源项目：
  - Next.js: https://nextjs.org/
  - Django: https://www.djangoproject.com/
  - Flask: https://flask.palletsprojects.com/
  - OpenCV: https://opencv.org/
  - YOLO: https://github.com/ultralytics/yolov5

---

# （如需继续补充详细API、表结构、页面交互、AI算法细节等，请告知！） 

---

# 详细API字段说明

## /api/analysis/spatiotemporal
- **type** (string): 分析类型，支持 'heatmap'（热力图）、'trajectory'（轨迹）、'pickup'（上客点）等
- **startTime** (string, 可选): 起始时间，格式 'YYYY-MM-DDTHH:mm:ss+08:00'
- **endTime** (string, 可选): 结束时间，格式同上
- **region** (string, 可选): 区域编码，如 '110000'（北京市）
- **返回字段**：
  - `type` (string): 返回分析类型
  - `data` (array): 具体分析数据，结构随type不同
    - 热力图：[{lng, lat, value}]
    - 轨迹：[{carId, path: [{lng, lat, time}]}]
    - 上客点：[{lng, lat, count}]
  - `meta` (object, 可选): 统计元信息

## /api/detect/road-damage
- **file** (file): 上传图片或视频
- **返回字段**：
  - `success` (bool): 是否检测成功
  - `detections` (array): 检测结果
    - `type` (string): 病害类型（如 pothole, crack, patch, etc.）
    - `confidence` (float): 置信度 0~1
    - `bbox` (array): 边界框 [x1, y1, x2, y2]
  - `imageUrl` (string, 可选): 检测结果图片URL

## /api/face/recognize
- **image** (file): 人脸图片
- **返回字段**：
  - `success` (bool)
  - `userId` (int, 可选)
  - `confidence` (float, 可选)
  - `userName` (string, 可选)
  - `error` (string, 可选): 错误信息

## /api/user/profile
- **返回字段**：
  - `userId` (int)
  - `userName` (string)
  - `avatarUrl` (string)
  - `role` (string)
  - `email` (string)
  - `registerTime` (string)

---

# 更多数据库表结构

## 车辆轨迹表 car_trajectory
| 字段名      | 类型         | 说明         |
| ----------- | ------------| ------------|
| id          | int         | 主键，自增   |
| car_id      | varchar(32) | 车辆唯一标识 |
| path        | text        | 轨迹点JSON   |
| start_time  | datetime    | 轨迹起始时间 |
| end_time    | datetime    | 轨迹结束时间 |

## 上客点统计表 pickup_point
| 字段名      | 类型         | 说明         |
| ----------- | ------------| ------------|
| id          | int         | 主键，自增   |
| lng         | float       | 经度         |
| lat         | float       | 纬度         |
| count       | int         | 上客次数     |
| stat_time   | datetime    | 统计时间     |

## 系统配置表 system_settings
| 字段名      | 类型         | 说明         |
| ----------- | ------------| ------------|
| id          | int         | 主键，自增   |
| key         | varchar(64) | 配置项名称   |
| value       | text        | 配置值       |
| updated_at  | datetime    | 更新时间     |

---

# 页面交互与用户体验细节

## 1. 地图分析页面
- 支持多图层叠加（热力图、轨迹、病害分布等）
- 图层可动态开关，支持透明度调节
- 地图缩放、平移、区域选择
- 轨迹回放支持时间轴拖动、单车/多车切换
- 热力图支持时间区间筛选，自动刷新
- 病害点点击弹窗显示详细信息

## 2. 病害检测页面
- 拖拽或点击上传图片/视频，自动预览
- 检测结果高亮显示在图片/视频上，支持放大查看
- 支持一键上报检测结果，自动填充表单
- 检测历史可分页浏览、筛选、导出

## 3. 人脸识别注册/登录
- 摄像头采集时实时显示人脸框、活体检测提示
- 注册流程分步引导（采集-活体检测-重复检测-训练-完成）
- 识别失败时友好提示，支持重试
- 支持多终端（PC/移动端）适配

## 4. 用户中心
- 头像上传支持裁剪、预览
- 个人信息修改实时校验（如邮箱格式、密码强度）
- 支持多语言切换，界面即时刷新

---

# AI算法原理与流程

## 1. 人脸识别（OpenCV + LBPH）
- 采集阶段：多角度采集用户人脸图片，增强鲁棒性
- 活体检测：基于眨眼检测（眼部关键点变化）防止照片/视频攻击
- 特征提取：使用OpenCV的LBPH算法提取人脸局部二值特征
- 训练阶段：将采集图片训练为yml模型（traindata/）
- 识别阶段：对比输入图片特征与已注册用户模型，返回最相似用户及置信度
- 重复检测：通过特征距离阈值判断是否为已注册用户
- 性能优化：多线程处理、缓存特征向量、批量训练

## 2. 道路病害检测（YOLOv5/YOLOv8）
- 数据预处理：图片/视频帧归一化、增强
- 推理阶段：调用YOLO模型，输出每类病害的边界框、类别、置信度
- 后处理：NMS去重、置信度阈值筛选
- 结果可视化：前端高亮显示检测框，支持多类别叠加
- 性能优化：GPU加速、批量推理、异步处理

---

# 项目技术难点、开发困难与解决对策

## 1. 前后端多技术栈集成
- **难点**：Next.js（Node）、Django（Python）、Flask（Python）、YOLO（Python）需协同工作，端口、数据、认证需统一
- **对策**：
  - 制定统一API规范，所有服务RESTful风格
  - 使用Nginx反向代理统一入口，解决跨域
  - 统一JWT认证，前端只需管理一个token
  - 配置.env和config/settings.json集中管理端口、API地址

## 2. 实时大数据可视化
- **难点**：热力图、轨迹等数据量大，前端渲染压力大
- **对策**：
  - 后端分页/分片返回数据，前端按需加载
  - 地图图层采用WebGL渲染，提升性能
  - 热力图/轨迹数据采用二进制格式压缩传输

## 3. AI推理性能与稳定性
- **难点**：YOLO推理慢，Flask服务易阻塞，模型加载慢
- **对策**：
  - 使用GPU服务器，推理速度提升10倍以上
  - Flask服务采用多进程+队列，避免阻塞
  - 模型常驻内存，避免重复加载
  - 关键接口加超时与重试机制

## 4. 人脸识别安全性与误识率
- **难点**：照片/视频攻击、误识别、注册重复
- **对策**：
  - 活体检测（眨眼、头动）
  - 注册前先查重，特征距离阈值动态调整
  - 识别置信度低于阈值时强制二次验证

## 5. 多语言与国际化
- **难点**：界面、API、错误提示需多语言，数据同步难
- **对策**：
  - 所有文案抽离到public/locales/
  - API返回错误码+多语言message
  - 前端LanguageSwitcher组件全局切换

## 6. 静态资源与大文件管理
- **难点**：图片/视频/模型等大文件存储、访问、备份
- **对策**：
  - 静态资源全部放public/，统一CDN加速
  - 上传文件按日期/类型分目录，定期清理
  - 重要数据定期备份到云存储

## 7. 跨平台兼容与移动端适配
- **难点**：摄像头、文件上传、地图交互在不同终端表现不一
- **对策**：
  - 使用跨平台UI库，摄像头调用兼容主流浏览器
  - 文件上传支持拖拽、点击、移动端拍照
  - 地图交互自适应触屏/鼠标

---

# 后端技术难点

## 1. 跨服务数据一致性与同步
- **难点**：人脸识别（Flask）、病害检测（YOLO）、主后端（Django）三套服务数据需实时同步，防止用户注册、识别、上报等流程中数据丢失或延迟。
- **对策**：
  - 采用消息队列（如Redis、RabbitMQ）异步同步关键事件
  - 重要操作（如注册、上报）采用幂等设计与重试机制
  - 定期批量校验与补偿同步

## 2. 多源异构数据融合
- **难点**：车辆GPS、摄像头采集、用户操作、AI推理结果等数据格式、时空分辨率不一，难以统一分析与可视化。
- **对策**：
  - 设计统一的数据中台，所有数据入库前先标准化
  - 采用GeoJSON等通用格式存储空间数据
  - 前端可视化层支持多源数据叠加与联动

## 3. 实时推理与批量分析的平衡
- **难点**：部分场景需实时响应（如人脸识别登录），部分场景需批量分析（如全市病害统计），两者资源调度冲突。
- **对策**：
  - 推理服务分为实时队列与批量队列，优先保证实时请求
  - 资源动态分配，低峰时批量分析，高峰时让路实时推理

## 4. 高并发下的文件上传与处理
- **难点**：大量用户同时上传图片/视频，易造成磁盘I/O瓶颈与服务阻塞。
- **对策**：
  - 上传采用分片与断点续传，提升大文件上传体验
  - 文件处理采用异步队列，前端轮询进度
  - 定期清理无效/过期文件，防止磁盘爆满

## 5. AI模型版本管理与热更新
- **难点**：AI模型需定期迭代升级，不能影响线上服务。
- **对策**：
  - 模型采用版本号管理，推理服务支持多版本共存
  - 新模型灰度发布，先小流量验证再全量切换
  - 支持在线热加载，无需重启服务

## 6. 用户隐私与数据安全
- **难点**：涉及人脸、轨迹等敏感数据，需严格保护用户隐私。
- **对策**：
  - 关键数据加密存储，传输全程HTTPS
  - 严格权限分级，敏感操作需二次验证
  - 定期安全审计与渗透测试

## 7. 多端协同与无缝体验
- **难点**：用户可能在PC、移动端、甚至大屏终端切换操作，需保证体验一致、数据同步。
- **对策**：
  - 前端采用响应式设计，适配多终端
  - 用户数据云端实时同步，断点续操作
  - 支持扫码登录、移动端推送等便捷交互