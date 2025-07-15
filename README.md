# 交通管理系统（Traffic Management System）

本系统是一个集成了**前端可视化分析**、**后端数据服务**、**AI人脸识别**和**道路病害检测**的综合交通管理平台。适用于城市交通数据分析、车辆轨迹追踪、道路病害上报与可视化、智能人脸识别登录等多场景。

---

## 目录结构

```
.
├── app/                        # Next.js 前端与 API 路由
│   ├── api/                    # 所有API接口（RESTful风格）
│   │   ├── analysis/           # 时空分析相关API
│   │   │   └── spatiotemporal/route.ts
│   │   ├── report/damage/route.ts  # 道路病害相关API
│   │   ├── user/login/route.ts     # 用户登录API
│   │   ├── user/register/route.ts  # 用户注册API
│   │   ├── auth/loginByCode/route.ts # 验证码登录API
│   │   ├── auth/sendCode/route.ts    # 发送验证码API
│   │   ├── face/recognize/route.ts   # 前端人脸识别API
│   │   ├── face/start_registration/route.ts # 前端人脸注册API
│   │   ├── face/collect_image/route.ts      # 前端人脸采集API
│   │   └── face/train_session/route.ts      # 前端人脸训练API
│   └── ...（页面、组件等）
├── components/                 # 前端通用组件
├── django_taxi_analysis/       # Django 后端（含API、数据库、分析逻辑）
│   ├── heatmap_api/            # 热力图与分析API
│   │   └── views.py
│   └── ...
├── face-recognition-cv2-master/ # OpenCV+Flask 人脸识别服务
│   └── face_api.py
├── RDD_yolo11/                 # 道路病害检测模型与推理脚本
├── public/                     # 前端静态资源
├── scripts/                    # 辅助脚本
├── styles/                     # 全局样式
├── start.py                    # 一键启动集成脚本
├── package.json                # 前端依赖与脚本
├── django_taxi_analysis/requirements.txt # 后端依赖
└── ...
```

---

## 1. 系统功能与模块详解

### 1.1 前端（Next.js）

- **地图时空分析**（`components/map-analysis-module.tsx`）
  - 支持车辆热力图、轨迹分析、热门上客点、道路病害分布等多种可视化图层。
  - 通过高德地图API进行地图渲染与交互。
  - 通过API与后端联动，动态获取分析数据。
- **用户与权限管理**
  - 支持账号密码、验证码、人脸识别多种登录方式。
  - 用户注册、找回密码、头像上传等。
- **人脸识别前端集成**
  - 通过摄像头采集人脸，调用后端API进行注册与识别。

#### 主要前端代码块说明

- `components/map-analysis-module.tsx`：地图分析主模块，负责地图渲染、图层切换、时间轴、弹窗等。
- `components/face-recognition-module.tsx`：人脸识别前端交互逻辑。
- `app/api/` 目录下各API路由：所有前端与后端、AI服务的接口桥接。

### 1.2 后端（Django）

- **API服务**（`django_taxi_analysis/heatmap_api/views.py`）
  - 提供时空分析、热力图、统计、轨迹、热门点、客流等多种数据接口。
  - 采用Django REST Framework，支持高性能SQL聚合与分析。
- **数据库支持**
  - 默认支持SQLite，推荐MySQL生产环境。
  - 主要表：`taxi_gps_log`（车辆GPS日志）、`damage_reports`（道路病害上报）、用户表等。

#### 主要后端代码块说明

- `django_taxi_analysis/heatmap_api/views.py`：所有分析相关API的实现，包含热力图、统计、轨迹、热门点、客流等。
- `django_taxi_analysis/taxi_heatmap/settings_sqlite.py`：数据库配置（SQLite为例）。
- `django_taxi_analysis/manage.py`：Django项目启动入口。

### 1.3 AI人脸识别服务（Flask+OpenCV）

