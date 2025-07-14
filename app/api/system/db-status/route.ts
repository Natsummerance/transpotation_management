import { NextRequest, NextResponse } from 'next/server';
import { pool, checkPoolHealth } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // 检查连接池健康状态
    const isHealthy = await checkPoolHealth();
    
    // 获取当前连接数（通过查询系统表）
    let activeConnections = 0;
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM information_schema.PROCESSLIST 
        WHERE DB = ? AND COMMAND != 'Sleep'
      `, [process.env.DB_NAME || 'tm']);
      connection.release();
      activeConnections = (rows as any)[0]?.count || 0;
    } catch (error) {
      console.error('获取连接数失败:', error);
    }

    return NextResponse.json({
      success: true,
      data: {
        isHealthy,
        activeConnections,
        maxConnections: 5, // 连接池限制
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('数据库状态检查失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '数据库状态检查失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
} 