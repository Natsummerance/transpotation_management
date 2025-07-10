# API 接口修复总结

## 问题分析

您遇到的问题是前端代码中还在使用旧的API地址 `http://localhost:3010`，而我们已经将后端功能整合到 Next.js 的 API 路由中，应该使用 `http://localhost:3000`。

## 修复内容

### 1. 登录接口修复
**修复前：**
```javascript
const response = await fetch(`http://localhost:3010/user/login`, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: params.toString(),
});
```

**修复后：**
```javascript
const response = await fetch(`/api/user/login`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    uname: loginData.account,
    password: loginData.password
  }),
});
```

### 2. 注册接口修复
**修复前：**
```javascript
const response = await fetch("http://localhost:3010/user/register", {
```

**修复后：**
```javascript
const response = await fetch("/api/user/register", {
```

### 3. 人脸识别接口修复
**修复前：**
```javascript
const response = await fetch("http://localhost:3010/user/login/face", {
```

**修复后：**
```javascript
const response = await fetch("/api/user/login/face", {
```

### 4. 验证码功能实现
**新增功能：**
- 发送验证码：`/api/auth/sendCode`
- 验证码登录：`/api/auth/loginByCode`

## 当前可用的API接口

### 认证相关
- `POST /api/auth/sendCode` - 发送邮箱验证码
- `POST /api/auth/loginByCode` - 邮箱验证码登录

### 用户相关
- `POST /api/user/login` - 用户名密码登录
- `POST /api/user/register` - 用户注册
- `POST /api/user/login/face` - 人脸识别登录

## 测试方法

### 1. 启动项目
```bash
npm run dev
```

### 2. 访问测试页面
打开浏览器访问：`http://localhost:3000/api-test`

### 3. 使用浏览器控制台测试
在浏览器控制台中运行：
```javascript
// 测试登录
testLogin();

// 测试发送验证码
testSendCode();
```

### 4. 使用 Postman 或 ApiPost 测试
- 登录接口：`POST http://localhost:3000/api/user/login`
- 注册接口：`POST http://localhost:3000/api/user/register`
- 发送验证码：`POST http://localhost:3000/api/auth/sendCode`

## 环境配置

确保在项目根目录创建 `.env.local` 文件：

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

## 注意事项

1. **端口变化**：从 `3010` 改为 `3000`
2. **路径变化**：从 `/user/login` 改为 `/api/user/login`
3. **请求格式**：从 `application/x-www-form-urlencoded` 改为 `application/json`
4. **数据格式**：从 URL 参数改为 JSON 格式

## 下一步

1. 确保数据库连接正常
2. 配置正确的邮件服务信息
3. 测试所有API功能
4. 完善错误处理和用户体验 