- **服务入口**：`face-recognition-cv2-master/face_api.py`
- **主要接口**：
  - `/start_registration`：开始人脸录入会话
  - `/collect_image`：采集单张人脸图像
  - `/train_session`：训练人脸识别模型
  - `/recognize`：人脸识别
- **实现要点**：
  - 使用OpenCV Haar特征进行人脸检测
  - 支持眨眼验证、重复检测、录入进度管理
  - 训练模型采用LBPH算法，模型文件自动保存

#### 主要AI服务代码块说明

- `face_api.py`：Flask服务主入口，所有人脸相关API实现。
- `config.txt`：人脸数据配置，自动生成。
- `Facedata/`、`traindata/`：人脸样本与模型存储。

### 1.4 道路病害检测（YOLO）

- **模型文件**：`RDD_yolo11/best.pt`
- **推理脚本**：`RDD_yolo11/` 目录下
- **集成方式**：通过API上传图片，后端调用YOLO模型进行推理，返回病害类型、位置、置信度等。

---

## 2. 主要API与代码块详解

### 2.1 时空分析API（`app/api/analysis/spatiotemporal/route.ts`）

```ts
export async function GET(request: NextRequest) {
  // 1. 解析前端传递的 timeRange, layer, current_time 参数
  // 2. 构建Django后端API URL，转发请求
  // 3. 返回Django后端分析结果
}
```
- **用途**：前端地图分析时调用，获取热力图、轨迹等数据。
- **参数**：
  - `timeRange`：时间范围（如 today/week/month）
  - `layer`：图层类型（如 vehicle_heatmap/trajectory/damage）
  - `current_time`：当前时间点（用于时间轴）
- **返回**：分析数据（点、轨迹、统计等）

### 2.2 道路病害API（`app/api/report/damage/route.ts`）

```ts
export async function GET(request: NextRequest) {
  // 1. 支持分页、类型筛选、关键词搜索
  // 2. 查询MySQL表 damage_reports，返回病害点、类型、图片、置信度、时间、地址等
  // 3. 支持高德地图逆地理编码获取详细地址
}
export async function POST(request: NextRequest) {
  // 1. 支持上传病害检测结果（图片、坐标、类型、置信度等）
  // 2. 自动写入数据库
}
```
- **用途**：前端病害上报、地图弹窗、病害详情等。
- **返回**：病害点列表、详情、图片、类型统计等。

### 2.3 用户登录API（`app/api/user/login/route.ts`）

```ts
export async function POST(request: NextRequest) {
  // 1. 校验用户名和密码
  // 2. 调用 UserService.loginService 验证
  // 3. 登录成功生成JWT token
}
```
- **用途**：账号密码登录
- **返回**：用户信息、token

### 2.4 用户注册API（`app/api/user/register/route.ts`）

```ts
export async function POST(request: NextRequest) {
  // 1. 校验用户名和密码
  // 2. 调用 UserService.registService 注册
  // 3. 返回注册结果
}
```

### 2.5 验证码登录/发送API（`app/api/auth/loginByCode/route.ts`, `app/api/auth/sendCode/route.ts`）

```ts
export async function POST(request: NextRequest) {
  // loginByCode: 校验邮箱和验证码，自动注册或登录
  // sendCode: 生成验证码，发送邮件
}
```

### 2.6 人脸识别相关API（前端调用Python服务）

- **注册会话**（`app/api/face/start_registration/route.ts`）
- **采集图片**（`app/api/face/collect_image/route.ts`）
- **训练模型**（`app/api/face/train_session/route.ts`）
- **识别**（`app/api/face/recognize/route.ts`）

```ts
// 以注册为例
export async function POST(request: NextRequest) {
  // 1. 获取用户名
  // 2. 调用Python脚本，启动人脸录入会话
  // 3. 返回会话ID
}
```
- **采集图片/训练/识别**同理，均通过Node.js `child_process.spawn` 调用Python脚本，传递参数，获取结果。

