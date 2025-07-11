import mysql from 'mysql2/promise';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

// 数据库配置
const dbConfig: DatabaseConfig = {
  host: process.env.DB_HOST || '111.161.121.11',
  port: parseInt(process.env.DB_PORT || '47420'),
  database: process.env.DB_NAME || 'tm',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '239108'
};

// 创建数据库连接池 - 优化配置
export const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 150,     // 连接数上限
  queueLimit: 0,            // 设置队列限制，避免无限等待
  connectTimeout: 60000,      // 连接超时时间：60秒
  charset: 'utf8mb4',         // 字符集
  multipleStatements: false,  // 禁用多语句查询，提高安全性
  dateStrings: true,          // 日期作为字符串返回
  debug: false,               // 生产环境关闭调试
  trace: false                // 关闭跟踪
});

// 测试数据库连接
export async function testConnection(): Promise<void> {
  try {
    const connection = await pool.getConnection();
    console.log('数据库连接成功');
    connection.release();
  } catch (error) {
    console.error('数据库连接失败:', error);
    throw error;
  }
}

// 获取连接池状态
export function getPoolStatus() {
  return {
    threadId: pool.threadId,
    connectionLimit: pool.config.connectionLimit,
    queueLimit: pool.config.queueLimit,
    // 注意：mysql2的pool对象没有直接的统计信息方法
    // 这些信息需要通过其他方式获取
  };
}

// 连接池健康检查
export async function checkPoolHealth(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT 1 as health_check');
    connection.release();
    return true;
  } catch (error) {
    console.error('连接池健康检查失败:', error);
    return false;
  }
}

// 优雅关闭连接池
export async function closePool(): Promise<void> {
  try {
    await pool.end();
    console.log('数据库连接池已关闭');
  } catch (error) {
    console.error('关闭连接池时发生错误:', error);
  }
} 