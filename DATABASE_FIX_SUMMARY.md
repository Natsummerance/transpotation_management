# 数据库字段修复总结

## 问题分析

错误信息显示：`Field 'password_hash' doesn't have a default value`

这是因为：
1. 数据库表中有 `password_hash` 字段，但我们的代码只插入了 `password` 字段
2. 需要将密码哈希存储到 `password_hash` 字段中，而不是 `password` 字段

## 修复内容

### 1. 更新 User 接口
**修复前：**
```typescript
export interface User {
  uid: number;
  uname: string;
  password: string;
  email: string;
}
```

**修复后：**
```typescript
export interface User {
  uid: number;
  uname: string;
  password_hash: string;
  email: string;
}
```

### 2. 修复数据库插入语句
**修复前：**
```sql
INSERT INTO user (uname, password, email) VALUES (?, ?, ?)
```

**修复后：**
```sql
INSERT INTO user (uname, password_hash, email) VALUES (?, ?, ?)
```

### 3. 修复密码验证逻辑
**修复前：**
```typescript
const isPasswordValid = await bcrypt.compare(password, user.password);
```

**修复后：**
```typescript
const isPasswordValid = await bcrypt.compare(password, user.password_hash);
```

### 4. 修复用户注册逻辑
**修复前：**
```typescript
const user = await UserDao.create({
  ...newUser,
  password: hashedPassword
});
```

**修复后：**
```typescript
const user = await UserDao.create({
  uname: newUser.uname,
  email: newUser.email,
  password_hash: hashedPassword
});
```

## 数据库迁移

### 1. 运行迁移脚本
执行 `database-migration.sql` 中的 SQL 语句：

```sql
-- 1. 添加 password_hash 字段（如果不存在）
ALTER TABLE user ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- 2. 迁移现有数据
UPDATE user SET password_hash = password WHERE password_hash IS NULL OR password_hash = '';

-- 3. 设置字段为 NOT NULL
ALTER TABLE user MODIFY COLUMN password_hash VARCHAR(255) NOT NULL;
```

### 2. 测试数据库连接
运行测试脚本：
```bash
node test-database.js
```

## 修复后的功能

### ✅ 用户注册
- 密码会被 bcrypt 加密
- 加密后的密码存储到 `password_hash` 字段
- 不再存储明文密码

### ✅ 用户登录
- 从 `password_hash` 字段读取加密密码
- 使用 bcrypt.compare 验证密码
- 支持用户名和邮箱登录

### ✅ 密码更新
- 更新密码时自动加密
- 存储到 `password_hash` 字段
- 删除原始密码字段

## 安全改进

1. **密码加密**：所有密码都使用 bcrypt 加密存储
2. **字段分离**：明文密码和哈希密码分离存储
3. **数据清理**：可以安全删除 `password` 字段
4. **向后兼容**：支持现有数据的迁移

## 测试方法

1. **启动项目**：`npm run dev`
2. **测试注册**：访问注册页面，创建新用户
3. **测试登录**：使用新创建的用户登录
4. **检查数据库**：确认密码正确存储到 `password_hash` 字段

## 注意事项

1. 确保数据库迁移脚本已执行
2. 新用户注册时会自动使用正确的字段
3. 现有用户可能需要重新设置密码（如果密码字段为空）
4. 建议在生产环境中删除 `password` 字段以提高安全性 