### 2.7 人脸识别服务（`face-recognition-cv2-master/face_api.py`）

- **/start_registration**：POST，参数`username`，返回`session_id`
- **/collect_image**：POST，参数`session_id`、`image`（base64），返回进度、验证状态
- **/train_session**：POST，参数`session_id`，训练模型
- **/recognize**：POST，参数`image`（base64），返回识别结果、置信度、用户名

**核心代码块示例**：

```python
@app.route('/start_registration', methods=['POST'])
def start_registration():
    # 1. 检查系统锁
    # 2. 创建录入会话，分配user_id
    # 3. 创建数据目录
    # 4. 返回session_id
```

```python
@app.route('/collect_image', methods=['POST'])
def collect_image():
    # 1. 检查会话ID和图像
    # 2. OpenCV检测人脸，灰度化
    # 3. 眨眼验证、重复检测
    # 4. 保存样本，返回进度
```

```python
@app.route('/recognize', methods=['POST'])
def recognize_face():
    # 1. 检查系统锁
    # 2. base64转图片，灰度化
    # 3. 检测人脸，遍历所有模型
    # 4. 返回最佳匹配用户和置信度
```

---

## 3. 安装与部署

### 3.1 环境准备

- Python 3.8+
- Node.js 16+
- MySQL 5.7+（如需使用MySQL）
- 推荐操作系统：Windows 10/11 或 Linux

### 3.2 一键安装与启动

推荐使用集成脚本 `start.py`，自动检查依赖、安装并启动所有服务：

```bash
python start.py
```

脚本会自动完成：
- 检查并安装 Python、Node.js 依赖
- 创建 Python 虚拟环境
- 安装 Django、Flask、OpenCV、YOLO 等依赖
- 安装前端依赖
- 启动 Django 后端、Flask 人脸识别服务、Next.js 前端

### 3.3 手动安装（可选）

#### 后端依赖

```bash
cd django_taxi_analysis
python -m venv ../.venv
../.venv/Scripts/activate  # Windows
# 或 source ../.venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

#### 前端依赖

```bash
npm install
```

#### 人脸识别服务依赖

```bash
cd face-recognition-cv2-master
pip install flask flask-cors opencv-python opencv-contrib-python pillow mysql-connector-python
```

### 3.4 启动服务

- **Django 后端**：
  ```bash
  cd django_taxi_analysis
  python manage.py runserver
  ```
- **人脸识别服务**：
  ```bash
  cd face-recognition-cv2-master
  python face_api.py
  ```
- **前端**：
  ```bash
  npm run dev
  ```

---

## 4. 配置说明

- **数据库**：默认支持 SQLite（见 `django_taxi_analysis/taxi_heatmap/settings_sqlite.py`），如需切换 MySQL，请修改 Django 配置。
- **高德地图 API Key**：已内置测试 Key，如需更高配额请在 `components/map-analysis-module.tsx` 替换为你的 Key。
- **人脸识别数据库**：`face-recognition-cv2-master/config.txt` 自动生成，无需手动修改。
- **YOLO模型**：`RDD_yolo11/best.pt` 为道路病害检测模型，推理脚本见同目录。

---

## 5. 常见问题

- **依赖安装失败**：请确保 Python/Node.js 版本符合要求，网络畅通，必要时使用国内镜像源。
- **端口冲突**：默认端口 Django 8000，Flask 5000，Next.js 3000，可在各自配置中修改。
- **摄像头不可用**：请检查设备权限与驱动，或更换浏览器。
- **人脸识别失败**：请保证光线充足、正对摄像头，录入时完成眨眼验证。

---

## 6. 贡献与许可

欢迎提交 Issue 和 PR 参与改进。  
本项目仅供学习与科研使用，禁止用于商业用途。

---

如需更详细的接口文档、部署说明或遇到特殊问题，请补充说明，我可为你进一步完善 README 或提供单独的开发/运维文档。 