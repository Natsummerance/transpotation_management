# 路面病害检测API修复总结

## 问题分析

错误信息：`获取检测历史失败: 500 - {"error":"数据库查询参数错误","details":"SQL预处理语句参数类型或数量不匹配，请检查查询参数"}`

### 根本原因
1. **数据库表不存在**：`damage_reports`表可能不存在于数据库中
2. **SQL参数化查询问题**：在`JSON_EXTRACT`函数中使用参数化查询时出现类型不匹配
3. **参数数量不匹配**：SQL语句中的占位符数量与实际提供的参数数量不一致

## 修复方案

### 1. 创建数据库表
运行以下命令创建必要的数据库表：

```bash
npm run init-db
```

或者手动执行SQL脚本：

```sql
-- 创建路面病害检测报告表
CREATE TABLE IF NOT EXISTS `damage_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `location_lat` decimal(10,8) NOT NULL COMMENT '纬度',
  `location_lng` decimal(11,8) NOT NULL COMMENT '经度',
  `results` JSON NOT NULL COMMENT '检测结果JSON',
  `result_image` text COMMENT '结果图片路径',
  `timestamp` datetime NOT NULL COMMENT '检测时间',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_location` (`location_lat`, `location_lng`),
  KEY `idx_timestamp` (`timestamp`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='路面病害检测报告表';
```

### 2. API代码修复

#### 修复前的问题代码：
```typescript
// 问题：JSON_EXTRACT中的路径不能使用参数化查询
whereClause = `WHERE JSON_EXTRACT(results, '$.${type}.count') > 0`;
```

#### 修复后的代码：
```typescript
// 修复：添加注释说明，并确保type参数已经过验证
if (type && type !== 'all') {
  const validTypes = ['纵向裂缝', '横向裂缝', '龟裂', '坑洼'];
  if (validTypes.includes(type)) {
    // 注意：JSON_EXTRACT中的路径不能使用参数化查询，需要直接拼接
    // 但这里我们已经验证了type是安全的，所以可以安全使用
    whereClause = `WHERE JSON_EXTRACT(results, '$.${type}.count') > 0`;
  }
}
```

### 3. 错误处理优化

添加了更详细的错误处理和调试信息：

```typescript
// 添加表存在性检查
try {
  const [tableCheck] = await connection.execute('SHOW TABLES LIKE "damage_reports"');
  if ((tableCheck as any[]).length === 0) {
    throw new Error('damage_reports表不存在');
  }
} catch (tableError) {
  throw new Error(`数据库表检查失败: ${tableError}`);
}
```

### 4. 参数验证增强

```typescript
// 验证参数数量是否匹配
const placeholderCount = (dataQuery.match(/\?/g) || []).length;
if (allParams.length !== placeholderCount) {
  throw new Error(`参数数量不匹配: 期望 ${placeholderCount} 个参数，实际提供 ${allParams.length} 个参数`);
}

// 验证参数类型
console.log('参数类型检查:', allParams.map((param, index) => `${index}: ${typeof param} = ${param}`));
```

## 使用步骤

### 1. 初始化数据库
```bash
npm run init-db
```

### 2. 验证表创建
检查数据库中是否存在`damage_reports`表：
```sql
SHOW TABLES LIKE 'damage_reports';
```

### 3. 测试API
访问 `/api/report/damage` 端点测试功能是否正常。

## 测试数据

初始化脚本会自动插入一些测试数据：

```json
{
  "纵向裂缝": {"count": 2, "confidence": 0.85},
  "横向裂缝": {"count": 1, "confidence": 0.72},
  "龟裂": {"count": 0, "confidence": 0},
  "坑洼": {"count": 3, "confidence": 0.91}
}
```

## 注意事项

1. **数据库连接**：确保数据库连接配置正确
2. **权限检查**：确保数据库用户有创建表和插入数据的权限
3. **JSON字段**：MySQL版本需要支持JSON数据类型（5.7+）
4. **字符编码**：使用utf8mb4字符集以支持中文字符

## 故障排除

### 如果仍然出现参数错误：
1. 检查数据库表是否存在
2. 验证SQL语句语法
3. 确认参数类型和数量匹配
4. 查看服务器日志获取详细错误信息

### 如果表创建失败：
1. 检查数据库连接权限
2. 确认MySQL版本支持JSON字段
3. 验证数据库名称和用户权限 