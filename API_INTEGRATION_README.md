# API 整合说明

## 概述
本项目已将 `newapi` 文件夹中的后端功能整合到 Next.js 的 API 路由中，现在可以通过 `npm run dev` 同时启动前端和后端服务。

## 整合的功能

### 认证相关 API
- `POST /api/auth/sendCode` - 发送邮箱验证码
- `POST /api/auth/loginByCode` - 邮箱验证码登录

### 用户相关 API
- `POST /api/user/login` - 用户名密码登录
- `POST /api/user/register` - 用户注册
- `GET /api/user/testMail` - 测试邮件发送
- `POST /api/user/login/face` - 人脸识别登录
- `GET /api/user/checkLoginStatus` - 检查登录状态
- `POST /api/user/logout` - 用户登出
- `GET /api/user/info` - 获取用户信息
- `PUT /api/user/info` - 更新用户信息

## 环境配置

在项目根目录创建 `.env.local` 文件：

```env
# 数据库配置
DB_HOST=111.161.121.11
DB_PORT=47420
DB_NAME=tm
DB_USER=root
DB_PASSWORD=239108

# 邮件配置
MAIL_HOST=smtp.qq.com
MAIL_PORT=465
MAIL_USER=your-email@qq.com
MAIL_PASS=your-email-password

# Session 配置
SESSION_SECRET=your-session-secret-here
```

## 安装依赖

运行以下命令安装新增的依赖：

```bash
npm install
```

## 运行项目

```bash
npm run dev
```

这将同时启动：
- Next.js 前端服务 (默认端口 3000)
- 所有 API 路由集成在 Next.js 中

## 数据库表结构

确保数据库中有 `user` 表，结构如下：

```sql
CREATE TABLE user (
  uid INT PRIMARY KEY AUTO_INCREMENT,
  uname VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE
);
```

## 文件结构

```
lib/
├── database.ts          # 数据库连接配置
├── emailCodeUtil.ts     # 邮箱验证码工具
├── emailService.ts      # 邮件服务
├── result.ts           # API 响应工具
├── userDao.ts          # 用户数据访问层
└── userService.ts      # 用户业务逻辑层

app/api/
├── auth/
│   ├── sendCode/
│   │   └── route.ts
│   └── loginByCode/
│       └── route.ts
└── user/
    ├── login/
    │   └── route.ts
    ├── register/
    │   └── route.ts
    └── ...
```

## 注意事项

1. 确保数据库连接正常
2. 邮件服务需要配置正确的 SMTP 信息
3. 验证码使用内存存储，重启服务后会丢失
4. 密码使用 bcrypt 加密存储
5. 人脸识别功能目前是模拟实现

## 测试 API

可以使用以下方式测试 API：

```bash
# 发送验证码
curl -X POST http://localhost:3000/api/auth/sendCode \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# 用户登录
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"uname":"test","password":"123456"}'
``` 