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
  connectionLimit: 5,         // 进一步减少连接数上限
  queueLimit: 3,              // 减少队列限制
  connectTimeout: 20000,      // 连接超时时间：20秒
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

// 创建face_store表（如果不存在）
export async function createFaceStoreTable(): Promise<void> {
  try {
    const connection = await pool.getConnection();
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS face_store (
        id INT AUTO_INCREMENT PRIMARY KEY,
        face_image_path VARCHAR(500) NOT NULL COMMENT '人脸图片保存路径',
        ip_address VARCHAR(45) COMMENT 登录者IP地址,
        location_info VARCHAR(200COMMENT登录位置信息',
        user_agent TEXT COMMENT用户代理信息        confidence_score DECIMAL(5,2) COMMENT '识别置信度',
        recognition_status ENUM(unknown', failed', success') DEFAULTunknown COMMENT '识别状态,        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间,        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_created_at (created_at),
        INDEX idx_recognition_status (recognition_status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='未识别人脸存储表; `;
    
    await connection.execute(createTableSQL);
    console.log('face_store表创建成功或已存在');
    connection.release();
  } catch (error) {
    console.error('创建face_store表失败:', error);
    throw error;
  }
}

// 初始化数据库表
export async function initializeDatabase(): Promise<void> {
  try {
    await testConnection();
    await createFaceStoreTable();
    console.log('数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

// 在模块加载时自动初始化数据库
initializeDatabase().catch(console.error);

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

// 强制关闭所有连接（用于紧急情况）
export async function forceClosePool(): Promise<void> {
  try {
    await pool.end();
    console.log('强制关闭数据库连接池');
  } catch (error) {
    console.error('强制关闭连接池时发生错误:', error);
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