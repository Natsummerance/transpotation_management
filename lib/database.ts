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

// 创建数据库连接池
export const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
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